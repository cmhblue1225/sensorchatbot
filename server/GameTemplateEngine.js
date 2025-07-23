/**
 * 🏗️ GameTemplateEngine v1.0
 * 
 * 게임 사양을 바탕으로 완전한 HTML 게임 코드를 생성하는 템플릿 엔진
 * - 게임 장르별 템플릿 관리
 * - 동적 코드 생성 및 조립
 * - SessionSDK 통합 코드 자동 생성
 */

class GameTemplateEngine {
    constructor() {
        // 게임 템플릿 저장소
        this.templates = new Map();
        this.initializeTemplates();
    }

    /**
     * 게임 템플릿 초기화
     */
    initializeTemplates() {
        // 기본 HTML 구조 템플릿
        this.templates.set('base', {
            html: this.getBaseHTMLTemplate(),
            css: this.getBaseCSSTemplate(),
            js: this.getBaseJSTemplate()
        });

        // 장르별 게임 로직 템플릿
        this.templates.set('platformer', this.getPlatformerTemplate());
        this.templates.set('puzzle', this.getPuzzleTemplate());
        this.templates.set('racing', this.getRacingTemplate());
        this.templates.set('arcade', this.getArcadeTemplate());
        this.templates.set('action', this.getActionTemplate());
    }

    /**
     * 게임 사양을 바탕으로 완전한 HTML 게임 생성
     */
    async generateGame(gameSpec) {
        try {
            console.log(`🏗️ 게임 생성 시작: ${gameSpec.suggestedTitle}`);

            // 1. 기본 템플릿 선택
            const baseTemplate = this.templates.get('base');
            const genreTemplate = this.templates.get(gameSpec.genre) || this.templates.get('arcade');

            // 2. 게임별 설정 생성
            const gameConfig = this.generateGameConfig(gameSpec);

            // 3. 게임 로직 생성
            const gameLogic = this.generateGameLogic(gameSpec, genreTemplate);

            // 4. 센서 처리 로직 생성
            const sensorLogic = this.generateSensorLogic(gameSpec);

            // 5. UI 컴포넌트 생성
            const uiComponents = this.generateUIComponents(gameSpec);

            // 6. 전체 HTML 조립
            const completeHTML = this.assembleHTML({
                gameSpec,
                gameConfig,
                gameLogic,
                sensorLogic,
                uiComponents,
                baseTemplate
            });

            console.log('✅ 게임 생성 완료');
            return {
                success: true,
                gameId: gameSpec.suggestedGameId,
                title: gameSpec.suggestedTitle,
                html: completeHTML,
                metadata: this.generateGameMetadata(gameSpec)
            };

        } catch (error) {
            console.error('❌ 게임 생성 실패:', error);
            throw error;
        }
    }

    /**
     * 기본 HTML 템플릿
     */
    getBaseHTMLTemplate() {
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{GAME_TITLE}}</title>
    <style>{{CSS_CONTENT}}</style>
</head>
<body>
    <div class="game-container">
        <!-- 게임 캔버스 -->
        <canvas id="gameCanvas" width="800" height="600"></canvas>
        
        <!-- 게임 UI 오버레이 -->
        <div class="game-ui">
            <!-- 세션 정보 패널 -->
            <div class="session-panel">
                <div class="session-title">🎮 {{GAME_TITLE}}</div>
                <div class="session-info">
                    <div class="session-code" id="sessionCode">----</div>
                    <div class="qr-container" id="qrContainer"></div>
                </div>
                <div class="sensor-status">
                    <span class="status-indicator" id="sensorStatus">⚪ 센서 대기중</span>
                </div>
            </div>

            <!-- 게임 정보 -->
            <div class="game-info">
                <div class="score">점수: <span id="score">0</span></div>
                <div class="lives">생명: <span id="lives">3</span></div>
                <div class="level">레벨: <span id="level">1</span></div>
            </div>

            <!-- 컨트롤 패널 -->
            <div class="control-panel">
                <button id="startBtn" onclick="startGame()">🎮 시작</button>
                <button id="pauseBtn" onclick="togglePause()">⏸️ 일시정지</button>
                <button id="resetBtn" onclick="resetGame()">🔄 재시작</button>
                <a href="/" class="home-btn">🏠 허브로</a>
            </div>
        </div>

        <!-- 게임 상태 메시지 -->
        <div class="message-overlay" id="messageOverlay">
            <div class="message-content" id="messageContent"></div>
        </div>
    </div>

    <!-- 필수 라이브러리 -->
    <script src="/socket.io/socket.io.js"></script>
    <script src="/js/SessionSDK.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>

    <script>
        {{JS_CONTENT}}
    </script>
</body>
</html>`;
    }

    /**
     * 기본 CSS 템플릿
     */
    getBaseCSSTemplate() {
        return `
        :root {
            --primary: #3b82f6;
            --secondary: #8b5cf6;
            --success: #10b981;
            --warning: #f59e0b;
            --error: #ef4444;
            --background: #0f172a;
            --surface: #1e293b;
            --card: #334155;
            --text-primary: #f8fafc;
            --text-secondary: #cbd5e1;
            --text-muted: #94a3b8;
            --border: #475569;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, var(--background), var(--surface));
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .game-container {
            position: relative;
            max-width: 1200px;
            width: 100%;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #gameCanvas {
            background: linear-gradient(45deg, #1e293b, #334155);
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            max-width: 100%;
            max-height: 80vh;
        }

        .game-ui {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 10;
        }

        .session-panel {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(30, 41, 59, 0.9);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 20px;
            pointer-events: auto;
            min-width: 250px;
        }

        .session-title {
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
            color: var(--primary);
        }

        .session-code {
            font-size: 2rem;
            font-weight: bold;
            text-align: center;
            margin-bottom: 15px;
            color: var(--success);
            font-family: 'Courier New', monospace;
        }

        .qr-container {
            display: flex;
            justify-content: center;
            margin-bottom: 15px;
        }

        .sensor-status {
            text-align: center;
            font-size: 0.9rem;
        }

        .status-indicator {
            display: inline-block;
            margin-right: 5px;
        }

        .game-info {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(30, 41, 59, 0.9);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 20px;
            pointer-events: auto;
        }

        .game-info > div {
            margin-bottom: 10px;
            font-weight: bold;
        }

        .control-panel {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 15px;
            pointer-events: auto;
        }

        .control-panel button,
        .control-panel .home-btn {
            background: var(--primary);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }

        .control-panel button:hover,
        .control-panel .home-btn:hover {
            background: var(--secondary);
            transform: translateY(-2px);
        }

        .message-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 100;
        }

        .message-content {
            background: var(--surface);
            padding: 40px;
            border-radius: 12px;
            text-align: center;
            font-size: 1.5rem;
            font-weight: bold;
        }

        @media (max-width: 768px) {
            .session-panel,
            .game-info {
                position: relative;
                margin: 10px;
            }
            
            .control-panel {
                position: relative;
                transform: none;
                justify-content: center;
                margin: 20px;
            }
        }`;
    }

    /**
     * 기본 JavaScript 템플릿
     */
    getBaseJSTemplate() {
        return `
        // 게임 메인 클래스
        class {{GAME_CLASS_NAME}} {
            constructor() {
                this.canvas = document.getElementById('gameCanvas');
                this.ctx = this.canvas.getContext('2d');
                
                // 게임 상태
                this.gameState = 'waiting'; // waiting, playing, paused, gameOver
                this.score = 0;
                this.lives = 3;
                this.level = 1;
                this.isPaused = false;
                
                // SessionSDK 초기화
                this.sdk = new SessionSDK({
                    gameId: '{{GAME_ID}}',
                    gameType: '{{GAME_TYPE}}',
                    debug: true
                });
                
                this.setupEvents();
                this.init();
            }
            
            setupEvents() {
                // SessionSDK 이벤트 처리
                this.sdk.on('connected', () => {
                    console.log('✅ 서버 연결 완료');
                    this.createSession();
                });
                
                this.sdk.on('session-created', (event) => {
                    const session = event.detail || event;
                    this.displaySessionInfo(session);
                });
                
                this.sdk.on('sensor-connected', (event) => {
                    const data = event.detail || event;
                    this.onSensorConnected(data);
                });
                
                this.sdk.on('sensor-data', (event) => {
                    const data = event.detail || event;
                    this.processSensorData(data);
                });
                
                this.sdk.on('game-ready', (event) => {
                    const data = event.detail || event;
                    this.onGameReady();
                });
            }
            
            async createSession() {
                try {
                    await this.sdk.createSession();
                } catch (error) {
                    console.error('세션 생성 실패:', error);
                }
            }
            
            displaySessionInfo(session) {
                document.getElementById('sessionCode').textContent = session.sessionCode;
                
                const qrUrl = \`\${window.location.origin}/sensor.html?session=\${session.sessionCode}\`;
                
                if (typeof QRCode !== 'undefined') {
                    QRCode.toCanvas(document.createElement('canvas'), qrUrl, (error, canvas) => {
                        if (!error) {
                            canvas.style.width = '150px';
                            canvas.style.height = '150px';
                            document.getElementById('qrContainer').innerHTML = '';
                            document.getElementById('qrContainer').appendChild(canvas);
                        } else {
                            this.showQRCodeFallback(qrUrl);
                        }
                    });
                } else {
                    this.showQRCodeFallback(qrUrl);
                }
            }
            
            showQRCodeFallback(qrUrl) {
                const qrApiUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=\${encodeURIComponent(qrUrl)}\`;
                const img = document.createElement('img');
                img.src = qrApiUrl;
                img.style.width = '150px';
                img.style.height = '150px';
                img.alt = 'QR Code';
                
                document.getElementById('qrContainer').innerHTML = '';
                document.getElementById('qrContainer').appendChild(img);
            }
            
            onSensorConnected(data) {
                console.log('센서 연결됨:', data);
                document.getElementById('sensorStatus').innerHTML = '🟢 센서 연결됨';
            }
            
            onGameReady() {
                document.getElementById('sensorStatus').innerHTML = '🟢 게임 준비 완료';
                this.showMessage('센서가 연결되었습니다!\\n게임을 시작하세요', 2000);
            }
            
            processSensorData(sensorData) {
                if (this.gameState !== 'playing') return;
                
                {{SENSOR_PROCESSING_LOGIC}}
            }
            
            init() {
                this.resize();
                this.gameLoop();
                
                // 윈도우 리사이즈 이벤트
                window.addEventListener('resize', () => this.resize());
            }
            
            resize() {
                const container = this.canvas.parentElement;
                const containerRect = container.getBoundingClientRect();
                
                const maxWidth = Math.min(800, containerRect.width - 40);
                const maxHeight = Math.min(600, containerRect.height - 40);
                
                this.canvas.style.width = maxWidth + 'px';
                this.canvas.style.height = maxHeight + 'px';
            }
            
            gameLoop() {
                this.update();
                this.render();
                requestAnimationFrame(() => this.gameLoop());
            }
            
            update() {
                if (this.gameState !== 'playing' || this.isPaused) return;
                
                {{GAME_UPDATE_LOGIC}}
            }
            
            render() {
                // 화면 클리어
                this.ctx.fillStyle = '#1e293b';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                {{GAME_RENDER_LOGIC}}
                
                this.updateUI();
            }
            
            updateUI() {
                document.getElementById('score').textContent = this.score;
                document.getElementById('lives').textContent = this.lives;
                document.getElementById('level').textContent = this.level;
            }
            
            showMessage(message, duration = 3000) {
                const overlay = document.getElementById('messageOverlay');
                const content = document.getElementById('messageContent');
                
                content.textContent = message;
                overlay.style.display = 'flex';
                
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, duration);
            }
            
            startGame() {
                if (this.gameState === 'waiting') {
                    this.gameState = 'playing';
                    this.showMessage('게임 시작!', 1500);
                }
            }
            
            togglePause() {
                if (this.gameState === 'playing') {
                    this.isPaused = !this.isPaused;
                    const pauseBtn = document.getElementById('pauseBtn');
                    pauseBtn.textContent = this.isPaused ? '▶️ 계속' : '⏸️ 일시정지';
                    
                    if (this.isPaused) {
                        this.showMessage('일시정지', 1000);
                    }
                }
            }
            
            resetGame() {
                this.gameState = 'waiting';
                this.score = 0;
                this.lives = 3;
                this.level = 1;
                this.isPaused = false;
                
                document.getElementById('pauseBtn').textContent = '⏸️ 일시정지';
                this.showMessage('게임 리셋!', 1500);
                
                {{GAME_RESET_LOGIC}}
            }
            
            gameOver() {
                this.gameState = 'gameOver';
                this.showMessage(\`게임 종료!\\n최종 점수: \${this.score}\`, 5000);
            }
        }
        
        // 전역 함수들
        function startGame() {
            game.startGame();
        }
        
        function togglePause() {
            game.togglePause();
        }
        
        function resetGame() {
            game.resetGame();
        }
        
        // 게임 인스턴스 생성
        let game;
        
        window.addEventListener('load', () => {
            game = new {{GAME_CLASS_NAME}}();
        });`;
    }

    /**
     * 플랫폼 게임 템플릿
     */
    getPlatformerTemplate() {
        return {
            gameLogic: `
                // 플레이어 객체
                this.player = {
                    x: 100,
                    y: 300,
                    width: 30,
                    height: 40,
                    velocityX: 0,
                    velocityY: 0,
                    onGround: false,
                    color: '#3b82f6'
                };
                
                // 플랫폼들
                this.platforms = [
                    { x: 0, y: 550, width: 800, height: 50 },
                    { x: 200, y: 450, width: 150, height: 20 },
                    { x: 500, y: 350, width: 150, height: 20 }
                ];
                
                // 적들
                this.enemies = [
                    { x: 300, y: 430, width: 20, height: 20, speed: 1, direction: 1 }
                ];
                
                // 수집 아이템
                this.collectibles = [
                    { x: 250, y: 420, width: 15, height: 15, collected: false }
                ];
            `,
            updateLogic: `
                // 중력 적용
                this.player.velocityY += 0.5;
                
                // 플레이어 이동
                this.player.x += this.player.velocityX;
                this.player.y += this.player.velocityY;
                
                // 플랫폼 충돌 검사
                this.player.onGround = false;
                this.platforms.forEach(platform => {
                    if (this.checkCollision(this.player, platform)) {
                        if (this.player.velocityY > 0) {
                            this.player.y = platform.y - this.player.height;
                            this.player.velocityY = 0;
                            this.player.onGround = true;
                        }
                    }
                });
                
                // 적 이동
                this.enemies.forEach(enemy => {
                    enemy.x += enemy.speed * enemy.direction;
                    if (enemy.x <= 200 || enemy.x >= 330) {
                        enemy.direction *= -1;
                    }
                });
                
                // 수집 아이템 체크
                this.collectibles.forEach(item => {
                    if (!item.collected && this.checkCollision(this.player, item)) {
                        item.collected = true;
                        this.score += 10;
                    }
                });
                
                // 경계 체크
                if (this.player.x < 0) this.player.x = 0;
                if (this.player.x > this.canvas.width - this.player.width) {
                    this.player.x = this.canvas.width - this.player.width;
                }
                
                // 떨어짐 체크
                if (this.player.y > this.canvas.height) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameOver();
                    } else {
                        this.resetPlayerPosition();
                    }
                }
            `,
            renderLogic: `
                // 플랫폼 그리기
                this.ctx.fillStyle = '#475569';
                this.platforms.forEach(platform => {
                    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                });
                
                // 플레이어 그리기
                this.ctx.fillStyle = this.player.color;
                this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
                
                // 적 그리기
                this.ctx.fillStyle = '#ef4444';
                this.enemies.forEach(enemy => {
                    this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                });
                
                // 수집 아이템 그리기
                this.ctx.fillStyle = '#f59e0b';
                this.collectibles.forEach(item => {
                    if (!item.collected) {
                        this.ctx.fillRect(item.x, item.y, item.width, item.height);
                    }
                });
            `,
            sensorLogic: `
                const { orientation } = sensorData.data;
                if (orientation) {
                    // 좌우 기울기로 이동
                    this.player.velocityX = orientation.gamma * 0.2;
                    
                    // 앞으로 기울이면 점프
                    if (orientation.beta < -20 && this.player.onGround) {
                        this.player.velocityY = -12;
                    }
                }
            `,
            resetLogic: `
                this.player.x = 100;
                this.player.y = 300;
                this.player.velocityX = 0;
                this.player.velocityY = 0;
                
                this.collectibles.forEach(item => {
                    item.collected = false;
                });
            `,
            helperMethods: `
                checkCollision(rect1, rect2) {
                    return rect1.x < rect2.x + rect2.width &&
                           rect1.x + rect1.width > rect2.x &&
                           rect1.y < rect2.y + rect2.height &&
                           rect1.y + rect1.height > rect2.y;
                }
                
                resetPlayerPosition() {
                    this.player.x = 100;
                    this.player.y = 300;
                    this.player.velocityX = 0;
                    this.player.velocityY = 0;
                }
            `
        };
    }

    /**
     * 퍼즐 게임 템플릿
     */
    getPuzzleTemplate() {
        return {
            gameLogic: `
                // 미로 맵 (1: 벽, 0: 길)
                this.maze = [
                    [1,1,1,1,1,1,1,1,1,1],
                    [1,0,0,0,1,0,0,0,0,1],
                    [1,0,1,0,1,0,1,1,0,1],
                    [1,0,1,0,0,0,0,1,0,1],
                    [1,0,1,1,1,1,0,1,0,1],
                    [1,0,0,0,0,0,0,1,0,1],
                    [1,1,1,1,1,1,0,0,0,1],
                    [1,1,1,1,1,1,1,1,1,1]
                ];
                
                // 플레이어 위치 (격자 좌표)
                this.player = {
                    gridX: 1,
                    gridY: 1,
                    x: 1 * 60 + 10,
                    y: 1 * 60 + 10,
                    size: 40,
                    color: '#10b981'
                };
                
                // 목표 지점
                this.goal = {
                    gridX: 8,
                    gridY: 6,
                    x: 8 * 60 + 10,
                    y: 6 * 60 + 10,
                    size: 40,
                    color: '#f59e0b'
                };
                
                this.cellSize = 60;
            `,
            updateLogic: `
                // 플레이어 실제 위치 업데이트
                this.player.x = this.player.gridX * this.cellSize + 10;
                this.player.y = this.player.gridY * this.cellSize + 10;
                
                // 목표 도달 체크
                if (this.player.gridX === this.goal.gridX && 
                    this.player.gridY === this.goal.gridY) {
                    this.score += 100;
                    this.level++;
                    this.generateNewMaze();
                }
            `,
            renderLogic: `
                // 미로 그리기
                for (let y = 0; y < this.maze.length; y++) {
                    for (let x = 0; x < this.maze[y].length; x++) {
                        if (this.maze[y][x] === 1) {
                            this.ctx.fillStyle = '#475569';
                        } else {
                            this.ctx.fillStyle = '#334155';
                        }
                        this.ctx.fillRect(x * this.cellSize, y * this.cellSize, 
                                         this.cellSize, this.cellSize);
                    }
                }
                
                // 목표 지점 그리기
                this.ctx.fillStyle = this.goal.color;
                this.ctx.fillRect(this.goal.x, this.goal.y, this.goal.size, this.goal.size);
                
                // 플레이어 그리기
                this.ctx.fillStyle = this.player.color;
                this.ctx.fillRect(this.player.x, this.player.y, this.player.size, this.player.size);
            `,
            sensorLogic: `
                const { orientation } = sensorData.data;
                if (orientation) {
                    let newX = this.player.gridX;
                    let newY = this.player.gridY;
                    
                    // 기울기 방향에 따른 이동
                    if (orientation.gamma > 15) newX++; // 우측
                    if (orientation.gamma < -15) newX--; // 좌측
                    if (orientation.beta > 15) newY++; // 하향
                    if (orientation.beta < -15) newY--; // 상향
                    
                    // 벽 충돌 체크
                    if (newY >= 0 && newY < this.maze.length &&
                        newX >= 0 && newX < this.maze[newY].length &&
                        this.maze[newY][newX] === 0) {
                        this.player.gridX = newX;
                        this.player.gridY = newY;
                    }
                }
            `,
            resetLogic: `
                this.player.gridX = 1;
                this.player.gridY = 1;
            `,
            helperMethods: `
                generateNewMaze() {
                    // 간단한 미로 생성 로직 (여기서는 기본 미로 재사용)
                    this.showMessage(\`레벨 \${this.level} 클리어!\`, 2000);
                }
            `
        };
    }

    /**
     * 레이싱 게임 템플릿
     */
    getRacingTemplate() {
        return {
            gameLogic: `
                // 플레이어 차량
                this.car = {
                    x: 375,
                    y: 500,
                    width: 50,
                    height: 80,
                    speed: 0,
                    maxSpeed: 8,
                    color: '#3b82f6'
                };
                
                // 도로 차선
                this.roadLines = [];
                for (let i = 0; i < 10; i++) {
                    this.roadLines.push({
                        x: 395,
                        y: i * 120,
                        width: 10,
                        height: 60
                    });
                }
                
                // 장애물 차량들
                this.obstacles = [
                    { x: 300, y: -100, width: 50, height: 80, speed: 3, color: '#ef4444' },
                    { x: 450, y: -300, width: 50, height: 80, speed: 4, color: '#f59e0b' }
                ];
                
                this.roadSpeed = 5;
            `,
            updateLogic: `
                // 도로 움직임
                this.roadLines.forEach(line => {
                    line.y += this.roadSpeed;
                    if (line.y > this.canvas.height) {
                        line.y = -60;
                    }
                });
                
                // 장애물 이동
                this.obstacles.forEach(obstacle => {
                    obstacle.y += obstacle.speed + this.roadSpeed;
                    if (obstacle.y > this.canvas.height) {
                        obstacle.y = -100;
                        obstacle.x = 250 + Math.random() * 300;
                        this.score += 10;
                    }
                    
                    // 충돌 검사
                    if (this.checkCollision(this.car, obstacle)) {
                        this.lives--;
                        if (this.lives <= 0) {
                            this.gameOver();
                        } else {
                            obstacle.y = -100;
                        }
                    }
                });
                
                // 차량 경계 체크
                if (this.car.x < 250) this.car.x = 250;
                if (this.car.x > 500) this.car.x = 500;
                
                // 속도 증가
                this.roadSpeed += 0.001;
            `,
            renderLogic: `
                // 도로 배경
                this.ctx.fillStyle = '#374151';
                this.ctx.fillRect(250, 0, 300, this.canvas.height);
                
                // 도로 경계선
                this.ctx.fillStyle = '#f9fafb';
                this.ctx.fillRect(250, 0, 5, this.canvas.height);
                this.ctx.fillRect(545, 0, 5, this.canvas.height);
                
                // 중앙선
                this.ctx.fillStyle = '#fbbf24';
                this.roadLines.forEach(line => {
                    this.ctx.fillRect(line.x, line.y, line.width, line.height);
                });
                
                // 장애물 차량
                this.obstacles.forEach(obstacle => {
                    this.ctx.fillStyle = obstacle.color;
                    this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                });
                
                // 플레이어 차량
                this.ctx.fillStyle = this.car.color;
                this.ctx.fillRect(this.car.x, this.car.y, this.car.width, this.car.height);
            `,
            sensorLogic: `
                const { orientation } = sensorData.data;
                if (orientation) {
                    // 좌우 기울기로 차량 조작
                    this.car.x += orientation.gamma * 0.5;
                }
            `,
            resetLogic: `
                this.car.x = 375;
                this.car.speed = 0;
                this.roadSpeed = 5;
                
                this.obstacles.forEach(obstacle => {
                    obstacle.y = -Math.random() * 500 - 100;
                    obstacle.x = 250 + Math.random() * 300;
                });
            `,
            helperMethods: `
                checkCollision(rect1, rect2) {
                    return rect1.x < rect2.x + rect2.width &&
                           rect1.x + rect1.width > rect2.x &&
                           rect1.y < rect2.y + rect2.height &&
                           rect1.y + rect1.height > rect2.y;
                }
            `
        };
    }

    /**
     * 아케이드 게임 템플릿 (기본)
     */
    getArcadeTemplate() {
        return {
            gameLogic: `
                // 패들 (플레이어 조작)
                this.paddle = {
                    x: this.canvas.width / 2 - 60,
                    y: this.canvas.height - 30,
                    width: 120,
                    height: 15,
                    color: '#3b82f6'
                };
                
                // 공
                this.ball = {
                    x: this.canvas.width / 2,
                    y: this.canvas.height - 50,
                    radius: 12,
                    velocityX: 4,
                    velocityY: -4,
                    color: '#f59e0b',
                    maxSpeed: 8
                };
                
                // 벽돌들
                this.bricks = [];
                this.createBricks();
                
                this.lives = 3;
                this.gameStarted = false;
            `,
            updateLogic: `
                if (!this.gameStarted) return;
                
                // 공 이동
                this.ball.x += this.ball.velocityX;
                this.ball.y += this.ball.velocityY;
                
                // 좌우 벽 충돌
                if (this.ball.x - this.ball.radius < 0 || 
                    this.ball.x + this.ball.radius > this.canvas.width) {
                    this.ball.velocityX = -this.ball.velocityX;
                    this.ball.x = Math.max(this.ball.radius, 
                                          Math.min(this.canvas.width - this.ball.radius, this.ball.x));
                }
                
                // 상단 벽 충돌
                if (this.ball.y - this.ball.radius < 0) {
                    this.ball.velocityY = -this.ball.velocityY;
                    this.ball.y = this.ball.radius;
                }
                
                // 하단 벽 충돌 (생명 감소)
                if (this.ball.y + this.ball.radius > this.canvas.height) {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.showMessage('게임 오버!');
                        this.resetGame();
                    } else {
                        this.resetBall();
                    }
                }
                
                // 패들과 공 충돌
                if (this.ball.y + this.ball.radius > this.paddle.y &&
                    this.ball.x > this.paddle.x && 
                    this.ball.x < this.paddle.x + this.paddle.width) {
                    
                    this.ball.velocityY = -Math.abs(this.ball.velocityY);
                    
                    // 패들 위치에 따른 반사 각도 조정
                    let relativeIntersectX = (this.ball.x - (this.paddle.x + this.paddle.width/2));
                    let normalizedIntersectX = relativeIntersectX / (this.paddle.width/2);
                    this.ball.velocityX = normalizedIntersectX * this.ball.maxSpeed;
                }
                
                // 벽돌과 공 충돌
                for (let i = this.bricks.length - 1; i >= 0; i--) {
                    let brick = this.bricks[i];
                    if (this.ball.x > brick.x && this.ball.x < brick.x + brick.width &&
                        this.ball.y > brick.y && this.ball.y < brick.y + brick.height) {
                        
                        this.ball.velocityY = -this.ball.velocityY;
                        this.bricks.splice(i, 1);
                        this.score += 10;
                        
                        // 모든 벽돌 제거 시 승리
                        if (this.bricks.length === 0) {
                            this.showMessage('승리! 모든 벽돌을 깨뜨렸습니다!');
                            this.resetGame();
                        }
                        break;
                    }
                }
            `,
            renderLogic: `
                // 패들 그리기
                this.ctx.fillStyle = this.paddle.color;
                this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
                
                // 벽돌들 그리기
                this.bricks.forEach(brick => {
                    this.ctx.fillStyle = brick.color;
                    this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
                    
                    // 벽돌 테두리
                    this.ctx.strokeStyle = '#1e293b';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
                });
                
                // 공 그리기
                this.ctx.fillStyle = this.ball.color;
                this.ctx.beginPath();
                this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 생명 표시
                this.ctx.fillStyle = '#ef4444';
                this.ctx.font = '20px Arial';
                this.ctx.fillText('생명: ' + this.lives, 20, 30);
                
                // 게임 시작 안내
                if (!this.gameStarted) {
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                    
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = '24px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('기기를 기울여서 패들을 조작하세요', 
                                    this.canvas.width/2, this.canvas.height/2 - 20);
                    this.ctx.fillText('클릭하여 시작!', 
                                    this.canvas.width/2, this.canvas.height/2 + 20);
                    this.ctx.textAlign = 'left';
                }
            `,
            sensorLogic: `
                const { orientation } = sensorData.data;
                if (orientation && this.gameStarted) {
                    // 기울기로 패들 조작 (좌우만)
                    const tiltSensitivity = 4;
                    this.paddle.x += orientation.gamma * tiltSensitivity;
                    
                    // 패들이 화면 밖으로 나가지 않도록 제한
                    this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, this.paddle.x));
                }
            `,
            resetLogic: `
                // 게임 초기화
                this.paddle.x = this.canvas.width / 2 - 60;
                this.resetBall();
                this.createBricks();
                this.lives = 3;
                this.score = 0;
                this.gameStarted = false;
            `,
            helperMethods: `
                createBricks() {
                    this.bricks = [];
                    const rows = 5;
                    const cols = 8;
                    const brickWidth = this.canvas.width / cols - 10;
                    const brickHeight = 25;
                    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];
                    
                    for (let row = 0; row < rows; row++) {
                        for (let col = 0; col < cols; col++) {
                            this.bricks.push({
                                x: col * (brickWidth + 5) + 5,
                                y: row * (brickHeight + 5) + 50,
                                width: brickWidth,
                                height: brickHeight,
                                color: colors[row]
                            });
                        }
                    }
                }
                
                resetBall() {
                    this.ball.x = this.canvas.width / 2;
                    this.ball.y = this.canvas.height - 50;
                    this.ball.velocityX = 4;
                    this.ball.velocityY = -4;
                }
                
                // 게임 시작 처리
                startGame() {
                    this.gameStarted = true;
                }
                
                // 캔버스 클릭 이벤트 추가
                init() {
                    this.canvas.addEventListener('click', () => {
                        if (!this.gameStarted) {
                            this.startGame();
                        }
                    });
                }
            `
        };
    }

    /**
     * 액션 게임 템플릿
     */
    getActionTemplate() {
        return {
            gameLogic: `
                // 플레이어
                this.player = {
                    x: 400,
                    y: 300,
                    radius: 25,
                    health: 100,
                    maxHealth: 100,
                    color: '#3b82f6'
                };
                
                // 총알들
                this.bullets = [];
                
                // 적들
                this.enemies = [];
                this.spawnEnemy();
                
                this.lastShot = 0;
                this.shotCooldown = 200;
            `,
            updateLogic: `
                // 총알 업데이트
                this.bullets = this.bullets.filter(bullet => {
                    bullet.x += bullet.velocityX;
                    bullet.y += bullet.velocityY;
                    
                    return bullet.x > 0 && bullet.x < this.canvas.width &&
                           bullet.y > 0 && bullet.y < this.canvas.height;
                });
                
                // 적 업데이트
                this.enemies.forEach(enemy => {
                    // 플레이어를 향해 이동
                    const dx = this.player.x - enemy.x;
                    const dy = this.player.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        enemy.x += (dx / distance) * enemy.speed;
                        enemy.y += (dy / distance) * enemy.speed;
                    }
                    
                    // 플레이어와 충돌 체크
                    if (distance < this.player.radius + enemy.radius) {
                        this.player.health -= 1;
                        if (this.player.health <= 0) {
                            this.gameOver();
                        }
                    }
                });
                
                // 총알과 적 충돌 체크
                this.bullets.forEach((bullet, bulletIndex) => {
                    this.enemies.forEach((enemy, enemyIndex) => {
                        const distance = Math.sqrt(
                            Math.pow(bullet.x - enemy.x, 2) + 
                            Math.pow(bullet.y - enemy.y, 2)
                        );
                        
                        if (distance < bullet.radius + enemy.radius) {
                            this.bullets.splice(bulletIndex, 1);
                            this.enemies.splice(enemyIndex, 1);
                            this.score += 20;
                            this.spawnEnemy();
                        }
                    });
                });
                
                // 새 적 스폰
                if (Math.random() < 0.01) {
                    this.spawnEnemy();
                }
            `,
            renderLogic: `
                // 플레이어 그리기
                this.ctx.fillStyle = this.player.color;
                this.ctx.beginPath();
                this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 체력바 그리기
                const healthBarWidth = 200;
                const healthBarHeight = 20;
                const healthPercent = this.player.health / this.player.maxHealth;
                
                this.ctx.fillStyle = '#374151';
                this.ctx.fillRect(10, 10, healthBarWidth, healthBarHeight);
                
                this.ctx.fillStyle = healthPercent > 0.5 ? '#10b981' : 
                                   healthPercent > 0.25 ? '#f59e0b' : '#ef4444';
                this.ctx.fillRect(10, 10, healthBarWidth * healthPercent, healthBarHeight);
                
                // 총알 그리기
                this.ctx.fillStyle = '#fbbf24';
                this.bullets.forEach(bullet => {
                    this.ctx.beginPath();
                    this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
                    this.ctx.fill();
                });
                
                // 적 그리기
                this.ctx.fillStyle = '#ef4444';
                this.enemies.forEach(enemy => {
                    this.ctx.beginPath();
                    this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
                    this.ctx.fill();
                });
            `,
            sensorLogic: `
                const { orientation, acceleration } = sensorData.data;
                
                if (orientation) {
                    // 기울기로 플레이어 이동
                    this.player.x += orientation.gamma * 0.5;
                    this.player.y += orientation.beta * 0.5;
                    
                    // 경계 체크
                    this.player.x = Math.max(this.player.radius, 
                                           Math.min(this.canvas.width - this.player.radius, this.player.x));
                    this.player.y = Math.max(this.player.radius, 
                                           Math.min(this.canvas.height - this.player.radius, this.player.y));
                }
                
                if (acceleration) {
                    // 흔들기로 총알 발사
                    const totalAccel = Math.sqrt(
                        acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
                    );
                    
                    if (totalAccel > 15 && Date.now() - this.lastShot > this.shotCooldown) {
                        this.shoot();
                        this.lastShot = Date.now();
                    }
                }
            `,
            resetLogic: `
                this.player.x = 400;
                this.player.y = 300;
                this.player.health = this.player.maxHealth;
                
                this.bullets = [];
                this.enemies = [];
                this.spawnEnemy();
            `,
            helperMethods: `
                spawnEnemy() {
                    const side = Math.floor(Math.random() * 4);
                    let x, y;
                    
                    switch (side) {
                        case 0: x = Math.random() * this.canvas.width; y = -20; break;
                        case 1: x = this.canvas.width + 20; y = Math.random() * this.canvas.height; break;
                        case 2: x = Math.random() * this.canvas.width; y = this.canvas.height + 20; break;
                        case 3: x = -20; y = Math.random() * this.canvas.height; break;
                    }
                    
                    this.enemies.push({
                        x: x,
                        y: y,
                        radius: 15,
                        speed: 1 + Math.random()
                    });
                }
                
                shoot() {
                    // 가장 가까운 적을 향해 발사
                    let targetX = this.canvas.width / 2;
                    let targetY = this.canvas.height / 2;
                    
                    if (this.enemies.length > 0) {
                        const nearestEnemy = this.enemies.reduce((nearest, enemy) => {
                            const distance = Math.sqrt(
                                Math.pow(this.player.x - enemy.x, 2) + 
                                Math.pow(this.player.y - enemy.y, 2)
                            );
                            return distance < nearest.distance ? 
                                   { enemy, distance } : nearest;
                        }, { distance: Infinity });
                        
                        if (nearestEnemy.enemy) {
                            targetX = nearestEnemy.enemy.x;
                            targetY = nearestEnemy.enemy.y;
                        }
                    }
                    
                    const dx = targetX - this.player.x;
                    const dy = targetY - this.player.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        const speed = 10;
                        this.bullets.push({
                            x: this.player.x,
                            y: this.player.y,
                            velocityX: (dx / distance) * speed,
                            velocityY: (dy / distance) * speed,
                            radius: 5
                        });
                    }
                }
            `
        };
    }

    /**
     * 게임 설정 생성
     */
    generateGameConfig(gameSpec) {
        return {
            gameId: gameSpec.suggestedGameId,
            gameType: gameSpec.gameType,
            title: gameSpec.suggestedTitle,
            className: this.generateClassName(gameSpec.suggestedGameId),
            sensors: gameSpec.sensors
        };
    }

    /**
     * 게임 로직 생성
     */
    generateGameLogic(gameSpec, template) {
        return {
            initLogic: template.gameLogic || '',
            updateLogic: template.updateLogic || '',
            renderLogic: template.renderLogic || '',
            resetLogic: template.resetLogic || '',
            helperMethods: template.helperMethods || ''
        };
    }

    /**
     * 센서 처리 로직 생성
     */
    generateSensorLogic(gameSpec) {
        const template = this.templates.get(gameSpec.genre) || this.templates.get('arcade');
        return template.sensorLogic || `
            const { orientation } = sensorData.data;
            if (orientation) {
                // 기본 센서 처리 로직
                console.log('센서 데이터:', orientation);
            }
        `;
    }

    /**
     * UI 컴포넌트 생성
     */
    generateUIComponents(gameSpec) {
        return {
            sessionPanel: true,
            gameInfo: true,
            controlPanel: true,
            messageOverlay: true
        };
    }

    /**
     * 전체 HTML 조립
     */
    assembleHTML(components) {
        const { gameSpec, gameConfig, gameLogic, sensorLogic, baseTemplate } = components;
        
        let html = baseTemplate.html;
        let css = this.getBaseCSSTemplate();
        let js = this.getBaseJSTemplate();

        // HTML 템플릿 변수 치환
        html = html.replace(/{{GAME_TITLE}}/g, gameConfig.title);
        html = html.replace(/{{CSS_CONTENT}}/g, css);
        html = html.replace(/{{JS_CONTENT}}/g, this.assembleJavaScript(gameConfig, gameLogic, sensorLogic));

        return html;
    }

    /**
     * JavaScript 코드 조립
     */
    assembleJavaScript(gameConfig, gameLogic, sensorLogic) {
        let js = this.getBaseJSTemplate();

        // JavaScript 템플릿 변수 치환
        js = js.replace(/{{GAME_CLASS_NAME}}/g, gameConfig.className);
        js = js.replace(/{{GAME_ID}}/g, gameConfig.gameId);
        js = js.replace(/{{GAME_TYPE}}/g, gameConfig.gameType);
        js = js.replace(/{{SENSOR_PROCESSING_LOGIC}}/g, sensorLogic);
        js = js.replace(/{{GAME_UPDATE_LOGIC}}/g, gameLogic.updateLogic);
        js = js.replace(/{{GAME_RENDER_LOGIC}}/g, gameLogic.renderLogic);
        js = js.replace(/{{GAME_RESET_LOGIC}}/g, gameLogic.resetLogic);

        // 게임 초기화 로직과 헬퍼 메서드 추가
        js = js.replace('this.init();', `
            ${gameLogic.initLogic}
            this.init();
        `);

        // 헬퍼 메서드 추가
        js = js.replace('// 게임 인스턴스 생성', `
            ${gameLogic.helperMethods}
            
            // 게임 인스턴스 생성
        `);

        return js;
    }

    /**
     * 클래스명 생성
     */
    generateClassName(gameId) {
        return gameId.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('') + 'Game';
    }

    /**
     * 게임 메타데이터 생성
     */
    generateGameMetadata(gameSpec) {
        return {
            id: gameSpec.suggestedGameId,
            title: gameSpec.suggestedTitle,
            description: `AI가 생성한 ${gameSpec.genre} 게임입니다. ${gameSpec.objective}`,
            category: gameSpec.gameType,
            icon: this.getGenreIcon(gameSpec.genre),
            version: "1.0.0",
            author: "AI Game Generator",
            sensors: gameSpec.sensors,
            maxPlayers: gameSpec.gameType === 'solo' ? 1 : gameSpec.gameType === 'dual' ? 2 : 8,
            difficulty: gameSpec.difficulty,
            status: "active",
            featured: false,
            tags: [gameSpec.genre, ...gameSpec.sensorMechanics, "ai-generated"],
            instructions: [
                gameSpec.objective,
                "모바일을 기울여서 조작하세요",
                "세션 코드로 센서를 연결하세요"
            ],
            controls: this.generateControlsDescription(gameSpec),
            createdAt: new Date().toISOString(),
            aiGenerated: true,
            originalPrompt: gameSpec.originalInput
        };
    }

    /**
     * 장르별 아이콘 반환
     */
    getGenreIcon(genre) {
        const icons = {
            platformer: '🏃',
            puzzle: '🧩',
            racing: '🏎️',
            adventure: '🗺️',
            arcade: '🕹️',
            action: '⚔️',
            sports: '⚽',
            rhythm: '🎵'
        };
        return icons[genre] || '🎮';
    }

    /**
     * 조작법 설명 생성
     */
    generateControlsDescription(gameSpec) {
        const controls = {};
        
        gameSpec.sensorMechanics.forEach(mechanic => {
            switch (mechanic) {
                case 'tilt':
                    controls['기울기'] = '캐릭터/오브젝트 이동';
                    break;
                case 'shake':
                    controls['흔들기'] = '특수 액션 실행';
                    break;
                case 'rotate':
                    controls['회전'] = '방향 전환';
                    break;
                case 'motion':
                    controls['움직임'] = '다양한 제스처 인식';
                    break;
            }
        });

        return controls;
    }
}

module.exports = GameTemplateEngine;