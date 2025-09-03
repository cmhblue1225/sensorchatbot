/**
 * DocumentEmbedder 테스트 스크립트
 */

require('dotenv').config();
const DocumentEmbedder = require('./server/DocumentEmbedder');

async function testEmbedder() {
    try {
        console.log('🚀 DocumentEmbedder 테스트 시작...');
        console.log('환경변수 확인:');
        console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '설정됨' : '미설정');
        console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '설정됨' : '미설정');
        console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '설정됨' : '미설정');
        
        const embedder = new DocumentEmbedder();
        
        // 임베딩 실행
        const result = await embedder.embedAllDocuments();
        
        console.log('✅ 임베딩 완료!');
        console.log('결과:', result);
        
    } catch (error) {
        console.error('❌ 임베딩 실패:', error);
        process.exit(1);
    }
}

// 환경변수 확인
if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY가 설정되지 않았습니다.');
    process.exit(1);
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
    process.exit(1);
}

testEmbedder();