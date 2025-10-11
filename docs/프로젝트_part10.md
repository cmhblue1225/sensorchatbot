## Part 10: 트러블슈팅 & FAQ

이 섹션에서는 게임 개발 중 자주 발생하는 문제들과 해결 방법을 다룹니다.

### 10.1 일반적인 문제 및 해결

#### 10.1.1 서버 연결 문제

**문제: "서버에 연결할 수 없습니다"**

```javascript
// ❌ 증상
Error: Cannot connect to server at http://localhost:3000
```

**해결 방법:**

```bash
# 1. 서버가 실행 중인지 확인
ps aux | grep "node server/index.js"

# 2. 서버 포트가 이미 사용 중인지 확인
lsof -i :3000

# 3. 기존 프로세스 종료
kill -9 <PID>

# 4. 서버 재시작
cd /Users/dev/졸업작품/sensorchatbot
npm start
```

**예방:**

```javascript
// SDK 초기화 시 타임아웃 설정
const sdk = new SessionSDK({
    gameId: 'your-game',
    gameType: 'solo',
    serverUrl: 'http://localhost:3000',
    connectionTimeout: 5000  // 5초 타임아웃
});

sdk.on('connect_error', (error) => {
    console.error('연결 실패:', error);
    showErrorMessage('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
});
```

---

**문제: "WebSocket 연결이 자주 끊김"**

**원인:**
- 네트워크 불안정
- 방화벽 차단
- 서버 과부하

**해결 방법:**

```javascript
// 자동 재연결 로직 구현
class RobustSDK extends SessionSDK {
    constructor(options) {
        super(options);
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        this.on('disconnect', () => {
            this.handleDisconnect();
        });
    }

    handleDisconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

            console.log(`재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts} (${delay}ms 후)...`);

            setTimeout(() => {
                this.socket.connect();
            }, delay);
        } else {
            console.error('최대 재연결 시도 횟수 초과');
            showErrorMessage('서버와의 연결이 끊어졌습니다. 페이지를 새로고침해주세요.');
        }
    }
}

// 사용
const sdk = new RobustSDK({ gameId: 'your-game', gameType: 'solo' });
```

---

#### 10.1.2 세션 관련 문제

**문제: "세션 코드가 undefined 또는 null"**

```javascript
// ❌ 잘못된 코드
sdk.on('session-created', (session) => {
    console.log(session.sessionCode);  // undefined!
});
```

**원인:** CustomEvent 처리 누락

**해결 방법:**

```javascript
// ✅ 올바른 코드
sdk.on('session-created', (event) => {
    const session = event.detail || event;  // CustomEvent 처리
    console.log('세션 코드:', session.sessionCode);
});
```

---

**문제: "세션을 찾을 수 없습니다"**

```javascript
// ❌ 증상
Error: 세션을 찾을 수 없습니다: 1234
```

**원인:**
- 세션이 만료됨 (30분 타임아웃)
- 잘못된 세션 코드 입력
- 서버 재시작으로 세션 초기화

**해결 방법:**

```javascript
// 세션 유효성 확인
async function validateSession(sessionCode) {
    try {
        const response = await fetch(`/api/session/validate/${sessionCode}`);
        const data = await response.json();

        if (!data.valid) {
            showErrorMessage('세션이 만료되었거나 존재하지 않습니다. 새 세션을 생성해주세요.');
            return false;
        }

        return true;
    } catch (error) {
        console.error('세션 검증 실패:', error);
        return false;
    }
}

// 센서 연결 전 검증
async function connectSensor(sessionCode) {
    if (!await validateSession(sessionCode)) {
        return;
    }

    // 센서 연결 로직...
}
```

---

#### 10.1.3 센서 데이터 문제

**문제: "센서 데이터가 수신되지 않음"**

**진단 체크리스트:**

```javascript
// 1. 센서 권한 확인
if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    const permission = await DeviceOrientationEvent.requestPermission();
    if (permission !== 'granted') {
        console.error('센서 권한이 거부되었습니다');
        return;
    }
}

// 2. 센서 API 지원 확인
if (!('DeviceOrientationEvent' in window)) {
    console.error('이 기기는 센서를 지원하지 않습니다');
    return;
}

// 3. HTTPS 환경 확인 (iOS 필수)
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    console.warn('iOS에서는 HTTPS 환경이 필요합니다');
}

// 4. 센서 이벤트 리스너 확인
window.addEventListener('deviceorientation', (event) => {
    if (event.alpha === null && event.beta === null && event.gamma === null) {
        console.error('센서 데이터가 null입니다. 센서가 활성화되지 않았을 수 있습니다.');
    } else {
        console.log('센서 작동 확인:', event);
    }
}, { once: true });
```

**해결 방법:**

```javascript
// 포괄적인 센서 초기화 함수
async function initSensors() {
    console.log('🔍 센서 초기화 시작...');

    // Step 1: 브라우저 지원 확인
    if (!('DeviceOrientationEvent' in window)) {
        throw new Error('이 기기는 센서를 지원하지 않습니다.');
    }

    // Step 2: iOS 권한 요청
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        console.log('iOS 센서 권한 요청...');
        const permission = await DeviceOrientationEvent.requestPermission();

        if (permission !== 'granted') {
            throw new Error('센서 권한이 거부되었습니다. 설정에서 권한을 허용해주세요.');
        }

        console.log('✅ 센서 권한 승인');
    }

    // Step 3: 센서 데이터 테스트
    return new Promise((resolve, reject) => {
        let timeout = setTimeout(() => {
            reject(new Error('센서 데이터를 받을 수 없습니다. 기기를 움직여보세요.'));
        }, 5000);

        const testHandler = (event) => {
            if (event.alpha !== null || event.beta !== null || event.gamma !== null) {
                clearTimeout(timeout);
                window.removeEventListener('deviceorientation', testHandler);
                console.log('✅ 센서 작동 확인');
                resolve();
            }
        };

        window.addEventListener('deviceorientation', testHandler);
    });
}

// 사용 예시
try {
    await initSensors();
    console.log('센서 초기화 완료. 게임을 시작할 수 있습니다.');
} catch (error) {
    console.error('센서 초기화 실패:', error);
    alert(error.message);
}
```

---

**문제: "센서 값이 너무 민감하거나 둔함"**

**해결 방법: 감도 조절**

```javascript
// 설정 가능한 센서 프로세서
class ConfigurableSensorProcessor {
    constructor(config = {}) {
        this.sensitivity = config.sensitivity || 1.0;  // 0.1 ~ 2.0
        this.deadZone = config.deadZone || 5;          // 도 단위
        this.smoothing = config.smoothing || 0.3;       // 0 ~ 1

        this.lastValue = { gamma: 0, beta: 0 };
    }

    process(orientation) {
        let { gamma, beta } = orientation;

        // 1. 데드존 적용
        if (Math.abs(gamma) < this.deadZone) gamma = 0;
        if (Math.abs(beta) < this.deadZone) beta = 0;

        // 2. 감도 적용
        gamma *= this.sensitivity;
        beta *= this.sensitivity;

        // 3. 스무딩 적용 (Exponential Moving Average)
        gamma = this.lastValue.gamma * (1 - this.smoothing) + gamma * this.smoothing;
        beta = this.lastValue.beta * (1 - this.smoothing) + beta * this.smoothing;

        this.lastValue = { gamma, beta };

        return { gamma, beta };
    }
}

// 사용 예시
const sensorProcessor = new ConfigurableSensorProcessor({
    sensitivity: 1.5,   // 1.5배 더 민감하게
    deadZone: 3,        // 3도 이하는 무시
    smoothing: 0.4      // 40% 스무딩
});

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    const processed = sensorProcessor.process(data.data.orientation);

    // processed.gamma, processed.beta 사용
});
```

**UI로 감도 조절 제공:**

```html
<div id="sensor-config">
    <label>감도: <input type="range" id="sensitivity" min="0.1" max="2.0" step="0.1" value="1.0"></label>
    <label>데드존: <input type="range" id="deadzone" min="0" max="20" step="1" value="5"></label>
    <label>스무딩: <input type="range" id="smoothing" min="0" max="1" step="0.1" value="0.3"></label>
</div>

<script>
const sensorProcessor = new ConfigurableSensorProcessor();

document.getElementById('sensitivity').addEventListener('input', (e) => {
    sensorProcessor.sensitivity = parseFloat(e.target.value);
});

document.getElementById('deadzone').addEventListener('input', (e) => {
    sensorProcessor.deadZone = parseFloat(e.target.value);
});

document.getElementById('smoothing').addEventListener('input', (e) => {
    sensorProcessor.smoothing = parseFloat(e.target.value);
});
</script>
```

---

#### 10.1.4 게임 로직 문제

**문제: "공이 벽을 통과함"**

**원인:** 속도가 너무 빠르거나 충돌 감지 로직 오류

**해결 방법:**

```javascript
// ❌ 문제 있는 코드
function checkWallCollision(ball) {
    if (ball.x < 0) ball.x = 0;
    if (ball.x > canvas.width) ball.x = canvas.width;
    // 속도가 빠르면 벽을 통과할 수 있음!
}

// ✅ 올바른 코드 (Continuous Collision Detection)
function checkWallCollision(ball) {
    const radius = ball.radius;

    // 좌측 벽
    if (ball.x - radius < 0) {
        ball.x = radius;
        ball.vx = Math.abs(ball.vx) * 0.8;  // 반사 + 에너지 손실
    }

    // 우측 벽
    if (ball.x + radius > canvas.width) {
        ball.x = canvas.width - radius;
        ball.vx = -Math.abs(ball.vx) * 0.8;
    }

    // 상단 벽
    if (ball.y - radius < 0) {
        ball.y = radius;
        ball.vy = Math.abs(ball.vy) * 0.8;
    }

    // 하단 벽
    if (ball.y + radius > canvas.height) {
        ball.y = canvas.height - radius;
        ball.vy = -Math.abs(ball.vy) * 0.8;
    }
}
```

**고급: Swept AABB (매우 빠른 속도에도 안전)**

```javascript
function sweptAABB(ball, deltaTime) {
    // 이동 벡터
    const dx = ball.vx * deltaTime;
    const dy = ball.vy * deltaTime;

    // 벽과의 충돌 시간 계산
    let tMin = 0;
    let tMax = 1;

    // X축 충돌 시간
    if (dx > 0) {
        tMax = Math.min(tMax, (canvas.width - ball.radius - ball.x) / dx);
    } else if (dx < 0) {
        tMax = Math.min(tMax, (ball.radius - ball.x) / dx);
    }

    // Y축 충돌 시간
    if (dy > 0) {
        tMax = Math.min(tMax, (canvas.height - ball.radius - ball.y) / dy);
    } else if (dy < 0) {
        tMax = Math.min(tMax, (ball.radius - ball.y) / dy);
    }

    // 충돌 위치로 이동
    ball.x += dx * tMax;
    ball.y += dy * tMax;

    // 충돌 처리
    if (tMax < 1) {
        // 벽에 충돌함
        if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= canvas.width) {
            ball.vx *= -0.8;
        }
        if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= canvas.height) {
            ball.vy *= -0.8;
        }
    }
}
```

---

**문제: "프레임 드롭 / 게임이 느려짐"**

**진단:**

```javascript
// 성능 프로파일러 추가
const perfStats = {
    update: [],
    render: [],
    physics: [],
    collision: []
};

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    // Update 측정
    const updateStart = performance.now();
    update(deltaTime);
    perfStats.update.push(performance.now() - updateStart);

    // Render 측정
    const renderStart = performance.now();
    render();
    perfStats.render.push(performance.now() - renderStart);

    // 100 프레임마다 리포트
    if (perfStats.update.length >= 100) {
        console.log('성능 통계:');
        console.log('- Update 평균:', avg(perfStats.update).toFixed(2) + 'ms');
        console.log('- Render 평균:', avg(perfStats.render).toFixed(2) + 'ms');

        perfStats.update = [];
        perfStats.render = [];
    }

    requestAnimationFrame(gameLoop);
}

function avg(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}
```

**최적화 방법:**

```javascript
// 1. 오프스크린 캔버스 활용
const offscreenCanvas = document.createElement('canvas');
offscreenCanvas.width = canvas.width;
offscreenCanvas.height = canvas.height;
const offscreenCtx = offscreenCanvas.getContext('2d');

// 정적 배경을 오프스크린에 한 번만 그림
function drawStaticBackground() {
    offscreenCtx.fillStyle = '#000';
    offscreenCtx.fillRect(0, 0, canvas.width, canvas.height);
    // ... 기타 정적 요소
}

// 렌더링 시 빠르게 복사
function render() {
    ctx.drawImage(offscreenCanvas, 0, 0);
    // 동적 요소만 그림
    drawBall();
    drawPaddle();
}

// 2. 불필요한 계산 스킵
let dirtyFlag = false;

function update(deltaTime) {
    if (!gameState.isPlaying) return;  // 게임 중이 아니면 스킵

    // 변경이 있을 때만 처리
    if (newSensorData) {
        processSensorData();
        dirtyFlag = true;
    }
}

function render() {
    if (!dirtyFlag) return;  // 변경 없으면 렌더링 스킵

    // 렌더링...
    dirtyFlag = false;
}

// 3. 충돌 감지 최적화 (Spatial Hashing)
class SpatialHash {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }

    insert(object) {
        const cellX = Math.floor(object.x / this.cellSize);
        const cellY = Math.floor(object.y / this.cellSize);
        const key = `${cellX},${cellY}`;

        if (!this.cells.has(key)) {
            this.cells.set(key, []);
        }
        this.cells.get(key).push(object);
    }

    getNearby(object) {
        const cellX = Math.floor(object.x / this.cellSize);
        const cellY = Math.floor(object.y / this.cellSize);

        const nearby = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${cellX + dx},${cellY + dy}`;
                if (this.cells.has(key)) {
                    nearby.push(...this.cells.get(key));
                }
            }
        }
        return nearby;
    }

    clear() {
        this.cells.clear();
    }
}

// 사용 예시
const spatialHash = new SpatialHash(50);

function checkCollisions() {
    spatialHash.clear();

    // 모든 객체를 공간 해시에 삽입
    obstacles.forEach(obj => spatialHash.insert(obj));

    // 공 근처 객체만 충돌 검사
    const nearby = spatialHash.getNearby(ball);
    nearby.forEach(obj => {
        if (checkCollision(ball, obj)) {
            handleCollision(ball, obj);
        }
    });
}
```

---

#### 10.1.5 QR 코드 문제

**문제: "QR 코드가 생성되지 않음"**

**원인:** qrcode 라이브러리 로드 실패

**해결 방법:**

```javascript
// 라이브러리 로드 확인 및 폴백
function generateQRCode(sessionCode) {
    const qrContainer = document.getElementById('qr-code');

    if (typeof QRCode !== 'undefined') {
        // qrcode.js 사용
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: `${window.location.origin}/sensor.html?code=${sessionCode}`,
            width: 200,
            height: 200
        });
    } else {
        // 폴백: 외부 API 사용
        console.warn('QRCode 라이브러리를 찾을 수 없습니다. 외부 API를 사용합니다.');
        const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/sensor.html?code=' + sessionCode)}`;
        qrContainer.innerHTML = `<img src="${apiUrl}" alt="QR Code">`;
    }
}

// 라이브러리 동적 로드
function loadQRCodeLibrary() {
    return new Promise((resolve, reject) => {
        if (typeof QRCode !== 'undefined') {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 사용 예시
sdk.on('session-created', async (event) => {
    const session = event.detail || event;

    try {
        await loadQRCodeLibrary();
    } catch (error) {
        console.warn('QR 라이브러리 로드 실패, 폴백 사용');
    }

    generateQRCode(session.sessionCode);
});
```

---

### 10.2 FAQ (자주 묻는 질문)

#### Q1: 게임을 만들려면 어떤 기술을 알아야 하나요?

**A:** 기본적인 HTML, CSS, JavaScript 지식이 필요합니다.

**필수 지식:**
- HTML5 Canvas API
- JavaScript (ES6+)
- 이벤트 처리
- 비동기 프로그래밍 (Promises, async/await)

**권장 지식:**
- 게임 루프 개념
- 물리 시뮬레이션 기초
- 충돌 감지 알고리즘

**학습 순서:**
1. HTML/CSS/JavaScript 기초 (1-2주)
2. Canvas API 튜토리얼 (3-5일)
3. 간단한 게임 만들기 (Pong, Breakout) (1주)
4. SessionSDK 통합 (2-3일)
5. 실제 프로젝트 개발 (1-2주)

---

#### Q2: 어떤 센서를 사용할 수 있나요?

**A:** 모바일 기기의 다음 센서를 사용할 수 있습니다:

**1. DeviceOrientation (기울기)**
```javascript
data.orientation = {
    alpha: 0-360,    // Z축 회전 (나침반)
    beta: -180~180,  // X축 기울기 (앞뒤)
    gamma: -90~90    // Y축 기울기 (좌우)
};
```

**사용 예시:**
- 좌우로 기울여 공 조작
- 앞뒤로 기울여 속도 조절
- 회전하여 방향 전환

**2. DeviceMotion (가속도)**
```javascript
data.acceleration = {
    x: m/s²,  // 좌우 가속도
    y: m/s²,  // 상하 가속도
    z: m/s²   // 앞뒤 가속도
};
```

**사용 예시:**
- 흔들기 동작 감지
- 충격 감지
- 빠른 움직임 감지

**3. RotationRate (회전 속도)**
```javascript
data.rotationRate = {
    alpha: °/s,  // Z축 회전 속도
    beta: °/s,   // X축 회전 속도
    gamma: °/s   // Y축 회전 속도
};
```

**사용 예시:**
- 빠른 회전 동작
- 제스처 인식

---

#### Q3: iOS에서 센서가 작동하지 않아요!

**A:** iOS 13+에서는 센서 권한 요청이 필수입니다.

**해결 방법:**

```javascript
// 1. HTTPS 환경 필수 (localhost 제외)
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    alert('iOS에서는 HTTPS가 필요합니다!');
}

// 2. 사용자 제스처(클릭) 후 권한 요청
document.getElementById('start-button').addEventListener('click', async () => {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === 'granted') {
                console.log('✅ 센서 권한 승인');
                startGame();
            } else {
                alert('센서 권한이 필요합니다!');
            }
        } catch (error) {
            console.error('권한 요청 실패:', error);
        }
    } else {
        // Android는 자동 승인
        startGame();
    }
});
```

**체크리스트:**
- [ ] HTTPS 환경인가? (또는 localhost)
- [ ] 사용자 클릭 이벤트 후 권한 요청하는가?
- [ ] `DeviceOrientationEvent.requestPermission()` 호출하는가?
- [ ] Safari 브라우저를 사용하는가? (Chrome은 불가)

---

#### Q4: 여러 명이 동시에 플레이할 수 있나요?

**A:** 네! 게임 타입에 따라 다릅니다.

**게임 타입:**

1. **Solo (1명)**
```javascript
const sdk = new SessionSDK({
    gameId: 'your-game',
    gameType: 'solo'  // 센서 1개만 연결 가능
});
```

2. **Dual (2명)**
```javascript
const sdk = new SessionSDK({
    gameId: 'your-game',
    gameType: 'dual'  // 센서 2개 연결 (sensor1, sensor2)
});

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;

    if (data.sensorId === 'sensor1') {
        // 플레이어 1 조작
    } else if (data.sensorId === 'sensor2') {
        // 플레이어 2 조작
    }
});
```

3. **Multi (최대 8명)**
```javascript
const sdk = new SessionSDK({
    gameId: 'your-game',
    gameType: 'multi'  // 센서 최대 8개 (player1 ~ player8)
});

sdk.on('sensor-connected', (event) => {
    const data = event.detail || event;
    console.log(`플레이어 ${data.sensorId} 참가!`);
});

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    // data.sensorId = 'player1', 'player2', ...
});
```

---

#### Q5: 게임을 다른 사람과 공유하려면?

**A:** 여러 방법이 있습니다.

**방법 1: Git 저장소**
```bash
# GitHub에 푸시
git add public/games/your-game/
git commit -m "Add my awesome game"
git push origin main

# 다른 사람이 다운로드
git clone https://github.com/yourusername/repo.git
cd repo
npm install
npm start
```

**방법 2: ZIP 파일**
```bash
# 게임 폴더 압축
cd public/games
zip -r your-game.zip your-game/

# 다른 사람이 압축 해제
unzip your-game.zip -d public/games/
```

**방법 3: Developer Center** (추천)
```
1. 게임을 public/games/ 폴더에 배치
2. http://localhost:3000/developer 접속
3. "게임 목록" 탭에서 자동으로 표시
4. 다운로드 링크 공유
```

---

#### Q6: AI 게임 생성기로 만든 게임을 수정할 수 있나요?

**A:** 물론입니다! 생성된 게임은 완전히 수정 가능합니다.

**수정 방법:**

```bash
# 1. 생성된 게임 위치
public/games/ai-generated-game-XXXXX/index.html

# 2. 에디터로 열기
code public/games/ai-generated-game-XXXXX/index.html

# 3. 코드 수정
# - 색상 변경
# - 게임 로직 수정
# - 새로운 기능 추가

# 4. 서버 재시작 없이 바로 확인
# 브라우저 새로고침만 하면 됨!
```

**자주 수정하는 부분:**

```javascript
// 색상 변경
const COLORS = {
    ball: '#ff0000',      // 빨강 → 파랑으로 변경
    paddle: '#00ff00',
    background: '#000000'
};

// 난이도 조절
const DIFFICULTY = {
    ballSpeed: 5,         // 공 속도 증가
    paddleSize: 100,      // 패들 크기 감소
    gravity: 0.5          // 중력 증가
};

// 게임 규칙 수정
function checkGameOver() {
    if (ball.y > canvas.height) {
        lives--;  // 목숨 -1 → -2로 변경
        if (lives <= 0) {
            endGame();
        }
    }
}
```

---

#### Q7: 게임이 모바일에서 느려요!

**A:** 성능 최적화가 필요합니다.

**최적화 체크리스트:**

```javascript
// 1. Canvas 크기 최적화
const canvas = document.getElementById('game-canvas');
const maxWidth = 800;  // 최대 너비 제한
const maxHeight = 600;

if (window.innerWidth > maxWidth) {
    canvas.width = maxWidth;
    canvas.height = maxHeight;
} else {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// 2. 프레임 제한 (모바일은 30 FPS도 충분)
let lastFrameTime = 0;
const targetFPS = 30;
const frameDelay = 1000 / targetFPS;

function gameLoop(timestamp) {
    if (timestamp - lastFrameTime < frameDelay) {
        requestAnimationFrame(gameLoop);
        return;
    }
    lastFrameTime = timestamp;

    update();
    render();
    requestAnimationFrame(gameLoop);
}

// 3. 불필요한 렌더링 제거
let dirtyFlag = false;

function update(deltaTime) {
    // 변경사항이 있을 때만 렌더링
    if (ball.x !== lastBallX || ball.y !== lastBallY) {
        dirtyFlag = true;
    }
}

function render() {
    if (!dirtyFlag) return;

    // 렌더링...
    dirtyFlag = false;
}

// 4. 이미지 최적화
const img = new Image();
img.src = 'sprite.png';

// 미리 로드
await new Promise((resolve) => {
    img.onload = resolve;
});

// 5. 복잡한 계산 줄이기
// ❌ 매 프레임 Math.sqrt() 호출
const distance = Math.sqrt(dx * dx + dy * dy);

// ✅ 거리 제곱 비교 (Math.sqrt 불필요)
const distanceSquared = dx * dx + dy * dy;
if (distanceSquared < radius * radius) {
    // 충돌!
}
```

---

#### Q8: 게임에 사운드를 추가하려면?

**A:** Web Audio API 또는 HTML5 Audio를 사용하세요.

**방법 1: HTML5 Audio (간단)**

```javascript
class SoundManager {
    constructor() {
        this.sounds = {
            bounce: new Audio('assets/sounds/bounce.mp3'),
            gameOver: new Audio('assets/sounds/gameover.mp3'),
            score: new Audio('assets/sounds/score.mp3')
        };

        // 사운드 미리 로드
        Object.values(this.sounds).forEach(sound => {
            sound.preload = 'auto';
            sound.volume = 0.5;
        });
    }

    play(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;  // 처음부터 재생
            sound.play().catch(err => {
                console.warn('사운드 재생 실패:', err);
            });
        }
    }

    setVolume(volume) {
        Object.values(this.sounds).forEach(sound => {
            sound.volume = volume;
        });
    }
}

// 사용 예시
const soundManager = new SoundManager();

function checkCollision(ball, paddle) {
    if (collides(ball, paddle)) {
        soundManager.play('bounce');
        return true;
    }
}

function gameOver() {
    soundManager.play('gameOver');
}
```

**방법 2: Web Audio API (고급)**

```javascript
class WebAudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.buffers = {};
    }

    async loadSound(name, url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        this.buffers[name] = await this.audioContext.decodeAudioData(arrayBuffer);
    }

    play(name, options = {}) {
        const buffer = this.buffers[name];
        if (!buffer) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        // 볼륨 조절
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = options.volume || 0.5;

        // 연결
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // 재생
        source.start(0);
    }
}

// 사용 예시
const audioManager = new WebAudioManager();

// 초기화 시 로드
async function init() {
    await audioManager.loadSound('bounce', 'assets/sounds/bounce.mp3');
    await audioManager.loadSound('gameOver', 'assets/sounds/gameover.mp3');

    console.log('사운드 로드 완료!');
}

// 재생
audioManager.play('bounce', { volume: 0.7 });
```

**무료 사운드 리소스:**
- [Freesound.org](https://freesound.org/)
- [OpenGameArt.org](https://opengameart.org/)
- [Zapsplat.com](https://www.zapsplat.com/)

---

#### Q9: 게임 점수를 저장하려면?

**A:** LocalStorage 또는 서버 API를 사용하세요.

**방법 1: LocalStorage (로컬 저장)**

```javascript
class ScoreManager {
    constructor(gameId) {
        this.gameId = gameId;
        this.storageKey = `game_scores_${gameId}`;
    }

    saveScore(playerName, score) {
        const scores = this.getScores();

        scores.push({
            playerName,
            score,
            timestamp: Date.now()
        });

        // 상위 10개만 유지
        scores.sort((a, b) => b.score - a.score);
        const top10 = scores.slice(0, 10);

        localStorage.setItem(this.storageKey, JSON.stringify(top10));
    }

    getScores() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    getHighScore() {
        const scores = this.getScores();
        return scores.length > 0 ? scores[0].score : 0;
    }

    clearScores() {
        localStorage.removeItem(this.storageKey);
    }
}

// 사용 예시
const scoreManager = new ScoreManager('tilt-ball-maze');

function gameOver() {
    const playerName = prompt('이름을 입력하세요:');
    scoreManager.saveScore(playerName, currentScore);

    // 리더보드 표시
    const scores = scoreManager.getScores();
    displayLeaderboard(scores);
}

function displayLeaderboard(scores) {
    const html = scores.map((s, index) => `
        <div class="score-entry">
            <span class="rank">${index + 1}</span>
            <span class="name">${s.playerName}</span>
            <span class="score">${s.score}</span>
        </div>
    `).join('');

    document.getElementById('leaderboard').innerHTML = html;
}
```

**방법 2: 서버 API (글로벌 순위)**

```javascript
class OnlineScoreManager {
    constructor(gameId, apiUrl = '/api/scores') {
        this.gameId = gameId;
        this.apiUrl = apiUrl;
    }

    async saveScore(playerName, score) {
        try {
            const response = await fetch(`${this.apiUrl}/${this.gameId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName, score })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('점수 저장 실패:', error);
        }
    }

    async getScores(limit = 10) {
        try {
            const response = await fetch(`${this.apiUrl}/${this.gameId}?limit=${limit}`);
            const scores = await response.json();
            return scores;
        } catch (error) {
            console.error('점수 불러오기 실패:', error);
            return [];
        }
    }

    async getPlayerRank(playerName) {
        try {
            const response = await fetch(`${this.apiUrl}/${this.gameId}/rank/${playerName}`);
            const data = await response.json();
            return data.rank;
        } catch (error) {
            console.error('랭킹 조회 실패:', error);
            return null;
        }
    }
}

// 사용 예시
const scoreManager = new OnlineScoreManager('tilt-ball-maze');

async function gameOver() {
    const playerName = prompt('이름을 입력하세요:');
    await scoreManager.saveScore(playerName, currentScore);

    // 글로벌 순위 표시
    const scores = await scoreManager.getScores(10);
    displayLeaderboard(scores);

    // 내 순위 표시
    const myRank = await scoreManager.getPlayerRank(playerName);
    alert(`당신의 순위: ${myRank}위`);
}
```

---

#### Q10: 게임을 PC 키보드로도 플레이할 수 있게 하려면?

**A:** 키보드 이벤트와 센서 데이터를 통합하세요.

```javascript
class InputManager {
    constructor(sdk) {
        this.sdk = sdk;
        this.keyState = {};
        this.simulatedOrientation = { gamma: 0, beta: 0 };

        this.setupKeyboard();
        this.setupSensor();
    }

    setupKeyboard() {
        // 키보드 이벤트
        window.addEventListener('keydown', (e) => {
            this.keyState[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keyState[e.key] = false;
        });

        // 키보드 입력을 센서 데이터로 변환
        setInterval(() => {
            if (this.keyState['ArrowLeft']) {
                this.simulatedOrientation.gamma = Math.max(-45, this.simulatedOrientation.gamma - 5);
            } else if (this.keyState['ArrowRight']) {
                this.simulatedOrientation.gamma = Math.min(45, this.simulatedOrientation.gamma + 5);
            } else {
                // 중앙으로 복귀
                this.simulatedOrientation.gamma *= 0.9;
            }

            if (this.keyState['ArrowUp']) {
                this.simulatedOrientation.beta = Math.max(-45, this.simulatedOrientation.beta - 5);
            } else if (this.keyState['ArrowDown']) {
                this.simulatedOrientation.beta = Math.min(45, this.simulatedOrientation.beta + 5);
            } else {
                this.simulatedOrientation.beta *= 0.9;
            }

            // 시뮬레이션된 센서 데이터 전송
            if (!this.sensorActive && (this.keyState['ArrowLeft'] || this.keyState['ArrowRight'] ||
                this.keyState['ArrowUp'] || this.keyState['ArrowDown'])) {
                this.emitSimulatedData();
            }
        }, 50);
    }

    setupSensor() {
        // 실제 센서 데이터 수신
        this.sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            this.sensorActive = true;

            // 실제 센서 데이터 우선
            this.processSensorData(data.data);
        });
    }

    emitSimulatedData() {
        // 키보드 입력을 센서 형식으로 변환
        this.processSensorData({
            orientation: this.simulatedOrientation,
            acceleration: { x: 0, y: 9.8, z: 0 },
            rotationRate: { alpha: 0, beta: 0, gamma: 0 }
        });
    }

    processSensorData(data) {
        // 통합된 입력 처리
        // (실제 센서 또는 키보드 시뮬레이션)
        updateGameLogic(data.orientation);
    }
}

// 사용 예시
const inputManager = new InputManager(sdk);

// 게임에서는 inputManager를 통해 입력 처리
// 센서와 키보드 모두 자동 지원!
```

**사용자에게 안내:**

```html
<div id="controls-info">
    <h3>조작 방법</h3>
    <ul>
        <li><strong>스마트폰:</strong> 기기를 기울여 조작</li>
        <li><strong>PC:</strong> 방향키(← → ↑ ↓)로 조작</li>
    </ul>
</div>
```

---

### 10.3 추가 리소스

#### 학습 자료

**공식 문서:**
- [SessionSDK API Reference](http://localhost:3000/developer) - Part 8 참조
- [게임 개발 템플릿](../GAME_TEMPLATE.html)
- [개발자 가이드](../DEVELOPER_GUIDE.md)

**외부 리소스:**
- [MDN Web Docs - Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [MDN - DeviceOrientation API](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent)
- [HTML5 Game Development Tutorial](https://developer.mozilla.org/en-US/docs/Games)

**유용한 라이브러리:**
- [Matter.js](https://brm.io/matter-js/) - 2D 물리 엔진
- [Howler.js](https://howlerjs.com/) - 오디오 라이브러리
- [Pixi.js](https://pixijs.com/) - 고성능 2D 렌더링

#### 커뮤니티 및 지원

**문제 보고:**
- GitHub Issues: [프로젝트 저장소]
- 버그 리포트: GameMaintenanceManager API 사용

**질문 및 토론:**
- Developer Center 포럼
- Discord 커뮤니티 (향후 추가 예정)

**기여하기:**
1. Fork 저장소
2. 새 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

---

## 마치며

🎉 **축하합니다!** 개발자 온보딩 가이드를 모두 마쳤습니다.

이제 여러분은 Sensor Game Hub v6.0에서 센서 기반 게임을 개발하는 데 필요한 모든 지식을 갖추셨습니다.

### 다음 단계

1. **첫 게임 만들기**: [GAME_TEMPLATE.html](../GAME_TEMPLATE.html)을 복사하여 시작하세요
2. **AI 게임 생성기 사용**: [Developer Center](http://localhost:3000/developer)에서 아이디어를 게임으로 변환하세요
3. **기존 게임 분석**: [public/games/](../../public/games/) 폴더의 예제 게임들을 살펴보세요
4. **커뮤니티 참여**: 다른 개발자들과 게임을 공유하고 피드백을 받으세요

### 도움이 필요하신가요?

- 📚 **문서**: 이 가이드의 Part 1-9 참조
- 🐛 **버그 리포트**: GameMaintenanceManager API 사용
- 💡 **아이디어**: AI 게임 생성기로 프로토타입 제작
- 🤝 **협업**: Git을 통해 다른 개발자와 협업