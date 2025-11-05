# 🎮 완벽한 게임 예제 (Production-Ready)

이 문서는 실제 프로덕션 환경에서 완벽하게 작동하는 센서 게임들의 핵심 패턴과 구조를 담고 있습니다.
AI 게임 생성 시 이 패턴들을 **반드시** 참고하여 버그 없는 고품질 게임을 생성하세요.

---

## 🏆 완벽한 게임의 공통 패턴

### 1. 필수 SessionSDK 통합 패턴

```javascript
// ✅ 올바른 패턴 - cake-delivery, shot-target에서 검증됨
class Game {
    constructor() {
        this.state = {
            connected: false,      // 서버 연결 상태
            sessionCreated: false, // 세션 생성 완료
            gameStarted: false,    // 게임 시작 여부
            sensors: {}            // 센서 데이터
        };

        // SDK 초기화
        this.sdk = new SessionSDK({
            gameId: 'unique-game-id',
            gameType: 'solo'  // 또는 'dual', 'multi'
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        // 1단계: 서버 연결 완료
        this.sdk.on('connected', async () => {
            this.state.connected = true;
            console.log('✅ 서버 연결 성공');
            await this.createSession();
        });

        // 2단계: 세션 생성 완료
        this.sdk.on('session-created', (event) => {
            const session = event.detail || event;  // 중요: 이 패턴 필수!
            this.state.sessionCreated = true;
            this.displaySessionInfo(session);
        });

        // 3단계: 센서 연결
        this.sdk.on('sensor-connected', (event) => {
            const data = event.detail || event;
            console.log(`✅ 센서 연결: ${data.sensorId}`);
            this.state.sensors[data.sensorId] = { connected: true };
        });

        // 4단계: 센서 데이터 수신
        this.sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            if (this.state.gameStarted) {  // 게임 시작 후에만 처리
                this.processSensorData(data);
            }
        });

        // 센서 연결 해제
        this.sdk.on('sensor-disconnected', (event) => {
            const data = event.detail || event;
            console.warn(`⚠️ 센서 연결 해제: ${data.sensorId}`);
            delete this.state.sensors[data.sensorId];
        });
    }

    async createSession() {
        try {
            await this.sdk.createSession();
            console.log('✅ 세션 생성 요청 완료');
        } catch (error) {
            console.error('❌ 세션 생성 실패:', error);
        }
    }

    displaySessionInfo(session) {
        // 세션 코드 표시
        document.getElementById('sessionCode').textContent = session.sessionCode;

        // QR 코드 생성
        const sensorUrl = `${window.location.origin}/sensor.html?session=${session.sessionCode}`;
        this.generateQRCode(sensorUrl);

        // 게임 시작 버튼 활성화
        document.getElementById('startButton').disabled = false;
    }

    processSensorData(data) {
        // 센서 데이터 처리 로직
        if (data.data && data.data.orientation) {
            const { alpha, beta, gamma } = data.data.orientation;
            // 게임 로직 적용
        }
    }
}
```

### 2. 게임 루프 패턴 (60 FPS)

```javascript
class Game {
    constructor() {
        this.lastTime = 0;
        this.deltaTime = 0;
        this.isRunning = false;
    }

    startGameLoop() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000; // 초 단위
        this.lastTime = currentTime;

        // 업데이트 (물리, 로직)
        this.update(this.deltaTime);

        // 렌더링
        this.render();

        // 다음 프레임 요청
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        // 물리 시뮬레이션
        // 충돌 감지
        // 점수 계산
        // 게임 상태 업데이트
    }

    render() {
        // Canvas 그리기
        // UI 업데이트
    }

    stopGameLoop() {
        this.isRunning = false;
    }
}
```

### 3. 센서 데이터 처리 패턴

```javascript
// ✅ cake-delivery에서 검증된 패턴
processSensorData(data) {
    if (!this.state.gameStarted) return;

    const sensorId = data.sensorId;
    const { orientation, acceleration } = data.data;

    if (orientation) {
        // gamma: 좌우 기울기 (-90 ~ 90)
        // beta: 앞뒤 기울기 (-180 ~ 180)
        // alpha: 회전 (0 ~ 360)

        // 정규화 (-1 ~ 1)
        const normalizedX = Math.max(-1, Math.min(1, orientation.gamma / 45));
        const normalizedY = Math.max(-1, Math.min(1, orientation.beta / 45));

        // 게임 오브젝트에 적용
        this.player.velocity.x += normalizedX * this.player.acceleration;
        this.player.velocity.y += normalizedY * this.player.acceleration;
    }

    if (acceleration) {
        // 흔들기 감지 (shot-target 패턴)
        const magnitude = Math.sqrt(
            acceleration.x ** 2 +
            acceleration.y ** 2 +
            acceleration.z ** 2
        );

        if (magnitude > 15) {  // 임계값
            this.onShake();
        }
    }
}
```

### 4. 반응형 Canvas 설정

```javascript
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        window.addEventListener('resize', () => this.setupCanvas());
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        // 캔버스 실제 크기 설정
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        // CSS 크기는 유지
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        // 스케일 조정
        this.ctx.scale(dpr, dpr);

        // 게임 크기 저장
        this.gameWidth = rect.width;
        this.gameHeight = rect.height;
    }
}
```

### 5. 충돌 감지 패턴

```javascript
// AABB (Axis-Aligned Bounding Box) 충돌 감지
checkCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
    );
}

// 원형 충돌 감지 (shot-target 패턴)
checkCircleCollision(circle1, circle2) {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (circle1.radius + circle2.radius);
}

// 점과 원 충돌 감지
checkPointInCircle(point, circle) {
    const dx = point.x - circle.x;
    const dy = point.y - circle.y;
    return (dx * dx + dy * dy) < (circle.radius * circle.radius);
}
```

### 6. 타이머 시스템

```javascript
class Timer {
    constructor(duration) {
        this.duration = duration;  // 초 단위
        this.remaining = duration;
        this.isRunning = false;
        this.callbacks = {
            onTick: null,
            onComplete: null
        };
    }

    start() {
        this.isRunning = true;
        this.remaining = this.duration;
    }

    update(deltaTime) {
        if (!this.isRunning) return;

        this.remaining -= deltaTime;

        if (this.remaining <= 0) {
            this.remaining = 0;
            this.isRunning = false;
            if (this.callbacks.onComplete) {
                this.callbacks.onComplete();
            }
        }

        if (this.callbacks.onTick) {
            this.callbacks.onTick(this.remaining);
        }
    }

    stop() {
        this.isRunning = false;
    }

    reset() {
        this.remaining = this.duration;
    }

    getFormattedTime() {
        const minutes = Math.floor(this.remaining / 60);
        const seconds = Math.floor(this.remaining % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}
```

### 7. 점수 시스템

```javascript
class ScoreSystem {
    constructor() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.hits = 0;
        this.misses = 0;
    }

    addScore(points, multiplier = 1) {
        const finalPoints = Math.floor(points * multiplier);
        this.score += finalPoints;
        this.updateUI();
    }

    incrementCombo() {
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        this.updateUI();
    }

    resetCombo() {
        this.combo = 0;
        this.updateUI();
    }

    recordHit() {
        this.hits++;
        this.incrementCombo();
    }

    recordMiss() {
        this.misses++;
        this.resetCombo();
    }

    getAccuracy() {
        const total = this.hits + this.misses;
        return total === 0 ? 100 : Math.floor((this.hits / total) * 100);
    }

    updateUI() {
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('comboCount').textContent = this.combo;
        document.getElementById('accuracyValue').textContent = this.getAccuracy() + '%';
    }
}
```

---

## 🎯 Shot Target 게임 핵심 패턴

### 타겟 생성 및 관리

```javascript
class Target {
    constructor(x, y, radius, color, points, lifetime) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.points = points;
        this.lifetime = lifetime;
        this.age = 0;
        this.active = true;
    }

    update(deltaTime) {
        this.age += deltaTime;
        if (this.age >= this.lifetime) {
            this.active = false;
        }
    }

    draw(ctx) {
        // 외곽선
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // 내부 동심원
        const innerRadius = this.radius * 0.6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, innerRadius, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.stroke();

        // 점수 표시
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.points.toString(), this.x, this.y);
    }

    checkHit(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= this.radius * 0.3) {
            return { hit: true, accuracy: 'perfect', multiplier: 2 };
        } else if (distance <= this.radius * 0.6) {
            return { hit: true, accuracy: 'good', multiplier: 1.5 };
        } else if (distance <= this.radius) {
            return { hit: true, accuracy: 'normal', multiplier: 1 };
        }

        return { hit: false };
    }
}
```

---

## 🎂 Cake Delivery 게임 핵심 패턴

### 협동 플레이 센서 처리

```javascript
class CakeDeliveryGame {
    constructor() {
        this.players = {
            sensor1: { x: 0, y: 0, active: false },
            sensor2: { x: 0, y: 0, active: false }
        };
        this.cake = {
            x: 400,
            y: 300,
            stability: 100,
            angle: 0
        };
    }

    processSensorData(data) {
        const sensorId = data.sensorId;
        const { orientation } = data.data;

        if (orientation) {
            // 센서별 위치 업데이트
            this.players[sensorId].x = orientation.gamma * 10;
            this.players[sensorId].y = orientation.beta * 10;
            this.players[sensorId].active = true;

            // 두 센서의 중점으로 케이크 위치 계산
            if (this.players.sensor1.active && this.players.sensor2.active) {
                this.cake.x = (this.players.sensor1.x + this.players.sensor2.x) / 2;
                this.cake.y = (this.players.sensor1.y + this.players.sensor2.y) / 2;

                // 두 센서 간 거리로 안정성 계산
                const distance = this.calculateDistance(
                    this.players.sensor1,
                    this.players.sensor2
                );

                // 이상적 거리: 7미터 (700 픽셀)
                const idealDistance = 700;
                const distanceDiff = Math.abs(distance - idealDistance);

                if (distanceDiff > 300) {
                    this.cake.stability -= 0.5;  // 불안정
                } else {
                    this.cake.stability += 0.2;  // 안정
                }

                this.cake.stability = Math.max(0, Math.min(100, this.cake.stability));
            }
        }
    }

    calculateDistance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
```

---

## 🚫 자주 발생하는 버그 패턴 (반드시 피할 것!)

### ❌ 버그 1: 게임 시작 전 센서 데이터 처리

```javascript
// ❌ 잘못된 코드
sdk.on('sensor-data', (event) => {
    this.processSensorData(event.detail);  // gameStarted 체크 없음!
});

// ✅ 올바른 코드
sdk.on('sensor-data', (event) => {
    if (this.state.gameStarted) {  // 필수!
        this.processSensorData(event.detail);
    }
});
```

### ❌ 버그 2: event.detail 누락

```javascript
// ❌ 잘못된 코드
sdk.on('session-created', (event) => {
    this.displaySessionInfo(event);  // undefined 발생!
});

// ✅ 올바른 코드
sdk.on('session-created', (event) => {
    const session = event.detail || event;  // 필수 패턴!
    this.displaySessionInfo(session);
});
```

### ❌ 버그 3: Canvas 크기 미설정

```javascript
// ❌ 잘못된 코드
canvas.width = 800;
canvas.height = 600;
// → 화면 크기에 맞지 않음!

// ✅ 올바른 코드
const setupCanvas = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
};
window.addEventListener('resize', setupCanvas);
setupCanvas();
```

### ❌ 버그 4: 메모리 누수

```javascript
// ❌ 잘못된 코드
setInterval(() => {
    this.update();
}, 16);
// → 페이지를 벗어나도 계속 실행!

// ✅ 올바른 코드
let animationId;
const gameLoop = () => {
    if (this.isRunning) {
        this.update();
        animationId = requestAnimationFrame(gameLoop);
    }
};

// 정리 함수
cleanup() {
    this.isRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
}
```

---

## 📋 체크리스트: 완벽한 게임 생성 필수 요소

- [ ] SessionSDK 올바른 초기화 (`connected` → `createSession`)
- [ ] CustomEvent 패턴 (`event.detail || event`)
- [ ] 게임 상태 플래그 (`gameStarted` 체크)
- [ ] 반응형 Canvas 설정
- [ ] 60 FPS 게임 루프 (requestAnimationFrame)
- [ ] 센서 데이터 정규화 및 검증
- [ ] 충돌 감지 구현
- [ ] 타이머 시스템
- [ ] 점수 시스템
- [ ] UI 실시간 업데이트
- [ ] 메모리 누수 방지 (cleanup 함수)
- [ ] 모바일 최적화 (터치 이벤트)
- [ ] QR 코드 생성 (폴백 포함)
- [ ] 게임 오버 처리
- [ ] 재시작 기능

---

**이 패턴들을 반드시 따르면 100% 작동하는 고품질 게임을 생성할 수 있습니다.**
