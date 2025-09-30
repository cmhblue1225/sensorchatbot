/**
 * 🔍 RealTimeDebugger v1.0
 *
 * 실시간 디버깅 지원 시스템
 * - 라이브 코드 분석
 * - 실시간 오류 감지
 * - 인터랙티브 디버깅 세션
 * - 자동 해결책 제안
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class RealTimeDebugger extends EventEmitter {
    constructor(codeExecutionEngine, options = {}) {
        super();

        this.codeExecutionEngine = codeExecutionEngine;

        this.config = {
            debugSessionTimeout: options.debugSessionTimeout || 1800000, // 30분
            maxBreakpoints: options.maxBreakpoints || 20,
            analysisInterval: options.analysisInterval || 5000, // 5초
            logRetentionTime: options.logRetentionTime || 86400000, // 24시간
            ...options
        };

        // 활성 디버깅 세션들
        this.activeSessions = new Map();

        // 오류 패턴 데이터베이스
        this.errorPatterns = new Map();

        // 해결책 데이터베이스
        this.solutionDatabase = new Map();

        // 디버깅 통계
        this.stats = {
            totalSessions: 0,
            activeSessionsCount: 0,
            errorsDetected: 0,
            errorsResolved: 0,
            averageResolutionTime: 0,
            commonErrors: new Map(),
            userSatisfaction: 0
        };

        this.initialize();
    }

    /**
     * 실시간 디버거 초기화
     */
    async initialize() {
        try {
            console.log('🔍 RealTimeDebugger 초기화 중...');

            // 오류 패턴 로드
            await this.loadErrorPatterns();

            // 해결책 데이터베이스 로드
            await this.loadSolutionDatabase();

            // 정기적 세션 정리 설정
            this.setupSessionCleanup();

            console.log('✅ RealTimeDebugger 초기화 완료');
        } catch (error) {
            console.error('❌ RealTimeDebugger 초기화 실패:', error);
        }
    }

    /**
     * 새로운 디버깅 세션 시작
     */
    startDebuggingSession(sessionId, code, language, options = {}) {
        const debugSession = {
            sessionId,
            debugId: this.generateDebugId(),
            language,
            code,
            startTime: Date.now(),
            lastActivity: Date.now(),

            // 디버깅 상태
            status: 'active',
            breakpoints: [],
            watchedVariables: [],
            executionTrace: [],

            // 발견된 문제들
            detectedIssues: [],
            resolvedIssues: [],

            // 실시간 분석 결과
            currentAnalysis: null,
            performanceMetrics: {
                executionTime: 0,
                memoryUsage: 0,
                errorCount: 0
            },

            // 사용자 인터랙션
            userActions: [],
            feedback: [],

            // 옵션
            autoAnalysis: options.autoAnalysis !== false,
            verboseLogging: options.verboseLogging || false,

            // 이벤트 핸들러
            eventHandlers: new Map()
        };

        this.activeSessions.set(sessionId, debugSession);
        this.stats.totalSessions++;
        this.stats.activeSessionsCount++;

        // 자동 분석 시작
        if (debugSession.autoAnalysis) {
            this.startAutoAnalysis(sessionId);
        }

        console.log(`🔍 디버깅 세션 시작: ${debugSession.debugId}`);

        this.emit('debug-session-started', {
            sessionId,
            debugId: debugSession.debugId,
            language,
            timestamp: Date.now()
        });

        return debugSession.debugId;
    }

    /**
     * 코드 실시간 분석
     */
    async analyzeCodeRealtime(sessionId, updatedCode) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('디버깅 세션을 찾을 수 없습니다');
        }

        session.code = updatedCode;
        session.lastActivity = Date.now();

        try {
            // 다중 분석 실행
            const analysisResults = await Promise.all([
                this.performSyntaxAnalysis(updatedCode, session.language),
                this.performSemanticAnalysis(updatedCode, session.language),
                this.performPerformanceAnalysis(updatedCode, session.language),
                this.performSecurityAnalysis(updatedCode, session.language),
                this.performSessionSDKAnalysis(updatedCode, session.language)
            ]);

            const combinedAnalysis = {
                timestamp: Date.now(),
                syntax: analysisResults[0],
                semantic: analysisResults[1],
                performance: analysisResults[2],
                security: analysisResults[3],
                sessionSDK: analysisResults[4],
                overallScore: this.calculateOverallScore(analysisResults)
            };

            session.currentAnalysis = combinedAnalysis;

            // 문제점 감지 및 해결책 제안
            const issues = this.detectIssues(combinedAnalysis, session);
            const solutions = await this.suggestSolutions(issues, session);

            // 새로 발견된 문제들 추가
            const newIssues = issues.filter(issue =>
                !session.detectedIssues.some(existing => existing.id === issue.id)
            );

            session.detectedIssues.push(...newIssues);
            this.stats.errorsDetected += newIssues.length;

            // 실시간 결과 반환
            const result = {
                sessionId,
                debugId: session.debugId,
                analysis: combinedAnalysis,
                newIssues,
                solutions,
                suggestions: this.generateRealTimeSuggestions(session),
                performanceMetrics: this.updatePerformanceMetrics(session)
            };

            this.emit('real-time-analysis', result);

            return result;

        } catch (error) {
            console.error(`❌ 실시간 분석 실패 (${sessionId}):`, error);
            throw error;
        }
    }

    /**
     * 구문 분석
     */
    async performSyntaxAnalysis(code, language) {
        const analysis = {
            errors: [],
            warnings: [],
            score: 100
        };

        try {
            switch (language.toLowerCase()) {
                case 'javascript':
                case 'js':
                    return this.analyzeSyntaxJavaScript(code);
                case 'html':
                    return this.analyzeSyntaxHTML(code);
                case 'css':
                    return this.analyzeSyntaxCSS(code);
                default:
                    return analysis;
            }
        } catch (error) {
            analysis.errors.push({
                type: 'syntax',
                message: `구문 분석 오류: ${error.message}`,
                line: 0,
                severity: 'error'
            });
            analysis.score = 0;
            return analysis;
        }
    }

    /**
     * JavaScript 구문 분석
     */
    analyzeSyntaxJavaScript(code) {
        const analysis = { errors: [], warnings: [], score: 100 };

        try {
            // 기본적인 구문 검사
            new Function(code);

            // 일반적인 실수 패턴 검사
            const commonIssues = [
                { pattern: /console\.log/, message: 'console.log 사용이 감지되었습니다', severity: 'info' },
                { pattern: /var\s+/, message: 'var 대신 let 또는 const 사용을 권장합니다', severity: 'warning' },
                { pattern: /==/, message: '=== 사용을 권장합니다', severity: 'warning' },
                { pattern: /function\s*\([^)]*\)\s*{[^}]*}/, message: '화살표 함수 사용을 고려해보세요', severity: 'info' }
            ];

            commonIssues.forEach((issue, index) => {
                const matches = code.match(issue.pattern);
                if (matches) {
                    analysis.warnings.push({
                        type: 'style',
                        message: issue.message,
                        line: this.findLineNumber(code, matches.index),
                        severity: issue.severity
                    });
                }
            });

        } catch (error) {
            analysis.errors.push({
                type: 'syntax',
                message: error.message,
                line: this.extractLineFromError(error.message),
                severity: 'error'
            });
            analysis.score = Math.max(0, 100 - (analysis.errors.length * 20));
        }

        return analysis;
    }

    /**
     * 의미 분석
     */
    async performSemanticAnalysis(code, language) {
        const analysis = {
            issues: [],
            suggestions: [],
            score: 100
        };

        if (language === 'javascript') {
            // 변수 사용 분석
            const variables = this.extractVariables(code);
            const unusedVars = this.findUnusedVariables(variables, code);

            unusedVars.forEach(varName => {
                analysis.issues.push({
                    type: 'unused-variable',
                    message: `사용되지 않는 변수: ${varName}`,
                    severity: 'warning'
                });
            });

            // 함수 복잡도 분석
            const complexity = this.calculateCyclomaticComplexity(code);
            if (complexity > 10) {
                analysis.issues.push({
                    type: 'complexity',
                    message: `함수 복잡도가 높습니다 (${complexity}). 리팩토링을 고려하세요`,
                    severity: 'warning'
                });
            }

            // SessionSDK 사용 패턴 분석
            const sdkUsage = this.analyzeSessionSDKUsage(code);
            if (sdkUsage.issues.length > 0) {
                analysis.issues.push(...sdkUsage.issues);
            }
        }

        analysis.score = Math.max(0, 100 - (analysis.issues.length * 10));
        return analysis;
    }

    /**
     * 성능 분석
     */
    async performPerformanceAnalysis(code, language) {
        const analysis = {
            metrics: {},
            bottlenecks: [],
            optimizations: [],
            score: 100
        };

        if (language === 'javascript') {
            // 성능 문제 패턴 검사
            const performanceIssues = [
                {
                    pattern: /document\.getElementById\(/g,
                    message: '반복적인 DOM 쿼리는 성능에 영향을 줄 수 있습니다. 변수에 저장하는 것을 고려하세요',
                    impact: 'medium'
                },
                {
                    pattern: /setInterval\(.*,\s*[0-9]+\)/g,
                    message: 'setInterval 사용시 메모리 누수에 주의하세요',
                    impact: 'medium'
                },
                {
                    pattern: /for\s*\([^)]*\)\s*{[^}]*for\s*\(/g,
                    message: '중첩된 반복문이 감지되었습니다. 성능 최적화를 고려하세요',
                    impact: 'high'
                }
            ];

            performanceIssues.forEach(issue => {
                const matches = code.match(issue.pattern);
                if (matches) {
                    analysis.bottlenecks.push({
                        type: 'performance',
                        message: issue.message,
                        impact: issue.impact,
                        occurrences: matches.length
                    });
                }
            });

            // 메모리 사용량 추정
            const codeSize = code.length;
            const estimatedMemory = this.estimateMemoryUsage(code);

            analysis.metrics = {
                codeSize,
                estimatedMemory,
                complexityScore: this.calculateComplexityScore(code)
            };
        }

        analysis.score = Math.max(0, 100 - (analysis.bottlenecks.length * 15));
        return analysis;
    }

    /**
     * 보안 분석
     */
    async performSecurityAnalysis(code, language) {
        const analysis = {
            vulnerabilities: [],
            recommendations: [],
            score: 100
        };

        const securityPatterns = [
            {
                pattern: /eval\s*\(/g,
                message: 'eval() 사용은 보안 위험이 있습니다',
                severity: 'high'
            },
            {
                pattern: /innerHTML\s*=/g,
                message: 'innerHTML 사용시 XSS 공격에 주의하세요',
                severity: 'medium'
            },
            {
                pattern: /document\.write\s*\(/g,
                message: 'document.write() 사용을 피하세요',
                severity: 'medium'
            }
        ];

        securityPatterns.forEach(pattern => {
            const matches = code.match(pattern.pattern);
            if (matches) {
                analysis.vulnerabilities.push({
                    type: 'security',
                    message: pattern.message,
                    severity: pattern.severity,
                    occurrences: matches.length
                });
            }
        });

        analysis.score = Math.max(0, 100 - (analysis.vulnerabilities.length * 20));
        return analysis;
    }

    /**
     * SessionSDK 분석
     */
    async performSessionSDKAnalysis(code, language) {
        const analysis = {
            usage: {},
            bestPractices: [],
            issues: [],
            score: 100
        };

        if (!code.includes('SessionSDK')) {
            return analysis;
        }

        // SessionSDK 사용 패턴 분석
        const patterns = {
            initialization: /new\s+SessionSDK\s*\(/g,
            eventListeners: /\.on\s*\(\s*['"`]([^'"`]+)['"`]/g,
            sessionCreation: /\.createSession\s*\(/g,
            sensorHandling: /sensor-data|orientation|acceleration|rotationRate/g
        };

        Object.entries(patterns).forEach(([key, pattern]) => {
            const matches = code.match(pattern);
            analysis.usage[key] = matches ? matches.length : 0;
        });

        // 권장 사항 확인
        const bestPractices = [
            {
                check: () => code.includes('sdk.on(\'connected\''),
                message: 'connected 이벤트 리스너 사용 확인됨 ✓',
                missing: 'connected 이벤트 리스너를 추가하세요'
            },
            {
                check: () => code.includes('event.detail || event'),
                message: 'CustomEvent 처리 패턴 사용 확인됨 ✓',
                missing: 'CustomEvent 처리를 위해 "event.detail || event" 패턴을 사용하세요'
            },
            {
                check: () => code.includes('createSession'),
                message: '세션 생성 코드 확인됨 ✓',
                missing: 'createSession() 호출을 추가하세요'
            }
        ];

        bestPractices.forEach(practice => {
            if (practice.check()) {
                analysis.bestPractices.push(practice.message);
            } else {
                analysis.issues.push({
                    type: 'sessionSDK',
                    message: practice.missing,
                    severity: 'warning'
                });
            }
        });

        analysis.score = Math.max(0, 100 - (analysis.issues.length * 15));
        return analysis;
    }

    /**
     * 문제 감지
     */
    detectIssues(analysisResults, session) {
        const issues = [];
        let issueId = 1;

        // 구문 오류
        if (analysisResults.syntax.errors.length > 0) {
            analysisResults.syntax.errors.forEach(error => {
                issues.push({
                    id: `${session.debugId}_issue_${issueId++}`,
                    type: 'syntax',
                    severity: 'error',
                    title: '구문 오류',
                    description: error.message,
                    line: error.line,
                    category: 'syntax',
                    timestamp: Date.now()
                });
            });
        }

        // 의미 분석 문제
        if (analysisResults.semantic.issues.length > 0) {
            analysisResults.semantic.issues.forEach(issue => {
                issues.push({
                    id: `${session.debugId}_issue_${issueId++}`,
                    type: 'semantic',
                    severity: issue.severity || 'warning',
                    title: '의미 분석 문제',
                    description: issue.message,
                    category: 'logic',
                    timestamp: Date.now()
                });
            });
        }

        // 성능 문제
        if (analysisResults.performance.bottlenecks.length > 0) {
            analysisResults.performance.bottlenecks.forEach(bottleneck => {
                issues.push({
                    id: `${session.debugId}_issue_${issueId++}`,
                    type: 'performance',
                    severity: bottleneck.impact === 'high' ? 'error' : 'warning',
                    title: '성능 문제',
                    description: bottleneck.message,
                    category: 'performance',
                    timestamp: Date.now()
                });
            });
        }

        // 보안 문제
        if (analysisResults.security.vulnerabilities.length > 0) {
            analysisResults.security.vulnerabilities.forEach(vuln => {
                issues.push({
                    id: `${session.debugId}_issue_${issueId++}`,
                    type: 'security',
                    severity: vuln.severity === 'high' ? 'error' : 'warning',
                    title: '보안 취약점',
                    description: vuln.message,
                    category: 'security',
                    timestamp: Date.now()
                });
            });
        }

        return issues;
    }

    /**
     * 해결책 제안
     */
    async suggestSolutions(issues, session) {
        const solutions = [];

        for (const issue of issues) {
            const solution = await this.findSolution(issue, session);
            if (solution) {
                solutions.push(solution);
            }
        }

        return solutions;
    }

    /**
     * 개별 해결책 찾기
     */
    async findSolution(issue, session) {
        // 해결책 데이터베이스에서 검색
        const solutionKey = `${issue.type}_${issue.category}`;
        const baseSolution = this.solutionDatabase.get(solutionKey);

        if (!baseSolution) {
            return this.generateGenericSolution(issue);
        }

        return {
            issueId: issue.id,
            title: baseSolution.title,
            description: baseSolution.description,
            steps: baseSolution.steps,
            codeExample: this.generateCodeExample(issue, session),
            difficulty: baseSolution.difficulty || 'medium',
            estimatedTime: baseSolution.estimatedTime || '5분',
            category: issue.category,
            confidence: this.calculateSolutionConfidence(issue, baseSolution)
        };
    }

    /**
     * 실시간 제안 생성
     */
    generateRealTimeSuggestions(session) {
        const suggestions = [];

        // 코드 품질 개선 제안
        if (session.currentAnalysis) {
            const overallScore = session.currentAnalysis.overallScore;

            if (overallScore < 70) {
                suggestions.push({
                    type: 'quality',
                    message: '코드 품질 개선이 필요합니다',
                    action: 'review_issues',
                    priority: 'high'
                });
            }

            if (session.currentAnalysis.performance.bottlenecks.length > 0) {
                suggestions.push({
                    type: 'performance',
                    message: '성능 최적화 기회가 있습니다',
                    action: 'optimize_performance',
                    priority: 'medium'
                });
            }
        }

        // 진행 상황 기반 제안
        const sessionDuration = Date.now() - session.startTime;
        if (sessionDuration > 30 * 60 * 1000 && session.detectedIssues.length > session.resolvedIssues.length) {
            suggestions.push({
                type: 'workflow',
                message: '해결되지 않은 문제들이 있습니다. 도움이 필요하신가요?',
                action: 'request_help',
                priority: 'low'
            });
        }

        return suggestions;
    }

    /**
     * 자동 분석 시작
     */
    startAutoAnalysis(sessionId) {
        const intervalId = setInterval(async () => {
            const session = this.activeSessions.get(sessionId);
            if (!session || session.status !== 'active') {
                clearInterval(intervalId);
                return;
            }

            try {
                await this.analyzeCodeRealtime(sessionId, session.code);
            } catch (error) {
                console.error(`❌ 자동 분석 실패 (${sessionId}):`, error);
            }
        }, this.config.analysisInterval);

        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.autoAnalysisInterval = intervalId;
        }
    }

    /**
     * 디버깅 세션 종료
     */
    endDebuggingSession(sessionId, feedback = null) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error('디버깅 세션을 찾을 수 없습니다');
        }

        // 자동 분석 중지
        if (session.autoAnalysisInterval) {
            clearInterval(session.autoAnalysisInterval);
        }

        // 세션 상태 업데이트
        session.status = 'completed';
        session.endTime = Date.now();
        session.duration = session.endTime - session.startTime;

        // 피드백 저장
        if (feedback) {
            session.feedback.push({
                timestamp: Date.now(),
                ...feedback
            });
        }

        // 통계 업데이트
        this.stats.activeSessionsCount--;
        this.updateSessionStats(session);

        // 세션 정보 저장
        this.saveSession(session);

        // 메모리에서 제거
        this.activeSessions.delete(sessionId);

        console.log(`🔍 디버깅 세션 종료: ${session.debugId}`);

        this.emit('debug-session-ended', {
            sessionId,
            debugId: session.debugId,
            duration: session.duration,
            issuesResolved: session.resolvedIssues.length,
            timestamp: Date.now()
        });

        return session.debugId;
    }

    /**
     * 유틸리티 메서드들
     */
    generateDebugId() {
        return `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    findLineNumber(code, index) {
        return code.substring(0, index).split('\n').length;
    }

    extractLineFromError(errorMessage) {
        const match = errorMessage.match(/line (\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    calculateOverallScore(analysisResults) {
        const scores = [
            analysisResults[0].score,
            analysisResults[1].score,
            analysisResults[2].score,
            analysisResults[3].score,
            analysisResults[4].score
        ];

        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }

    /**
     * 데이터 로드/저장
     */
    async loadErrorPatterns() {
        try {
            const patternsPath = path.join(__dirname, '../data/error_patterns.json');
            const data = JSON.parse(await fs.readFile(patternsPath, 'utf8'));
            this.errorPatterns = new Map(Object.entries(data));
        } catch (error) {
            console.log('📝 새로운 오류 패턴 데이터베이스 시작');
        }
    }

    async loadSolutionDatabase() {
        try {
            const solutionsPath = path.join(__dirname, '../data/solutions.json');
            const data = JSON.parse(await fs.readFile(solutionsPath, 'utf8'));
            this.solutionDatabase = new Map(Object.entries(data));
        } catch (error) {
            console.log('📚 새로운 해결책 데이터베이스 시작');
        }
    }

    setupSessionCleanup() {
        setInterval(() => {
            const cutoff = Date.now() - this.config.debugSessionTimeout;

            for (const [sessionId, session] of this.activeSessions.entries()) {
                if (session.lastActivity < cutoff) {
                    this.endDebuggingSession(sessionId, {
                        reason: 'timeout',
                        rating: 0
                    });
                }
            }
        }, 60000); // 1분마다 체크
    }

    /**
     * 디버깅 세션 정보 조회
     */
    getDebuggingSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) return null;

        return {
            debugId: session.debugId,
            sessionId: session.sessionId,
            language: session.language,
            status: session.status,
            startTime: session.startTime,
            duration: Date.now() - session.startTime,
            detectedIssues: session.detectedIssues.length,
            resolvedIssues: session.resolvedIssues.length,
            currentAnalysis: session.currentAnalysis,
            performanceMetrics: session.performanceMetrics
        };
    }

    /**
     * 디버깅 통계 조회
     */
    getDebuggingStats() {
        return {
            ...this.stats,
            activeSessions: Array.from(this.activeSessions.keys()),
            resolutionRate: this.stats.errorsDetected > 0 ?
                (this.stats.errorsResolved / this.stats.errorsDetected) * 100 : 0
        };
    }
}

module.exports = RealTimeDebugger;