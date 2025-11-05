/**
 * 에러 감지 및 자동 수정 엔진
 * - 실시간 코드 오류 감지
 * - 자동 수정 알고리즘
 * - 오류 패턴 학습 및 개선
 * - 수정 이력 추적
 */

const { JSDOM } = require('jsdom');

class ErrorDetectionEngine {
    constructor() {
        this.version = "1.0.0";
        this.errorPatterns = new Map();
        this.fixPatterns = new Map();
        this.detectionHistory = [];
        this.successfulFixes = [];

        // 초기 에러 패턴 및 수정 규칙 로드
        this.initializeErrorPatterns();
        this.initializeFixPatterns();

        console.log('🔍 ErrorDetectionEngine v1.0 초기화 완료');
    }

    /**
     * 초기 에러 패턴 정의
     */
    initializeErrorPatterns() {
        // JavaScript 문법 오류 패턴
        this.errorPatterns.set('syntax_error', {
            patterns: [
                /SyntaxError: Unexpected token/,
                /SyntaxError: Invalid or unexpected token/,
                /SyntaxError: Unexpected end of input/,
                /SyntaxError: Missing \) after argument list/,
                /SyntaxError: Missing \} after function body/
            ],
            severity: 'critical',
            category: 'syntax',
            description: 'JavaScript 문법 오류'
        });

        // SessionSDK 관련 오류
        this.errorPatterns.set('sessionsdk_error', {
            patterns: [
                /SessionSDK is not defined/,
                /Cannot read property 'on' of undefined/,
                /sdk\.createSession is not a function/,
                /event\.detail is undefined/
            ],
            severity: 'critical',
            category: 'framework',
            description: 'SessionSDK 사용 오류'
        });

        // Canvas 관련 오류
        this.errorPatterns.set('canvas_error', {
            patterns: [
                /Cannot read property 'getContext' of null/,
                /Canvas context is null/,
                /canvas\.width is not defined/,
                /ctx\.fillRect is not a function/
            ],
            severity: 'high',
            category: 'canvas',
            description: 'Canvas 처리 오류'
        });

        // 센서 데이터 관련 오류
        this.errorPatterns.set('sensor_error', {
            patterns: [
                /Cannot read property 'orientation' of undefined/,
                /data\.acceleration is undefined/,
                /Invalid sensor data format/,
                /gamma is not defined/
            ],
            severity: 'high',
            category: 'sensor',
            description: '센서 데이터 처리 오류'
        });

        // 게임 로직 오류
        this.errorPatterns.set('gamelogic_error', {
            patterns: [
                /player is not defined/,
                /Cannot read property 'x' of undefined/,
                /update is not a function/,
                /render is not a function/,
                /collision detection failed/
            ],
            severity: 'medium',
            category: 'gamelogic',
            description: '게임 로직 오류'
        });

        // 이벤트 처리 오류
        this.errorPatterns.set('event_error', {
            patterns: [
                /addEventListener is not a function/,
                /Cannot read property 'preventDefault' of undefined/,
                /Event handler not found/,
                /onclick is not defined/
            ],
            severity: 'medium',
            category: 'event',
            description: '이벤트 처리 오류'
        });

        console.log(`📝 ${this.errorPatterns.size}개 에러 패턴 초기화 완료`);
    }

    /**
     * 자동 수정 패턴 정의
     */
    initializeFixPatterns() {
        // 문법 오류 수정
        this.fixPatterns.set('missing_semicolon', {
            pattern: /(\w+)\s*$/gm,
            fix: '$1;',
            description: '세미콜론 추가'
        });

        this.fixPatterns.set('missing_closing_brace', {
            pattern: /function\s+(\w+)\s*\([^)]*\)\s*\{[^}]*$/gm,
            fix: (match) => match + '\n}',
            description: '함수 닫는 괄호 추가'
        });

        // SessionSDK 오류 수정
        this.fixPatterns.set('sessionsdk_initialization', {
            pattern: /(?<!const\s+sdk\s*=\s*new\s+SessionSDK)/,
            fix: 'const sdk = new SessionSDK({\n    gameId: "generated-game",\n    gameType: "solo"\n});',
            description: 'SessionSDK 초기화 추가',
            location: 'script_start'
        });

        this.fixPatterns.set('event_detail_fix', {
            pattern: /event\.detail/g,
            fix: 'event.detail || event',
            description: 'CustomEvent 처리 패턴 수정'
        });

        // Canvas 오류 수정
        this.fixPatterns.set('canvas_null_check', {
            pattern: /const\s+canvas\s*=\s*document\.getElementById\(['"]([^'"]+)['"]\)/g,
            fix: 'const canvas = document.getElementById(\'$1\');\nif (!canvas) {\n    console.error(\'Canvas not found\');\n    return;\n}\nconst ctx = canvas.getContext(\'2d\');\nif (!ctx) {\n    console.error(\'Canvas context not available\');\n    return;\n}',
            description: 'Canvas null 체크 추가'
        });

        // 센서 데이터 오류 수정
        this.fixPatterns.set('sensor_data_validation', {
            pattern: /data\.orientation\.(\w+)/g,
            fix: 'data?.orientation?.${1} || 0',
            description: '센서 데이터 안전 접근'
        });

        this.fixPatterns.set('sensor_data_structure', {
            pattern: /function\s+processSensorData\s*\(\s*data\s*\)/g,
            fix: `function processSensorData(data) {
    // 센서 데이터 검증
    if (!data || !data.data) {
        console.warn('Invalid sensor data received');
        return;
    }

    const { orientation = {}, acceleration = {}, rotationRate = {} } = data.data;
    const { alpha = 0, beta = 0, gamma = 0 } = orientation;`,
            description: '센서 데이터 구조 검증 추가'
        });

        // 게임 루프 수정
        this.fixPatterns.set('game_loop_structure', {
            pattern: /function\s+update\s*\(\s*\)/g,
            fix: `function update() {
    try {
        // 게임 로직 업데이트`,
            description: '게임 루프 에러 처리 추가'
        });

        this.fixPatterns.set('render_function_structure', {
            pattern: /function\s+render\s*\(\s*\)/g,
            fix: `function render() {
    try {
        if (!ctx) return;

        // 화면 클리어
        ctx.clearRect(0, 0, canvas.width, canvas.height);`,
            description: '렌더링 함수 안전성 추가'
        });

        console.log(`🔧 ${this.fixPatterns.size}개 수정 패턴 초기화 완료`);
    }

    /**
     * 게임 코드 오류 감지
     */
    async detectErrors(gameCode, gameType = 'solo') {
        const errors = [];
        const startTime = Date.now();

        try {
            console.log('🔍 에러 감지 시작...');

            // 1. 문법 오류 검사
            const syntaxErrors = await this.checkSyntaxErrors(gameCode);
            errors.push(...syntaxErrors);

            // 2. 런타임 오류 검사
            const runtimeErrors = await this.checkRuntimeErrors(gameCode);
            errors.push(...runtimeErrors);

            // 3. 프레임워크 특화 오류 검사
            const frameworkErrors = await this.checkFrameworkErrors(gameCode, gameType);
            errors.push(...frameworkErrors);

            // 4. 논리적 오류 검사
            const logicErrors = await this.checkLogicErrors(gameCode, gameType);
            errors.push(...logicErrors);

            // 5. 성능 이슈 검사
            const performanceIssues = await this.checkPerformanceIssues(gameCode);
            errors.push(...performanceIssues);

            const detectionTime = Date.now() - startTime;

            const result = {
                errors: errors,
                errorCount: errors.length,
                detectionTime: detectionTime,
                severity: this.calculateSeverityLevel(errors),
                categories: this.groupErrorsByCategory(errors),
                recommendations: this.generateRecommendations(errors),
                timestamp: new Date().toISOString()
            };

            // 감지 이력 저장
            this.detectionHistory.push({
                timestamp: Date.now(),
                gameType: gameType,
                errorCount: errors.length,
                detectionTime: detectionTime,
                errors: errors.map(e => ({
                    type: e.type,
                    severity: e.severity,
                    line: e.line
                }))
            });

            console.log(`✅ 에러 감지 완료: ${errors.length}개 오류 발견 (${detectionTime}ms)`);
            return result;

        } catch (error) {
            console.error('❌ 에러 감지 중 오류 발생:', error);
            return {
                errors: [{
                    type: 'detection_error',
                    message: '에러 감지 중 오류가 발생했습니다: ' + error.message,
                    severity: 'critical',
                    category: 'system'
                }],
                errorCount: 1,
                detectionTime: Date.now() - startTime
            };
        }
    }

    /**
     * 문법 오류 검사
     */
    async checkSyntaxErrors(code) {
        const errors = [];

        try {
            // JavaScript 문법 검사
            new Function(code);
        } catch (syntaxError) {
            const errorInfo = this.parseSyntaxError(syntaxError, code);
            if (errorInfo) {
                errors.push(errorInfo);
            }
        }

        // 추가 패턴 기반 문법 검사
        const lines = code.split('\n');
        lines.forEach((line, index) => {
            // 괄호 불일치 검사
            const openBraces = (line.match(/\{/g) || []).length;
            const closeBraces = (line.match(/\}/g) || []).length;
            const openParens = (line.match(/\(/g) || []).length;
            const closeParens = (line.match(/\)/g) || []).length;

            if (openBraces !== closeBraces && line.trim().endsWith('{')) {
                // 정상적인 함수 시작은 제외
            } else if (openParens > closeParens) {
                errors.push({
                    type: 'missing_closing_paren',
                    message: '닫는 괄호가 누락되었습니다',
                    line: index + 1,
                    column: line.length,
                    severity: 'high',
                    category: 'syntax',
                    code: 'SYNTAX_001'
                });
            }
        });

        return errors;
    }

    /**
     * 런타임 오류 검사
     */
    async checkRuntimeErrors(code) {
        const errors = [];

        try {
            // JSDOM을 사용한 런타임 환경 시뮬레이션
            const dom = new JSDOM(`
                <!DOCTYPE html>
                <html>
                <body>
                    <canvas id="gameCanvas" width="800" height="600"></canvas>
                    <script>
                        // SessionSDK 모의 객체
                        class SessionSDK {
                            constructor(config) {
                                this.config = config;
                                this.events = new Map();
                            }
                            on(event, handler) {
                                this.events.set(event, handler);
                            }
                            createSession() {
                                setTimeout(() => {
                                    const event = { detail: { code: '1234' } };
                                    const handler = this.events.get('session-created');
                                    if (handler) handler(event);
                                }, 100);
                            }
                        }

                        // 글로벌 객체 설정
                        window.SessionSDK = SessionSDK;

                        ${code}
                    </script>
                </body>
                </html>
            `, {
                runScripts: "dangerously",
                resources: "usable"
            });

            // 콘솔 에러 캡처
            const consoleErrors = [];
            dom.window.console.error = function(...args) {
                consoleErrors.push(args.join(' '));
            };

            // 런타임 실행 대기
            await new Promise(resolve => setTimeout(resolve, 500));

            // 캡처된 에러 분석
            consoleErrors.forEach(errorMsg => {
                const errorInfo = this.parseRuntimeError(errorMsg, code);
                if (errorInfo) {
                    errors.push(errorInfo);
                }
            });

        } catch (error) {
            errors.push({
                type: 'runtime_error',
                message: error.message,
                severity: 'high',
                category: 'runtime',
                code: 'RUNTIME_001'
            });
        }

        return errors;
    }

    /**
     * 프레임워크 특화 오류 검사
     */
    async checkFrameworkErrors(code, gameType) {
        const errors = [];

        // SessionSDK 사용 검사
        if (!code.includes('SessionSDK')) {
            errors.push({
                type: 'missing_sessionsdk',
                message: 'SessionSDK가 초기화되지 않았습니다',
                severity: 'critical',
                category: 'framework',
                code: 'FRAMEWORK_001',
                suggestion: 'const sdk = new SessionSDK({ gameId: "game", gameType: "' + gameType + '" }); 추가'
            });
        }

        // 이벤트 처리 패턴 검사
        if (code.includes('event.detail') && !code.includes('event.detail || event')) {
            errors.push({
                type: 'unsafe_event_access',
                message: 'CustomEvent 처리가 안전하지 않습니다',
                severity: 'medium',
                category: 'framework',
                code: 'FRAMEWORK_002',
                suggestion: 'event.detail || event 패턴 사용'
            });
        }

        // Canvas 초기화 검사
        if (code.includes('getContext') && !code.includes('if (!canvas)')) {
            errors.push({
                type: 'missing_canvas_check',
                message: 'Canvas null 체크가 누락되었습니다',
                severity: 'medium',
                category: 'framework',
                code: 'FRAMEWORK_003',
                suggestion: 'Canvas 요소 존재 여부 확인 추가'
            });
        }

        return errors;
    }

    /**
     * 논리적 오류 검사
     */
    async checkLogicErrors(code, gameType) {
        const errors = [];

        // 게임 루프 함수 검사
        const hasUpdate = code.includes('function update');
        const hasRender = code.includes('function render');
        const hasGameLoop = code.includes('setInterval') || code.includes('requestAnimationFrame');

        if (!hasUpdate && hasGameLoop) {
            errors.push({
                type: 'missing_update_function',
                message: 'update 함수가 정의되지 않았습니다',
                severity: 'high',
                category: 'gamelogic',
                code: 'LOGIC_001'
            });
        }

        if (!hasRender && hasGameLoop) {
            errors.push({
                type: 'missing_render_function',
                message: 'render 함수가 정의되지 않았습니다',
                severity: 'high',
                category: 'gamelogic',
                code: 'LOGIC_002'
            });
        }

        // 센서 데이터 처리 함수 검사
        if (code.includes('sensor-data') && !code.includes('processSensorData')) {
            errors.push({
                type: 'missing_sensor_handler',
                message: 'processSensorData 함수가 정의되지 않았습니다',
                severity: 'high',
                category: 'sensor',
                code: 'LOGIC_003'
            });
        }

        // 변수 초기화 검사
        const uninitializedVars = this.findUninitializedVariables(code);
        uninitializedVars.forEach(varName => {
            errors.push({
                type: 'uninitialized_variable',
                message: `변수 '${varName}'이 초기화되지 않았습니다`,
                severity: 'medium',
                category: 'gamelogic',
                code: 'LOGIC_004',
                variable: varName
            });
        });

        return errors;
    }

    /**
     * 성능 이슈 검사
     */
    async checkPerformanceIssues(code) {
        const errors = [];

        // 무한 루프 가능성 검사
        const whileLoops = code.match(/while\s*\([^)]*\)/g) || [];
        whileLoops.forEach(loop => {
            if (!loop.includes('break') && !loop.includes('return')) {
                errors.push({
                    type: 'potential_infinite_loop',
                    message: '무한 루프 가능성이 있습니다',
                    severity: 'medium',
                    category: 'performance',
                    code: 'PERF_001'
                });
            }
        });

        // 고빈도 함수 호출 검사
        if (code.includes('setInterval') && code.match(/setInterval.*[0-9]+.*ms/)) {
            const intervals = code.match(/setInterval\s*\([^,]*,\s*(\d+)\)/g) || [];
            intervals.forEach(interval => {
                const match = interval.match(/(\d+)/);
                if (match && parseInt(match[1]) < 16) {
                    errors.push({
                        type: 'high_frequency_interval',
                        message: '너무 빠른 간격의 setInterval이 사용되었습니다',
                        severity: 'low',
                        category: 'performance',
                        code: 'PERF_002'
                    });
                }
            });
        }

        return errors;
    }

    /**
     * 자동 오류 수정
     */
    async autoFixErrors(gameCode, detectedErrors) {
        let fixedCode = gameCode;
        const appliedFixes = [];
        const failedFixes = [];

        console.log(`🔧 ${detectedErrors.length}개 오류 자동 수정 시작...`);

        for (const error of detectedErrors) {
            try {
                const fixResult = await this.applyFix(fixedCode, error);

                if (fixResult.success) {
                    fixedCode = fixResult.code;
                    appliedFixes.push({
                        error: error,
                        fix: fixResult.fix,
                        description: fixResult.description
                    });
                    console.log(`✅ 수정 완료: ${error.type} - ${fixResult.description}`);
                } else {
                    failedFixes.push({
                        error: error,
                        reason: fixResult.reason
                    });
                    console.log(`❌ 수정 실패: ${error.type} - ${fixResult.reason}`);
                }
            } catch (fixError) {
                failedFixes.push({
                    error: error,
                    reason: fixError.message
                });
                console.error(`❌ 수정 중 오류: ${error.type}`, fixError);
            }
        }

        // 수정 후 재검증
        const revalidationResult = await this.detectErrors(fixedCode);

        const result = {
            originalCode: gameCode,
            fixedCode: fixedCode,
            appliedFixes: appliedFixes,
            failedFixes: failedFixes,
            fixCount: appliedFixes.length,
            remainingErrors: revalidationResult.errors,
            improvementRate: this.calculateImprovementRate(detectedErrors.length, revalidationResult.errors.length),
            timestamp: new Date().toISOString()
        };

        // 성공적인 수정 패턴 학습
        appliedFixes.forEach(fix => {
            this.successfulFixes.push({
                errorType: fix.error.type,
                fixPattern: fix.fix,
                timestamp: Date.now()
            });
        });

        console.log(`✅ 자동 수정 완료: ${appliedFixes.length}개 수정됨, ${failedFixes.length}개 실패`);
        return result;
    }

    /**
     * 개별 오류 수정 적용
     */
    async applyFix(code, error) {
        // 오류 타입별 수정 로직
        switch (error.type) {
            case 'missing_sessionsdk':
                return this.fixMissingSessionSDK(code, error);

            case 'unsafe_event_access':
                return this.fixUnsafeEventAccess(code, error);

            case 'missing_canvas_check':
                return this.fixMissingCanvasCheck(code, error);

            case 'missing_update_function':
                return this.fixMissingUpdateFunction(code, error);

            case 'missing_render_function':
                return this.fixMissingRenderFunction(code, error);

            case 'missing_sensor_handler':
                return this.fixMissingSensorHandler(code, error);

            case 'uninitialized_variable':
                return this.fixUninitializedVariable(code, error);

            case 'missing_closing_paren':
                return this.fixMissingParenthesis(code, error);

            default:
                return {
                    success: false,
                    reason: `알 수 없는 오류 타입: ${error.type}`
                };
        }
    }

    /**
     * SessionSDK 누락 수정
     */
    fixMissingSessionSDK(code, error) {
        const sdkInit = `
// SessionSDK 초기화
const sdk = new SessionSDK({
    gameId: 'generated-game',
    gameType: 'solo'
});

`;

        // script 태그 시작 부분에 추가
        const scriptStart = code.indexOf('<script>');
        if (scriptStart !== -1) {
            const insertPos = scriptStart + '<script>'.length;
            const fixedCode = code.slice(0, insertPos) + sdkInit + code.slice(insertPos);

            return {
                success: true,
                code: fixedCode,
                fix: 'sessionsdk_init',
                description: 'SessionSDK 초기화 코드 추가'
            };
        }

        return {
            success: false,
            reason: 'script 태그를 찾을 수 없습니다'
        };
    }

    /**
     * 안전하지 않은 이벤트 접근 수정
     */
    fixUnsafeEventAccess(code, error) {
        const fixedCode = code.replace(/event\.detail(?!\s*\|\|)/g, 'event.detail || event');

        return {
            success: true,
            code: fixedCode,
            fix: 'safe_event_access',
            description: 'CustomEvent 안전 접근 패턴 적용'
        };
    }

    /**
     * Canvas null 체크 누락 수정
     */
    fixMissingCanvasCheck(code, error) {
        const canvasPattern = /const\s+canvas\s*=\s*document\.getElementById\(['"]([^'"]+)['"]\);?\s*const\s+ctx\s*=\s*canvas\.getContext\(['"]2d['"]\);?/g;

        const fixedCode = code.replace(canvasPattern, (match, canvasId) => {
            return `const canvas = document.getElementById('${canvasId}');
if (!canvas) {
    console.error('Canvas element not found');
    return;
}

const ctx = canvas.getContext('2d');
if (!ctx) {
    console.error('Canvas 2D context not available');
    return;
}`;
        });

        return {
            success: fixedCode !== code,
            code: fixedCode,
            fix: 'canvas_null_check',
            description: 'Canvas null 체크 추가'
        };
    }

    /**
     * 통계 및 분석 메서드들
     */
    calculateSeverityLevel(errors) {
        const severityWeights = { critical: 10, high: 5, medium: 2, low: 1 };
        const totalWeight = errors.reduce((sum, error) => sum + (severityWeights[error.severity] || 1), 0);

        if (totalWeight >= 20) return 'critical';
        if (totalWeight >= 10) return 'high';
        if (totalWeight >= 5) return 'medium';
        return 'low';
    }

    groupErrorsByCategory(errors) {
        const categories = {};
        errors.forEach(error => {
            const category = error.category || 'unknown';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(error);
        });
        return categories;
    }

    generateRecommendations(errors) {
        const recommendations = [];
        const categories = this.groupErrorsByCategory(errors);

        Object.keys(categories).forEach(category => {
            const categoryErrors = categories[category];
            switch (category) {
                case 'syntax':
                    recommendations.push('JavaScript 문법을 검토하고 IDE의 문법 검사 기능을 활용하세요.');
                    break;
                case 'framework':
                    recommendations.push('SessionSDK 사용법을 확인하고 공식 문서를 참조하세요.');
                    break;
                case 'sensor':
                    recommendations.push('센서 데이터 구조를 확인하고 안전한 접근 패턴을 사용하세요.');
                    break;
                case 'gamelogic':
                    recommendations.push('게임 루프 구조를 검토하고 필수 함수들이 정의되었는지 확인하세요.');
                    break;
            }
        });

        return recommendations;
    }

    calculateImprovementRate(originalCount, remainingCount) {
        if (originalCount === 0) return 100;
        return Math.round(((originalCount - remainingCount) / originalCount) * 100);
    }

    /**
     * 유틸리티 메서드들
     */
    parseSyntaxError(error, code) {
        const lines = code.split('\n');
        const message = error.message;

        // 라인 번호 추출 시도
        const lineMatch = message.match(/line (\d+)/);
        const line = lineMatch ? parseInt(lineMatch[1]) : 1;

        return {
            type: 'syntax_error',
            message: message,
            line: line,
            severity: 'critical',
            category: 'syntax',
            code: 'SYNTAX_001'
        };
    }

    parseRuntimeError(errorMsg, code) {
        if (errorMsg.includes('is not defined')) {
            const match = errorMsg.match(/(\w+) is not defined/);
            if (match) {
                return {
                    type: 'undefined_variable',
                    message: `변수 '${match[1]}'이 정의되지 않았습니다`,
                    variable: match[1],
                    severity: 'high',
                    category: 'runtime',
                    code: 'RUNTIME_002'
                };
            }
        }
        return null;
    }

    findUninitializedVariables(code) {
        const variables = [];
        const lines = code.split('\n');

        lines.forEach(line => {
            // 간단한 변수 사용 패턴 검사 (실제로는 더 정교한 분석 필요)
            const usageMatch = line.match(/(\w+)\s*\.\s*\w+/);
            if (usageMatch && !line.includes('const') && !line.includes('let') && !line.includes('var')) {
                const varName = usageMatch[1];
                if (!['console', 'document', 'window', 'Math', 'Date'].includes(varName)) {
                    variables.push(varName);
                }
            }
        });

        return [...new Set(variables)]; // 중복 제거
    }

    /**
     * 시스템 상태 조회
     */
    getSystemStatus() {
        return {
            version: this.version,
            errorPatterns: this.errorPatterns.size,
            fixPatterns: this.fixPatterns.size,
            detectionHistory: this.detectionHistory.length,
            successfulFixes: this.successfulFixes.length,
            lastDetection: this.detectionHistory.length > 0
                ? this.detectionHistory[this.detectionHistory.length - 1]
                : null
        };
    }

    /**
     * 통계 조회
     */
    getStatistics() {
        const recentDetections = this.detectionHistory.slice(-100);

        return {
            totalDetections: this.detectionHistory.length,
            averageErrorsPerDetection: recentDetections.length > 0
                ? recentDetections.reduce((sum, d) => sum + d.errorCount, 0) / recentDetections.length
                : 0,
            averageDetectionTime: recentDetections.length > 0
                ? recentDetections.reduce((sum, d) => sum + d.detectionTime, 0) / recentDetections.length
                : 0,
            successfulFixRate: this.successfulFixes.length > 0
                ? (this.successfulFixes.length / this.detectionHistory.length) * 100
                : 0,
            errorCategoryDistribution: this.getErrorCategoryDistribution()
        };
    }

    getErrorCategoryDistribution() {
        const distribution = {};
        this.detectionHistory.forEach(detection => {
            detection.errors.forEach(error => {
                const category = error.category || 'unknown';
                distribution[category] = (distribution[category] || 0) + 1;
            });
        });
        return distribution;
    }
}

module.exports = ErrorDetectionEngine;