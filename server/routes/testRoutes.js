/**
 * 실시간 테스트 환경 라우트
 * - 테스트 대시보드
 * - 테스트 서버 관리
 * - 실시간 모니터링
 */

const express = require('express');
const RealTimeTestManager = require('../testing/RealTimeTestManager');

class TestRoutes {
    constructor() {
        this.router = express.Router();
        this.testManager = new RealTimeTestManager();
        this.setupRoutes();
        console.log('🧪 TestRoutes 초기화 완료');
    }

    setupRoutes() {
        // 테스트 대시보드 페이지
        this.router.get('/dashboard', (req, res) => {
            res.send(this.generateTestDashboard());
        });

        // 테스트 서버 상태 API
        this.router.get('/api/status', (req, res) => {
            try {
                const status = this.testManager.getTestStatus();
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

        // 모든 테스트 서버 시작
        this.router.post('/api/start-all', async (req, res) => {
            try {
                const status = await this.testManager.startAllTestServers();
                res.json({
                    success: true,
                    message: '모든 테스트 서버가 시작되었습니다.',
                    data: status
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 모든 테스트 서버 정지
        this.router.post('/api/stop-all', async (req, res) => {
            try {
                await this.testManager.stopAllTestServers();
                res.json({
                    success: true,
                    message: '모든 테스트 서버가 정지되었습니다.'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 특정 서버 로그 조회
        this.router.get('/api/logs/:serverName', (req, res) => {
            try {
                const { serverName } = req.params;
                const limit = parseInt(req.query.limit) || 50;
                const logs = this.testManager.getServerLogs(serverName, limit);

                if (!logs) {
                    return res.status(404).json({
                        success: false,
                        error: '서버를 찾을 수 없습니다.'
                    });
                }

                res.json({
                    success: true,
                    data: logs
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // 테스트 리포트 생성
        this.router.post('/api/generate-report', (req, res) => {
            try {
                const report = this.testManager.generateTestReport();
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

        // 실시간 웹소켓 업데이트 (향후 확장용)
        this.router.get('/api/ws-info', (req, res) => {
            res.json({
                success: true,
                message: 'WebSocket 지원이 곧 추가될 예정입니다.',
                endpoints: {
                    status: '/test/api/status',
                    logs: '/test/api/logs/:serverName',
                    startAll: '/test/api/start-all',
                    stopAll: '/test/api/stop-all'
                }
            });
        });
    }

    /**
     * 테스트 대시보드 HTML 생성
     */
    generateTestDashboard() {
        return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>실시간 테스트 대시보드 - Sensor Game Hub</title>
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
        }

        .panel-content {
            padding: 1rem;
        }

        .status-grid {
            display: grid;
            gap: 1rem;
        }

        .server-card {
            background: var(--surface-light);
            border-radius: var(--radius);
            padding: 1rem;
            border-left: 4px solid var(--border);
        }

        .server-card.running {
            border-left-color: var(--success);
        }

        .server-card.error {
            border-left-color: var(--error);
        }

        .server-card.starting {
            border-left-color: var(--warning);
        }

        .server-name {
            font-weight: 600;
            margin-bottom: 0.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .server-details {
            font-size: 0.875rem;
            color: var(--text-secondary);
            margin-bottom: 0.5rem;
        }

        .server-actions {
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
        }

        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 0.5rem;
        }

        .status-indicator.running {
            background: var(--success);
        }

        .status-indicator.error {
            background: var(--error);
        }

        .status-indicator.starting {
            background: var(--warning);
        }

        .status-indicator.stopped {
            background: var(--text-muted);
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
        }

        .metric-value {
            font-size: 2rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 0.5rem;
        }

        .metric-label {
            font-size: 0.875rem;
            color: var(--text-secondary);
        }

        .logs-container {
            background: #000;
            color: #00ff00;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.75rem;
            padding: 1rem;
            max-height: 400px;
            overflow-y: auto;
            line-height: 1.4;
        }

        .log-entry {
            margin-bottom: 0.25rem;
            word-wrap: break-word;
        }

        .log-timestamp {
            color: #666;
            margin-right: 0.5rem;
        }

        .log-error {
            color: #ff4444;
        }

        .auto-refresh {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-secondary);
            font-size: 0.875rem;
        }

        .loading {
            opacity: 0.6;
            pointer-events: none;
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

        .full-width {
            grid-column: 1 / -1;
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
        <h1>🧪 실시간 테스트 대시보드</h1>
        <p>Sensor Game Hub v6.0 - 실시간 테스트 환경 모니터링</p>
    </div>

    <div class="controls">
        <button class="btn btn-success" id="startAllBtn">🚀 모든 서버 시작</button>
        <button class="btn btn-error" id="stopAllBtn">🛑 모든 서버 정지</button>
        <button class="btn btn-primary" id="refreshBtn">🔄 상태 새로고침</button>
        <button class="btn btn-secondary" id="generateReportBtn">📊 리포트 생성</button>

        <div class="auto-refresh">
            <label>
                <input type="checkbox" id="autoRefreshCheck" checked>
                자동 새로고침 (5초)
            </label>
        </div>

        <div class="auto-refresh" id="lastUpdateTime">
            마지막 업데이트: -
        </div>
    </div>

    <div class="main-content">
        <!-- 전체 상태 메트릭스 -->
        <div class="panel full-width">
            <div class="panel-header">📈 전체 현황</div>
            <div class="panel-content">
                <div class="metrics-grid" id="metricsGrid">
                    <div class="metric-card">
                        <div class="metric-value" id="totalServers">0</div>
                        <div class="metric-label">총 서버</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="runningServers">0</div>
                        <div class="metric-label">실행 중</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="errorCount">0</div>
                        <div class="metric-label">총 에러</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="avgResponseTime">0ms</div>
                        <div class="metric-label">평균 응답시간</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 서버 상태 -->
        <div class="panel">
            <div class="panel-header">🖥️ 서버 상태</div>
            <div class="panel-content">
                <div class="status-grid" id="serverStatus">
                    <div class="server-card">
                        <div class="server-name">
                            <span>데이터 로딩 중...</span>
                            <span class="refresh-indicator"></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 실시간 로그 -->
        <div class="panel">
            <div class="panel-header">
                📋 실시간 로그
                <select id="logServerSelect" style="margin-left: 1rem; padding: 0.25rem; background: var(--surface); color: var(--text-primary); border: 1px solid var(--border); border-radius: 4px;">
                    <option value="">서버 선택</option>
                </select>
            </div>
            <div class="panel-content" style="padding: 0;">
                <div class="logs-container" id="logsContainer">
                    <div class="log-entry">서버를 선택하여 로그를 확인하세요...</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        class TestDashboard {
            constructor() {
                this.isAutoRefresh = true;
                this.refreshInterval = null;
                this.selectedServer = null;
                this.init();
            }

            init() {
                this.setupEventListeners();
                this.startAutoRefresh();
                this.loadInitialData();
            }

            setupEventListeners() {
                // 버튼 이벤트
                document.getElementById('startAllBtn').addEventListener('click', () => this.startAllServers());
                document.getElementById('stopAllBtn').addEventListener('click', () => this.stopAllServers());
                document.getElementById('refreshBtn').addEventListener('click', () => this.refreshStatus());
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

                // 로그 서버 선택
                document.getElementById('logServerSelect').addEventListener('change', (e) => {
                    this.selectedServer = e.target.value;
                    if (this.selectedServer) {
                        this.loadServerLogs(this.selectedServer);
                    } else {
                        this.clearLogs();
                    }
                });
            }

            async loadInitialData() {
                await this.refreshStatus();
            }

            async refreshStatus() {
                try {
                    this.setLoading(true);

                    const response = await fetch('/test/api/status');
                    const result = await response.json();

                    if (result.success) {
                        this.updateUI(result.data);
                        this.updateLastUpdateTime();
                    } else {
                        this.showError('상태 로드 실패: ' + result.error);
                    }
                } catch (error) {
                    this.showError('네트워크 오류: ' + error.message);
                } finally {
                    this.setLoading(false);
                }
            }

            updateUI(data) {
                // 메트릭스 업데이트
                document.getElementById('totalServers').textContent = data.serversCount;

                let runningCount = 0;
                let totalErrors = 0;

                // 서버 상태 업데이트
                const serverStatusContainer = document.getElementById('serverStatus');
                const logServerSelect = document.getElementById('logServerSelect');

                // 서버 선택 옵션 초기화
                logServerSelect.innerHTML = '<option value="">서버 선택</option>';

                if (data.servers && Object.keys(data.servers).length > 0) {
                    serverStatusContainer.innerHTML = '';

                    Object.entries(data.servers).forEach(([name, server]) => {
                        if (server.status === 'running') runningCount++;

                        // 서버 카드 생성
                        const serverCard = document.createElement('div');
                        serverCard.className = 'server-card ' + server.status;
                        serverCard.innerHTML =
                            '<div class="server-name">' +
                                '<span>' +
                                    '<span class="status-indicator ' + server.status + '"></span>' +
                                    name +
                                '</span>' +
                                '<span style="font-size: 0.75rem; color: var(--text-muted);">:' + server.port + '</span>' +
                            '</div>' +
                            '<div class="server-details">' + server.description + '</div>' +
                            '<div class="server-details">상태: ' + server.status + ' | 업타임: ' + this.formatUptime(server.uptime) + '</div>' +
                            '<div class="server-actions">' +
                                '<button class="btn btn-secondary" onclick="dashboard.viewServerLogs(\\\'' + name + '\\\')">로그 보기</button>' +
                            '</div>';

                        serverStatusContainer.appendChild(serverCard);

                        // 로그 서버 선택 옵션 추가
                        const option = document.createElement('option');
                        option.value = name;
                        option.textContent = name + ' (:' + server.port + ')';
                        logServerSelect.appendChild(option);
                    });
                } else {
                    serverStatusContainer.innerHTML = '<div class="server-card"><div class="server-name">실행 중인 서버가 없습니다</div></div>';
                }

                document.getElementById('runningServers').textContent = runningCount;
                document.getElementById('errorCount').textContent = totalErrors;
                document.getElementById('avgResponseTime').textContent = '0ms'; // 향후 구현
            }

            async startAllServers() {
                try {
                    this.setLoading(true);
                    const response = await fetch('/test/api/start-all', { method: 'POST' });
                    const result = await response.json();

                    if (result.success) {
                        this.showSuccess('모든 서버가 시작되었습니다');
                        await this.refreshStatus();
                    } else {
                        this.showError('서버 시작 실패: ' + result.error);
                    }
                } catch (error) {
                    this.showError('요청 실패: ' + error.message);
                } finally {
                    this.setLoading(false);
                }
            }

            async stopAllServers() {
                if (!confirm('모든 테스트 서버를 정지하시겠습니까?')) return;

                try {
                    this.setLoading(true);
                    const response = await fetch('/test/api/stop-all', { method: 'POST' });
                    const result = await response.json();

                    if (result.success) {
                        this.showSuccess('모든 서버가 정지되었습니다');
                        await this.refreshStatus();
                    } else {
                        this.showError('서버 정지 실패: ' + result.error);
                    }
                } catch (error) {
                    this.showError('요청 실패: ' + error.message);
                } finally {
                    this.setLoading(false);
                }
            }

            async generateReport() {
                try {
                    this.setLoading(true);
                    const response = await fetch('/test/api/generate-report', { method: 'POST' });
                    const result = await response.json();

                    if (result.success) {
                        this.showSuccess('테스트 리포트가 생성되었습니다');
                        console.log('Test Report:', result.data);

                        // 리포트를 새 창에서 표시 (향후 구현)
                        alert('리포트가 생성되었습니다. 콘솔을 확인하세요.');
                    } else {
                        this.showError('리포트 생성 실패: ' + result.error);
                    }
                } catch (error) {
                    this.showError('요청 실패: ' + error.message);
                } finally {
                    this.setLoading(false);
                }
            }

            async viewServerLogs(serverName) {
                document.getElementById('logServerSelect').value = serverName;
                this.selectedServer = serverName;
                await this.loadServerLogs(serverName);
            }

            async loadServerLogs(serverName) {
                try {
                    const response = await fetch('/test/api/logs/' + serverName + '?limit=100');
                    const result = await response.json();

                    if (result.success) {
                        this.displayLogs(result.data);
                    } else {
                        this.showError('로그 로드 실패: ' + result.error);
                    }
                } catch (error) {
                    this.showError('로그 요청 실패: ' + error.message);
                }
            }

            displayLogs(logs) {
                const container = document.getElementById('logsContainer');

                if (!logs || logs.length === 0) {
                    container.innerHTML = '<div class="log-entry">로그가 없습니다.</div>';
                    return;
                }

                container.innerHTML = logs.map(log => {
                    const timestamp = new Date(log.timestamp).toLocaleTimeString();
                    const messageClass = log.type === 'stderr' ? 'log-error' : '';

                    return '<div class="log-entry ' + messageClass + '">' +
                        '<span class="log-timestamp">[' + timestamp + ']</span>' +
                        log.message.trim() +
                    '</div>';
                }).join('');

                // 최신 로그로 스크롤
                container.scrollTop = container.scrollHeight;
            }

            clearLogs() {
                document.getElementById('logsContainer').innerHTML =
                    '<div class="log-entry">서버를 선택하여 로그를 확인하세요...</div>';
            }

            startAutoRefresh() {
                this.stopAutoRefresh();
                this.refreshInterval = setInterval(() => {
                    if (this.isAutoRefresh) {
                        this.refreshStatus();
                        if (this.selectedServer) {
                            this.loadServerLogs(this.selectedServer);
                        }
                    }
                }, 5000);
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

                if (hours > 0) {
                    return hours + '시간 ' + (minutes % 60) + '분';
                } else if (minutes > 0) {
                    return minutes + '분 ' + (seconds % 60) + '초';
                } else {
                    return seconds + '초';
                }
            }

            showSuccess(message) {
                this.showNotification(message, 'success');
            }

            showError(message) {
                this.showNotification(message, 'error');
                console.error('Dashboard Error:', message);
            }

            showNotification(message, type) {
                // 간단한 알림 (향후 토스트 알림으로 개선 가능)
                const prefix = type === 'error' ? '❌ ' : '✅ ';
                alert(prefix + message);
            }
        }

        // 대시보드 초기화
        const dashboard = new TestDashboard();

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
}

module.exports = TestRoutes;