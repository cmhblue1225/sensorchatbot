/**
 * 성능 모니터링 라우트
 * - 성능 대시보드
 * - 실시간 성능 데이터 API
 * - 성능 리포트 생성
 * - 성능 설정 관리
 */

const express = require('express');
const PerformanceMonitor = require('../monitoring/PerformanceMonitor');

class PerformanceRoutes {
    constructor(performanceMonitor = null) {
        this.router = express.Router();
        this.performanceMonitor = performanceMonitor || new PerformanceMonitor();
        this.setupRoutes();
        console.log('📊 PerformanceRoutes 초기화 완료');
    }

    setupRoutes() {
        // 성능 대시보드 페이지
        this.router.get('/dashboard', (req, res) => {
            res.send(this.generatePerformanceDashboard());
        });

        // 현재 성능 상태 API
        this.router.get('/api/status', (req, res) => {
            try {
                const status = this.performanceMonitor.getCurrentStatus();
                res.json({
                    success: true,
                    data: status
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 상세 성능 통계 API
        this.router.get('/api/stats', (req, res) => {
            try {
                const stats = this.performanceMonitor.getDetailedStats();
                res.json({
                    success: true,
                    data: stats
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 성능 모니터링 시작
        this.router.post('/api/start', (req, res) => {
            try {
                const result = this.performanceMonitor.startMonitoring();
                res.json({
                    success: result,
                    message: result ? '성능 모니터링이 시작되었습니다.' : '이미 모니터링이 실행 중입니다.'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 성능 모니터링 중지
        this.router.post('/api/stop', (req, res) => {
            try {
                const result = this.performanceMonitor.stopMonitoring();
                res.json({
                    success: result,
                    message: result ? '성능 모니터링이 중지되었습니다.' : '모니터링이 실행되고 있지 않습니다.'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 성능 리포트 생성
        this.router.post('/api/generate-report', (req, res) => {
            try {
                const report = this.performanceMonitor.generatePerformanceReport();
                res.json({
                    success: true,
                    data: report
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 임계치 설정 조회
        this.router.get('/api/thresholds', (req, res) => {
            try {
                const status = this.performanceMonitor.getCurrentStatus();
                res.json({
                    success: true,
                    data: status.thresholds
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 임계치 설정 업데이트
        this.router.put('/api/thresholds', (req, res) => {
            try {
                const { thresholds } = req.body;
                this.performanceMonitor.updateThresholds(thresholds);
                res.json({
                    success: true,
                    message: '임계치가 업데이트되었습니다.'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 성능 트렌드 데이터 API
        this.router.get('/api/trends', (req, res) => {
            try {
                const trends = this.performanceMonitor.analyzeTrends();
                res.json({
                    success: true,
                    data: trends
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 게임 타입별 성능 비교 API
        this.router.get('/api/game-types', (req, res) => {
            try {
                const comparison = this.performanceMonitor.compareGameTypes();
                res.json({
                    success: true,
                    data: comparison
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }

    /**
     * 성능 대시보드 HTML 생성
     */
    generatePerformanceDashboard() {
        return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>성능 모니터링 대시보드 - Sensor Game Hub</title>
    <style>
        :root {
            --primary: #3b82f6;
            --success: #10b981;
            --warning: #f59e0b;
            --error: #ef4444;
            --background: #0f172a;
            --surface: #1e293b;
            --surface-light: #334155;
            --text-primary: #f8fafc;
            --text-secondary: #cbd5e1;
            --text-muted: #64748b;
            --border: #475569;
            --radius: 0.5rem;
            --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
            background: var(--background);
            color: var(--text-primary);
            line-height: 1.6;
            overflow-x: hidden;
        }

        .header {
            background: var(--surface);
            border-bottom: 2px solid var(--border);
            padding: 1rem 2rem;
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .header h1 {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 0.5rem;
        }

        .header p {
            color: var(--text-secondary);
            font-size: 0.875rem;
        }

        .controls {
            background: var(--surface);
            padding: 1rem 2rem;
            border-bottom: 1px solid var(--border);
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            align-items: center;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border-radius: var(--radius);
            font-weight: 500;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.875rem;
        }

        .btn-primary {
            background: var(--primary);
            color: white;
        }

        .btn-success {
            background: var(--success);
            color: white;
        }

        .btn-error {
            background: var(--error);
            color: white;
        }

        .btn-secondary {
            background: var(--surface-light);
            color: var(--text-primary);
            border: 1px solid var(--border);
        }

        .btn:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }

        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        .main-content {
            padding: 2rem;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
        }

        .panel {
            background: var(--surface);
            border-radius: var(--radius);
            border: 1px solid var(--border);
            overflow: hidden;
        }

        .panel-header {
            background: var(--surface-light);
            padding: 1rem;
            font-weight: 600;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .panel-content {
            padding: 1rem;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .metric-card {
            background: var(--surface-light);
            padding: 1rem;
            border-radius: var(--radius);
            text-align: center;
            border-left: 4px solid var(--primary);
        }

        .metric-card.success {
            border-left-color: var(--success);
        }

        .metric-card.warning {
            border-left-color: var(--warning);
        }

        .metric-card.error {
            border-left-color: var(--error);
        }

        .metric-value {
            font-size: 2rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
        }

        .metric-label {
            font-size: 0.875rem;
            color: var(--text-secondary);
        }

        .metric-trend {
            font-size: 0.75rem;
            margin-top: 0.25rem;
        }

        .metric-trend.improving {
            color: var(--success);
        }

        .metric-trend.declining {
            color: var(--error);
        }

        .metric-trend.stable {
            color: var(--text-muted);
        }

        .chart-container {
            background: var(--surface-light);
            padding: 1rem;
            border-radius: var(--radius);
            margin-bottom: 1rem;
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted);
        }

        .auto-refresh {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-secondary);
            font-size: 0.875rem;
        }

        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 0.5rem;
        }

        .status-indicator.running {
            background: var(--success);
            animation: pulse 2s infinite;
        }

        .status-indicator.stopped {
            background: var(--error);
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .recommendations {
            background: var(--surface-light);
            padding: 1rem;
            border-radius: var(--radius);
            margin-top: 1rem;
        }

        .recommendation-item {
            padding: 0.5rem 0;
            border-bottom: 1px solid var(--border);
        }

        .recommendation-item:last-child {
            border-bottom: none;
        }

        .recommendation-priority {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
            font-weight: 500;
            margin-right: 0.5rem;
        }

        .recommendation-priority.high {
            background: var(--error);
            color: white;
        }

        .recommendation-priority.medium {
            background: var(--warning);
            color: white;
        }

        .recommendation-priority.low {
            background: var(--text-muted);
            color: white;
        }

        .full-width {
            grid-column: 1 / -1;
        }

        @media (max-width: 768px) {
            .main-content {
                grid-template-columns: 1fr;
                padding: 1rem;
            }

            .controls {
                padding: 1rem;
            }

            .header {
                padding: 1rem;
            }
        }

        .loading {
            opacity: 0.6;
            pointer-events: none;
        }

        .refresh-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 2px solid var(--text-muted);
            border-top: 2px solid var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 0.5rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 성능 모니터링 대시보드</h1>
        <p>Sensor Game Hub v6.0 - AI 게임 생성 성능 실시간 모니터링</p>
    </div>

    <div class="controls">
        <button class="btn btn-success" id="startMonitoringBtn">🚀 모니터링 시작</button>
        <button class="btn btn-error" id="stopMonitoringBtn">🛑 모니터링 중지</button>
        <button class="btn btn-primary" id="refreshBtn">🔄 새로고침</button>
        <button class="btn btn-secondary" id="generateReportBtn">📊 리포트 생성</button>

        <div class="auto-refresh">
            <label>
                <input type="checkbox" id="autoRefreshCheck" checked>
                자동 새로고침 (10초)
            </label>
        </div>

        <div class="auto-refresh" id="lastUpdateTime">
            마지막 업데이트: -
        </div>

        <div class="auto-refresh">
            <span class="status-indicator" id="monitoringStatus"></span>
            <span id="monitoringStatusText">확인 중...</span>
        </div>
    </div>

    <div class="main-content">
        <!-- 전체 성능 메트릭스 -->
        <div class="panel full-width">
            <div class="panel-header">
                <span>📈 전체 성능 지표</span>
                <span id="uptime">업타임: -</span>
            </div>
            <div class="panel-content">
                <div class="metrics-grid" id="metricsGrid">
                    <div class="metric-card">
                        <div class="metric-value" id="totalGenerations">0</div>
                        <div class="metric-label">총 생성</div>
                        <div class="metric-trend stable" id="generationsTrend"></div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="successRate">0%</div>
                        <div class="metric-label">성공률</div>
                        <div class="metric-trend stable" id="successRateTrend"></div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="avgResponseTime">0ms</div>
                        <div class="metric-label">평균 응답시간</div>
                        <div class="metric-trend stable" id="responseTimeTrend"></div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="avgQuality">0</div>
                        <div class="metric-label">평균 품질</div>
                        <div class="metric-trend stable" id="qualityTrend"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 실시간 통계 -->
        <div class="panel">
            <div class="panel-header">⏱️ 실시간 통계</div>
            <div class="panel-content">
                <div id="realtimeStats">
                    <div class="metric-card">
                        <div class="metric-value" id="lastHourGenerations">0</div>
                        <div class="metric-label">최근 1시간</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="last24HourGenerations">0</div>
                        <div class="metric-label">최근 24시간</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="lastWeekGenerations">0</div>
                        <div class="metric-label">최근 1주일</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 게임 타입별 성능 -->
        <div class="panel">
            <div class="panel-header">🎮 게임 타입별 성능</div>
            <div class="panel-content">
                <div id="gameTypeStats">
                    <div class="chart-container">
                        게임 타입별 성능 차트
                        <br><small>데이터 로딩 중...</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- 성능 개선 권장사항 -->
        <div class="panel full-width">
            <div class="panel-header">💡 성능 개선 권장사항</div>
            <div class="panel-content">
                <div class="recommendations" id="recommendations">
                    <div style="text-align: center; color: var(--text-muted);">
                        권장사항을 분석하고 있습니다...
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        class PerformanceDashboard {
            constructor() {
                this.isAutoRefresh = true;
                this.refreshInterval = null;
                this.init();
            }

            init() {
                this.setupEventListeners();
                this.startAutoRefresh();
                this.loadInitialData();
            }

            setupEventListeners() {
                // 버튼 이벤트
                document.getElementById('startMonitoringBtn').addEventListener('click', () => this.startMonitoring());
                document.getElementById('stopMonitoringBtn').addEventListener('click', () => this.stopMonitoring());
                document.getElementById('refreshBtn').addEventListener('click', () => this.refreshData());
                document.getElementById('generateReportBtn').addEventListener('click', () => this.generateReport());

                // 자동 새로고침 토글
                document.getElementById('autoRefreshCheck').addEventListener('change', (e) => {
                    this.isAutoRefresh = e.target.checked;
                    if (this.isAutoRefresh) {
                        this.startAutoRefresh();
                    } else {
                        this.stopAutoRefresh();
                    }
                });
            }

            async loadInitialData() {
                await this.refreshData();
            }

            async refreshData() {
                try {
                    this.setLoading(true);

                    // 성능 상태 로드
                    const statusResponse = await fetch('/performance/api/status');
                    const statusResult = await statusResponse.json();

                    if (statusResult.success) {
                        this.updateUI(statusResult.data);
                    }

                    // 상세 통계 로드
                    const statsResponse = await fetch('/performance/api/stats');
                    const statsResult = await statsResponse.json();

                    if (statsResult.success) {
                        this.updateDetailedStats(statsResult.data);
                    }

                    this.updateLastUpdateTime();

                } catch (error) {
                    this.showError('데이터 로드 실패: ' + error.message);
                } finally {
                    this.setLoading(false);
                }
            }

            updateUI(data) {
                // 모니터링 상태 업데이트
                const statusIndicator = document.getElementById('monitoringStatus');
                const statusText = document.getElementById('monitoringStatusText');

                if (data.isMonitoring) {
                    statusIndicator.className = 'status-indicator running';
                    statusText.textContent = '모니터링 실행 중';
                } else {
                    statusIndicator.className = 'status-indicator stopped';
                    statusText.textContent = '모니터링 중지됨';
                }

                // 업타임 업데이트
                document.getElementById('uptime').textContent = 'Uptime: ' + this.formatUptime(data.uptime);

                // 메트릭스 업데이트
                const metrics = data.metrics;

                document.getElementById('totalGenerations').textContent = metrics.generation.total;
                document.getElementById('successRate').textContent = metrics.generation.successRate.toFixed(1) + '%';
                document.getElementById('avgResponseTime').textContent = Math.round(metrics.responseTime.average) + 'ms';
                document.getElementById('avgQuality').textContent = metrics.quality.average.toFixed(1);

                // 실시간 통계 업데이트
                const realtime = data.realtimeStats;
                document.getElementById('lastHourGenerations').textContent = realtime.lastHour.generations;
                document.getElementById('last24HourGenerations').textContent = realtime.last24Hours.generations;
                document.getElementById('lastWeekGenerations').textContent = realtime.lastWeek.generations;
            }

            updateDetailedStats(data) {
                // 트렌드 업데이트
                this.updateTrends(data.trends);

                // 권장사항 업데이트
                this.updateRecommendations(data.recommendations);

                // 게임 타입별 성능 업데이트
                this.updateGameTypeStats(data.gameTypeComparison);
            }

            updateTrends(trends) {
                if (!trends || trends.message) return;

                // 성공률 트렌드
                const successRateTrend = document.getElementById('successRateTrend');
                successRateTrend.className = 'metric-trend ' + trends.successRate.direction;
                successRateTrend.textContent = this.formatTrend(trends.successRate.trend, '%');

                // 응답시간 트렌드
                const responseTimeTrend = document.getElementById('responseTimeTrend');
                responseTimeTrend.className = 'metric-trend ' + trends.responseTime.direction;
                responseTimeTrend.textContent = this.formatTrend(trends.responseTime.trend, 'ms');

                // 품질 트렌드
                const qualityTrend = document.getElementById('qualityTrend');
                qualityTrend.className = 'metric-trend ' + trends.quality.direction;
                qualityTrend.textContent = this.formatTrend(trends.quality.trend, '');
            }

            updateRecommendations(recommendations) {
                const container = document.getElementById('recommendations');

                if (!recommendations || recommendations.length === 0) {
                    container.innerHTML = '<div style="text-align: center; color: var(--success);">✅ 현재 성능이 양호합니다.</div>';
                    return;
                }

                container.innerHTML = recommendations.map(rec =>
                    '<div class="recommendation-item">' +
                        '<span class="recommendation-priority ' + rec.priority + '">' + rec.priority.toUpperCase() + '</span>' +
                        rec.message +
                    '</div>'
                ).join('');
            }

            updateGameTypeStats(gameTypes) {
                const container = document.getElementById('gameTypeStats');

                container.innerHTML = Object.keys(gameTypes).map(type => {
                    const stats = gameTypes[type];
                    return '<div class="metric-card">' +
                        '<div class="metric-value">' + stats.successRate.toFixed(1) + '%</div>' +
                        '<div class="metric-label">' + type.toUpperCase() + ' (' + stats.total + '개)</div>' +
                    '</div>';
                }).join('');
            }

            async startMonitoring() {
                try {
                    const response = await fetch('/performance/api/start', { method: 'POST' });
                    const result = await response.json();

                    if (result.success) {
                        this.showSuccess('모니터링이 시작되었습니다');
                        await this.refreshData();
                    } else {
                        this.showError('모니터링 시작 실패: ' + result.message);
                    }
                } catch (error) {
                    this.showError('요청 실패: ' + error.message);
                }
            }

            async stopMonitoring() {
                try {
                    const response = await fetch('/performance/api/stop', { method: 'POST' });
                    const result = await response.json();

                    if (result.success) {
                        this.showSuccess('모니터링이 중지되었습니다');
                        await this.refreshData();
                    } else {
                        this.showError('모니터링 중지 실패: ' + result.message);
                    }
                } catch (error) {
                    this.showError('요청 실패: ' + error.message);
                }
            }

            async generateReport() {
                try {
                    const response = await fetch('/performance/api/generate-report', { method: 'POST' });
                    const result = await response.json();

                    if (result.success) {
                        this.showSuccess('성능 리포트가 생성되었습니다');
                        console.log('Performance Report:', result.data);
                    } else {
                        this.showError('리포트 생성 실패: ' + result.error);
                    }
                } catch (error) {
                    this.showError('요청 실패: ' + error.message);
                }
            }

            startAutoRefresh() {
                this.stopAutoRefresh();
                this.refreshInterval = setInterval(() => {
                    if (this.isAutoRefresh) {
                        this.refreshData();
                    }
                }, 10000);
            }

            stopAutoRefresh() {
                if (this.refreshInterval) {
                    clearInterval(this.refreshInterval);
                    this.refreshInterval = null;
                }
            }

            setLoading(loading) {
                document.body.classList.toggle('loading', loading);
            }

            updateLastUpdateTime() {
                document.getElementById('lastUpdateTime').textContent =
                    '마지막 업데이트: ' + new Date().toLocaleTimeString();
            }

            formatUptime(uptimeMs) {
                const seconds = Math.floor(uptimeMs / 1000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);

                if (days > 0) {
                    return days + '일 ' + (hours % 24) + '시간';
                } else if (hours > 0) {
                    return hours + '시간 ' + (minutes % 60) + '분';
                } else if (minutes > 0) {
                    return minutes + '분 ' + (seconds % 60) + '초';
                } else {
                    return seconds + '초';
                }
            }

            formatTrend(value, unit) {
                const prefix = value > 0 ? '+' : '';
                return prefix + value.toFixed(1) + unit;
            }

            showSuccess(message) {
                this.showNotification(message, 'success');
            }

            showError(message) {
                this.showNotification(message, 'error');
                console.error('Dashboard Error:', message);
            }

            showNotification(message, type) {
                const prefix = type === 'error' ? '❌ ' : '✅ ';
                alert(prefix + message);
            }
        }

        // 대시보드 초기화
        const dashboard = new PerformanceDashboard();

        // 전역 접근을 위한 참조
        window.dashboard = dashboard;
    </script>
</body>
</html>
        `;
    }

    getRouter() {
        return this.router;
    }

    getPerformanceMonitor() {
        return this.performanceMonitor;
    }
}

module.exports = PerformanceRoutes;