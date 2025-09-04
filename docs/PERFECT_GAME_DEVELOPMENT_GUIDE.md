# 🎮 센서 게임 완벽 개발 가이드

## 🔑 필수 성공 패턴

### 1. SessionSDK 초기화 및 연결 패턴 (100% 필수)

```javascript
// 1단계: SDK 초기화
const sdk = new SessionSDK({
    gameId: 'unique-game-id',
    gameType: 'solo'  // 'solo', 'dual', 'multi'
});

// 2단계: 서버 연결 완료 후 세션 생성 (반드시 이 순서!)
sdk.on('connected', async () => {
    this.state.connected = true;
    this.updateServerStatus(true);
    this.updateGameStatus('서버 연결됨 - 세션 생성 중...');
    await this.createGameSession(); // 중요: 연결 후 세션 생성
});

// 3단계: CustomEvent 처리 패턴 (반드시 이 패턴 사용!)
sdk.on('session-created', (event) => {
    const session = event.detail || event;  // 반드시 이 패턴!
    this.displaySessionInfo(session);
});

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;     // 반드시 이 패턴!
    this.processSensorData(data);
});
```

### 2. 세션 정보 표시 및 QR 코드 생성 패턴

```javascript
async displaySessionInfo(session) {
    // 세션 코드 표시
    this.elements.sessionCode.textContent = session.sessionCode;
    
    // QR 코드 생성 (폴백 처리 포함)
    const sensorUrl = `${window.location.origin}/sensor.html?session=${session.sessionCode}`;
    try {
        const qrElement = await QRCodeGenerator.generateElement(sensorUrl, 200);
        this.elements.qrContainer.appendChild(qrElement);
    } catch (error) {
        console.warn('QR 코드 생성 실패, 폴백 표시:', error);
        this.elements.qrContainer.innerHTML = `
            <div class="qr-fallback">
                <p>QR 코드 대신 링크를 사용하세요:</p>
                <p><a href="${sensorUrl}" target="_blank">${sensorUrl}</a></p>
            </div>
        `;
    }
}
```

### 3. 게임 상태 관리 패턴

```javascript
class GameState {
    constructor() {
        this.connected = false;
        this.sessionCreated = false;
        this.sensorsConnected = [];
        this.gameRunning = false;
        this.gameData = {
            score: 0,
            level: 1,
            lives: 3
        };
    }
    
    updateSensorStatus(sensorId, connected) {
        const index = this.sensorsConnected.indexOf(sensorId);
        if (connected && index === -1) {
            this.sensorsConnected.push(sensorId);
        } else if (!connected && index !== -1) {
            this.sensorsConnected.splice(index, 1);
        }
        
        // UI 업데이트
        this.updateConnectionStatus();
    }
}
```

### 4. 센서 데이터 처리 최적화 패턴

```javascript
processSensorData(sensorData) {
    if (!this.state.gameRunning) return;
    
    // 데이터 검증
    if (!sensorData || !sensorData.data || !sensorData.data.orientation) {
        console.warn('Invalid sensor data received');
        return;
    }
    
    const { orientation, acceleration, rotationRate } = sensorData.data;
    
    // 게임 타입별 처리
    switch (this.gameType) {
        case 'solo':
            this.handleSoloSensorData(orientation, acceleration);
            break;
        case 'dual':
            this.handleDualSensorData(sensorData.sensorId, orientation, acceleration);
            break;
        case 'multi':
            this.handleMultiSensorData(sensorData.sensorId, orientation, acceleration);
            break;
    }
}

handleSoloSensorData(orientation, acceleration) {
    // 기울기 기반 플레이어 이동
    const tiltX = Math.max(-1, Math.min(1, orientation.gamma / 45)); // -45도~45도를 -1~1로 변환
    const tiltY = Math.max(-1, Math.min(1, orientation.beta / 45));
    
    // 플레이어 위치 업데이트
    this.gameData.player.velocityX += tiltX * 0.5;
    this.gameData.player.velocityY += tiltY * 0.5;
    
    // 속도 제한 및 마찰력 적용
    this.gameData.player.velocityX *= 0.98;
    this.gameData.player.velocityY *= 0.98;
}
```

### 5. 캔버스 렌더링 최적화 패턴

```javascript
class GameRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.lastTime = 0;
        this.fps = 60;
        this.fpsInterval = 1000 / this.fps;
    }
    
    start() {
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    gameLoop = (currentTime = performance.now()) => {
        const elapsed = currentTime - this.lastTime;
        
        if (elapsed > this.fpsInterval) {
            this.lastTime = currentTime - (elapsed % this.fpsInterval);
            
            // 게임 상태 업데이트
            this.update(elapsed);
            
            // 렌더링
            this.render();
        }
        
        if (this.running) {
            requestAnimationFrame(this.gameLoop);
        }
    }
    
    render() {
        // 캔버스 지우기
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 배경 렌더링
        this.renderBackground();
        
        // 게임 오브젝트 렌더링
        this.renderGameObjects();
        
        // UI 렌더링
        this.renderUI();
    }
}
```

### 6. 완벽한 HTML 구조 패턴

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>🎮 게임 제목</title>
    <style>
        /* 필수 기본 스타일 */
        body { margin: 0; padding: 0; overflow: hidden; background: #000; }
        .game-container { width: 100vw; height: 100vh; position: relative; }
        .session-overlay { position: absolute; top: 20px; right: 20px; z-index: 1000; }
        .game-canvas { display: block; margin: 0 auto; }
        .game-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    </style>
</head>
<body>
    <div class="game-container">
        <!-- 세션 정보 패널 -->
        <div class="session-overlay" id="session-panel">
            <div class="session-info">
                <h3>게임 세션</h3>
                <div class="session-code">
                    세션 코드: <strong id="session-code-display">-</strong>
                </div>
                <div class="qr-container" id="qr-container"></div>
            </div>
            <div class="connection-status">
                <div class="sensor-status">
                    센서: <span id="sensor-status">대기중</span>
                </div>
            </div>
            <button id="start-game-btn" disabled>게임 시작</button>
        </div>
        
        <!-- 게임 캔버스 -->
        <canvas id="game-canvas" width="1200" height="800"></canvas>
        
        <!-- 게임 오버레이 -->
        <div class="game-overlay" id="game-overlay">
            <div class="overlay-content">
                <h2 id="overlay-title">연결 대기중...</h2>
                <p id="overlay-message">QR 코드를 스캔하거나 세션 코드를 입력하세요</p>
            </div>
        </div>
    </div>
    
    <!-- 필수 스크립트 -->
    <script src="/socket.io/socket.io.js"></script>
    <script src="https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js"></script>
    <script src="/js/SessionSDK.js"></script>
</body>
</html>
```

### 7. 게임 로직 구현 패턴

```javascript
class Game {
    constructor() {
        this.initializeElements();
        this.initializeSDK();
        this.initializeGame();
        this.setupEventListeners();
    }
    
    initializeGame() {
        this.state = new GameState();
        this.renderer = new GameRenderer(this.elements.canvas);
        this.gameData = {
            player: { x: 600, y: 400, width: 30, height: 30, velocityX: 0, velocityY: 0 },
            objects: [],
            score: 0,
            level: 1
        };
    }
    
    startGame() {
        if (!this.state.sessionCreated || this.state.sensorsConnected.length === 0) {
            alert('센서가 연결되지 않았습니다.');
            return;
        }
        
        this.state.gameRunning = true;
        this.renderer.running = true;
        this.renderer.start();
        this.hideOverlay();
    }
    
    update(deltaTime) {
        if (!this.state.gameRunning) return;
        
        // 플레이어 위치 업데이트
        this.gameData.player.x += this.gameData.player.velocityX;
        this.gameData.player.y += this.gameData.player.velocityY;
        
        // 경계 체크
        this.checkBounds();
        
        // 충돌 체크
        this.checkCollisions();
        
        // 게임 오브젝트 업데이트
        this.updateGameObjects(deltaTime);
    }
}
```

## 🚫 절대 피해야 할 실수들

### 1. 연결 순서 실수
```javascript
// 잘못된 패턴 (실패 원인)
sdk.createSession(); // 연결 전 세션 생성 시도

// 올바른 패턴
sdk.on('connected', () => {
    sdk.createSession(); // 연결 후 세션 생성
});
```

### 2. CustomEvent 처리 실수
```javascript
// 잘못된 패턴 (undefined 오류)
sdk.on('session-created', (session) => {
    console.log(session.sessionCode); // undefined!
});

// 올바른 패턴
sdk.on('session-created', (event) => {
    const session = event.detail || event; // 반드시 이 패턴 사용
    console.log(session.sessionCode);
});
```

### 3. QR 코드 생성 실수
```javascript
// 잘못된 패턴 (라이브러리 로드 실패 시 오류)
const qr = QRCode.toCanvas(canvas, url);

// 올바른 패턴 (폴백 처리 포함)
try {
    const qrElement = await QRCodeGenerator.generateElement(url, 200);
    container.appendChild(qrElement);
} catch (error) {
    container.innerHTML = `<p>URL: ${url}</p>`;
}
```

## 📊 센서 데이터 활용 가이드

### 기울기 데이터 (Orientation)
- `alpha`: 0-360도 회전 (나침반)
- `beta`: -180~180도 앞뒤 기울기
- `gamma`: -90~90도 좌우 기울기

### 가속도 데이터 (Acceleration)
- `x`: 좌우 가속도 (-10~10 m/s²)
- `y`: 상하 가속도 (중력 포함)
- `z`: 앞뒤 가속도

### 활용 예시
```javascript
// 좌우 이동 (gamma 기울기 활용)
const moveX = Math.max(-1, Math.min(1, orientation.gamma / 45));
player.velocityX += moveX * acceleration;

// 점프 (z축 가속도 활용)
if (acceleration.z > 8) { // 위로 빠르게 움직일 때
    if (player.onGround) player.jump();
}

// 회전 (alpha 나침반 활용)
const rotation = (orientation.alpha * Math.PI) / 180;
player.angle = rotation;
```

## 🎯 게임 완성도 체크리스트

### 필수 구현 요소
- [ ] SessionSDK 올바른 초기화
- [ ] 서버 연결 후 세션 생성
- [ ] QR 코드 생성 (폴백 포함)
- [ ] 센서 연결 상태 표시
- [ ] CustomEvent 올바른 처리
- [ ] 게임 시작 버튼 활성화
- [ ] 센서 데이터 처리 로직
- [ ] 캔버스 렌더링 시스템
- [ ] 게임 오버 처리
- [ ] 점수 시스템

### 사용자 경험 요소
- [ ] 로딩 상태 표시
- [ ] 연결 오류 처리
- [ ] 게임 가이드/도움말
- [ ] 반응형 디자인
- [ ] 접근성 고려
- [ ] 성능 최적화

이 가이드를 따라 구현하면 100% 작동하는 센서 게임을 만들 수 있습니다.