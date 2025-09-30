/**
 * 생성 성능 모니터링 시스템
 * - AI 게임 생성 성능 실시간 모니터링
 * - 성공률, 응답시간, 품질 점수 추적
 * - 성능 트렌드 분석 및 예측
 * - 자동 성능 최적화 제안
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class PerformanceMonitor extends EventEmitter {
    constructor() {
        super();
        this.version = "1.0.0";
        this.isMonitoring = false;

        // 성능 메트릭스
        this.metrics = {
            generation: {
                total: 0,
                successful: 0,
                failed: 0,
                successRate: 0,
                averageTime: 0,
                averageQuality: 0
            },
            responseTime: {
                current: 0,
                average: 0,
                min: Infinity,
                max: 0,
                history: []
            },
            quality: {
                current: 0,
                average: 0,
                distribution: {
                    excellent: 0,  // 90-100
                    good: 0,       // 70-89
                    fair: 0,       // 50-69
                    poor: 0        // 0-49
                },
                history: []
            },
            errors: {
                total: 0,
                byType: new Map(),
                byCategory: new Map(),
                criticalCount: 0,
                resolutionRate: 0
            },
            gameTypes: {
                solo: { total: 0, successful: 0, avgTime: 0, avgQuality: 0 },
                dual: { total: 0, successful: 0, avgTime: 0, avgQuality: 0 },
                multi: { total: 0, successful: 0, avgTime: 0, avgQuality: 0 }
            }
        };

        // 성능 이력 (최근 1000개 기록)
        this.performanceHistory = [];
        this.maxHistorySize = 1000;

        // 실시간 통계
        this.realtimeStats = {
            lastHour: { generations: 0, successRate: 0, avgTime: 0 },
            last24Hours: { generations: 0, successRate: 0, avgTime: 0 },
            lastWeek: { generations: 0, successRate: 0, avgTime: 0 }
        };

        // 성능 임계치
        this.thresholds = {
            successRate: {
                excellent: 95,
                good: 85,
                warning: 70,
                critical: 50
            },
            responseTime: {
                excellent: 3000,   // 3초
                good: 5000,        // 5초
                warning: 10000,    // 10초
                critical: 15000    // 15초
            },
            quality: {
                excellent: 90,
                good: 70,
                warning: 50,
                critical: 30
            }
        };

        // 모니터링 시작 시간
        this.startTime = null;

        console.log('📊 PerformanceMonitor v1.0 초기화 완료');
    }

    /**
     * 성능 모니터링 시작
     */
    startMonitoring() {
        if (this.isMonitoring) {
            console.log('⚠️ 성능 모니터링이 이미 실행 중입니다.');
            return false;
        }

        this.isMonitoring = true;
        this.startTime = Date.now();

        // 주기적 통계 업데이트 (10초마다)
        this.statsInterval = setInterval(() => {
            this.updateRealtimeStats();
        }, 10000);

        // 성능 분석 리포트 생성 (5분마다)
        this.reportInterval = setInterval(() => {
            this.generatePerformanceReport();
        }, 300000);

        // 성능 이력 저장 (1시간마다)
        this.saveInterval = setInterval(() => {
            this.savePerformanceHistory();
        }, 3600000);

        console.log('📊 성능 모니터링 시작됨');
        this.emit('monitoring_started');

        return true;
    }

    /**
     * 성능 모니터링 중지
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            console.log('⚠️ 성능 모니터링이 실행되고 있지 않습니다.');
            return false;
        }

        this.isMonitoring = false;

        // 인터벌 정리
        if (this.statsInterval) clearInterval(this.statsInterval);
        if (this.reportInterval) clearInterval(this.reportInterval);
        if (this.saveInterval) clearInterval(this.saveInterval);

        console.log('🛑 성능 모니터링 중지됨');
        this.emit('monitoring_stopped');

        return true;
    }

    /**
     * 게임 생성 시작 기록
     */
    recordGenerationStart(requestData) {
        const generationId = requestData.generationId || `gen_${Date.now()}`;

        const startRecord = {
            generationId: generationId,
            startTime: Date.now(),
            gameType: requestData.gameType || 'solo',
            userInput: requestData.userInput,
            requestSize: JSON.stringify(requestData).length,
            status: 'started'
        };

        // 임시 기록 저장 (완료 시까지)
        if (!this.pendingGenerations) {
            this.pendingGenerations = new Map();
        }
        this.pendingGenerations.set(generationId, startRecord);

        console.log(`📊 게임 생성 시작 기록: ${generationId}`);

        return generationId;
    }

    /**
     * 게임 생성 완료 기록
     */
    recordGenerationComplete(generationId, result) {
        const endTime = Date.now();

        // 시작 기록 조회
        let startRecord = null;
        if (this.pendingGenerations && this.pendingGenerations.has(generationId)) {
            startRecord = this.pendingGenerations.get(generationId);
            this.pendingGenerations.delete(generationId);
        }

        const startTime = startRecord ? startRecord.startTime : endTime - 5000; // 기본 5초로 추정
        const responseTime = endTime - startTime;
        const gameType = startRecord ? startRecord.gameType : (result.gameAnalysis?.gameType || 'solo');

        // 성공 여부 판단
        const isSuccessful = result.success === true && result.gameCode && result.gameCode.length > 100;

        // 품질 점수 계산
        const qualityScore = this.calculateQualityScore(result);

        // 메트릭스 업데이트
        this.updateMetrics(isSuccessful, responseTime, qualityScore, gameType, result);

        // 성능 이력에 추가
        const performanceRecord = {
            generationId: generationId,
            timestamp: endTime,
            startTime: startTime,
            endTime: endTime,
            responseTime: responseTime,
            gameType: gameType,
            isSuccessful: isSuccessful,
            qualityScore: qualityScore,
            errorCount: result.errorDetection ? result.errorDetection.errors.length : 0,
            autoFixCount: result.autoFix ? result.autoFix.fixCount : 0,
            codeLength: result.gameCode ? result.gameCode.length : 0,
            userInput: startRecord ? startRecord.userInput : 'Unknown'
        };

        this.addToHistory(performanceRecord);

        console.log(`📊 게임 생성 완료 기록: ${generationId} (${responseTime}ms, 품질: ${qualityScore})`);

        // 성능 이벤트 발생
        this.emit('generation_completed', performanceRecord);

        // 성능 임계치 체크
        this.checkPerformanceThresholds(performanceRecord);

        return performanceRecord;
    }

    /**
     * 메트릭스 업데이트
     */
    updateMetrics(isSuccessful, responseTime, qualityScore, gameType, result) {
        // 전체 생성 통계
        this.metrics.generation.total++;
        if (isSuccessful) {
            this.metrics.generation.successful++;
        } else {
            this.metrics.generation.failed++;
        }
        this.metrics.generation.successRate =
            (this.metrics.generation.successful / this.metrics.generation.total) * 100;

        // 응답 시간 통계
        this.metrics.responseTime.current = responseTime;
        this.metrics.responseTime.history.push(responseTime);
        if (this.metrics.responseTime.history.length > 100) {
            this.metrics.responseTime.history.shift();
        }
        this.metrics.responseTime.average =
            this.metrics.responseTime.history.reduce((a, b) => a + b, 0) / this.metrics.responseTime.history.length;
        this.metrics.responseTime.min = Math.min(this.metrics.responseTime.min, responseTime);
        this.metrics.responseTime.max = Math.max(this.metrics.responseTime.max, responseTime);

        // 품질 점수 통계
        this.metrics.quality.current = qualityScore;
        this.metrics.quality.history.push(qualityScore);
        if (this.metrics.quality.history.length > 100) {
            this.metrics.quality.history.shift();
        }
        this.metrics.quality.average =
            this.metrics.quality.history.reduce((a, b) => a + b, 0) / this.metrics.quality.history.length;

        // 품질 분포 업데이트
        if (qualityScore >= 90) this.metrics.quality.distribution.excellent++;
        else if (qualityScore >= 70) this.metrics.quality.distribution.good++;
        else if (qualityScore >= 50) this.metrics.quality.distribution.fair++;
        else this.metrics.quality.distribution.poor++;

        // 게임 타입별 통계
        if (this.metrics.gameTypes[gameType]) {
            const typeStats = this.metrics.gameTypes[gameType];
            typeStats.total++;
            if (isSuccessful) typeStats.successful++;

            // 평균 계산 (점진적 업데이트)
            typeStats.avgTime = (typeStats.avgTime * (typeStats.total - 1) + responseTime) / typeStats.total;
            typeStats.avgQuality = (typeStats.avgQuality * (typeStats.total - 1) + qualityScore) / typeStats.total;
        }

        // 에러 통계
        if (result.errorDetection && result.errorDetection.errors.length > 0) {
            this.metrics.errors.total += result.errorDetection.errors.length;

            result.errorDetection.errors.forEach(error => {
                // 타입별 에러 통계
                const errorType = error.type || 'unknown';
                this.metrics.errors.byType.set(errorType,
                    (this.metrics.errors.byType.get(errorType) || 0) + 1);

                // 카테고리별 에러 통계
                const errorCategory = error.category || 'unknown';
                this.metrics.errors.byCategory.set(errorCategory,
                    (this.metrics.errors.byCategory.get(errorCategory) || 0) + 1);

                // 치명적 에러 카운트
                if (error.severity === 'critical') {
                    this.metrics.errors.criticalCount++;
                }
            });

            // 해결률 계산
            const fixedCount = result.autoFix ? result.autoFix.fixCount : 0;
            if (fixedCount > 0) {
                const totalResolved = this.metrics.errors.totalResolved || 0;
                this.metrics.errors.totalResolved = totalResolved + fixedCount;
                this.metrics.errors.resolutionRate =
                    (this.metrics.errors.totalResolved / this.metrics.errors.total) * 100;
            }
        }
    }

    /**
     * 품질 점수 계산
     */
    calculateQualityScore(result) {
        let score = 0;

        // 기본 성공 점수 (40점)
        if (result.success && result.gameCode) {
            score += 40;
        }

        // 코드 길이 기반 점수 (20점)
        if (result.gameCode) {
            const codeLength = result.gameCode.length;
            if (codeLength > 5000) score += 20;
            else if (codeLength > 3000) score += 15;
            else if (codeLength > 1000) score += 10;
            else if (codeLength > 500) score += 5;
        }

        // 에러 없음 보너스 (20점)
        const errorCount = result.errorDetection ? result.errorDetection.errors.length : 0;
        if (errorCount === 0) {
            score += 20;
        } else if (errorCount <= 2) {
            score += 15;
        } else if (errorCount <= 5) {
            score += 10;
        } else {
            score += Math.max(0, 10 - errorCount);
        }

        // 자동 수정 성공 보너스 (10점)
        const fixCount = result.autoFix ? result.autoFix.fixCount : 0;
        if (fixCount > 0) {
            score += Math.min(10, fixCount * 2);
        }

        // 검증 통과 보너스 (10점)
        if (result.validation && result.validation.isValid) {
            score += 10;
        }

        return Math.min(100, Math.max(0, score));
    }

    /**
     * 성능 이력에 추가
     */
    addToHistory(record) {
        this.performanceHistory.push(record);

        // 최대 크기 유지
        if (this.performanceHistory.length > this.maxHistorySize) {
            this.performanceHistory.shift();
        }
    }

    /**
     * 실시간 통계 업데이트
     */
    updateRealtimeStats() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const oneDay = 24 * oneHour;
        const oneWeek = 7 * oneDay;

        // 시간대별 필터링
        const lastHourRecords = this.performanceHistory.filter(r => now - r.timestamp < oneHour);
        const last24HourRecords = this.performanceHistory.filter(r => now - r.timestamp < oneDay);
        const lastWeekRecords = this.performanceHistory.filter(r => now - r.timestamp < oneWeek);

        // 통계 계산
        this.realtimeStats.lastHour = this.calculatePeriodStats(lastHourRecords);
        this.realtimeStats.last24Hours = this.calculatePeriodStats(last24HourRecords);
        this.realtimeStats.lastWeek = this.calculatePeriodStats(lastWeekRecords);
    }

    /**
     * 특정 기간 통계 계산
     */
    calculatePeriodStats(records) {
        if (records.length === 0) {
            return { generations: 0, successRate: 0, avgTime: 0, avgQuality: 0 };
        }

        const successful = records.filter(r => r.isSuccessful).length;
        const totalTime = records.reduce((sum, r) => sum + r.responseTime, 0);
        const totalQuality = records.reduce((sum, r) => sum + r.qualityScore, 0);

        return {
            generations: records.length,
            successRate: (successful / records.length) * 100,
            avgTime: totalTime / records.length,
            avgQuality: totalQuality / records.length
        };
    }

    /**
     * 성능 임계치 체크
     */
    checkPerformanceThresholds(record) {
        const alerts = [];

        // 성공률 체크
        if (this.metrics.generation.successRate < this.thresholds.successRate.critical) {
            alerts.push({
                type: 'success_rate_critical',
                message: `생성 성공률이 임계치 이하입니다: ${this.metrics.generation.successRate.toFixed(1)}%`,
                severity: 'critical',
                value: this.metrics.generation.successRate,
                threshold: this.thresholds.successRate.critical
            });
        } else if (this.metrics.generation.successRate < this.thresholds.successRate.warning) {
            alerts.push({
                type: 'success_rate_warning',
                message: `생성 성공률이 경고 수준입니다: ${this.metrics.generation.successRate.toFixed(1)}%`,
                severity: 'warning',
                value: this.metrics.generation.successRate,
                threshold: this.thresholds.successRate.warning
            });
        }

        // 응답 시간 체크
        if (record.responseTime > this.thresholds.responseTime.critical) {
            alerts.push({
                type: 'response_time_critical',
                message: `응답 시간이 임계치를 초과했습니다: ${record.responseTime}ms`,
                severity: 'critical',
                value: record.responseTime,
                threshold: this.thresholds.responseTime.critical
            });
        } else if (record.responseTime > this.thresholds.responseTime.warning) {
            alerts.push({
                type: 'response_time_warning',
                message: `응답 시간이 경고 수준입니다: ${record.responseTime}ms`,
                severity: 'warning',
                value: record.responseTime,
                threshold: this.thresholds.responseTime.warning
            });
        }

        // 품질 점수 체크
        if (record.qualityScore < this.thresholds.quality.critical) {
            alerts.push({
                type: 'quality_critical',
                message: `품질 점수가 임계치 이하입니다: ${record.qualityScore}`,
                severity: 'critical',
                value: record.qualityScore,
                threshold: this.thresholds.quality.critical
            });
        } else if (record.qualityScore < this.thresholds.quality.warning) {
            alerts.push({
                type: 'quality_warning',
                message: `품질 점수가 경고 수준입니다: ${record.qualityScore}`,
                severity: 'warning',
                value: record.qualityScore,
                threshold: this.thresholds.quality.warning
            });
        }

        // 알림 발송
        if (alerts.length > 0) {
            this.emit('performance_alerts', {
                generationId: record.generationId,
                alerts: alerts,
                timestamp: Date.now()
            });

            console.log(`🚨 성능 알림 발생: ${alerts.length}개 (${record.generationId})`);
        }
    }

    /**
     * 성능 리포트 생성
     */
    generatePerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            uptime: this.startTime ? Date.now() - this.startTime : 0,
            overview: {
                totalGenerations: this.metrics.generation.total,
                successRate: this.metrics.generation.successRate,
                averageResponseTime: this.metrics.responseTime.average,
                averageQuality: this.metrics.quality.average
            },
            metrics: this.metrics,
            realtimeStats: this.realtimeStats,
            trends: this.analyzeTrends(),
            recommendations: this.generateRecommendations()
        };

        console.log('📊 성능 리포트 생성됨');
        this.emit('performance_report_generated', report);

        return report;
    }

    /**
     * 트렌드 분석
     */
    analyzeTrends() {
        if (this.performanceHistory.length < 10) {
            return { message: '트렌드 분석을 위한 데이터가 부족합니다.' };
        }

        // 최근 데이터 분석 (최근 50개 vs 이전 50개)
        const recentData = this.performanceHistory.slice(-50);
        const previousData = this.performanceHistory.slice(-100, -50);

        if (previousData.length === 0) {
            return { message: '비교할 이전 데이터가 없습니다.' };
        }

        // 성공률 트렌드
        const recentSuccessRate = (recentData.filter(r => r.isSuccessful).length / recentData.length) * 100;
        const previousSuccessRate = (previousData.filter(r => r.isSuccessful).length / previousData.length) * 100;
        const successRateTrend = recentSuccessRate - previousSuccessRate;

        // 응답시간 트렌드
        const recentAvgTime = recentData.reduce((sum, r) => sum + r.responseTime, 0) / recentData.length;
        const previousAvgTime = previousData.reduce((sum, r) => sum + r.responseTime, 0) / previousData.length;
        const responseTimeTrend = recentAvgTime - previousAvgTime;

        // 품질 트렌드
        const recentAvgQuality = recentData.reduce((sum, r) => sum + r.qualityScore, 0) / recentData.length;
        const previousAvgQuality = previousData.reduce((sum, r) => sum + r.qualityScore, 0) / previousData.length;
        const qualityTrend = recentAvgQuality - previousAvgQuality;

        return {
            successRate: {
                current: recentSuccessRate,
                previous: previousSuccessRate,
                trend: successRateTrend,
                direction: successRateTrend > 0 ? 'improving' : successRateTrend < 0 ? 'declining' : 'stable'
            },
            responseTime: {
                current: recentAvgTime,
                previous: previousAvgTime,
                trend: responseTimeTrend,
                direction: responseTimeTrend < 0 ? 'improving' : responseTimeTrend > 0 ? 'declining' : 'stable'
            },
            quality: {
                current: recentAvgQuality,
                previous: previousAvgQuality,
                trend: qualityTrend,
                direction: qualityTrend > 0 ? 'improving' : qualityTrend < 0 ? 'declining' : 'stable'
            }
        };
    }

    /**
     * 성능 개선 권장사항 생성
     */
    generateRecommendations() {
        const recommendations = [];

        // 성공률 기반 권장사항
        if (this.metrics.generation.successRate < 70) {
            recommendations.push({
                type: 'success_rate',
                priority: 'high',
                message: '프롬프트 템플릿을 재검토하고 AI 모델 설정을 최적화하세요.',
                action: 'optimize_prompts'
            });
        }

        // 응답시간 기반 권장사항
        if (this.metrics.responseTime.average > 10000) {
            recommendations.push({
                type: 'response_time',
                priority: 'medium',
                message: 'AI 모델 요청을 병렬화하거나 캐싱을 도입하세요.',
                action: 'optimize_performance'
            });
        }

        // 품질 기반 권장사항
        if (this.metrics.quality.average < 60) {
            recommendations.push({
                type: 'quality',
                priority: 'high',
                message: '코드 검증 로직을 강화하고 품질 체크 기준을 개선하세요.',
                action: 'improve_quality'
            });
        }

        // 에러 기반 권장사항
        if (this.metrics.errors.resolutionRate < 80) {
            recommendations.push({
                type: 'error_resolution',
                priority: 'medium',
                message: '자동 수정 알고리즘을 개선하고 에러 패턴을 분석하세요.',
                action: 'improve_error_handling'
            });
        }

        return recommendations;
    }

    /**
     * 성능 이력 저장
     */
    async savePerformanceHistory() {
        try {
            const reportsDir = path.join(process.cwd(), 'performance-reports');
            await fs.mkdir(reportsDir, { recursive: true });

            const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-');
            const filename = `performance-history-${timestamp}.json`;
            const filepath = path.join(reportsDir, filename);

            const data = {
                timestamp: new Date().toISOString(),
                metrics: this.metrics,
                realtimeStats: this.realtimeStats,
                history: this.performanceHistory.slice(-500), // 최근 500개만 저장
                trends: this.analyzeTrends(),
                recommendations: this.generateRecommendations()
            };

            await fs.writeFile(filepath, JSON.stringify(data, null, 2));
            console.log(`💾 성능 이력 저장됨: ${filepath}`);

        } catch (error) {
            console.error('❌ 성능 이력 저장 실패:', error.message);
        }
    }

    /**
     * 현재 성능 상태 조회
     */
    getCurrentStatus() {
        return {
            isMonitoring: this.isMonitoring,
            uptime: this.startTime ? Date.now() - this.startTime : 0,
            metrics: this.metrics,
            realtimeStats: this.realtimeStats,
            historySize: this.performanceHistory.length,
            thresholds: this.thresholds
        };
    }

    /**
     * 상세 통계 조회
     */
    getDetailedStats() {
        return {
            ...this.getCurrentStatus(),
            trends: this.analyzeTrends(),
            recommendations: this.generateRecommendations(),
            topErrors: this.getTopErrors(),
            gameTypeComparison: this.compareGameTypes()
        };
    }

    /**
     * 상위 에러 목록 조회
     */
    getTopErrors() {
        const errorsByType = Array.from(this.metrics.errors.byType.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const errorsByCategory = Array.from(this.metrics.errors.byCategory.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        return {
            byType: errorsByType,
            byCategory: errorsByCategory
        };
    }

    /**
     * 게임 타입별 성능 비교
     */
    compareGameTypes() {
        const comparison = {};

        Object.keys(this.metrics.gameTypes).forEach(type => {
            const stats = this.metrics.gameTypes[type];
            comparison[type] = {
                ...stats,
                successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0
            };
        });

        return comparison;
    }

    /**
     * 임계치 설정 업데이트
     */
    updateThresholds(newThresholds) {
        Object.keys(newThresholds).forEach(category => {
            if (this.thresholds[category]) {
                Object.assign(this.thresholds[category], newThresholds[category]);
            }
        });

        console.log('⚙️ 성능 임계치 업데이트됨');
        this.emit('thresholds_updated', this.thresholds);
    }

    /**
     * 리소스 정리
     */
    cleanup() {
        console.log('🧹 PerformanceMonitor 정리 중...');

        this.stopMonitoring();
        this.removeAllListeners();

        console.log('✅ PerformanceMonitor 정리 완료');
    }
}

module.exports = PerformanceMonitor;