/**
 * LegacyGameValidator.js
 *
 * 레거시 게임 호환성 검증 시스템
 * 기존 게임들이 리팩토링된 허브 시스템에서 정상 작동하는지 검증
 */

const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');

class LegacyGameValidator {
    constructor() {
        this.gamesDirectory = path.join(__dirname, '../../public/games');
        this.validationResults = [];

        // 검증 기준
        this.validationCriteria = {
            // SessionSDK 호환성
            sessionSDK: {
                hasSessionSDKImport: false,
                hasSessionSDKInstantiation: false,
                hasEventHandlers: false,
                hasSessionCreation: false
            },

            // HTML 구조
            htmlStructure: {
                hasCanvas: false,
                hasUI: false,
                hasScriptTags: false,
                hasSocketIO: false
            },

            // 게임 로직
            gameLogic: {
                hasSensorDataProcessing: false,
                hasGameLoop: false,
                hasGameState: false,
                hasGameControls: false
            },

            // CSS/스타일링
            styling: {
                hasResponsiveDesign: false,
                hasUIComponents: false,
                hasAnimations: false
            }
        };

        // 필수 패턴들
        this.requiredPatterns = {
            sessionSDKImport: /src=["']\/js\/SessionSDK\.js["']/,
            sessionSDKClass: /new\s+SessionSDK\s*\(/,
            eventHandlers: /\.on\s*\(\s*['"`]([^'"`]+)['"`]/g,
            sessionCreation: /createSession\s*\(\)/,
            sensorDataProcessing: /sensor.*data|processSensorData/i,
            gameLoop: /requestAnimationFrame|setInterval|setTimeout/,
            socketIO: /socket\.io/i,
            canvas: /<canvas/i,
            responsiveDesign: /@media.*\(.*width.*\)/
        };
    }

    /**
     * 모든 레거시 게임 검증
     */
    async validateAllGames() {
        console.log('🔍 레거시 게임 호환성 검증 시작...');

        try {
            const gameDirectories = await this.getGameDirectories();
            console.log(`📁 발견된 게임: ${gameDirectories.length}개`);

            this.validationResults = [];

            for (const gameDir of gameDirectories) {
                console.log(`\n🎮 검증 중: ${gameDir}`);
                const result = await this.validateSingleGame(gameDir);
                this.validationResults.push(result);
            }

            const summary = this.generateSummary();
            await this.saveResults();

            console.log('\n✅ 레거시 게임 검증 완료');
            return {
                success: true,
                summary: summary,
                results: this.validationResults,
                totalGames: gameDirectories.length
            };

        } catch (error) {
            console.error('❌ 레거시 게임 검증 실패:', error.message);
            return {
                success: false,
                error: error.message,
                results: this.validationResults
            };
        }
    }

    /**
     * 게임 디렉토리 목록 가져오기
     */
    async getGameDirectories() {
        try {
            const entries = await fs.readdir(this.gamesDirectory, { withFileTypes: true });
            return entries
                .filter(entry => entry.isDirectory())
                .map(entry => entry.name)
                .sort();
        } catch (error) {
            throw new Error(`게임 디렉토리 읽기 실패: ${error.message}`);
        }
    }

    /**
     * 단일 게임 검증
     */
    async validateSingleGame(gameDir) {
        const result = {
            gameName: gameDir,
            indexPath: path.join(this.gamesDirectory, gameDir, 'index.html'),
            timestamp: new Date().toISOString(),
            validation: JSON.parse(JSON.stringify(this.validationCriteria)),
            issues: [],
            recommendations: [],
            compatibilityScore: 0,
            status: 'unknown'
        };

        try {
            // index.html 파일 존재 확인
            const indexExists = await this.fileExists(result.indexPath);
            if (!indexExists) {
                result.issues.push('index.html 파일이 존재하지 않습니다.');
                result.status = 'error';
                return result;
            }

            // HTML 파일 읽기 및 분석
            const htmlContent = await fs.readFile(result.indexPath, 'utf-8');
            await this.analyzeHTML(htmlContent, result);

            // 추가 파일들 검사
            await this.checkAdditionalFiles(gameDir, result);

            // 호환성 점수 계산
            result.compatibilityScore = this.calculateCompatibilityScore(result.validation);
            result.status = this.determineStatus(result.compatibilityScore, result.issues);

            console.log(`  📊 ${gameDir}: ${result.compatibilityScore}% 호환 (${result.status})`);

        } catch (error) {
            result.issues.push(`검증 중 오류: ${error.message}`);
            result.status = 'error';
        }

        return result;
    }

    /**
     * HTML 내용 분석
     */
    async analyzeHTML(htmlContent, result) {
        // SessionSDK 관련 검증
        this.validateSessionSDK(htmlContent, result);

        // HTML 구조 검증
        this.validateHTMLStructure(htmlContent, result);

        // 게임 로직 검증
        this.validateGameLogic(htmlContent, result);

        // 스타일링 검증
        this.validateStyling(htmlContent, result);

        // JSDOM을 사용한 추가 분석
        try {
            const dom = new JSDOM(htmlContent);
            this.analyzeWithJSDOM(dom, result);
        } catch (error) {
            result.issues.push(`JSDOM 분석 실패: ${error.message}`);
        }
    }

    /**
     * SessionSDK 호환성 검증
     */
    validateSessionSDK(htmlContent, result) {
        const sdk = result.validation.sessionSDK;

        // SessionSDK 임포트 확인
        if (this.requiredPatterns.sessionSDKImport.test(htmlContent)) {
            sdk.hasSessionSDKImport = true;
        } else {
            result.issues.push('SessionSDK 임포트가 누락되었습니다.');
            result.recommendations.push('SessionSDK 스크립트 태그를 추가하세요: <script src="/js/SessionSDK.js"></script>');
        }

        // SessionSDK 인스턴스화 확인
        if (this.requiredPatterns.sessionSDKClass.test(htmlContent)) {
            sdk.hasSessionSDKInstantiation = true;
        } else {
            result.issues.push('SessionSDK 인스턴스화가 누락되었습니다.');
            result.recommendations.push('new SessionSDK() 생성자를 추가하세요.');
        }

        // 이벤트 핸들러 확인
        const eventMatches = Array.from(htmlContent.matchAll(this.requiredPatterns.eventHandlers));
        if (eventMatches.length > 0) {
            sdk.hasEventHandlers = true;
            console.log(`    📡 발견된 이벤트 핸들러: ${eventMatches.map(m => m[1]).join(', ')}`);
        } else {
            result.issues.push('SessionSDK 이벤트 핸들러가 누락되었습니다.');
            result.recommendations.push('connected, session-created, sensor-data 등의 이벤트 핸들러를 추가하세요.');
        }

        // 세션 생성 확인
        if (this.requiredPatterns.sessionCreation.test(htmlContent)) {
            sdk.hasSessionCreation = true;
        } else {
            result.issues.push('세션 생성 코드가 누락되었습니다.');
            result.recommendations.push('sdk.createSession() 호출을 추가하세요.');
        }
    }

    /**
     * HTML 구조 검증
     */
    validateHTMLStructure(htmlContent, result) {
        const html = result.validation.htmlStructure;

        // Canvas 요소 확인
        if (this.requiredPatterns.canvas.test(htmlContent)) {
            html.hasCanvas = true;
        } else {
            result.recommendations.push('게임 렌더링을 위한 Canvas 요소를 추가하는 것을 고려하세요.');
        }

        // Socket.IO 확인
        if (this.requiredPatterns.socketIO.test(htmlContent)) {
            html.hasSocketIO = true;
        } else {
            result.issues.push('Socket.IO 라이브러리가 누락되었습니다.');
            result.recommendations.push('Socket.IO 스크립트 태그를 추가하세요: <script src="/socket.io/socket.io.js"></script>');
        }

        // UI 요소 확인
        const uiElements = ['button', 'div class', 'panel', 'ui-'];
        const hasUI = uiElements.some(element => htmlContent.toLowerCase().includes(element));
        if (hasUI) {
            html.hasUI = true;
        }

        // 스크립트 태그 확인
        if (htmlContent.includes('<script')) {
            html.hasScriptTags = true;
        }
    }

    /**
     * 게임 로직 검증
     */
    validateGameLogic(htmlContent, result) {
        const logic = result.validation.gameLogic;

        // 센서 데이터 처리 확인
        if (this.requiredPatterns.sensorDataProcessing.test(htmlContent)) {
            logic.hasSensorDataProcessing = true;
        } else {
            result.issues.push('센서 데이터 처리 로직이 누락되었습니다.');
            result.recommendations.push('processSensorData 함수를 구현하세요.');
        }

        // 게임 루프 확인
        if (this.requiredPatterns.gameLoop.test(htmlContent)) {
            logic.hasGameLoop = true;
        } else {
            result.recommendations.push('게임 루프(requestAnimationFrame 등)를 추가하는 것을 고려하세요.');
        }

        // 게임 상태 관리 확인
        const stateKeywords = ['state', 'playing', 'paused', 'score', 'gameState'];
        const hasGameState = stateKeywords.some(keyword =>
            htmlContent.toLowerCase().includes(keyword.toLowerCase())
        );
        if (hasGameState) {
            logic.hasGameState = true;
        }

        // 게임 컨트롤 확인
        const controlKeywords = ['start', 'pause', 'reset', 'restart'];
        const hasGameControls = controlKeywords.some(keyword =>
            htmlContent.toLowerCase().includes(keyword.toLowerCase())
        );
        if (hasGameControls) {
            logic.hasGameControls = true;
        }
    }

    /**
     * 스타일링 검증
     */
    validateStyling(htmlContent, result) {
        const styling = result.validation.styling;

        // 반응형 디자인 확인
        if (this.requiredPatterns.responsiveDesign.test(htmlContent)) {
            styling.hasResponsiveDesign = true;
        } else {
            result.recommendations.push('모바일 호환성을 위한 반응형 디자인을 추가하세요.');
        }

        // UI 컴포넌트 확인
        const uiComponents = ['panel', 'button', 'ui-', 'score', 'status'];
        const hasUIComponents = uiComponents.some(component =>
            htmlContent.toLowerCase().includes(component)
        );
        if (hasUIComponents) {
            styling.hasUIComponents = true;
        }

        // 애니메이션 확인
        const animationKeywords = ['animation', 'transition', '@keyframes', 'transform'];
        const hasAnimations = animationKeywords.some(keyword =>
            htmlContent.toLowerCase().includes(keyword)
        );
        if (hasAnimations) {
            styling.hasAnimations = true;
        }
    }

    /**
     * JSDOM을 사용한 추가 분석
     */
    analyzeWithJSDOM(dom, result) {
        const document = dom.window.document;

        // Canvas 요소 세부 분석
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const canvasId = canvas.id || 'unnamed';
            console.log(`    🎨 Canvas 발견: ${canvasId}`);
        }

        // 버튼 및 컨트롤 분석
        const buttons = document.querySelectorAll('button');
        if (buttons.length > 0) {
            console.log(`    🎛️ 컨트롤 버튼: ${buttons.length}개`);
        }

        // 메타 태그 확인
        const viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            result.recommendations.push('모바일 호환성을 위한 viewport 메타 태그를 추가하세요.');
        }
    }

    /**
     * 추가 파일 검사
     */
    async checkAdditionalFiles(gameDir, result) {
        const gameFullPath = path.join(this.gamesDirectory, gameDir);

        try {
            const files = await fs.readdir(gameFullPath);

            // 추가 파일들 확인
            const additionalFiles = files.filter(file =>
                file !== 'index.html' &&
                (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.json'))
            );

            if (additionalFiles.length > 0) {
                console.log(`    📁 추가 파일: ${additionalFiles.join(', ')}`);

                // game.json 파일 확인
                if (additionalFiles.includes('game.json')) {
                    try {
                        const gameJsonPath = path.join(gameFullPath, 'game.json');
                        const gameJsonContent = await fs.readFile(gameJsonPath, 'utf-8');
                        const gameMetadata = JSON.parse(gameJsonContent);
                        result.metadata = gameMetadata;
                        console.log(`    📋 게임 메타데이터: ${gameMetadata.title || 'Unknown'}`);
                    } catch (error) {
                        result.recommendations.push('game.json 파일 형식을 확인하세요.');
                    }
                }
            }
        } catch (error) {
            result.issues.push(`추가 파일 검사 실패: ${error.message}`);
        }
    }

    /**
     * 호환성 점수 계산
     */
    calculateCompatibilityScore(validation) {
        let score = 0;
        let maxScore = 0;

        // SessionSDK (가중치: 40%)
        const sdkWeight = 40;
        const sdkChecks = Object.values(validation.sessionSDK);
        const sdkScore = (sdkChecks.filter(Boolean).length / sdkChecks.length) * sdkWeight;
        score += sdkScore;
        maxScore += sdkWeight;

        // HTML 구조 (가중치: 25%)
        const htmlWeight = 25;
        const htmlChecks = Object.values(validation.htmlStructure);
        const htmlScore = (htmlChecks.filter(Boolean).length / htmlChecks.length) * htmlWeight;
        score += htmlScore;
        maxScore += htmlWeight;

        // 게임 로직 (가중치: 25%)
        const logicWeight = 25;
        const logicChecks = Object.values(validation.gameLogic);
        const logicScore = (logicChecks.filter(Boolean).length / logicChecks.length) * logicWeight;
        score += logicScore;
        maxScore += logicWeight;

        // 스타일링 (가중치: 10%)
        const styleWeight = 10;
        const styleChecks = Object.values(validation.styling);
        const styleScore = (styleChecks.filter(Boolean).length / styleChecks.length) * styleWeight;
        score += styleScore;
        maxScore += styleWeight;

        return Math.round((score / maxScore) * 100);
    }

    /**
     * 상태 결정
     */
    determineStatus(score, issues) {
        const criticalIssues = issues.filter(issue =>
            issue.includes('SessionSDK') ||
            issue.includes('Socket.IO') ||
            issue.includes('index.html')
        ).length;

        if (criticalIssues > 0) {
            return 'critical';
        } else if (score >= 80) {
            return 'compatible';
        } else if (score >= 60) {
            return 'minor_issues';
        } else {
            return 'major_issues';
        }
    }

    /**
     * 결과 요약 생성
     */
    generateSummary() {
        const total = this.validationResults.length;
        const statusCounts = {
            compatible: 0,
            minor_issues: 0,
            major_issues: 0,
            critical: 0,
            error: 0
        };

        let totalScore = 0;

        this.validationResults.forEach(result => {
            statusCounts[result.status]++;
            totalScore += result.compatibilityScore;
        });

        const averageScore = total > 0 ? Math.round(totalScore / total) : 0;

        return {
            totalGames: total,
            averageCompatibilityScore: averageScore,
            statusDistribution: statusCounts,
            readyForProduction: statusCounts.compatible + statusCounts.minor_issues,
            needsWork: statusCounts.major_issues + statusCounts.critical + statusCounts.error,
            recommendations: this.generateGlobalRecommendations()
        };
    }

    /**
     * 전역 권장사항 생성
     */
    generateGlobalRecommendations() {
        const allIssues = this.validationResults.flatMap(result => result.issues);
        const allRecommendations = this.validationResults.flatMap(result => result.recommendations);

        // 빈도수 기반 권장사항
        const commonIssues = {};
        allIssues.forEach(issue => {
            commonIssues[issue] = (commonIssues[issue] || 0) + 1;
        });

        const frequentIssues = Object.entries(commonIssues)
            .filter(([issue, count]) => count > 1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([issue, count]) => `${issue} (${count}개 게임)`);

        return {
            frequentIssues: frequentIssues,
            globalActions: [
                'SessionSDK 호환성 확인 및 업데이트',
                '반응형 디자인 적용',
                '에러 처리 강화',
                '게임 메타데이터 표준화',
                '테스트 자동화 도입'
            ]
        };
    }

    /**
     * 결과 저장
     */
    async saveResults() {
        const resultsPath = path.join(__dirname, '../../data/legacy_validation_results.json');
        const dataDir = path.dirname(resultsPath);

        try {
            await fs.mkdir(dataDir, { recursive: true });

            const fullResults = {
                timestamp: new Date().toISOString(),
                summary: this.generateSummary(),
                validationResults: this.validationResults,
                validationCriteria: this.validationCriteria
            };

            await fs.writeFile(resultsPath, JSON.stringify(fullResults, null, 2));
            console.log(`💾 검증 결과 저장: ${resultsPath}`);
        } catch (error) {
            console.error('결과 저장 실패:', error.message);
        }
    }

    /**
     * 특정 게임 수정 권장사항 생성
     */
    generateGameFixSuggestions(gameResult) {
        const suggestions = [];

        if (!gameResult.validation.sessionSDK.hasSessionSDKImport) {
            suggestions.push({
                type: 'critical',
                description: 'SessionSDK 임포트 추가',
                code: '<script src="/js/SessionSDK.js"></script>'
            });
        }

        if (!gameResult.validation.sessionSDK.hasSessionSDKInstantiation) {
            suggestions.push({
                type: 'critical',
                description: 'SessionSDK 인스턴스 생성',
                code: 'const sdk = new SessionSDK({ gameId: "your-game-id", gameType: "solo" });'
            });
        }

        if (!gameResult.validation.sessionSDK.hasEventHandlers) {
            suggestions.push({
                type: 'critical',
                description: '필수 이벤트 핸들러 추가',
                code: `
sdk.on('connected', async () => {
    await sdk.createSession();
});

sdk.on('session-created', (event) => {
    const session = event.detail || event;
    displaySessionInfo(session);
});

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    processSensorData(data);
});`
            });
        }

        return suggestions;
    }

    /**
     * 파일 존재 확인
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * 실시간 게임 테스트 (선택적)
     */
    async performLiveTest(gameDir) {
        // 실제 서버 환경에서의 게임 테스트
        // 이 부분은 필요시 추후 구현
        console.log(`🧪 ${gameDir} 실시간 테스트는 아직 구현되지 않았습니다.`);
        return {
            success: false,
            message: '실시간 테스트는 수동으로 수행해주세요.'
        };
    }
}

module.exports = LegacyGameValidator;