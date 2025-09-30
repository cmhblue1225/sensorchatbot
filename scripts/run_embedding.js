/**
 * 벡터 임베딩 생성 실행 스크립트
 * Phase 3.2 - 5,000+ 행 문서를 벡터 임베딩으로 변환
 */

require('dotenv').config();
const VectorEmbeddingService = require('../server/services/VectorEmbeddingService');

async function runEmbeddingGeneration() {
    console.log('🚀 벡터 임베딩 생성 시작...');
    console.log('📊 환경 변수 확인:');
    console.log(`  - SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ 설정됨' : '❌ 누락'}`);
    console.log(`  - SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 누락'}`);
    console.log(`  - OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ 설정됨' : '❌ 누락'}`);

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.OPENAI_API_KEY) {
        console.error('❌ 필수 환경 변수가 누락되었습니다.');
        process.exit(1);
    }

    const embeddingService = new VectorEmbeddingService();

    try {
        // 진행 상황 이벤트 리스너 등록
        embeddingService.on('progress-update', (progress) => {
            console.log(`📊 ${progress.currentPhase} (${progress.percentage}%): ${progress.details}`);

            if (progress.estimatedEndTime) {
                const remainingTime = Math.max(0, progress.estimatedEndTime - Date.now());
                const remainingMinutes = Math.round(remainingTime / 60000);
                console.log(`⏱️  예상 남은 시간: ${remainingMinutes}분`);
            }
        });

        embeddingService.on('initialization-complete', (result) => {
            console.log('🎉 임베딩 시스템 초기화 완료!');
            console.log(`📊 처리된 청크: ${result.chunksProcessed}개`);
            console.log(`🔍 생성된 임베딩: ${result.embeddingsGenerated}개`);
            console.log(`⏱️  총 소요 시간: ${Math.round(result.totalTime / 1000)}초`);
        });

        embeddingService.on('initialization-error', (error) => {
            console.error('❌ 초기화 실패:', error.message);
        });

        // 전체 임베딩 시스템 초기화 및 생성
        console.log('\n📋 Phase 1: 문서 청킹');
        console.log('📋 Phase 2: 임베딩 생성');
        console.log('📋 Phase 3: 검색 시스템 검증');
        console.log('📋 Phase 4: 완료\n');

        const result = await embeddingService.initializeEmbeddingSystem({
            forceRebuild: false,  // 기존 청크가 있으면 재사용
            skipExisting: true,   // 기존 임베딩이 있으면 스킵
            enableProgress: true  // 진행 상황 표시
        });

        if (result.success) {
            console.log('\n🎉 벡터 임베딩 시스템 구축 완료!');
            console.log('=====================================');
            console.log(`📊 처리된 청크: ${result.chunksProcessed}개`);
            console.log(`🔍 생성된 임베딩: ${result.embeddingsGenerated}개`);
            console.log(`🧪 검색 테스트: ${result.searchTests}개 완료`);
            console.log(`⏱️  총 소요 시간: ${Math.round(result.totalTime / 1000)}초`);
            console.log(`🎯 시스템 상태: ${result.systemReady ? '준비 완료' : '추가 설정 필요'}`);

            // 시스템 상태 확인
            console.log('\n📊 시스템 상태 확인...');
            const status = await embeddingService.getSystemStatus();
            console.log('시스템 상태:', JSON.stringify(status, null, 2));

            // 간단한 검색 테스트
            console.log('\n🔍 검색 테스트...');
            const searchResult = await embeddingService.search('SessionSDK 사용 방법');
            console.log(`검색 결과: ${searchResult.results?.length || 0}개 문서 발견`);

        } else {
            console.error('\n❌ 벡터 임베딩 시스템 구축 실패');
            console.error('오류:', result.error);
            process.exit(1);
        }

    } catch (error) {
        console.error('\n💥 예상치 못한 오류 발생:', error.message);
        console.error('스택:', error.stack);
        process.exit(1);
    }
}

// 스크립트 실행
if (require.main === module) {
    runEmbeddingGeneration().catch(error => {
        console.error('스크립트 실행 실패:', error);
        process.exit(1);
    });
}

module.exports = runEmbeddingGeneration;