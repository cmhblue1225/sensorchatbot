/**
 * ⚡ CodeExecutionEngine v1.0
 *
 * 코드 생성 및 실행 기능
 * - 안전한 코드 실행 환경
 * - 다양한 언어 지원
 * - 실시간 결과 피드백
 * - 보안 샌드박스 환경
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const vm = require('vm');

class CodeExecutionEngine {
    constructor(options = {}) {
        this.config = {
            timeout: options.timeout || 30000, // 30초
            memoryLimit: options.memoryLimit || 128, // MB
            tempDir: options.tempDir || path.join(__dirname, '../tmp'),
            allowedLanguages: options.allowedLanguages || ['javascript', 'html', 'css'],
            maxFileSize: options.maxFileSize || 1024 * 1024, // 1MB
            securityLevel: options.securityLevel || 'strict',
            ...options
        };

        // 실행 통계
        this.stats = {
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            averageExecutionTime: 0,
            languageUsage: new Map(),
            securityBlocks: 0
        };

        // 보안 정책
        this.securityPolicies = {
            blockedModules: ['fs', 'child_process', 'os', 'path', 'http', 'https', 'net'],
            blockedGlobals: ['process', 'global', 'Buffer'],
            blockedPatterns: [
                /require\s*\(/g,
                /import\s+.*from/g,
                /eval\s*\(/g,
                /Function\s*\(/g,
                /setTimeout|setInterval/g,
                /XMLHttpRequest|fetch/g
            ]
        };

        this.initialize();
    }

    /**
     * 코드 실행 엔진 초기화
     */
    async initialize() {
        try {
            console.log('⚡ CodeExecutionEngine 초기화 중...');

            // 임시 디렉토리 생성
            await this.ensureTempDirectory();

            // 실행 환경 설정
            await this.setupExecutionEnvironments();

            console.log('✅ CodeExecutionEngine 초기화 완료');
        } catch (error) {
            console.error('❌ CodeExecutionEngine 초기화 실패:', error);
        }
    }

    /**
     * 코드 실행 (메인 인터페이스)
     */
    async executeCode(code, language, options = {}) {
        const executionId = this.generateExecutionId();
        const startTime = Date.now();

        try {
            console.log(`🔧 코드 실행 시작: ${executionId} (${language})`);

            // 보안 검사
            const securityCheck = await this.performSecurityCheck(code, language);
            if (!securityCheck.passed) {
                throw new Error(`보안 정책 위반: ${securityCheck.reason}`);
            }

            // 언어별 실행
            let result;
            switch (language.toLowerCase()) {
                case 'javascript':
                case 'js':
                    result = await this.executeJavaScript(code, options);
                    break;
                case 'html':
                    result = await this.executeHTML(code, options);
                    break;
                case 'css':
                    result = await this.executeCSS(code, options);
                    break;
                case 'game':
                    result = await this.executeGameCode(code, options);
                    break;
                default:
                    throw new Error(`지원되지 않는 언어: ${language}`);
            }

            const executionTime = Date.now() - startTime;

            // 통계 업데이트
            this.updateStats(language, executionTime, true);

            return {
                success: true,
                executionId,
                result,
                executionTime,
                language,
                timestamp: Date.now()
            };

        } catch (error) {
            const executionTime = Date.now() - startTime;

            // 통계 업데이트
            this.updateStats(language, executionTime, false);

            console.error(`❌ 코드 실행 실패 (${executionId}):`, error);

            return {
                success: false,
                executionId,
                error: error.message,
                executionTime,
                language,
                timestamp: Date.now()
            };
        }
    }

    /**
     * JavaScript 코드 실행
     */
    async executeJavaScript(code, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                // 샌드박스 컨텍스트 생성
                const sandbox = this.createJavaScriptSandbox(options);

                // 코드 실행 타임아웃 설정
                const timeout = setTimeout(() => {
                    reject(new Error('실행 시간 초과'));
                }, this.config.timeout);

                try {
                    // VM에서 안전하게 실행
                    const result = vm.runInNewContext(code, sandbox, {
                        timeout: this.config.timeout,
                        displayErrors: true,
                        breakOnSigint: true
                    });

                    clearTimeout(timeout);
                    resolve({
                        output: result,
                        logs: sandbox.console.logs,
                        errors: sandbox.console.errors
                    });

                } catch (error) {
                    clearTimeout(timeout);
                    reject(error);
                }

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * HTML 코드 실행 (정적 분석 및 프리뷰 생성)
     */
    async executeHTML(code, options = {}) {
        try {
            // HTML 구조 분석
            const analysis = this.analyzeHTML(code);

            // 안전한 HTML 생성
            const sanitizedHTML = this.sanitizeHTML(code);

            // 프리뷰 파일 생성
            const previewFile = await this.createHTMLPreview(sanitizedHTML, options);

            return {
                analysis,
                previewFile,
                sanitizedHTML: sanitizedHTML.substring(0, 1000), // 처음 1000자만
                structure: this.extractHTMLStructure(code)
            };

        } catch (error) {
            throw new Error(`HTML 실행 실패: ${error.message}`);
        }
    }

    /**
     * CSS 코드 실행 (분석 및 검증)
     */
    async executeCSS(code, options = {}) {
        try {
            // CSS 구문 분석
            const analysis = this.analyzeCSS(code);

            // CSS 검증
            const validation = this.validateCSS(code);

            // CSS 최적화 제안
            const optimization = this.suggestCSSOptimizations(code);

            return {
                analysis,
                validation,
                optimization,
                properties: this.extractCSSProperties(code),
                selectors: this.extractCSSSelectors(code)
            };

        } catch (error) {
            throw new Error(`CSS 실행 실패: ${error.message}`);
        }
    }

    /**
     * 게임 코드 실행 (SessionSDK 기반)
     */
    async executeGameCode(code, options = {}) {
        try {
            // 게임 코드 분석
            const analysis = this.analyzeGameCode(code);

            // SessionSDK 사용 검증
            const sdkValidation = this.validateSessionSDKUsage(code);

            // 게임 파일 생성
            const gameFile = await this.createGameFile(code, options);

            // 게임 실행 테스트
            const testResult = await this.testGameExecution(gameFile);

            return {
                analysis,
                sdkValidation,
                gameFile,
                testResult,
                gameType: this.detectGameType(code),
                features: this.extractGameFeatures(code)
            };

        } catch (error) {
            throw new Error(`게임 코드 실행 실패: ${error.message}`);
        }
    }

    /**
     * JavaScript 샌드박스 생성
     */
    createJavaScriptSandbox(options = {}) {
        const logs = [];
        const errors = [];

        const sandbox = {
            // 기본 JavaScript 객체들
            Array, Object, String, Number, Boolean, Date, Math, JSON, RegExp,

            // 안전한 console 구현
            console: {
                log: (...args) => logs.push(args.join(' ')),
                error: (...args) => errors.push(args.join(' ')),
                warn: (...args) => logs.push(`WARNING: ${args.join(' ')}`),
                info: (...args) => logs.push(`INFO: ${args.join(' ')}`),
                logs,
                errors
            },

            // SessionSDK 모의 객체 (게임 개발용)
            SessionSDK: this.createMockSessionSDK(),

            // 제한된 setTimeout (짧은 시간만)
            setTimeout: (fn, delay) => {
                if (delay > 1000) throw new Error('setTimeout 지연 시간이 너무 깁니다 (최대 1초)');
                return setTimeout(fn, delay);
            },

            // 사용자 정의 추가 객체
            ...options.additionalGlobals
        };

        // 위험한 객체들 차단
        this.securityPolicies.blockedGlobals.forEach(global => {
            delete sandbox[global];
        });

        return sandbox;
    }

    /**
     * 모의 SessionSDK 생성
     */
    createMockSessionSDK() {
        return {
            on: (event, callback) => {
                console.log(`SessionSDK.on('${event}') 호출됨`);
                // 모의 이벤트 발생
                setTimeout(() => {
                    if (event === 'connected') {
                        callback();
                    } else if (event === 'sensor-data') {
                        callback({
                            sensorId: 'test-sensor',
                            data: {
                                orientation: { alpha: 0, beta: 0, gamma: 0 },
                                acceleration: { x: 0, y: 0, z: 0 },
                                rotationRate: { alpha: 0, beta: 0, gamma: 0 }
                            }
                        });
                    }
                }, 100);
            },

            createSession: () => {
                console.log('SessionSDK.createSession() 호출됨');
                return Promise.resolve({
                    sessionCode: '1234',
                    qrCode: 'mock-qr-code'
                });
            },

            emit: (event, data) => {
                console.log(`SessionSDK.emit('${event}') 호출됨:`, data);
            }
        };
    }

    /**
     * 보안 검사 수행
     */
    async performSecurityCheck(code, language) {
        const checks = {
            passed: true,
            reason: null,
            violations: []
        };

        try {
            // 파일 크기 검사
            if (code.length > this.config.maxFileSize) {
                checks.passed = false;
                checks.reason = '코드 길이가 제한을 초과했습니다';
                return checks;
            }

            // 위험한 패턴 검사
            for (const pattern of this.securityPolicies.blockedPatterns) {
                if (pattern.test(code)) {
                    checks.violations.push(`위험한 패턴 감지: ${pattern}`);
                }
            }

            // JavaScript 특별 검사
            if (language === 'javascript') {
                // 모듈 가져오기 검사
                for (const module of this.securityPolicies.blockedModules) {
                    if (code.includes(`require('${module}')`)) {
                        checks.violations.push(`차단된 모듈 사용: ${module}`);
                    }
                }

                // 전역 객체 접근 검사
                for (const global of this.securityPolicies.blockedGlobals) {
                    if (new RegExp(`\\b${global}\\b`).test(code)) {
                        checks.violations.push(`차단된 전역 객체 접근: ${global}`);
                    }
                }
            }

            // 위반 사항이 있으면 차단
            if (checks.violations.length > 0) {
                checks.passed = false;
                checks.reason = checks.violations.join(', ');
                this.stats.securityBlocks++;
            }

            return checks;

        } catch (error) {
            checks.passed = false;
            checks.reason = `보안 검사 오류: ${error.message}`;
            return checks;
        }
    }

    /**
     * HTML 분석
     */
    analyzeHTML(code) {
        return {
            hasDoctype: /<!DOCTYPE/i.test(code),
            hasHtmlTag: /<html/i.test(code),
            hasHeadTag: /<head/i.test(code),
            hasBodyTag: /<body/i.test(code),
            scriptTags: (code.match(/<script[^>]*>/gi) || []).length,
            styleTags: (code.match(/<style[^>]*>/gi) || []).length,
            elementCount: (code.match(/<[^\/][^>]*>/g) || []).length,
            hasCanvas: /<canvas/i.test(code),
            hasSessionSDK: /SessionSDK/i.test(code)
        };
    }

    /**
     * CSS 분석
     */
    analyzeCSS(code) {
        return {
            ruleCount: (code.match(/[^{}]*{[^}]*}/g) || []).length,
            selectorCount: (code.match(/[^{,}]+(?={)/g) || []).length,
            propertyCount: (code.match(/[^:;{}]+:[^:;{}]+/g) || []).length,
            hasMediaQueries: /@media/i.test(code),
            hasKeyframes: /@keyframes/i.test(code),
            hasImports: /@import/i.test(code),
            hasVariables: /--[a-zA-Z-]+/g.test(code)
        };
    }

    /**
     * 게임 코드 분석
     */
    analyzeGameCode(code) {
        return {
            hasSessionSDK: /SessionSDK/i.test(code),
            hasCanvas: /canvas|ctx|getContext/i.test(code),
            hasGameLoop: /requestAnimationFrame|setInterval/i.test(code),
            hasSensorHandling: /sensor-data|orientation|acceleration/i.test(code),
            hasEventListeners: /addEventListener|on\(/i.test(code),
            gameStructure: this.detectGameStructure(code),
            complexity: this.calculateCodeComplexity(code)
        };
    }

    /**
     * HTML 프리뷰 생성
     */
    async createHTMLPreview(code, options = {}) {
        try {
            const fileName = `preview_${Date.now()}.html`;
            const filePath = path.join(this.config.tempDir, fileName);

            await fs.writeFile(filePath, code);

            return {
                fileName,
                filePath,
                url: `/tmp/${fileName}`,
                size: code.length
            };

        } catch (error) {
            throw new Error(`프리뷰 생성 실패: ${error.message}`);
        }
    }

    /**
     * 게임 파일 생성
     */
    async createGameFile(code, options = {}) {
        try {
            const gameId = options.gameId || `game_${Date.now()}`;
            const gameDir = path.join(this.config.tempDir, 'games', gameId);

            await fs.mkdir(gameDir, { recursive: true });

            // index.html 생성
            const htmlFile = path.join(gameDir, 'index.html');
            await fs.writeFile(htmlFile, code);

            // game.json 메타데이터 생성
            const metadata = {
                gameId,
                createdAt: Date.now(),
                gameType: this.detectGameType(code),
                features: this.extractGameFeatures(code)
            };

            const metadataFile = path.join(gameDir, 'game.json');
            await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));

            return {
                gameId,
                gameDir,
                htmlFile,
                metadataFile,
                url: `/tmp/games/${gameId}/index.html`
            };

        } catch (error) {
            throw new Error(`게임 파일 생성 실패: ${error.message}`);
        }
    }

    /**
     * 게임 실행 테스트
     */
    async testGameExecution(gameFile) {
        // 간단한 정적 테스트 (실제 브라우저 테스트는 복잡함)
        try {
            const code = await fs.readFile(gameFile.htmlFile, 'utf8');

            const tests = {
                hasSessionSDK: /SessionSDK/i.test(code),
                hasValidHTML: /<html/i.test(code) && /<\/html>/i.test(code),
                hasCanvas: /<canvas/i.test(code),
                hasScriptTag: /<script/i.test(code),
                noSyntaxErrors: await this.checkSyntaxErrors(code)
            };

            const passedTests = Object.values(tests).filter(Boolean).length;
            const totalTests = Object.keys(tests).length;

            return {
                tests,
                score: (passedTests / totalTests) * 100,
                passed: passedTests >= totalTests * 0.8 // 80% 이상 통과
            };

        } catch (error) {
            return {
                tests: {},
                score: 0,
                passed: false,
                error: error.message
            };
        }
    }

    /**
     * 임시 디렉토리 확인
     */
    async ensureTempDirectory() {
        await fs.mkdir(this.config.tempDir, { recursive: true });
        await fs.mkdir(path.join(this.config.tempDir, 'games'), { recursive: true });
    }

    /**
     * 실행 환경 설정
     */
    async setupExecutionEnvironments() {
        // 추후 Docker 또는 다른 샌드박스 환경 설정
        console.log('📦 실행 환경 설정 완료');
    }

    /**
     * 통계 업데이트
     */
    updateStats(language, executionTime, success) {
        this.stats.totalExecutions++;

        if (success) {
            this.stats.successfulExecutions++;
        } else {
            this.stats.failedExecutions++;
        }

        // 평균 실행 시간 업데이트
        this.stats.averageExecutionTime =
            (this.stats.averageExecutionTime * (this.stats.totalExecutions - 1) + executionTime) /
            this.stats.totalExecutions;

        // 언어별 사용량 업데이트
        this.stats.languageUsage.set(
            language,
            (this.stats.languageUsage.get(language) || 0) + 1
        );
    }

    /**
     * 유틸리티 메서드들
     */
    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    sanitizeHTML(html) {
        // 기본적인 HTML 새니타이징
        return html
            .replace(/<script[^>]*>.*?<\/script>/gis, '') // script 태그 제거
            .replace(/on\w+\s*=\s*"[^"]*"/gi, '') // 이벤트 핸들러 제거
            .replace(/javascript:/gi, ''); // javascript: 프로토콜 제거
    }

    detectGameType(code) {
        if (/dual|2명|two/i.test(code)) return 'dual';
        if (/multi|여러|multiple/i.test(code)) return 'multi';
        return 'solo';
    }

    extractGameFeatures(code) {
        const features = [];

        if (/canvas/i.test(code)) features.push('canvas');
        if (/audio|sound/i.test(code)) features.push('audio');
        if (/animation|requestAnimationFrame/i.test(code)) features.push('animation');
        if (/sensor-data/i.test(code)) features.push('sensor-input');
        if (/score|점수/i.test(code)) features.push('scoring');

        return features;
    }

    calculateCodeComplexity(code) {
        const lines = code.split('\n').length;
        const functions = (code.match(/function\s+\w+|=>\s*{|\w+\s*:\s*function/g) || []).length;
        const conditions = (code.match(/if\s*\(|switch\s*\(|while\s*\(|for\s*\(/g) || []).length;

        return {
            lines,
            functions,
            conditions,
            score: Math.min(100, (lines / 10) + (functions * 5) + (conditions * 3))
        };
    }

    async checkSyntaxErrors(code) {
        try {
            // HTML의 경우 기본적인 구문 검사
            const hasOpeningTags = code.match(/<[^\/][^>]*>/g) || [];
            const hasClosingTags = code.match(/<\/[^>]*>/g) || [];

            return hasOpeningTags.length >= hasClosingTags.length;
        } catch (error) {
            return false;
        }
    }

    /**
     * 실행 통계 조회
     */
    getExecutionStats() {
        return {
            ...this.stats,
            successRate: this.stats.totalExecutions > 0 ?
                (this.stats.successfulExecutions / this.stats.totalExecutions) * 100 : 0,
            languageUsage: Array.from(this.stats.languageUsage.entries())
        };
    }

    /**
     * 정리 및 종료
     */
    async cleanup() {
        try {
            // 임시 파일 정리 (24시간 이상 된 파일)
            const cutoff = Date.now() - (24 * 60 * 60 * 1000);
            const files = await fs.readdir(this.config.tempDir);

            for (const file of files) {
                const filePath = path.join(this.config.tempDir, file);
                const stat = await fs.stat(filePath);

                if (stat.mtime.getTime() < cutoff) {
                    await fs.unlink(filePath);
                }
            }

            console.log('🧹 CodeExecutionEngine 정리 완료');
        } catch (error) {
            console.error('❌ CodeExecutionEngine 정리 실패:', error);
        }
    }
}

module.exports = CodeExecutionEngine;