import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  // CORS preflight 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== 예약된 구독 만료 체크 시작 ===');

    // Supabase 클라이언트 초기화
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // subscription-manager 함수 호출
    const { data, error } = await supabase.functions.invoke('subscription-manager', {
      body: { action: 'check_expiry' }
    });

    if (error) {
      console.error('구독 만료 체크 실패:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('구독 만료 체크 결과:', data);

    // 결과 로깅
    if (data?.success) {
      const { expiredCount = 0, expiredUsers = [] } = data;
      console.log(`✅ 구독 만료 체크 완료: ${expiredCount}명 처리됨`);
      
      if (expiredCount > 0) {
        console.log('만료 처리된 사용자들:', expiredUsers);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        result: data,
        executedAt: new Date().toISOString(),
        message: '구독 만료 체크가 성공적으로 실행되었습니다.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('예약된 구독 체크 오류:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});