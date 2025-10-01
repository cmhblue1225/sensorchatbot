# 🏗️ 게임 아키텍처 디자인 - 확장 가능한 구조 설계

## 📚 목차
1. [아키텍처 설계 원칙](#아키텍처-설계-원칙)
2. [MVC/MVVM 패턴 적용](#mvcmvvm-패턴-적용)
3. [모듈화 및 컴포넌트 설계](#모듈화-및-컴포넌트-설계)
4. [상태 관리 패턴](#상태-관리-패턴)
5. [이벤트 기반 아키텍처](#이벤트-기반-아키텍처)
6. [게임 루프 설계](#게임-루프-설계)
7. [의존성 관리](#의존성-관리)
8. [확장성 및 유지보수](#확장성-및-유지보수)

---

## 🎯 아키텍처 설계 원칙

### 1. SOLID 원칙 적용

#### Single Responsibility Principle (단일 책임 원칙)
```javascript
// ❌ 나쁜 예: 하나의 클래스가 너무 많은 책임을 가짐
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.players = [];
        this.score = 0;
    }

    update() { /* 게임 로직 */ }
    render() { /* 렌더링 */ }
    handleInput() { /* 입력 처리 */ }
    saveScore() { /* 점수 저장 */ }
    playSound() { /* 사운드 재생 */ }
}

// ✅ 좋은 예: 책임 분리
class GameEngine {
    constructor() {
        this.renderer = new Renderer();
        this.inputManager = new InputManager();
        this.audioManager = new AudioManager();
        this.scoreManager = new ScoreManager();
        this.entityManager = new EntityManager();
    }

    update(deltaTime) {
        this.entityManager.update(deltaTime);
    }

    render() {
        this.renderer.render(this.entityManager.getEntities());
    }
}

class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
    }

    render(entities) {
        this.clear();
        entities.forEach(entity => this.drawEntity(entity));
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawEntity(entity) {
        // 엔티티 렌더링 로직
    }
}

class InputManager {
    constructor() {
        this.keys = {};
        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    isKeyPressed(key) {
        return this.keys[key] || false;
    }
}
```

#### Open/Closed Principle (개방-폐쇄 원칙)
```javascript
// ✅ 확장에는 열려있고 수정에는 닫혀있는 설계
class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.behaviors = [];
    }

    addBehavior(behavior) {
        this.behaviors.push(behavior);
    }

    update(deltaTime) {
        this.behaviors.forEach(behavior => {
            behavior.execute(this, deltaTime);
        });
    }
}

// 새로운 행동을 추가하려면 새로운 클래스 생성
class MovementBehavior {
    constructor(velocity) {
        this.velocity = velocity;
    }

    execute(entity, deltaTime) {
        entity.x += this.velocity.x * deltaTime;
        entity.y += this.velocity.y * deltaTime;
    }
}

class RotationBehavior {
    constructor(angularVelocity) {
        this.angularVelocity = angularVelocity;
    }

    execute(entity, deltaTime) {
        entity.rotation += this.angularVelocity * deltaTime;
    }
}

// 사용 예
const player = new Entity(100, 100);
player.addBehavior(new MovementBehavior({x: 50, y: 0}));
player.addBehavior(new RotationBehavior(Math.PI / 4));
```

---

## 🎨 MVC/MVVM 패턴 적용

### 센서 게임을 위한 MVC 아키텍처
```javascript
// Model - 게임 상태 및 데이터
class GameModel {
    constructor() {
        this.state = {
            score: 0,
            level: 1,
            isGameOver: false,
            player: { x: 0, y: 0, health: 100 },
            enemies: [],
            powerups: []
        };

        this.observers = [];
    }

    // Observer 패턴 구현
    subscribe(observer) {
        this.observers.push(observer);
    }

    notify(event, data) {
        this.observers.forEach(observer => {
            observer.onModelChange(event, data);
        });
    }

    // 상태 변경 메서드
    updatePlayerPosition(x, y) {
        this.state.player.x = x;
        this.state.player.y = y;
        this.notify('player:moved', { x, y });
    }

    addScore(points) {
        this.state.score += points;
        this.notify('score:changed', this.state.score);
    }

    gameOver() {
        this.state.isGameOver = true;
        this.notify('game:over', this.state);
    }
}

// View - 렌더링 및 UI
class GameView {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.scoreDisplay = document.getElementById('score');
    }

    renderPlayer(player) {
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
        this.ctx.fill();
    }

    updateScore(score) {
        this.scoreDisplay.textContent = `점수: ${score}`;
    }

    showGameOver(finalScore) {
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = `
            <h1>게임 오버!</h1>
            <p>최종 점수: ${finalScore}</p>
            <button onclick="restartGame()">다시 시작</button>
        `;
        document.body.appendChild(overlay);
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Controller - 게임 로직 및 이벤트 처리
class GameController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.sdk = null;

        // Model 변경 구독
        this.model.subscribe(this);

        this.init();
    }

    init() {
        // SessionSDK 초기화
        this.sdk = new SessionSDK({
            gameId: 'sensor-mvc-game',
            gameType: 'solo'
        });

        this.sdk.on('connected', () => {
            this.sdk.createSession();
        });

        this.sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            this.handleSensorData(data);
        });

        // 게임 루프 시작
        this.startGameLoop();
    }

    handleSensorData(data) {
        // 센서 데이터를 게임 좌표로 변환
        const { beta, gamma } = data.data.orientation;

        const newX = this.model.state.player.x + gamma * 2;
        const newY = this.model.state.player.y + beta * 2;

        this.model.updatePlayerPosition(newX, newY);
    }

    // Model 변경 이벤트 처리
    onModelChange(event, data) {
        switch(event) {
            case 'player:moved':
                // 플레이어 이동 시 충돌 검사
                this.checkCollisions();
                break;
            case 'score:changed':
                this.view.updateScore(data);
                break;
            case 'game:over':
                this.view.showGameOver(data.score);
                break;
        }
    }

    checkCollisions() {
        // 충돌 검사 로직
        const player = this.model.state.player;
        this.model.state.enemies.forEach(enemy => {
            const distance = Math.hypot(
                player.x - enemy.x,
                player.y - enemy.y
            );

            if (distance < 40) {
                this.model.gameOver();
            }
        });
    }

    startGameLoop() {
        let lastTime = 0;

        const gameLoop = (currentTime) => {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            this.update(deltaTime);
            this.render();

            if (!this.model.state.isGameOver) {
                requestAnimationFrame(gameLoop);
            }
        };

        requestAnimationFrame(gameLoop);
    }

    update(deltaTime) {
        // 게임 로직 업데이트
        this.updateEnemies(deltaTime);
    }

    updateEnemies(deltaTime) {
        this.model.state.enemies.forEach(enemy => {
            enemy.y += enemy.speed * deltaTime;
        });
    }

    render() {
        this.view.clear();
        this.view.renderPlayer(this.model.state.player);
        // ... 기타 렌더링
    }
}

// 앱 초기화
const model = new GameModel();
const view = new GameView('gameCanvas');
const controller = new GameController(model, view);
```

---

## 🧩 모듈화 및 컴포넌트 설계

### Entity Component System (ECS) 패턴
```javascript
// Component - 데이터만 포함
class PositionComponent {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class VelocityComponent {
    constructor(vx, vy) {
        this.vx = vx;
        this.vy = vy;
    }
}

class RenderComponent {
    constructor(sprite, width, height) {
        this.sprite = sprite;
        this.width = width;
        this.height = height;
    }
}

class SensorControlComponent {
    constructor(sensitivity = 1.0) {
        this.sensitivity = sensitivity;
        this.lastOrientation = null;
    }
}

// Entity - 컴포넌트 컨테이너
class Entity {
    constructor(id) {
        this.id = id;
        this.components = new Map();
        this.tags = new Set();
    }

    addComponent(componentName, component) {
        this.components.set(componentName, component);
        return this;
    }

    getComponent(componentName) {
        return this.components.get(componentName);
    }

    hasComponent(componentName) {
        return this.components.has(componentName);
    }

    removeComponent(componentName) {
        this.components.delete(componentName);
    }

    addTag(tag) {
        this.tags.add(tag);
    }

    hasTag(tag) {
        return this.tags.has(tag);
    }
}

// System - 로직 처리
class MovementSystem {
    update(entities, deltaTime) {
        entities.forEach(entity => {
            if (entity.hasComponent('position') &&
                entity.hasComponent('velocity')) {

                const pos = entity.getComponent('position');
                const vel = entity.getComponent('velocity');

                pos.x += vel.vx * deltaTime;
                pos.y += vel.vy * deltaTime;
            }
        });
    }
}

class SensorControlSystem {
    constructor(sdk) {
        this.sdk = sdk;
        this.latestSensorData = null;

        this.sdk.on('sensor-data', (event) => {
            const data = event.detail || event;
            this.latestSensorData = data.data.orientation;
        });
    }

    update(entities, deltaTime) {
        if (!this.latestSensorData) return;

        entities.forEach(entity => {
            if (entity.hasComponent('position') &&
                entity.hasComponent('sensorControl')) {

                const pos = entity.getComponent('position');
                const control = entity.getComponent('sensorControl');
                const { beta, gamma } = this.latestSensorData;

                // 센서 데이터를 위치 변화로 변환
                pos.x += gamma * control.sensitivity * deltaTime;
                pos.y += beta * control.sensitivity * deltaTime;
            }
        });
    }
}

class RenderSystem {
    constructor(ctx) {
        this.ctx = ctx;
    }

    render(entities) {
        entities.forEach(entity => {
            if (entity.hasComponent('position') &&
                entity.hasComponent('render')) {

                const pos = entity.getComponent('position');
                const render = entity.getComponent('render');

                this.ctx.fillStyle = render.sprite;
                this.ctx.fillRect(
                    pos.x - render.width / 2,
                    pos.y - render.height / 2,
                    render.width,
                    render.height
                );
            }
        });
    }
}

// Entity Manager
class EntityManager {
    constructor() {
        this.entities = new Map();
        this.nextEntityId = 0;
    }

    createEntity() {
        const entity = new Entity(this.nextEntityId++);
        this.entities.set(entity.id, entity);
        return entity;
    }

    removeEntity(entityId) {
        this.entities.delete(entityId);
    }

    getEntities() {
        return Array.from(this.entities.values());
    }

    getEntitiesByTag(tag) {
        return this.getEntities().filter(e => e.hasTag(tag));
    }
}

// ECS 게임 엔진
class ECSGameEngine {
    constructor(canvasId, sdk) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.entityManager = new EntityManager();

        // 시스템 등록
        this.systems = {
            sensorControl: new SensorControlSystem(sdk),
            movement: new MovementSystem(),
            render: new RenderSystem(this.ctx)
        };

        this.isRunning = false;
    }

    start() {
        this.isRunning = true;
        let lastTime = 0;

        const gameLoop = (currentTime) => {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            this.update(deltaTime);
            this.render();

            if (this.isRunning) {
                requestAnimationFrame(gameLoop);
            }
        };

        requestAnimationFrame(gameLoop);
    }

    update(deltaTime) {
        const entities = this.entityManager.getEntities();

        this.systems.sensorControl.update(entities, deltaTime);
        this.systems.movement.update(entities, deltaTime);
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const entities = this.entityManager.getEntities();
        this.systems.render.render(entities);
    }

    stop() {
        this.isRunning = false;
    }
}

// 사용 예
const sdk = new SessionSDK({ gameId: 'ecs-game', gameType: 'solo' });
const engine = new ECSGameEngine('gameCanvas', sdk);

// 플레이어 엔티티 생성
const player = engine.entityManager.createEntity();
player.addComponent('position', new PositionComponent(400, 300));
player.addComponent('sensorControl', new SensorControlComponent(2.0));
player.addComponent('render', new RenderComponent('#4CAF50', 40, 40));
player.addTag('player');

sdk.on('connected', () => {
    sdk.createSession();
    engine.start();
});
```

---

## 📦 상태 관리 패턴

### Redux 스타일 상태 관리
```javascript
// 액션 타입 정의
const ActionTypes = {
    PLAYER_MOVED: 'PLAYER_MOVED',
    SCORE_UPDATED: 'SCORE_UPDATED',
    GAME_STARTED: 'GAME_STARTED',
    GAME_PAUSED: 'GAME_PAUSED',
    GAME_OVER: 'GAME_OVER',
    SENSOR_DATA_RECEIVED: 'SENSOR_DATA_RECEIVED'
};

// 초기 상태
const initialState = {
    game: {
        status: 'idle', // idle, playing, paused, over
        score: 0,
        level: 1
    },
    player: {
        x: 0,
        y: 0,
        health: 100,
        speed: 200
    },
    sensors: {
        orientation: { alpha: 0, beta: 0, gamma: 0 },
        acceleration: { x: 0, y: 0, z: 0 }
    }
};

// Reducer
function gameReducer(state = initialState, action) {
    switch(action.type) {
        case ActionTypes.PLAYER_MOVED:
            return {
                ...state,
                player: {
                    ...state.player,
                    x: action.payload.x,
                    y: action.payload.y
                }
            };

        case ActionTypes.SCORE_UPDATED:
            return {
                ...state,
                game: {
                    ...state.game,
                    score: state.game.score + action.payload.points
                }
            };

        case ActionTypes.SENSOR_DATA_RECEIVED:
            return {
                ...state,
                sensors: {
                    orientation: action.payload.orientation,
                    acceleration: action.payload.acceleration
                }
            };

        case ActionTypes.GAME_STARTED:
            return {
                ...state,
                game: {
                    ...state.game,
                    status: 'playing'
                }
            };

        case ActionTypes.GAME_OVER:
            return {
                ...state,
                game: {
                    ...state.game,
                    status: 'over'
                }
            };

        default:
            return state;
    }
}

// Store
class GameStore {
    constructor(reducer, initialState) {
        this.reducer = reducer;
        this.state = initialState;
        this.listeners = [];
    }

    getState() {
        return this.state;
    }

    dispatch(action) {
        this.state = this.reducer(this.state, action);
        this.listeners.forEach(listener => listener(this.state));
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
}

// Action Creators
const actionCreators = {
    movePlayer: (x, y) => ({
        type: ActionTypes.PLAYER_MOVED,
        payload: { x, y }
    }),

    updateScore: (points) => ({
        type: ActionTypes.SCORE_UPDATED,
        payload: { points }
    }),

    receiveSensorData: (orientation, acceleration) => ({
        type: ActionTypes.SENSOR_DATA_RECEIVED,
        payload: { orientation, acceleration }
    }),

    startGame: () => ({
        type: ActionTypes.GAME_STARTED
    }),

    gameOver: () => ({
        type: ActionTypes.GAME_OVER
    })
};

// 사용 예
const store = new GameStore(gameReducer, initialState);

// 상태 변경 구독
store.subscribe((state) => {
    console.log('상태 업데이트:', state);
    updateUI(state);
});

// 센서 데이터 처리
sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    store.dispatch(actionCreators.receiveSensorData(
        data.data.orientation,
        data.data.acceleration
    ));
});

// 게임 로직
function updateGame(deltaTime) {
    const state = store.getState();

    if (state.game.status !== 'playing') return;

    // 센서 데이터 기반 플레이어 이동
    const { beta, gamma } = state.sensors.orientation;
    const newX = state.player.x + gamma * deltaTime * state.player.speed;
    const newY = state.player.y + beta * deltaTime * state.player.speed;

    store.dispatch(actionCreators.movePlayer(newX, newY));
}
```

---

## 🔗 이벤트 기반 아키텍처

### Event Bus 패턴
```javascript
class EventBus {
    constructor() {
        this.events = {};
    }

    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);

        // Unsubscribe 함수 반환
        return () => this.off(eventName, callback);
    }

    once(eventName, callback) {
        const onceWrapper = (...args) => {
            callback(...args);
            this.off(eventName, onceWrapper);
        };
        this.on(eventName, onceWrapper);
    }

    off(eventName, callback) {
        if (!this.events[eventName]) return;

        this.events[eventName] = this.events[eventName].filter(
            cb => cb !== callback
        );
    }

    emit(eventName, ...args) {
        if (!this.events[eventName]) return;

        this.events[eventName].forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`이벤트 핸들러 오류 (${eventName}):`, error);
            }
        });
    }

    clear(eventName) {
        if (eventName) {
            delete this.events[eventName];
        } else {
            this.events = {};
        }
    }
}

// 전역 이벤트 버스
const gameEvents = new EventBus();

// 이벤트 사용 예
gameEvents.on('player:hit', (damage) => {
    console.log(`플레이어가 ${damage} 데미지를 받았습니다`);
});

gameEvents.on('enemy:defeated', (enemyId, score) => {
    console.log(`적 ${enemyId} 처치! +${score}점`);
});

gameEvents.on('game:levelup', (newLevel) => {
    console.log(`레벨 업! 현재 레벨: ${newLevel}`);
});

// 이벤트 발생
gameEvents.emit('player:hit', 10);
gameEvents.emit('enemy:defeated', 'enemy_001', 100);
```

---

## ⏱️ 게임 루프 설계

### 고정 타임스텝 게임 루프
```javascript
class GameLoop {
    constructor(updateCallback, renderCallback) {
        this.updateCallback = updateCallback;
        this.renderCallback = renderCallback;

        this.isRunning = false;
        this.fps = 60;
        this.fixedDeltaTime = 1 / this.fps; // 16.67ms
        this.maxFrameTime = 0.25; // 최대 250ms

        this.accumulator = 0;
        this.lastTime = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;
        this.currentFPS = 0;
    }

    start() {
        this.isRunning = true;
        this.lastTime = performance.now() / 1000;
        this.loop();
    }

    stop() {
        this.isRunning = false;
    }

    loop() {
        if (!this.isRunning) return;

        const currentTime = performance.now() / 1000;
        let frameTime = currentTime - this.lastTime;

        // 프레임 시간이 너무 길면 제한
        if (frameTime > this.maxFrameTime) {
            frameTime = this.maxFrameTime;
        }

        this.lastTime = currentTime;
        this.accumulator += frameTime;

        // 고정 타임스텝으로 업데이트
        while (this.accumulator >= this.fixedDeltaTime) {
            this.updateCallback(this.fixedDeltaTime);
            this.accumulator -= this.fixedDeltaTime;
        }

        // 보간 계수 계산
        const alpha = this.accumulator / this.fixedDeltaTime;

        // 렌더링 (보간 적용)
        this.renderCallback(alpha);

        // FPS 계산
        this.frameCount++;
        if (currentTime - this.fpsUpdateTime >= 1.0) {
            this.currentFPS = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }

        requestAnimationFrame(() => this.loop());
    }

    getFPS() {
        return this.currentFPS;
    }
}

// 사용 예
const gameLoop = new GameLoop(
    // Update callback
    (deltaTime) => {
        // 게임 로직 업데이트
        updatePhysics(deltaTime);
        updateEntities(deltaTime);
        checkCollisions();
    },
    // Render callback
    (alpha) => {
        // 렌더링 (보간 적용)
        clear();
        renderEntities(alpha);
        renderUI();
    }
);

gameLoop.start();
```

---

## 🎯 실전 예제: 완전한 센서 게임 아키텍처

```javascript
// 게임 전체 구조
class SensorGame {
    constructor(config) {
        // 핵심 컴포넌트 초기화
        this.eventBus = new EventBus();
        this.store = new GameStore(gameReducer, initialState);
        this.entityManager = new EntityManager();

        // SessionSDK 초기화
        this.sdk = new SessionSDK({
            gameId: config.gameId,
            gameType: config.gameType
        });

        // 시스템 초기화
        this.systems = {
            sensor: new SensorSystem(this.sdk, this.eventBus),
            physics: new PhysicsSystem(this.eventBus),
            collision: new CollisionSystem(this.eventBus),
            render: new RenderSystem(config.canvasId, this.eventBus)
        };

        // 게임 루프
        this.gameLoop = new GameLoop(
            (dt) => this.update(dt),
            (alpha) => this.render(alpha)
        );

        this.setupEventListeners();
        this.init();
    }

    setupEventListeners() {
        // SDK 이벤트
        this.sdk.on('connected', () => this.onConnected());
        this.sdk.on('session-created', (e) => this.onSessionCreated(e.detail || e));
        this.sdk.on('sensor-data', (e) => this.onSensorData(e.detail || e));

        // 게임 이벤트
        this.eventBus.on('game:start', () => this.start());
        this.eventBus.on('game:pause', () => this.pause());
        this.eventBus.on('game:over', (score) => this.gameOver(score));
    }

    init() {
        // 엔티티 생성
        this.createPlayer();
        this.createEnemies();
    }

    createPlayer() {
        const player = this.entityManager.createEntity();
        player.addComponent('position', new PositionComponent(400, 300));
        player.addComponent('velocity', new VelocityComponent(0, 0));
        player.addComponent('sensorControl', new SensorControlComponent());
        player.addComponent('render', new RenderComponent('#4CAF50', 40, 40));
        player.addComponent('collision', new CollisionComponent(20));
        player.addTag('player');

        return player;
    }

    onConnected() {
        this.sdk.createSession();
    }

    onSessionCreated(session) {
        console.log('세션 생성:', session.sessionCode);
        this.eventBus.emit('session:ready', session);
    }

    onSensorData(data) {
        this.eventBus.emit('sensor:data', data);
    }

    update(deltaTime) {
        const entities = this.entityManager.getEntities();

        // 시스템 업데이트
        this.systems.sensor.update(entities, deltaTime);
        this.systems.physics.update(entities, deltaTime);
        this.systems.collision.update(entities, deltaTime);
    }

    render(alpha) {
        const entities = this.entityManager.getEntities();
        this.systems.render.render(entities, alpha);
    }

    start() {
        this.store.dispatch(actionCreators.startGame());
        this.gameLoop.start();
    }

    pause() {
        this.gameLoop.stop();
    }

    gameOver(score) {
        this.gameLoop.stop();
        this.eventBus.emit('ui:showGameOver', score);
    }
}

// 게임 실행
const game = new SensorGame({
    gameId: 'advanced-sensor-game',
    gameType: 'solo',
    canvasId: 'gameCanvas'
});
```

---

## 🎓 핵심 원칙 요약

1. **단일 책임**: 각 클래스는 하나의 역할만 수행
2. **느슨한 결합**: 컴포넌트 간 의존성 최소화
3. **높은 응집도**: 관련된 기능끼리 모음
4. **확장 가능**: 새 기능 추가 시 기존 코드 수정 최소화
5. **테스트 가능**: 각 모듈을 독립적으로 테스트 가능
6. **재사용성**: 코드를 다른 프로젝트에서도 사용 가능

---

## 📖 다음 단계

- [SessionSDK 심화 사용법](./02-sessionsdk-advanced.md)
- [센서 데이터 마스터리](./03-sensor-data-mastery.md)
- [물리 엔진 구현](./04-physics-engine.md)
