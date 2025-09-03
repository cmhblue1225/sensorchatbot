/**
 * DocumentEmbedder 향상된 테스트 스크립트
 */

require('dotenv').config();
const DocumentEmbedder = require('./server/DocumentEmbedder');

async function testEmbedder() {
    try {
        console.log('🚀 향상된 DocumentEmbedder 테스트 시작...');
        console.log('환경변수 확인:');
        console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ 설정됨' : '❌ 미설정');
        console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ 설정됨' : '❌ 미설정');
        console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 미설정');
        console.log('');
        
        const embedder = new DocumentEmbedder();
        
        // 1. 기존 데이터 상태 확인
        console.log('📊 기존 임베딩 데이터 확인 중...');
        const existingStats = await embedder.getEmbeddingStats();
        if (existingStats && existingStats.total > 0) {
            console.log(`📋 기존 데이터 발견: ${existingStats.total}개 문서`);
            console.log('타입별 분포:', existingStats.byType);
            
            // 기존 데이터 정리할지 확인
            console.log('🧹 기존 데이터를 정리하고 새로 임베딩합니다...');
        }
        
        // 2. 새로운 임베딩 실행
        console.log('📚 새로운 문서 임베딩 시작...');
        const startTime = Date.now();
        const result = await embedder.embedAllDocuments();
        const endTime = Date.now();
        
        // 3. 결과 분석
        if (result.success) {
            console.log('');
            console.log('✅ 임베딩 완료!');
            console.log(`⏱️ 소요 시간: ${(endTime - startTime) / 1000}초`);
            console.log('📊 최종 통계:');
            console.log(`  - 총 문서 수: ${result.stats.total}`);
            console.log('  - 타입별 분포:', result.stats.byType);
            console.log('  - 파일별 분포:', Object.keys(result.stats.byFile).length, '개 파일');
            
            // 새로운 임베딩 포함 항목들
            const newFeatures = [];
            if (result.stats.byFile['CLAUDE.md']) {
                newFeatures.push('CLAUDE.md (프로젝트 상세 문서)');
            }
            if (result.stats.byFile['sensor.html']) {
                newFeatures.push('sensor.html (센서 클라이언트)');
            }
            if (result.stats.byType['server_code']) {
                newFeatures.push(`서버 코드 (${result.stats.byType['server_code']}개 청크)`);
            }
            
            if (newFeatures.length > 0) {
                console.log('');
                console.log('🎉 새롭게 추가된 임베딩 항목:');
                newFeatures.forEach(feature => console.log(`  - ${feature}`));
            }
            
        } else {
            console.log('⚠️ 임베딩 중 일부 오류 발생');
            console.log('오류:', result.error);
        }
        
        // 4. 간단한 검색 테스트
        console.log('');
        console.log('🔍 벡터 검색 테스트 중...');
        await testVectorSearch(embedder);
        
    } catch (error) {
        console.error('❌ 임베딩 실패:', error.message);
        process.exit(1);
    }
}

async function testVectorSearch(embedder) {
    try {
        // 테스트 쿼리들
        const testQueries = [
            "SessionSDK 사용법",
            "게임 개발 방법",
            "센서 데이터 구조"
        ];
        
        for (const query of testQueries) {
            console.log(`  테스트 쿼리: "${query}"`);
            
            // 임베딩 생성
            const queryEmbedding = await embedder.embeddings.embedQuery(query);
            
            // 벡터 검색
            const { data, error } = await embedder.supabaseClient
                .rpc('match_documents', {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.7,
                    match_count: 3
                });
                
            if (error) {
                console.log(`    ❌ 검색 실패: ${error.message}`);
            } else {
                console.log(`    ✅ ${data.length}개 관련 문서 발견`);
                data.forEach((doc, idx) => {
                    console.log(`      ${idx + 1}. ${doc.source_file} (유사도: ${(doc.similarity * 100).toFixed(1)}%)`);
                });
            }
            console.log('');
        }
        
    } catch (error) {
        console.log(`❌ 벡터 검색 테스트 실패: ${error.message}`);
    }
}

// 환경변수 확인
if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY가 설정되지 않았습니다.');
    console.error('   환경변수를 설정하거나 .env 파일을 확인하세요.');
    process.exit(1);
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
    console.error('   SUPABASE_URL과 SUPABASE_ANON_KEY를 설정하세요.');
    process.exit(1);
}

testEmbedder();