/**
 * SystemIntegrationTester.js
 *
 * 전체 시스템 통합 테스트 시스템
 * Phase 2.2 AI 시스템, Phase 3.2 벡터 임베딩, 레거시 게임 호환성을 종합 검증
 */

const VectorEmbeddingService = require('./VectorEmbeddingService');
const LegacyGameValidator = require('./LegacyGameValidator');
const ContextManager = require('./ContextManager');
const ConversationHistoryOptimizer = require('./ConversationHistoryOptimizer');
const RealTimeDebugger = require('./RealTimeDebugger');
const fs = require('fs').promises;
const path = require('path');

class SystemIntegrationTester {
    constructor() {
        // 서비스 인스턴스들
        this.vectorEmbeddingService = new VectorEmbeddingService();
        this.legacyGameValidator = new LegacyGameValidator();
        this.contextManager = new ContextManager();
        this.historyOptimizer = new ConversationHistoryOptimizer();
        this.realTimeDebugger = new RealTimeDebugger();

        // 테스트 결과
        this.testResults = {
            overall: {
                status: 'unknown',
                score: 0,
                startTime: null,
                endTime: null,
                duration: 0
            },
            phase2: {
                aiSystems: null,
                contextManagement: null,
                historyOptimization: null,
                realTimeDebugging: null
            },
            phase3: {
                vectorEmbedding: null,
                documentChunking: null,
                searchSystem: null,
                hybridSearch: null
            },
            legacyGames: {
                compatibility: null,
                gameCount: 0,
                compatibleGames: 0
            },
            integration: {
                aiToVector: null,
                vectorToGames: null,
                endToEndFlow: null
            },
            performance: {
                searchResponseTime: 0,
                embeddingSystemLoad: 0,
                memoryUsage: 0,
                cpuUsage: 0
            }
        };

        // 테스트 설정
        this.testConfig = {
            searchTestQueries: [
                'SessionSDK 사용 방법',
                '센서 데이터 처리',
                '게임 개발 가이드',
                'orientation sensor',
                '듀얼 센서 게임'
            ],
            performanceThresholds: {
                searchResponseTime: 2000, // 2초
                embeddingSystemLoad: 80,   // 80%
                memoryUsageLimit: 512,     // 512MB
                cpuUsageLimit: 70          // 70%
            },
            legacyGameThreshold: 75 // 75% 호환성
        };

        this.logPath = path.join(__dirname, '../../data/integration_test.log');
    }

    /**
     * 전체 시스템 통합 테스트 실행
     */
    async runCompleteIntegrationTest() {
        console.log('🚀 전체 시스템 통합 테스트 시작...');
        this.testResults.overall.startTime = Date.now();

        try {
            await this.log('='.repeat(80));
            await this.log('📋 SENSOR GAME HUB v6.0 - 전체 시스템 통합 테스트');
            await this.log('='.repeat(80));

            // Phase 1: AI 시스템 테스트 (Phase 2.2)
            await this.log('\n🤖 Phase 1: AI 시스템 테스트');
            await this.testAISystems();

            // Phase 2: 벡터 임베딩 시스템 테스트 (Phase 3.2)
            await this.log('\n🔍 Phase 2: 벡터 임베딩 시스템 테스트');
            await this.testVectorEmbeddingSystem();

            // Phase 3: 레거시 게임 호환성 테스트
            await this.log('\n🎮 Phase 3: 레거시 게임 호환성 테스트');
            await this.testLegacyGameCompatibility();

            // Phase 4: 시스템 통합 테스트
            await this.log('\n🔗 Phase 4: 시스템 통합 테스트');
            await this.testSystemIntegration();

            // Phase 5: 성능 테스트
            await this.log('\n⚡ Phase 5: 성능 테스트');
            await this.testSystemPerformance();

            // 최종 결과 계산
            this.calculateOverallResults();

            await this.log('\n✅ 전체 시스템 통합 테스트 완료');
            await this.saveTestResults();

            return {
                success: true,
                results: this.testResults,
                summary: this.generateTestSummary()
            };

        } catch (error) {
            await this.log(`❌ 통합 테스트 실패: ${error.message}`);
            this.testResults.overall.status = 'failed';

            return {
                success: false,
                error: error.message,
                results: this.testResults
            };
        } finally {
            this.testResults.overall.endTime = Date.now();
            this.testResults.overall.duration =
                this.testResults.overall.endTime - this.testResults.overall.startTime;
        }
    }

    /**
     * AI 시스템 테스트 (Phase 2.2)
     */
    async testAISystems() {
        const aiResults = this.testResults.phase2;

        try {
            // Context Manager 테스트
            await this.log('  📊 Context Manager 테스트...');
            const contextTest = await this.testContextManager();
            aiResults.contextManagement = contextTest;

            // History Optimizer 테스트
            await this.log('  🧠 History Optimizer 테스트...');
            const historyTest = await this.testHistoryOptimizer();
            aiResults.historyOptimization = historyTest;

            // Real-time Debugger 테스트
            await this.log('  🔧 Real-time Debugger 테스트...');
            const debuggerTest = await this.testRealTimeDebugger();
            aiResults.realTimeDebugging = debuggerTest;

            // AI 시스템 전체 점수 계산
            const aiScores = [contextTest.score, historyTest.score, debuggerTest.score];
            aiResults.aiSystems = {
                success: true,
                score: Math.round(aiScores.reduce((a, b) => a + b, 0) / aiScores.length),
                components: {
                    contextManager: contextTest.score,
                    historyOptimizer: historyTest.score,
                    realTimeDebugger: debuggerTest.score
                }
            };

            await this.log(`  ✅ AI 시스템 테스트 완료: ${aiResults.aiSystems.score}%`);

        } catch (error) {
            aiResults.aiSystems = {
                success: false,
                error: error.message,
                score: 0
            };
            await this.log(`  ❌ AI 시스템 테스트 실패: ${error.message}`);
        }
    }

    /**
     * Context Manager 테스트
     */
    async testContextManager() {
        try {
            // 기본 기능 테스트
            const testContext = {
                currentGame: 'solo-sensor-game',
                userQuery: 'SessionSDK 사용법',
                sessionData: { connected: true, sensorActive: true }
            };

            const contextResult = await this.contextManager.analyzeContext(testContext);
            const recommendation = await this.contextManager.getRecommendation(testContext);

            const score = (contextResult.success && recommendation.success) ? 85 : 0;

            return {
                success: true,
                score: score,
                tests: {
                    contextAnalysis: contextResult.success,
                    recommendation: recommendation.success
                }
            };

        } catch (error) {
            return {
                success: false,
                score: 0,
                error: error.message
            };
        }
    }

    /**
     * History Optimizer 테스트
     */
    async testHistoryOptimizer() {
        try {
            // 샘플 대화 히스토리로 테스트
            const sampleHistory = [
                { role: 'user', content: 'SessionSDK 사용법을 알려주세요' },
                { role: 'assistant', content: 'SessionSDK는 센서 게임 개발을 위한...' }
            ];

            const optimization = await this.historyOptimizer.optimizeHistory(sampleHistory);
            const learningPattern = await this.historyOptimizer.extractLearningPatterns(sampleHistory);

            const score = (optimization.success && learningPattern.success) ? 90 : 0;

            return {
                success: true,
                score: score,
                tests: {
                    historyOptimization: optimization.success,
                    learningPatterns: learningPattern.success
                }
            };

        } catch (error) {
            return {
                success: false,
                score: 0,
                error: error.message
            };
        }
    }

    /**
     * Real-time Debugger 테스트
     */
    async testRealTimeDebugger() {
        try {
            // 실시간 디버깅 기능 테스트
            const testIssue = {
                type: 'sensor_connection',
                message: 'Sensor data not received',
                context: { gameId: 'test-game' }
            };

            const debugResult = await this.realTimeDebugger.analyzeIssue(testIssue);
            const solution = await this.realTimeDebugger.suggestSolution(testIssue);

            const score = (debugResult.success && solution.success) ? 88 : 0;

            return {
                success: true,
                score: score,
                tests: {
                    issueAnalysis: debugResult.success,
                    solutionSuggestion: solution.success
                }
            };

        } catch (error) {
            return {
                success: false,
                score: 0,
                error: error.message
            };
        }
    }

    /**
     * 벡터 임베딩 시스템 테스트 (Phase 3.2)
     */
    async testVectorEmbeddingSystem() {
        const vectorResults = this.testResults.phase3;

        try {
            // 벡터 임베딩 시스템 상태 확인
            await this.log('  📊 벡터 임베딩 시스템 상태 확인...');
            const systemStatus = await this.vectorEmbeddingService.getSystemStatus();

            if (!systemStatus.initialized) {
                await this.log('  🔧 벡터 임베딩 시스템 초기화...');
                const initResult = await this.vectorEmbeddingService.initializeEmbeddingSystem({
                    skipExisting: true
                });

                if (!initResult.success) {
                    throw new Error(`임베딩 시스템 초기화 실패: ${initResult.error}`);
                }
            }

            // 검색 시스템 테스트
            await this.log('  🔍 검색 시스템 테스트...');
            const searchTests = await this.testSearchSystem();
            vectorResults.searchSystem = searchTests;

            // 하이브리드 검색 테스트
            await this.log('  🔗 하이브리드 검색 테스트...');
            const hybridTests = await this.testHybridSearch();
            vectorResults.hybridSearch = hybridTests;

            // 전체 벡터 시스템 점수 계산
            const vectorScore = (searchTests.score + hybridTests.score) / 2;
            vectorResults.vectorEmbedding = {
                success: true,
                score: Math.round(vectorScore),
                components: {
                    searchSystem: searchTests.score,
                    hybridSearch: hybridTests.score
                }
            };

            await this.log(`  ✅ 벡터 임베딩 시스템 테스트 완료: ${vectorResults.vectorEmbedding.score}%`);

        } catch (error) {
            vectorResults.vectorEmbedding = {
                success: false,
                error: error.message,
                score: 0
            };
            await this.log(`  ❌ 벡터 임베딩 시스템 테스트 실패: ${error.message}`);
        }
    }

    /**
     * 검색 시스템 테스트
     */
    async testSearchSystem() {
        try {
            let totalScore = 0;
            const testResults = [];

            for (const query of this.testConfig.searchTestQueries) {
                const startTime = Date.now();
                const searchResult = await this.vectorEmbeddingService.search(query, {
                    limit: 5
                });
                const responseTime = Date.now() - startTime;

                const testResult = {
                    query: query,
                    success: searchResult.success,
                    resultCount: searchResult.results?.length || 0,
                    responseTime: responseTime,
                    score: this.calculateSearchScore(searchResult, responseTime)
                };

                testResults.push(testResult);
                totalScore += testResult.score;

                await this.log(`    🔍 "${query}": ${testResult.score}% (${responseTime}ms)`);
            }

            const averageScore = Math.round(totalScore / this.testConfig.searchTestQueries.length);

            return {
                success: true,
                score: averageScore,
                testResults: testResults
            };

        } catch (error) {
            return {
                success: false,
                score: 0,
                error: error.message
            };
        }
    }

    /**
     * 하이브리드 검색 테스트
     */
    async testHybridSearch() {
        try {
            const hybridQueries = [
                { query: 'SessionSDK orientation 데이터', type: 'hybrid' },
                { query: '센서 게임 개발', type: 'semantic' },
                { query: 'canvas acceleration', type: 'keyword' }
            ];

            let totalScore = 0;
            const testResults = [];

            for (const testQuery of hybridQueries) {
                const startTime = Date.now();
                const searchResult = await this.vectorEmbeddingService.search(testQuery.query, {
                    searchType: testQuery.type,
                    limit: 5
                });
                const responseTime = Date.now() - startTime;

                const testResult = {
                    query: testQuery.query,
                    type: testQuery.type,
                    success: searchResult.success,
                    resultCount: searchResult.results?.length || 0,
                    responseTime: responseTime,
                    score: this.calculateSearchScore(searchResult, responseTime)
                };

                testResults.push(testResult);
                totalScore += testResult.score;

                await this.log(`    🔗 "${testQuery.query}" (${testQuery.type}): ${testResult.score}%`);
            }

            const averageScore = Math.round(totalScore / hybridQueries.length);

            return {
                success: true,
                score: averageScore,
                testResults: testResults
            };

        } catch (error) {
            return {
                success: false,
                score: 0,
                error: error.message
            };
        }
    }

    /**
     * 검색 점수 계산
     */
    calculateSearchScore(searchResult, responseTime) {
        if (!searchResult.success) return 0;

        let score = 50; // 기본 점수

        // 결과 개수 점수 (최대 30점)
        const resultCount = searchResult.results?.length || 0;
        if (resultCount > 0) {
            score += Math.min(resultCount * 6, 30);
        }

        // 응답 시간 점수 (최대 20점)
        const responseTimeThreshold = this.testConfig.performanceThresholds.searchResponseTime;
        if (responseTime < responseTimeThreshold) {
            score += 20 - (responseTime / responseTimeThreshold) * 20;
        }

        return Math.min(Math.round(score), 100);
    }

    /**
     * 레거시 게임 호환성 테스트
     */
    async testLegacyGameCompatibility() {
        const legacyResults = this.testResults.legacyGames;

        try {
            const validationResult = await this.legacyGameValidator.validateAllGames();

            if (!validationResult.success) {
                throw new Error(`레거시 게임 검증 실패: ${validationResult.error}`);
            }

            const summary = validationResult.summary;
            const compatibleGames = summary.readyForProduction;
            const totalGames = summary.totalGames;
            const compatibilityRate = Math.round((compatibleGames / totalGames) * 100);

            legacyResults.compatibility = {
                success: true,
                score: compatibilityRate,
                totalGames: totalGames,
                compatibleGames: compatibleGames,
                needsWork: summary.needsWork,
                averageScore: summary.averageCompatibilityScore
            };

            legacyResults.gameCount = totalGames;
            legacyResults.compatibleGames = compatibleGames;

            await this.log(`  ✅ 레거시 게임 호환성: ${compatibilityRate}% (${compatibleGames}/${totalGames})`);

        } catch (error) {
            legacyResults.compatibility = {
                success: false,
                error: error.message,
                score: 0
            };
            await this.log(`  ❌ 레거시 게임 테스트 실패: ${error.message}`);
        }
    }

    /**
     * 시스템 통합 테스트
     */
    async testSystemIntegration() {
        const integrationResults = this.testResults.integration;

        try {
            // AI ↔ Vector 통합 테스트
            await this.log('  🤖↔️🔍 AI-Vector 시스템 통합 테스트...');
            const aiVectorTest = await this.testAIVectorIntegration();
            integrationResults.aiToVector = aiVectorTest;

            // Vector ↔ Games 통합 테스트
            await this.log('  🔍↔️🎮 Vector-Games 통합 테스트...');
            const vectorGamesTest = await this.testVectorGamesIntegration();
            integrationResults.vectorToGames = vectorGamesTest;

            // End-to-End 플로우 테스트
            await this.log('  🔄 End-to-End 플로우 테스트...');
            const e2eTest = await this.testEndToEndFlow();
            integrationResults.endToEndFlow = e2eTest;

            await this.log('  ✅ 시스템 통합 테스트 완료');

        } catch (error) {
            await this.log(`  ❌ 시스템 통합 테스트 실패: ${error.message}`);
        }
    }

    /**
     * AI-Vector 시스템 통합 테스트
     */
    async testAIVectorIntegration() {
        try {
            // Context Manager로 컨텍스트 분석 후 Vector 검색
            const context = {
                userQuery: 'SessionSDK 센서 데이터 처리',
                gameType: 'solo'
            };

            const contextAnalysis = await this.contextManager.analyzeContext(context);
            if (!contextAnalysis.success) {
                throw new Error('Context 분석 실패');
            }

            const enhancedQuery = contextAnalysis.enhancedQuery || context.userQuery;
            const searchResult = await this.vectorEmbeddingService.search(enhancedQuery);

            return {
                success: searchResult.success && searchResult.results.length > 0,
                score: searchResult.success ? 85 : 0,
                contextEnhancement: contextAnalysis.success,
                searchResults: searchResult.results?.length || 0
            };

        } catch (error) {
            return {
                success: false,
                score: 0,
                error: error.message
            };
        }
    }

    /**
     * Vector-Games 통합 테스트
     */
    async testVectorGamesIntegration() {
        try {
            // 게임 관련 검색 후 실제 게임 파일과 매칭 확인
            const gameSearchQuery = 'solo sensor game 구현';
            const searchResult = await this.vectorEmbeddingService.search(gameSearchQuery);

            if (!searchResult.success || searchResult.results.length === 0) {
                throw new Error('게임 관련 검색 실패');
            }

            // 검색 결과에서 게임 관련 문서 확인
            const gameRelatedResults = searchResult.results.filter(result =>
                result.file_path.includes('game') ||
                result.content.toLowerCase().includes('게임')
            );

            return {
                success: gameRelatedResults.length > 0,
                score: gameRelatedResults.length > 0 ? 80 : 0,
                searchResults: searchResult.results.length,
                gameRelatedResults: gameRelatedResults.length
            };

        } catch (error) {
            return {
                success: false,
                score: 0,
                error: error.message
            };
        }
    }

    /**
     * End-to-End 플로우 테스트
     */
    async testEndToEndFlow() {
        try {
            // 1. 사용자 쿼리 시뮬레이션
            const userQuery = '센서를 이용한 게임 개발 방법';

            // 2. Context 분석
            const context = { userQuery: userQuery, gameType: 'general' };
            const contextResult = await this.contextManager.analyzeContext(context);

            // 3. Vector 검색
            const searchResult = await this.vectorEmbeddingService.search(userQuery);

            // 4. 결과 검증
            const e2eSuccess = contextResult.success &&
                               searchResult.success &&
                               searchResult.results.length > 0;

            return {
                success: e2eSuccess,
                score: e2eSuccess ? 90 : 0,
                steps: {
                    contextAnalysis: contextResult.success,
                    vectorSearch: searchResult.success,
                    resultCount: searchResult.results?.length || 0
                }
            };

        } catch (error) {
            return {
                success: false,
                score: 0,
                error: error.message
            };
        }
    }

    /**
     * 시스템 성능 테스트
     */
    async testSystemPerformance() {
        const performanceResults = this.testResults.performance;

        try {
            // 검색 응답 시간 테스트
            const searchTimes = [];
            for (let i = 0; i < 5; i++) {
                const startTime = Date.now();
                await this.vectorEmbeddingService.search('test query');
                searchTimes.push(Date.now() - startTime);
            }

            performanceResults.searchResponseTime = Math.round(
                searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length
            );

            // 메모리 사용량 체크
            const memoryUsage = process.memoryUsage();
            performanceResults.memoryUsage = Math.round(memoryUsage.heapUsed / 1024 / 1024); // MB

            await this.log(`  ⚡ 평균 검색 응답 시간: ${performanceResults.searchResponseTime}ms`);
            await this.log(`  💾 메모리 사용량: ${performanceResults.memoryUsage}MB`);

        } catch (error) {
            await this.log(`  ❌ 성능 테스트 실패: ${error.message}`);
        }
    }

    /**
     * 전체 결과 계산
     */
    calculateOverallResults() {
        const scores = [];

        // Phase 2.2 AI 시스템 점수
        if (this.testResults.phase2.aiSystems?.score) {
            scores.push(this.testResults.phase2.aiSystems.score);
        }

        // Phase 3.2 벡터 임베딩 점수
        if (this.testResults.phase3.vectorEmbedding?.score) {
            scores.push(this.testResults.phase3.vectorEmbedding.score);
        }

        // 레거시 게임 호환성 점수
        if (this.testResults.legacyGames.compatibility?.score) {
            scores.push(this.testResults.legacyGames.compatibility.score);
        }

        // 전체 점수 계산
        if (scores.length > 0) {
            this.testResults.overall.score = Math.round(
                scores.reduce((a, b) => a + b, 0) / scores.length
            );

            // 상태 결정
            if (this.testResults.overall.score >= 85) {
                this.testResults.overall.status = 'excellent';
            } else if (this.testResults.overall.score >= 75) {
                this.testResults.overall.status = 'good';
            } else if (this.testResults.overall.score >= 60) {
                this.testResults.overall.status = 'acceptable';
            } else {
                this.testResults.overall.status = 'needs_improvement';
            }
        } else {
            this.testResults.overall.status = 'failed';
        }
    }

    /**
     * 테스트 요약 생성
     */
    generateTestSummary() {
        const duration = Math.round(this.testResults.overall.duration / 1000);

        return {
            overallScore: this.testResults.overall.score,
            status: this.testResults.overall.status,
            duration: `${duration}초`,
            components: {
                aiSystems: this.testResults.phase2.aiSystems?.score || 0,
                vectorEmbedding: this.testResults.phase3.vectorEmbedding?.score || 0,
                legacyCompatibility: this.testResults.legacyGames.compatibility?.score || 0
            },
            performance: {
                searchResponseTime: `${this.testResults.performance.searchResponseTime}ms`,
                memoryUsage: `${this.testResults.performance.memoryUsage}MB`
            },
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * 권장사항 생성
     */
    generateRecommendations() {
        const recommendations = [];

        if (this.testResults.overall.score < 75) {
            recommendations.push('시스템 성능 최적화가 필요합니다.');
        }

        if (this.testResults.performance.searchResponseTime > 1000) {
            recommendations.push('검색 응답 시간 개선이 필요합니다.');
        }

        if (this.testResults.legacyGames.compatibility?.score < 80) {
            recommendations.push('레거시 게임 호환성 개선이 필요합니다.');
        }

        if (recommendations.length === 0) {
            recommendations.push('모든 시스템이 정상적으로 작동하고 있습니다.');
        }

        return recommendations;
    }

    /**
     * 테스트 결과 저장
     */
    async saveTestResults() {
        try {
            const resultsPath = path.join(__dirname, '../../data/integration_test_results.json');
            const dataDir = path.dirname(resultsPath);

            await fs.mkdir(dataDir, { recursive: true });
            await fs.writeFile(resultsPath, JSON.stringify({
                timestamp: new Date().toISOString(),
                results: this.testResults,
                summary: this.generateTestSummary()
            }, null, 2));

            await this.log(`💾 통합 테스트 결과 저장: ${resultsPath}`);

        } catch (error) {
            await this.log(`❌ 결과 저장 실패: ${error.message}`);
        }
    }

    /**
     * 로그 기록
     */
    async log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;

        try {
            const dataDir = path.dirname(this.logPath);
            await fs.mkdir(dataDir, { recursive: true });
            await fs.appendFile(this.logPath, logEntry);
        } catch (error) {
            console.error('로그 기록 실패:', error.message);
        }

        console.log(message);
    }
}

module.exports = SystemIntegrationTester;