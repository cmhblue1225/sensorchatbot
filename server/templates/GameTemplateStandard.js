/**
 * 🎮 게임 템플릿 표준화 시스템 v6.0
 *
 * 목적: AI가 안정적으로 생성할 수 있는 표준화된 게임 템플릿 시스템
 * 특징:
 * - 모듈형 구조로 템플릿 요소 분리
 * - 검증 가능한 코드 구조
 * - SessionSDK 완전 통합
 * - 에러 처리 최적화
 */

class GameTemplateStandard {
    constructor() {
        this.version = "6.0.0";
        this.templates = new Map();
        this.validators = new Map();
        this.components = this.initializeComponents();
    }

    /**
     * 재사용 가능한 컴포넌트 초기화
     */
    initializeComponents() {
        return {
            // 기본 HTML 구조
            baseStructure: {
                doctype: '<!DOCTYPE html>',
                htmlOpen: '<html lang="ko">',
                headOpen: '<head>',
                metaCharset: '<meta charset="UTF-8">',
                metaViewport: '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
                headClose: '</head>',
                bodyOpen: '<body>',
                bodyClose: '</body>',
                htmlClose: '</html>'
            },

            // 표준 CSS 스타일 시스템
            styles: {
                reset: this.generateResetCSS(),
                gameContainer: this.generateGameContainerCSS(),
                header: this.generateHeaderCSS(),
                canvas: this.generateCanvasCSS(),
                controls: this.generateControlsCSS(),
                animations: this.generateAnimationsCSS()
            },

            // JavaScript 모듈 시스템
            scripts: {
                sessionSDK: this.generateSessionSDKScript(),
                gameEngine: this.generateGameEngineScript(),
                sensorHandler: this.generateSensorHandlerScript(),
                errorHandler: this.generateErrorHandlerScript()
            },

            // UI 컴포넌트
            ui: {
                header: this.generateHeaderHTML(),
                sessionDisplay: this.generateSessionDisplayHTML(),
                gameCanvas: this.generateGameCanvasHTML(),
                controlPanel: this.generateControlPanelHTML(),
                debugPanel: this.generateDebugPanelHTML()
            }
        };
    }

    /**
     * 표준 템플릿 생성 - Solo Game
     */
    generateSoloGameTemplate() {
        const template = {
            gameType: 'solo',
            title: 'Solo Advanced Game - Sensor Game Hub v6.0',
            description: '1개 센서로 플레이하는 고급 게임',
            requiredSensors: 1,
            features: ['physics', 'particles', 'sound', 'responsive'],
            code: this.assembleSoloGameCode()
        };

        this.templates.set('solo', template);
        return template;
    }

    /**
     * 표준 템플릿 생성 - Dual Game
     */
    generateDualGameTemplate() {
        const template = {
            gameType: 'dual',
            title: 'Dual Cooperative Game - Sensor Game Hub v6.0',
            description: '2개 센서로 협력하는 미션 게임',
            requiredSensors: 2,
            features: ['cooperation', 'sync', 'physics', 'missions'],
            code: this.assembleDualGameCode()
        };

        this.templates.set('dual', template);
        return template;
    }

    /**
     * 표준 템플릿 생성 - Multi Game
     */
    generateMultiGameTemplate() {
        const template = {
            gameType: 'multi',
            title: 'Multi Player Arena - Sensor Game Hub v6.0',
            description: '최대 10명이 동시에 플레이하는 경쟁 게임',
            requiredSensors: 10,
            features: ['multiplayer', 'arena', 'ranking', 'realtime'],
            code: this.assembleMultiGameCode()
        };

        this.templates.set('multi', template);
        return template;
    }

    /**
     * Solo Game 코드 조립
     */
    assembleSoloGameCode() {
        const { baseStructure, styles, scripts, ui } = this.components;

        return `${baseStructure.doctype}
${baseStructure.htmlOpen}
${baseStructure.headOpen}
    ${baseStructure.metaCharset}
    ${baseStructure.metaViewport}
    <title>Solo Advanced Game - Sensor Game Hub v6.0</title>
    <style>
        ${styles.reset}
        ${styles.gameContainer}
        ${styles.header}
        ${styles.canvas}
        ${styles.controls}
        ${styles.animations}

        /* Solo Game 특화 스타일 */
        .solo-game-specific {
            --solo-primary: #667eea;
            --solo-secondary: #764ba2;
        }

        .game-container {
            background: linear-gradient(135deg, var(--solo-primary) 0%, var(--solo-secondary) 100%);
        }

        .ball {
            position: absolute;
            width: 30px;
            height: 30px;
            background: radial-gradient(circle, #fff 30%, #f39c12 100%);
            border-radius: 50%;
            box-shadow: 0 0 20px rgba(243, 156, 18, 0.6);
            transition: all 0.1s ease-out;
        }

        .obstacle {
            position: absolute;
            background: linear-gradient(45deg, #e74c3c, #c0392b);
            border-radius: 5px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }

        .target {
            position: absolute;
            background: radial-gradient(circle, #2ecc71, #27ae60);
            border-radius: 50%;
            animation: targetPulse 2s infinite;
        }

        @keyframes targetPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }
    </style>
${baseStructure.headClose}
${baseStructure.bodyOpen}
    <div class="game-container solo-game-specific">
        ${ui.header}
        ${ui.gameCanvas}
        ${ui.controlPanel}
        ${ui.debugPanel}
    </div>

    <script>
        ${scripts.sessionSDK}
        ${scripts.gameEngine}
        ${scripts.sensorHandler}
        ${scripts.errorHandler}

        // Solo Game 특화 로직
        class SoloGame {
            constructor() {
                this.canvas = document.getElementById('gameCanvas');
                this.ctx = this.canvas.getContext('2d');
                this.ball = { x: 100, y: 100, vx: 0, vy: 0 };
                this.obstacles = [];
                this.targets = [];
                this.score = 0;
                this.level = 1;
                this.gameRunning = false;

                this.setupCanvas();
                this.generateLevel();
                this.startGameLoop();
            }

            setupCanvas() {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight - 100;

                window.addEventListener('resize', () => {
                    this.canvas.width = window.innerWidth;
                    this.canvas.height = window.innerHeight - 100;
                });
            }

            generateLevel() {
                this.obstacles = [];
                this.targets = [];

                // 장애물 생성
                for (let i = 0; i < this.level + 2; i++) {
                    this.obstacles.push({
                        x: Math.random() * (this.canvas.width - 100) + 50,
                        y: Math.random() * (this.canvas.height - 100) + 50,
                        width: 60 + Math.random() * 40,
                        height: 20 + Math.random() * 20
                    });
                }

                // 타겟 생성
                for (let i = 0; i < 3; i++) {
                    this.targets.push({
                        x: Math.random() * (this.canvas.width - 60) + 30,
                        y: Math.random() * (this.canvas.height - 60) + 30,
                        radius: 25,
                        collected: false
                    });
                }
            }

            processSensorData(data) {
                if (!this.gameRunning) return;

                const sensitivity = 5;
                const gamma = data.data.orientation.gamma || 0;
                const beta = data.data.orientation.beta || 0;

                // 센서 데이터를 가속도로 변환
                this.ball.vx += gamma * sensitivity * 0.1;
                this.ball.vy += beta * sensitivity * 0.1;

                // 속도 제한
                const maxSpeed = 15;
                this.ball.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.ball.vx));
                this.ball.vy = Math.max(-maxSpeed, Math.min(maxSpeed, this.ball.vy));

                // 마찰력 적용
                this.ball.vx *= 0.95;
                this.ball.vy *= 0.95;
            }

            update() {
                if (!this.gameRunning) return;

                // 공 위치 업데이트
                this.ball.x += this.ball.vx;
                this.ball.y += this.ball.vy;

                // 벽 충돌
                if (this.ball.x <= 15 || this.ball.x >= this.canvas.width - 15) {
                    this.ball.vx *= -0.8;
                    this.ball.x = Math.max(15, Math.min(this.canvas.width - 15, this.ball.x));
                }
                if (this.ball.y <= 15 || this.ball.y >= this.canvas.height - 15) {
                    this.ball.vy *= -0.8;
                    this.ball.y = Math.max(15, Math.min(this.canvas.height - 15, this.ball.y));
                }

                // 장애물 충돌
                this.obstacles.forEach(obstacle => {
                    if (this.ball.x + 15 > obstacle.x &&
                        this.ball.x - 15 < obstacle.x + obstacle.width &&
                        this.ball.y + 15 > obstacle.y &&
                        this.ball.y - 15 < obstacle.y + obstacle.height) {
                        this.ball.vx *= -0.7;
                        this.ball.vy *= -0.7;
                    }
                });

                // 타겟 수집
                this.targets.forEach(target => {
                    if (!target.collected) {
                        const dx = this.ball.x - target.x;
                        const dy = this.ball.y - target.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < target.radius + 15) {
                            target.collected = true;
                            this.score += 100;
                            this.updateScore();

                            // 모든 타겟 수집시 다음 레벨
                            if (this.targets.every(t => t.collected)) {
                                this.level++;
                                this.generateLevel();
                            }
                        }
                    }
                });
            }

            render() {
                // 배경 클리어
                this.ctx.fillStyle = 'rgba(30, 60, 114, 0.1)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

                // 장애물 렌더링
                this.obstacles.forEach(obstacle => {
                    const gradient = this.ctx.createLinearGradient(
                        obstacle.x, obstacle.y,
                        obstacle.x + obstacle.width, obstacle.y + obstacle.height
                    );
                    gradient.addColorStop(0, '#e74c3c');
                    gradient.addColorStop(1, '#c0392b');

                    this.ctx.fillStyle = gradient;
                    this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

                    this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
                    this.ctx.shadowBlur = 4;
                    this.ctx.shadowOffsetY = 4;
                });

                // 타겟 렌더링
                this.targets.forEach(target => {
                    if (!target.collected) {
                        const gradient = this.ctx.createRadialGradient(
                            target.x, target.y, 0,
                            target.x, target.y, target.radius
                        );
                        gradient.addColorStop(0, '#2ecc71');
                        gradient.addColorStop(1, '#27ae60');

                        this.ctx.fillStyle = gradient;
                        this.ctx.beginPath();
                        this.ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                });

                // 공 렌더링
                const ballGradient = this.ctx.createRadialGradient(
                    this.ball.x - 5, this.ball.y - 5, 0,
                    this.ball.x, this.ball.y, 15
                );
                ballGradient.addColorStop(0, '#fff');
                ballGradient.addColorStop(1, '#f39c12');

                this.ctx.fillStyle = ballGradient;
                this.ctx.beginPath();
                this.ctx.arc(this.ball.x, this.ball.y, 15, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.shadowColor = 'rgba(243, 156, 18, 0.6)';
                this.ctx.shadowBlur = 20;
            }

            updateScore() {
                document.getElementById('scoreValue').textContent = this.score;
                document.getElementById('levelValue').textContent = this.level;
            }

            startGameLoop() {
                const gameLoop = () => {
                    this.update();
                    this.render();
                    requestAnimationFrame(gameLoop);
                };
                gameLoop();
            }

            startGame() {
                this.gameRunning = true;
                document.getElementById('startBtn').textContent = '게임 진행중...';
                document.getElementById('startBtn').disabled = true;
            }

            resetGame() {
                this.gameRunning = false;
                this.score = 0;
                this.level = 1;
                this.ball = { x: 100, y: 100, vx: 0, vy: 0 };
                this.generateLevel();
                this.updateScore();
                document.getElementById('startBtn').textContent = '게임 시작';
                document.getElementById('startBtn').disabled = false;
            }
        }

        // 게임 인스턴스 생성 및 SDK 연동
        let game;

        sdk.on('connected', () => {
            createSession();
        });

        sdk.on('session-created', (event) => {
            const session = event.detail || event;
            displaySessionInfo(session);

            // 게임 인스턴스 생성
            game = new SoloGame();

            // 시작 버튼 이벤트
            document.getElementById('startBtn').addEventListener('click', () => {
                game.startGame();
            });

            document.getElementById('resetBtn').addEventListener('click', () => {
                game.resetGame();
            });
        });

        sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;
            document.getElementById('sensorStatus').textContent = '센서 연결됨';
            document.getElementById('sensorStatus').className = 'status connected';
        });

        sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            if (game) {
                game.processSensorData(data);
            }
            updateDebugInfo(data);
        });

        // 유틸리티 함수들
        function createSession() {
            sdk.createSession('solo-advanced-game', 'solo');
        }

        function displaySessionInfo(session) {
            document.getElementById('sessionCode').textContent = session.code;
            document.getElementById('qrContainer').innerHTML =
                '<img src="' + session.qrCode + '" alt="QR Code" style="width: 120px; height: 120px;">';
        }

        function updateDebugInfo(data) {
            const debug = document.getElementById('debugInfo');
            debug.innerHTML =
                '<strong>센서 데이터:</strong><br>' +
                'Alpha: ' + (data.data.orientation.alpha || 0).toFixed(1) + '°<br>' +
                'Beta: ' + (data.data.orientation.beta || 0).toFixed(1) + '°<br>' +
                'Gamma: ' + (data.data.orientation.gamma || 0).toFixed(1) + '°<br>' +
                'Timestamp: ' + new Date(data.timestamp).toLocaleTimeString();
        }
    </script>
${baseStructure.bodyClose}
${baseStructure.htmlClose}`;
    }

    /**
     * CSS 생성 메소드들
     */
    generateResetCSS() {
        return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            overflow: hidden;
            user-select: none;
        }`;
    }

    generateGameContainerCSS() {
        return `
        .game-container {
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            position: relative;
        }`;
    }

    generateHeaderCSS() {
        return `
        .header {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
        }

        .game-title {
            font-size: 1.8rem;
            font-weight: bold;
            color: white;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .session-info {
            background: rgba(255,255,255,0.2);
            padding: 10px 15px;
            border-radius: 20px;
            color: white;
            display: flex;
            align-items: center;
            gap: 10px;
        }`;
    }

    generateCanvasCSS() {
        return `
        #gameCanvas {
            flex: 1;
            display: block;
            background: radial-gradient(circle, #1e3c72 0%, #2a5298 100%);
            cursor: none;
        }`;
    }

    generateControlsCSS() {
        return `
        .control-panel {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            border-radius: 15px;
            padding: 20px;
            color: white;
            min-width: 250px;
            backdrop-filter: blur(10px);
        }

        .control-group {
            margin-bottom: 15px;
        }

        .control-group h3 {
            margin-bottom: 8px;
            color: #4fc3f7;
        }

        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 14px;
            margin: 5px;
            transition: all 0.3s ease;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }`;
    }

    generateAnimationsCSS() {
        return `
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #ff4757;
            animation: pulse 2s infinite;
        }

        .status-indicator.connected {
            background: #2ed573;
        }`;
    }

    /**
     * JavaScript 모듈 생성 메소드들
     */
    generateSessionSDKScript() {
        return `
        // SessionSDK 초기화
        const sdk = new SessionSDK({
            gameId: 'standardized-game',
            gameType: 'solo'
        });`;
    }

    generateGameEngineScript() {
        return `
        // 공통 게임 엔진 유틸리티
        class GameEngine {
            static clamp(value, min, max) {
                return Math.min(Math.max(value, min), max);
            }

            static lerp(a, b, t) {
                return a + (b - a) * t;
            }

            static distance(x1, y1, x2, y2) {
                const dx = x2 - x1;
                const dy = y2 - y1;
                return Math.sqrt(dx * dx + dy * dy);
            }

            static collision(rect1, rect2) {
                return rect1.x < rect2.x + rect2.width &&
                       rect1.x + rect1.width > rect2.x &&
                       rect1.y < rect2.y + rect2.height &&
                       rect1.y + rect1.height > rect2.y;
            }
        }`;
    }

    generateSensorHandlerScript() {
        return `
        // 센서 데이터 처리 유틸리티
        class SensorHandler {
            constructor() {
                this.calibration = { alpha: 0, beta: 0, gamma: 0 };
                this.smoothing = 0.8;
                this.lastData = null;
            }

            calibrate(data) {
                this.calibration = {
                    alpha: data.data.orientation.alpha || 0,
                    beta: data.data.orientation.beta || 0,
                    gamma: data.data.orientation.gamma || 0
                };
            }

            process(data) {
                const raw = {
                    alpha: (data.data.orientation.alpha || 0) - this.calibration.alpha,
                    beta: (data.data.orientation.beta || 0) - this.calibration.beta,
                    gamma: (data.data.orientation.gamma || 0) - this.calibration.gamma
                };

                // 스무딩 적용
                if (this.lastData) {
                    raw.alpha = this.lastData.alpha * this.smoothing + raw.alpha * (1 - this.smoothing);
                    raw.beta = this.lastData.beta * this.smoothing + raw.beta * (1 - this.smoothing);
                    raw.gamma = this.lastData.gamma * this.smoothing + raw.gamma * (1 - this.smoothing);
                }

                this.lastData = raw;
                return raw;
            }
        }`;
    }

    generateErrorHandlerScript() {
        return `
        // 에러 처리 시스템
        class ErrorHandler {
            static log(error, context = '') {
                console.error('[Game Error]', context, error);

                // 사용자에게 표시할 에러 메시지
                const errorDiv = document.getElementById('errorDisplay');
                if (errorDiv) {
                    errorDiv.textContent = '일시적인 오류가 발생했습니다. 새로고침 후 다시 시도해주세요.';
                    errorDiv.style.display = 'block';

                    setTimeout(() => {
                        errorDiv.style.display = 'none';
                    }, 5000);
                }
            }

            static wrap(fn, context = '') {
                return function(...args) {
                    try {
                        return fn.apply(this, args);
                    } catch (error) {
                        ErrorHandler.log(error, context);
                    }
                };
            }
        }

        // 전역 에러 처리
        window.addEventListener('error', (event) => {
            ErrorHandler.log(event.error, 'Global Error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            ErrorHandler.log(event.reason, 'Unhandled Promise Rejection');
        });`;
    }

    /**
     * HTML 컴포넌트 생성 메소드들
     */
    generateHeaderHTML() {
        return `
        <div class="header">
            <div class="game-title">🎮 Sensor Game Hub v6.0</div>
            <div class="session-info">
                <div class="status-indicator" id="connectionStatus"></div>
                <span>세션: <span id="sessionCode">----</span></span>
            </div>
        </div>`;
    }

    generateSessionDisplayHTML() {
        return `
        <div id="sessionDisplay" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); padding: 30px; border-radius: 15px; color: white; text-align: center; z-index: 1000;">
            <h2>🎮 게임 세션 생성됨</h2>
            <p>세션 코드: <strong id="sessionCodeDisplay">----</strong></p>
            <div id="qrContainer" style="margin: 20px 0;"></div>
            <p>모바일에서 센서 페이지에 접속하여 위 코드를 입력하세요</p>
        </div>`;
    }

    generateGameCanvasHTML() {
        return `<canvas id="gameCanvas"></canvas>`;
    }

    generateControlPanelHTML() {
        return `
        <div class="control-panel">
            <div class="control-group">
                <h3>🎮 게임 컨트롤</h3>
                <button id="startBtn" class="btn">게임 시작</button>
                <button id="resetBtn" class="btn">리셋</button>
            </div>

            <div class="control-group">
                <h3>📊 게임 정보</h3>
                <div>점수: <span id="scoreValue">0</span></div>
                <div>레벨: <span id="levelValue">1</span></div>
            </div>

            <div class="control-group">
                <h3>📱 센서 상태</h3>
                <div id="sensorStatus" class="status">대기중...</div>
            </div>
        </div>`;
    }

    generateDebugPanelHTML() {
        return `
        <div id="debugPanel" style="position: absolute; bottom: 20px; left: 20px; background: rgba(0,0,0,0.8); padding: 15px; border-radius: 10px; color: white; font-family: monospace; font-size: 12px; max-width: 300px;">
            <div id="debugInfo">센서 데이터 대기중...</div>
        </div>

        <div id="errorDisplay" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #e74c3c; color: white; padding: 20px; border-radius: 10px; display: none; z-index: 2000;"></div>`;
    }

    /**
     * Dual Game 코드 조립
     */
    assembleDualGameCode() {
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dual Cooperative Game - Sensor Game Hub v6.0</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: "Segoe UI", sans-serif; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); overflow: hidden; }
        .game-container { width: 100vw; height: 100vh; display: flex; flex-direction: column; }
        .header { background: rgba(255,255,255,0.1); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
        .game-title { font-size: 1.8rem; font-weight: bold; color: white; }
        .players-status { display: flex; gap: 20px; }
        .player-status { background: rgba(255,255,255,0.2); padding: 10px 15px; border-radius: 20px; color: white; display: flex; align-items: center; gap: 10px; }
        .status-indicator { width: 12px; height: 12px; border-radius: 50%; background: #ff4757; }
        .status-indicator.connected { background: #2ed573; }
        #gameCanvas { flex: 1; background: radial-gradient(circle, #c44569 0%, #f8b500 100%); }
        .session-info { position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.8); border-radius: 15px; padding: 20px; color: white; text-align: center; }
        .session-code { font-size: 2rem; font-weight: bold; color: #ff6b6b; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="game-container">
        <div class="header">
            <div class="game-title">👥 Advanced Dual Game v6.0</div>
            <div class="players-status">
                <div class="player-status">
                    <div class="status-indicator" id="player1Status"></div>
                    <span>Player 1</span>
                </div>
                <div class="player-status">
                    <div class="status-indicator" id="player2Status"></div>
                    <span>Player 2</span>
                </div>
            </div>
        </div>
        <canvas id="gameCanvas"></canvas>
        <div class="session-info">
            <div>세션 코드</div>
            <div class="session-code" id="sessionCode">----</div>
        </div>
    </div>
    <script src="/js/SessionSDK.js"></script>
    <script>
        const GAME_CONFIG = { gameId: 'advanced-dual-game', gameType: 'dual', maxPlayers: 2 };
        const sdk = new SessionSDK(GAME_CONFIG);

        sdk.on('connected', () => sdk.createSession());
        sdk.on('session-created', (event) => {
            const session = event.detail || event;
            document.getElementById('sessionCode').textContent = session.sessionCode;
        });

        let connectedSensors = 0;
        sdk.on('sensor-connected', () => {
            connectedSensors++;
            document.getElementById('player' + connectedSensors + 'Status').classList.add('connected');
        });
    </script>
</body>
</html>`;
    }

    /**
     * Multi Game 코드 조립
     */
    assembleMultiGameCode() {
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi Player Arena - Sensor Game Hub v6.0</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: "Segoe UI", sans-serif; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); overflow: hidden; }
        .game-container { width: 100vw; height: 100vh; display: flex; flex-direction: column; }
        .header { background: rgba(255,255,255,0.1); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
        .game-title { font-size: 1.8rem; font-weight: bold; color: #333; }
        .players-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
        .player-slot { background: rgba(255,255,255,0.3); padding: 8px 12px; border-radius: 15px; text-align: center; font-size: 0.9rem; }
        .player-slot.connected { background: rgba(46,213,115,0.3); }
        #gameCanvas { flex: 1; background: radial-gradient(circle, #a8edea 0%, #fed6e3 100%); }
        .leaderboard { position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.8); border-radius: 15px; padding: 20px; color: white; min-width: 200px; }
    </style>
</head>
<body>
    <div class="game-container">
        <div class="header">
            <div class="game-title">🏆 Advanced Multi Game v6.0</div>
            <div class="players-grid" id="playersGrid"></div>
        </div>
        <canvas id="gameCanvas"></canvas>
        <div class="leaderboard">
            <h3>🏆 순위</h3>
            <div id="leaderboardList"></div>
        </div>
    </div>
    <script src="/js/SessionSDK.js"></script>
    <script>
        const GAME_CONFIG = { gameId: 'advanced-multi-game', gameType: 'multi', maxPlayers: 10 };
        const sdk = new SessionSDK(GAME_CONFIG);

        sdk.on('connected', () => sdk.createSession());

        // 플레이어 슬롯 초기화
        const grid = document.getElementById('playersGrid');
        for (let i = 1; i <= 10; i++) {
            const slot = document.createElement('div');
            slot.className = 'player-slot';
            slot.textContent = 'P' + i;
            slot.id = 'player' + i;
            grid.appendChild(slot);
        }
    </script>
</body>
</html>`;
    }

    /**
     * 템플릿 검증 시스템
     */
    validateTemplate(template) {
        const validator = {
            hasRequiredStructure: true,
            hasSessionSDK: true,
            hasSensorHandling: true,
            hasErrorHandling: true,
            hasGameLogic: true,
            validCSS: true,
            validJavaScript: true,
            errors: []
        };

        // 구조 검증
        if (!template.code.includes('SessionSDK')) {
            validator.hasSessionSDK = false;
            validator.errors.push('SessionSDK 누락');
        }

        if (!template.code.includes('sensor-data')) {
            validator.hasSensorHandling = false;
            validator.errors.push('센서 데이터 처리 로직 누락');
        }

        if (!template.code.includes('ErrorHandler')) {
            validator.hasErrorHandling = false;
            validator.errors.push('에러 처리 시스템 누락');
        }

        // CSS 문법 검증 (기본적인 검증)
        const cssMatches = template.code.match(/<style>([\s\S]*?)<\/style>/g);
        if (cssMatches) {
            cssMatches.forEach(css => {
                if (!this.validateCSSSyntax(css)) {
                    validator.validCSS = false;
                    validator.errors.push('CSS 문법 오류');
                }
            });
        }

        // JavaScript 문법 검증 (기본적인 검증)
        const jsMatches = template.code.match(/<script>([\s\S]*?)<\/script>/g);
        if (jsMatches) {
            jsMatches.forEach(js => {
                if (!this.validateJSSyntax(js)) {
                    validator.validJavaScript = false;
                    validator.errors.push('JavaScript 문법 오류');
                }
            });
        }

        validator.isValid = validator.errors.length === 0;
        return validator;
    }

    validateCSSSyntax(css) {
        // 기본적인 CSS 문법 검증 (중괄호 균형 등)
        const openBraces = (css.match(/\{/g) || []).length;
        const closeBraces = (css.match(/\}/g) || []).length;
        return openBraces === closeBraces;
    }

    validateJSSyntax(js) {
        // 기본적인 JavaScript 문법 검증
        try {
            // 간단한 문법 체크를 위해 Function 생성자 사용
            new Function(js.replace(/<\/?script[^>]*>/g, ''));
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * 전체 템플릿 시스템 초기화
     */
    initializeAllTemplates() {
        this.generateSoloGameTemplate();
        this.generateDualGameTemplate();
        this.generateMultiGameTemplate();

        console.log('🎮 게임 템플릿 표준화 시스템 v6.0 초기화 완료');
        console.log(`📊 생성된 템플릿: ${this.templates.size}개`);
    }

    /**
     * 템플릿 가져오기
     */
    getTemplate(gameType) {
        return this.templates.get(gameType);
    }

    /**
     * 모든 템플릿 가져오기
     */
    getAllTemplates() {
        return Object.fromEntries(this.templates);
    }
}

module.exports = GameTemplateStandard;