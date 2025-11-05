# 🎮 듀얼 센서 게임 예제 (10개)

## 📋 목차
듀얼 센서 게임은 두 개의 스마트폰이나 센서를 사용하여 협력하거나 경쟁하는 게임입니다.

1. [협력 퍼즐 게임](#예제-1-협력-퍼즐-게임)
2. [균형 다리 건설](#예제-2-균형-다리-건설)
3. [협력 요리 게임](#예제-3-협력-요리-게임)
4. [듀얼 레이싱](#예제-4-듀얼-레이싱)
5. [협력 미로 탈출](#예제-5-협력-미로-탈출)
6. [싱크로 댄스](#예제-6-싱크로-댄스)
7. [협력 탱크 게임](#예제-7-협력-탱크-게임)
8. [듀얼 패들 게임](#예제-8-듀얼-패들-게임)
9. [협력 보물 찾기](#예제-9-협력-보물-찾기)
10. [듀얼 플라잉 게임](#예제-10-듀얼-플라잉-게임)

---

## 예제 1: 협력 퍼즐 게임
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>협력 퍼즐 게임</title>
    <script src="/js/SessionSDK.js"></script>
    <style>
        #gameCanvas {
            border: 2px solid #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .players-status {
            display: flex;
            justify-content: space-around;
            margin: 10px 0;
            font-weight: bold;
        }
        .player-info {
            padding: 10px;
            border-radius: 8px;
            min-width: 150px;
            text-align: center;
        }
        .player1 { background: #e3f2fd; }
        .player2 { background: #fce4ec; }
    </style>
</head>
<body>
    <div id="sessionInfo"></div>
    <div class="players-status">
        <div class="player-info player1">
            <div>플레이어 1 (파란색)</div>
            <div>상태: <span id="player1Status">대기중</span></div>
        </div>
        <div class="player-info player2">
            <div>플레이어 2 (빨간색)</div>
            <div>상태: <span id="player2Status">대기중</span></div>
        </div>
    </div>
    <div style="text-align: center; margin: 10px 0;">
        <span style="font-weight: bold;">목표: 두 블록을 동시에 목표점에 맞춰주세요!</span>
        <br>
        <span>진행도: <span id="progress">0</span>/100</span>
    </div>
    <canvas id="gameCanvas" width="800" height="500"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const game = {
            players: {
                player1: {
                    x: 100,
                    y: canvas.height / 2,
                    targetX: 300,
                    targetY: 150,
                    width: 40,
                    height: 40,
                    color: '#2196f3',
                    connected: false,
                    atTarget: false
                },
                player2: {
                    x: 100,
                    y: canvas.height / 2 + 100,
                    targetX: 500,
                    targetY: 350,
                    width: 40,
                    height: 40,
                    color: '#f44336',
                    connected: false,
                    atTarget: false
                }
            },
            level: 1,
            progress: 0,
            gameRunning: false,
            sensitivity: 0.2,
            targetThreshold: 20,
            synchronized: false,
            syncTime: 0,
            requiredSyncTime: 180 // 3초
        };

        // SessionSDK 초기화
        const sdk = new SessionSDK({
            gameId: 'coop-puzzle',
            gameType: 'dual'
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
                <div style="background: #f5f5f5; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                    <h3>🧩 협력 퍼즐 게임</h3>
                    <p><strong>세션 코드:</strong> ${session.sessionCode}</p>
                    <p><strong>플레이어 수:</strong> ${session.connectedSensors} / 2</p>
                    <div id="qrcode"></div>
                    <p>두 명의 플레이어가 필요합니다. 각자 QR코드를 스캔하세요!</p>
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

            // 센서 ID에 따라 플레이어 구분
            const isPlayer1 = data.sensorId.includes('sensor1') || data.timestamp % 2 === 0;
            const player = isPlayer1 ? game.players.player1 : game.players.player2;

            // 연결 상태 업데이트
            player.connected = true;

            const { beta, gamma } = data.orientation;

            // 플레이어 이동 (부드러운 이동)
            const deltaX = gamma * game.sensitivity;
            const deltaY = beta * game.sensitivity;

            player.x += deltaX;
            player.y += deltaY;

            // 화면 경계 제한
            player.x = Math.max(player.width / 2,
                              Math.min(canvas.width - player.width / 2, player.x));
            player.y = Math.max(player.height / 2,
                              Math.min(canvas.height - player.height / 2, player.y));

            // 목표점 도달 확인
            const distanceToTarget = Math.sqrt(
                Math.pow(player.x - player.targetX, 2) +
                Math.pow(player.y - player.targetY, 2)
            );

            player.atTarget = distanceToTarget <= game.targetThreshold;

            // UI 업데이트
            const statusElement = isPlayer1 ? 'player1Status' : 'player2Status';
            document.getElementById(statusElement).textContent =
                player.atTarget ? '목표 도달!' : '이동 중';
        }

        function startGame() {
            game.gameRunning = true;
            gameLoop();
        }

        function update() {
            if (!game.gameRunning) return;

            // 동기화 확인
            const bothAtTarget = game.players.player1.atTarget && game.players.player2.atTarget;

            if (bothAtTarget) {
                if (!game.synchronized) {
                    game.synchronized = true;
                    game.syncTime = 0;
                }

                game.syncTime++;
                game.progress = Math.min(100, (game.syncTime / game.requiredSyncTime) * 100);

                // 목표 달성 확인
                if (game.syncTime >= game.requiredSyncTime) {
                    nextLevel();
                }
            } else {
                if (game.synchronized) {
                    game.synchronized = false;
                    game.syncTime = Math.max(0, game.syncTime - 3); // 벗어나면 점진적 감소
                }
                game.progress = Math.max(0, (game.syncTime / game.requiredSyncTime) * 100);
            }

            document.getElementById('progress').textContent = Math.floor(game.progress);
        }

        function nextLevel() {
            game.level++;
            game.syncTime = 0;
            game.synchronized = false;
            game.progress = 0;

            // 새로운 목표점 설정
            game.players.player1.targetX = 150 + Math.random() * (canvas.width - 300);
            game.players.player1.targetY = 50 + Math.random() * (canvas.height - 100);

            game.players.player2.targetX = 150 + Math.random() * (canvas.width - 300);
            game.players.player2.targetY = 50 + Math.random() * (canvas.height - 100);

            // 플레이어 위치 리셋
            game.players.player1.x = 100;
            game.players.player1.y = canvas.height / 2;
            game.players.player2.x = 100;
            game.players.player2.y = canvas.height / 2 + 100;

            alert(`레벨 ${game.level} 달성! 다음 단계로...`);
        }

        function render() {
            // 배경 지우기
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 배경 그리드
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            for (let x = 0; x < canvas.width; x += 50) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += 50) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            // 목표점 그리기
            Object.values(game.players).forEach(player => {
                // 목표점 외곽 원
                ctx.beginPath();
                ctx.arc(player.targetX, player.targetY, game.targetThreshold, 0, Math.PI * 2);
                ctx.strokeStyle = player.color;
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);

                // 목표점 중심
                ctx.beginPath();
                ctx.arc(player.targetX, player.targetY, 8, 0, Math.PI * 2);
                ctx.fillStyle = player.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            });

            // 플레이어 그리기
            Object.values(game.players).forEach(player => {
                if (!player.connected) return;

                // 플레이어 블록
                ctx.fillStyle = player.atTarget ? '#4caf50' : player.color;
                ctx.fillRect(
                    player.x - player.width / 2,
                    player.y - player.height / 2,
                    player.width,
                    player.height
                );

                // 플레이어 테두리
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.strokeRect(
                    player.x - player.width / 2,
                    player.y - player.height / 2,
                    player.width,
                    player.height
                );

                // 목표점까지의 선
                if (!player.atTarget) {
                    ctx.beginPath();
                    ctx.moveTo(player.x, player.y);
                    ctx.lineTo(player.targetX, player.targetY);
                    ctx.strokeStyle = player.color;
                    ctx.lineWidth = 2;
                    ctx.setLineDash([3, 3]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            });

            // 동기화 표시
            if (game.synchronized) {
                ctx.fillStyle = 'rgba(76, 175, 80, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#4caf50';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('동기화 중...', canvas.width / 2, 50);
            }

            // 진행률 바
            const barWidth = 200;
            const barHeight = 20;
            const barX = (canvas.width - barWidth) / 2;
            const barY = 20;

            // 진행률 바 배경
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // 진행률 바 전경
            ctx.fillStyle = game.synchronized ? '#4caf50' : '#ffc107';
            ctx.fillRect(barX, barY, (barWidth * game.progress) / 100, barHeight);

            // 진행률 텍스트
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.floor(game.progress)}%`, canvas.width / 2, barY + 15);
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

## 예제 2: 균형 다리 건설
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>균형 다리 건설</title>
    <script src="/js/SessionSDK.js"></script>
    <style>
        #gameCanvas {
            border: 2px solid #333;
            background: linear-gradient(180deg, #87CEEB 0%, #8FBC8F 50%, #CD853F 100%);
        }
        .bridge-status {
            display: flex;
            justify-content: space-around;
            margin: 10px 0;
            font-weight: bold;
        }
        .stability-meter {
            width: 300px;
            height: 20px;
            background: #ddd;
            border-radius: 10px;
            margin: 10px auto;
            position: relative;
            overflow: hidden;
        }
        .stability-bar {
            height: 100%;
            background: linear-gradient(90deg, #ff4757, #ffa502, #2ed573);
            border-radius: 10px;
            transition: width 0.2s ease;
        }
    </style>
</head>
<body>
    <div id="sessionInfo"></div>
    <div class="bridge-status">
        <span>왼쪽 지지대: <span id="leftSupport">50</span>%</span>
        <span>오른쪽 지지대: <span id="rightSupport">50</span>%</span>
        <span>다리 길이: <span id="bridgeLength">0</span>m</span>
    </div>
    <div class="stability-meter">
        <div class="stability-bar" id="stabilityBar" style="width: 50%"></div>
    </div>
    <canvas id="gameCanvas" width="800" height="400"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const game = {
            bridge: {
                leftSupport: 50,
                rightSupport: 50,
                segments: [],
                maxLength: 300,
                currentLength: 0,
                stability: 50
            },
            players: {
                player1: { // 왼쪽 지지대 담당
                    connected: false,
                    tilt: 0,
                    color: '#3498db'
                },
                player2: { // 오른쪽 지지대 담당
                    connected: false,
                    tilt: 0,
                    color: '#e74c3c'
                }
            },
            terrain: {
                leftCliff: { x: 100, y: 300, width: 80, height: 100 },
                rightCliff: { x: 620, y: 300, width: 80, height: 100 },
                gap: 440
            },
            gameRunning: false,
            buildingSpeed: 0.5,
            requiredStability: 60,
            person: {
                x: 120,
                y: 280,
                width: 20,
                height: 30,
                speed: 1,
                onBridge: false
            }
        };

        // SessionSDK 초기화
        const sdk = new SessionSDK({
            gameId: 'bridge-builder',
            gameType: 'dual'
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
                    <h3>🌉 균형 다리 건설</h3>
                    <p><strong>세션 코드:</strong> ${session.sessionCode}</p>
                    <p><strong>목표:</strong> 협력하여 안정적인 다리를 건설하고 사람을 건너게 하세요!</p>
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

            const isPlayer1 = data.sensorId.includes('sensor1') || data.timestamp % 2 === 0;
            const player = isPlayer1 ? game.players.player1 : game.players.player2;

            player.connected = true;
            player.tilt = data.orientation.gamma; // 좌우 기울기

            // 지지대 강도 계산 (수직에 가까울수록 강함)
            const tiltStability = Math.max(0, 100 - Math.abs(player.tilt * 2));

            if (isPlayer1) {
                game.bridge.leftSupport = tiltStability;
            } else {
                game.bridge.rightSupport = tiltStability;
            }

            // 전체 안정성 계산
            game.bridge.stability = (game.bridge.leftSupport + game.bridge.rightSupport) / 2;

            // UI 업데이트
            document.getElementById('leftSupport').textContent = Math.floor(game.bridge.leftSupport);
            document.getElementById('rightSupport').textContent = Math.floor(game.bridge.rightSupport);
            document.getElementById('stabilityBar').style.width = game.bridge.stability + '%';
        }

        function startGame() {
            game.gameRunning = true;
            gameLoop();
        }

        function update() {
            if (!game.gameRunning) return;

            // 다리 건설 진행
            if (game.bridge.stability >= game.requiredStability &&
                game.bridge.currentLength < game.bridge.maxLength) {

                game.bridge.currentLength += game.buildingSpeed;

                // 새로운 다리 세그먼트 추가
                if (game.bridge.segments.length === 0 ||
                    game.bridge.currentLength - game.bridge.segments[game.bridge.segments.length - 1].x > 10) {

                    const segmentX = game.terrain.leftCliff.x + game.terrain.leftCliff.width + game.bridge.currentLength;
                    const segmentY = 300 + (Math.random() - 0.5) * (100 - game.bridge.stability);

                    game.bridge.segments.push({
                        x: segmentX,
                        y: segmentY,
                        stability: game.bridge.stability
                    });
                }
            }

            // 다리 완성 확인
            if (game.bridge.currentLength >= game.bridge.maxLength) {
                if (!game.person.onBridge) {
                    game.person.onBridge = true;
                }
            }

            // 사람 이동
            if (game.person.onBridge && game.bridge.stability >= 40) {
                game.person.x += game.person.speed;

                // 다리 위에서의 Y 위치 계산
                const bridgeSegment = getBridgeHeightAt(game.person.x);
                if (bridgeSegment) {
                    game.person.y = bridgeSegment.y - game.person.height;
                }

                // 목적지 도달 확인
                if (game.person.x >= game.terrain.rightCliff.x) {
                    winGame();
                }
            }

            // 안정성이 너무 낮으면 다리 붕괴
            if (game.bridge.stability < 20 && game.bridge.segments.length > 0) {
                collapseBridge();
            }

            document.getElementById('bridgeLength').textContent = Math.floor(game.bridge.currentLength / 10);
        }

        function getBridgeHeightAt(x) {
            for (let i = 0; i < game.bridge.segments.length; i++) {
                const segment = game.bridge.segments[i];
                if (Math.abs(x - segment.x) < 10) {
                    return segment;
                }
            }
            return null;
        }

        function collapseBridge() {
            // 다리 일부 제거
            game.bridge.segments = game.bridge.segments.filter(() => Math.random() > 0.3);
            game.bridge.currentLength = Math.max(0, game.bridge.currentLength - 20);

            if (game.person.onBridge) {
                game.person.x = Math.max(120, game.person.x - 30);
                game.person.onBridge = false;
            }
        }

        function winGame() {
            game.gameRunning = false;
            alert('축하합니다! 성공적으로 다리를 건설하고 사람을 안전하게 건너게 했습니다!');
            resetGame();
        }

        function resetGame() {
            game.bridge = {
                leftSupport: 50,
                rightSupport: 50,
                segments: [],
                maxLength: 300,
                currentLength: 0,
                stability: 50
            };

            game.person = {
                x: 120,
                y: 280,
                width: 20,
                height: 30,
                speed: 1,
                onBridge: false
            };

            document.getElementById('leftSupport').textContent = '50';
            document.getElementById('rightSupport').textContent = '50';
            document.getElementById('bridgeLength').textContent = '0';
            document.getElementById('stabilityBar').style.width = '50%';
        }

        function render() {
            // 배경 지우기
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 지형 그리기
            // 왼쪽 절벽
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(game.terrain.leftCliff.x, game.terrain.leftCliff.y,
                        game.terrain.leftCliff.width, game.terrain.leftCliff.height);

            // 오른쪽 절벽
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(game.terrain.rightCliff.x, game.terrain.rightCliff.y,
                        game.terrain.rightCliff.width, game.terrain.rightCliff.height);

            // 절벽 상단 잔디
            ctx.fillStyle = '#228B22';
            ctx.fillRect(game.terrain.leftCliff.x, game.terrain.leftCliff.y - 10,
                        game.terrain.leftCliff.width, 10);
            ctx.fillRect(game.terrain.rightCliff.x, game.terrain.rightCliff.y - 10,
                        game.terrain.rightCliff.width, 10);

            // 다리 그리기
            if (game.bridge.segments.length > 1) {
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 8;
                ctx.lineCap = 'round';

                for (let i = 0; i < game.bridge.segments.length - 1; i++) {
                    const segment = game.bridge.segments[i];
                    const nextSegment = game.bridge.segments[i + 1];

                    // 안정성에 따른 색상
                    const stabilityRatio = segment.stability / 100;
                    const red = Math.floor(255 * (1 - stabilityRatio));
                    const green = Math.floor(255 * stabilityRatio);
                    ctx.strokeStyle = `rgb(${red}, ${green}, 100)`;

                    ctx.beginPath();
                    ctx.moveTo(segment.x, segment.y);
                    ctx.lineTo(nextSegment.x, nextSegment.y);
                    ctx.stroke();
                }

                // 다리 지지 케이블
                game.bridge.segments.forEach((segment, index) => {
                    if (index % 3 === 0) {
                        ctx.strokeStyle = '#333';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(segment.x, segment.y);
                        ctx.lineTo(segment.x, segment.y - 40);
                        ctx.stroke();
                    }
                });
            }

            // 시작점에서 첫 번째 세그먼트까지의 연결
            if (game.bridge.segments.length > 0) {
                const firstSegment = game.bridge.segments[0];
                const startX = game.terrain.leftCliff.x + game.terrain.leftCliff.width;
                const startY = game.terrain.leftCliff.y;

                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(firstSegment.x, firstSegment.y);
                ctx.stroke();

                // 마지막 세그먼트에서 끝점까지의 연결
                if (game.bridge.currentLength >= game.bridge.maxLength) {
                    const lastSegment = game.bridge.segments[game.bridge.segments.length - 1];
                    const endX = game.terrain.rightCliff.x;
                    const endY = game.terrain.rightCliff.y;

                    ctx.beginPath();
                    ctx.moveTo(lastSegment.x, lastSegment.y);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                }
            }

            // 사람 그리기
            ctx.fillStyle = '#FF1493';
            ctx.fillRect(game.person.x - game.person.width / 2, game.person.y,
                        game.person.width, game.person.height);

            // 사람 머리
            ctx.beginPath();
            ctx.arc(game.person.x, game.person.y - 5, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#FFB6C1';
            ctx.fill();

            // 지지대 표시
            const leftIndicatorX = 50;
            const rightIndicatorX = canvas.width - 100;
            const indicatorY = 50;

            // 왼쪽 지지대 표시
            ctx.fillStyle = game.players.player1.connected ? game.players.player1.color : '#bdc3c7';
            ctx.fillRect(leftIndicatorX, indicatorY, 30, 100);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('L', leftIndicatorX + 15, indicatorY + 55);

            // 오른쪽 지지대 표시
            ctx.fillStyle = game.players.player2.connected ? game.players.player2.color : '#bdc3c7';
            ctx.fillRect(rightIndicatorX, indicatorY, 30, 100);
            ctx.fillStyle = '#fff';
            ctx.fillText('R', rightIndicatorX + 15, indicatorY + 55);

            // 건설 진행 표시
            if (game.bridge.currentLength < game.bridge.maxLength) {
                const progressX = game.terrain.leftCliff.x + game.terrain.leftCliff.width + game.bridge.currentLength;
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(progressX, 300, 5, 0, Math.PI * 2);
                ctx.fill();

                // 건설 스파크 효과
                for (let i = 0; i < 5; i++) {
                    const sparkX = progressX + (Math.random() - 0.5) * 20;
                    const sparkY = 300 + (Math.random() - 0.5) * 20;
                    ctx.fillStyle = '#FFA500';
                    ctx.fillRect(sparkX, sparkY, 2, 2);
                }
            }
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

## 예제 3: 협력 요리 게임
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>협력 요리 게임</title>
    <script src="/js/SessionSDK.js"></script>
    <style>
        #gameCanvas {
            border: 2px solid #333;
            background: linear-gradient(180deg, #FFE4E1 0%, #FFF8DC 100%);
        }
        .kitchen-status {
            display: flex;
            justify-content: space-around;
            margin: 10px 0;
            font-weight: bold;
            flex-wrap: wrap;
        }
        .chef-info {
            background: #f8f9fa;
            padding: 8px;
            border-radius: 8px;
            margin: 5px;
            min-width: 120px;
            text-align: center;
        }
        .recipe-display {
            background: #fff;
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 10px;
            margin: 10px 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div id="sessionInfo"></div>
    <div class="recipe-display">
        <h4>오늘의 요리: <span id="currentDish">🍕 피자</span></h4>
        <p>필요한 재료: <span id="requiredIngredients">토마토, 치즈, 밀가루</span></p>
        <p>요리 시간: <span id="cookingTime">60</span>초</p>
    </div>
    <div class="kitchen-status">
        <div class="chef-info">
            <div>👨‍🍳 셰프 1</div>
            <div>상태: <span id="chef1Status">대기중</span></div>
            <div>재료: <span id="chef1Ingredient">없음</span></div>
        </div>
        <div class="chef-info">
            <div>👩‍🍳 셰프 2</div>
            <div>상태: <span id="chef2Status">대기중</span></div>
            <div>재료: <span id="chef2Ingredient">없음</span></div>
        </div>
        <div class="chef-info">
            <div>🍳 요리 진행도</div>
            <div><span id="cookingProgress">0</span>%</div>
        </div>
    </div>
    <canvas id="gameCanvas" width="800" height="500"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // 요리 레시피 정의
        const recipes = [
            {
                name: '🍕 피자',
                ingredients: ['토마토', '치즈', '밀가루'],
                cookingTime: 60,
                difficulty: 1
            },
            {
                name: '🍔 햄버거',
                ingredients: ['고기', '양상추', '빵'],
                cookingTime: 45,
                difficulty: 2
            },
            {
                name: '🍜 라면',
                ingredients: ['면', '계란', '파'],
                cookingTime: 30,
                difficulty: 1
            },
            {
                name: '🥗 샐러드',
                ingredients: ['양상추', '토마토', '오이', '드레싱'],
                cookingTime: 20,
                difficulty: 3
            }
        ];

        const ingredients = {
            '토마토': { x: 100, y: 100, color: '#FF6347', collected: false },
            '치즈': { x: 200, y: 150, color: '#FFD700', collected: false },
            '밀가루': { x: 300, y: 120, color: '#F5DEB3', collected: false },
            '고기': { x: 400, y: 100, color: '#8B4513', collected: false },
            '양상추': { x: 500, y: 140, color: '#90EE90', collected: false },
            '빵': { x: 600, y: 110, color: '#DEB887', collected: false },
            '면': { x: 150, y: 200, color: '#F0E68C', collected: false },
            '계란': { x: 250, y: 220, color: '#FFFACD', collected: false },
            '파': { x: 350, y: 180, color: '#7FFF00', collected: false },
            '오이': { x: 450, y: 190, color: '#98FB98', collected: false },
            '드레싱': { x: 550, y: 210, color: '#DDA0DD', collected: false }
        };

        const game = {
            currentRecipe: recipes[0],
            chefs: {
                chef1: {
                    x: 50,
                    y: 300,
                    width: 30,
                    height: 40,
                    color: '#FF69B4',
                    connected: false,
                    ingredient: null,
                    atStove: false
                },
                chef2: {
                    x: 700,
                    y: 300,
                    width: 30,
                    height: 40,
                    color: '#87CEEB',
                    connected: false,
                    ingredient: null,
                    atStove: false
                }
            },
            stove: {
                x: 350,
                y: 350,
                width: 100,
                height: 60,
                temperature: 50,
                ingredientsAdded: [],
                cooking: false
            },
            cookingProgress: 0,
            timeLeft: 60,
            gameRunning: false,
            level: 1,
            score: 0,
            sensitivity: 0.3
        };

        // SessionSDK 초기화
        const sdk = new SessionSDK({
            gameId: 'cooking-coop',
            gameType: 'dual'
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
                <div style="background: #fffaf0; padding: 15px; border-radius: 10px; margin-bottom: 10px; border: 2px solid #daa520;">
                    <h3>👨‍🍳 협력 요리 게임</h3>
                    <p><strong>세션 코드:</strong> ${session.sessionCode}</p>
                    <p><strong>목표:</strong> 두 셰프가 협력하여 맛있는 요리를 완성하세요!</p>
                    <div id="qrcode"></div>
                </div>
            `;

            generateQRCode(session.qrCodeUrl);
            initializeLevel();
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

        function initializeLevel() {
            game.currentRecipe = recipes[(game.level - 1) % recipes.length];
            game.timeLeft = game.currentRecipe.cookingTime;
            game.cookingProgress = 0;
            game.stove.ingredientsAdded = [];
            game.stove.cooking = false;

            // 재료 초기화
            Object.values(ingredients).forEach(ingredient => {
                ingredient.collected = false;
                ingredient.x = 100 + Math.random() * 600;
                ingredient.y = 100 + Math.random() * 150;
            });

            // UI 업데이트
            document.getElementById('currentDish').textContent = game.currentRecipe.name;
            document.getElementById('requiredIngredients').textContent = game.currentRecipe.ingredients.join(', ');
            document.getElementById('cookingTime').textContent = game.timeLeft;
        }

        function processSensorData(data) {
            if (!game.gameRunning || !data.orientation) return;

            const isChef1 = data.sensorId.includes('sensor1') || data.timestamp % 2 === 0;
            const chef = isChef1 ? game.chefs.chef1 : game.chefs.chef2;

            chef.connected = true;

            const { beta, gamma } = data.orientation;

            // 셰프 이동
            chef.x += gamma * game.sensitivity;
            chef.y += beta * game.sensitivity;

            // 화면 경계 제한
            chef.x = Math.max(chef.width / 2,
                            Math.min(canvas.width - chef.width / 2, chef.x));
            chef.y = Math.max(250, Math.min(canvas.height - chef.height / 2, chef.y));

            // 재료 수집 확인
            if (!chef.ingredient) {
                Object.entries(ingredients).forEach(([name, ingredient]) => {
                    if (!ingredient.collected &&
                        Math.abs(chef.x - ingredient.x) < 30 &&
                        Math.abs(chef.y - ingredient.y) < 30) {

                        if (game.currentRecipe.ingredients.includes(name)) {
                            chef.ingredient = name;
                            ingredient.collected = true;
                        }
                    }
                });
            }

            // 스토브 접근 확인
            chef.atStove = Math.abs(chef.x - (game.stove.x + game.stove.width / 2)) < 60 &&
                          Math.abs(chef.y - (game.stove.y + game.stove.height / 2)) < 60;

            // 재료를 스토브에 추가
            if (chef.atStove && chef.ingredient && !game.stove.ingredientsAdded.includes(chef.ingredient)) {
                game.stove.ingredientsAdded.push(chef.ingredient);
                chef.ingredient = null;

                // 모든 재료가 추가되면 요리 시작
                if (game.stove.ingredientsAdded.length === game.currentRecipe.ingredients.length) {
                    game.stove.cooking = true;
                }
            }

            // UI 업데이트
            const chefNumber = isChef1 ? '1' : '2';
            document.getElementById(`chef${chefNumber}Status`).textContent =
                chef.atStove ? '요리중' : '이동중';
            document.getElementById(`chef${chefNumber}Ingredient`).textContent =
                chef.ingredient || '없음';
        }

        function startGame() {
            game.gameRunning = true;

            // 타이머 시작
            const timer = setInterval(() => {
                game.timeLeft--;
                document.getElementById('cookingTime').textContent = game.timeLeft;

                if (game.timeLeft <= 0) {
                    clearInterval(timer);
                    endGame(false);
                }
            }, 1000);

            gameLoop();
        }

        function update() {
            if (!game.gameRunning) return;

            // 요리 진행
            if (game.stove.cooking) {
                const bothChefsAtStove = game.chefs.chef1.atStove && game.chefs.chef2.atStove;

                if (bothChefsAtStove) {
                    game.cookingProgress += 2; // 협력하면 빠른 요리
                    game.stove.temperature = Math.min(100, game.stove.temperature + 1);
                } else {
                    game.cookingProgress += 0.5; // 혼자서는 느린 요리
                    game.stove.temperature = Math.max(30, game.stove.temperature - 0.5);
                }

                // 과도한 온도는 요리를 태움
                if (game.stove.temperature > 95) {
                    game.cookingProgress = Math.max(0, game.cookingProgress - 1);
                }

                game.cookingProgress = Math.min(100, game.cookingProgress);

                // 요리 완성
                if (game.cookingProgress >= 100) {
                    endGame(true);
                }
            }

            document.getElementById('cookingProgress').textContent = Math.floor(game.cookingProgress);
        }

        function render() {
            // 배경 지우기
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 주방 바닥
            ctx.fillStyle = '#F5F5DC';
            ctx.fillRect(0, 250, canvas.width, canvas.height - 250);

            // 주방 타일 패턴
            ctx.strokeStyle = '#D3D3D3';
            ctx.lineWidth = 1;
            for (let x = 0; x < canvas.width; x += 50) {
                for (let y = 250; y < canvas.height; y += 50) {
                    ctx.strokeRect(x, y, 50, 50);
                }
            }

            // 재료 그리기
            Object.entries(ingredients).forEach(([name, ingredient]) => {
                if (!ingredient.collected) {
                    // 재료 아이콘
                    ctx.fillStyle = ingredient.color;
                    ctx.beginPath();
                    ctx.arc(ingredient.x, ingredient.y, 15, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // 재료 이름
                    ctx.fillStyle = '#333';
                    ctx.font = 'bold 10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(name, ingredient.x, ingredient.y + 25);

                    // 필요한 재료 하이라이트
                    if (game.currentRecipe.ingredients.includes(name)) {
                        ctx.strokeStyle = '#FFD700';
                        ctx.lineWidth = 3;
                        ctx.setLineDash([3, 3]);
                        ctx.beginPath();
                        ctx.arc(ingredient.x, ingredient.y, 20, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.setLineDash([]);
                    }
                }
            });

            // 스토브 그리기
            ctx.fillStyle = '#696969';
            ctx.fillRect(game.stove.x, game.stove.y, game.stove.width, game.stove.height);

            // 스토브 버너
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 2; j++) {
                    const burnerX = game.stove.x + 20 + i * 60;
                    const burnerY = game.stove.y + 15 + j * 30;

                    ctx.fillStyle = game.stove.cooking ? '#FF4500' : '#333';
                    ctx.beginPath();
                    ctx.arc(burnerX, burnerY, 8, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // 스토브 위 팬
            if (game.stove.ingredientsAdded.length > 0) {
                ctx.fillStyle = '#2F4F4F';
                ctx.beginPath();
                ctx.arc(game.stove.x + game.stove.width / 2, game.stove.y - 10, 30, 0, Math.PI * 2);
                ctx.fill();

                // 팬 안의 재료들
                game.stove.ingredientsAdded.forEach((ingredient, index) => {
                    const angle = (index / game.stove.ingredientsAdded.length) * Math.PI * 2;
                    const ingredientX = game.stove.x + game.stove.width / 2 + Math.cos(angle) * 15;
                    const ingredientY = game.stove.y - 10 + Math.sin(angle) * 15;

                    ctx.fillStyle = ingredients[ingredient].color;
                    ctx.beginPath();
                    ctx.arc(ingredientX, ingredientY, 5, 0, Math.PI * 2);
                    ctx.fill();
                });

                // 요리 연기 효과
                if (game.stove.cooking) {
                    for (let i = 0; i < 5; i++) {
                        const smokeX = game.stove.x + game.stove.width / 2 + (Math.random() - 0.5) * 40;
                        const smokeY = game.stove.y - 20 - i * 10;

                        ctx.fillStyle = `rgba(255, 255, 255, ${0.7 - i * 0.1})`;
                        ctx.beginPath();
                        ctx.arc(smokeX, smokeY, 3 + i, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }

            // 셰프 그리기
            Object.values(game.chefs).forEach(chef => {
                if (!chef.connected) return;

                // 셰프 몸체
                ctx.fillStyle = chef.color;
                ctx.fillRect(chef.x - chef.width / 2, chef.y - chef.height / 2,
                           chef.width, chef.height);

                // 셰프 모자
                ctx.fillStyle = '#FFF';
                ctx.fillRect(chef.x - chef.width / 2, chef.y - chef.height / 2 - 15,
                           chef.width, 15);

                // 들고 있는 재료
                if (chef.ingredient) {
                    ctx.fillStyle = ingredients[chef.ingredient].color;
                    ctx.beginPath();
                    ctx.arc(chef.x, chef.y - chef.height / 2 - 25, 8, 0, Math.PI * 2);
                    ctx.fill();
                }

                // 스토브 근처 표시
                if (chef.atStove) {
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 3;
                    ctx.setLineDash([3, 3]);
                    ctx.strokeRect(chef.x - chef.width / 2 - 5, chef.y - chef.height / 2 - 5,
                                 chef.width + 10, chef.height + 10);
                    ctx.setLineDash([]);
                }
            });

            // 온도계 그리기
            const thermometerX = 50;
            const thermometerY = 100;
            const thermometerHeight = 100;

            ctx.fillStyle = '#DDD';
            ctx.fillRect(thermometerX, thermometerY, 20, thermometerHeight);

            const tempHeight = (game.stove.temperature / 100) * thermometerHeight;
            const tempColor = game.stove.temperature > 90 ? '#FF0000' :
                            game.stove.temperature > 70 ? '#FFA500' : '#00FF00';

            ctx.fillStyle = tempColor;
            ctx.fillRect(thermometerX, thermometerY + thermometerHeight - tempHeight, 20, tempHeight);

            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.floor(game.stove.temperature)}°C`, thermometerX + 10, thermometerY + thermometerHeight + 20);
        }

        function endGame(success) {
            game.gameRunning = false;

            if (success) {
                game.score += 100 * game.level;
                game.level++;
                alert(`요리 완성! 점수: ${game.score}. 다음 레벨로 이동합니다.`);
                initializeLevel();
                startGame();
            } else {
                alert(`시간 초과! 최종 점수: ${game.score}`);
                resetGame();
            }
        }

        function resetGame() {
            game.level = 1;
            game.score = 0;
            game.cookingProgress = 0;
            initializeLevel();
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

## 예제 4: 듀얼 레이싱
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>듀얼 레이싱</title>
    <script src="/js/SessionSDK.js"></script>
    <style>
        #gameCanvas {
            border: 2px solid #333;
            background: linear-gradient(180deg, #87CEEB 0%, #228B22 100%);
        }
        .race-info {
            display: flex;
            justify-content: space-around;
            margin: 10px 0;
            font-weight: bold;
        }
        .car-stats {
            background: #f8f9fa;
            padding: 8px;
            border-radius: 8px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div id="sessionInfo"></div>
    <div class="race-info">
        <div class="car-stats" style="background: #e3f2fd;">
            <div>🚗 파란 자동차</div>
            <div>랩: <span id="blueLap">1</span>/3</div>
            <div>속도: <span id="blueSpeed">0</span> km/h</div>
        </div>
        <div class="car-stats" style="background: #ffebee;">
            <div>🚙 빨간 자동차</div>
            <div>랩: <span id="redLap">1</span>/3</div>
            <div>속도: <span id="redSpeed">0</span> km/h</div>
        </div>
    </div>
    <canvas id="gameCanvas" width="800" height="600"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // 레이스 트랙 정의 (체크포인트 기반)
        const track = {
            checkpoints: [
                { x: 100, y: 300 }, // 시작점
                { x: 300, y: 150 },
                { x: 500, y: 100 },
                { x: 700, y: 200 },
                { x: 650, y: 400 },
                { x: 400, y: 500 },
                { x: 200, y: 450 },
                { x: 100, y: 300 }  // 다시 시작점
            ],
            width: 80
        };

        const game = {
            cars: {
                blue: {
                    x: 100,
                    y: 300,
                    angle: 0,
                    speed: 0,
                    maxSpeed: 8,
                    acceleration: 0.2,
                    friction: 0.95,
                    width: 30,
                    height: 15,
                    color: '#2196f3',
                    connected: false,
                    currentCheckpoint: 0,
                    lap: 1,
                    totalLaps: 3,
                    finished: false
                },
                red: {
                    x: 100,
                    y: 320,
                    angle: 0,
                    speed: 0,
                    maxSpeed: 8,
                    acceleration: 0.2,
                    friction: 0.95,
                    width: 30,
                    height: 15,
                    color: '#f44336',
                    connected: false,
                    currentCheckpoint: 0,
                    lap: 1,
                    totalLaps: 3,
                    finished: false
                }
            },
            gameRunning: false,
            raceStarted: false,
            winner: null,
            particles: []
        };

        // SessionSDK 초기화
        const sdk = new SessionSDK({
            gameId: 'dual-racing',
            gameType: 'dual'
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
                <div style="background: #212529; color: #fff; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                    <h3>🏁 듀얼 레이싱</h3>
                    <p><strong>세션 코드:</strong> ${session.sessionCode}</p>
                    <p><strong>목표:</strong> 3랩을 먼저 완주하세요!</p>
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

            const isBlue = data.sensorId.includes('sensor1') || data.timestamp % 2 === 0;
            const car = isBlue ? game.cars.blue : game.cars.red;

            car.connected = true;

            if (car.finished) return;

            const { beta, gamma } = data.orientation;

            // 가속/브레이크 (앞뒤 기울기)
            if (beta < -10) { // 앞으로 기울이면 가속
                car.speed = Math.min(car.maxSpeed, car.speed + car.acceleration);
            } else if (beta > 10) { // 뒤로 기울이면 브레이크
                car.speed = Math.max(0, car.speed - car.acceleration * 2);
            }

            // 스티어링 (좌우 기울기)
            if (Math.abs(gamma) > 5) {
                const steeringSensitivity = 0.05;
                car.angle += gamma * steeringSensitivity * (car.speed / car.maxSpeed);
            }

            // 마찰 적용
            car.speed *= car.friction;

            // 자동차 이동
            car.x += Math.cos(car.angle) * car.speed;
            car.y += Math.sin(car.angle) * car.speed;

            // 화면 경계 제한
            car.x = Math.max(car.width / 2, Math.min(canvas.width - car.width / 2, car.x));
            car.y = Math.max(car.height / 2, Math.min(canvas.height - car.height / 2, car.y));

            // 체크포인트 확인
            checkCheckpoint(car);

            // UI 업데이트
            const carColor = isBlue ? 'blue' : 'red';
            document.getElementById(`${carColor}Speed`).textContent = Math.floor(car.speed * 10);
            document.getElementById(`${carColor}Lap`).textContent = car.lap;
        }

        function checkCheckpoint(car) {
            const nextCheckpoint = track.checkpoints[car.currentCheckpoint];
            const distance = Math.sqrt(
                Math.pow(car.x - nextCheckpoint.x, 2) +
                Math.pow(car.y - nextCheckpoint.y, 2)
            );

            if (distance < 40) {
                car.currentCheckpoint++;

                // 한 랩 완료
                if (car.currentCheckpoint >= track.checkpoints.length - 1) {
                    car.currentCheckpoint = 0;
                    car.lap++;

                    // 파티클 효과
                    createLapParticles(car.x, car.y, car.color);

                    // 레이스 완료 확인
                    if (car.lap > car.totalLaps) {
                        car.finished = true;
                        if (!game.winner) {
                            game.winner = car.color === '#2196f3' ? 'blue' : 'red';
                            endRace();
                        }
                    }
                }
            }
        }

        function createLapParticles(x, y, color) {
            for (let i = 0; i < 15; i++) {
                const angle = (Math.PI * 2 * i) / 15;
                const speed = 3 + Math.random() * 5;

                game.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 4 + Math.random() * 4,
                    color: color,
                    life: 40 + Math.random() * 20
                });
            }
        }

        function startGame() {
            game.gameRunning = true;
            game.raceStarted = true;
            gameLoop();
        }

        function update() {
            if (!game.gameRunning) return;

            // 파티클 업데이트
            game.particles.forEach((particle, index) => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vx *= 0.98;
                particle.vy *= 0.98;
                particle.life--;
                particle.size *= 0.99;

                if (particle.life <= 0 || particle.size < 1) {
                    game.particles.splice(index, 1);
                }
            });
        }

        function render() {
            // 배경 지우기
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 트랙 그리기
            ctx.strokeStyle = '#666';
            ctx.lineWidth = track.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(track.checkpoints[0].x, track.checkpoints[0].y);
            for (let i = 1; i < track.checkpoints.length; i++) {
                ctx.lineTo(track.checkpoints[i].x, track.checkpoints[i].y);
            }
            ctx.stroke();

            // 트랙 중앙선
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.moveTo(track.checkpoints[0].x, track.checkpoints[0].y);
            for (let i = 1; i < track.checkpoints.length; i++) {
                ctx.lineTo(track.checkpoints[i].x, track.checkpoints[i].y);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // 체크포인트 표시
            track.checkpoints.forEach((checkpoint, index) => {
                if (index === 0) {
                    // 시작/결승선
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(checkpoint.x - 30, checkpoint.y - 5, 60, 10);
                    ctx.fillStyle = '#000';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('START/FINISH', checkpoint.x, checkpoint.y - 15);
                } else {
                    // 일반 체크포인트
                    ctx.fillStyle = '#FFA500';
                    ctx.beginPath();
                    ctx.arc(checkpoint.x, checkpoint.y, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(index.toString(), checkpoint.x, checkpoint.y + 3);
                }
            });

            // 자동차 그리기
            Object.values(game.cars).forEach(car => {
                if (!car.connected) return;

                ctx.save();
                ctx.translate(car.x, car.y);
                ctx.rotate(car.angle);

                // 자동차 본체
                ctx.fillStyle = car.color;
                ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);

                // 자동차 디테일
                ctx.fillStyle = '#333';
                ctx.fillRect(car.width / 4, -car.height / 2, car.width / 8, car.height);

                // 헤드라이트
                ctx.fillStyle = '#FFF';
                ctx.fillRect(car.width / 2 - 3, -car.height / 4, 3, car.height / 2);

                // 속도에 따른 연기 효과
                if (car.speed > 3) {
                    for (let i = 0; i < 3; i++) {
                        const smokeX = -car.width / 2 - 10 - i * 8;
                        const smokeY = (Math.random() - 0.5) * car.height;

                        ctx.fillStyle = `rgba(100, 100, 100, ${0.5 - i * 0.15})`;
                        ctx.beginPath();
                        ctx.arc(smokeX, smokeY, 3 - i, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                ctx.restore();

                // 다음 체크포인트 방향 표시
                if (!car.finished) {
                    const nextCheckpoint = track.checkpoints[car.currentCheckpoint];
                    const angle = Math.atan2(nextCheckpoint.y - car.y, nextCheckpoint.x - car.x);

                    ctx.strokeStyle = car.color;
                    ctx.lineWidth = 3;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(car.x, car.y);
                    ctx.lineTo(car.x + Math.cos(angle) * 50, car.y + Math.sin(angle) * 50);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            });

            // 파티클 그리기
            game.particles.forEach(particle => {
                ctx.globalAlpha = particle.life / 40;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.globalAlpha = 1;

            // 승리 메시지
            if (game.winner) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${game.winner.toUpperCase()} WINS!`, canvas.width / 2, canvas.height / 2);
            }
        }

        function endRace() {
            game.gameRunning = false;
            setTimeout(() => {
                alert(`레이스 종료! ${game.winner === 'blue' ? '파란' : '빨간'} 자동차 승리!`);
                resetGame();
            }, 2000);
        }

        function resetGame() {
            Object.values(game.cars).forEach(car => {
                car.x = 100;
                car.y = car.color === '#2196f3' ? 300 : 320;
                car.angle = 0;
                car.speed = 0;
                car.currentCheckpoint = 0;
                car.lap = 1;
                car.finished = false;
            });

            game.winner = null;
            game.particles = [];
            game.gameRunning = true;

            document.getElementById('blueLap').textContent = '1';
            document.getElementById('redLap').textContent = '1';
            document.getElementById('blueSpeed').textContent = '0';
            document.getElementById('redSpeed').textContent = '0';

            gameLoop();
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

## 예제 5: 협력 미로 탈출
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>협력 미로 탈출</title>
    <script src="/js/SessionSDK.js"></script>
    <style>
        #gameCanvas {
            border: 2px solid #333;
            background: #2c3e50;
        }
        .players-info {
            display: flex;
            justify-content: space-around;
            margin: 10px 0;
            font-weight: bold;
        }
        .player-card {
            background: #ecf0f1;
            padding: 10px;
            border-radius: 8px;
            text-align: center;
        }
        .progress-bar {
            width: 300px;
            height: 20px;
            background: #ddd;
            border-radius: 10px;
            margin: 10px auto;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #3498db, #2ecc71);
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div id="sessionInfo"></div>
    <div class="players-info">
        <div class="player-card">
            <div>🔵 플레이어 1</div>
            <div>열쇠: <span id="player1Keys">0</span>/2</div>
            <div>상태: <span id="player1Status">탐색중</span></div>
        </div>
        <div class="player-card">
            <div>🔴 플레이어 2</div>
            <div>열쇠: <span id="player2Keys">0</span>/2</div>
            <div>상태: <span id="player2Status">탐색중</span></div>
        </div>
    </div>
    <div style="text-align: center;">
        <div>탈출 진행도: <span id="escapeProgress">0</span>%</div>
        <div class="progress-bar">
            <div class="progress-fill" id="progressFill" style="width: 0%"></div>
        </div>
    </div>
    <canvas id="gameCanvas" width="800" height="600"></canvas>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        // 협력 미로 맵 (더 복잡한 구조)
        const maze = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,1],
            [1,0,1,0,1,0,1,1,0,1,0,1,1,1,0,1],
            [1,0,1,0,0,0,0,1,0,0,0,0,0,1,0,1],
            [1,0,1,1,1,1,0,1,1,1,1,1,0,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
            [1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1],
            [1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1],
            [1,0,1,1,1,0,1,0,1,0,1,1,1,1,0,1],
            [1,0,0,0,1,0,0,0,1,0,0,0,0,1,0,1],
            [1,1,1,0,1,1,1,1,1,1,1,1,0,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];

        const cellSize = 50;

        const game = {
            players: {
                player1: {
                    x: 1,
                    y: 1,
                    gridX: 1,
                    gridY: 1,
                    size: 18,
                    color: '#3498db',
                    connected: false,
                    keys: 0,
                    requiredKeys: 2,
                    hasBlueKey: false,
                    hasRedKey: false,
                    atDoor: false
                },
                player2: {
                    x: 14,
                    y: 1,
                    gridX: 14,
                    gridY: 1,
                    size: 18,
                    color: '#e74c3c',
                    connected: false,
                    keys: 0,
                    requiredKeys: 2,
                    hasBlueKey: false,
                    hasRedKey: false,
                    atDoor: false
                }
            },
            doors: [
                { x: 7, y: 6, color: '#3498db', opened: false, requiresBlueKey: true },
                { x: 8, y: 9, color: '#e74c3c', opened: false, requiresRedKey: true }
            ],
            keys: [
                { x: 3, y: 8, color: '#3498db', collected: false, type: 'blue' },
                { x: 12, y: 3, color: '#e74c3c', collected: false, type: 'red' },
                { x: 6, y: 2, color: '#f39c12', collected: false, type: 'master' },
                { x: 9, y: 10, color: '#9b59b6', collected: false, type: 'master' }
            ],
            switches: [
                { x: 2, y: 4, activated: false, linkedDoor: 0 },
                { x: 13, y: 8, activated: false, linkedDoor: 1 }
            ],
            escapeProgress: 0,
            gameRunning: false,
            sensitivity: 0.08,
            cooperationRequired: false,
            bothAtExit: false
        };

        // SessionSDK 초기화
        const sdk = new SessionSDK({
            gameId: 'coop-maze-escape',
            gameType: 'dual'
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
                <div style="background: #34495e; color: #fff; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                    <h3>🧩 협력 미로 탈출</h3>
                    <p><strong>세션 코드:</strong> ${session.sessionCode}</p>
                    <p><strong>목표:</strong> 협력하여 열쇠를 모으고 문을 열어 함께 탈출하세요!</p>
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

            const isPlayer1 = data.sensorId.includes('sensor1') || data.timestamp % 2 === 0;
            const player = isPlayer1 ? game.players.player1 : game.players.player2;

            player.connected = true;

            const { beta, gamma } = data.orientation;

            // 플레이어 이동 (부드러운 그리드 기반 이동)
            const moveThreshold = 15;
            let newX = player.x;
            let newY = player.y;

            // 좌우 이동
            if (Math.abs(gamma) > moveThreshold) {
                if (gamma > moveThreshold) {
                    newX = Math.min(player.x + game.sensitivity, maze[0].length - 1);
                } else {
                    newX = Math.max(player.x - game.sensitivity, 0);
                }
            }

            // 상하 이동
            if (Math.abs(beta) > moveThreshold) {
                if (beta > moveThreshold) {
                    newY = Math.min(player.y + game.sensitivity, maze.length - 1);
                } else {
                    newY = Math.max(player.y - game.sensitivity, 0);
                }
            }

            // 충돌 검사
            const gridX = Math.floor(newX);
            const gridY = Math.floor(newY);

            if (maze[gridY] && maze[gridY][gridX] !== 1) {
                // 문 충돌 검사
                let canMove = true;
                game.doors.forEach(door => {
                    if (door.x === gridX && door.y === gridY && !door.opened) {
                        canMove = false;
                    }
                });

                if (canMove) {
                    player.x = newX;
                    player.y = newY;
                    player.gridX = gridX;
                    player.gridY = gridY;
                }
            }

            // 아이템 수집
            collectItems(player);

            // 스위치 활성화
            activateSwitches(player);

            // 출구 확인
            checkExit(player);

            // UI 업데이트
            const playerNumber = isPlayer1 ? '1' : '2';
            document.getElementById(`player${playerNumber}Keys`).textContent = player.keys;
            document.getElementById(`player${playerNumber}Status`).textContent = getPlayerStatus(player);
        }

        function collectItems(player) {
            game.keys.forEach((key, index) => {
                if (!key.collected &&
                    player.gridX === key.x &&
                    player.gridY === key.y) {

                    key.collected = true;
                    player.keys++;

                    if (key.type === 'blue') player.hasBlueKey = true;
                    if (key.type === 'red') player.hasRedKey = true;

                    // 파티클 효과
                    createCollectionParticles(key.x * cellSize + cellSize/2, key.y * cellSize + cellSize/2, key.color);
                }
            });
        }

        function activateSwitches(player) {
            game.switches.forEach(switchObj => {
                if (player.gridX === switchObj.x &&
                    player.gridY === switchObj.y) {

                    if (!switchObj.activated) {
                        switchObj.activated = true;

                        // 연결된 문 열기
                        const linkedDoor = game.doors[switchObj.linkedDoor];
                        if (linkedDoor) {
                            linkedDoor.opened = true;
                        }
                    }
                }
            });
        }

        function checkExit(player) {
            const exitX = 14;
            const exitY = 11;

            player.atDoor = (player.gridX === exitX && player.gridY === exitY);

            // 양쪽 플레이어가 모두 출구에 있고 충분한 열쇠를 가지고 있는지 확인
            const bothAtExit = game.players.player1.atDoor && game.players.player2.atDoor;
            const totalKeys = game.players.player1.keys + game.players.player2.keys;
            const hasRequiredKeys = totalKeys >= 4; // 총 4개의 열쇠 필요

            if (bothAtExit && hasRequiredKeys) {
                game.escapeProgress = Math.min(100, game.escapeProgress + 2);
            } else {
                game.escapeProgress = Math.max(0, game.escapeProgress - 1);
            }

            // 탈출 성공
            if (game.escapeProgress >= 100) {
                endGame(true);
            }

            // UI 업데이트
            document.getElementById('escapeProgress').textContent = Math.floor(game.escapeProgress);
            document.getElementById('progressFill').style.width = game.escapeProgress + '%';
        }

        function getPlayerStatus(player) {
            if (player.atDoor) return '출구 대기중';
            if (player.keys >= player.requiredKeys) return '열쇠 수집 완료';
            return '탐색중';
        }

        function createCollectionParticles(x, y, color) {
            // 간단한 파티클 효과를 위한 플레이스홀더
            // 실제로는 파티클 시스템을 구현할 수 있음
        }

        function startGame() {
            game.gameRunning = true;
            gameLoop();
        }

        function update() {
            if (!game.gameRunning) return;

            // 협력 요구사항 체크
            const bothConnected = game.players.player1.connected && game.players.player2.connected;
            game.cooperationRequired = bothConnected;

            // 자동 문 열기 (양쪽 플레이어가 모두 필요한 열쇠를 가지고 있을 때)
            game.doors.forEach(door => {
                if (!door.opened) {
                    let canOpen = false;

                    if (door.requiresBlueKey) {
                        canOpen = game.players.player1.hasBlueKey || game.players.player2.hasBlueKey;
                    } else if (door.requiresRedKey) {
                        canOpen = game.players.player1.hasRedKey || game.players.player2.hasRedKey;
                    }

                    // 스위치로도 열 수 있음
                    const linkedSwitch = game.switches.find(s => s.linkedDoor === game.doors.indexOf(door));
                    if (linkedSwitch && linkedSwitch.activated) {
                        canOpen = true;
                    }

                    if (canOpen) {
                        door.opened = true;
                    }
                }
            });
        }

        function render() {
            // 배경 지우기
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
                        ctx.fillStyle = '#27ae60';
                        ctx.fillRect(cellX, cellY, cellSize, cellSize);
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 16px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('EXIT', cellX + cellSize/2, cellY + cellSize/2 + 6);
                    } else {
                        // 길
                        ctx.fillStyle = '#95a5a6';
                        ctx.fillRect(cellX, cellY, cellSize, cellSize);
                    }
                }
            }

            // 문 그리기
            game.doors.forEach(door => {
                if (!door.opened) {
                    const cellX = door.x * cellSize;
                    const cellY = door.y * cellSize;

                    ctx.fillStyle = door.color;
                    ctx.fillRect(cellX, cellY, cellSize, cellSize);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 20px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('🚪', cellX + cellSize/2, cellY + cellSize/2 + 7);
                }
            });

            // 열쇠 그리기
            game.keys.forEach(key => {
                if (!key.collected) {
                    const cellX = key.x * cellSize + cellSize/2;
                    const cellY = key.y * cellSize + cellSize/2;

                    ctx.fillStyle = key.color;
                    ctx.beginPath();
                    ctx.arc(cellX, cellY, 12, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('🔑', cellX, cellY + 5);
                }
            });

            // 스위치 그리기
            game.switches.forEach(switchObj => {
                const cellX = switchObj.x * cellSize + cellSize/2;
                const cellY = switchObj.y * cellSize + cellSize/2;

                ctx.fillStyle = switchObj.activated ? '#2ecc71' : '#e74c3c';
                ctx.fillRect(cellX - 8, cellY - 8, 16, 16);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(switchObj.activated ? '✓' : '●', cellX, cellY + 4);
            });

            // 플레이어 그리기
            Object.values(game.players).forEach(player => {
                if (!player.connected) return;

                const playerPixelX = player.x * cellSize + cellSize / 2;
                const playerPixelY = player.y * cellSize + cellSize / 2;

                // 플레이어 본체
                ctx.beginPath();
                ctx.arc(playerPixelX, playerPixelY, player.size / 2, 0, Math.PI * 2);
                ctx.fillStyle = player.color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.stroke();

                // 출구에 있을 때 표시
                if (player.atDoor) {
                    ctx.strokeStyle = '#f1c40f';
                    ctx.lineWidth = 5;
                    ctx.setLineDash([3, 3]);
                    ctx.beginPath();
                    ctx.arc(playerPixelX, playerPixelY, player.size, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                // 가진 열쇠 표시
                if (player.keys > 0) {
                    ctx.fillStyle = '#f1c40f';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(`🔑${player.keys}`, playerPixelX, playerPixelY - 25);
                }
            });

            // 협력 필요 메시지
            if (game.cooperationRequired && (game.players.player1.atDoor || game.players.player2.atDoor)) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 18px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('두 플레이어가 모두 출구에서 만나야 합니다!', canvas.width / 2, canvas.height - 30);
            }
        }

        function endGame(success) {
            game.gameRunning = false;
            if (success) {
                alert('축하합니다! 성공적으로 미로에서 탈출했습니다!');
            }
            resetGame();
        }

        function resetGame() {
            // 플레이어 위치 리셋
            game.players.player1.x = 1;
            game.players.player1.y = 1;
            game.players.player1.gridX = 1;
            game.players.player1.gridY = 1;
            game.players.player1.keys = 0;
            game.players.player1.hasBlueKey = false;
            game.players.player1.hasRedKey = false;
            game.players.player1.atDoor = false;

            game.players.player2.x = 14;
            game.players.player2.y = 1;
            game.players.player2.gridX = 14;
            game.players.player2.gridY = 1;
            game.players.player2.keys = 0;
            game.players.player2.hasBlueKey = false;
            game.players.player2.hasRedKey = false;
            game.players.player2.atDoor = false;

            // 아이템 리셋
            game.keys.forEach(key => key.collected = false);
            game.doors.forEach(door => door.opened = false);
            game.switches.forEach(switchObj => switchObj.activated = false);

            game.escapeProgress = 0;

            // UI 리셋
            document.getElementById('player1Keys').textContent = '0';
            document.getElementById('player2Keys').textContent = '0';
            document.getElementById('player1Status').textContent = '탐색중';
            document.getElementById('player2Status').textContent = '탐색중';
            document.getElementById('escapeProgress').textContent = '0';
            document.getElementById('progressFill').style.width = '0%';

            game.gameRunning = true;
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

이상으로 듀얼 센서 게임 예제 3개(4, 5번 포함)를 추가로 작성했습니다. 계속해서 나머지 5개 예제를 작성하겠습니다.