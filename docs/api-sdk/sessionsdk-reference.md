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

## 📡 이벤트 레퍼런스

### 기본 SessionSDK 이벤트

| 이벤트명 | 트리거 시점 | 데이터 구조 | 설명 |
|---------|------------|-----------|------|
| `connected` | 서버 연결 성공 | `{ timestamp, serverInfo }` | WebSocket 서버 연결 완료 |
| `disconnected` | 서버 연결 해제 | `{ reason, timestamp }` | 연결 해제 시 발생 |
| `session-created` | 세션 생성 완료 | `{ sessionCode, qrCodeUrl, timestamp }` | 게임 세션 생성 성공 |
| `sensor-connected` | 센서 연결 | `{ sensorId, deviceInfo, timestamp }` | 모바일 센서 연결 |
| `sensor-disconnected` | 센서 연결 해제 | `{ sensorId, reason, timestamp }` | 센서 연결 종료 |
| `sensor-data` | 센서 데이터 수신 | `{ sensorId, data, timestamp }` | 실시간 센서 데이터 |
| `game-started` | 게임 시작 | `{ sessionCode, playerCount, timestamp }` | 게임 시작 신호 |
| `game-ended` | 게임 종료 | `{ sessionCode, results, duration }` | 게임 종료 및 결과 |
| `error` | 오류 발생 | `{ type, message, context, timestamp }` | 시스템 오류 |

### AI 확장 이벤트

| 이벤트록 | 트리거 시점 | 데이터 구조 | 설명 |
|---------|------------|-----------|------|
| `ai-context-updated` | 컨텍스트 변경 | `{ summary, importance, timestamp }` | AI 컨텍스트 업데이트 |
| `ai-analysis-complete` | 분석 완료 | `{ type, results, confidence }` | AI 분석 결과 |
| `conversation-optimized` | 대화 최적화 | `{ optimization, effectiveness }` | 대화 방식 개선 |
| `code-execution-complete` | 코드 실행 완료 | `{ code, result, executionTime }` | 동적 코드 실행 |
| `breakpoint-hit` | 브레이크포인트 도달 | `{ breakpoint, context, analysis }` | 디버깅 브레이크포인트 |
| `error-predicted` | 오류 예측 | `{ type, probability, prevention }` | AI 오류 예측 |
| `performance-alert` | 성능 경고 | `{ metric, current, target, severity }` | 성능 이슈 감지 |
| `satisfaction-alert` | 만족도 경고 | `{ level, score, factors, suggestions }` | 사용자 만족도 경고 |
| `intervention-applied` | 개입 적용 | `{ type, intervention, expectedEffect }` | 자동 개선 조치 |
| `learning-update` | 학습 업데이트 | `{ model, improvement, accuracy }` | AI 모델 학습 |

### 이벤트 사용 예제
```javascript
// 기본 이벤트
sdk.on('sensor-data', (event) => {
    const sensorData = event.detail || event;
    updateGameObject(sensorData);
});

// AI 분석 이벤트
sdk.on('ai-analysis-complete', (event) => {
    const analysis = event.detail || event;

    if (analysis.type === 'user-behavior') {
        adaptGameDifficulty(analysis.results.recommendedDifficulty);
    }
});

// 만족도 경고 이벤트
sdk.on('satisfaction-alert', (event) => {
    const alert = event.detail || event;

    if (alert.level === 'critical') {
        showHelpDialog(alert.suggestions);
    }
});

// 성능 이슈 이벤트
sdk.on('performance-alert', (event) => {
    const alert = event.detail || event;

    if (alert.metric === 'fps' && alert.severity === 'high') {
        reduceVisualEffects();
    }
});
```

---

## 📖 코드 예제 및 베스트 프랙티스

### 완전한 게임 초기화 템플릿
```javascript
class AIEnhancedGame {
    constructor(gameConfig) {
        this.config = {
            gameId: 'advanced-sensor-game',
            gameType: 'solo',

            // AI 기능 설정
            ai: {
                contextManagement: true,
                conversationOptimization: true,
                realTimeDebugging: true,
                satisfactionTracking: true,
                codeExecution: false // 보안상 비활성화
            },

            // 성능 목표
            performance: {
                targetFPS: 60,
                maxMemoryMB: 256,
                maxLatencyMS: 100
            },

            // 만족도 목표
            satisfaction: {
                targetScore: 0.8,
                alertThreshold: 0.5,
                interventionThreshold: 0.4
            },

            ...gameConfig
        };

        this.gameState = {
            phase: 'initializing',
            score: 0,
            level: 1,
            startTime: null,
            players: new Map(),
            objects: new Map()
        };

        this.initializeSDK();
    }

    async initializeSDK() {
        // AI 강화 SDK 생성
        this.sdk = new AIEnhancedSessionSDK({
            gameId: this.config.gameId,
            gameType: this.config.gameType,

            // AI 기능 활성화
            ...this.config.ai,

            // 성능 모니터링
            performanceMonitoring: {
                enabled: true,
                ...this.config.performance
            },

            // 만족도 추적
            satisfactionOptions: {
                ...this.config.satisfaction
            }
        });

        this.setupEventHandlers();
        await this.connect();
    }

    setupEventHandlers() {
        // 기본 이벤트
        this.sdk.on('connected', this.onConnected.bind(this));
        this.sdk.on('session-created', this.onSessionCreated.bind(this));
        this.sdk.on('sensor-connected', this.onSensorConnected.bind(this));
        this.sdk.on('sensor-data', this.onSensorData.bind(this));
        this.sdk.on('error', this.onError.bind(this));

        // AI 이벤트
        this.sdk.on('ai-analysis-complete', this.onAIAnalysis.bind(this));
        this.sdk.on('satisfaction-alert', this.onSatisfactionAlert.bind(this));
        this.sdk.on('performance-alert', this.onPerformanceAlert.bind(this));
        this.sdk.on('intervention-applied', this.onInterventionApplied.bind(this));
    }

    async onConnected() {
        console.log('✅ 서버 연결 성공');

        // AI 컨텍스트 초기화
        if (this.sdk.contextManager) {
            await this.sdk.contextManager.initializeGlobalContext({
                gameId: this.config.gameId,
                version: '6.0.0',
                features: Object.keys(this.config.ai).filter(k => this.config.ai[k])
            });
        }

        // 세션 생성
        await this.sdk.createSession();
    }

    onSessionCreated(event) {
        const session = event.detail || event;
        console.log('🎮 세션 생성:', session.sessionCode);

        // UI 업데이트
        this.updateUI('session-info', {
            sessionCode: session.sessionCode,
            qrCode: session.qrCodeUrl
        });

        // 만족도 추적 시작
        if (this.sdk.satisfactionTracker) {
            this.sdk.satisfactionTracker.startTracking(session.sessionCode, {
                trackingMode: 'comprehensive',
                autoIntervention: true
            });
        }

        this.gameState.phase = 'waiting-for-sensors';
    }

    onSensorConnected(event) {
        const sensorInfo = event.detail || event;
        console.log('📱 센서 연결:', sensorInfo.sensorId);

        this.gameState.players.set(sensorInfo.sensorId, {
            id: sensorInfo.sensorId,
            connected: true,
            lastData: null,
            performance: {
                accuracy: 0,
                responseTime: 0,
                consistency: 0
            }
        });

        // 게임 시작 가능 여부 확인
        this.checkGameStartReady();
    }

    onSensorData(event) {
        const sensorData = event.detail || event;

        // 데이터 유효성 검사
        if (!this.validateSensorData(sensorData)) {
            console.warn('잘못된 센서 데이터:', sensorData);
            return;
        }

        // 플레이어 데이터 업데이트
        const player = this.gameState.players.get(sensorData.sensorId);
        if (player) {
            player.lastData = sensorData;
            this.updatePlayerPerformance(player, sensorData);
        }

        // 게임 로직 처리
        if (this.gameState.phase === 'playing') {
            this.processGameplay(sensorData);
        }

        // 만족도 추적
        if (this.sdk.satisfactionTracker) {
            this.trackSensorInteraction(sensorData);
        }
    }

    async onAIAnalysis(event) {
        const analysis = event.detail || event;

        switch (analysis.type) {
            case 'user-behavior':
                await this.handleBehaviorAnalysis(analysis);
                break;
            case 'performance-prediction':
                await this.handlePerformancePrediction(analysis);
                break;
            case 'difficulty-recommendation':
                await this.handleDifficultyRecommendation(analysis);
                break;
        }
    }

    onSatisfactionAlert(event) {
        const alert = event.detail || event;

        console.log('🚨 만족도 경고:', alert.level, alert.score);

        if (alert.level === 'critical') {
            this.handleCriticalSatisfaction(alert);
        } else if (alert.level === 'warning') {
            this.handleLowSatisfaction(alert);
        }
    }

    onPerformanceAlert(event) {
        const alert = event.detail || event;

        console.log('⚡ 성능 경고:', alert.metric, alert.current);

        // 자동 최적화 시도
        this.optimizePerformance(alert.metric, alert.severity);
    }

    // 게임 주요 메서드들...
    async startGame() {
        if (this.gameState.phase !== 'ready') {
            console.warn('게임 시작 조건 미충족');
            return;
        }

        this.gameState.phase = 'playing';
        this.gameState.startTime = Date.now();

        // AI 컨텍스트에 게임 시작 기록
        if (this.sdk.contextManager) {
            this.sdk.contextManager.addContext(this.sdk.sessionCode, {
                type: 'game-lifecycle',
                event: 'game-started',
                data: {
                    playerCount: this.gameState.players.size,
                    difficulty: this.config.difficulty,
                    timestamp: this.gameState.startTime
                }
            });
        }

        this.startGameLoop();

        // 게임 시작 이벤트 발생
        this.sdk.emit('game-started', {
            sessionCode: this.sdk.sessionCode,
            playerCount: this.gameState.players.size,
            timestamp: this.gameState.startTime
        });
    }

    checkGameStartReady() {
        const requiredSensors = this.config.gameType === 'solo' ? 1 :
                              this.config.gameType === 'dual' ? 2 :
                              this.config.maxPlayers || 4;

        const connectedSensors = Array.from(this.gameState.players.values())
            .filter(p => p.connected).length;

        if (connectedSensors >= requiredSensors) {
            this.gameState.phase = 'ready';
            this.showStartButton(true);
        } else {
            this.updateConnectionStatus(connectedSensors, requiredSensors);
        }
    }

    // 사용자 만족도 추적
    trackSensorInteraction(sensorData) {
        const responseTime = Date.now() - sensorData.timestamp;
        const accuracy = this.calculateAccuracy(sensorData);

        this.sdk.satisfactionTracker.trackUserInteraction(this.sdk.sessionCode, {
            type: 'sensor-input',
            sensorId: sensorData.sensorId,
            performance: {
                responseTime: responseTime,
                accuracy: accuracy
            },
            context: {
                gamePhase: this.gameState.phase,
                currentScore: this.gameState.score,
                difficulty: this.getCurrentDifficulty()
            }
        });
    }

    // 클린업
    async cleanup() {
        if (this.gameState.phase === 'playing') {
            this.endGame();
        }

        if (this.sdk) {
            await this.sdk.disconnect();
        }

        // 리소스 정리
        this.gameState.players.clear();
        this.gameState.objects.clear();
    }
}

// 게임 인스턴스 생성 및 시작
const game = new AIEnhancedGame({
    gameType: 'solo',
    difficulty: 0.5,

    ai: {
        contextManagement: true,
        conversationOptimization: true,
        realTimeDebugging: true,
        satisfactionTracking: true
    },

    performance: {
        targetFPS: 60,
        maxMemoryMB: 128
    }
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    game.cleanup();
});
```

### 베스트 프랙티스

1. **이벤트 처리 패턴**
   ```javascript
   // ✅ 올바른 패턴
   sdk.on('sensor-data', (event) => {
       const data = event.detail || event; // CustomEvent 대응
       processData(data);
   });

   // ❌ 피해야 할 패턴
   sdk.on('sensor-data', (data) => {
       processData(data); // CustomEvent 미대응
   });
   ```

2. **AI 기능 선택적 활성화**
   ```javascript
   // ✅ 개발 단계에서
   const sdk = new AIEnhancedSessionSDK({
       enableRealTimeDebugging: true,
       enableSatisfactionTracking: true,
       enableCodeExecution: false // 보안상 비활성화
   });

   // ✅ 프로덕션에서
   const sdk = new AIEnhancedSessionSDK({
       enableRealTimeDebugging: false,
       enableSatisfactionTracking: true,
       enableCodeExecution: false
   });
   ```

3. **오류 처리**
   ```javascript
   // ✅ 체계적인 오류 처리
   try {
       await sdk.createSession();
   } catch (error) {
       if (error.type === 'NETWORK_ERROR') {
           showRetryDialog();
       } else if (error.type === 'SESSION_LIMIT_EXCEEDED') {
           showWaitingQueue();
       } else {
           logErrorToAnalytics(error);
           showGenericError();
       }
   }
   ```

4. **성능 최적화**
   ```javascript
   // ✅ 데이터 배치 처리
   const sensorDataBatch = [];

   sdk.on('sensor-data', (event) => {
       sensorDataBatch.push(event.detail || event);

       if (sensorDataBatch.length >= 10) {
           processBatchedSensorData(sensorDataBatch);
           sensorDataBatch.length = 0; // 배열 초기화
       }
   });
   ```

5. **메모리 관리**
   ```javascript
   // ✅ 리소스 정리
   class GameManager {
       constructor() {
           this.gameObjects = new Map();
           this.particleSystems = [];
       }

       cleanup() {
           // 게임 오브젝트 정리
           this.gameObjects.clear();

           // 파티클 시스템 정리
           this.particleSystems.forEach(ps => ps.destroy());
           this.particleSystems.length = 0;

           // SDK 정리
           if (this.sdk) {
               this.sdk.removeAllListeners();
               this.sdk.disconnect();
           }
       }
   }
   ```

---

🎆 **이 완전한 AI 통합 SessionSDK를 사용하면 단순한 센서 게임에서 지능형 게임 플랫폼으로 진화할 수 있습니다!**