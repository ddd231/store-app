import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { create } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { encode as base64encode } from "https://deno.land/std@0.177.0/encoding/base64.ts";

interface PurchaseVerificationRequest {
  purchaseToken: string;
  productId: string;
  userId: string;
  packageName?: string;
}

interface GooglePlaySubscriptionResponse {
  kind: string;
  startTimeMillis: string;
  expiryTimeMillis: string;
  autoRenewing: boolean;
  priceCurrencyCode: string;
  priceAmountMicros: string;
  introductoryPriceInfo?: {
    introductoryPriceCurrencyCode: string;
    introductoryPriceAmountMicros: string;
    introductoryPricePeriod: string;
    introductoryPriceCycles: string;
  };
  countryCode: string;
  developerPayload: string;
  paymentState: number;
  cancelReason?: number;
  userCancellationTimeMillis?: string;
  cancelSurveyResult?: {
    cancelSurveyReason: number;
    userInputCancelReason: string;
  };
  orderId: string;
  linkedPurchaseToken?: string;
  purchaseType: number;
  priceChange?: {
    newPrice: {
      priceMicros: string;
      currency: string;
    };
    state: number;
  };
  profileName?: string;
  emailAddress?: string;
  givenName?: string;
  familyName?: string;
  profileId?: string;
  acknowledgementState: number;
  externalAccountId?: string;
  promotionType?: number;
  promotionCode?: string;
  obfuscatedExternalAccountId?: string;
  obfuscatedExternalProfileId?: string;
}

interface GooglePlayProductResponse {
  kind: string;
  purchaseTimeMillis: string;
  purchaseState: number;
  consumptionState: number;
  developerPayload: string;
  orderId: string;
  purchaseType: number;
  acknowledgementState: number;
  purchaseToken: string;
  productId: string;
  quantity: number;
  obfuscatedExternalAccountId?: string;
  obfuscatedExternalProfileId?: string;
  regionCode: string;
}

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// JWT 토큰 생성 함수
async function createJWT(serviceAccountEmail: string, privateKey: string): Promise<string> {
  // Private key 포맷 정리
  const cleanPrivateKey = privateKey
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  // Base64 디코딩
  const keyData = base64encode(cleanPrivateKey);
  
  // CryptoKey 생성
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    new Uint8Array(atob(cleanPrivateKey).split('').map(c => c.charCodeAt(0))),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccountEmail,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  return await create(header, payload, cryptoKey);
}

// OAuth 토큰 획득 함수
async function getAccessToken(serviceAccountEmail: string, privateKey: string): Promise<string> {
  try {
    const jwt = await createJWT(serviceAccountEmail, privateKey);
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token request failed:', errorText);
      throw new Error(`OAuth token request failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Access token error:', error);
    throw new Error(`Failed to get access token: ${error.message}`);
  }
}

// Google Play API 구독 검증
async function verifySubscription(
  packageName: string, 
  subscriptionId: string, 
  purchaseToken: string, 
  accessToken: string
): Promise<GooglePlaySubscriptionResponse> {
  const apiUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${subscriptionId}/tokens/${purchaseToken}`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Play API error:', errorText);
    throw new Error(`Google Play API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Google Play API 제품 검증
async function verifyProduct(
  packageName: string, 
  productId: string, 
  purchaseToken: string, 
  accessToken: string
): Promise<GooglePlayProductResponse> {
  const apiUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${productId}/tokens/${purchaseToken}`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Play API error:', errorText);
    throw new Error(`Google Play API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// 구매 승인 처리
async function acknowledgePurchase(
  packageName: string, 
  productId: string, 
  purchaseToken: string, 
  accessToken: string,
  isSubscription: boolean = false
): Promise<void> {
  const baseUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases`;
  const endpoint = isSubscription 
    ? `${baseUrl}/subscriptions/${productId}/tokens/${purchaseToken}:acknowledge`
    : `${baseUrl}/products/${productId}/tokens/${purchaseToken}:acknowledge`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Acknowledge error:', errorText);
    throw new Error(`Acknowledge failed: ${response.status} - ${errorText}`);
  }
}

// 구독 만료일 계산
function calculateSubscriptionExpiry(productId: string): Date {
  const now = new Date();
  
  // 제품별 구독 기간 설정
  switch (productId) {
    case 'expertaccount':
    case 'premium_monthly':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일
    case 'premium_yearly':
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 365일
    default:
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 기본 30일
  }
}

serve(async (req) => {
  // CORS preflight 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Supabase 클라이언트 초기화
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 요청 본문 파싱
    const body: PurchaseVerificationRequest = await req.json();
    const { purchaseToken, productId, userId, packageName = 'com.anonymous.portfoliochatapp' } = body;

    console.log('=== Google Play 구매 검증 시작 ===');
    console.log('Product ID:', productId);
    console.log('User ID:', userId);
    console.log('Package Name:', packageName);
    console.log('Purchase Token (첫 20자):', purchaseToken?.substring(0, 20) + '...');

    // 필수 파라미터 검증
    if (!purchaseToken || !productId || !userId) {
      console.error('필수 파라미터 누락');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 중복 구매 토큰 확인
    const { data: existingPurchase } = await supabase
      .from('purchase_logs')
      .select('*')
      .eq('purchase_token', purchaseToken)
      .eq('verification_status', 'verified')
      .single();

    if (existingPurchase) {
      console.log('이미 검증된 구매 토큰');
      return new Response(
        JSON.stringify({ 
          success: true, 
          verified: true,
          message: 'Purchase already verified',
          existingPurchase: true 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Google Service Account 환경 변수 확인
    const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY');

    if (!serviceAccountEmail || !privateKey) {
      console.error('Google Service Account 인증 정보 누락');
      
      // 실패 로그 기록
      await supabase
        .from('purchase_logs')
        .insert({
          user_id: userId,
          product_id: productId,
          purchase_token: purchaseToken,
          verification_status: 'failed_no_credentials',
          verification_data: { error: 'Google Service Account credentials not configured' },
          created_at: new Date().toISOString()
        });

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error - Google credentials missing',
          verified: false
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Google Play Developer API 검증 실행
    try {
      console.log('OAuth 토큰 획득 중...');
      const accessToken = await getAccessToken(serviceAccountEmail, privateKey);
      console.log('OAuth 토큰 획득 성공');

      // 구독 여부 판단 (expertaccount, premium_monthly, premium_yearly는 구독)
      const isSubscription = ['expertaccount', 'premium_monthly', 'premium_yearly'].includes(productId);
      
      let verificationResult: GooglePlaySubscriptionResponse | GooglePlayProductResponse;
      let isValid = false;
      let expiryTime: Date | null = null;

      if (isSubscription) {
        console.log('구독 상품 검증 중...');
        verificationResult = await verifySubscription(packageName, productId, purchaseToken, accessToken);
        
        // 구독 상태 검증
        const subscriptionResult = verificationResult as GooglePlaySubscriptionResponse;
        isValid = subscriptionResult.paymentState === 1; // 1 = Payment received
        
        if (isValid && subscriptionResult.expiryTimeMillis) {
          expiryTime = new Date(parseInt(subscriptionResult.expiryTimeMillis));
        } else {
          expiryTime = calculateSubscriptionExpiry(productId);
        }
      } else {
        console.log('일회성 제품 검증 중...');
        verificationResult = await verifyProduct(packageName, productId, purchaseToken, accessToken);
        
        // 제품 상태 검증
        const productResult = verificationResult as GooglePlayProductResponse;
        isValid = productResult.purchaseState === 1; // 1 = Purchased
        expiryTime = calculateSubscriptionExpiry(productId); // 일회성도 기간 설정
      }

      console.log('구매 검증 결과:', isValid ? '성공' : '실패');

      // 구매 승인 처리 (acknowledgementState가 0인 경우)
      if (isValid && verificationResult.acknowledgementState === 0) {
        console.log('구매 승인 처리 중...');
        try {
          await acknowledgePurchase(packageName, productId, purchaseToken, accessToken, isSubscription);
          console.log('구매 승인 완료');
        } catch (ackError) {
          console.warn('구매 승인 실패 (계속 진행):', ackError.message);
        }
      }

      const now = new Date();

      if (isValid) {
        console.log('프리미엄 상태 업데이트 중...');
        
        // user_profiles 테이블 업데이트
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            is_premium: true,
            premium_expires_at: expiryTime?.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.error('프리미엄 상태 업데이트 실패:', updateError);
        } else {
          console.log('프리미엄 상태 업데이트 성공');
        }

        // 성공 로그 기록
        const { error: logError } = await supabase
          .from('purchase_logs')
          .insert({
            user_id: userId,
            product_id: productId,
            purchase_token: purchaseToken,
            verification_status: 'verified',
            verification_data: verificationResult,
            purchase_time: isSubscription 
              ? new Date(parseInt((verificationResult as GooglePlaySubscriptionResponse).startTimeMillis))
              : new Date(parseInt((verificationResult as GooglePlayProductResponse).purchaseTimeMillis)),
            expiration_time: expiryTime,
            created_at: now.toISOString()
          });

        if (logError) {
          console.warn('구매 로그 기록 실패:', logError);
        }
      } else {
        console.log('구매 검증 실패 - 로그 기록');
        
        // 실패 로그 기록
        await supabase
          .from('purchase_logs')
          .insert({
            user_id: userId,
            product_id: productId,
            purchase_token: purchaseToken,
            verification_status: 'failed_invalid',
            verification_data: verificationResult,
            created_at: now.toISOString()
          });
      }

      console.log('=== Google Play 구매 검증 완료 ===');

      return new Response(
        JSON.stringify({ 
          success: isValid, 
          verified: isValid,
          expiryTime: expiryTime?.toISOString(),
          subscriptionType: isSubscription ? 'subscription' : 'product',
          googleResponse: verificationResult,
          acknowledgementState: verificationResult.acknowledgementState
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (googleError) {
      console.error('Google API 검증 실패:', googleError);
      
      // Google API 실패 로그 기록
      await supabase
        .from('purchase_logs')
        .insert({
          user_id: userId,
          product_id: productId,
          purchase_token: purchaseToken,
          verification_status: 'failed_api_error',
          verification_data: { error: googleError.message },
          created_at: new Date().toISOString()
        });

      return new Response(
        JSON.stringify({ 
          success: false, 
          verified: false,
          error: 'Google Play verification failed',
          details: googleError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('구매 검증 전체 오류:', error);
    return new Response(
      JSON.stringify({ success: false, verified: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});