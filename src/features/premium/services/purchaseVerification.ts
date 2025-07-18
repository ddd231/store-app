import { supabase } from '../../../shared';

export interface PurchaseVerificationRequest {
  purchaseToken: string;
  productId: string;
  userId: string;
  packageName?: string;
}

export interface PurchaseVerificationResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    productId: string;
    orderId: string;
    purchaseTime: string;
    expirationTime: string;
    isPremium: boolean;
  };
  error?: string;
  details?: string;
}

/**
 * Google Play 구매를 서버에서 검증하고 사용자 프리미엄 상태를 업데이트합니다.
 * 
 * @param purchaseToken - Google Play에서 받은 구매 토큰
 * @param productId - 구독 상품 ID (예: 'expertaccount')
 * @param userId - 사용자 UUID
 * @param packageName - 앱 패키지명 (기본값: 'com.arld.app')
 * @returns 검증 결과
 */
export async function verifyPurchase(
  purchaseToken: string,
  productId: string,
  userId: string,
  packageName: string = 'com.arld.app'
): Promise<PurchaseVerificationResponse> {
  try {
    if (!purchaseToken || !productId || !userId) {
      return {
        success: false,
        message: 'Missing required parameters',
        error: 'purchaseToken, productId, and userId are required',
      };
    }

    console.log(`Verifying purchase for user: ${userId}, product: ${productId}`);

    const { data, error } = await supabase.functions.invoke('purchase-verification', {
      body: {
        purchaseToken,
        productId,
        userId,
        packageName,
      },
    });

    if (error) {
      console.error('Purchase verification failed:', error);
      return {
        success: false,
        message: 'Purchase verification failed',
        error: error.message || 'Unknown error',
        details: error.details || JSON.stringify(error),
      };
    }

    if (data && data.success) {
      console.log('Purchase verified successfully:', data);
      return data as PurchaseVerificationResponse;
    } else {
      console.error('Purchase verification returned error:', data);
      return {
        success: false,
        message: 'Purchase verification failed',
        error: data?.error || 'Verification failed',
        details: data?.details || JSON.stringify(data),
      };
    }
  } catch (error) {
    console.error('Purchase verification error:', error);
    return {
      success: false,
      message: 'Purchase verification error',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: String(error),
    };
  }
}

/**
 * 사용자의 현재 프리미엄 상태를 확인합니다.
 * 
 * @param userId - 사용자 UUID
 * @returns 프리미엄 상태 정보
 */
export async function checkPremiumStatus(userId: string): Promise<{
  isPremium: boolean;
  expiresAt: string | null;
  isExpired: boolean;
}> {
  try {
    if (!userId) {
      return { isPremium: false, expiresAt: null, isExpired: true };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_premium, premium_expires_at')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Failed to check premium status:', error);
      return { isPremium: false, expiresAt: null, isExpired: true };
    }

    const now = new Date();
    const expiresAt = data.premium_expires_at ? new Date(data.premium_expires_at) : null;
    const isExpired = expiresAt ? now > expiresAt : true;

    return {
      isPremium: data.is_premium && !isExpired,
      expiresAt: data.premium_expires_at,
      isExpired,
    };
  } catch (error) {
    console.error('Error checking premium status:', error);
    return { isPremium: false, expiresAt: null, isExpired: true };
  }
}

/**
 * 사용자의 구매 내역을 조회합니다.
 * 
 * @param userId - 사용자 UUID
 * @param limit - 조회할 최대 개수 (기본값: 10)
 * @returns 구매 내역 목록
 */
export async function getPurchaseHistory(userId: string, limit: number = 10): Promise<{
  success: boolean;
  data: any[];
  error?: string;
}> {
  try {
    if (!userId) {
      return { success: false, data: [], error: 'User ID is required' };
    }

    const { data, error } = await supabase
      .from('purchase_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get purchase history:', error);
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting purchase history:', error);
    return { 
      success: false, 
      data: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * React Native IAP와 함께 사용할 수 있는 통합 구독 처리 함수
 * 
 * @param purchase - react-native-iap의 Purchase 객체
 * @param userId - 사용자 UUID
 * @returns 처리 결과
 */
export async function handleSubscriptionPurchase(
  purchase: any, // react-native-iap Purchase type
  userId: string
): Promise<{
  success: boolean;
  message: string;
  shouldFinalizePurchase: boolean;
  error?: string;
}> {
  try {
    if (!purchase || !userId) {
      return {
        success: false,
        message: 'Invalid purchase or user ID',
        shouldFinalizePurchase: false,
        error: 'Missing required parameters',
      };
    }

    console.log('Processing subscription purchase:', {
      productId: purchase.productId,
      transactionId: purchase.transactionId,
      purchaseToken: purchase.purchaseToken,
    });

    // 서버에서 구매 검증
    const verificationResult = await verifyPurchase(
      purchase.purchaseToken,
      purchase.productId,
      userId
    );

    if (verificationResult.success) {
      console.log('Subscription purchase verified successfully');
      return {
        success: true,
        message: 'Subscription activated successfully',
        shouldFinalizePurchase: true,
      };
    } else {
      console.error('Subscription verification failed:', verificationResult.error);
      return {
        success: false,
        message: 'Subscription verification failed',
        shouldFinalizePurchase: false,
        error: verificationResult.error,
      };
    }
  } catch (error) {
    console.error('Error handling subscription purchase:', error);
    return {
      success: false,
      message: 'Error processing subscription',
      shouldFinalizePurchase: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}