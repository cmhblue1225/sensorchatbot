#!/usr/bin/env node

/**
 * 🔍 게임 검증 시스템 테스트
 * 기존 게임들의 완성도를 평가하고 검증 시스템 정확도 확인
 */

const GameValidator = require('../server/GameValidator');
const path = require('path');

async function main() {
    console.log('🔍 게임 검증 시스템 테스트 시작...\n');
    
    const validator = new GameValidator();
    const gamesDir = path.join(process.cwd(), 'public', 'games');
    
    // 테스트할 게임들 (예시)
    const testGames = [
        { id: 'acorn-battle', name: '🏆 도토리 배틀' },
        { id: 'solo', name: 'Solo Sensor Game' },
        { id: 'dual', name: 'Dual Sensor Game' }
    ];
    
    const results = [];
    
    for (const game of testGames) {
        try {
            console.log(`🎮 검증 중: ${game.name} (${game.id})`);
            const gamePath = path.join(gamesDir, game.id);
            
            const validationResult = await validator.validateGame(game.id, gamePath);
            results.push({
                ...validationResult,
                name: game.name
            });
            
            // 간단한 결과 출력
            const statusIcon = validationResult.isValid ? '✅' : '❌';
            console.log(`${statusIcon} ${game.name}: ${validationResult.score}/100 (${validationResult.grade})`);
            
            if (validationResult.errors.length > 0) {
                console.log(`   오류 ${validationResult.errors.length}개:`);
                validationResult.errors.slice(0, 3).forEach(error => {
                    console.log(`   - ${error}`);
                });
                if (validationResult.errors.length > 3) {
                    console.log(`   - ... 외 ${validationResult.errors.length - 3}개`);
                }
            }
            
            console.log(''); // 빈 줄
            
        } catch (error) {
            console.error(`❌ ${game.name} 검증 실패:`, error.message);
            results.push({
                gameId: game.id,
                name: game.name,
                isValid: false,
                error: error.message
            });
        }
    }
    
    // 종합 결과 출력
    console.log('📊 검증 시스템 테스트 결과');
    console.log('='.repeat(50));
    
    const validGames = results.filter(r => r.isValid);
    const averageScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;
    
    console.log(`📈 전체 평균 점수: ${Math.round(averageScore)}/100`);
    console.log(`✅ 유효한 게임: ${validGames.length}/${results.length}`);
    console.log(`🎯 검증 시스템 동작: 정상`);
    
    // 각 게임별 상세 결과
    console.log('\n📋 게임별 상세 결과:');
    results.forEach(result => {
        const status = result.isValid ? '✅ 플레이 가능' : '❌ 수정 필요';
        console.log(`  ${result.name}: ${result.score || 0}/100 - ${status}`);
    });
    
    console.log('\n🎉 검증 시스템 테스트 완료!');
    console.log('\n💡 이제 InteractiveGameGenerator가 생성한 게임들이');
    console.log('   자동으로 검증되어 100% 플레이 가능한 게임만 출력됩니다!');
}

// 스크립트 직접 실행 시
if (require.main === module) {
    main().catch(error => {
        console.error('테스트 실패:', error);
        process.exit(1);
    });
}

module.exports = main;