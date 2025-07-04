import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

interface SubscriptionStatusRequest {
  userId?: string;
  action: 'check_expiry' | 'renew_subscription' | 'cancel_subscription' | 'get_status';
  productId?: string;
}

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// 만료된 구독 확인 및 비활성화
async function checkAndUpdateExpiredSubscriptions(supabase: any) {
  try {
    console.log('만료된 구독 확인 시작...');
    
    // 만료된 구독 찾기
    const { data: expiredUsers, error: selectError } = await supabase
      .from('user_profiles')
      .select('id, username, premium_expires_at')
      .eq('is_premium', true)
      .lt('premium_expires_at', new Date().toISOString());

    if (selectError) {
      console.error('만료된 구독 조회 실패:', selectError);
      return { success: false, error: selectError.message };
    }

    if (expiredUsers && expiredUsers.length > 0) {
      console.log(`${expiredUsers.length}명의 만료된 구독 발견`);

      // 만료된 사용자들의 프리미엄 상태 비활성화
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          is_premium: false,
          updated_at: new Date().toISOString()
        })
        .in('id', expiredUsers.map(u => u.id));

      if (updateError) {
        console.error('프리미엄 상태 업데이트 실패:', updateError);
        return { success: false, error: updateError.message };
      }

      // 구매 로그도 비활성화
      const { error: logUpdateError } = await supabase
        .from('purchase_logs')
        .update({ 
          is_active: false,
          verification_status: 'expired',
          updated_at: new Date().toISOString()
        })
        .in('user_id', expiredUsers.map(u => u.id))
        .eq('is_active', true);

      if (logUpdateError) {
        console.warn('구매 로그 업데이트 실패:', logUpdateError);
      }

      console.log(`${expiredUsers.length}명의 프리미엄 구독 만료 처리 완료`);
      
      return {
        success: true,
        expiredCount: expiredUsers.length,
        expiredUsers: expiredUsers.map(u => ({ id: u.id, username: u.username }))
      };
    } else {
      console.log('만료된 구독 없음');
      return { success: true, expiredCount: 0 };
    }
  } catch (error) {
    console.error('구독 만료 확인 오류:', error);
    return { success: false, error: error.message };
  }
}

// 사용자 구독 상태 조회
async function getUserSubscriptionStatus(supabase: any, userId: string) {
  try {
    // 사용자 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, username, is_premium, premium_expires_at')
      .eq('id', userId)
      .single();

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    // 활성 구매 로그 조회
    const { data: activePurchases, error: purchaseError } = await supabase
      .from('purchase_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('verification_status', 'verified')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (purchaseError) {
      console.warn('구매 로그 조회 실패:', purchaseError);
    }

    const now = new Date();
    const expiryDate = profile.premium_expires_at ? new Date(profile.premium_expires_at) : null;
    const daysRemaining = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

    return {
      success: true,
      user: {
        id: profile.id,
        username: profile.username,
        isPremium: profile.is_premium,
        expiryDate: profile.premium_expires_at,
        daysRemaining: daysRemaining,
        isExpired: expiryDate ? expiryDate < now : false
      },
      activePurchases: activePurchases || []
    };
  } catch (error) {
    console.error('사용자 구독 상태 조회 오류:', error);
    return { success: false, error: error.message };
  }
}

// 구독 갱신 처리
async function renewSubscription(supabase: any, userId: string, productId: string) {
  try {
    console.log(`구독 갱신 처리: 사용자 ${userId}, 상품 ${productId}`);

    // 새로운 만료일 계산
    const now = new Date();
    let newExpiryDate: Date;

    switch (productId) {
      case 'expertaccount':
      case 'premium_monthly':
        newExpiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30일
        break;
      case 'premium_yearly':
        newExpiryDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 365일
        break;
      default:
        newExpiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 기본 30일
    }

    // 사용자 프로필 업데이트
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        is_premium: true,
        premium_expires_at: newExpiryDate.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('구독 갱신 실패:', updateError);
      return { success: false, error: updateError.message };
    }

    // 갱신 로그 기록
    const { error: logError } = await supabase
      .from('purchase_logs')
      .insert({
        user_id: userId,
        product_id: productId,
        purchase_token: `manual_renewal_${Date.now()}`,
        verification_status: 'verified',
        subscription_type: 'subscription',
        expiration_time: newExpiryDate.toISOString(),
        verification_data: { renewal_type: 'manual', renewed_at: now.toISOString() },
        is_active: true,
        created_at: now.toISOString()
      });

    if (logError) {
      console.warn('갱신 로그 기록 실패:', logError);
    }

    console.log(`구독 갱신 완료: ${newExpiryDate.toISOString()}까지`);

    return {
      success: true,
      newExpiryDate: newExpiryDate.toISOString(),
      daysAdded: productId === 'premium_yearly' ? 365 : 30
    };
  } catch (error) {
    console.error('구독 갱신 오류:', error);
    return { success: false, error: error.message };
  }
}

// 구독 취소 처리
async function cancelSubscription(supabase: any, userId: string) {
  try {
    console.log(`구독 취소 처리: 사용자 ${userId}`);

    const now = new Date();

    // 사용자 프로필 업데이트
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        is_premium: false,
        updated_at: now.toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('구독 취소 실패:', updateError);
      return { success: false, error: updateError.message };
    }

    // 활성 구매 로그 비활성화
    const { error: logError } = await supabase
      .from('purchase_logs')
      .update({
        is_active: false,
        verification_status: 'cancelled',
        updated_at: now.toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (logError) {
      console.warn('구매 로그 업데이트 실패:', logError);
    }

    console.log('구독 취소 완료');

    return { success: true, cancelledAt: now.toISOString() };
  } catch (error) {
    console.error('구독 취소 오류:', error);
    return { success: false, error: error.message };
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

    const body: SubscriptionStatusRequest = req.method === 'POST' ? await req.json() : {};
    const { userId, action, productId } = body;

    console.log(`=== 구독 관리 요청: ${action} ===`);

    let result;

    switch (action) {
      case 'check_expiry':
        result = await checkAndUpdateExpiredSubscriptions(supabase);
        break;

      case 'get_status':
        if (!userId) {
          return new Response(
            JSON.stringify({ success: false, error: 'userId is required for get_status' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await getUserSubscriptionStatus(supabase, userId);
        break;

      case 'renew_subscription':
        if (!userId || !productId) {
          return new Response(
            JSON.stringify({ success: false, error: 'userId and productId are required for renew_subscription' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await renewSubscription(supabase, userId, productId);
        break;

      case 'cancel_subscription':
        if (!userId) {
          return new Response(
            JSON.stringify({ success: false, error: 'userId is required for cancel_subscription' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await cancelSubscription(supabase, userId);
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`=== 구독 관리 완료: ${action} ===`);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('구독 관리 오류:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});