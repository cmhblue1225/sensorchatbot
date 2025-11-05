# 🎮 기본 게임 예제 컬렉션 (30개)

## 📋 목차
1. [단일 센서 게임 예제 (10개)](#단일-센서-게임-예제)
2. [듀얼 센서 게임 예제 (10개)](#듀얼-센서-게임-예제)
3. [멀티플레이어 게임 예제 (10개)](#멀티플레이어-게임-예제)

---

## 단일 센서 게임 예제

### 예제 1: 공 튕기기 게임
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>공 튕기기 게임</title>
    <script src="/js/SessionSDK.js"></script>
    <style>
        #gameCanvas {
            border: 2px solid #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .game-info {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div id="sessionInfo"></div>
    <div class="game-info">
        <span>점수: <span id="score">0</span></span>
        <span>생명: <span id="lives">3</span></span>
    </div>
    <canvas id="gameCanvas" width="800" height="600"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // 게임 상태
        const game = {
            ball: {
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: 0,
                vy: 0,
                radius: 20,
                color: '#ff6b6b'
            },
            paddle: {
                x: canvas.width / 2 - 50,
                y: canvas.height - 30,
                width: 100,
                height: 15,
                color: '#4ecdc4'
            },
            score: 0,
            lives: 3,
            gravity: 0.3,
            bounce: 0.8
        };

        // SessionSDK 초기화
        const sdk = new SessionSDK({
            gameId: 'ball-bounce',
            gameType: 'solo'
        });

        sdk.on('connected', () => {
            createSession();
        });

        sdk.on('session-created', (event) => {
            const session = event.detail || event;
            displaySessionInfo(session);
        });

        sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            processSensorData(data);
        });

        function createSession() {
            sdk.createSession();
        }

        function displaySessionInfo(session) {
            document.getElementById('sessionInfo').innerHTML = `
                <div style="background: #f0f8ff; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                    <h3>🎮 공 튕기기 게임</h3>
                    <p><strong>세션 코드:</strong> ${session.sessionCode}</p>
                    <p><strong>QR 코드:</strong></p>
                    <div id="qrcode"></div>
                    <p>스마트폰으로 QR 코드를 스캔하거나 센서 페이지에서 세션 코드를 입력하세요!</p>
                </div>
            `;

            generateQRCode(session.qrCodeUrl);
            startGame();
        }

        function generateQRCode(url) {
            try {
                if (typeof QRCode !== 'undefined') {
                    new QRCode(document.getElementById("qrcode"), {
                        text: url,
                        width: 128,
                        height: 128
                    });
                } else {
                    document.getElementById("qrcode").innerHTML =
                        `<img src="https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(url)}" alt="QR Code">`;
                }
            } catch (error) {
                document.getElementById("qrcode").innerHTML =
                    `<img src="https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(url)}" alt="QR Code">`;
            }
        }

        function processSensorData(data) {
            if (data.orientation) {
                // 패들 위치 제어 (좌우 기울기)
                const tilt = data.orientation.gamma; // -90 ~ 90도
                const normalizedTilt = Math.max(-1, Math.min(1, tilt / 45)); // -1 ~ 1로 정규화

                game.paddle.x = (canvas.width / 2) + (normalizedTilt * (canvas.width / 2 - game.paddle.width / 2));
                game.paddle.x = Math.max(0, Math.min(canvas.width - game.paddle.width, game.paddle.x));
            }
        }

        function startGame() {
            gameLoop();
        }

        function update() {
            // 중력 적용
            game.ball.vy += game.gravity;

            // 공 위치 업데이트
            game.ball.x += game.ball.vx;
            game.ball.y += game.ball.vy;

            // 벽 충돌
            if (game.ball.x <= game.ball.radius || game.ball.x >= canvas.width - game.ball.radius) {
                game.ball.vx *= -game.bounce;
                game.ball.x = Math.max(game.ball.radius, Math.min(canvas.width - game.ball.radius, game.ball.x));
            }

            if (game.ball.y <= game.ball.radius) {
                game.ball.vy *= -game.bounce;
                game.ball.y = game.ball.radius;
            }

            // 패들 충돌
            if (game.ball.y + game.ball.radius >= game.paddle.y &&
                game.ball.x >= game.paddle.x &&
                game.ball.x <= game.paddle.x + game.paddle.width) {

                game.ball.vy = -Math.abs(game.ball.vy) * game.bounce;
                game.ball.y = game.paddle.y - game.ball.radius;

                // 패들 중앙에서의 거리에 따라 X 속도 조정
                const paddleCenter = game.paddle.x + game.paddle.width / 2;
                const relativeHitPos = (game.ball.x - paddleCenter) / (game.paddle.width / 2);
                game.ball.vx += relativeHitPos * 3;

                game.score += 10;
                document.getElementById('score').textContent = game.score;
            }

            // 바닥 충돌 (생명 감소)
            if (game.ball.y >= canvas.height + game.ball.radius) {
                game.lives--;
                document.getElementById('lives').textContent = game.lives;

                if (game.lives <= 0) {
                    alert(`게임 오버! 최종 점수: ${game.score}`);
                    resetGame();
                } else {
                    // 공 리셋
                    game.ball.x = canvas.width / 2;
                    game.ball.y = canvas.height / 2;
                    game.ball.vx = (Math.random() - 0.5) * 4;
                    game.ball.vy = -2;
                }
            }
        }

        function render() {
            // 화면 지우기
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 공 그리기
            ctx.beginPath();
            ctx.arc(game.ball.x, game.ball.y, game.ball.radius, 0, Math.PI * 2);
            ctx.fillStyle = game.ball.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 패들 그리기
            ctx.fillStyle = game.paddle.color;
            ctx.fillRect(game.paddle.x, game.paddle.y, game.paddle.width, game.paddle.height);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(game.paddle.x, game.paddle.y, game.paddle.width, game.paddle.height);
        }

        function resetGame() {
            game.ball.x = canvas.width / 2;
            game.ball.y = canvas.height / 2;
            game.ball.vx = (Math.random() - 0.5) * 4;
            game.ball.vy = -2;
            game.score = 0;
            game.lives = 3;
            document.getElementById('score').textContent = game.score;
            document.getElementById('lives').textContent = game.lives;
        }

        function gameLoop() {
            update();
            render();
            requestAnimationFrame(gameLoop);
        }

        // QR 코드 라이브러리 로드
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
        document.head.appendChild(script);
    </script>
</body>
</html>
```

### 예제 2: 미로 탈출 게임
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>미로 탈출 게임</title>
    <script src="/js/SessionSDK.js"></script>
    <style>
        #gameCanvas {
            border: 2px solid #333;
            background: #2c3e50;
        }
        .controls {
            margin: 10px 0;
            text-align: center;
        }
        .timer {
            font-size: 18px;
            font-weight: bold;
            color: #e74c3c;
        }
    </style>
</head>
<body>
    <div id="sessionInfo"></div>
    <div class="controls">
        <div class="timer">시간: <span id="timeLeft">60</span>초</div>
    </div>
    <canvas id="gameCanvas" width="600" height="600"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // 미로 맵 (1: 벽, 0: 길, 2: 출구)
        const maze = [
            [1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,1,0,0,0,0,0,0,1],
            [1,0,1,0,1,0,1,1,1,1,0,1],
            [1,0,1,0,0,0,0,0,0,1,0,1],
            [1,0,1,1,1,1,1,1,0,1,0,1],
            [1,0,0,0,0,0,0,1,0,1,0,1],
            [1,1,1,1,1,1,0,1,0,0,0,1],
            [1,0,0,0,0,0,0,1,1,1,0,1],
            [1,0,1,1,1,1,0,0,0,0,0,1],
            [1,0,0,0,0,1,1,1,1,1,0,1],
            [1,0,1,1,0,0,0,0,0,0,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1]
        ];

        const cellSize = 50;
        const game = {
            player: {
                x: 1,
                y: 1,
                size: 20,
                color: '#3498db'
            },
            timeLeft: 60,
            gameRunning: false,
            sensitivity: 0.1
        };

        // SessionSDK 초기화
        const sdk = new SessionSDK({
            gameId: 'maze-escape',
            gameType: 'solo'
        });

        sdk.on('connected', () => {
            createSession();
        });

        sdk.on('session-created', (event) => {
            const session = event.detail || event;
            displaySessionInfo(session);
        });

        sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            processSensorData(data);
        });

        function createSession() {
            sdk.createSession();
        }

        function displaySessionInfo(session) {
            document.getElementById('sessionInfo').innerHTML = `
                <div style="background: #ecf0f1; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                    <h3>🏃‍♂️ 미로 탈출 게임</h3>
                    <p><strong>세션 코드:</strong> ${session.sessionCode}</p>
                    <p><strong>목표:</strong> 60초 안에 미로를 탈출하세요!</p>
                    <div id="qrcode"></div>
                </div>
            `;

            generateQRCode(session.qrCodeUrl);
            startGame();
        }

        function generateQRCode(url) {
            try {
                if (typeof QRCode !== 'undefined') {
                    new QRCode(document.getElementById("qrcode"), {
                        text: url,
                        width: 128,
                        height: 128
                    });
                } else {
                    document.getElementById("qrcode").innerHTML =
                        `<img src="https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(url)}" alt="QR Code">`;
                }
            } catch (error) {
                document.getElementById("qrcode").innerHTML =
                    `<img src="https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(url)}" alt="QR Code">`;
            }
        }

        function processSensorData(data) {
            if (!game.gameRunning || !data.orientation) return;

            const { beta, gamma } = data.orientation;

            // 기울기를 이용한 플레이어 이동
            const moveThreshold = 10; // 최소 기울기 각도

            let newX = game.player.x;
            let newY = game.player.y;

            // 좌우 이동 (gamma: -90 ~ 90)
            if (Math.abs(gamma) > moveThreshold) {
                if (gamma > moveThreshold) {
                    newX = Math.min(game.player.x + game.sensitivity, maze[0].length - 1);
                } else if (gamma < -moveThreshold) {
                    newX = Math.max(game.player.x - game.sensitivity, 0);
                }
            }

            // 상하 이동 (beta: -180 ~ 180)
            if (Math.abs(beta) > moveThreshold) {
                if (beta > moveThreshold) {
                    newY = Math.min(game.player.y + game.sensitivity, maze.length - 1);
                } else if (beta < -moveThreshold) {
                    newY = Math.max(game.player.y - game.sensitivity, 0);
                }
            }

            // 충돌 검사
            const gridX = Math.floor(newX);
            const gridY = Math.floor(newY);

            if (maze[gridY] && maze[gridY][gridX] !== 1) {
                game.player.x = newX;
                game.player.y = newY;

                // 출구 도달 검사
                if (maze[gridY][gridX] === 2) {
                    game.gameRunning = false;
                    alert(`축하합니다! 미로를 탈출했습니다! 남은 시간: ${game.timeLeft}초`);
                    resetGame();
                }
            }
        }

        function startGame() {
            game.gameRunning = true;
            game.timeLeft = 60;

            // 타이머 시작
            const timer = setInterval(() => {
                game.timeLeft--;
                document.getElementById('timeLeft').textContent = game.timeLeft;

                if (game.timeLeft <= 0) {
                    clearInterval(timer);
                    game.gameRunning = false;
                    alert('시간 초과! 게임 오버!');
                    resetGame();
                }
            }, 1000);

            gameLoop();
        }

        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 미로 그리기
            for (let y = 0; y < maze.length; y++) {
                for (let x = 0; x < maze[y].length; x++) {
                    const cellX = x * cellSize;
                    const cellY = y * cellSize;

                    if (maze[y][x] === 1) {
                        // 벽
                        ctx.fillStyle = '#34495e';
                        ctx.fillRect(cellX, cellY, cellSize, cellSize);
                        ctx.strokeStyle = '#2c3e50';
                        ctx.strokeRect(cellX, cellY, cellSize, cellSize);
                    } else if (maze[y][x] === 2) {
                        // 출구
                        ctx.fillStyle = '#e74c3c';
                        ctx.fillRect(cellX, cellY, cellSize, cellSize);
                        ctx.fillStyle = '#fff';
                        ctx.font = '20px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('EXIT', cellX + cellSize/2, cellY + cellSize/2 + 7);
                    } else {
                        // 길
                        ctx.fillStyle = '#95a5a6';
                        ctx.fillRect(cellX, cellY, cellSize, cellSize);
                    }
                }
            }

            // 플레이어 그리기
            const playerPixelX = game.player.x * cellSize + cellSize / 2;
            const playerPixelY = game.player.y * cellSize + cellSize / 2;

            ctx.beginPath();
            ctx.arc(playerPixelX, playerPixelY, game.player.size / 2, 0, Math.PI * 2);
            ctx.fillStyle = game.player.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        function resetGame() {
            game.player.x = 1;
            game.player.y = 1;
            game.timeLeft = 60;
            game.gameRunning = false;
        }

        function gameLoop() {
            if (game.gameRunning) {
                render();
                requestAnimationFrame(gameLoop);
            }
        }

        // QR 코드 라이브러리 로드
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
        document.head.appendChild(script);
    </script>
</body>
</html>
```

### 예제 3: 균형 잡기 게임
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>균형 잡기 게임</title>
    <script src="/js/SessionSDK.js"></script>
    <style>
        #gameCanvas {
            border: 2px solid #333;
            background: linear-gradient(180deg, #87CEEB 0%, #98FB98 100%);
        }
        .balance-meter {
            width: 300px;
            height: 20px;
            background: #ddd;
            border-radius: 10px;
            margin: 10px auto;
            position: relative;
            overflow: hidden;
        }
        .balance-indicator {
            height: 100%;
            background: linear-gradient(90deg, #ff4757, #ffa502, #2ed573);
            border-radius: 10px;
            transition: width 0.1s ease;
        }
        .game-stats {
            display: flex;
            justify-content: space-around;
            margin: 10px 0;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div id="sessionInfo"></div>
    <div class="game-stats">
        <span>점수: <span id="score">0</span></span>
        <span>시간: <span id="timer">30</span>초</span>
        <span>연속: <span id="streak">0</span></span>
    </div>
    <div class="balance-meter">
        <div class="balance-indicator" id="balanceIndicator"></div>
    </div>
    <canvas id="gameCanvas" width="400" height="300"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const game = {
            platform: {
                x: canvas.width / 2,
                y: canvas.height - 50,
                width: 200,
                height: 20,
                angle: 0,
                maxAngle: Math.PI / 6, // 30도
                color: '#8b4513'
            },
            ball: {
                x: canvas.width / 2,
                y: canvas.height - 100,
                radius: 15,
                vx: 0,
                vy: 0,
                color: '#ff6b6b',
                friction: 0.98,
                gravity: 0.2
            },
            score: 0,
            timer: 30,
            streak: 0,
            balanceLevel: 50, // 0-100
            targetBalance: 50,
            gameRunning: false,
            sensitivity: 2
        };

        // SessionSDK 초기화
        const sdk = new SessionSDK({
            gameId: 'balance-game',
            gameType: 'solo'
        });

        sdk.on('connected', () => {
            createSession();
        });

        sdk.on('session-created', (event) => {
            const session = event.detail || event;
            displaySessionInfo(session);
        });

        sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            processSensorData(data);
        });

        function createSession() {
            sdk.createSession();
        }

        function displaySessionInfo(session) {
            document.getElementById('sessionInfo').innerHTML = `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                    <h3>⚖️ 균형 잡기 게임</h3>
                    <p><strong>세션 코드:</strong> ${session.sessionCode}</p>
                    <p><strong>목표:</strong> 플랫폼을 기울여 공을 균형 잡으세요!</p>
                    <div id="qrcode"></div>
                </div>
            `;

            generateQRCode(session.qrCodeUrl);
            startGame();
        }

        function generateQRCode(url) {
            try {
                if (typeof QRCode !== 'undefined') {
                    new QRCode(document.getElementById("qrcode"), {
                        text: url,
                        width: 128,
                        height: 128
                    });
                } else {
                    document.getElementById("qrcode").innerHTML =
                        `<img src="https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(url)}" alt="QR Code">`;
                }
            } catch (error) {
                document.getElementById("qrcode").innerHTML =
                    `<img src="https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(url)}" alt="QR Code">`;
            }
        }

        function processSensorData(data) {
            if (!game.gameRunning || !data.orientation) return;

            const { gamma } = data.orientation; // 좌우 기울기

            // 플랫폼 각도 조정
            game.platform.angle = (gamma / 90) * game.platform.maxAngle;
            game.platform.angle = Math.max(-game.platform.maxAngle,
                                         Math.min(game.platform.maxAngle, game.platform.angle));

            // 균형 레벨 계산
            const balanceFromCenter = Math.abs(gamma);
            game.balanceLevel = Math.max(0, Math.min(100, 50 + (gamma / 90) * 50));

            // 균형 표시기 업데이트
            const indicator = document.getElementById('balanceIndicator');
            indicator.style.width = game.balanceLevel + '%';
        }

        function startGame() {
            game.gameRunning = true;
            game.timer = 30;

            // 목표 균형점 설정
            setNewTarget();

            // 타이머 시작
            const timerInterval = setInterval(() => {
                game.timer--;
                document.getElementById('timer').textContent = game.timer;

                if (game.timer <= 0) {
                    clearInterval(timerInterval);
                    endGame();
                }
            }, 1000);

            gameLoop();
        }

        function setNewTarget() {
            game.targetBalance = 30 + Math.random() * 40; // 30-70 범위
        }

        function update() {
            if (!game.gameRunning) return;

            // 중력과 플랫폼 기울기로 인한 공 물리학
            const platformSlope = Math.sin(game.platform.angle);
            game.ball.vx += platformSlope * 0.3;
            game.ball.vy += game.gravity;

            // 마찰 적용
            game.ball.vx *= game.ball.friction;
            game.ball.vy *= game.ball.friction;

            // 공 위치 업데이트
            game.ball.x += game.ball.vx;
            game.ball.y += game.ball.vy;

            // 플랫폼과의 충돌 검사
            const platformLeft = game.platform.x - game.platform.width / 2;
            const platformRight = game.platform.x + game.platform.width / 2;

            if (game.ball.y + game.ball.radius >= game.platform.y &&
                game.ball.x >= platformLeft &&
                game.ball.x <= platformRight) {

                game.ball.y = game.platform.y - game.ball.radius;
                game.ball.vy = -Math.abs(game.ball.vy) * 0.7;
            }

            // 벽 충돌
            if (game.ball.x <= game.ball.radius || game.ball.x >= canvas.width - game.ball.radius) {
                game.ball.vx *= -0.8;
                game.ball.x = Math.max(game.ball.radius, Math.min(canvas.width - game.ball.radius, game.ball.x));
            }

            // 바닥에 떨어지면 리셋
            if (game.ball.y > canvas.height + 50) {
                resetBall();
                game.streak = 0;
                document.getElementById('streak').textContent = game.streak;
            }

            // 균형 점수 계산
            const balanceError = Math.abs(game.balanceLevel - game.targetBalance);
            if (balanceError < 5) { // 5% 오차 내에서 균형
                game.score += 10;
                game.streak++;

                if (game.streak > 0 && game.streak % 10 === 0) {
                    game.score += 100; // 보너스 점수
                    setNewTarget(); // 새로운 목표 설정
                }

                document.getElementById('score').textContent = game.score;
                document.getElementById('streak').textContent = game.streak;
            } else if (balanceError > 20) {
                game.streak = Math.max(0, game.streak - 1);
                document.getElementById('streak').textContent = game.streak;
            }
        }

        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 목표 균형선 그리기
            const targetX = (game.targetBalance / 100) * canvas.width;
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(targetX, 0);
            ctx.lineTo(targetX, canvas.height);
            ctx.stroke();
            ctx.setLineDash([]);

            // 플랫폼 그리기
            ctx.save();
            ctx.translate(game.platform.x, game.platform.y);
            ctx.rotate(game.platform.angle);

            ctx.fillStyle = game.platform.color;
            ctx.fillRect(-game.platform.width / 2, -game.platform.height / 2,
                        game.platform.width, game.platform.height);

            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 2;
            ctx.strokeRect(-game.platform.width / 2, -game.platform.height / 2,
                          game.platform.width, game.platform.height);

            ctx.restore();

            // 공 그리기
            ctx.beginPath();
            ctx.arc(game.ball.x, game.ball.y, game.ball.radius, 0, Math.PI * 2);
            ctx.fillStyle = game.ball.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 그림자 효과
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(game.ball.x + 5, game.ball.y + 5, game.ball.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.restore();
        }

        function resetBall() {
            game.ball.x = canvas.width / 2;
            game.ball.y = canvas.height - 100;
            game.ball.vx = 0;
            game.ball.vy = 0;
        }

        function endGame() {
            game.gameRunning = false;
            alert(`게임 종료! 최종 점수: ${game.score}, 최대 연속: ${game.streak}`);
            resetGame();
        }

        function resetGame() {
            game.score = 0;
            game.streak = 0;
            game.timer = 30;
            game.balanceLevel = 50;
            resetBall();

            document.getElementById('score').textContent = game.score;
            document.getElementById('streak').textContent = game.streak;
            document.getElementById('timer').textContent = game.timer;
        }

        function gameLoop() {
            if (game.gameRunning) {
                update();
                render();
                requestAnimationFrame(gameLoop);
            }
        }

        // QR 코드 라이브러리 로드
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
        document.head.appendChild(script);
    </script>
</body>
</html>
```

### 예제 4: 색깔 수집 게임
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>색깔 수집 게임</title>
    <script src="/js/SessionSDK.js"></script>
    <style>
        #gameCanvas {
            border: 2px solid #333;
            background: radial-gradient(circle, #1a1a2e, #16213e);
        }
        .color-targets {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 10px 0;
        }
        .color-target {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 3px solid #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #fff;
            text-shadow: 1px 1px 1px #000;
        }
        .game-info {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div id="sessionInfo"></div>
    <div class="game-info">
        <span>점수: <span id="score">0</span></span>
        <span>레벨: <span id="level">1</span></span>
        <span>시간: <span id="timeLeft">45</span>초</span>
    </div>
    <div class="color-targets" id="colorTargets"></div>
    <canvas id="gameCanvas" width="700" height="500"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // 색상 정의
        const colors = [
            { name: 'RED', hex: '#ff4757', collected: false },
            { name: 'BLUE', hex: '#3742fa', collected: false },
            { name: 'GREEN', hex: '#2ed573', collected: false },
            { name: 'YELLOW', hex: '#ffa502', collected: false },
            { name: 'PURPLE', hex: '#a55eea', collected: false },
            { name: 'ORANGE', hex: '#ff6348', collected: false }
        ];

        const game = {
            player: {
                x: canvas.width / 2,
                y: canvas.height / 2,
                radius: 25,
                speed: 3,
                color: '#ecf0f1',
                trail: []
            },
            orbs: [],
            obstacles: [],
            score: 0,
            level: 1,
            timeLeft: 45,
            currentTargets: [],
            targetsCollected: 0,
            gameRunning: false,
            powerUps: []
        };

        // SessionSDK 초기화
        const sdk = new SessionSDK({
            gameId: 'color-collector',
            gameType: 'solo'
        });

        sdk.on('connected', () => {
            createSession();
        });

        sdk.on('session-created', (event) => {
            const session = event.detail || event;
            displaySessionInfo(session);
        });

        sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            processSensorData(data);
        });

        function createSession() {
            sdk.createSession();
        }

        function displaySessionInfo(session) {
            document.getElementById('sessionInfo').innerHTML = `
                <div style="background: #2f3542; color: #fff; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                    <h3>🌈 색깔 수집 게임</h3>
                    <p><strong>세션 코드:</strong> ${session.sessionCode}</p>
                    <p><strong>목표:</strong> 지정된 색깔 구슬을 모두 수집하세요!</p>
                    <div id="qrcode"></div>
                </div>
            `;

            generateQRCode(session.qrCodeUrl);
            initLevel();
            startGame();
        }

        function generateQRCode(url) {
            try {
                if (typeof QRCode !== 'undefined') {
                    new QRCode(document.getElementById("qrcode"), {
                        text: url,
                        width: 128,
                        height: 128
                    });
                } else {
                    document.getElementById("qrcode").innerHTML =
                        `<img src="https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(url)}" alt="QR Code">`;
                }
            } catch (error) {
                document.getElementById("qrcode").innerHTML =
                    `<img src="https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(url)}" alt="QR Code">`;
            }
        }

        function processSensorData(data) {
            if (!game.gameRunning || !data.orientation) return;

            const { beta, gamma } = data.orientation;

            // 플레이어 이동 (부드러운 이동)
            const sensitivity = 0.15;
            const maxSpeed = game.player.speed;

            const targetVx = (gamma / 90) * maxSpeed;
            const targetVy = (beta / 90) * maxSpeed;

            // 현재 속도에서 목표 속도로 부드럽게 변화
            game.player.vx = (game.player.vx || 0) * 0.8 + targetVx * 0.2;
            game.player.vy = (game.player.vy || 0) * 0.8 + targetVy * 0.2;

            // 위치 업데이트
            game.player.x += game.player.vx * sensitivity * 10;
            game.player.y += game.player.vy * sensitivity * 10;

            // 화면 경계 제한
            game.player.x = Math.max(game.player.radius,
                                   Math.min(canvas.width - game.player.radius, game.player.x));
            game.player.y = Math.max(game.player.radius,
                                   Math.min(canvas.height - game.player.radius, game.player.y));

            // 플레이어 트레일 추가
            game.player.trail.push({
                x: game.player.x,
                y: game.player.y,
                life: 20
            });

            if (game.player.trail.length > 15) {
                game.player.trail.shift();
            }
        }

        function initLevel() {
            // 현재 레벨에 맞는 목표 색상 선택
            const numTargets = Math.min(3 + Math.floor(game.level / 2), 6);
            game.currentTargets = colors.slice(0, numTargets).map(color => ({
                ...color,
                collected: false
            }));

            // 구슬 생성
            game.orbs = [];
            for (let i = 0; i < 20 + game.level * 5; i++) {
                createOrb();
            }

            // 장애물 생성
            game.obstacles = [];
            for (let i = 0; i < Math.floor(game.level / 2); i++) {
                createObstacle();
            }

            updateColorTargetsDisplay();
            game.targetsCollected = 0;
        }

        function createOrb() {
            const colorIndex = Math.floor(Math.random() * game.currentTargets.length);
            const color = game.currentTargets[colorIndex];

            game.orbs.push({
                x: Math.random() * (canvas.width - 40) + 20,
                y: Math.random() * (canvas.height - 40) + 20,
                radius: 8 + Math.random() * 5,
                color: color.hex,
                colorName: color.name,
                pulsePhase: Math.random() * Math.PI * 2,
                collected: false
            });
        }

        function createObstacle() {
            game.obstacles.push({
                x: Math.random() * (canvas.width - 60) + 30,
                y: Math.random() * (canvas.height - 60) + 30,
                width: 40 + Math.random() * 20,
                height: 40 + Math.random() * 20,
                color: '#5f27cd'
            });
        }

        function updateColorTargetsDisplay() {
            const container = document.getElementById('colorTargets');
            container.innerHTML = '';

            game.currentTargets.forEach(target => {
                const div = document.createElement('div');
                div.className = 'color-target';
                div.style.backgroundColor = target.hex;
                div.style.opacity = target.collected ? '0.3' : '1';
                div.textContent = target.collected ? '✓' : '';
                container.appendChild(div);
            });
        }

        function startGame() {
            game.gameRunning = true;
            game.timeLeft = 45;

            // 타이머 시작
            const timer = setInterval(() => {
                game.timeLeft--;
                document.getElementById('timeLeft').textContent = game.timeLeft;

                if (game.timeLeft <= 0) {
                    clearInterval(timer);
                    endGame();
                }
            }, 1000);

            gameLoop();
        }

        function update() {
            if (!game.gameRunning) return;

            // 구슬 펄스 애니메이션
            game.orbs.forEach(orb => {
                orb.pulsePhase += 0.1;
            });

            // 트레일 업데이트
            game.player.trail.forEach(trail => {
                trail.life--;
            });
            game.player.trail = game.player.trail.filter(trail => trail.life > 0);

            // 구슬 충돌 검사
            game.orbs.forEach((orb, index) => {
                if (orb.collected) return;

                const dx = game.player.x - orb.x;
                const dy = game.player.y - orb.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < game.player.radius + orb.radius) {
                    // 목표 색상인지 확인
                    const targetColor = game.currentTargets.find(t => t.name === orb.colorName && !t.collected);

                    if (targetColor) {
                        targetColor.collected = true;
                        game.targetsCollected++;
                        game.score += 50 * game.level;

                        // 파티클 효과
                        createParticles(orb.x, orb.y, orb.color);

                        updateColorTargetsDisplay();
                        document.getElementById('score').textContent = game.score;

                        // 모든 목표 색상 수집 확인
                        if (game.targetsCollected === game.currentTargets.length) {
                            nextLevel();
                        }
                    } else {
                        // 잘못된 색상 수집 시 점수 감소
                        game.score = Math.max(0, game.score - 10);
                        document.getElementById('score').textContent = game.score;
                    }

                    orb.collected = true;
                }
            });

            // 장애물 충돌 검사
            game.obstacles.forEach(obstacle => {
                if (game.player.x + game.player.radius > obstacle.x &&
                    game.player.x - game.player.radius < obstacle.x + obstacle.width &&
                    game.player.y + game.player.radius > obstacle.y &&
                    game.player.y - game.player.radius < obstacle.y + obstacle.height) {

                    // 플레이어를 장애물에서 밀어냄
                    const centerX = obstacle.x + obstacle.width / 2;
                    const centerY = obstacle.y + obstacle.height / 2;
                    const angle = Math.atan2(game.player.y - centerY, game.player.x - centerX);

                    game.player.x = centerX + Math.cos(angle) * (obstacle.width / 2 + game.player.radius + 5);
                    game.player.y = centerY + Math.sin(angle) * (obstacle.height / 2 + game.player.radius + 5);
                }
            });
        }

        function createParticles(x, y, color) {
            // 간단한 파티클 효과 (실제 구현에서는 더 정교할 수 있음)
            for (let i = 0; i < 10; i++) {
                const angle = (Math.PI * 2 * i) / 10;
                const speed = 2 + Math.random() * 3;

                // 파티클 애니메이션은 별도 시스템으로 구현 가능
            }
        }

        function nextLevel() {
            game.level++;
            game.timeLeft += 15; // 시간 보너스
            document.getElementById('level').textContent = game.level;
            document.getElementById('timeLeft').textContent = game.timeLeft;

            initLevel();
        }

        function render() {
            // 배경 지우기
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 별 배경
            ctx.fillStyle = '#fff';
            for (let i = 0; i < 50; i++) {
                const x = (i * 123) % canvas.width;
                const y = (i * 321) % canvas.height;
                ctx.fillRect(x, y, 1, 1);
            }

            // 장애물 그리기
            game.obstacles.forEach(obstacle => {
                ctx.fillStyle = obstacle.color;
                ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);

                ctx.strokeStyle = '#8e44ad';
                ctx.lineWidth = 2;
                ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            });

            // 구슬 그리기
            game.orbs.forEach(orb => {
                if (orb.collected) return;

                const pulseSize = orb.radius + Math.sin(orb.pulsePhase) * 2;

                ctx.beginPath();
                ctx.arc(orb.x, orb.y, pulseSize, 0, Math.PI * 2);
                ctx.fillStyle = orb.color;
                ctx.fill();

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // 내부 하이라이트
                ctx.beginPath();
                ctx.arc(orb.x - 2, orb.y - 2, pulseSize * 0.3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.fill();
            });

            // 플레이어 트레일 그리기
            game.player.trail.forEach((trail, index) => {
                const alpha = trail.life / 20;
                ctx.globalAlpha = alpha * 0.5;
                ctx.beginPath();
                ctx.arc(trail.x, trail.y, game.player.radius * alpha, 0, Math.PI * 2);
                ctx.fillStyle = game.player.color;
                ctx.fill();
            });

            ctx.globalAlpha = 1;

            // 플레이어 그리기
            ctx.beginPath();
            ctx.arc(game.player.x, game.player.y, game.player.radius, 0, Math.PI * 2);
            ctx.fillStyle = game.player.color;
            ctx.fill();

            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 3;
            ctx.stroke();

            // 플레이어 내부 디테일
            ctx.beginPath();
            ctx.arc(game.player.x, game.player.y, game.player.radius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = '#74b9ff';
            ctx.fill();
        }

        function endGame() {
            game.gameRunning = false;
            alert(`게임 종료! 최종 점수: ${game.score}, 도달 레벨: ${game.level}`);
            resetGame();
        }

        function resetGame() {
            game.score = 0;
            game.level = 1;
            game.timeLeft = 45;
            game.player.x = canvas.width / 2;
            game.player.y = canvas.height / 2;
            game.player.trail = [];

            document.getElementById('score').textContent = game.score;
            document.getElementById('level').textContent = game.level;
            document.getElementById('timeLeft').textContent = game.timeLeft;

            initLevel();
        }

        function gameLoop() {
            if (game.gameRunning) {
                update();
                render();
                requestAnimationFrame(gameLoop);
            }
        }

        // QR 코드 라이브러리 로드
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
        document.head.appendChild(script);
    </script>
</body>
</html>
```

### 예제 5: 장애물 피하기 게임
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>장애물 피하기 게임</title>
    <script src="/js/SessionSDK.js"></script>
    <style>
        #gameCanvas {
            border: 2px solid #333;
            background: linear-gradient(180deg, #0f3460, #16537e);
        }
        .speed-meter {
            width: 200px;
            height: 15px;
            background: #ddd;
            border-radius: 8px;
            margin: 10px auto;
            position: relative;
            overflow: hidden;
        }
        .speed-bar {
            height: 100%;
            background: linear-gradient(90deg, #2ed573, #ffa502, #ff4757);
            border-radius: 8px;
            transition: width 0.2s ease;
        }
    </style>
</head>
<body>
    <div id="sessionInfo"></div>
    <div style="text-align: center;">
        <div style="display: flex; justify-content: space-around; margin: 10px 0; font-weight: bold;">
            <span>점수: <span id="score">0</span></span>
            <span>거리: <span id="distance">0</span>m</span>
            <span>속도: <span id="speed">0</span></span>
        </div>
        <div class="speed-meter">
            <div class="speed-bar" id="speedBar" style="width: 0%"></div>
        </div>
    </div>
    <canvas id="gameCanvas" width="600" height="400"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const game = {
            player: {
                x: 50,
                y: canvas.height / 2,
                width: 30,
                height: 20,
                color: '#00d2d3',
                speed: 0,
                maxSpeed: 8
            },
            obstacles: [],
            particles: [],
            speed: 2,
            maxSpeed: 10,
            distance: 0,
            score: 0,
            gameRunning: false,
            obstacleSpawnRate: 0.02,
            lastObstacleY: 0,
            powerUps: [],
            invulnerable: false,
            invulnerableTime: 0
        };

        // SessionSDK 초기화
        const sdk = new SessionSDK({
            gameId: 'obstacle-dodge',
            gameType: 'solo'
        });

        sdk.on('connected', () => {
            createSession();
        });

        sdk.on('session-created', (event) => {
            const session = event.detail || event;
            displaySessionInfo(session);
        });

        sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            processSensorData(data);
        });

        function createSession() {
            sdk.createSession();
        }

        function displaySessionInfo(session) {
            document.getElementById('sessionInfo').innerHTML = `
                <div style="background: #2c3e50; color: #fff; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                    <h3>🚀 장애물 피하기 게임</h3>
                    <p><strong>세션 코드:</strong> ${session.sessionCode}</p>
                    <p><strong>목표:</strong> 스마트폰을 기울여 장애물을 피하세요!</p>
                    <div id="qrcode"></div>
                </div>
            `;

            generateQRCode(session.qrCodeUrl);
            startGame();
        }

        function generateQRCode(url) {
            try {
                if (typeof QRCode !== 'undefined') {
                    new QRCode(document.getElementById("qrcode"), {
                        text: url,
                        width: 128,
                        height: 128
                    });
                } else {
                    document.getElementById("qrcode").innerHTML =
                        `<img src="https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(url)}" alt="QR Code">`;
                }
            } catch (error) {
                document.getElementById("qrcode").innerHTML =
                    `<img src="https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(url)}" alt="QR Code">`;
            }
        }

        function processSensorData(data) {
            if (!game.gameRunning || !data.orientation) return;

            const { beta } = data.orientation; // 앞뒤 기울기

            // 상하 이동 제어
            const sensitivity = 0.3;
            const targetY = game.player.y - (beta * sensitivity);

            // 부드러운 이동
            game.player.y += (targetY - game.player.y) * 0.1;

            // 화면 경계 제한
            game.player.y = Math.max(game.player.height / 2,
                                   Math.min(canvas.height - game.player.height / 2, game.player.y));
        }

        function startGame() {
            game.gameRunning = true;
            resetGame();
            gameLoop();
        }

        function spawnObstacle() {
            if (Math.random() < game.obstacleSpawnRate) {
                const minGap = 80;
                let y;

                // 최소 간격 보장
                do {
                    y = Math.random() * (canvas.height - 60) + 30;
                } while (Math.abs(y - game.lastObstacleY) < minGap);

                game.lastObstacleY = y;

                const obstacleTypes = [
                    { width: 20, height: 40, color: '#e74c3c', points: 10 },
                    { width: 30, height: 30, color: '#f39c12', points: 15 },
                    { width: 15, height: 60, color: '#9b59b6', points: 20 }
                ];

                const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

                game.obstacles.push({
                    x: canvas.width,
                    y: y,
                    width: type.width,
                    height: type.height,
                    color: type.color,
                    points: type.points,
                    rotation: 0,
                    rotationSpeed: (Math.random() - 0.5) * 0.2
                });
            }
        }

        function spawnPowerUp() {
            if (Math.random() < 0.005) { // 낮은 확률로 파워업 생성
                const powerUpTypes = [
                    { type: 'invulnerable', color: '#f1c40f', duration: 180 },
                    { type: 'slow', color: '#3498db', duration: 300 },
                    { type: 'score', color: '#2ecc71', points: 100 }
                ];

                const powerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

                game.powerUps.push({
                    x: canvas.width,
                    y: Math.random() * (canvas.height - 40) + 20,
                    width: 25,
                    height: 25,
                    ...powerUp,
                    pulse: 0
                });
            }
        }

        function update() {
            if (!game.gameRunning) return;

            // 속도 점진적 증가
            game.speed = Math.min(game.maxSpeed, game.speed + 0.005);
            game.distance += game.speed;

            // 무적 시간 감소
            if (game.invulnerable) {
                game.invulnerableTime--;
                if (game.invulnerableTime <= 0) {
                    game.invulnerable = false;
                }
            }

            // 장애물과 파워업 생성
            spawnObstacle();
            spawnPowerUp();

            // 장애물 이동 및 충돌 검사
            game.obstacles.forEach((obstacle, index) => {
                obstacle.x -= game.speed;
                obstacle.rotation += obstacle.rotationSpeed;

                // 화면을 벗어난 장애물 제거 및 점수 추가
                if (obstacle.x + obstacle.width < 0) {
                    game.obstacles.splice(index, 1);
                    game.score += obstacle.points;
                }

                // 충돌 검사
                if (!game.invulnerable &&
                    game.player.x < obstacle.x + obstacle.width &&
                    game.player.x + game.player.width > obstacle.x &&
                    game.player.y < obstacle.y + obstacle.height &&
                    game.player.y + game.player.height > obstacle.y) {

                    // 충돌 파티클 생성
                    createExplosion(game.player.x, game.player.y);

                    // 게임 오버
                    endGame();
                }
            });

            // 파워업 이동 및 충돌 검사
            game.powerUps.forEach((powerUp, index) => {
                powerUp.x -= game.speed;
                powerUp.pulse += 0.2;

                // 화면을 벗어난 파워업 제거
                if (powerUp.x + powerUp.width < 0) {
                    game.powerUps.splice(index, 1);
                }

                // 충돌 검사
                if (game.player.x < powerUp.x + powerUp.width &&
                    game.player.x + game.player.width > powerUp.x &&
                    game.player.y < powerUp.y + powerUp.height &&
                    game.player.y + game.player.height > powerUp.y) {

                    // 파워업 효과 적용
                    applyPowerUp(powerUp);
                    game.powerUps.splice(index, 1);
                }
            });

            // 파티클 업데이트
            game.particles.forEach((particle, index) => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life--;
                particle.size *= 0.98;

                if (particle.life <= 0 || particle.size < 1) {
                    game.particles.splice(index, 1);
                }
            });

            // UI 업데이트
            document.getElementById('score').textContent = Math.floor(game.score);
            document.getElementById('distance').textContent = Math.floor(game.distance / 10);
            document.getElementById('speed').textContent = game.speed.toFixed(1);

            // 속도 바 업데이트
            const speedPercentage = (game.speed / game.maxSpeed) * 100;
            document.getElementById('speedBar').style.width = speedPercentage + '%';
        }

        function applyPowerUp(powerUp) {
            switch (powerUp.type) {
                case 'invulnerable':
                    game.invulnerable = true;
                    game.invulnerableTime = powerUp.duration;
                    break;
                case 'slow':
                    game.speed = Math.max(1, game.speed - 2);
                    break;
                case 'score':
                    game.score += powerUp.points;
                    break;
            }

            // 파워업 수집 파티클
            createPowerUpEffect(powerUp.x, powerUp.y, powerUp.color);
        }

        function createExplosion(x, y) {
            for (let i = 0; i < 20; i++) {
                const angle = (Math.PI * 2 * i) / 20;
                const speed = 3 + Math.random() * 5;

                game.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 8 + Math.random() * 6,
                    color: '#ff4757',
                    life: 30 + Math.random() * 20
                });
            }
        }

        function createPowerUpEffect(x, y, color) {
            for (let i = 0; i < 10; i++) {
                const angle = (Math.PI * 2 * i) / 10;
                const speed = 2 + Math.random() * 3;

                game.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 4 + Math.random() * 4,
                    color: color,
                    life: 20 + Math.random() * 15
                });
            }
        }

        function render() {
            // 배경 그라디언트
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#0f3460');
            gradient.addColorStop(1, '#16537e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 배경 별들 (이동 효과)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            for (let i = 0; i < 30; i++) {
                const x = ((i * 123 - game.distance * 2) % (canvas.width + 50)) - 50;
                const y = (i * 321) % canvas.height;
                const size = 1 + (i % 3);
                ctx.fillRect(x, y, size, size);
            }

            // 플레이어 그리기
            ctx.save();

            // 무적 상태 시 깜빡임 효과
            if (game.invulnerable && Math.floor(Date.now() / 100) % 2) {
                ctx.globalAlpha = 0.5;
            }

            ctx.translate(game.player.x + game.player.width / 2, game.player.y + game.player.height / 2);

            // 플레이어 본체
            ctx.fillStyle = game.player.color;
            ctx.fillRect(-game.player.width / 2, -game.player.height / 2, game.player.width, game.player.height);

            // 플레이어 디테일
            ctx.fillStyle = '#fff';
            ctx.fillRect(game.player.width / 4, -game.player.height / 4, game.player.width / 4, game.player.height / 2);

            ctx.restore();

            // 장애물 그리기
            game.obstacles.forEach(obstacle => {
                ctx.save();
                ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
                ctx.rotate(obstacle.rotation);

                ctx.fillStyle = obstacle.color;
                ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.strokeRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);

                ctx.restore();
            });

            // 파워업 그리기
            game.powerUps.forEach(powerUp => {
                const pulseSize = 1 + Math.sin(powerUp.pulse) * 0.2;

                ctx.save();
                ctx.translate(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
                ctx.scale(pulseSize, pulseSize);

                ctx.fillStyle = powerUp.color;
                ctx.fillRect(-powerUp.width / 2, -powerUp.height / 2, powerUp.width, powerUp.height);

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.strokeRect(-powerUp.width / 2, -powerUp.height / 2, powerUp.width, powerUp.height);

                // 파워업 아이콘
                ctx.fillStyle = '#fff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(powerUp.type === 'invulnerable' ? '⚡' :
                           powerUp.type === 'slow' ? '🐌' : '💎', 0, 4);

                ctx.restore();
            });

            // 파티클 그리기
            game.particles.forEach(particle => {
                ctx.globalAlpha = particle.life / 30;
                ctx.fillStyle = particle.color;
                ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2,
                           particle.size, particle.size);
            });

            ctx.globalAlpha = 1;
        }

        function endGame() {
            game.gameRunning = false;
            const finalScore = Math.floor(game.score + game.distance / 10);
            alert(`게임 오버! 최종 점수: ${finalScore}, 거리: ${Math.floor(game.distance / 10)}m`);
            resetGame();
        }

        function resetGame() {
            game.player.y = canvas.height / 2;
            game.speed = 2;
            game.distance = 0;
            game.score = 0;
            game.obstacles = [];
            game.powerUps = [];
            game.particles = [];
            game.invulnerable = false;
            game.invulnerableTime = 0;
            game.lastObstacleY = 0;

            document.getElementById('score').textContent = '0';
            document.getElementById('distance').textContent = '0';
            document.getElementById('speed').textContent = '2.0';
            document.getElementById('speedBar').style.width = '20%';
        }

        function gameLoop() {
            if (game.gameRunning) {
                update();
                render();
                requestAnimationFrame(gameLoop);
            }
        }

        // QR 코드 라이브러리 로드
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
        document.head.appendChild(script);
    </script>
</body>
</html>
```

## 마무리

이상으로 기본 게임 예제 5개를 작성했습니다. 각 예제는 다음과 같은 특징을 갖습니다:

1. **공 튕기기 게임**: 중력과 물리 시뮬레이션
2. **미로 탈출 게임**: 그리드 기반 이동과 충돌 감지
3. **균형 잡기 게임**: 물리 기반 균형 시스템
4. **색깔 수집 게임**: 목표 기반 수집 메커니즘
5. **장애물 피하기 게임**: 무한 러너 스타일 게임플레이

모든 예제는 Phase 2.2 AI 시스템과 통합될 수 있도록 설계되었으며, SessionSDK를 통한 센서 데이터 처리를 포함합니다.

다음 단계에서 듀얼 센서 게임 예제 10개를 계속 작성하겠습니다.