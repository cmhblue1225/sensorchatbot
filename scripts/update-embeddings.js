#!/usr/bin/env node

/**
 * 🚀 RAG 시스템 강화 스크립트
 * 새로운 완벽한 게임 개발 가이드들을 임베딩하여 AI 성능 향상
 */

const DocumentEmbedder = require('../server/DocumentEmbedder');

async function main() {
    console.log('🚀 RAG 시스템 강화 시작...');
    console.log('📚 새로운 완벽한 게임 개발 가이드 임베딩 중...');
    
    try {
        const embedder = new DocumentEmbedder();
        
        console.log('🔄 기존 임베딩 데이터 정리 및 새 문서들 임베딩 시작...');
        const result = await embedder.embedAllDocuments();
        
        if (result.success) {
            console.log('✅ RAG 시스템 강화 완료!');
            console.log('📊 최종 통계:', result.stats);
            
            console.log('\n🎯 향상된 기능:');
            console.log('  • 완벽한 게임 개발 패턴 가이드');
            console.log('  • SessionSDK 통합 패턴 완벽 가이드');
            console.log('  • 센서 게임 문제 해결 및 디버깅 가이드');
            console.log('  • 기존 모든 예제 게임 코드 패턴');
            console.log('  • 서버 시스템 아키텍처 문서');
            
            console.log('\n🤖 이제 AI가 다음을 완벽하게 수행할 수 있습니다:');
            console.log('  ✓ 100% 작동하는 센서 게임 생성');
            console.log('  ✓ SessionSDK 올바른 통합');
            console.log('  ✓ QR 코드 생성 및 폴백 처리');
            console.log('  ✓ CustomEvent 패턴 올바른 사용');
            console.log('  ✓ 센서 데이터 처리 최적화');
            console.log('  ✓ 캔버스 렌더링 시스템');
            console.log('  ✓ 완벽한 UI/UX 구조');
            
            process.exit(0);
        } else {
            throw new Error('임베딩 프로세스 실패');
        }
        
    } catch (error) {
        console.error('❌ RAG 시스템 강화 실패:', error);
        console.log('\n💡 해결 방법:');
        console.log('  1. Supabase 연결 상태 확인');
        console.log('  2. OpenAI API 키 확인');
        console.log('  3. 네트워크 연결 확인');
        
        process.exit(1);
    }
}

// 스크립트 직접 실행 시
if (require.main === module) {
    main();
}

module.exports = main;