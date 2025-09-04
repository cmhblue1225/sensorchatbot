/**
 * PerformanceMonitor.js
 * AI 게임 생성기를 위한 종합 성능 모니터링 시스템
 * 
 * 이 시스템은 게임 생성 프로세스의 성능을 실시간으로 모니터링하고,
 * 병목 지점을 식별하며, 최적화 권장사항을 제공합니다.
 */

class PerformanceMonitor {
    constructor() {
        // 성능 메트릭 저장소
        this.metrics = {
            // 게임 생성 관련
            gameGeneration: {
                totalGenerations: 0,
                successfulGenerations: 0,
                failedGenerations: 0,
                averageGenerationTime: 0,
                totalGenerationTime: 0
            },
            
            // 요구사항 수집 관련
            requirementCollection: {
                totalSessions: 0,
                completedSessions: 0,
                abandonedSessions: 0,
                averageCompletionTime: 0,
                averageQuestionsAsked: 0
            },
            
            // AI 모델 성능
            aiModel: {
                totalRequests: 0,
                failedRequests: 0,
                averageResponseTime: 0,
                totalResponseTime: 0,
                tokenUsage: {
                    input: 0,
                    output: 0,
                    total: 0
                }
            },
            
            // 검증 시스템 성능
            validation: {
                totalValidations: 0,
                averageScore: 0,
                averageValidationTime: 0,
                genreSpecificPerformance: {}
            },
            
            // 시스템 리소스
            system: {
                memoryUsage: [],
                cpuUsage: [],
                activeConnections: 0,
                maxActiveConnections: 0
            },
            
            // 사용자 경험
            userExperience: {
                sessionCompletionRate: 0,
                averageSessionDuration: 0,
                userSatisfactionScore: 0,
                mostPopularGenres: {},
                mostPopularGameTypes: {}
            }
        };

        // 성능 추적 세션
        this.activeSessions = new Map();
        this.completedSessions = [];
        
        // 성능 히스토리 (최근 100개 데이터 포인트)
        this.performanceHistory = {
            generationTimes: [],
            validationScores: [],
            responsesTimes: [],
            memorySnapshots: [],
            timestamps: []
        };

        // 알림 설정
        this.alertThresholds = {
            maxGenerationTime: 60000, // 60초
            minValidationScore: 70,
            maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
            maxResponseTime: 10000, // 10초
            minSuccessRate: 0.8 // 80%
        };

        // 성능 이벤트 리스너
        this.eventHandlers = new Map();
        
        // 자동 정리 타이머 시작
        this.startPeriodicCleanup();
    }

    /**
     * 게임 생성 세션 시작 추적
     */
    startGameGenerationTracking(sessionId, metadata = {}) {
        const tracking = {
            sessionId,
            type: 'game_generation',
            startTime: Date.now(),
            metadata,
            stages: {
                initialization: null,
                requirementCollection: null,
                aiGeneration: null,
                validation: null,
                fileGeneration: null,
                completion: null
            },
            metrics: {
                aiRequests: 0,
                validationAttempts: 0,
                memoryUsageStart: process.memoryUsage(),
                errors: []
            }
        };

        this.activeSessions.set(sessionId, tracking);
        this.metrics.gameGeneration.totalGenerations++;

        console.log(`📊 게임 생성 성능 추적 시작: ${sessionId}`);
        return tracking;
    }

    /**
     * 게임 생성 단계 완료 기록
     */
    recordStageCompletion(sessionId, stageName, additionalData = {}) {
        const tracking = this.activeSessions.get(sessionId);
        if (!tracking) {
            console.warn(`⚠️ 세션을 찾을 수 없음: ${sessionId}`);
            return;
        }

        const currentTime = Date.now();
        const stageDuration = currentTime - (tracking.stages[stageName]?.startTime || tracking.startTime);

        tracking.stages[stageName] = {
            startTime: tracking.stages[stageName]?.startTime || tracking.startTime,
            endTime: currentTime,
            duration: stageDuration,
            ...additionalData
        };

        console.log(`📈 단계 완료: ${sessionId} - ${stageName} (${stageDuration}ms)`);
    }

    /**
     * AI 요청 성능 추적
     */
    trackAIRequest(sessionId, requestType, startTime, endTime, tokenUsage = null, success = true) {
        const duration = endTime - startTime;
        
        // 전체 메트릭 업데이트
        this.metrics.aiModel.totalRequests++;
        this.metrics.aiModel.totalResponseTime += duration;
        this.metrics.aiModel.averageResponseTime = this.metrics.aiModel.totalResponseTime / this.metrics.aiModel.totalRequests;

        if (!success) {
            this.metrics.aiModel.failedRequests++;
        }

        if (tokenUsage) {
            this.metrics.aiModel.tokenUsage.input += tokenUsage.input || 0;
            this.metrics.aiModel.tokenUsage.output += tokenUsage.output || 0;
            this.metrics.aiModel.tokenUsage.total += (tokenUsage.input || 0) + (tokenUsage.output || 0);
        }

        // 세션별 추적
        const tracking = this.activeSessions.get(sessionId);
        if (tracking) {
            tracking.metrics.aiRequests++;
        }

        // 성능 히스토리 업데이트
        this.addToHistory('responseTimes', duration);

        // 경고 확인
        if (duration > this.alertThresholds.maxResponseTime) {
            this.triggerAlert('high_response_time', { sessionId, duration, requestType });
        }

        console.log(`🤖 AI 요청 완료: ${requestType} - ${duration}ms`);
    }

    /**
     * 검증 성능 추적
     */
    trackValidation(sessionId, validationResult, duration) {
        const tracking = this.activeSessions.get(sessionId);
        if (tracking) {
            tracking.metrics.validationAttempts++;
        }

        // 전체 검증 메트릭 업데이트
        this.metrics.validation.totalValidations++;
        this.metrics.validation.averageValidationTime = 
            (this.metrics.validation.averageValidationTime * (this.metrics.validation.totalValidations - 1) + duration) / 
            this.metrics.validation.totalValidations;

        // 점수 평균 업데이트
        this.metrics.validation.averageScore = 
            (this.metrics.validation.averageScore * (this.metrics.validation.totalValidations - 1) + validationResult.score) / 
            this.metrics.validation.totalValidations;

        // 장르별 성능 추적
        if (validationResult.genre) {
            if (!this.metrics.validation.genreSpecificPerformance[validationResult.genre]) {
                this.metrics.validation.genreSpecificPerformance[validationResult.genre] = {
                    count: 0,
                    averageScore: 0,
                    averageTime: 0
                };
            }

            const genreMetrics = this.metrics.validation.genreSpecificPerformance[validationResult.genre];
            genreMetrics.count++;
            genreMetrics.averageScore = 
                (genreMetrics.averageScore * (genreMetrics.count - 1) + validationResult.score) / genreMetrics.count;
            genreMetrics.averageTime = 
                (genreMetrics.averageTime * (genreMetrics.count - 1) + duration) / genreMetrics.count;
        }

        // 성능 히스토리 업데이트
        this.addToHistory('validationScores', validationResult.score);

        // 경고 확인
        if (validationResult.score < this.alertThresholds.minValidationScore) {
            this.triggerAlert('low_validation_score', { sessionId, score: validationResult.score });
        }

        console.log(`✅ 검증 완료: ${sessionId} - 점수: ${validationResult.score} (${duration}ms)`);
    }

    /**
     * 요구사항 수집 세션 추적
     */
    trackRequirementCollection(sessionId, result) {
        this.metrics.requirementCollection.totalSessions++;
        
        if (result.isComplete) {
            this.metrics.requirementCollection.completedSessions++;
            this.metrics.requirementCollection.averageCompletionTime = 
                (this.metrics.requirementCollection.averageCompletionTime * (this.metrics.requirementCollection.completedSessions - 1) + result.duration) / 
                this.metrics.requirementCollection.completedSessions;
        } else {
            this.metrics.requirementCollection.abandonedSessions++;
        }

        console.log(`📋 요구사항 수집 추적: ${sessionId} - 완료: ${result.isComplete}`);
    }

    /**
     * 게임 생성 완료
     */
    completeGameGeneration(sessionId, success = true, finalMetrics = {}) {
        const tracking = this.activeSessions.get(sessionId);
        if (!tracking) {
            console.warn(`⚠️ 완료할 세션을 찾을 수 없음: ${sessionId}`);
            return;
        }

        const endTime = Date.now();
        const totalDuration = endTime - tracking.startTime;

        tracking.endTime = endTime;
        tracking.totalDuration = totalDuration;
        tracking.success = success;
        tracking.finalMetrics = finalMetrics;
        tracking.memoryUsageEnd = process.memoryUsage();

        // 전체 메트릭 업데이트
        this.metrics.gameGeneration.totalGenerationTime += totalDuration;
        this.metrics.gameGeneration.averageGenerationTime = 
            this.metrics.gameGeneration.totalGenerationTime / this.metrics.gameGeneration.totalGenerations;

        if (success) {
            this.metrics.gameGeneration.successfulGenerations++;
        } else {
            this.metrics.gameGeneration.failedGenerations++;
        }

        // 성능 히스토리 업데이트
        this.addToHistory('generationTimes', totalDuration);

        // 완료된 세션으로 이동
        this.activeSessions.delete(sessionId);
        this.completedSessions.push(tracking);

        // 메모리 관리 (최근 1000개만 유지)
        if (this.completedSessions.length > 1000) {
            this.completedSessions = this.completedSessions.slice(-1000);
        }

        // 사용자 경험 메트릭 업데이트
        this.updateUserExperienceMetrics(tracking);

        // 경고 확인
        if (totalDuration > this.alertThresholds.maxGenerationTime) {
            this.triggerAlert('long_generation_time', { sessionId, duration: totalDuration });
        }

        console.log(`🎯 게임 생성 완료: ${sessionId} - 성공: ${success} (${totalDuration}ms)`);
        return tracking;
    }

    /**
     * 시스템 리소스 모니터링
     */
    recordSystemMetrics() {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        this.metrics.system.memoryUsage.push({
            timestamp: Date.now(),
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            external: memoryUsage.external,
            rss: memoryUsage.rss
        });

        this.metrics.system.cpuUsage.push({
            timestamp: Date.now(),
            user: cpuUsage.user,
            system: cpuUsage.system
        });

        // 최근 100개 데이터만 유지
        if (this.metrics.system.memoryUsage.length > 100) {
            this.metrics.system.memoryUsage = this.metrics.system.memoryUsage.slice(-100);
        }
        if (this.metrics.system.cpuUsage.length > 100) {
            this.metrics.system.cpuUsage = this.metrics.system.cpuUsage.slice(-100);
        }

        // 메모리 사용량 경고
        if (memoryUsage.heapUsed > this.alertThresholds.maxMemoryUsage) {
            this.triggerAlert('high_memory_usage', { usage: memoryUsage.heapUsed });
        }
    }

    /**
     * 성능 히스토리에 데이터 추가
     */
    addToHistory(metric, value) {
        this.performanceHistory[metric].push(value);
        this.performanceHistory.timestamps.push(Date.now());

        // 최근 100개만 유지
        if (this.performanceHistory[metric].length > 100) {
            this.performanceHistory[metric] = this.performanceHistory[metric].slice(-100);
            this.performanceHistory.timestamps = this.performanceHistory.timestamps.slice(-100);
        }
    }

    /**
     * 사용자 경험 메트릭 업데이트
     */
    updateUserExperienceMetrics(completedTracking) {
        const totalGenerations = this.metrics.gameGeneration.totalGenerations;
        const successful = this.metrics.gameGeneration.successfulGenerations;
        
        this.metrics.userExperience.sessionCompletionRate = successful / totalGenerations;
        
        if (completedTracking.success) {
            this.metrics.userExperience.averageSessionDuration = 
                (this.metrics.userExperience.averageSessionDuration * (successful - 1) + completedTracking.totalDuration) / successful;
        }

        // 장르 및 게임 타입 인기도 업데이트
        if (completedTracking.metadata.genre) {
            this.metrics.userExperience.mostPopularGenres[completedTracking.metadata.genre] = 
                (this.metrics.userExperience.mostPopularGenres[completedTracking.metadata.genre] || 0) + 1;
        }
        
        if (completedTracking.metadata.gameType) {
            this.metrics.userExperience.mostPopularGameTypes[completedTracking.metadata.gameType] = 
                (this.metrics.userExperience.mostPopularGameTypes[completedTracking.metadata.gameType] || 0) + 1;
        }
    }

    /**
     * 성능 분석 및 권장사항 생성
     */
    generatePerformanceAnalysis() {
        const analysis = {
            timestamp: new Date().toISOString(),
            overview: {
                totalGenerations: this.metrics.gameGeneration.totalGenerations,
                successRate: this.metrics.gameGeneration.successfulGenerations / this.metrics.gameGeneration.totalGenerations,
                averageTime: this.metrics.gameGeneration.averageGenerationTime,
                aiPerformance: {
                    averageResponseTime: this.metrics.aiModel.averageResponseTime,
                    failureRate: this.metrics.aiModel.failedRequests / this.metrics.aiModel.totalRequests
                }
            },
            bottlenecks: this.identifyBottlenecks(),
            recommendations: this.generateRecommendations(),
            trends: this.analyzeTrends(),
            resourceUsage: this.getResourceUsageSummary()
        };

        return analysis;
    }

    /**
     * 병목 지점 식별
     */
    identifyBottlenecks() {
        const bottlenecks = [];

        // AI 응답 시간 분석
        if (this.metrics.aiModel.averageResponseTime > 5000) {
            bottlenecks.push({
                type: 'ai_response_time',
                severity: 'high',
                description: 'AI 모델 응답 시간이 5초를 초과합니다',
                impact: 'high',
                averageTime: this.metrics.aiModel.averageResponseTime
            });
        }

        // 검증 성능 분석
        if (this.metrics.validation.averageScore < 80) {
            bottlenecks.push({
                type: 'validation_quality',
                severity: 'medium',
                description: '검증 시스템의 평균 점수가 80점 미만입니다',
                impact: 'medium',
                averageScore: this.metrics.validation.averageScore
            });
        }

        // 세션 완료율 분석
        const completionRate = this.metrics.userExperience.sessionCompletionRate;
        if (completionRate < 0.8) {
            bottlenecks.push({
                type: 'session_completion',
                severity: 'high',
                description: '세션 완료율이 80% 미만입니다',
                impact: 'high',
                completionRate: completionRate
            });
        }

        return bottlenecks;
    }

    /**
     * 최적화 권장사항 생성
     */
    generateRecommendations() {
        const recommendations = [];

        // AI 모델 최적화
        if (this.metrics.aiModel.averageResponseTime > 5000) {
            recommendations.push({
                category: 'ai_optimization',
                priority: 'high',
                title: 'AI 모델 응답 시간 최적화',
                description: '프롬프트 길이 단축, 모델 파라미터 조정, 캐싱 도입을 고려하세요',
                expectedImprovement: '30-50% 응답 시간 단축'
            });
        }

        // 검증 시스템 개선
        if (this.metrics.validation.averageScore < 80) {
            recommendations.push({
                category: 'validation_improvement',
                priority: 'medium',
                title: '검증 규칙 개선',
                description: '장르별 특화 검증 규칙을 강화하고, 가중치를 조정하세요',
                expectedImprovement: '검증 점수 10-15점 향상'
            });
        }

        // 메모리 사용량 최적화
        const latestMemory = this.metrics.system.memoryUsage[this.metrics.system.memoryUsage.length - 1];
        if (latestMemory && latestMemory.heapUsed > 500 * 1024 * 1024) {
            recommendations.push({
                category: 'memory_optimization',
                priority: 'medium',
                title: '메모리 사용량 최적화',
                description: '세션 정리, 캐시 크기 제한, 가비지 컬렉션 최적화를 시행하세요',
                expectedImprovement: '메모리 사용량 20-30% 감소'
            });
        }

        return recommendations;
    }

    /**
     * 성능 트렌드 분석
     */
    analyzeTrends() {
        const trends = {};

        // 생성 시간 트렌드
        if (this.performanceHistory.generationTimes.length >= 10) {
            const recent = this.performanceHistory.generationTimes.slice(-10);
            const older = this.performanceHistory.generationTimes.slice(-20, -10);
            
            if (older.length > 0) {
                const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
                const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
                
                trends.generationTime = {
                    direction: recentAvg > olderAvg ? 'increasing' : 'decreasing',
                    change: ((recentAvg - olderAvg) / olderAvg * 100).toFixed(1) + '%',
                    recentAverage: recentAvg,
                    previousAverage: olderAvg
                };
            }
        }

        // 검증 점수 트렌드
        if (this.performanceHistory.validationScores.length >= 10) {
            const recent = this.performanceHistory.validationScores.slice(-10);
            const older = this.performanceHistory.validationScores.slice(-20, -10);
            
            if (older.length > 0) {
                const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
                const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
                
                trends.validationScore = {
                    direction: recentAvg > olderAvg ? 'improving' : 'declining',
                    change: ((recentAvg - olderAvg) / olderAvg * 100).toFixed(1) + '%',
                    recentAverage: recentAvg,
                    previousAverage: olderAvg
                };
            }
        }

        return trends;
    }

    /**
     * 리소스 사용량 요약
     */
    getResourceUsageSummary() {
        const latestMemory = this.metrics.system.memoryUsage[this.metrics.system.memoryUsage.length - 1];
        const latestCpu = this.metrics.system.cpuUsage[this.metrics.system.cpuUsage.length - 1];

        return {
            memory: latestMemory ? {
                heapUsed: Math.round(latestMemory.heapUsed / 1024 / 1024) + ' MB',
                heapTotal: Math.round(latestMemory.heapTotal / 1024 / 1024) + ' MB',
                rss: Math.round(latestMemory.rss / 1024 / 1024) + ' MB'
            } : null,
            cpu: latestCpu ? {
                user: latestCpu.user,
                system: latestCpu.system
            } : null,
            activeConnections: this.metrics.system.activeConnections
        };
    }

    /**
     * 경고 발생
     */
    triggerAlert(alertType, data) {
        const alert = {
            type: alertType,
            timestamp: new Date().toISOString(),
            severity: this.getAlertSeverity(alertType),
            data: data,
            message: this.generateAlertMessage(alertType, data)
        };

        console.warn(`🚨 성능 경고: ${alert.message}`);

        // 이벤트 핸들러 실행
        if (this.eventHandlers.has('alert')) {
            this.eventHandlers.get('alert').forEach(handler => {
                try {
                    handler(alert);
                } catch (error) {
                    console.error('경고 핸들러 실행 실패:', error);
                }
            });
        }

        return alert;
    }

    /**
     * 경고 심각도 결정
     */
    getAlertSeverity(alertType) {
        const severityMap = {
            high_response_time: 'medium',
            low_validation_score: 'medium',
            long_generation_time: 'high',
            high_memory_usage: 'high',
            session_timeout: 'low'
        };

        return severityMap[alertType] || 'medium';
    }

    /**
     * 경고 메시지 생성
     */
    generateAlertMessage(alertType, data) {
        const messages = {
            high_response_time: `AI 응답 시간이 ${data.duration}ms로 임계값을 초과했습니다`,
            low_validation_score: `검증 점수가 ${data.score}점으로 임계값 미만입니다`,
            long_generation_time: `게임 생성 시간이 ${Math.round(data.duration/1000)}초로 과도합니다`,
            high_memory_usage: `메모리 사용량이 ${Math.round(data.usage/1024/1024)}MB로 높습니다`,
            session_timeout: `세션 ${data.sessionId}이 시간 초과되었습니다`
        };

        return messages[alertType] || `알 수 없는 경고: ${alertType}`;
    }

    /**
     * 이벤트 핸들러 등록
     */
    on(eventType, handler) {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, []);
        }
        this.eventHandlers.get(eventType).push(handler);
    }

    /**
     * 주기적 정리 및 모니터링
     */
    startPeriodicCleanup() {
        // 5분마다 시스템 메트릭 기록
        setInterval(() => {
            this.recordSystemMetrics();
        }, 5 * 60 * 1000);

        // 30분마다 오래된 세션 정리
        setInterval(() => {
            this.cleanupOldSessions();
        }, 30 * 60 * 1000);

        // 1시간마다 성능 분석 출력
        setInterval(() => {
            const analysis = this.generatePerformanceAnalysis();
            console.log('📊 성능 분석 결과:', JSON.stringify(analysis, null, 2));
        }, 60 * 60 * 1000);
    }

    /**
     * 오래된 세션 정리
     */
    cleanupOldSessions() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24시간

        let cleaned = 0;
        for (const [sessionId, tracking] of this.activeSessions) {
            if (now - tracking.startTime > maxAge) {
                this.activeSessions.delete(sessionId);
                cleaned++;
                console.log(`🧹 오래된 세션 정리: ${sessionId}`);
            }
        }

        if (cleaned > 0) {
            console.log(`✅ ${cleaned}개의 오래된 세션을 정리했습니다`);
        }
    }

    /**
     * 성능 대시보드 데이터 생성
     */
    getDashboardData() {
        return {
            metrics: this.metrics,
            activeSessions: this.activeSessions.size,
            recentPerformance: {
                generationTimes: this.performanceHistory.generationTimes.slice(-20),
                validationScores: this.performanceHistory.validationScores.slice(-20),
                responseTimes: this.performanceHistory.responseTimes.slice(-20)
            },
            analysis: this.generatePerformanceAnalysis(),
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * 성능 통계 출력
     */
    printStatistics() {
        console.log('\n📊 === 성능 모니터링 통계 ===');
        console.log(`🎮 게임 생성: ${this.metrics.gameGeneration.totalGenerations}회 (성공률: ${(this.metrics.gameGeneration.successfulGenerations / this.metrics.gameGeneration.totalGenerations * 100).toFixed(1)}%)`);
        console.log(`⏱️ 평균 생성 시간: ${Math.round(this.metrics.gameGeneration.averageGenerationTime / 1000)}초`);
        console.log(`🤖 AI 평균 응답 시간: ${Math.round(this.metrics.aiModel.averageResponseTime)}ms`);
        console.log(`✅ 평균 검증 점수: ${this.metrics.validation.averageScore.toFixed(1)}점`);
        console.log(`📋 요구사항 수집 완료율: ${(this.metrics.requirementCollection.completedSessions / this.metrics.requirementCollection.totalSessions * 100).toFixed(1)}%`);
        console.log(`💾 현재 메모리 사용량: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
        console.log(`🔄 활성 세션: ${this.activeSessions.size}개`);
        console.log('================================\n');
    }
}

module.exports = PerformanceMonitor;