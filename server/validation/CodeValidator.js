/**
 * 🔍 코드 검증 시스템 v6.0
 *
 * 목적: AI가 생성한 게임 코드의 품질과 안전성을 자동으로 검증
 * 특징:
 * - 구문 검증 (HTML, CSS, JavaScript)
 * - SessionSDK 사용법 검증
 * - 센서 데이터 처리 로직 검증
 * - 성능 및 보안 검증
 * - 자동 수정 제안
 */

class CodeValidator {
    constructor() {
        this.validationRules = this.initializeValidationRules();
        this.securityRules = this.initializeSecurityRules();
        this.performanceRules = this.initializePerformanceRules();
        this.sessionSDKRules = this.initializeSessionSDKRules();
    }

    /**
     * 종합적인 코드 검증 실행
     */
    async validateGameCode(gameCode, gameType = 'solo') {
        console.log('🔍 코드 검증 시작:', gameType);

        const validationResult = {
            isValid: true,
            overallScore: 0,
            validationId: `validation_${Date.now()}`,
            gameType: gameType,
            timestamp: new Date().toISOString(),
            checks: {
                syntax: await this.validateSyntax(gameCode),
                structure: await this.validateStructure(gameCode),
                sessionSDK: await this.validateSessionSDK(gameCode),
                sensorHandling: await this.validateSensorHandling(gameCode),
                performance: await this.validatePerformance(gameCode),
                security: await this.validateSecurity(gameCode),
                accessibility: await this.validateAccessibility(gameCode)
            },
            suggestions: [],
            fixedCode: null,
            metadata: {
                codeLength: gameCode.length,
                complexityScore: this.calculateComplexity(gameCode),
                estimatedPerformance: this.estimatePerformance(gameCode)
            }
        };

        // 전체 점수 계산
        const scores = Object.values(validationResult.checks).map(check => check.score);
        validationResult.overallScore = Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length
        );

        // 전체 유효성 판단
        validationResult.isValid = validationResult.overallScore >= 80 &&
                                  !Object.values(validationResult.checks).some(check => check.critical);

        // 수정 제안 수집
        validationResult.suggestions = this.collectSuggestions(validationResult.checks);

        // 자동 수정 시도
        if (!validationResult.isValid) {
            validationResult.fixedCode = await this.attemptAutoFix(gameCode, validationResult.checks);
        }

        console.log('✅ 코드 검증 완료:', {
            score: validationResult.overallScore,
            isValid: validationResult.isValid,
            issues: validationResult.suggestions.length
        });

        return validationResult;
    }

    /**
     * 구문 검증 (HTML, CSS, JavaScript)
     */
    async validateSyntax(gameCode) {
        const result = {
            category: 'syntax',
            score: 100,
            issues: [],
            critical: false
        };

        try {
            // HTML 구조 검증
            const htmlIssues = this.validateHTMLSyntax(gameCode);
            result.issues.push(...htmlIssues);

            // CSS 문법 검증
            const cssIssues = this.validateCSSSyntax(gameCode);
            result.issues.push(...cssIssues);

            // JavaScript 문법 검증
            const jsIssues = this.validateJavaScriptSyntax(gameCode);
            result.issues.push(...jsIssues);

            // 점수 계산
            const criticalIssues = result.issues.filter(issue => issue.severity === 'critical').length;
            const majorIssues = result.issues.filter(issue => issue.severity === 'major').length;
            const minorIssues = result.issues.filter(issue => issue.severity === 'minor').length;

            result.score = Math.max(0, 100 - (criticalIssues * 30) - (majorIssues * 10) - (minorIssues * 5));
            result.critical = criticalIssues > 0;

        } catch (error) {
            result.issues.push({
                type: 'validation_error',
                severity: 'critical',
                message: `구문 검증 오류: ${error.message}`,
                line: 0
            });
            result.score = 0;
            result.critical = true;
        }

        return result;
    }

    /**
     * HTML 구조 검증
     */
    validateHTMLSyntax(gameCode) {
        const issues = [];

        // 기본 HTML 구조 확인
        if (!gameCode.includes('<!DOCTYPE html>')) {
            issues.push({
                type: 'missing_doctype',
                severity: 'major',
                message: 'DOCTYPE 선언이 누락되었습니다',
                line: 1
            });
        }

        if (!gameCode.includes('<html')) {
            issues.push({
                type: 'missing_html_tag',
                severity: 'critical',
                message: 'HTML 태그가 누락되었습니다',
                line: 1
            });
        }

        if (!gameCode.includes('<head>') || !gameCode.includes('</head>')) {
            issues.push({
                type: 'missing_head',
                severity: 'major',
                message: 'HEAD 태그가 누락되었습니다',
                line: 1
            });
        }

        if (!gameCode.includes('<body>') || !gameCode.includes('</body>')) {
            issues.push({
                type: 'missing_body',
                severity: 'critical',
                message: 'BODY 태그가 누락되었습니다',
                line: 1
            });
        }

        // 필수 메타 태그 확인
        if (!gameCode.includes('charset=')) {
            issues.push({
                type: 'missing_charset',
                severity: 'major',
                message: '문자 인코딩 선언이 누락되었습니다',
                line: 1
            });
        }

        if (!gameCode.includes('viewport')) {
            issues.push({
                type: 'missing_viewport',
                severity: 'minor',
                message: '뷰포트 메타 태그가 누락되었습니다',
                line: 1
            });
        }

        // 게임 필수 요소 확인
        if (!gameCode.includes('<canvas')) {
            issues.push({
                type: 'missing_canvas',
                severity: 'major',
                message: '게임 캔버스가 누락되었습니다',
                line: 1
            });
        }

        return issues;
    }

    /**
     * CSS 문법 검증
     */
    validateCSSSyntax(gameCode) {
        const issues = [];

        // CSS 블록 추출
        const cssMatches = gameCode.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);

        if (!cssMatches) {
            issues.push({
                type: 'missing_styles',
                severity: 'minor',
                message: 'CSS 스타일이 정의되지 않았습니다',
                line: 1
            });
            return issues;
        }

        cssMatches.forEach((cssBlock, index) => {
            const css = cssBlock.replace(/<\/?style[^>]*>/gi, '');

            // 기본 CSS 문법 검증
            const openBraces = (css.match(/\{/g) || []).length;
            const closeBraces = (css.match(/\}/g) || []).length;

            if (openBraces !== closeBraces) {
                issues.push({
                    type: 'css_brace_mismatch',
                    severity: 'critical',
                    message: `CSS 블록 ${index + 1}에서 중괄호가 일치하지 않습니다`,
                    line: this.findLineNumber(gameCode, cssBlock)
                });
            }

            // 필수 스타일 확인
            if (!css.includes('box-sizing')) {
                issues.push({
                    type: 'missing_box_sizing',
                    severity: 'minor',
                    message: 'box-sizing 속성이 권장됩니다',
                    line: this.findLineNumber(gameCode, cssBlock)
                });
            }
        });

        return issues;
    }

    /**
     * JavaScript 문법 검증
     */
    validateJavaScriptSyntax(gameCode) {
        const issues = [];

        // JavaScript 블록 추출
        const jsMatches = gameCode.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);

        if (!jsMatches) {
            issues.push({
                type: 'missing_scripts',
                severity: 'critical',
                message: 'JavaScript 코드가 누락되었습니다',
                line: 1
            });
            return issues;
        }

        jsMatches.forEach((jsBlock, index) => {
            const js = jsBlock.replace(/<\/?script[^>]*>/gi, '');

            // 기본 JavaScript 문법 검증
            try {
                // Function 생성자로 문법 체크
                new Function(js);
            } catch (error) {
                issues.push({
                    type: 'js_syntax_error',
                    severity: 'critical',
                    message: `JavaScript 문법 오류: ${error.message}`,
                    line: this.findLineNumber(gameCode, jsBlock)
                });
            }

            // 중괄호 균형 검사
            const openBraces = (js.match(/\{/g) || []).length;
            const closeBraces = (js.match(/\}/g) || []).length;

            if (openBraces !== closeBraces) {
                issues.push({
                    type: 'js_brace_mismatch',
                    severity: 'critical',
                    message: `JavaScript 블록 ${index + 1}에서 중괄호가 일치하지 않습니다`,
                    line: this.findLineNumber(gameCode, jsBlock)
                });
            }

            // 괄호 균형 검사
            const openParens = (js.match(/\(/g) || []).length;
            const closeParens = (js.match(/\)/g) || []).length;

            if (openParens !== closeParens) {
                issues.push({
                    type: 'js_paren_mismatch',
                    severity: 'major',
                    message: `JavaScript 블록 ${index + 1}에서 괄호가 일치하지 않습니다`,
                    line: this.findLineNumber(gameCode, jsBlock)
                });
            }
        });

        return issues;
    }

    /**
     * SessionSDK 사용법 검증
     */
    async validateSessionSDK(gameCode) {
        const result = {
            category: 'sessionSDK',
            score: 100,
            issues: [],
            critical: false
        };

        // SessionSDK 로드 확인
        if (!gameCode.includes('SessionSDK.js')) {
            result.issues.push({
                type: 'missing_sdk_import',
                severity: 'critical',
                message: 'SessionSDK 스크립트가 로드되지 않았습니다',
                line: this.findSDKLine(gameCode)
            });
        }

        // SDK 초기화 확인
        if (!gameCode.includes('new SessionSDK')) {
            result.issues.push({
                type: 'missing_sdk_initialization',
                severity: 'critical',
                message: 'SessionSDK가 초기화되지 않았습니다',
                line: this.findSDKLine(gameCode)
            });
        }

        // 필수 이벤트 리스너 확인
        const requiredEvents = ['connected', 'session-created', 'sensor-data'];

        requiredEvents.forEach(event => {
            if (!gameCode.includes(`'${event}'`) && !gameCode.includes(`"${event}"`)) {
                result.issues.push({
                    type: 'missing_event_listener',
                    severity: 'major',
                    message: `필수 이벤트 리스너가 누락됨: ${event}`,
                    line: this.findSDKLine(gameCode)
                });
            }
        });

        // CustomEvent 패턴 확인
        if (gameCode.includes('sdk.on') && !gameCode.includes('event.detail')) {
            result.issues.push({
                type: 'missing_custom_event_pattern',
                severity: 'major',
                message: 'CustomEvent 패턴 (event.detail || event)이 누락되었습니다',
                line: this.findSDKLine(gameCode)
            });
        }

        // 점수 계산
        const criticalIssues = result.issues.filter(issue => issue.severity === 'critical').length;
        const majorIssues = result.issues.filter(issue => issue.severity === 'major').length;

        result.score = Math.max(0, 100 - (criticalIssues * 40) - (majorIssues * 15));
        result.critical = criticalIssues > 0;

        return result;
    }

    /**
     * 센서 데이터 처리 검증
     */
    async validateSensorHandling(gameCode) {
        const result = {
            category: 'sensorHandling',
            score: 100,
            issues: [],
            critical: false
        };

        // 센서 데이터 처리 함수 확인
        if (!gameCode.includes('sensor-data') && !gameCode.includes('processSensorData')) {
            result.issues.push({
                type: 'missing_sensor_handler',
                severity: 'critical',
                message: '센서 데이터 처리 로직이 누락되었습니다',
                line: 1
            });
        }

        // 센서 데이터 검증 확인
        const sensorFields = ['orientation', 'acceleration', 'rotationRate'];

        sensorFields.forEach(field => {
            if (gameCode.includes(field) && !gameCode.includes(`${field}.alpha`) &&
                !gameCode.includes(`${field}.x`) && !gameCode.includes(`${field}.beta`)) {
                result.issues.push({
                    type: 'incomplete_sensor_usage',
                    severity: 'minor',
                    message: `센서 필드 ${field}의 활용이 불완전합니다`,
                    line: this.findSensorLine(gameCode, field)
                });
            }
        });

        // 센서 데이터 안전성 확인
        if (gameCode.includes('data.data') && !gameCode.includes('data &&')) {
            result.issues.push({
                type: 'unsafe_sensor_access',
                severity: 'major',
                message: '센서 데이터 접근 시 안전성 검사가 필요합니다',
                line: this.findSensorLine(gameCode, 'data.data')
            });
        }

        // 점수 계산
        const criticalIssues = result.issues.filter(issue => issue.severity === 'critical').length;
        const majorIssues = result.issues.filter(issue => issue.severity === 'major').length;
        const minorIssues = result.issues.filter(issue => issue.severity === 'minor').length;

        result.score = Math.max(0, 100 - (criticalIssues * 50) - (majorIssues * 20) - (minorIssues * 5));
        result.critical = criticalIssues > 0;

        return result;
    }

    /**
     * 성능 검증
     */
    async validatePerformance(gameCode) {
        const result = {
            category: 'performance',
            score: 100,
            issues: [],
            critical: false
        };

        // requestAnimationFrame 사용 확인
        if (gameCode.includes('setInterval') && !gameCode.includes('requestAnimationFrame')) {
            result.issues.push({
                type: 'inefficient_animation',
                severity: 'major',
                message: 'setInterval 대신 requestAnimationFrame 사용을 권장합니다',
                line: this.findLineNumber(gameCode, 'setInterval')
            });
        }

        // 메모리 누수 방지 확인
        if (gameCode.includes('addEventListener') && !gameCode.includes('removeEventListener')) {
            result.issues.push({
                type: 'potential_memory_leak',
                severity: 'minor',
                message: '이벤트 리스너 정리 로직을 추가하는 것을 권장합니다',
                line: this.findLineNumber(gameCode, 'addEventListener')
            });
        }

        // Canvas 최적화 확인
        if (gameCode.includes('clearRect') && gameCode.includes('fillRect')) {
            const clearCount = (gameCode.match(/clearRect/g) || []).length;
            const drawCount = (gameCode.match(/fillRect|strokeRect|drawImage/g) || []).length;

            if (drawCount > clearCount * 10) {
                result.issues.push({
                    type: 'excessive_drawing',
                    severity: 'minor',
                    message: '과도한 그리기 작업이 감지되었습니다. 최적화를 고려하세요',
                    line: this.findLineNumber(gameCode, 'clearRect')
                });
            }
        }

        // 점수 계산
        const majorIssues = result.issues.filter(issue => issue.severity === 'major').length;
        const minorIssues = result.issues.filter(issue => issue.severity === 'minor').length;

        result.score = Math.max(0, 100 - (majorIssues * 20) - (minorIssues * 10));

        return result;
    }

    /**
     * 보안 검증
     */
    async validateSecurity(gameCode) {
        const result = {
            category: 'security',
            score: 100,
            issues: [],
            critical: false
        };

        // innerHTML 사용 검증
        if (gameCode.includes('innerHTML') && !gameCode.includes('escape')) {
            result.issues.push({
                type: 'unsafe_innerHTML',
                severity: 'major',
                message: 'innerHTML 사용 시 XSS 취약점에 주의하세요',
                line: this.findLineNumber(gameCode, 'innerHTML')
            });
        }

        // eval 사용 금지
        if (gameCode.includes('eval(')) {
            result.issues.push({
                type: 'dangerous_eval',
                severity: 'critical',
                message: 'eval() 함수 사용은 보안상 위험합니다',
                line: this.findLineNumber(gameCode, 'eval(')
            });
        }

        // 외부 스크립트 확인
        const externalScripts = gameCode.match(/src=["']https?:\/\/[^"']+["']/g);
        if (externalScripts && externalScripts.length > 2) {
            result.issues.push({
                type: 'excessive_external_scripts',
                severity: 'minor',
                message: '외부 스크립트가 많습니다. 필요한 것만 로드하세요',
                line: 1
            });
        }

        // 점수 계산
        const criticalIssues = result.issues.filter(issue => issue.severity === 'critical').length;
        const majorIssues = result.issues.filter(issue => issue.severity === 'major').length;
        const minorIssues = result.issues.filter(issue => issue.severity === 'minor').length;

        result.score = Math.max(0, 100 - (criticalIssues * 50) - (majorIssues * 25) - (minorIssues * 5));
        result.critical = criticalIssues > 0;

        return result;
    }

    /**
     * 접근성 검증
     */
    async validateAccessibility(gameCode) {
        const result = {
            category: 'accessibility',
            score: 100,
            issues: [],
            critical: false
        };

        // alt 속성 확인
        const images = gameCode.match(/<img[^>]*>/g);
        if (images) {
            images.forEach(img => {
                if (!img.includes('alt=')) {
                    result.issues.push({
                        type: 'missing_alt_text',
                        severity: 'minor',
                        message: '이미지에 alt 속성이 누락되었습니다',
                        line: this.findLineNumber(gameCode, img)
                    });
                }
            });
        }

        // 키보드 네비게이션 확인
        if (!gameCode.includes('keydown') && !gameCode.includes('keyup')) {
            result.issues.push({
                type: 'no_keyboard_support',
                severity: 'minor',
                message: '키보드 네비게이션 지원을 고려하세요',
                line: 1
            });
        }

        // ARIA 레이블 확인
        if (gameCode.includes('<button') && !gameCode.includes('aria-label')) {
            result.issues.push({
                type: 'missing_aria_labels',
                severity: 'minor',
                message: '버튼에 ARIA 레이블 추가를 권장합니다',
                line: this.findLineNumber(gameCode, '<button')
            });
        }

        // 점수 계산
        const minorIssues = result.issues.filter(issue => issue.severity === 'minor').length;
        result.score = Math.max(0, 100 - (minorIssues * 5));

        return result;
    }

    /**
     * 자동 수정 시도
     */
    async attemptAutoFix(gameCode, checks) {
        let fixedCode = gameCode;

        // 중요한 문제들에 대한 자동 수정
        Object.values(checks).forEach(check => {
            check.issues.forEach(issue => {
                switch (issue.type) {
                    case 'missing_doctype':
                        if (!fixedCode.startsWith('<!DOCTYPE html>')) {
                            fixedCode = '<!DOCTYPE html>\n' + fixedCode;
                        }
                        break;

                    case 'missing_charset':
                        if (!fixedCode.includes('charset=')) {
                            fixedCode = fixedCode.replace(
                                '<head>',
                                '<head>\n    <meta charset="UTF-8">'
                            );
                        }
                        break;

                    case 'missing_viewport':
                        if (!fixedCode.includes('viewport')) {
                            fixedCode = fixedCode.replace(
                                '<meta charset="UTF-8">',
                                '<meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
                            );
                        }
                        break;

                    case 'missing_custom_event_pattern':
                        fixedCode = fixedCode.replace(
                            /sdk\.on\(['"]([^'"]+)['"],\s*\([^)]*\)\s*=>\s*{/g,
                            (match, eventName) => {
                                return match.replace('(', '(event) => {\n            const data = event.detail || event;');
                            }
                        );
                        break;
                }
            });
        });

        return fixedCode === gameCode ? null : fixedCode;
    }

    /**
     * 유틸리티 메소드들
     */
    findLineNumber(code, searchString) {
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(searchString)) {
                return i + 1;
            }
        }
        return 1;
    }

    findSDKLine(code) {
        return this.findLineNumber(code, 'SessionSDK') || this.findLineNumber(code, 'sdk');
    }

    findSensorLine(code, field) {
        return this.findLineNumber(code, field);
    }

    calculateComplexity(code) {
        const indicators = [
            (code.match(/function/g) || []).length * 2,
            (code.match(/class/g) || []).length * 3,
            (code.match(/if|else|while|for/g) || []).length,
            (code.match(/try|catch/g) || []).length * 2
        ];
        return indicators.reduce((sum, val) => sum + val, 0);
    }

    estimatePerformance(code) {
        const animationFrames = (code.match(/requestAnimationFrame/g) || []).length;
        const intervals = (code.match(/setInterval/g) || []).length;
        const canvasOps = (code.match(/fillRect|strokeRect|drawImage/g) || []).length;

        if (intervals > animationFrames) return 'poor';
        if (canvasOps > 50) return 'heavy';
        if (animationFrames > 0) return 'good';
        return 'basic';
    }

    collectSuggestions(checks) {
        const suggestions = [];

        Object.values(checks).forEach(check => {
            check.issues.forEach(issue => {
                suggestions.push({
                    category: check.category,
                    severity: issue.severity,
                    message: issue.message,
                    type: issue.type,
                    line: issue.line
                });
            });
        });

        return suggestions.sort((a, b) => {
            const severityOrder = { critical: 3, major: 2, minor: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    }

    /**
     * 검증 규칙 초기화 메소드들
     */
    initializeValidationRules() {
        return {
            htmlRequired: ['<!DOCTYPE html>', '<html', '<head>', '<body>', '<canvas'],
            cssRequired: ['box-sizing', 'margin', 'padding'],
            jsRequired: ['SessionSDK', 'canvas', 'getContext']
        };
    }

    initializeSecurityRules() {
        return {
            forbidden: ['eval(', 'innerHTML', 'document.write'],
            suspicious: ['onclick=', 'onload=', 'javascript:']
        };
    }

    initializePerformanceRules() {
        return {
            preferred: ['requestAnimationFrame'],
            discouraged: ['setInterval', 'setTimeout'],
            limits: { canvasOperations: 100, eventListeners: 20 }
        };
    }

    initializeSessionSDKRules() {
        return {
            requiredEvents: ['connected', 'session-created', 'sensor-data'],
            requiredPatterns: ['event.detail || event'],
            requiredMethods: ['createSession', 'on']
        };
    }
}

module.exports = CodeValidator;