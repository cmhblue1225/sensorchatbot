# ⚡ 성능 최적화 - 60FPS 유지를 위한 최적화 기법

## 📚 목차
1. [성능 측정 및 프로파일링](#성능-측정-및-프로파일링)
2. [렌더링 최적화](#렌더링-최적화)
3. [센서 데이터 최적화](#센서-데이터-최적화)
4. [메모리 관리](#메모리-관리)
5. [네트워크 최적화](#네트워크-최적화)
6. [코드 최적화](#코드-최적화)
7. [로딩 시간 단축](#로딩-시간-단축)
8. [배터리 절약](#배터리-절약)

---

## 📊 성능 측정 및 프로파일링

### 1. FPS 모니터

```javascript
class FPSMonitor {
    constructor() {
        this.frames = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        this.fpsHistory = [];
        this.maxHistorySize = 60;

        this.display = this.createDisplay();
    }

    createDisplay() {
        const display = document.createElement('div');
        display.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            padding: 8px 12px;
            background: rgba(0, 0, 0, 0.8);
            color: #0f0;
            font-family: monospace;
            font-size: 14px;
            border-radius: 4px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(display);
        return display;
    }

    update() {
        this.frames++;
        const currentTime = performance.now();
        const elapsed = currentTime - this.lastTime;

        if (elapsed >= 1000) {
            this.fps = Math.round((this.frames * 1000) / elapsed);
            this.frames = 0;
            this.lastTime = currentTime;

            this.fpsHistory.push(this.fps);
            if (this.fpsHistory.length > this.maxHistorySize) {
                this.fpsHistory.shift();
            }

            this.updateDisplay();
        }
    }

    updateDisplay() {
        const avg = this.getAverage();
        const min = Math.min(...this.fpsHistory);
        const max = Math.max(...this.fpsHistory);

        const color = this.fps >= 55 ? '#0f0' : this.fps >= 30 ? '#ff0' : '#f00';

        this.display.style.color = color;
        this.display.innerHTML = `
            FPS: ${this.fps}<br>
            Avg: ${avg} | Min: ${min} | Max: ${max}
        `;
    }

    getAverage() {
        if (this.fpsHistory.length === 0) return 0;
        const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.fpsHistory.length);
    }
}

// 사용 예
const fpsMonitor = new FPSMonitor();

function gameLoop() {
    fpsMonitor.update();
    // 게임 로직...
    requestAnimationFrame(gameLoop);
}

gameLoop();
```

### 2. 성능 프로파일러

```javascript
class PerformanceProfiler {
    constructor() {
        this.measurements = new Map();
    }

    start(label) {
        this.measurements.set(label, {
            start: performance.now(),
            samples: []
        });
    }

    end(label) {
        const measurement = this.measurements.get(label);
        if (!measurement) return;

        const duration = performance.now() - measurement.start;
        measurement.samples.push(duration);

        if (measurement.samples.length > 100) {
            measurement.samples.shift();
        }
    }

    getStats(label) {
        const measurement = this.measurements.get(label);
        if (!measurement || measurement.samples.length === 0) {
            return null;
        }

        const samples = measurement.samples;
        const sum = samples.reduce((a, b) => a + b, 0);
        const avg = sum / samples.length;
        const min = Math.min(...samples);
        const max = Math.max(...samples);

        return { avg, min, max, samples: samples.length };
    }

    report() {
        console.log('=== Performance Report ===');
        this.measurements.forEach((_, label) => {
            const stats = this.getStats(label);
            if (stats) {
                console.log(`${label}:`, {
                    avg: `${stats.avg.toFixed(2)}ms`,
                    min: `${stats.min.toFixed(2)}ms`,
                    max: `${stats.max.toFixed(2)}ms`
                });
            }
        });
    }
}

// 사용 예
const profiler = new PerformanceProfiler();

function gameLoop() {
    profiler.start('update');
    update();
    profiler.end('update');

    profiler.start('render');
    render();
    profiler.end('render');

    profiler.start('physics');
    updatePhysics();
    profiler.end('physics');

    requestAnimationFrame(gameLoop);
}

// 5초마다 리포트
setInterval(() => {
    profiler.report();
}, 5000);
```

---

## 🎨 렌더링 최적화

### 1. 오프스크린 캔버스

```javascript
class OptimizedRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', {
            alpha: false,  // 투명도 불필요 시 성능 향상
            desynchronized: true  // 낮은 지연시간
        });

        // 오프스크린 캔버스 생성
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.canvas.width;
        this.offscreenCanvas.height = this.canvas.height;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    }

    render(entities) {
        // 오프스크린 캔버스에 렌더링
        this.offscreenCtx.clearRect(
            0, 0,
            this.offscreenCanvas.width,
            this.offscreenCanvas.height
        );

        entities.forEach(entity => {
            this.drawEntity(this.offscreenCtx, entity);
        });

        // 한 번에 메인 캔버스로 복사
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    }

    drawEntity(ctx, entity) {
        ctx.fillStyle = entity.color;
        ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
    }
}
```

### 2. 더티 렉트 (Dirty Rectangle)

```javascript
class DirtyRectRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.dirtyRegions = [];
    }

    markDirty(x, y, width, height) {
        this.dirtyRegions.push({ x, y, width, height });
    }

    render(entities) {
        if (this.dirtyRegions.length === 0) {
            return; // 변경 없으면 스킵
        }

        // 더티 영역만 지우고 다시 그리기
        this.dirtyRegions.forEach(region => {
            this.ctx.clearRect(region.x, region.y, region.width, region.height);

            // 해당 영역과 겹치는 엔티티만 렌더링
            entities.forEach(entity => {
                if (this.intersects(region, entity)) {
                    this.drawEntity(entity);
                }
            });
        });

        this.dirtyRegions = [];
    }

    intersects(rect1, rect2) {
        return !(
            rect1.x + rect1.width < rect2.x ||
            rect2.x + rect2.width < rect1.x ||
            rect1.y + rect1.height < rect2.y ||
            rect2.y + rect2.height < rect1.y
        );
    }

    drawEntity(entity) {
        this.ctx.fillStyle = entity.color;
        this.ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
    }
}
```

### 3. 스프라이트 배칭

```javascript
class SpriteBatcher {
    constructor(ctx) {
        this.ctx = ctx;
        this.batches = new Map();
    }

    addSprite(texture, x, y, width, height) {
        if (!this.batches.has(texture)) {
            this.batches.set(texture, []);
        }

        this.batches.get(texture).push({ x, y, width, height });
    }

    flush() {
        // 같은 텍스처를 사용하는 스프라이트를 한 번에 렌더링
        this.batches.forEach((sprites, texture) => {
            sprites.forEach(sprite => {
                this.ctx.drawImage(
                    texture,
                    sprite.x, sprite.y,
                    sprite.width, sprite.height
                );
            });
        });

        this.batches.clear();
    }
}

// 사용 예
const batcher = new SpriteBatcher(ctx);

entities.forEach(entity => {
    batcher.addSprite(
        entity.texture,
        entity.x, entity.y,
        entity.width, entity.height
    );
});

batcher.flush();
```

### 4. 뷰포트 컬링

```javascript
class ViewportCuller {
    constructor(viewportWidth, viewportHeight) {
        this.viewport = {
            x: 0,
            y: 0,
            width: viewportWidth,
            height: viewportHeight
        };
    }

    setViewport(x, y) {
        this.viewport.x = x;
        this.viewport.y = y;
    }

    isVisible(entity) {
        // 뷰포트 밖 엔티티는 제외
        return !(
            entity.x + entity.width < this.viewport.x ||
            entity.x > this.viewport.x + this.viewport.width ||
            entity.y + entity.height < this.viewport.y ||
            entity.y > this.viewport.y + this.viewport.height
        );
    }

    getVisibleEntities(entities) {
        return entities.filter(entity => this.isVisible(entity));
    }
}

// 사용 예
const culler = new ViewportCuller(800, 600);

function render(entities) {
    const visibleEntities = culler.getVisibleEntities(entities);

    // 보이는 엔티티만 렌더링
    visibleEntities.forEach(entity => {
        drawEntity(entity);
    });

    console.log(`총 ${entities.length}개 중 ${visibleEntities.length}개 렌더링`);
}
```

---

## 📡 센서 데이터 최적화

### 1. 쓰로틀링 (Throttling)

```javascript
class SensorThrottler {
    constructor(callback, interval = 16) { // 60fps = 16ms
        this.callback = callback;
        this.interval = interval;
        this.lastTime = 0;
        this.pending = null;
    }

    process(data) {
        const now = Date.now();

        if (now - this.lastTime >= this.interval) {
            this.callback(data);
            this.lastTime = now;
            this.pending = null;
        } else {
            // 대기 중인 데이터 갱신
            this.pending = data;
        }
    }

    flush() {
        if (this.pending) {
            this.callback(this.pending);
            this.pending = null;
            this.lastTime = Date.now();
        }
    }
}

// 사용 예
const throttler = new SensorThrottler((data) => {
    updateGame(data);
}, 16); // 60fps

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    throttler.process(data.data);
});
```

### 2. 디바운싱 (Debouncing)

```javascript
class SensorDebouncer {
    constructor(callback, delay = 100) {
        this.callback = callback;
        this.delay = delay;
        this.timeoutId = null;
    }

    process(data) {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        this.timeoutId = setTimeout(() => {
            this.callback(data);
            this.timeoutId = null;
        }, this.delay);
    }

    cancel() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }
}

// 사용 예: 흔들기 제스처 감지에 유용
const shakeDebouncer = new SensorDebouncer((data) => {
    console.log('흔들기 감지!');
    onShake();
}, 300);

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    const magnitude = Math.sqrt(
        data.data.acceleration.x ** 2 +
        data.data.acceleration.y ** 2 +
        data.data.acceleration.z ** 2
    );

    if (magnitude > 15) {
        shakeDebouncer.process(data);
    }
});
```

---

## 🧠 메모리 관리

### 1. 객체 풀 (Object Pool)

```javascript
class ObjectPool {
    constructor(factory, initialSize = 10) {
        this.factory = factory;
        this.pool = [];
        this.active = [];

        // 초기 객체 생성
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.factory());
        }
    }

    acquire() {
        let obj;

        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.factory();
        }

        this.active.push(obj);
        return obj;
    }

    release(obj) {
        const index = this.active.indexOf(obj);
        if (index !== -1) {
            this.active.splice(index, 1);
            this.pool.push(obj);

            // 객체 초기화
            if (obj.reset) {
                obj.reset();
            }
        }
    }

    releaseAll() {
        this.active.forEach(obj => {
            if (obj.reset) {
                obj.reset();
            }
            this.pool.push(obj);
        });
        this.active = [];
    }

    getStats() {
        return {
            poolSize: this.pool.length,
            activeSize: this.active.length,
            totalSize: this.pool.length + this.active.length
        };
    }
}

// 사용 예: 총알 풀
class Bullet {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.active = false;
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.active = false;
    }

    update(deltaTime) {
        if (this.active) {
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;
        }
    }
}

const bulletPool = new ObjectPool(() => new Bullet(), 50);

function shoot(x, y, vx, vy) {
    const bullet = bulletPool.acquire();
    bullet.x = x;
    bullet.y = y;
    bullet.vx = vx;
    bullet.vy = vy;
    bullet.active = true;
    return bullet;
}

function removeBullet(bullet) {
    bulletPool.release(bullet);
}
```

### 2. 메모리 누수 방지

```javascript
class MemoryLeakPrevention {
    constructor() {
        this.listeners = [];
        this.intervals = [];
        this.timeouts = [];
    }

    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.listeners.push({ element, event, handler });
    }

    setInterval(callback, ms) {
        const id = setInterval(callback, ms);
        this.intervals.push(id);
        return id;
    }

    setTimeout(callback, ms) {
        const id = setTimeout(callback, ms);
        this.timeouts.push(id);
        return id;
    }

    cleanup() {
        // 이벤트 리스너 제거
        this.listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.listeners = [];

        // 인터벌 제거
        this.intervals.forEach(id => clearInterval(id));
        this.intervals = [];

        // 타임아웃 제거
        this.timeouts.forEach(id => clearTimeout(id));
        this.timeouts = [];
    }
}

// 사용 예
class Game {
    constructor() {
        this.memory = new MemoryLeakPrevention();
    }

    init() {
        this.memory.addEventListener(window, 'resize', () => {
            this.onResize();
        });

        this.memory.setInterval(() => {
            this.update();
        }, 16);
    }

    destroy() {
        this.memory.cleanup();
    }
}
```

---

## 🌐 네트워크 최적화

### 1. 센서 데이터 압축

```javascript
class SensorDataCompressor {
    constructor(precision = 2) {
        this.precision = precision;
        this.lastData = null;
        this.threshold = 0.5; // 변화량 임계값
    }

    compress(sensorData) {
        // 소수점 자리수 제한
        const compressed = {
            orientation: {
                alpha: this.round(sensorData.orientation.alpha),
                beta: this.round(sensorData.orientation.beta),
                gamma: this.round(sensorData.orientation.gamma)
            }
        };

        // 변화가 임계값 이하면 전송하지 않음
        if (this.lastData && !this.hasSignificantChange(compressed, this.lastData)) {
            return null;
        }

        this.lastData = compressed;
        return compressed;
    }

    round(value) {
        const multiplier = Math.pow(10, this.precision);
        return Math.round(value * multiplier) / multiplier;
    }

    hasSignificantChange(data1, data2) {
        const diff = Math.abs(
            data1.orientation.alpha - data2.orientation.alpha +
            data1.orientation.beta - data2.orientation.beta +
            data1.orientation.gamma - data2.orientation.gamma
        );

        return diff > this.threshold;
    }
}

// 사용 예
const compressor = new SensorDataCompressor(1); // 소수점 1자리

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    const compressed = compressor.compress(data.data);

    if (compressed) {
        // 의미 있는 변화만 전송
        sendToServer(compressed);
    }
});
```

### 2. 델타 인코딩

```javascript
class DeltaEncoder {
    constructor() {
        this.lastData = null;
    }

    encode(data) {
        if (!this.lastData) {
            this.lastData = { ...data };
            return { type: 'full', data };
        }

        const delta = {
            alpha: data.alpha - this.lastData.alpha,
            beta: data.beta - this.lastData.beta,
            gamma: data.gamma - this.lastData.gamma
        };

        this.lastData = { ...data };

        return { type: 'delta', delta };
    }

    decode(encoded) {
        if (encoded.type === 'full') {
            this.lastData = { ...encoded.data };
            return encoded.data;
        } else {
            const data = {
                alpha: this.lastData.alpha + encoded.delta.alpha,
                beta: this.lastData.beta + encoded.delta.beta,
                gamma: this.lastData.gamma + encoded.delta.gamma
            };

            this.lastData = { ...data };
            return data;
        }
    }
}
```

---

## 🔧 코드 최적화

### 1. 루프 최적화

```javascript
// ❌ 느린 코드
function updateEntities(entities) {
    for (let i = 0; i < entities.length; i++) {
        if (entities[i].active) {
            entities[i].update();
            entities[i].checkCollision();
            entities[i].render();
        }
    }
}

// ✅ 빠른 코드
function updateEntities(entities) {
    const length = entities.length;

    // 활성 엔티티만 업데이트
    for (let i = 0; i < length; i++) {
        const entity = entities[i];
        if (!entity.active) continue;

        entity.update();
    }

    // 충돌 검사 (별도 루프)
    for (let i = 0; i < length; i++) {
        const entity = entities[i];
        if (!entity.active) continue;

        entity.checkCollision();
    }

    // 렌더링 (별도 루프)
    for (let i = 0; i < length; i++) {
        const entity = entities[i];
        if (!entity.active) continue;

        entity.render();
    }
}
```

### 2. 수학 연산 최적화

```javascript
// ❌ 느린 코드
const distance = Math.sqrt(
    Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
);

// ✅ 빠른 코드
const dx = x2 - x1;
const dy = y2 - y1;
const distance = Math.sqrt(dx * dx + dy * dy);

// ✅ 더 빠른 코드 (제곱근 생략 가능한 경우)
const distanceSquared = dx * dx + dy * dy;
if (distanceSquared < radiusSquared) {
    // 충돌!
}

// 삼각 함수 캐싱
class TrigCache {
    constructor() {
        this.sinCache = new Float32Array(360);
        this.cosCache = new Float32Array(360);

        for (let i = 0; i < 360; i++) {
            const rad = (i * Math.PI) / 180;
            this.sinCache[i] = Math.sin(rad);
            this.cosCache[i] = Math.cos(rad);
        }
    }

    sin(degrees) {
        return this.sinCache[Math.floor(degrees) % 360];
    }

    cos(degrees) {
        return this.cosCache[Math.floor(degrees) % 360];
    }
}

const trig = new TrigCache();

// 사용
const x = trig.cos(angle) * radius;
const y = trig.sin(angle) * radius;
```

---

## ⚡ 로딩 시간 단축

### 지연 로딩 (Lazy Loading)

```javascript
class AssetLoader {
    constructor() {
        this.assets = new Map();
        this.loading = new Map();
    }

    async load(url, type = 'image') {
        // 이미 로드된 경우
        if (this.assets.has(url)) {
            return this.assets.get(url);
        }

        // 로딩 중인 경우
        if (this.loading.has(url)) {
            return this.loading.get(url);
        }

        // 새로 로드
        const promise = this.loadAsset(url, type);
        this.loading.set(url, promise);

        try {
            const asset = await promise;
            this.assets.set(url, asset);
            this.loading.delete(url);
            return asset;
        } catch (error) {
            this.loading.delete(url);
            throw error;
        }
    }

    async loadAsset(url, type) {
        switch(type) {
            case 'image':
                return this.loadImage(url);
            case 'audio':
                return this.loadAudio(url);
            default:
                throw new Error(`Unknown asset type: ${type}`);
        }
    }

    loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    loadAudio(url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => resolve(audio);
            audio.onerror = reject;
            audio.src = url;
        });
    }
}

// 사용 예
const loader = new AssetLoader();

// 필요할 때만 로드
async function showLevel(levelId) {
    const background = await loader.load(`/images/level${levelId}_bg.png`);
    const music = await loader.load(`/audio/level${levelId}_music.mp3`, 'audio');

    // 사용...
}
```

---

## 🔋 배터리 절약

```javascript
class BatteryOptimizer {
    constructor() {
        this.isPaused = false;
        this.isVisible = true;
        this.setupVisibilityChange();
    }

    setupVisibilityChange() {
        document.addEventListener('visibilitychange', () => {
            this.isVisible = !document.hidden;

            if (!this.isVisible) {
                this.onBackground();
            } else {
                this.onForeground();
            }
        });
    }

    onBackground() {
        console.log('앱이 백그라운드로 전환됨 - 절전 모드');
        this.isPaused = true;

        // 프레임률 감소
        // 센서 업데이트 빈도 감소
        // 렌더링 중지
    }

    onForeground() {
        console.log('앱이 포그라운드로 복귀 - 정상 모드');
        this.isPaused = false;

        // 정상 프레임률 복구
    }
}

const batteryOptimizer = new BatteryOptimizer();

function gameLoop() {
    if (!batteryOptimizer.isPaused) {
        update();
        render();
    }

    requestAnimationFrame(gameLoop);
}
```

---

## 🎓 핵심 원칙 요약

1. **측정 우선**: 최적화 전 성능 측정 및 병목 지점 파악
2. **렌더링 최적화**: 오프스크린 캔버스, 더티 렉트, 뷰포트 컬링
3. **메모리 관리**: 객체 풀, 메모리 누수 방지
4. **네트워크 절약**: 데이터 압축, 델타 인코딩
5. **배터리 절약**: 백그라운드 일시 정지, 적응형 프레임률

---

## 📖 다음 단계

- [아키텍처 디자인](./01-architecture-design.md)
- [SessionSDK 심화](./02-sessionsdk-advanced.md)
- [센서 데이터 마스터리](./03-sensor-data-mastery.md)
