/**
 * 🧪 GameCodeTester v1.0
 *
 * 게임 코드 자동 테스트 시스템
 * - 정적 분석 (코드 검사)
 * - 동적 분석 (Puppeteer 선택적)
 * - 버그 패턴 감지
 *
 * ✅ Puppeteer 없이도 기본 테스트 가능
 */

const fs = require('fs').promises;
const path = require('path');

class GameCodeTester {
    constructor() {
        this.puppeteerAvailable = false;
        this.checkPuppeteer();
    }

    /**
     * Puppeteer 사용 가능 여부 확인
     */
    async checkPuppeteer() {
        try {
            require.resolve('puppeteer');
            this.puppeteerAvailable = true;
            console.log('✅ Puppeteer 사용 가능');
        } catch (error) {
            console.log('⚠️ Puppeteer 미설치 - 정적 분석만 사용');
        }
    }

    /**
     * 게임 코드 테스트
     */
    async testGame(gameHtml, gameId) {
        console.log(`🧪 게임 테스트 시작: ${gameId}`);

        const results = {
            gameId,
            timestamp: new Date().toISOString(),
            tests: {},
            score: 0,
            maxScore: 100,
            grade: 'F',
            passed: false
        };

        // 1. 정적 분석 테스트
        await this.runStaticTests(gameHtml, results);

        // 2. 동적 분석 테스트 (Puppeteer 사용 가능 시)
        if (this.puppeteerAvailable) {
            await this.runDynamicTests(gameHtml, gameId, results);
        }

        // 3. 점수 계산
        this.calculateScore(results);

        console.log(`✅ 테스트 완료: ${results.score}/${results.maxScore} (${results.grade})`);
        return results;
    }

    /**
     * 정적 분석 테스트
     */
    async runStaticTests(html, results) {
        console.log('📝 정적 분석 테스트 실행 중...');

        // 테스트 1: SessionSDK 통합 (20점)
        results.tests.sessionSDK = this.testSessionSDK(html);

        // 테스트 2: 센서 데이터 처리 (15점)
        results.tests.sensorProcessing = this.testSensorProcessing(html);

        // 테스트 3: 게임 루프 (15점)
        results.tests.gameLoop = this.testGameLoop(html);

        // 테스트 4: 타이머 시스템 (15점)
        results.tests.timerSystem = this.testTimerSystem(html);

        // 테스트 5: 버그 패턴 감지 (20점)
        results.tests.bugPatterns = this.testBugPatterns(html);

        // 테스트 6: 상태 관리 (10점)
        results.tests.stateManagement = this.testStateManagement(html);

        // 테스트 7: UI 업데이트 (5점)
        results.tests.uiUpdate = this.testUIUpdate(html);
    }

    /**
     * 테스트 1: SessionSDK 통합
     */
    testSessionSDK(html) {
        const checks = {
            hasSDKInit: html.includes('new SessionSDK'),
            hasConnectedEvent: html.includes("sdk.on('connected'"),
            hasSessionCreatedEvent: html.includes("sdk.on('session-created'"),
            hasSessionCode: html.includes('session.sessionCode'),
            noSessionCodeError: !html.includes('session.code'),
            hasSensorDataEvent: html.includes("sdk.on('sensor-data'"),
            hasCustomEventPattern: html.includes('event.detail || event'),
            hasQRGeneration: html.includes('generateQRCode')
        };

        const passed = Object.values(checks).filter(v => v).length;
        const total = Object.keys(checks).length;

        return {
            name: 'SessionSDK 통합',
            passed,
            total,
            success: passed === total,
            score: passed === total ? 20 : Math.floor((passed / total) * 20),
            details: checks,
            issues: this.getSessionSDKIssues(checks)
        };
    }

    getSessionSDKIssues(checks) {
        const issues = [];
        if (!checks.hasSDKInit) issues.push('SessionSDK 초기화 누락');
        if (!checks.hasConnectedEvent) issues.push("'connected' 이벤트 리스너 누락");
        if (!checks.hasSessionCode) issues.push('session.sessionCode 사용 누락');
        if (checks.noSessionCodeError === false) issues.push('❌ 버그: session.code 사용 (session.sessionCode여야 함)');
        if (!checks.hasCustomEventPattern) issues.push('CustomEvent 처리 패턴 누락 (event.detail || event)');
        return issues;
    }

    /**
     * 테스트 2: 센서 데이터 처리
     */
    testSensorProcessing(html) {
        const checks = {
            hasProcessFunction: html.includes('function processSensorData'),
            hasOrientationAccess: html.includes('orientation.gamma') || html.includes('orientation.beta'),
            hasRangeLimit: html.includes('Math.max') && html.includes('Math.min'),
            hasPaddleMovement: html.includes('paddle.x')
        };

        const passed = Object.values(checks).filter(v => v).length;
        const total = Object.keys(checks).length;

        return {
            name: '센서 데이터 처리',
            passed,
            total,
            success: passed === total,
            score: passed === total ? 15 : Math.floor((passed / total) * 15),
            details: checks,
            issues: passed === total ? [] : ['센서 데이터 처리 로직 불완전']
        };
    }

    /**
     * 테스트 3: 게임 루프
     */
    testGameLoop(html) {
        const checks = {
            hasUpdateFunction: html.includes('function update()'),
            hasRenderFunction: html.includes('function render()'),
            hasGameLoop: html.includes('function gameLoop()'),
            hasRequestAnimationFrame: html.includes('requestAnimationFrame')
        };

        const passed = Object.values(checks).filter(v => v).length;
        const total = Object.keys(checks).length;

        return {
            name: '게임 루프',
            passed,
            total,
            success: passed === total,
            score: passed === total ? 15 : Math.floor((passed / total) * 15),
            details: checks
        };
    }

    /**
     * 테스트 4: 타이머 시스템
     */
    testTimerSystem(html) {
        const checks = {
            hasTimerVariable: html.includes('timeLeft') || html.includes('time'),
            hasSetInterval: html.includes('setInterval'),
            hasTimeDecrement: html.includes('timeLeft--') || html.includes('time--'),
            hasTimeCheck: html.includes('timeLeft <= 0') || html.includes('time <= 0')
        };

        const passed = Object.values(checks).filter(v => v).length;
        const total = Object.keys(checks).length;

        return {
            name: '타이머 시스템',
            passed,
            total,
            success: passed === total,
            score: passed === total ? 15 : Math.floor((passed / total) * 15),
            details: checks,
            issues: passed < total ? ['❌ 버그: 타이머가 작동하지 않을 수 있음'] : []
        };
    }

    /**
     * 테스트 5: 버그 패턴 감지 (가장 중요!)
     */
    testBugPatterns(html) {
        const bugPatterns = [
            {
                name: '공이 패들에 붙어있는 버그',
                pattern: /ball\.x\s*=\s*paddle\.x.*\n[\s\S]*?ball\.y\s*=\s*paddle\.y/,
                hasProtection: html.includes('!gameStarted') || html.includes('!game.started'),
                critical: true
            },
            {
                name: '충돌 감지 불완전',
                pattern: /ball\.dy\s*\*=\s*-1/,
                hasProtection: html.includes('ball.dy > 0') || html.includes('dy > 0'),
                critical: false
            },
            {
                name: '게임 오버 후 계속 실행',
                pattern: /gameOver\s*=\s*true/,
                hasProtection: html.includes('if (gameOver) return') || html.includes('if(gameOver)return'),
                critical: true
            }
        ];

        let bugsFound = 0;
        const issues = [];

        bugPatterns.forEach(bug => {
            if (bug.pattern.test(html) && !bug.hasProtection) {
                bugsFound++;
                if (bug.critical) {
                    issues.push(`❌ 치명적 버그: ${bug.name}`);
                } else {
                    issues.push(`⚠️ 잠재적 버그: ${bug.name}`);
                }
            }
        });

        const score = bugsFound === 0 ? 20 : Math.max(0, 20 - bugsFound * 7);

        return {
            name: '버그 패턴 감지',
            passed: bugPatterns.length - bugsFound,
            total: bugPatterns.length,
            success: bugsFound === 0,
            score,
            details: { bugsFound, patterns: bugPatterns.map(b => b.name) },
            issues
        };
    }

    /**
     * 테스트 6: 상태 관리
     */
    testStateManagement(html) {
        const checks = {
            hasGameState: html.includes('gameState') || html.includes('game.state'),
            hasScoreTracking: html.includes('score'),
            hasLivesTracking: html.includes('lives'),
            hasGameStartedFlag: html.includes('gameStarted') || html.includes('game.started')
        };

        const passed = Object.values(checks).filter(v => v).length;
        const total = Object.keys(checks).length;

        return {
            name: '상태 관리',
            passed,
            total,
            success: passed === total,
            score: passed === total ? 10 : Math.floor((passed / total) * 10),
            details: checks
        };
    }

    /**
     * 테스트 7: UI 업데이트
     */
    testUIUpdate(html) {
        const checks = {
            hasUpdateUIFunction: html.includes('function updateUI') || html.includes('updateUI()'),
            hasScoreDisplay: html.includes("getElementById('score')"),
            hasLivesDisplay: html.includes("getElementById('lives')")
        };

        const passed = Object.values(checks).filter(v => v).length;
        const total = Object.keys(checks).length;

        return {
            name: 'UI 업데이트',
            passed,
            total,
            success: passed === total,
            score: passed === total ? 5 : Math.floor((passed / total) * 5),
            details: checks
        };
    }

    /**
     * 동적 분석 테스트 (Puppeteer)
     */
    async runDynamicTests(html, gameId, results) {
        console.log('🎮 동적 분석 테스트 실행 중... (Puppeteer)');

        try {
            const puppeteer = require('puppeteer');
            // TODO: Puppeteer 테스트 구현
            // 실제 브라우저에서 게임 실행 및 테스트
        } catch (error) {
            console.log('⚠️ Puppeteer 테스트 스킵:', error.message);
        }
    }

    /**
     * 점수 계산 및 등급 부여
     */
    calculateScore(results) {
        let totalScore = 0;

        Object.values(results.tests).forEach(test => {
            totalScore += test.score || 0;
        });

        results.score = totalScore;

        // 등급 부여
        if (totalScore >= 90) results.grade = 'A+';
        else if (totalScore >= 85) results.grade = 'A';
        else if (totalScore >= 80) results.grade = 'B+';
        else if (totalScore >= 75) results.grade = 'B';
        else if (totalScore >= 70) results.grade = 'C+';
        else if (totalScore >= 65) results.grade = 'C';
        else if (totalScore >= 60) results.grade = 'D';
        else results.grade = 'F';

        // 통과 여부 (60점 이상)
        results.passed = totalScore >= 60;
    }

    /**
     * 테스트 결과 리포트 생성
     */
    generateReport(results) {
        let report = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 게임 테스트 결과
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

게임 ID: ${results.gameId}
테스트 시간: ${results.timestamp}
총점: ${results.score}/${results.maxScore}
등급: ${results.grade}
통과 여부: ${results.passed ? '✅ 통과' : '❌ 실패'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 상세 테스트 결과
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

        Object.values(results.tests).forEach(test => {
            const status = test.success ? '✅' : '❌';
            report += `\n${status} ${test.name}: ${test.passed}/${test.total} (${test.score}점)\n`;

            if (test.issues && test.issues.length > 0) {
                test.issues.forEach(issue => {
                    report += `   └─ ${issue}\n`;
                });
            }
        });

        report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

        return report;
    }
}

module.exports = GameCodeTester;
