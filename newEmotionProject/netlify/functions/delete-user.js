import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://vzmvgyxsscfyflgxcpnq.supabase.co',
  process.env.SUPABASE_SERVICE_KEY // 서비스 키 필요 (사용자 삭제용)
);

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // DELETE 요청만 허용
  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // JWT 토큰에서 사용자 ID 추출
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: '인증이 필요합니다.' })
      };
    }

    const token = authHeader.replace('Bearer ', '');

    // 일반 클라이언트로 사용자 확인
    const publicSupabase = createClient(
      process.env.SUPABASE_URL || 'https://vzmvgyxsscfyflgxcpnq.supabase.co',
      process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6bXZneXhzc2NmeWZsZ3hjcG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDI4NzgsImV4cCI6MjA1OTk3ODg3OH0.-hQSBKVvPUX_KpbOp0zT25xMEjmky3WR-STC06kP0n4'
    );

    const { data: { user }, error: authError } = await publicSupabase.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: '유효하지 않은 토큰입니다.' })
      };
    }

    // 사용자 관련 데이터 삭제 (cascade로 자동 삭제될 수도 있음)
    const { error: diariesError } = await supabase
      .from('diaries')
      .delete()
      .eq('user_id', user.id);

    if (diariesError) {
      console.error('일기 삭제 오류:', diariesError);
    }

    const { error: chatError } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', user.id);

    if (chatError) {
      console.error('채팅 기록 삭제 오류:', chatError);
    }

    // 서비스 키로 사용자 계정 삭제
    if (process.env.SUPABASE_SERVICE_KEY) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

      if (deleteError) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: '사용자 삭제 실패', detail: deleteError.message })
        };
      }
    } else {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: '서비스 키가 설정되지 않았습니다.' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: '회원탈퇴가 완료되었습니다.' })
    };
  } catch (error) {
    console.error('Delete user error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '회원탈퇴 처리 중 오류가 발생했습니다.' })
    };
  }
};