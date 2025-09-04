# 🔧 센서 게임 문제 해결 가이드

## 🚨 가장 흔한 오류들과 해결법

### 1. "서버에 연결되지 않았습니다" 오류

#### 원인
```javascript
// 잘못된 패턴: 연결 전 세션 생성 시도
const sdk = new SessionSDK({...});
sdk.createSession(); // ❌ 연결 전 세션 생성 시도
```

#### 해결법
```javascript
// 올바른 패턴: 연결 완료 후 세션 생성
const sdk = new SessionSDK({...});

sdk.on('connected', async () => {
    console.log('✅ 서버 연결 완료');
    await sdk.createSession(); // ✅ 연결 후 세션 생성
});

await sdk.connect();
```

### 2. 세션 코드가 undefined인 오류

#### 원인
```javascript
// 잘못된 CustomEvent 처리
sdk.on('session-created', (session) => {
    console.log(session.sessionCode); // ❌ undefined!
});
```

#### 해결법
```javascript
// 올바른 CustomEvent 처리 패턴
sdk.on('session-created', (event) => {
    const session = event.detail || event; // ✅ 반드시 이 패턴 사용!
    console.log(session.sessionCode); // ✅ 정상 작동
});
```

### 3. QR 코드가 생성되지 않는 오류

#### 원인
- QRCode 라이브러리 로드 실패
- 잘못된 URL 형식
- 에러 처리 누락

#### 해결법
```javascript
async function generateQRCode(session) {
    const sensorUrl = `${window.location.origin}/sensor.html?session=${session.sessionCode}`;
    const qrContainer = document.getElementById('qr-container');
    
    try {
        // QRCodeGenerator 클래스 사용 (안전한 방식)
        const qrElement = await QRCodeGenerator.generateElement(sensorUrl, 200);
        qrContainer.innerHTML = '';
        qrContainer.appendChild(qrElement);
    } catch (error) {
        console.warn('QR 생성 실패, 폴백 처리:', error);
        // 폴백: 텍스트 링크 표시
        qrContainer.innerHTML = `
            <div class="qr-fallback">
                <p>QR 코드를 스캔할 수 없는 경우:</p>
                <a href="${sensorUrl}" target="_blank">${sensorUrl}</a>
            </div>
        `;
    }
}
```

### 4. 센서 데이터를 받지 못하는 오류

#### 원인
- 센서 권한 미승인
- 잘못된 이벤트 리스너
- 데이터 유효성 검사 누락

#### 해결법
```javascript
// 센서 데이터 처리 패턴
sdk.on('sensor-data', (event) => {
    const sensorData = event.detail || event; // CustomEvent 패턴
    
    // 데이터 유효성 검사
    if (!validateSensorData(sensorData)) {
        console.warn('잘못된 센서 데이터:', sensorData);
        return;
    }
    
    // 게임 상태 확인
    if (!gameState.isRunning) {
        return; // 게임이 실행 중이 아니면 무시
    }
    
    processSensorData(sensorData);
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
```

### 5. 게임 시작 버튼이 활성화되지 않는 오류

#### 원인
- 센서 연결 상태 확인 로직 누락
- 이벤트 리스너 등록 순서 잘못

#### 해결법
```javascript
function checkGameStartReady() {
    const requiredSensors = sdk.maxSensors;
    const connectedSensors = sdk.getConnectedSensors().length;
    const startButton = document.getElementById('start-game-btn');
    
    console.log(`센서 상태: ${connectedSensors}/${requiredSensors}`);
    
    if (connectedSensors >= requiredSensors) {
        startButton.disabled = false;
        startButton.textContent = '게임 시작';
        startButton.style.backgroundColor = '#4CAF50';
    } else {
        startButton.disabled = true;
        startButton.textContent = `센서 ${connectedSensors}/${requiredSensors} 연결됨`;
        startButton.style.backgroundColor = '#666';
    }
}

// 센서 연결/해제 시 항상 체크
sdk.on('sensor-connected', () => {
    checkGameStartReady();
});

sdk.on('sensor-disconnected', () => {
    checkGameStartReady();
});
```

### 6. 캔버스 렌더링이 안 되는 오류

#### 원인
- 캔버스 크기 설정 문제
- 렌더링 루프 시작 실패
- 컨텍스트 획득 실패

#### 해결법
```javascript
function initializeCanvas() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        console.error('❌ Canvas 2D 컨텍스트를 가져올 수 없습니다');
        return false;
    }
    
    // 캔버스 크기 설정
    const container = canvas.parentElement;
    canvas.width = Math.min(1200, container.clientWidth - 40);
    canvas.height = Math.min(800, container.clientHeight - 40);
    
    // 고해상도 디스플레이 지원
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    return true;
}

function startGameLoop() {
    if (!initializeCanvas()) {
        console.error('캔버스 초기화 실패');
        return;
    }
    
    let lastTime = 0;
    
    function gameLoop(currentTime) {
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        // 게임 업데이트
        if (gameState.isRunning) {
            updateGame(deltaTime);
            renderGame();
        }
        
        // 다음 프레임 요청
        gameState.animationId = requestAnimationFrame(gameLoop);
    }
    
    gameLoop(0);
}
```

### 7. 모바일 센서 권한 문제

#### 센서 권한 요청 코드 (sensor.html에 포함)
```javascript
async function requestSensorPermissions() {
    const statusDiv = document.getElementById('sensor-status');
    
    try {
        // iOS 13+ DeviceMotionEvent 권한 요청
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            statusDiv.textContent = '센서 권한을 요청 중...';
            
            const permission = await DeviceMotionEvent.requestPermission();
            if (permission !== 'granted') {
                throw new Error('센서 권한이 거부되었습니다');
            }
        }
        
        // 센서 이벤트 리스너 등록
        window.addEventListener('deviceorientation', handleOrientation, true);
        window.addEventListener('devicemotion', handleMotion, true);
        
        statusDiv.textContent = '센서가 활성화되었습니다';
        statusDiv.style.color = '#4CAF50';
        
        return true;
    } catch (error) {
        console.error('센서 권한 요청 실패:', error);
        statusDiv.textContent = '센서 권한 요청 실패: ' + error.message;
        statusDiv.style.color = '#f44336';
        return false;
    }
}
```

## 🔍 디버깅 도구

### 1. 연결 상태 모니터링
```javascript
function createDebugPanel() {
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 10px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        max-width: 300px;
    `;
    document.body.appendChild(debugPanel);
    
    setInterval(() => {
        debugPanel.innerHTML = `
            <div>서버 연결: ${sdk.isConnected() ? '✅' : '❌'}</div>
            <div>세션 생성: ${sdk.hasSession() ? '✅' : '❌'}</div>
            <div>세션 코드: ${sdk.sessionCode || 'N/A'}</div>
            <div>연결된 센서: ${sdk.getConnectedSensors().length}/${sdk.maxSensors}</div>
            <div>게임 상태: ${gameState.isRunning ? '실행 중' : '대기 중'}</div>
        `;
    }, 1000);
}

// 개발 모드에서만 활성화
if (window.location.hostname === 'localhost') {
    createDebugPanel();
}
```

### 2. 센서 데이터 로깅
```javascript
let sensorDataLog = [];
const MAX_LOG_SIZE = 100;

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    
    // 로그에 추가
    sensorDataLog.push({
        timestamp: Date.now(),
        sensorId: data.sensorId,
        orientation: data.data.orientation,
        acceleration: data.data.acceleration
    });
    
    // 로그 크기 제한
    if (sensorDataLog.length > MAX_LOG_SIZE) {
        sensorDataLog.shift();
    }
    
    // 콘솔에 실시간 출력 (개발 모드)
    if (window.location.hostname === 'localhost') {
        console.log('센서 데이터:', {
            gamma: data.data.orientation.gamma.toFixed(2),
            beta: data.data.orientation.beta.toFixed(2),
            alpha: data.data.orientation.alpha.toFixed(2)
        });
    }
});

// 센서 데이터 내보내기 함수
function exportSensorData() {
    const blob = new Blob([JSON.stringify(sensorDataLog, null, 2)], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sensor-data.json';
    a.click();
}
```

### 3. 성능 모니터링
```javascript
class PerformanceMonitor {
    constructor() {
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.memoryUsage = 0;
    }
    
    update() {
        this.frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            // 메모리 사용량 (Chrome에서만 작동)
            if (performance.memory) {
                this.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576);
            }
        }
    }
    
    render(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, 10, 200, 60);
        ctx.fillStyle = 'white';
        ctx.font = '14px monospace';
        ctx.fillText(`FPS: ${this.fps}`, 20, 30);
        ctx.fillText(`Memory: ${this.memoryUsage}MB`, 20, 50);
    }
}

// 사용 예시
const perfMonitor = new PerformanceMonitor();

function renderGame() {
    // 게임 렌더링 코드...
    
    // 성능 정보 업데이트 및 표시
    perfMonitor.update();
    perfMonitor.render(ctx);
}
```

## ✅ 테스트 체크리스트

### 기본 기능 테스트
- [ ] 페이지 로드 시 "서버 연결 중..." 메시지 표시
- [ ] 서버 연결 완료 후 세션 코드 생성
- [ ] QR 코드 정상 생성 또는 폴백 링크 표시
- [ ] 센서 연결 시 상태 업데이트
- [ ] 필요한 센서 수 만족 시 게임 시작 버튼 활성화
- [ ] 게임 시작 시 오버레이 숨김 및 캔버스 표시
- [ ] 센서 데이터 실시간 수신 및 처리
- [ ] 게임 종료 시 결과 표시

### 오류 상황 테스트
- [ ] 서버 연결 실패 시 오류 메시지 표시
- [ ] 세션 생성 실패 시 재시도 옵션 제공
- [ ] QR 라이브러리 로드 실패 시 폴백 처리
- [ ] 센서 권한 거부 시 안내 메시지
- [ ] 센서 연결 해제 시 게임 일시정지
- [ ] 네트워크 끊김 시 재연결 시도

### 브라우저 호환성 테스트
- [ ] Chrome (데스크톱/모바일)
- [ ] Safari (iOS)
- [ ] Firefox
- [ ] Edge

이 가이드를 참고하여 모든 문제를 사전에 방지하고 완벽한 센서 게임을 개발하세요!