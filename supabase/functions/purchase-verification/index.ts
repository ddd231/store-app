import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

interface PurchaseVerificationRequest {
  purchaseToken: string;
  productId: string;
  userId: string;
  packageName?: string;
}

interface GooglePlayVerificationResponse {
  purchaseTimeMillis: string;
  purchaseState: number;
  consumptionState: number;
  developerPayload: string;
  orderId: string;
  purchaseType: number;
  acknowledgementState: number;
  kind: string;
  regionCode: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const requestBody: PurchaseVerificationRequest = await req.json();
    const { purchaseToken, productId, userId, packageName = 'com.arld.app' } = requestBody;

    // Validate required fields
    if (!purchaseToken || !productId || !userId) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: purchaseToken, productId, userId' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Starting purchase verification for user: ${userId}, product: ${productId}`);

    // Get Google Play Console service account credentials from environment
    const googleServiceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const googlePrivateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');
    const googlePlayConsoleAccessToken = Deno.env.get('GOOGLE_PLAY_ACCESS_TOKEN');

    if (!googleServiceAccountEmail || !googlePrivateKey) {
      console.error('Missing Google service account credentials');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get OAuth 2.0 access token for Google Play Developer API
    let accessToken = googlePlayConsoleAccessToken;
    
    if (!accessToken) {
      try {
        accessToken = await getGooglePlayAccessToken(googleServiceAccountEmail, googlePrivateKey);
      } catch (error) {
        console.error('Failed to get Google Play access token:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to authenticate with Google Play' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Verify purchase with Google Play Developer API
    const verificationUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;
    
    const verificationResponse = await fetch(verificationUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!verificationResponse.ok) {
      const errorText = await verificationResponse.text();
      console.error('Google Play verification failed:', verificationResponse.status, errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Purchase verification failed',
          details: `Google Play API returned ${verificationResponse.status}`
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const verificationData: GooglePlayVerificationResponse = await verificationResponse.json();
    console.log('Purchase verification successful:', verificationData);

    // Check if purchase is valid (purchased and not cancelled)
    const isPurchaseValid = verificationData.purchaseState === 0; // 0 = Purchased, 1 = Cancelled
    const isAcknowledged = verificationData.acknowledgementState === 1; // 1 = Acknowledged

    if (!isPurchaseValid) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid purchase state',
          purchaseState: verificationData.purchaseState
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate premium expiration date (assuming monthly subscription)
    const purchaseTimeMs = parseInt(verificationData.purchaseTimeMillis);
    const purchaseDate = new Date(purchaseTimeMs);
    const expirationDate = new Date(purchaseDate);
    expirationDate.setMonth(expirationDate.getMonth() + 1); // Add 1 month

    // Update user premium status in database
    const { data, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        is_premium: true,
        premium_expires_at: expirationDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select();

    if (updateError) {
      console.error('Failed to update user premium status:', updateError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update user premium status',
          details: updateError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log the successful purchase for record keeping
    const { error: logError } = await supabase
      .from('purchase_logs')
      .insert({
        user_id: userId,
        product_id: productId,
        purchase_token: purchaseToken,
        order_id: verificationData.orderId,
        purchase_time: purchaseDate.toISOString(),
        expiration_time: expirationDate.toISOString(),
        verification_data: verificationData,
        created_at: new Date().toISOString(),
      });

    if (logError) {
      console.warn('Failed to log purchase (non-critical):', logError);
    }

    console.log(`Successfully updated premium status for user: ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Purchase verified and premium status updated',
        data: {
          userId,
          productId,
          orderId: verificationData.orderId,
          purchaseTime: purchaseDate.toISOString(),
          expirationTime: expirationDate.toISOString(),
          isPremium: true,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Purchase verification error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function getGooglePlayAccessToken(serviceAccountEmail: string, privateKey: string): Promise<string> {
  try {
    // JWT Header
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: undefined, // Optional: Add key ID if available
    };

    // JWT Payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600, // 1 hour expiration
      iat: now,
      sub: serviceAccountEmail, // Subject (optional but recommended)
    };

    // Base64URL encode header and payload
    const encodedHeader = base64URLEncode(JSON.stringify(header));
    const encodedPayload = base64URLEncode(JSON.stringify(payload));
    const message = `${encodedHeader}.${encodedPayload}`;

    // Process private key
    let keyData = privateKey;
    
    // Handle different private key formats
    if (keyData.includes('\\n')) {
      keyData = keyData.replace(/\\n/g, '\n');
    }
    
    // Ensure proper PEM format
    if (!keyData.includes('-----BEGIN PRIVATE KEY-----')) {
      keyData = `-----BEGIN PRIVATE KEY-----\n${keyData}\n-----END PRIVATE KEY-----`;
    }

    // Convert PEM to ArrayBuffer for Web Crypto API
    const pemContents = keyData
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    
    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    // Import the private key
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    // Sign the message
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(message)
    );

    // Base64URL encode signature
    const encodedSignature = base64URLEncode(signature);
    const jwt = `${message}.${encodedSignature}`;

    console.log('JWT token created successfully');

    // Exchange JWT for OAuth 2.0 access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`OAuth token exchange failed: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('No access token in response');
    }

    console.log('OAuth access token obtained successfully');
    return tokenData.access_token;

  } catch (error) {
    console.error('Error in getGooglePlayAccessToken:', error);
    throw new Error(`Failed to get Google Play access token: ${error.message}`);
  }
}

// Helper function for Base64URL encoding
function base64URLEncode(data: string | ArrayBuffer): string {
  let base64: string;
  
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    // ArrayBuffer case
    const bytes = new Uint8Array(data);
    base64 = btoa(String.fromCharCode(...bytes));
  }
  
  // Convert Base64 to Base64URL
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}