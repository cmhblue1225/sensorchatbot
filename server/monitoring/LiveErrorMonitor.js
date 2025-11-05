/**
 * 실시간 에러 모니터링 시스템
 * - 생성된 게임의 실시간 에러 감지
 * - WebSocket을 통한 실시간 알림
 * - 자동 수정 트리거
 * - 모니터링 대시보드 지원
 */

const EventEmitter = require('events');
const ErrorDetectionEngine = require('../validation/ErrorDetectionEngine');

class LiveErrorMonitor extends EventEmitter {
    constructor() {
        super();
        this.version = "1.0.0";
        this.isMonitoring = false;
        this.monitoredGames = new Map();
        this.errorDetectionEngine = new ErrorDetectionEngine();
        this.alertThresholds = {
            critical: 1,    // 즉시 알림
            high: 2,        // 2개 이상 시 알림
            medium: 5,      // 5개 이상 시 알림
            low: 10         // 10개 이상 시 알림
        };

        // 모니터링 통계
        this.stats = {
            totalDetections: 0,
            autoFixAttempts: 0,
            successfulFixes: 0,
            alertsSent: 0,
            monitoringStartTime: null
        };

        console.log('📡 LiveErrorMonitor v1.0 초기화 완료');
    }

    /**
     * 실시간 모니터링 시작
     */
    startMonitoring() {
        if (this.isMonitoring) {
            console.log('⚠️ 이미 모니터링이 실행 중입니다.');
            return false;
        }

        this.isMonitoring = true;
        this.stats.monitoringStartTime = Date.now();

        // 주기적 검사 시작 (30초마다)
        this.monitoringInterval = setInterval(() => {
            this.performScheduledCheck();
        }, 30000);

        // 즉시 검사 실행
        this.performScheduledCheck();

        console.log('🔍 실시간 에러 모니터링 시작됨');
        this.emit('monitoring_started');

        return true;
    }

    /**
     * 실시간 모니터링 중지
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            console.log('⚠️ 모니터링이 실행되고 있지 않습니다.');
            return false;
        }

        this.isMonitoring = false;

        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        console.log('🛑 실시간 에러 모니터링 중지됨');
        this.emit('monitoring_stopped');

        return true;
    }

    /**
     * 게임 모니터링 등록
     */
    registerGame(gameId, gameCode, gameType = 'solo', metadata = {}) {
        const gameInfo = {
            gameId: gameId,
            gameCode: gameCode,
            gameType: gameType,
            metadata: metadata,
            registeredAt: Date.now(),
            lastChecked: null,
            errorHistory: [],
            currentErrors: [],
            autoFixEnabled: true,
            alertsEnabled: true
        };

        this.monitoredGames.set(gameId, gameInfo);

        console.log(`📝 게임 모니터링 등록: ${gameId} (${gameType})`);

        // 즉시 초기 검사 실행
        if (this.isMonitoring) {
            this.checkGameErrors(gameId);
        }

        this.emit('game_registered', { gameId, gameType });

        return true;
    }

    /**
     * 게임 모니터링 해제
     */
    unregisterGame(gameId) {
        const gameInfo = this.monitoredGames.get(gameId);
        if (!gameInfo) {
            console.log(`⚠️ 등록되지 않은 게임입니다: ${gameId}`);
            return false;
        }

        this.monitoredGames.delete(gameId);
        console.log(`🗑️ 게임 모니터링 해제: ${gameId}`);

        this.emit('game_unregistered', { gameId });

        return true;
    }

    /**
     * 특정 게임의 에러 검사
     */
    async checkGameErrors(gameId) {
        const gameInfo = this.monitoredGames.get(gameId);
        if (!gameInfo) {
            console.log(`⚠️ 등록되지 않은 게임입니다: ${gameId}`);
            return null;
        }

        try {
            console.log(`🔍 게임 에러 검사 시작: ${gameId}`);

            // 에러 감지 실행
            const detectionResult = await this.errorDetectionEngine.detectErrors(
                gameInfo.gameCode,
                gameInfo.gameType
            );

            this.stats.totalDetections++;
            gameInfo.lastChecked = Date.now();

            // 이전 에러와 비교하여 변화 감지
            const errorChanges = this.compareErrors(gameInfo.currentErrors, detectionResult.errors);
            gameInfo.currentErrors = detectionResult.errors;

            // 에러 히스토리 업데이트
            gameInfo.errorHistory.push({
                timestamp: Date.now(),
                errorCount: detectionResult.errors.length,
                errors: detectionResult.errors.map(e => ({
                    type: e.type,
                    severity: e.severity,
                    message: e.message
                }))
            });

            // 히스토리 최대 50개로 제한
            if (gameInfo.errorHistory.length > 50) {
                gameInfo.errorHistory = gameInfo.errorHistory.slice(-50);
            }

            const result = {
                gameId: gameId,
                detectionResult: detectionResult,
                errorChanges: errorChanges,
                timestamp: Date.now()
            };

            // 새로운 에러 발견 시 처리
            if (errorChanges.newErrors.length > 0) {
                await this.handleNewErrors(gameId, errorChanges.newErrors);
            }

            // 알림 체크
            if (gameInfo.alertsEnabled) {
                this.checkAlertThresholds(gameId, detectionResult.errors);
            }

            // 자동 수정 체크
            if (gameInfo.autoFixEnabled && detectionResult.errors.length > 0) {
                await this.attemptAutoFix(gameId, detectionResult.errors);
            }

            console.log(`✅ 게임 에러 검사 완료: ${gameId} (${detectionResult.errors.length}개 오류)`);

            this.emit('game_checked', result);

            return result;

        } catch (error) {
            console.error(`❌ 게임 에러 검사 실패: ${gameId}`, error);

            this.emit('check_error', {
                gameId: gameId,
                error: error.message,
                timestamp: Date.now()
            });

            return null;
        }
    }

    /**
     * 주기적 검사 실행
     */
    async performScheduledCheck() {
        if (!this.isMonitoring) return;

        console.log(`🔄 주기적 검사 시작 (${this.monitoredGames.size}개 게임)`);

        const checkPromises = [];
        for (const gameId of this.monitoredGames.keys()) {
            checkPromises.push(this.checkGameErrors(gameId));
        }

        try {
            await Promise.all(checkPromises);
            console.log('✅ 주기적 검사 완료');
        } catch (error) {
            console.error('❌ 주기적 검사 중 오류:', error);
        }
    }

    /**
     * 에러 변화 비교
     */
    compareErrors(previousErrors, currentErrors) {
        const newErrors = currentErrors.filter(current =>
            !previousErrors.some(prev =>
                prev.type === current.type &&
                prev.message === current.message
            )
        );

        const resolvedErrors = previousErrors.filter(prev =>
            !currentErrors.some(current =>
                current.type === prev.type &&
                current.message === prev.message
            )
        );

        return {
            newErrors: newErrors,
            resolvedErrors: resolvedErrors,
            totalNew: newErrors.length,
            totalResolved: resolvedErrors.length,
            netChange: newErrors.length - resolvedErrors.length
        };
    }

    /**
     * 새로운 에러 처리
     */
    async handleNewErrors(gameId, newErrors) {
        console.log(`🚨 새로운 에러 발견: ${gameId} (${newErrors.length}개)`);

        // 심각도별 분류
        const criticalErrors = newErrors.filter(e => e.severity === 'critical');
        const highErrors = newErrors.filter(e => e.severity === 'high');

        // 즉시 처리가 필요한 에러들
        if (criticalErrors.length > 0) {
            console.log(`🔥 치명적 에러 감지: ${gameId} (${criticalErrors.length}개)`);

            this.emit('critical_errors_detected', {
                gameId: gameId,
                errors: criticalErrors,
                timestamp: Date.now()
            });

            // 즉시 자동 수정 시도
            await this.attemptAutoFix(gameId, criticalErrors);
        }

        // 알림 발송
        this.emit('new_errors_detected', {
            gameId: gameId,
            newErrors: newErrors,
            criticalCount: criticalErrors.length,
            highCount: highErrors.length,
            timestamp: Date.now()
        });
    }

    /**
     * 알림 임계치 확인
     */
    checkAlertThresholds(gameId, errors) {
        const errorsBySeverity = {
            critical: errors.filter(e => e.severity === 'critical').length,
            high: errors.filter(e => e.severity === 'high').length,
            medium: errors.filter(e => e.severity === 'medium').length,
            low: errors.filter(e => e.severity === 'low').length
        };

        let shouldAlert = false;
        const alertReasons = [];

        Object.keys(this.alertThresholds).forEach(severity => {
            if (errorsBySeverity[severity] >= this.alertThresholds[severity]) {
                shouldAlert = true;
                alertReasons.push(`${severity}: ${errorsBySeverity[severity]}개`);
            }
        });

        if (shouldAlert) {
            this.stats.alertsSent++;

            this.emit('alert_triggered', {
                gameId: gameId,
                errorCounts: errorsBySeverity,
                reasons: alertReasons,
                timestamp: Date.now()
            });

            console.log(`🚨 알림 발송: ${gameId} - ${alertReasons.join(', ')}`);
        }
    }

    /**
     * 자동 수정 시도
     */
    async attemptAutoFix(gameId, errors) {
        const gameInfo = this.monitoredGames.get(gameId);
        if (!gameInfo || !gameInfo.autoFixEnabled) {
            return;
        }

        console.log(`🔧 자동 수정 시도: ${gameId} (${errors.length}개 오류)`);

        try {
            this.stats.autoFixAttempts++;

            const fixResult = await this.errorDetectionEngine.autoFixErrors(
                gameInfo.gameCode,
                errors
            );

            if (fixResult.fixCount > 0) {
                this.stats.successfulFixes++;

                // 수정된 코드로 업데이트
                gameInfo.gameCode = fixResult.fixedCode;

                console.log(`✅ 자동 수정 완료: ${gameId} (${fixResult.fixCount}개 수정됨)`);

                this.emit('auto_fix_completed', {
                    gameId: gameId,
                    fixResult: fixResult,
                    timestamp: Date.now()
                });

                // 수정 후 재검사
                setTimeout(() => {
                    this.checkGameErrors(gameId);
                }, 5000);

            } else {
                console.log(`⚠️ 자동 수정 실패: ${gameId} - 수정 가능한 오류 없음`);

                this.emit('auto_fix_failed', {
                    gameId: gameId,
                    reason: '수정 가능한 오류 없음',
                    timestamp: Date.now()
                });
            }

        } catch (error) {
            console.error(`❌ 자동 수정 중 오류: ${gameId}`, error);

            this.emit('auto_fix_error', {
                gameId: gameId,
                error: error.message,
                timestamp: Date.now()
            });
        }
    }

    /**
     * 모니터링 설정 변경
     */
    updateGameSettings(gameId, settings) {
        const gameInfo = this.monitoredGames.get(gameId);
        if (!gameInfo) {
            return false;
        }

        // 설정 업데이트
        Object.keys(settings).forEach(key => {
            if (gameInfo.hasOwnProperty(key)) {
                gameInfo[key] = settings[key];
            }
        });

        console.log(`⚙️ 게임 설정 업데이트: ${gameId}`);

        this.emit('game_settings_updated', {
            gameId: gameId,
            settings: settings,
            timestamp: Date.now()
        });

        return true;
    }

    /**
     * 알림 임계치 설정
     */
    setAlertThresholds(thresholds) {
        Object.keys(thresholds).forEach(severity => {
            if (this.alertThresholds.hasOwnProperty(severity)) {
                this.alertThresholds[severity] = thresholds[severity];
            }
        });

        console.log('⚙️ 알림 임계치 업데이트:', this.alertThresholds);

        this.emit('thresholds_updated', {
            thresholds: this.alertThresholds,
            timestamp: Date.now()
        });
    }

    /**
     * 모니터링 상태 조회
     */
    getMonitoringStatus() {
        return {
            isMonitoring: this.isMonitoring,
            registeredGames: this.monitoredGames.size,
            alertThresholds: this.alertThresholds,
            stats: {
                ...this.stats,
                uptime: this.stats.monitoringStartTime
                    ? Date.now() - this.stats.monitoringStartTime
                    : 0
            }
        };
    }

    /**
     * 게임별 상태 조회
     */
    getGameStatus(gameId) {
        const gameInfo = this.monitoredGames.get(gameId);
        if (!gameInfo) {
            return null;
        }

        return {
            gameId: gameId,
            gameType: gameInfo.gameType,
            registeredAt: gameInfo.registeredAt,
            lastChecked: gameInfo.lastChecked,
            currentErrorCount: gameInfo.currentErrors.length,
            errorHistoryCount: gameInfo.errorHistory.length,
            autoFixEnabled: gameInfo.autoFixEnabled,
            alertsEnabled: gameInfo.alertsEnabled,
            recentErrors: gameInfo.errorHistory.slice(-10)
        };
    }

    /**
     * 전체 게임 목록 조회
     */
    getAllGamesStatus() {
        const games = [];

        for (const [gameId, gameInfo] of this.monitoredGames) {
            games.push({
                gameId: gameId,
                gameType: gameInfo.gameType,
                lastChecked: gameInfo.lastChecked,
                errorCount: gameInfo.currentErrors.length,
                autoFixEnabled: gameInfo.autoFixEnabled,
                alertsEnabled: gameInfo.alertsEnabled
            });
        }

        return {
            totalGames: games.length,
            games: games,
            monitoringStatus: this.getMonitoringStatus()
        };
    }

    /**
     * 상세 통계 조회
     */
    getDetailedStatistics() {
        const errorCategoryStats = {};
        const severityStats = { critical: 0, high: 0, medium: 0, low: 0 };

        // 현재 등록된 모든 게임의 에러 통계
        for (const gameInfo of this.monitoredGames.values()) {
            gameInfo.currentErrors.forEach(error => {
                // 카테고리별 통계
                const category = error.category || 'unknown';
                errorCategoryStats[category] = (errorCategoryStats[category] || 0) + 1;

                // 심각도별 통계
                if (severityStats.hasOwnProperty(error.severity)) {
                    severityStats[error.severity]++;
                }
            });
        }

        return {
            ...this.stats,
            currentStats: {
                errorCategoryStats: errorCategoryStats,
                severityStats: severityStats,
                activeGames: this.monitoredGames.size,
                totalCurrentErrors: Object.values(severityStats).reduce((a, b) => a + b, 0)
            },
            uptime: this.stats.monitoringStartTime
                ? Date.now() - this.stats.monitoringStartTime
                : 0
        };
    }

    /**
     * 리소스 정리
     */
    cleanup() {
        console.log('🧹 LiveErrorMonitor 정리 중...');

        this.stopMonitoring();
        this.monitoredGames.clear();
        this.removeAllListeners();

        console.log('✅ LiveErrorMonitor 정리 완료');
    }
}

module.exports = LiveErrorMonitor;