/**
 * 🔍 GameValidator v1.0
 * 
 * AI가 생성한 게임의 완성도와 작동 가능성을 자동 검증
 * - HTML 구조 검증
 * - JavaScript 문법 검증  
 * - SessionSDK 통합 패턴 검증
 * - 필수 요소 존재 여부 검증
 */

const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');

class GameValidator {
    constructor() {
        this.validationRules = {
            // 필수 HTML 요소들
            requiredElements: [
                'canvas#game-canvas',
                '#session-panel',
                '#session-code-display', 
                '#qr-container',
                '#start-game-btn',
                '#game-overlay'
            ],
            
            // 필수 JavaScript 패턴들
            requiredPatterns: [
                /new SessionSDK\(\{/,                    // SessionSDK 초기화
                /sdk\.on\('connected'/,                  // connected 이벤트 리스너
                /sdk\.on\('session-created'/,            // session-created 이벤트 리스너
                /sdk\.on\('sensor-data'/,                // sensor-data 이벤트 리스너
                /event\.detail \|\| event/,              // CustomEvent 처리 패턴
                /createSession\(\)/,                     // 세션 생성 호출
                /QRCodeGenerator/,                       // QR 코드 생성
                /requestAnimationFrame/,                 // 애니메이션 루프
                /getContext\('2d'\)/                     // 캔버스 2D 컨텍스트
            ],
            
            // 금지된 안티패턴들
            forbiddenPatterns: [
                /sdk\.createSession\(\).*sdk\.on\('connected'/s,  // 연결 전 세션 생성 시도
                /session\.sessionCode.*undefined/,                // undefined 세션 코드 접근
                /QRCode\.toCanvas.*without.*try.*catch/           // QR 코드 에러 처리 누락
            ],
            
            // 필수 스크립트 태그들
            requiredScripts: [
                '/socket.io/socket.io.js',
                '/js/SessionSDK.js'
            ]
        };
    }

    /**
     * 게임 파일 전체 검증
     */
    async validateGame(gameId, gamePath) {
        const results = {
            gameId,
            gamePath,
            isValid: true,
            score: 0,
            maxScore: 100,
            errors: [],
            warnings: [],
            suggestions: [],
            details: {}
        };

        try {
            console.log(`🔍 게임 검증 시작: ${gameId}`);
            
            // 1. 파일 존재성 검증
            const fileValidation = await this.validateFileStructure(gamePath);
            results.details.files = fileValidation;
            results.score += fileValidation.score;
            
            if (fileValidation.errors.length > 0) {
                results.errors.push(...fileValidation.errors);
                results.isValid = false;
            }

            // 2. HTML 구조 검증
            const htmlPath = path.join(gamePath, 'index.html');
            const htmlValidation = await this.validateHTML(htmlPath);
            results.details.html = htmlValidation;
            results.score += htmlValidation.score;
            
            if (htmlValidation.errors.length > 0) {
                results.errors.push(...htmlValidation.errors);
                results.isValid = false;
            }
            results.warnings.push(...htmlValidation.warnings);

            // 3. JavaScript 코드 검증
            const jsValidation = await this.validateJavaScript(htmlPath);
            results.details.javascript = jsValidation;
            results.score += jsValidation.score;
            
            if (jsValidation.errors.length > 0) {
                results.errors.push(...jsValidation.errors);
                results.isValid = false;
            }
            results.warnings.push(...jsValidation.warnings);
            results.suggestions.push(...jsValidation.suggestions);

            // 4. SessionSDK 통합 패턴 검증
            const sdkValidation = await this.validateSDKIntegration(htmlPath);
            results.details.sdk = sdkValidation;
            results.score += sdkValidation.score;
            
            if (sdkValidation.errors.length > 0) {
                results.errors.push(...sdkValidation.errors);
                results.isValid = false;
            }
            results.suggestions.push(...sdkValidation.suggestions);

            // 5. 성능 및 최적화 검증
            const performanceValidation = await this.validatePerformance(htmlPath);
            results.details.performance = performanceValidation;
            results.score += performanceValidation.score;
            results.suggestions.push(...performanceValidation.suggestions);

            // 최종 점수 계산
            results.score = Math.round(results.score);
            results.grade = this.calculateGrade(results.score);

            console.log(`✅ 검증 완료: ${gameId} - 점수: ${results.score}/100 (${results.grade})`);
            
            return results;

        } catch (error) {
            console.error(`❌ 게임 검증 실패: ${gameId}`, error);
            results.isValid = false;
            results.errors.push(`검증 프로세스 오류: ${error.message}`);
            return results;
        }
    }

    /**
     * 파일 구조 검증
     */
    async validateFileStructure(gamePath) {
        const result = { score: 0, maxScore: 10, errors: [], warnings: [] };

        try {
            // index.html 존재 확인
            const indexPath = path.join(gamePath, 'index.html');
            await fs.access(indexPath);
            result.score += 7;

            // game.json 존재 확인 (선택사항)
            try {
                const metadataPath = path.join(gamePath, 'game.json');
                await fs.access(metadataPath);
                result.score += 3;
                
                // JSON 유효성 검사
                const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
                if (!metadata.title || !metadata.description) {
                    result.warnings.push('game.json에 title 또는 description이 누락됨');
                }
            } catch (jsonError) {
                result.warnings.push('game.json 파일이 없거나 유효하지 않음');
            }

        } catch (error) {
            result.errors.push('index.html 파일이 존재하지 않음');
        }

        return result;
    }

    /**
     * HTML 구조 검증
     */
    async validateHTML(htmlPath) {
        const result = { score: 0, maxScore: 25, errors: [], warnings: [] };

        try {
            const htmlContent = await fs.readFile(htmlPath, 'utf-8');
            const dom = new JSDOM(htmlContent);
            const document = dom.window.document;

            // 필수 HTML 요소 존재 확인
            let foundElements = 0;
            for (const selector of this.validationRules.requiredElements) {
                const element = document.querySelector(selector);
                if (element) {
                    foundElements++;
                } else {
                    result.errors.push(`필수 요소 누락: ${selector}`);
                }
            }
            
            result.score += Math.round((foundElements / this.validationRules.requiredElements.length) * 20);

            // 필수 스크립트 태그 확인
            let foundScripts = 0;
            for (const scriptSrc of this.validationRules.requiredScripts) {
                const scriptElement = document.querySelector(`script[src="${scriptSrc}"]`);
                if (scriptElement) {
                    foundScripts++;
                } else {
                    result.errors.push(`필수 스크립트 누락: ${scriptSrc}`);
                }
            }
            
            result.score += Math.round((foundScripts / this.validationRules.requiredScripts.length) * 5);

            // 메타 태그 검증 (모바일 최적화)
            const viewport = document.querySelector('meta[name="viewport"]');
            if (!viewport || !viewport.content.includes('user-scalable=no')) {
                result.warnings.push('모바일 최적화를 위한 viewport 설정이 불완전함');
            }

            // 캔버스 크기 확인
            const canvas = document.querySelector('#game-canvas');
            if (canvas && (!canvas.width || !canvas.height)) {
                result.warnings.push('캔버스 크기가 설정되지 않음');
            }

        } catch (error) {
            result.errors.push(`HTML 파싱 오류: ${error.message}`);
        }

        return result;
    }

    /**
     * JavaScript 코드 검증
     */
    async validateJavaScript(htmlPath) {
        const result = { 
            score: 0, 
            maxScore: 35, 
            errors: [], 
            warnings: [], 
            suggestions: [] 
        };

        try {
            const htmlContent = await fs.readFile(htmlPath, 'utf-8');
            const jsCode = this.extractJavaScriptFromHTML(htmlContent);

            if (!jsCode || jsCode.trim().length === 0) {
                result.errors.push('JavaScript 코드가 없음');
                return result;
            }

            // 필수 패턴 검증
            let foundPatterns = 0;
            for (const pattern of this.validationRules.requiredPatterns) {
                if (pattern.test(jsCode)) {
                    foundPatterns++;
                } else {
                    const patternName = this.getPatternName(pattern);
                    result.errors.push(`필수 패턴 누락: ${patternName}`);
                }
            }
            
            result.score += Math.round((foundPatterns / this.validationRules.requiredPatterns.length) * 25);

            // 금지된 안티패턴 검증
            for (const antiPattern of this.validationRules.forbiddenPatterns) {
                if (antiPattern.test(jsCode)) {
                    const patternName = this.getPatternName(antiPattern);
                    result.errors.push(`금지된 패턴 발견: ${patternName}`);
                    result.score -= 5;
                }
            }

            // 문법 오류 기본 검사
            const syntaxCheck = this.basicSyntaxCheck(jsCode);
            if (syntaxCheck.errors.length > 0) {
                result.errors.push(...syntaxCheck.errors);
                result.score -= syntaxCheck.errors.length * 2;
            }
            result.warnings.push(...syntaxCheck.warnings);

            // 추가 점수 (고급 패턴)
            if (/try\s*\{[\s\S]*\}\s*catch/.test(jsCode)) {
                result.score += 3;
                result.suggestions.push('✅ 적절한 에러 처리가 구현됨');
            }

            if (/requestAnimationFrame/.test(jsCode)) {
                result.score += 2;
                result.suggestions.push('✅ 최적화된 애니메이션 루프 사용');
            }

            if (/Math\.max.*Math\.min/.test(jsCode)) {
                result.score += 2;
                result.suggestions.push('✅ 센서 데이터 범위 제한 구현됨');
            }

            // 점수 하한선 설정
            result.score = Math.max(0, result.score);

        } catch (error) {
            result.errors.push(`JavaScript 검증 오류: ${error.message}`);
        }

        return result;
    }

    /**
     * SessionSDK 통합 패턴 검증
     */
    async validateSDKIntegration(htmlPath) {
        const result = { 
            score: 0, 
            maxScore: 20, 
            errors: [], 
            suggestions: [] 
        };

        try {
            const htmlContent = await fs.readFile(htmlPath, 'utf-8');
            const jsCode = this.extractJavaScriptFromHTML(htmlContent);

            // SDK 초기화 패턴 검증
            const sdkInitPattern = /new SessionSDK\(\{[\s\S]*gameId:\s*['"`]([^'"`]+)['"`][\s\S]*gameType:\s*['"`](\w+)['"`]/;
            const sdkMatch = jsCode.match(sdkInitPattern);
            
            if (sdkMatch) {
                result.score += 5;
                result.suggestions.push(`✅ SessionSDK 초기화됨: ${sdkMatch[1]} (${sdkMatch[2]})`);
            } else {
                result.errors.push('SessionSDK 초기화 패턴이 올바르지 않음');
            }

            // 이벤트 리스너 순서 검증
            const eventListenerOrder = this.checkEventListenerOrder(jsCode);
            if (eventListenerOrder.isValid) {
                result.score += 8;
                result.suggestions.push('✅ 올바른 이벤트 리스너 순서');
            } else {
                result.errors.push(...eventListenerOrder.errors);
            }

            // CustomEvent 처리 패턴 검증
            const customEventPattern = /sdk\.on\([^,]+,\s*(?:\([^)]*\)\s*=>\s*\{|\function\s*\([^)]*\)\s*\{)[\s\S]*?(?:event\.detail\s*\|\|\s*event|const\s+\w+\s*=\s*event\.detail\s*\|\|\s*event)/;
            if (customEventPattern.test(jsCode)) {
                result.score += 5;
                result.suggestions.push('✅ CustomEvent 처리 패턴 올바름');
            } else {
                result.errors.push('CustomEvent 처리 패턴이 누락됨 (event.detail || event)');
            }

            // QR 코드 생성 및 폴백 검증
            const qrPattern = /QRCodeGenerator[\s\S]*try[\s\S]*catch[\s\S]*fallback/i;
            if (qrPattern.test(jsCode)) {
                result.score += 2;
                result.suggestions.push('✅ QR 코드 생성 폴백 처리 구현됨');
            } else {
                result.suggestions.push('⚠️ QR 코드 생성 폴백 처리 추가 권장');
            }

        } catch (error) {
            result.errors.push(`SDK 통합 검증 오류: ${error.message}`);
        }

        return result;
    }

    /**
     * 성능 및 최적화 검증
     */
    async validatePerformance(htmlPath) {
        const result = { 
            score: 0, 
            maxScore: 10, 
            suggestions: [] 
        };

        try {
            const htmlContent = await fs.readFile(htmlPath, 'utf-8');
            const jsCode = this.extractJavaScriptFromHTML(htmlContent);

            // 애니메이션 루프 최적화
            if (/requestAnimationFrame/.test(jsCode) && /deltaTime|elapsed/.test(jsCode)) {
                result.score += 3;
                result.suggestions.push('✅ 시간 기반 애니메이션 루프 사용');
            }

            // 센서 데이터 처리 최적화
            if (/if\s*\(\s*!gameState\.isRunning/.test(jsCode)) {
                result.score += 2;
                result.suggestions.push('✅ 게임 상태 기반 센서 데이터 처리');
            }

            // 캔버스 렌더링 최적화
            if (/clearRect/.test(jsCode) && /fillRect|drawImage/.test(jsCode)) {
                result.score += 2;
                result.suggestions.push('✅ 기본적인 캔버스 렌더링 구현');
            }

            // 메모리 관리
            if (/removeEventListener|cleanup|destroy/.test(jsCode)) {
                result.score += 2;
                result.suggestions.push('✅ 메모리 관리 고려됨');
            }

            // 반응형 처리
            if (/window\.addEventListener.*resize/.test(jsCode)) {
                result.score += 1;
                result.suggestions.push('✅ 반응형 화면 크기 처리');
            }

        } catch (error) {
            result.suggestions.push(`성능 검증 오류: ${error.message}`);
        }

        return result;
    }

    /**
     * HTML에서 JavaScript 추출
     */
    extractJavaScriptFromHTML(htmlContent) {
        const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
        let jsContent = '';
        let match;

        while ((match = scriptRegex.exec(htmlContent)) !== null) {
            // 외부 스크립트 제외
            if (!match[0].includes('src=')) {
                jsContent += match[1] + '\n\n';
            }
        }

        return jsContent.trim();
    }

    /**
     * 이벤트 리스너 순서 검증
     */
    checkEventListenerOrder(jsCode) {
        const result = { isValid: true, errors: [] };

        // connected 이벤트 리스너 위치
        const connectedMatch = jsCode.match(/sdk\.on\s*\(\s*['"`]connected['"`]/);
        const createSessionMatch = jsCode.match(/createSession\s*\(\s*\)/);

        if (connectedMatch && createSessionMatch) {
            const connectedIndex = connectedMatch.index;
            const createSessionIndex = createSessionMatch.index;

            if (createSessionIndex < connectedIndex) {
                result.isValid = false;
                result.errors.push('createSession()이 connected 이벤트 리스너보다 먼저 호출됨');
            }
        }

        return result;
    }

    /**
     * 기본 문법 검사
     */
    basicSyntaxCheck(jsCode) {
        const result = { errors: [], warnings: [] };

        // 괄호 균형 검사
        const openBraces = (jsCode.match(/\{/g) || []).length;
        const closeBraces = (jsCode.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
            result.errors.push(`중괄호 불균형: { ${openBraces}개, } ${closeBraces}개`);
        }

        // 일반적인 오타 검사
        const commonTypos = [
            { pattern: /sesion/gi, correct: 'session' },
            { pattern: /sensot/gi, correct: 'sensor' },
            { pattern: /conected/gi, correct: 'connected' },
            { pattern: /undifined/gi, correct: 'undefined' }
        ];

        commonTypos.forEach(typo => {
            if (typo.pattern.test(jsCode)) {
                result.warnings.push(`오타 가능성: "${typo.pattern.source}" -> "${typo.correct}"`);
            }
        });

        return result;
    }

    /**
     * 패턴 이름 추출
     */
    getPatternName(pattern) {
        const patternMap = {
            '/new SessionSDK\\(\\{/': 'SessionSDK 초기화',
            '/sdk\\.on\\(\'connected\'/': 'connected 이벤트 리스너',
            '/sdk\\.on\\(\'session-created\'/': 'session-created 이벤트 리스너',
            '/sdk\\.on\\(\'sensor-data\'/': 'sensor-data 이벤트 리스너',
            '/event\\.detail \\|\\| event/': 'CustomEvent 처리 패턴',
            '/createSession\\(\\)/': '세션 생성 호출',
            '/QRCodeGenerator/': 'QR 코드 생성',
            '/requestAnimationFrame/': '애니메이션 루프',
            '/getContext\\(\'2d\'\\)/': '캔버스 2D 컨텍스트'
        };

        const patternStr = pattern.toString();
        return patternMap[patternStr] || patternStr;
    }

    /**
     * 등급 계산
     */
    calculateGrade(score) {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B+';
        if (score >= 60) return 'B';
        if (score >= 50) return 'C';
        return 'F';
    }

    /**
     * 검증 보고서 생성
     */
    generateReport(validationResult) {
        const { gameId, score, grade, errors, warnings, suggestions } = validationResult;
        
        let report = `
🎮 게임 검증 보고서: ${gameId}
==================================

📊 총점: ${score}/100 (등급: ${grade})
🎯 게임 상태: ${validationResult.isValid ? '✅ 플레이 가능' : '❌ 수정 필요'}

`;

        if (errors.length > 0) {
            report += `\n❌ 오류 (${errors.length}개):\n`;
            errors.forEach((error, index) => {
                report += `  ${index + 1}. ${error}\n`;
            });
        }

        if (warnings.length > 0) {
            report += `\n⚠️ 경고 (${warnings.length}개):\n`;
            warnings.forEach((warning, index) => {
                report += `  ${index + 1}. ${warning}\n`;
            });
        }

        if (suggestions.length > 0) {
            report += `\n💡 제안 및 개선사항 (${suggestions.length}개):\n`;
            suggestions.forEach((suggestion, index) => {
                report += `  ${index + 1}. ${suggestion}\n`;
            });
        }

        report += '\n==================================\n';

        return report;
    }
}

module.exports = GameValidator;