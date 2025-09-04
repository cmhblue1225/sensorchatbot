# 📡 SessionSDK 통합 패턴 완벽 가이드

## 🔄 SessionSDK 라이프사이클

### 1. 초기화 단계
```javascript
// Step 1: SDK 인스턴스 생성
const sdk = new SessionSDK({
    gameId: 'your-game-id',     // 고유한 게임 ID
    gameType: 'solo',           // 'solo', 'dual', 'multi'
    maxSensors: 1               // 최대 센서 수 (solo:1, dual:2, multi:10)
});

// Step 2: 이벤트 리스너 등록 (연결 전에 미리 설정)
sdk.on('connected', async () => {
    console.log('✅ 서버 연결 성공');
    // 연결 성공 후 세션 생성
    await sdk.createSession();
});

// Step 3: 서버 연결 시작
await sdk.connect();
```

### 2. 세션 생성 및 관리
```javascript
sdk.on('session-created', (event) => {
    // 중요: CustomEvent 처리 패턴
    const session = event.detail || event;
    
    console.log('🎮 세션 생성됨:', session.sessionCode);
    
    // UI 업데이트
    document.getElementById('session-code').textContent = session.sessionCode;
    
    // QR 코드 생성
    generateQRCode(session);
    
    // 센서 연결 대기 상태로 변경
    updateGameStatus('센서 연결 대기 중...');
});

async function generateQRCode(session) {
    const sensorUrl = `${window.location.origin}/sensor.html?session=${session.sessionCode}`;
    const qrContainer = document.getElementById('qr-container');
    
    try {
        // QRCodeGenerator 클래스 사용 (폴백 포함)
        const qrElement = await QRCodeGenerator.generateElement(sensorUrl, 200);
        qrContainer.innerHTML = '';
        qrContainer.appendChild(qrElement);
    } catch (error) {
        console.warn('QR 생성 실패, 텍스트 링크 표시:', error);
        qrContainer.innerHTML = `
            <div class="qr-fallback">
                <p>QR 코드를 읽을 수 없는 경우:</p>
                <a href="${sensorUrl}" target="_blank">${sensorUrl}</a>
            </div>
        `;
    }
}
```

### 3. 센서 연결 관리
```javascript
// 센서 연결 이벤트
sdk.on('sensor-connected', (event) => {
    const sensorInfo = event.detail || event;
    console.log('📱 센서 연결:', sensorInfo.sensorId);
    
    // 연결된 센서 목록 업데이트
    updateSensorStatus(sensorInfo.sensorId, true);
    
    // 게임 시작 가능 여부 확인
    checkGameStartReady();
});

// 센서 연결 해제 이벤트
sdk.on('sensor-disconnected', (event) => {
    const sensorInfo = event.detail || event;
    console.log('📱 센서 연결 해제:', sensorInfo.sensorId);
    
    updateSensorStatus(sensorInfo.sensorId, false);
    checkGameStartReady();
});

function updateSensorStatus(sensorId, connected) {
    const statusElement = document.getElementById(`${sensorId}-status`);
    if (statusElement) {
        statusElement.textContent = connected ? '연결됨' : '연결 해제됨';
        statusElement.className = connected ? 'sensor-connected' : 'sensor-disconnected';
    }
}

function checkGameStartReady() {
    const requiredSensors = sdk.maxSensors;
    const connectedSensors = sdk.getConnectedSensors().length;
    const startButton = document.getElementById('start-game-btn');
    
    if (connectedSensors >= requiredSensors) {
        startButton.disabled = false;
        startButton.textContent = '게임 시작';
        updateGameStatus('게임 시작 준비 완료!');
    } else {
        startButton.disabled = true;
        startButton.textContent = `센서 ${connectedSensors}/${requiredSensors} 연결됨`;
        updateGameStatus(`센서 연결 대기 중 (${connectedSensors}/${requiredSensors})`);
    }
}
```

### 4. 센서 데이터 처리
```javascript
sdk.on('sensor-data', (event) => {
    // CustomEvent 처리 패턴
    const sensorData = event.detail || event;
    
    // 데이터 유효성 검사
    if (!validateSensorData(sensorData)) {
        console.warn('잘못된 센서 데이터:', sensorData);
        return;
    }
    
    // 게임 상태에 따른 처리
    if (gameState.isRunning) {
        processSensorDataForGame(sensorData);
    }
});

function validateSensorData(data) {
    return data && 
           data.sensorId && 
           data.data && 
           data.data.orientation && 
           typeof data.data.orientation.alpha === 'number' &&
           typeof data.data.orientation.beta === 'number' &&
           typeof data.data.orientation.gamma === 'number';
}

function processSensorDataForGame(sensorData) {
    const { sensorId, data } = sensorData;
    const { orientation, acceleration, rotationRate } = data;
    
    // 게임 타입별 처리
    switch (gameConfig.type) {
        case 'solo':
            handleSoloSensorInput(orientation, acceleration);
            break;
        case 'dual':
            handleDualSensorInput(sensorId, orientation, acceleration);
            break;
        case 'multi':
            handleMultiSensorInput(sensorId, orientation, acceleration);
            break;
    }
}
```

### 5. 게임 시작 및 제어
```javascript
async function startGame() {
    // 전제 조건 확인
    if (!sdk.isConnected()) {
        alert('서버에 연결되지 않았습니다.');
        return;
    }
    
    if (!sdk.hasSession()) {
        alert('게임 세션이 생성되지 않았습니다.');
        return;
    }
    
    if (sdk.getConnectedSensors().length < sdk.maxSensors) {
        alert('필요한 센서가 모두 연결되지 않았습니다.');
        return;
    }
    
    // 게임 시작
    gameState.isRunning = true;
    gameState.startTime = Date.now();
    
    // 게임 시작 신호 전송
    sdk.emit('game-started', {
        sessionCode: sdk.sessionCode,
        timestamp: gameState.startTime
    });
    
    // UI 업데이트
    hideSessionOverlay();
    showGameCanvas();
    startGameLoop();
    
    updateGameStatus('게임 진행 중...');
}

function pauseGame() {
    gameState.isRunning = false;
    sdk.emit('game-paused', {
        sessionCode: sdk.sessionCode,
        timestamp: Date.now()
    });
    updateGameStatus('게임 일시정지');
}

function endGame(results) {
    gameState.isRunning = false;
    gameState.endTime = Date.now();
    
    // 게임 결과 전송
    sdk.emit('game-ended', {
        sessionCode: sdk.sessionCode,
        results: results,
        duration: gameState.endTime - gameState.startTime
    });
    
    // 결과 화면 표시
    showGameResults(results);
}
```

### 6. 에러 처리 및 재연결
```javascript
// 연결 오류 처리
sdk.on('connection-error', (event) => {
    const error = event.detail || event;
    console.error('❌ 연결 오류:', error);
    
    updateGameStatus('서버 연결 오류가 발생했습니다.');
    showRetryButton();
});

// 세션 오류 처리
sdk.on('session-error', (event) => {
    const error = event.detail || event;
    console.error('❌ 세션 오류:', error);
    
    updateGameStatus('세션 생성에 실패했습니다.');
    showRetryButton();
});

// 재연결 시도
async function retryConnection() {
    updateGameStatus('다시 연결 중...');
    hideRetryButton();
    
    try {
        await sdk.disconnect();
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
        await sdk.connect();
    } catch (error) {
        console.error('재연결 실패:', error);
        updateGameStatus('재연결에 실패했습니다.');
        showRetryButton();
    }
}
```

### 7. 정리 및 리소스 해제
```javascript
// 페이지 종료 시 정리
window.addEventListener('beforeunload', () => {
    if (sdk) {
        sdk.disconnect();
    }
});

// 게임 종료 시 정리
function cleanupGame() {
    // 게임 루프 중단
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
    }
    
    // SDK 정리
    if (sdk) {
        sdk.removeAllListeners();
        sdk.disconnect();
    }
    
    // 게임 상태 초기화
    gameState.reset();
}
```

## 🎯 완벽한 통합 템플릿

### HTML 구조
```html
<div class="game-container">
    <!-- 세션 정보 패널 -->
    <div class="session-overlay" id="session-panel">
        <div class="session-info">
            <h3>게임 세션</h3>
            <div class="session-code">
                세션 코드: <strong id="session-code">-</strong>
            </div>
            <div class="qr-container" id="qr-container"></div>
        </div>
        <div class="connection-status" id="connection-status">
            <!-- 동적으로 생성되는 센서 상태 -->
        </div>
        <button id="start-game-btn" disabled>게임 시작</button>
    </div>
    
    <!-- 게임 화면 -->
    <canvas id="game-canvas" width="1200" height="800"></canvas>
    
    <!-- 상태 메시지 -->
    <div class="game-status" id="game-status">서버 연결 중...</div>
</div>
```

### CSS 스타일
```css
.session-overlay {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 20px;
    border-radius: 10px;
    z-index: 1000;
}

.sensor-connected { color: #4CAF50; }
.sensor-disconnected { color: #f44336; }

.game-status {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
}
```

### JavaScript 초기화
```javascript
class Game {
    constructor() {
        this.sdk = new SessionSDK({
            gameId: 'my-awesome-game',
            gameType: 'solo',
            maxSensors: 1
        });
        
        this.gameState = {
            isRunning: false,
            score: 0,
            level: 1
        };
        
        this.setupSDKEvents();
        this.setupUIEvents();
        this.initialize();
    }
    
    setupSDKEvents() {
        this.sdk.on('connected', this.onServerConnected.bind(this));
        this.sdk.on('session-created', this.onSessionCreated.bind(this));
        this.sdk.on('sensor-connected', this.onSensorConnected.bind(this));
        this.sdk.on('sensor-data', this.onSensorData.bind(this));
        this.sdk.on('connection-error', this.onConnectionError.bind(this));
    }
    
    async initialize() {
        try {
            await this.sdk.connect();
        } catch (error) {
            console.error('초기화 실패:', error);
            this.updateGameStatus('초기화에 실패했습니다.');
        }
    }
}

// 게임 시작
const game = new Game();
```

이 패턴을 따르면 100% 완벽하게 작동하는 센서 게임을 개발할 수 있습니다.