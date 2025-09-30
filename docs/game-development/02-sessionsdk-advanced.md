# 🚀 SessionSDK 심화 사용법 - 완전 마스터 가이드

## 📚 목차
1. [고급 세션 관리](#고급-세션-관리)
2. [이벤트 시스템 심화](#이벤트-시스템-심화)
3. [에러 처리 및 복구](#에러-처리-및-복구)
4. [성능 최적화](#성능-최적화)
5. [보안 및 검증](#보안-및-검증)
6. [멀티플레이어 고급 기능](#멀티플레이어-고급-기능)
7. [실전 구현 패턴](#실전-구현-패턴)
8. [AI 지원 시스템 통합](#ai-지원-시스템-통합)
9. [컨텍스트 관리 및 대화 최적화](#컨텍스트-관리-및-대화-최적화)
10. [실시간 디버깅 및 코드 실행](#실시간-디버깅-및-코드-실행)
11. [만족도 추적 및 성능 모니터링](#만족도-추적-및-성능-모니터링)

---

## 🎯 고급 세션 관리

### 1. 다중 세션 관리
```javascript
class MultiSessionManager {
    constructor() {
        this.sessions = new Map();
        this.activeSession = null;
    }

    async createSession(config) {
        const sessionId = this.generateUniqueId();
        const sdk = new SessionSDK({
            ...config,
            sessionId
        });

        // 세션별 이벤트 바인딩
        sdk.on('connected', (event) => {
            console.log(`세션 ${sessionId} 연결됨`);
            this.handleSessionConnect(sessionId, event);
        });

        sdk.on('disconnected', (event) => {
            console.log(`세션 ${sessionId} 연결 해제`);
            this.handleSessionDisconnect(sessionId, event);
        });

        this.sessions.set(sessionId, {
            sdk,
            config,
            status: 'connecting',
            createdAt: Date.now()
        });

        return sessionId;
    }

    switchSession(sessionId) {
        if (!this.sessions.has(sessionId)) {
            throw new Error(`세션 ${sessionId}을 찾을 수 없습니다`);
        }

        this.activeSession = sessionId;
        const session = this.sessions.get(sessionId);
        return session.sdk;
    }

    closeSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.sdk.disconnect();
            this.sessions.delete(sessionId);
        }
    }
}
```

### 2. 세션 상태 모니터링
```javascript
class SessionMonitor {
    constructor(sdk) {
        this.sdk = sdk;
        this.metrics = {
            connections: 0,
            disconnections: 0,
            errors: 0,
            avgLatency: 0,
            dataTransferred: 0
        };
        this.setupMonitoring();
    }

    setupMonitoring() {
        // 연결 품질 모니터링
        this.sdk.on('connection-quality', (event) => {
            const quality = event.detail || event;
            this.updateConnectionQuality(quality);
        });

        // 레이턴시 측정
        this.latencyInterval = setInterval(() => {
            this.measureLatency();
        }, 5000);

        // 데이터 전송량 추적
        this.sdk.on('data-sent', (event) => {
            this.metrics.dataTransferred += event.size || 0;
        });
    }

    measureLatency() {
        const start = performance.now();
        this.sdk.ping().then(() => {
            const latency = performance.now() - start;
            this.updateLatency(latency);
        }).catch(console.error);
    }

    updateConnectionQuality(quality) {
        // 연결 품질에 따른 자동 최적화
        if (quality.score < 0.5) {
            this.sdk.setDataRate(25); // 낮은 품질시 데이터율 감소
        } else if (quality.score > 0.8) {
            this.sdk.setDataRate(50); // 좋은 품질시 데이터율 증가
        }
    }

    getHealthStatus() {
        return {
            isHealthy: this.metrics.errors < 10,
            quality: this.calculateOverallQuality(),
            metrics: this.metrics,
            recommendations: this.getRecommendations()
        };
    }
}
```

### 3. 자동 재연결 시스템
```javascript
class AutoReconnectManager {
    constructor(sdk, options = {}) {
        this.sdk = sdk;
        this.options = {
            maxRetries: 5,
            initialDelay: 1000,
            maxDelay: 30000,
            backoffMultiplier: 2,
            ...options
        };
        this.retryCount = 0;
        this.isReconnecting = false;
        this.setupAutoReconnect();
    }

    setupAutoReconnect() {
        this.sdk.on('disconnected', (event) => {
            if (!this.isReconnecting && event.code !== 'USER_INITIATED') {
                this.startReconnection();
            }
        });

        this.sdk.on('connected', () => {
            this.resetRetryCount();
        });
    }

    async startReconnection() {
        this.isReconnecting = true;

        while (this.retryCount < this.options.maxRetries) {
            const delay = this.calculateDelay();
            console.log(`재연결 시도 ${this.retryCount + 1}/${this.options.maxRetries} - ${delay}ms 후`);

            await this.wait(delay);

            try {
                await this.sdk.connect();
                console.log('재연결 성공!');
                this.isReconnecting = false;
                return true;
            } catch (error) {
                this.retryCount++;
                console.error(`재연결 실패 (${this.retryCount}/${this.options.maxRetries}):`, error);
            }
        }

        console.error('최대 재연결 시도 횟수 초과');
        this.isReconnecting = false;
        this.sdk.emit('reconnection-failed');
        return false;
    }

    calculateDelay() {
        return Math.min(
            this.options.initialDelay * Math.pow(this.options.backoffMultiplier, this.retryCount),
            this.options.maxDelay
        );
    }

    resetRetryCount() {
        this.retryCount = 0;
        this.isReconnecting = false;
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
```

---

## 🎪 이벤트 시스템 심화

### 1. 커스텀 이벤트 생성 및 관리
```javascript
class CustomEventManager {
    constructor(sdk) {
        this.sdk = sdk;
        this.eventHandlers = new Map();
        this.middleware = [];
        this.setupEventSystem();
    }

    // 미들웨어 추가 (로깅, 검증 등)
    use(middleware) {
        this.middleware.push(middleware);
    }

    // 커스텀 이벤트 정의
    defineEvent(eventName, validator) {
        this.eventHandlers.set(eventName, {
            validators: validator ? [validator] : [],
            handlers: []
        });
    }

    // 이벤트 리스너 등록 (체인 가능)
    on(eventName, handler, priority = 0) {
        if (!this.eventHandlers.has(eventName)) {
            this.defineEvent(eventName);
        }

        const eventInfo = this.eventHandlers.get(eventName);
        eventInfo.handlers.push({ handler, priority });

        // 우선순위 정렬
        eventInfo.handlers.sort((a, b) => b.priority - a.priority);

        return this; // 체인 가능
    }

    // 이벤트 발생
    async emit(eventName, data) {
        // 미들웨어 실행
        for (const middleware of this.middleware) {
            data = await middleware(eventName, data) || data;
        }

        // 검증 실행
        const eventInfo = this.eventHandlers.get(eventName);
        if (eventInfo && eventInfo.validators.length > 0) {
            for (const validator of eventInfo.validators) {
                if (!validator(data)) {
                    throw new Error(`이벤트 ${eventName} 데이터 검증 실패`);
                }
            }
        }

        // 핸들러 실행
        if (eventInfo && eventInfo.handlers.length > 0) {
            for (const { handler } of eventInfo.handlers) {
                try {
                    await handler(data);
                } catch (error) {
                    console.error(`이벤트 핸들러 오류 (${eventName}):`, error);
                }
            }
        }

        // 글로벌 이벤트로도 전파
        this.sdk.emit(eventName, data);
    }

    setupEventSystem() {
        // 로깅 미들웨어
        this.use((eventName, data) => {
            console.debug(`이벤트 발생: ${eventName}`, data);
        });

        // 성능 측정 미들웨어
        this.use((eventName, data) => {
            const start = performance.now();
            return {
                ...data,
                _performance: { start }
            };
        });
    }
}

// 사용 예시
const eventManager = new CustomEventManager(sdk);

// 게임별 커스텀 이벤트 정의
eventManager.defineEvent('player-scored', (data) => {
    return data.score >= 0 && typeof data.playerId === 'string';
});

eventManager.defineEvent('game-state-changed', (data) => {
    return ['waiting', 'playing', 'paused', 'finished'].includes(data.state);
});

// 체인 방식 이벤트 등록
eventManager
    .on('player-scored', (data) => {
        console.log(`플레이어 ${data.playerId}가 ${data.score}점 획득!`);
    }, 10) // 높은 우선순위
    .on('player-scored', (data) => {
        this.updateLeaderboard(data);
    }, 5)
    .on('game-state-changed', (data) => {
        this.handleGameStateChange(data);
    });
```

### 2. 이벤트 큐 및 배치 처리
```javascript
class EventQueue {
    constructor(options = {}) {
        this.options = {
            batchSize: 10,
            flushInterval: 100,
            maxQueueSize: 1000,
            ...options
        };
        this.queue = [];
        this.processing = false;
        this.setupBatchProcessing();
    }

    enqueue(event) {
        if (this.queue.length >= this.options.maxQueueSize) {
            this.queue.shift(); // 오래된 이벤트 제거
        }

        this.queue.push({
            ...event,
            timestamp: Date.now(),
            id: this.generateEventId()
        });

        if (this.queue.length >= this.options.batchSize) {
            this.flush();
        }
    }

    async flush() {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;
        const batch = this.queue.splice(0, this.options.batchSize);

        try {
            await this.processBatch(batch);
        } catch (error) {
            console.error('배치 처리 오류:', error);
            // 실패한 이벤트 재시도
            this.queue.unshift(...batch);
        } finally {
            this.processing = false;
        }
    }

    async processBatch(events) {
        // 타입별 그룹핑
        const groupedEvents = events.reduce((acc, event) => {
            if (!acc[event.type]) acc[event.type] = [];
            acc[event.type].push(event);
            return acc;
        }, {});

        // 병렬 처리
        await Promise.all(
            Object.entries(groupedEvents).map(([type, typeEvents]) => {
                return this.processEventType(type, typeEvents);
            })
        );
    }

    setupBatchProcessing() {
        // 주기적 플러시
        setInterval(() => {
            this.flush();
        }, this.options.flushInterval);
    }
}
```

---

## 🛠️ 에러 처리 및 복구

### 1. 포괄적 에러 처리 시스템
```javascript
class ErrorHandler {
    constructor(sdk) {
        this.sdk = sdk;
        this.errorCounts = new Map();
        this.setupErrorHandling();
    }

    setupErrorHandling() {
        // WebSocket 에러
        this.sdk.on('error', (error) => {
            this.handleError('websocket', error);
        });

        // 센서 데이터 에러
        this.sdk.on('sensor-error', (error) => {
            this.handleError('sensor', error);
        });

        // 세션 에러
        this.sdk.on('session-error', (error) => {
            this.handleError('session', error);
        });

        // 일반적인 에러 캐치
        window.addEventListener('error', (event) => {
            this.handleError('general', event.error);
        });

        // Promise 거부 에러
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError('promise', event.reason);
        });
    }

    handleError(category, error) {
        // 에러 수집 및 분석
        this.recordError(category, error);

        // 에러 타입별 처리
        switch (category) {
            case 'websocket':
                this.handleWebSocketError(error);
                break;
            case 'sensor':
                this.handleSensorError(error);
                break;
            case 'session':
                this.handleSessionError(error);
                break;
            default:
                this.handleGenericError(error);
        }

        // 사용자 알림
        this.notifyUser(category, error);
    }

    handleWebSocketError(error) {
        if (error.code === 1006) { // 비정상 연결 종료
            console.warn('WebSocket 연결이 비정상 종료됨 - 재연결 시도');
            this.sdk.reconnect();
        } else if (error.code === 1011) { // 서버 오류
            console.error('서버 오류 발생 - 잠시 후 다시 시도');
            setTimeout(() => this.sdk.reconnect(), 5000);
        }
    }

    handleSensorError(error) {
        if (error.name === 'NotAllowedError') {
            this.showPermissionDialog();
        } else if (error.name === 'NotSupportedError') {
            this.showUnsupportedDeviceMessage();
        } else {
            console.error('센서 오류:', error);
            this.suggestRefresh();
        }
    }

    handleSessionError(error) {
        if (error.code === 'SESSION_EXPIRED') {
            console.warn('세션 만료 - 새로운 세션 생성');
            this.sdk.createNewSession();
        } else if (error.code === 'SESSION_FULL') {
            console.error('세션 정원 초과');
            this.showSessionFullMessage();
        }
    }

    recordError(category, error) {
        const key = `${category}:${error.name || error.code || 'unknown'}`;
        const count = this.errorCounts.get(key) || 0;
        this.errorCounts.set(key, count + 1);

        // 임계값 초과시 알림
        if (count > 10) {
            console.warn(`반복적인 에러 발생: ${key} (${count}회)`);
            this.sdk.emit('critical-error', { category, error, count });
        }
    }

    getErrorReport() {
        return {
            timestamp: Date.now(),
            errors: Array.from(this.errorCounts.entries()).map(([key, count]) => ({
                type: key,
                count,
                severity: this.calculateSeverity(key, count)
            })),
            recommendations: this.getRecommendations()
        };
    }
}
```

### 2. 자동 복구 시스템
```javascript
class RecoverySystem {
    constructor(sdk) {
        this.sdk = sdk;
        this.recoveryStrategies = new Map();
        this.setupRecoveryStrategies();
    }

    setupRecoveryStrategies() {
        // WebSocket 연결 복구
        this.addStrategy('websocket-disconnected', async () => {
            console.log('WebSocket 연결 복구 시도...');
            await this.sdk.reconnect();
            return this.sdk.isConnected();
        });

        // 센서 권한 복구
        this.addStrategy('sensor-permission-denied', async () => {
            console.log('센서 권한 복구 시도...');
            const permission = await this.requestSensorPermission();
            return permission === 'granted';
        });

        // 세션 복구
        this.addStrategy('session-expired', async () => {
            console.log('세션 복구 시도...');
            const newSession = await this.sdk.createSession();
            return newSession !== null;
        });

        // 메모리 정리
        this.addStrategy('memory-leak', async () => {
            console.log('메모리 정리 시도...');
            this.cleanupMemory();
            return true;
        });
    }

    addStrategy(errorType, recoveryFunction) {
        this.recoveryStrategies.set(errorType, recoveryFunction);
    }

    async attemptRecovery(errorType) {
        const strategy = this.recoveryStrategies.get(errorType);
        if (!strategy) {
            console.warn(`복구 전략을 찾을 수 없음: ${errorType}`);
            return false;
        }

        try {
            const recovered = await strategy();
            if (recovered) {
                console.log(`복구 성공: ${errorType}`);
                this.sdk.emit('recovery-success', { errorType });
            } else {
                console.error(`복구 실패: ${errorType}`);
                this.sdk.emit('recovery-failed', { errorType });
            }
            return recovered;
        } catch (error) {
            console.error(`복구 중 오류 발생 (${errorType}):`, error);
            return false;
        }
    }

    cleanupMemory() {
        // 불필요한 이벤트 리스너 정리
        this.sdk.removeAllListeners('temp-*');

        // 캐시 정리
        if (this.sdk.cache) {
            this.sdk.cache.clear();
        }

        // 가비지 컬렉션 힌트
        if (window.gc) {
            window.gc();
        }
    }
}
```

---

## ⚡ 성능 최적화

### 1. 데이터 압축 및 최적화
```javascript
class DataOptimizer {
    constructor() {
        this.compressionEnabled = true;
        this.batchingEnabled = true;
        this.deltaCompressionEnabled = true;
        this.lastSensorData = null;
    }

    optimizeSensorData(data) {
        let optimized = data;

        // 델타 압축 (이전 데이터와 차이만 전송)
        if (this.deltaCompressionEnabled && this.lastSensorData) {
            optimized = this.createDelta(this.lastSensorData, data);
        }

        // 정밀도 조절 (불필요한 소수점 제거)
        optimized = this.reducePrecision(optimized, 3);

        // 임계값 기반 필터링 (작은 변화 무시)
        optimized = this.applyThreshold(optimized, 0.01);

        this.lastSensorData = data;
        return optimized;
    }

    createDelta(previous, current) {
        const delta = { timestamp: current.timestamp };

        // 각 센서 데이터에 대해 델타 계산
        for (const [key, value] of Object.entries(current.data)) {
            if (typeof value === 'object' && previous.data[key]) {
                delta[key] = {};
                for (const [subKey, subValue] of Object.entries(value)) {
                    const prevValue = previous.data[key][subKey];
                    if (Math.abs(subValue - prevValue) > 0.001) {
                        delta[key][subKey] = subValue;
                    }
                }
            }
        }

        return delta;
    }

    reducePrecision(data, digits) {
        const result = { ...data };

        function roundNumber(num) {
            return Math.round(num * Math.pow(10, digits)) / Math.pow(10, digits);
        }

        function processObject(obj) {
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'number') {
                    obj[key] = roundNumber(value);
                } else if (typeof value === 'object' && value !== null) {
                    processObject(value);
                }
            }
        }

        processObject(result);
        return result;
    }

    applyThreshold(data, threshold) {
        // 이전 값과 차이가 임계값 이하면 전송하지 않음
        if (!this.lastSensorData) return data;

        const result = { ...data };

        // 각 센서 값 검사
        for (const [category, values] of Object.entries(data.data)) {
            if (typeof values === 'object') {
                for (const [key, value] of Object.entries(values)) {
                    const prevValue = this.lastSensorData.data[category]?.[key] || 0;
                    if (Math.abs(value - prevValue) < threshold) {
                        delete result.data[category][key];
                    }
                }
            }
        }

        return result;
    }
}
```

### 2. 메모리 관리 및 캐싱
```javascript
class MemoryManager {
    constructor(maxMemoryMB = 100) {
        this.maxMemory = maxMemoryMB * 1024 * 1024; // 바이트 단위
        this.cache = new Map();
        this.memoryUsage = 0;
        this.setupMemoryMonitoring();
    }

    setupMemoryMonitoring() {
        setInterval(() => {
            this.checkMemoryUsage();
        }, 30000); // 30초마다 체크

        // 메모리 경고 감지
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
                    console.warn('메모리 사용량이 높습니다. 정리를 시작합니다.');
                    this.forceCleanup();
                }
            }, 10000);
        }
    }

    set(key, value, ttl = 300000) { // 기본 5분 TTL
        // 메모리 사용량 추정
        const estimatedSize = this.estimateSize(value);

        // 메모리 부족시 정리
        if (this.memoryUsage + estimatedSize > this.maxMemory) {
            this.cleanup();
        }

        // 캐시 저장
        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl,
            size: estimatedSize
        });

        this.memoryUsage += estimatedSize;
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        // TTL 체크
        if (Date.now() - item.timestamp > item.ttl) {
            this.delete(key);
            return null;
        }

        return item.value;
    }

    delete(key) {
        const item = this.cache.get(key);
        if (item) {
            this.memoryUsage -= item.size;
            this.cache.delete(key);
        }
    }

    cleanup() {
        const now = Date.now();
        const itemsToDelete = [];

        // 만료된 항목 찾기
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > item.ttl) {
                itemsToDelete.push(key);
            }
        }

        // 만료된 항목 삭제
        itemsToDelete.forEach(key => this.delete(key));

        // 여전히 메모리가 부족하면 LRU 방식으로 삭제
        if (this.memoryUsage > this.maxMemory * 0.8) {
            const sortedItems = Array.from(this.cache.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp);

            const toDelete = sortedItems.slice(0, Math.floor(sortedItems.length * 0.3));
            toDelete.forEach(([key]) => this.delete(key));
        }
    }

    forceCleanup() {
        this.cache.clear();
        this.memoryUsage = 0;

        // 가비지 컬렉션 힌트
        if (window.gc) {
            window.gc();
        }
    }

    estimateSize(obj) {
        // 대략적인 객체 크기 계산
        return JSON.stringify(obj).length * 2; // UTF-16 문자 기준
    }

    getStats() {
        return {
            cacheSize: this.cache.size,
            memoryUsage: this.memoryUsage,
            memoryUsagePercentage: (this.memoryUsage / this.maxMemory) * 100,
            oldestItem: this.getOldestItemAge(),
            newestItem: this.getNewestItemAge()
        };
    }
}
```

---

## 🔐 보안 및 검증

### 1. 데이터 검증 시스템
```javascript
class DataValidator {
    constructor() {
        this.schemas = new Map();
        this.setupDefaultSchemas();
    }

    setupDefaultSchemas() {
        // 센서 데이터 스키마
        this.addSchema('sensor-data', {
            sensorId: { type: 'string', required: true },
            gameType: { type: 'string', enum: ['solo', 'dual', 'multi'] },
            data: {
                type: 'object',
                properties: {
                    orientation: {
                        type: 'object',
                        properties: {
                            alpha: { type: 'number', min: 0, max: 360 },
                            beta: { type: 'number', min: -180, max: 180 },
                            gamma: { type: 'number', min: -90, max: 90 }
                        }
                    },
                    acceleration: {
                        type: 'object',
                        properties: {
                            x: { type: 'number', min: -50, max: 50 },
                            y: { type: 'number', min: -50, max: 50 },
                            z: { type: 'number', min: -50, max: 50 }
                        }
                    }
                }
            },
            timestamp: { type: 'number', required: true }
        });

        // 세션 데이터 스키마
        this.addSchema('session', {
            sessionCode: { type: 'string', pattern: /^[A-Z0-9]{4}$/ },
            gameId: { type: 'string', required: true },
            playersConnected: { type: 'number', min: 0, max: 10 },
            status: { type: 'string', enum: ['waiting', 'playing', 'finished'] }
        });
    }

    addSchema(name, schema) {
        this.schemas.set(name, schema);
    }

    validate(schemaName, data) {
        const schema = this.schemas.get(schemaName);
        if (!schema) {
            throw new Error(`스키마를 찾을 수 없음: ${schemaName}`);
        }

        const errors = [];
        this.validateObject(data, schema, '', errors);

        return {
            valid: errors.length === 0,
            errors
        };
    }

    validateObject(data, schema, path, errors) {
        // 필수 필드 체크
        if (schema.required) {
            for (const field of schema.required) {
                if (!(field in data)) {
                    errors.push(`필수 필드 누락: ${path}.${field}`);
                }
            }
        }

        // 각 속성 검증
        if (schema.properties) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                if (key in data) {
                    this.validateValue(data[key], propSchema, `${path}.${key}`, errors);
                }
            }
        }
    }

    validateValue(value, schema, path, errors) {
        // 타입 체크
        if (schema.type && typeof value !== schema.type) {
            errors.push(`타입 불일치: ${path} (예상: ${schema.type}, 실제: ${typeof value})`);
            return;
        }

        // 숫자 범위 체크
        if (schema.type === 'number') {
            if (schema.min !== undefined && value < schema.min) {
                errors.push(`값이 최소값보다 작음: ${path} (최소: ${schema.min}, 실제: ${value})`);
            }
            if (schema.max !== undefined && value > schema.max) {
                errors.push(`값이 최대값보다 큼: ${path} (최대: ${schema.max}, 실제: ${value})`);
            }
        }

        // 열거형 체크
        if (schema.enum && !schema.enum.includes(value)) {
            errors.push(`허용되지 않은 값: ${path} (허용: ${schema.enum.join(', ')}, 실제: ${value})`);
        }

        // 패턴 체크
        if (schema.pattern && !schema.pattern.test(value)) {
            errors.push(`패턴 불일치: ${path} (패턴: ${schema.pattern})`);
        }

        // 객체 재귀 검증
        if (schema.type === 'object' && schema.properties) {
            this.validateObject(value, schema, path, errors);
        }
    }
}
```

### 2. 보안 통신
```javascript
class SecureChannel {
    constructor(sdk) {
        this.sdk = sdk;
        this.encryptionEnabled = false;
        this.keyPair = null;
        this.sessionKey = null;
        this.setupSecureChannel();
    }

    async setupSecureChannel() {
        try {
            // 키 쌍 생성
            this.keyPair = await this.generateKeyPair();
            console.log('보안 채널 키 쌍 생성 완료');

            // 핸드셰이크 시작
            await this.performHandshake();

            this.encryptionEnabled = true;
            console.log('보안 채널 활성화됨');
        } catch (error) {
            console.warn('보안 채널 설정 실패, 일반 통신 사용:', error);
            this.encryptionEnabled = false;
        }
    }

    async generateKeyPair() {
        return await window.crypto.subtle.generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256'
            },
            false,
            ['encrypt', 'decrypt']
        );
    }

    async performHandshake() {
        // 공개키를 서버에 전송
        const publicKey = await this.exportPublicKey();
        const handshakeResponse = await this.sdk.send('security-handshake', {
            publicKey,
            clientId: this.generateClientId()
        });

        // 서버의 세션키 복호화
        this.sessionKey = await this.decryptSessionKey(handshakeResponse.encryptedSessionKey);
    }

    async encryptData(data) {
        if (!this.encryptionEnabled || !this.sessionKey) {
            return data;
        }

        try {
            const jsonData = JSON.stringify(data);
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(jsonData);

            const encrypted = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: new Uint8Array(12) },
                this.sessionKey,
                dataBuffer
            );

            return {
                encrypted: Array.from(new Uint8Array(encrypted)),
                encrypted: true
            };
        } catch (error) {
            console.error('데이터 암호화 실패:', error);
            return data; // 암호화 실패시 원본 반환
        }
    }

    async decryptData(encryptedData) {
        if (!encryptedData.encrypted || !this.sessionKey) {
            return encryptedData;
        }

        try {
            const encryptedBuffer = new Uint8Array(encryptedData.encrypted).buffer;

            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: new Uint8Array(12) },
                this.sessionKey,
                encryptedBuffer
            );

            const decoder = new TextDecoder();
            const jsonString = decoder.decode(decrypted);
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('데이터 복호화 실패:', error);
            throw error;
        }
    }

    generateClientId() {
        return Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
}
```

---

## 🌐 멀티플레이어 고급 기능

### 1. 플레이어 동기화
```javascript
class PlayerSynchronizer {
    constructor(sdk) {
        this.sdk = sdk;
        this.players = new Map();
        this.syncInterval = 50; // 20 FPS
        this.maxLatency = 200; // 200ms
        this.setupSynchronization();
    }

    setupSynchronization() {
        // 플레이어 상태 업데이트 수신
        this.sdk.on('player-update', (event) => {
            const update = event.detail || event;
            this.handlePlayerUpdate(update);
        });

        // 주기적 동기화
        setInterval(() => {
            this.synchronizePlayers();
        }, this.syncInterval);

        // 레이턴시 측정
        setInterval(() => {
            this.measureLatency();
        }, 5000);
    }

    handlePlayerUpdate(update) {
        const { playerId, position, velocity, action, timestamp } = update;

        if (!this.players.has(playerId)) {
            this.players.set(playerId, {
                id: playerId,
                position: { x: 0, y: 0 },
                velocity: { x: 0, y: 0 },
                lastUpdate: 0,
                interpolationTarget: null,
                extrapolationTime: 0
            });
        }

        const player = this.players.get(playerId);

        // 레이턴시 보상
        const latency = Date.now() - timestamp;
        const compensatedPosition = this.compensateForLatency(position, velocity, latency);

        // 보간 타겟 설정
        player.interpolationTarget = {
            position: compensatedPosition,
            velocity,
            timestamp: Date.now()
        };

        player.lastUpdate = timestamp;
    }

    compensateForLatency(position, velocity, latency) {
        // 레이턴시 시간만큼 미래 위치 예측
        const timeFactor = Math.min(latency / 1000, 0.5); // 최대 0.5초

        return {
            x: position.x + velocity.x * timeFactor,
            y: position.y + velocity.y * timeFactor
        };
    }

    synchronizePlayers() {
        for (const player of this.players.values()) {
            if (!player.interpolationTarget) continue;

            const now = Date.now();
            const timeSinceTarget = now - player.interpolationTarget.timestamp;
            const interpolationFactor = Math.min(timeSinceTarget / this.syncInterval, 1);

            // 선형 보간
            player.position.x = this.lerp(
                player.position.x,
                player.interpolationTarget.position.x,
                interpolationFactor
            );
            player.position.y = this.lerp(
                player.position.y,
                player.interpolationTarget.position.y,
                interpolationFactor
            );

            // 보간 완료시 타겟 제거
            if (interpolationFactor >= 1) {
                player.interpolationTarget = null;
            }
        }

        // 플레이어 상태 업데이트 이벤트 발생
        this.sdk.emit('players-synchronized', {
            players: Array.from(this.players.values())
        });
    }

    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    extrapolatePosition(player) {
        // 연결 끊김시 위치 예측
        const timeSinceLastUpdate = Date.now() - player.lastUpdate;
        if (timeSinceLastUpdate > this.maxLatency) {
            const extrapolationTime = Math.min(timeSinceLastUpdate / 1000, 1);

            return {
                x: player.position.x + player.velocity.x * extrapolationTime,
                y: player.position.y + player.velocity.y * extrapolationTime
            };
        }

        return player.position;
    }

    measureLatency() {
        const start = performance.now();
        this.sdk.send('ping', { timestamp: start }).then(() => {
            const latency = performance.now() - start;
            this.sdk.emit('latency-measured', { latency });
        });
    }

    getPlayerState(playerId) {
        const player = this.players.get(playerId);
        if (!player) return null;

        return {
            ...player,
            predictedPosition: this.extrapolatePosition(player)
        };
    }
}
```

### 2. 충돌 탐지 및 해결
```javascript
class CollisionResolver {
    constructor() {
        this.collisions = new Map();
        this.resolutionStrategies = new Map();
        this.setupResolutionStrategies();
    }

    setupResolutionStrategies() {
        // 서버 권한
        this.addStrategy('server-authority', (collision) => {
            return collision.serverState;
        });

        // 타임스탬프 기반
        this.addStrategy('timestamp-based', (collision) => {
            return collision.states.reduce((latest, state) => {
                return state.timestamp > latest.timestamp ? state : latest;
            });
        });

        // 예측 보간
        this.addStrategy('predictive-interpolation', (collision) => {
            return this.interpolateStates(collision.states);
        });

        // 롤백 및 재시뮬레이션
        this.addStrategy('rollback-resimulation', (collision) => {
            return this.rollbackAndResimulate(collision);
        });
    }

    detectCollision(localState, remoteStates) {
        const collisions = [];

        for (const remoteState of remoteStates) {
            if (this.statesConflict(localState, remoteState)) {
                collisions.push({
                    type: 'state-conflict',
                    localState,
                    remoteState,
                    timestamp: Date.now(),
                    severity: this.calculateSeverity(localState, remoteState)
                });
            }
        }

        return collisions;
    }

    statesConflict(state1, state2) {
        // 위치 차이 체크
        const positionDiff = this.calculateDistance(state1.position, state2.position);
        if (positionDiff > 50) return true; // 50px 이상 차이

        // 액션 충돌 체크
        if (state1.action && state2.action && state1.action.type === state2.action.type) {
            const timeDiff = Math.abs(state1.timestamp - state2.timestamp);
            if (timeDiff < 100) return true; // 100ms 내 동일 액션
        }

        return false;
    }

    async resolveCollision(collision, strategy = 'predictive-interpolation') {
        const resolver = this.resolutionStrategies.get(strategy);
        if (!resolver) {
            throw new Error(`충돌 해결 전략을 찾을 수 없음: ${strategy}`);
        }

        try {
            const resolvedState = await resolver(collision);

            // 해결 결과 검증
            if (this.validateResolvedState(resolvedState)) {
                this.recordResolution(collision, resolvedState, strategy);
                return resolvedState;
            } else {
                throw new Error('해결된 상태가 유효하지 않음');
            }
        } catch (error) {
            console.error(`충돌 해결 실패 (${strategy}):`, error);

            // 폴백 전략 시도
            if (strategy !== 'server-authority') {
                return this.resolveCollision(collision, 'server-authority');
            } else {
                throw error;
            }
        }
    }

    interpolateStates(states) {
        if (states.length < 2) return states[0];

        // 타임스탬프 정렬
        const sortedStates = states.sort((a, b) => a.timestamp - b.timestamp);

        // 가중 평균 계산
        const weights = sortedStates.map((state, index) => {
            return 1 / (index + 1); // 최신일수록 높은 가중치
        });

        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

        return {
            position: {
                x: sortedStates.reduce((sum, state, index) =>
                    sum + state.position.x * weights[index], 0) / totalWeight,
                y: sortedStates.reduce((sum, state, index) =>
                    sum + state.position.y * weights[index], 0) / totalWeight
            },
            velocity: {
                x: sortedStates.reduce((sum, state, index) =>
                    sum + state.velocity.x * weights[index], 0) / totalWeight,
                y: sortedStates.reduce((sum, state, index) =>
                    sum + state.velocity.y * weights[index], 0) / totalWeight
            },
            timestamp: Date.now(),
            interpolated: true
        };
    }

    rollbackAndResimulate(collision) {
        // 충돌 이전 상태로 롤백
        const rollbackPoint = Math.min(
            collision.localState.timestamp,
            collision.remoteState.timestamp
        ) - 100; // 100ms 전으로 롤백

        // 롤백된 상태에서 재시뮬레이션
        const simulationSteps = Math.floor((Date.now() - rollbackPoint) / 16); // 60FPS 기준

        let currentState = this.getRollbackState(rollbackPoint);

        for (let i = 0; i < simulationSteps; i++) {
            currentState = this.simulateStep(currentState, 16);
        }

        return currentState;
    }

    calculateDistance(pos1, pos2) {
        return Math.sqrt(
            Math.pow(pos1.x - pos2.x, 2) +
            Math.pow(pos1.y - pos2.y, 2)
        );
    }

    calculateSeverity(state1, state2) {
        const positionSeverity = this.calculateDistance(state1.position, state2.position) / 100;
        const timeSeverity = Math.abs(state1.timestamp - state2.timestamp) / 1000;

        return Math.min(positionSeverity + timeSeverity, 1);
    }

    recordResolution(collision, resolvedState, strategy) {
        this.collisions.set(collision.timestamp, {
            collision,
            resolvedState,
            strategy,
            resolvedAt: Date.now()
        });
    }
}
```

---

## 🎯 실전 구현 패턴

### 1. 게임 상태 관리 패턴
```javascript
class GameStateManager {
    constructor(sdk) {
        this.sdk = sdk;
        this.currentState = 'idle';
        this.stateHistory = [];
        this.stateMachine = this.createStateMachine();
        this.stateListeners = new Map();
        this.setupStateManagement();
    }

    createStateMachine() {
        return {
            idle: {
                canTransitionTo: ['connecting', 'error'],
                onEnter: () => this.onIdleEnter(),
                onExit: () => this.onIdleExit()
            },
            connecting: {
                canTransitionTo: ['connected', 'error'],
                onEnter: () => this.onConnectingEnter(),
                timeout: 10000 // 10초 후 타임아웃
            },
            connected: {
                canTransitionTo: ['session_creating', 'error'],
                onEnter: () => this.onConnectedEnter()
            },
            session_creating: {
                canTransitionTo: ['waiting_players', 'error'],
                onEnter: () => this.onSessionCreatingEnter(),
                timeout: 5000
            },
            waiting_players: {
                canTransitionTo: ['ready', 'error'],
                onEnter: () => this.onWaitingPlayersEnter()
            },
            ready: {
                canTransitionTo: ['playing', 'waiting_players'],
                onEnter: () => this.onReadyEnter()
            },
            playing: {
                canTransitionTo: ['paused', 'finished', 'error'],
                onEnter: () => this.onPlayingEnter(),
                onUpdate: (deltaTime) => this.updateGameplay(deltaTime)
            },
            paused: {
                canTransitionTo: ['playing', 'finished'],
                onEnter: () => this.onPausedEnter()
            },
            finished: {
                canTransitionTo: ['idle'],
                onEnter: () => this.onFinishedEnter(),
                autoTransition: { to: 'idle', delay: 10000 }
            },
            error: {
                canTransitionTo: ['idle'],
                onEnter: () => this.onErrorEnter(),
                autoTransition: { to: 'idle', delay: 5000 }
            }
        };
    }

    transition(newState) {
        const currentStateDef = this.stateMachine[this.currentState];

        // 전환 가능 여부 체크
        if (!currentStateDef.canTransitionTo.includes(newState)) {
            console.warn(`Invalid transition: ${this.currentState} -> ${newState}`);
            return false;
        }

        // 현재 상태 종료
        if (currentStateDef.onExit) {
            currentStateDef.onExit();
        }

        // 히스토리 저장
        this.stateHistory.push({
            from: this.currentState,
            to: newState,
            timestamp: Date.now()
        });

        // 상태 변경
        const previousState = this.currentState;
        this.currentState = newState;

        // 새 상태 진입
        const newStateDef = this.stateMachine[newState];
        if (newStateDef.onEnter) {
            newStateDef.onEnter();
        }

        // 자동 전환 설정
        if (newStateDef.autoTransition) {
            setTimeout(() => {
                if (this.currentState === newState) {
                    this.transition(newStateDef.autoTransition.to);
                }
            }, newStateDef.autoTransition.delay);
        }

        // 타임아웃 설정
        if (newStateDef.timeout) {
            setTimeout(() => {
                if (this.currentState === newState) {
                    console.warn(`State timeout: ${newState}`);
                    this.transition('error');
                }
            }, newStateDef.timeout);
        }

        // 이벤트 발생
        this.sdk.emit('state-changed', {
            previous: previousState,
            current: newState,
            timestamp: Date.now()
        });

        // 상태별 리스너 실행
        this.notifyStateListeners(newState, previousState);

        return true;
    }

    addStateListener(state, callback) {
        if (!this.stateListeners.has(state)) {
            this.stateListeners.set(state, []);
        }
        this.stateListeners.get(state).push(callback);
    }

    notifyStateListeners(state, previousState) {
        const listeners = this.stateListeners.get(state);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(state, previousState);
                } catch (error) {
                    console.error(`State listener error (${state}):`, error);
                }
            });
        }
    }

    // 상태별 핸들러
    onIdleEnter() {
        console.log('게임 대기 상태');
        this.sdk.emit('game-idle');
    }

    onConnectingEnter() {
        console.log('서버 연결 중...');
        this.sdk.connect().then(() => {
            this.transition('connected');
        }).catch(() => {
            this.transition('error');
        });
    }

    onConnectedEnter() {
        console.log('서버 연결됨');
        this.transition('session_creating');
    }

    onSessionCreatingEnter() {
        console.log('세션 생성 중...');
        this.sdk.createSession().then(() => {
            this.transition('waiting_players');
        }).catch(() => {
            this.transition('error');
        });
    }

    onWaitingPlayersEnter() {
        console.log('플레이어 대기 중...');
        // 플레이어 연결 확인
    }

    onReadyEnter() {
        console.log('게임 준비 완료');
        // 카운트다운 시작
        this.startCountdown();
    }

    onPlayingEnter() {
        console.log('게임 시작!');
        this.gameStartTime = Date.now();
        this.sdk.emit('game-started');
    }

    onPausedEnter() {
        console.log('게임 일시정지');
        this.sdk.emit('game-paused');
    }

    onFinishedEnter() {
        console.log('게임 종료');
        this.gameEndTime = Date.now();
        this.sdk.emit('game-finished', {
            duration: this.gameEndTime - this.gameStartTime
        });
    }

    onErrorEnter() {
        console.error('오류 발생');
        this.sdk.emit('game-error');
    }

    startCountdown(duration = 3) {
        let count = duration;
        const countdown = setInterval(() => {
            this.sdk.emit('countdown', count);
            count--;

            if (count < 0) {
                clearInterval(countdown);
                this.transition('playing');
            }
        }, 1000);
    }

    getCurrentState() {
        return {
            state: this.currentState,
            definition: this.stateMachine[this.currentState],
            history: this.stateHistory.slice(-10) // 최근 10개 히스토리
        };
    }
}
```

### 2. 리소스 관리 패턴
```javascript
class ResourceManager {
    constructor() {
        this.resources = new Map();
        this.loadingQueue = [];
        this.maxConcurrentLoads = 3;
        this.currentLoads = 0;
        this.loadingPromises = new Map();
        this.setupResourceManagement();
    }

    setupResourceManagement() {
        // 페이지 언로드시 정리
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // 메모리 부족시 정리
        window.addEventListener('memorywarning', () => {
            this.emergencyCleanup();
        });
    }

    async load(type, url, options = {}) {
        const resourceId = `${type}:${url}`;

        // 이미 로드된 리소스 반환
        if (this.resources.has(resourceId)) {
            const resource = this.resources.get(resourceId);
            resource.lastAccessed = Date.now();
            return resource.data;
        }

        // 로딩 중인 경우 기존 Promise 반환
        if (this.loadingPromises.has(resourceId)) {
            return this.loadingPromises.get(resourceId);
        }

        // 새 로딩 Promise 생성
        const loadPromise = this.performLoad(type, url, options, resourceId);
        this.loadingPromises.set(resourceId, loadPromise);

        try {
            const data = await loadPromise;
            return data;
        } finally {
            this.loadingPromises.delete(resourceId);
        }
    }

    async performLoad(type, url, options, resourceId) {
        // 동시 로딩 제한
        if (this.currentLoads >= this.maxConcurrentLoads) {
            await this.waitForLoadSlot();
        }

        this.currentLoads++;

        try {
            let data;

            switch (type) {
                case 'image':
                    data = await this.loadImage(url, options);
                    break;
                case 'audio':
                    data = await this.loadAudio(url, options);
                    break;
                case 'json':
                    data = await this.loadJson(url, options);
                    break;
                case 'text':
                    data = await this.loadText(url, options);
                    break;
                case 'script':
                    data = await this.loadScript(url, options);
                    break;
                default:
                    throw new Error(`지원하지 않는 리소스 타입: ${type}`);
            }

            // 캐시에 저장
            this.resources.set(resourceId, {
                type,
                url,
                data,
                size: this.estimateSize(data),
                loadedAt: Date.now(),
                lastAccessed: Date.now(),
                options
            });

            return data;
        } finally {
            this.currentLoads--;
        }
    }

    async loadImage(url, options) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            if (options.crossOrigin) {
                img.crossOrigin = options.crossOrigin;
            }

            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`이미지 로딩 실패: ${url}`));

            img.src = url;
        });
    }

    async loadAudio(url, options) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            return {
                buffer: audioBuffer,
                context: audioContext,
                duration: audioBuffer.duration
            };
        } catch (error) {
            throw new Error(`오디오 로딩 실패: ${url} - ${error.message}`);
        }
    }

    async loadJson(url, options) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            throw new Error(`JSON 로딩 실패: ${url} - ${error.message}`);
        }
    }

    async loadText(url, options) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.text();
        } catch (error) {
            throw new Error(`텍스트 로딩 실패: ${url} - ${error.message}`);
        }
    }

    async loadScript(url, options) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = options.async !== false;
            script.defer = options.defer === true;

            script.onload = () => {
                resolve(script);
                if (options.removeAfterLoad) {
                    document.head.removeChild(script);
                }
            };

            script.onerror = () => reject(new Error(`스크립트 로딩 실패: ${url}`));

            document.head.appendChild(script);
        });
    }

    async preload(resources) {
        const promises = resources.map(({ type, url, options }) =>
            this.load(type, url, options).catch(error => {
                console.warn(`프리로드 실패 (${type}: ${url}):`, error);
                return null;
            })
        );

        const results = await Promise.all(promises);
        const successful = results.filter(result => result !== null).length;

        console.log(`프리로드 완료: ${successful}/${resources.length}`);
        return results;
    }

    unload(type, url) {
        const resourceId = `${type}:${url}`;
        const resource = this.resources.get(resourceId);

        if (resource) {
            // 리소스별 정리 로직
            if (type === 'image' && resource.data.src) {
                resource.data.src = '';
            } else if (type === 'audio' && resource.data.context) {
                resource.data.context.close();
            }

            this.resources.delete(resourceId);
            return true;
        }

        return false;
    }

    cleanup(maxAge = 600000) { // 10분
        const now = Date.now();
        const toRemove = [];

        for (const [resourceId, resource] of this.resources.entries()) {
            if (now - resource.lastAccessed > maxAge) {
                toRemove.push(resourceId);
            }
        }

        toRemove.forEach(resourceId => {
            const resource = this.resources.get(resourceId);
            this.unload(resource.type, resource.url);
        });

        console.log(`리소스 정리 완료: ${toRemove.length}개 제거`);
    }

    emergencyCleanup() {
        // 가장 오래된 50% 리소스 제거
        const resources = Array.from(this.resources.entries())
            .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

        const toRemove = resources.slice(0, Math.floor(resources.length * 0.5));
        toRemove.forEach(([resourceId, resource]) => {
            this.unload(resource.type, resource.url);
        });

        console.warn(`긴급 메모리 정리: ${toRemove.length}개 리소스 제거`);
    }

    getStats() {
        const resources = Array.from(this.resources.values());
        const totalSize = resources.reduce((sum, resource) => sum + resource.size, 0);

        return {
            totalResources: resources.length,
            totalSize: totalSize,
            typeBreakdown: this.getTypeBreakdown(resources),
            loadingQueue: this.loadingQueue.length,
            currentLoads: this.currentLoads
        };
    }

    getTypeBreakdown(resources) {
        return resources.reduce((breakdown, resource) => {
            if (!breakdown[resource.type]) {
                breakdown[resource.type] = { count: 0, size: 0 };
            }
            breakdown[resource.type].count++;
            breakdown[resource.type].size += resource.size;
            return breakdown;
        }, {});
    }

    estimateSize(data) {
        if (data instanceof HTMLImageElement) {
            return data.width * data.height * 4; // RGBA 추정
        } else if (typeof data === 'string') {
            return data.length * 2; // UTF-16 문자
        } else if (data instanceof ArrayBuffer) {
            return data.byteLength;
        } else {
            return JSON.stringify(data).length * 2; // 대략적 추정
        }
    }

    waitForLoadSlot() {
        return new Promise(resolve => {
            const checkSlot = () => {
                if (this.currentLoads < this.maxConcurrentLoads) {
                    resolve();
                } else {
                    setTimeout(checkSlot, 50);
                }
            };
            checkSlot();
        });
    }
}
```

---

## 🤖 AI 지원 시스템 통합

### 1. ContextManager와 SessionSDK 통합
```javascript
class AIEnhancedSessionSDK extends SessionSDK {
    constructor(options = {}) {
        super(options);

        // AI 지원 시스템 초기화
        this.contextManager = new ContextManager({
            maxContextLength: options.maxContextLength || 8000,
            maxSessionHistory: options.maxSessionHistory || 50,
            contextCompressionThreshold: options.contextCompressionThreshold || 6000
        });

        this.conversationOptimizer = new ConversationHistoryOptimizer();
        this.codeExecutionEngine = new CodeExecutionEngine();
        this.realTimeDebugger = new RealTimeDebugger();
        this.satisfactionTracker = new UserSatisfactionTracker();

        this.setupAIIntegration();
    }

    setupAIIntegration() {
        // 세션 생성 시 AI 컨텍스트 초기화
        this.on('session-created', (event) => {
            const session = event.detail || event;
            this.contextManager.initializeSession(session.sessionCode, {
                gameType: this.gameType,
                gameId: this.gameId,
                playerCount: session.playersExpected || 1
            });
        });

        // 센서 데이터에 AI 분석 추가
        this.on('sensor-data', (event) => {
            const data = event.detail || event;
            this.enhanceSensorDataWithAI(data);
        });

        // 게임 이벤트 컨텍스트 저장
        this.on('*', (eventName, data) => {
            if (this.activeSession) {
                this.contextManager.addContext(this.activeSession, {
                    type: 'game-event',
                    event: eventName,
                    data: data,
                    timestamp: Date.now()
                });
            }
        });

        // 에러 발생 시 AI 분석 및 해결책 제안
        this.on('error', async (error) => {
            const analysis = await this.realTimeDebugger.analyzeError({
                error: error,
                context: this.contextManager.getSessionContext(this.activeSession),
                gameState: this.getCurrentGameState()
            });

            if (analysis.autoFixAvailable) {
                console.log('AI 자동 수정 제안:', analysis.suggestion);
                this.emit('ai-fix-suggested', analysis);
            }
        });
    }

    async enhanceSensorDataWithAI(sensorData) {
        // 센서 데이터 패턴 분석
        const analysis = await this.conversationOptimizer.analyzeSensorPattern({
            sensorData,
            gameContext: this.contextManager.getSessionContext(this.activeSession),
            gameType: this.gameType
        });

        // 예측 모델을 통한 다음 동작 예측
        if (analysis.predictedAction) {
            this.emit('action-predicted', {
                prediction: analysis.predictedAction,
                confidence: analysis.confidence,
                suggestedOptimization: analysis.optimization
            });
        }

        // 게임 성능 최적화 제안
        if (analysis.performanceIssue) {
            this.emit('performance-optimization-suggested', {
                issue: analysis.performanceIssue,
                solution: analysis.optimizationSuggestion
            });
        }
    }

    async executeAIGeneratedCode(code, language = 'javascript') {
        try {
            // 코드 안전성 검증
            const validationResult = await this.codeExecutionEngine.validateCode(code, language);

            if (!validationResult.isValid) {
                throw new Error(`코드 검증 실패: ${validationResult.errors.join(', ')}`);
            }

            // 안전한 환경에서 코드 실행
            const executionResult = await this.codeExecutionEngine.executeCode(code, language, {
                sessionContext: this.contextManager.getSessionContext(this.activeSession),
                gameAPI: this.getGameAPI(),
                timeout: 5000
            });

            // 실행 결과 컨텍스트에 저장
            this.contextManager.addContext(this.activeSession, {
                type: 'code-execution',
                code: code,
                result: executionResult,
                timestamp: Date.now()
            });

            return executionResult;
        } catch (error) {
            // 실행 오류를 디버거에 전달
            const debugInfo = await this.realTimeDebugger.analyzeExecutionError({
                code,
                error,
                context: this.contextManager.getSessionContext(this.activeSession)
            });

            this.emit('code-execution-error', {
                error,
                debugInfo,
                suggestedFix: debugInfo.autoFix
            });

            throw error;
        }
    }

    getGameAPI() {
        // 게임에서 안전하게 사용할 수 있는 API 제공
        return {
            // 센서 데이터 접근
            getSensorData: () => this.lastSensorData,

            // 게임 상태 조회
            getGameState: () => this.getCurrentGameState(),

            // 안전한 게임 조작
            updateGameObject: (id, properties) => {
                this.emit('game-object-update', { id, properties });
            },

            // 효과음 재생
            playSound: (soundId) => {
                this.emit('sound-play', { soundId });
            },

            // 파티클 효과
            createParticle: (config) => {
                this.emit('particle-create', config);
            },

            // 점수 업데이트
            updateScore: (playerId, score) => {
                this.emit('score-update', { playerId, score });
            }
        };
    }

    async getAIRecommendations() {
        const context = this.contextManager.getSessionContext(this.activeSession);
        const satisfaction = await this.satisfactionTracker.getSessionSatisfaction(this.activeSession);

        return {
            gameplayRecommendations: await this.conversationOptimizer.getGameplayRecommendations(context),
            performanceOptimizations: await this.realTimeDebugger.getPerformanceRecommendations(context),
            userExperienceImprovements: satisfaction.improvementSuggestions
        };
    }
}
```

### 2. AI 이벤트 리스너 패턴
```javascript
class AIEventListener {
    constructor(sdk) {
        this.sdk = sdk;
        this.patterns = new Map();
        this.setupAIListeners();
    }

    setupAIListeners() {
        // AI 분석 기반 자동 응답
        this.sdk.on('ai-analysis-complete', async (event) => {
            const analysis = event.detail || event;
            await this.handleAIAnalysis(analysis);
        });

        // 사용자 만족도 기반 자동 조정
        this.sdk.on('satisfaction-changed', async (event) => {
            const satisfaction = event.detail || event;
            if (satisfaction.score < 0.6) {
                await this.applySatisfactionImprovements(satisfaction);
            }
        });

        // 성능 이슈 자동 해결
        this.sdk.on('performance-issue-detected', async (event) => {
            const issue = event.detail || event;
            await this.handlePerformanceIssue(issue);
        });

        // 코드 실행 결과 학습
        this.sdk.on('code-execution-complete', (event) => {
            const result = event.detail || event;
            this.learnFromExecution(result);
        });
    }

    async handleAIAnalysis(analysis) {
        switch (analysis.type) {
            case 'sensor-pattern':
                await this.optimizeSensorHandling(analysis);
                break;
            case 'user-behavior':
                await this.personalizeExperience(analysis);
                break;
            case 'performance-analysis':
                await this.optimizePerformance(analysis);
                break;
            case 'error-prediction':
                await this.preventErrors(analysis);
                break;
        }
    }

    async optimizeSensorHandling(analysis) {
        if (analysis.recommendation === 'reduce-frequency') {
            this.sdk.setSensorDataRate(Math.max(this.sdk.sensorDataRate * 0.8, 10));
            console.log('AI 권장: 센서 데이터 전송 빈도 감소');
        } else if (analysis.recommendation === 'increase-sensitivity') {
            this.sdk.setSensorSensitivity(Math.min(this.sdk.sensorSensitivity * 1.2, 1.0));
            console.log('AI 권장: 센서 민감도 증가');
        }
    }

    async personalizeExperience(analysis) {
        // 사용자 행동 패턴에 따른 게임 커스터마이징
        const preferences = analysis.userPreferences;

        if (preferences.prefersFastPaced) {
            this.sdk.emit('game-speed-adjust', { multiplier: 1.2 });
        }

        if (preferences.strugglesWithControls) {
            this.sdk.emit('control-assistance-enable', { level: 'medium' });
        }

        if (preferences.enjoysVisualEffects) {
            this.sdk.emit('visual-effects-enhance', { intensity: 'high' });
        }
    }

    async optimizePerformance(analysis) {
        const optimizations = analysis.recommendations;

        for (const optimization of optimizations) {
            switch (optimization.type) {
                case 'reduce-rendering-quality':
                    this.sdk.emit('rendering-quality-adjust', { level: optimization.level });
                    break;
                case 'enable-object-pooling':
                    this.sdk.emit('object-pooling-enable', optimization.config);
                    break;
                case 'optimize-physics':
                    this.sdk.emit('physics-optimize', optimization.settings);
                    break;
            }
        }
    }

    async preventErrors(analysis) {
        const predictions = analysis.errorPredictions;

        for (const prediction of predictions) {
            if (prediction.probability > 0.8) {
                console.warn(`오류 예측: ${prediction.type} (확률: ${prediction.probability})`);

                // 예방 조치 실행
                if (prediction.preventionAction) {
                    this.sdk.emit('prevention-action', prediction.preventionAction);
                }
            }
        }
    }

    learnFromExecution(result) {
        // 성공적인 코드 패턴 학습
        if (result.success) {
            this.patterns.set(result.codeHash, {
                code: result.code,
                context: result.context,
                performance: result.executionTime,
                successRate: 1.0
            });
        }
    }
}
```

---

## 🧠 컨텍스트 관리 및 대화 최적화

### 1. 게임 컨텍스트 인식 대화
```javascript
class GameContextConversation {
    constructor(sdk) {
        this.sdk = sdk;
        this.contextManager = sdk.contextManager;
        this.conversationOptimizer = sdk.conversationOptimizer;
        this.setupContextualConversation();
    }

    setupContextualConversation() {
        // 게임 상황별 대화 처리
        this.sdk.on('user-message', async (event) => {
            const message = event.detail || event;
            await this.processContextualMessage(message);
        });

        // 게임 상태 변화 시 컨텍스트 업데이트
        this.sdk.on('game-state-changed', (event) => {
            const stateChange = event.detail || event;
            this.updateGameContext(stateChange);
        });

        // 자동 도움말 제공
        this.sdk.on('user-struggling', async (event) => {
            const struggleData = event.detail || event;
            await this.provideContextualHelp(struggleData);
        });
    }

    async processContextualMessage(message) {
        // 현재 게임 컨텍스트 분석
        const gameContext = this.contextManager.getSessionContext(this.sdk.activeSession);
        const conversationHistory = this.conversationOptimizer.getConversationHistory(
            this.sdk.activeSession
        );

        // 메시지 의도 분석
        const messageAnalysis = await this.conversationOptimizer.analyzeMessage({
            message: message.text,
            gameContext: gameContext,
            conversationHistory: conversationHistory,
            currentGameState: this.sdk.getCurrentGameState()
        });

        // 컨텍스트 기반 응답 생성
        const response = await this.generateContextualResponse(messageAnalysis);

        // 응답 전송
        this.sdk.emit('assistant-response', {
            text: response.text,
            actions: response.suggestedActions,
            context: response.context,
            timestamp: Date.now()
        });

        // 대화 히스토리 업데이트
        this.conversationOptimizer.updateConversationHistory(this.sdk.activeSession, {
            userMessage: message,
            assistantResponse: response,
            context: gameContext
        });
    }

    async generateContextualResponse(messageAnalysis) {
        const { intent, entities, context, urgency } = messageAnalysis;

        switch (intent) {
            case 'game-help':
                return await this.generateGameHelp(entities, context);
            case 'bug-report':
                return await this.generateBugResponse(entities, context);
            case 'feature-request':
                return await this.generateFeatureResponse(entities, context);
            case 'performance-complaint':
                return await this.generatePerformanceResponse(entities, context);
            case 'controls-confusion':
                return await this.generateControlsHelp(entities, context);
            default:
                return await this.generateGenericResponse(messageAnalysis);
        }
    }

    async generateGameHelp(entities, context) {
        const gameType = context.gameType;
        const currentLevel = context.currentLevel || 'beginner';
        const playerProgress = context.playerProgress || {};

        let helpText = '';
        let suggestedActions = [];

        if (entities.includes('controls')) {
            helpText = `${gameType} 게임에서 컨트롤은 다음과 같습니다:\n`;
            helpText += this.getControlsForGameType(gameType);

            suggestedActions.push({
                type: 'show-controls-overlay',
                duration: 10000
            });
        }

        if (entities.includes('scoring')) {
            helpText += `\n\n점수 시스템:\n`;
            helpText += this.getScoringSystemForGameType(gameType);

            suggestedActions.push({
                type: 'highlight-score-elements',
                duration: 5000
            });
        }

        if (entities.includes('strategy')) {
            const strategies = await this.conversationOptimizer.getPersonalizedStrategies(
                this.sdk.activeSession,
                gameType,
                playerProgress
            );

            helpText += `\n\n맞춤 전략 제안:\n`;
            helpText += strategies.join('\n');
        }

        return {
            text: helpText,
            suggestedActions: suggestedActions,
            context: { type: 'game-help', gameType: gameType }
        };
    }

    async generateBugResponse(entities, context) {
        // 실시간 디버거를 활용한 버그 분석
        const bugAnalysis = await this.sdk.realTimeDebugger.analyzePotentialBug({
            userReport: entities,
            gameContext: context,
            recentEvents: this.contextManager.getRecentEvents(this.sdk.activeSession, 100)
        });

        let response = '버그 신고를 접수했습니다. ';

        if (bugAnalysis.knownIssue) {
            response += `이는 알려진 문제이며, 다음과 같이 해결할 수 있습니다:\n`;
            response += bugAnalysis.workaround;

            return {
                text: response,
                suggestedActions: [{
                    type: 'apply-workaround',
                    config: bugAnalysis.workaroundConfig
                }],
                context: { type: 'bug-response', knownIssue: true }
            };
        } else {
            response += '이 문제를 분석 중입니다. 잠시만 기다려주세요.';

            // 백그라운드에서 추가 분석 수행
            this.performDeepBugAnalysis(entities, context);

            return {
                text: response,
                suggestedActions: [{
                    type: 'collect-debug-info',
                    duration: 30000
                }],
                context: { type: 'bug-response', analysisInProgress: true }
            };
        }
    }

    async updateGameContext(stateChange) {
        const { previous, current, timestamp } = stateChange;

        // 컨텍스트에 상태 변화 기록
        this.contextManager.addContext(this.sdk.activeSession, {
            type: 'state-change',
            previousState: previous,
            currentState: current,
            timestamp: timestamp,
            duration: timestamp - (this.lastStateChangeTime || timestamp)
        });

        this.lastStateChangeTime = timestamp;

        // 상태별 자동 컨텍스트 업데이트
        if (current === 'playing' && previous === 'waiting') {
            this.contextManager.addContext(this.sdk.activeSession, {
                type: 'game-started',
                startTime: timestamp,
                initialPlayers: this.sdk.getConnectedPlayerCount()
            });
        }

        if (current === 'finished') {
            const gameSession = this.contextManager.getSessionContext(this.sdk.activeSession);
            const gameDuration = timestamp - gameSession.gameStartTime;

            this.contextManager.addContext(this.sdk.activeSession, {
                type: 'game-completed',
                duration: gameDuration,
                finalScore: this.sdk.getFinalScore(),
                performanceMetrics: this.sdk.getPerformanceMetrics()
            });
        }
    }

    async provideContextualHelp(struggleData) {
        const { type, duration, intensity, context } = struggleData;

        // 어려움 유형별 맞춤 도움말
        const helpSuggestions = await this.conversationOptimizer.generateHelpSuggestions({
            struggleType: type,
            struggleDuration: duration,
            gameContext: context,
            playerHistory: this.contextManager.getPlayerHistory(this.sdk.activeSession)
        });

        // 단계적 도움말 제공
        if (duration < 30000) { // 30초 미만
            this.provideSubtleHint(helpSuggestions.hint);
        } else if (duration < 60000) { // 1분 미만
            this.provideClearGuidance(helpSuggestions.guidance);
        } else { // 1분 이상
            this.provideDirectAssistance(helpSuggestions.assistance);
        }
    }

    provideSubtleHint(hint) {
        this.sdk.emit('ui-hint-show', {
            text: hint,
            style: 'subtle',
            duration: 5000,
            position: 'top-right'
        });
    }

    provideClearGuidance(guidance) {
        this.sdk.emit('ui-guidance-show', {
            text: guidance,
            style: 'prominent',
            duration: 10000,
            actions: ['dismiss', 'more-help']
        });
    }

    provideDirectAssistance(assistance) {
        this.sdk.emit('assistant-intervention', {
            type: 'direct-help',
            message: assistance.message,
            actions: assistance.actions,
            autoExecute: assistance.autoExecute
        });
    }
}
```

### 2. 대화 패턴 학습 및 개인화
```javascript
class ConversationPersonalization {
    constructor(sdk) {
        this.sdk = sdk;
        this.userProfiles = new Map();
        this.conversationPatterns = new Map();
        this.setupPersonalization();
    }

    setupPersonalization() {
        // 사용자 상호작용 학습
        this.sdk.on('user-interaction', (event) => {
            const interaction = event.detail || event;
            this.learnFromInteraction(interaction);
        });

        // 응답 효과성 분석
        this.sdk.on('response-feedback', (event) => {
            const feedback = event.detail || event;
            this.analyzeResponseEffectiveness(feedback);
        });

        // 세션별 개인화 적용
        this.sdk.on('session-created', (event) => {
            const session = event.detail || event;
            this.applyPersonalization(session);
        });
    }

    learnFromInteraction(interaction) {
        const userId = interaction.userId || 'anonymous';

        if (!this.userProfiles.has(userId)) {
            this.userProfiles.set(userId, {
                preferredCommunicationStyle: 'balanced',
                responsiveness: [],
                topicPreferences: new Map(),
                helpSeeking: [],
                gameProgress: {},
                learningSpeed: 'medium'
            });
        }

        const profile = this.userProfiles.get(userId);

        // 커뮤니케이션 스타일 분석
        this.analyzeCommunicationStyle(interaction, profile);

        // 응답성 패턴 기록
        profile.responsiveness.push({
            responseTime: interaction.responseTime,
            messageLength: interaction.messageLength,
            timestamp: interaction.timestamp
        });

        // 주제 선호도 업데이트
        if (interaction.topics) {
            interaction.topics.forEach(topic => {
                const current = profile.topicPreferences.get(topic) || 0;
                profile.topicPreferences.set(topic, current + 1);
            });
        }

        // 도움 요청 패턴 분석
        if (interaction.isHelpRequest) {
            profile.helpSeeking.push({
                type: interaction.helpType,
                context: interaction.gameContext,
                resolutionTime: interaction.resolutionTime,
                satisfaction: interaction.satisfaction
            });
        }
    }

    analyzeCommunicationStyle(interaction, profile) {
        const { messageLength, formalityLevel, emotionalTone, complexity } = interaction;

        // 메시지 길이 선호도
        if (messageLength < 50) {
            profile.preferredMessageLength = 'short';
        } else if (messageLength > 200) {
            profile.preferredMessageLength = 'detailed';
        } else {
            profile.preferredMessageLength = 'medium';
        }

        // 격식 수준 선호도
        if (formalityLevel < 0.3) {
            profile.preferredFormality = 'casual';
        } else if (formalityLevel > 0.7) {
            profile.preferredFormality = 'formal';
        } else {
            profile.preferredFormality = 'balanced';
        }

        // 감정적 톤 선호도
        profile.preferredEmotionalTone = emotionalTone;

        // 복잡성 수준 선호도
        profile.preferredComplexity = complexity > 0.5 ? 'technical' : 'simple';
    }

    applyPersonalization(session) {
        const userId = session.userId || 'anonymous';
        const profile = this.userProfiles.get(userId);

        if (!profile) return;

        // 개인화된 응답 스타일 설정
        this.sdk.conversationOptimizer.setPersonalizationProfile(session.sessionCode, {
            messageLength: profile.preferredMessageLength,
            formality: profile.preferredFormality,
            emotionalTone: profile.preferredEmotionalTone,
            complexity: profile.preferredComplexity,
            topicPreferences: Array.from(profile.topicPreferences.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([topic]) => topic),
            learningSpeed: profile.learningSpeed
        });

        // 예상 도움 요구사항 준비
        const predictedNeeds = this.predictUserNeeds(profile, session.gameType);
        this.sdk.contextManager.addContext(session.sessionCode, {
            type: 'predicted-needs',
            needs: predictedNeeds,
            confidence: this.calculatePredictionConfidence(profile)
        });
    }

    predictUserNeeds(profile, gameType) {
        const needs = [];

        // 게임별 일반적인 도움 요구사항
        const commonNeeds = this.getCommonNeedsForGameType(gameType);
        needs.push(...commonNeeds);

        // 사용자 히스토리 기반 예측
        const helpHistory = profile.helpSeeking.filter(h => h.context.gameType === gameType);

        if (helpHistory.length > 0) {
            const frequentHelpTypes = this.getFrequentHelpTypes(helpHistory);
            needs.push(...frequentHelpTypes);
        }

        // 학습 속도 기반 조정
        if (profile.learningSpeed === 'slow') {
            needs.push('step-by-step-guidance', 'frequent-encouragement');
        } else if (profile.learningSpeed === 'fast') {
            needs.push('advanced-tips', 'challenge-suggestions');
        }

        return needs;
    }

    analyzeResponseEffectiveness(feedback) {
        const { responseId, effectiveness, userSatisfaction, context } = feedback;

        // 응답 패턴 효과성 기록
        if (!this.conversationPatterns.has(context.pattern)) {
            this.conversationPatterns.set(context.pattern, {
                usageCount: 0,
                totalEffectiveness: 0,
                totalSatisfaction: 0,
                contextTypes: new Map()
            });
        }

        const pattern = this.conversationPatterns.get(context.pattern);
        pattern.usageCount++;
        pattern.totalEffectiveness += effectiveness;
        pattern.totalSatisfaction += userSatisfaction;

        // 컨텍스트별 효과성 기록
        const contextKey = `${context.gameType}-${context.userState}`;
        if (!pattern.contextTypes.has(contextKey)) {
            pattern.contextTypes.set(contextKey, { count: 0, effectiveness: 0 });
        }

        const contextData = pattern.contextTypes.get(contextKey);
        contextData.count++;
        contextData.effectiveness += effectiveness;

        // 실시간 패턴 최적화
        this.optimizeConversationPatterns();
    }

    optimizeConversationPatterns() {
        // 효과성이 낮은 패턴 식별 및 개선
        for (const [patternId, pattern] of this.conversationPatterns.entries()) {
            const avgEffectiveness = pattern.totalEffectiveness / pattern.usageCount;
            const avgSatisfaction = pattern.totalSatisfaction / pattern.usageCount;

            if (avgEffectiveness < 0.6 || avgSatisfaction < 0.6) {
                // 패턴 개선 필요
                this.improvePattern(patternId, pattern);
            }
        }
    }

    improvePattern(patternId, pattern) {
        // AI 기반 패턴 개선 제안
        const improvements = this.sdk.conversationOptimizer.suggestPatternImprovements({
            patternId,
            currentStats: pattern,
            similarPatterns: this.findSimilarPatterns(patternId),
            userFeedback: this.getUserFeedbackForPattern(patternId)
        });

        // 개선사항 적용
        this.sdk.emit('conversation-pattern-update', {
            patternId,
            improvements,
            currentStats: pattern
        });
    }
}
```

---

## 🔧 실시간 디버깅 및 코드 실행

### 1. 게임 중 실시간 코드 디버깅
```javascript
class GameRuntimeDebugger {
    constructor(sdk) {
        this.sdk = sdk;
        this.debugger = sdk.realTimeDebugger;
        this.codeExecutor = sdk.codeExecutionEngine;
        this.activeBreakpoints = new Set();
        this.watchedVariables = new Map();
        this.executionStack = [];
        this.setupRuntimeDebugging();
    }

    setupRuntimeDebugging() {
        // 게임 상태 변화 감지
        this.sdk.on('game-state-changed', (event) => {
            const stateChange = event.detail || event;
            this.checkBreakpoints('state-change', stateChange);
        });

        // 센서 데이터 변화 감지
        this.sdk.on('sensor-data', (event) => {
            const sensorData = event.detail || event;
            this.monitorSensorData(sensorData);
        });

        // 사용자 정의 이벤트 디버깅
        this.sdk.on('custom-event', (event) => {
            const customEvent = event.detail || event;
            this.debugCustomEvent(customEvent);
        });

        // 에러 발생 시 자동 디버깅
        this.sdk.on('error', async (error) => {
            await this.performAutomaticDebugging(error);
        });
    }

    async addBreakpoint(condition, action = 'pause') {
        const breakpointId = this.generateBreakpointId();

        this.activeBreakpoints.add({
            id: breakpointId,
            condition: condition,
            action: action,
            hitCount: 0,
            createdAt: Date.now()
        });

        console.log(`브레이크포인트 추가: ${breakpointId}`);
        return breakpointId;
    }

    removeBreakpoint(breakpointId) {
        this.activeBreakpoints.forEach(bp => {
            if (bp.id === breakpointId) {
                this.activeBreakpoints.delete(bp);
                console.log(`브레이크포인트 제거: ${breakpointId}`);
                return true;
            }
        });
        return false;
    }

    watchVariable(variableName, threshold = null) {
        this.watchedVariables.set(variableName, {
            name: variableName,
            threshold: threshold,
            history: [],
            lastValue: undefined,
            alertCount: 0
        });

        console.log(`변수 감시 시작: ${variableName}`);
    }

    unwatchVariable(variableName) {
        if (this.watchedVariables.has(variableName)) {
            this.watchedVariables.delete(variableName);
            console.log(`변수 감시 중지: ${variableName}`);
            return true;
        }
        return false;
    }

    checkBreakpoints(eventType, data) {
        for (const breakpoint of this.activeBreakpoints) {
            if (this.evaluateBreakpointCondition(breakpoint.condition, eventType, data)) {
                breakpoint.hitCount++;

                console.log(`브레이크포인트 도달: ${breakpoint.id} (${breakpoint.hitCount}회)`);

                switch (breakpoint.action) {
                    case 'pause':
                        this.pauseExecution(breakpoint, data);
                        break;
                    case 'log':
                        this.logDebugInfo(breakpoint, data);
                        break;
                    case 'analyze':
                        this.analyzeGameState(breakpoint, data);
                        break;
                    case 'fix':
                        this.attemptAutoFix(breakpoint, data);
                        break;
                }
            }
        }
    }

    evaluateBreakpointCondition(condition, eventType, data) {
        try {
            // 안전한 조건 평가
            const context = {
                eventType,
                data,
                gameState: this.sdk.getCurrentGameState(),
                sensorData: this.sdk.getLastSensorData(),
                sessionInfo: this.sdk.getSessionInfo()
            };

            return this.codeExecutor.evaluateExpression(condition, context);
        } catch (error) {
            console.warn(`브레이크포인트 조건 평가 실패: ${condition}`, error);
            return false;
        }
    }

    pauseExecution(breakpoint, data) {
        // 게임 일시 정지
        this.sdk.emit('debug-pause', {
            reason: 'breakpoint',
            breakpointId: breakpoint.id,
            context: data,
            stackTrace: this.getCurrentStackTrace()
        });

        // 디버그 UI 표시
        this.showDebugInterface({
            breakpoint,
            gameState: this.sdk.getCurrentGameState(),
            variables: this.getCurrentVariables(),
            suggestions: this.getDebugSuggestions(data)
        });
    }

    async logDebugInfo(breakpoint, data) {
        const debugInfo = {
            timestamp: Date.now(),
            breakpointId: breakpoint.id,
            gameState: this.sdk.getCurrentGameState(),
            sensorData: this.sdk.getLastSensorData(),
            context: data,
            performance: await this.getPerformanceSnapshot()
        };

        console.group(`🐛 디버그 로그: ${breakpoint.id}`);
        console.log('게임 상태:', debugInfo.gameState);
        console.log('센서 데이터:', debugInfo.sensorData);
        console.log('컨텍스트:', debugInfo.context);
        console.log('성능:', debugInfo.performance);
        console.groupEnd();

        // 디버그 로그를 컨텍스트에 저장
        this.sdk.contextManager.addContext(this.sdk.activeSession, {
            type: 'debug-log',
            debugInfo: debugInfo
        });
    }

    async analyzeGameState(breakpoint, data) {
        const analysis = await this.debugger.analyzeGameState({
            breakpoint: breakpoint,
            context: data,
            gameState: this.sdk.getCurrentGameState(),
            recentEvents: this.sdk.contextManager.getRecentEvents(this.sdk.activeSession, 50)
        });

        console.log('게임 상태 분석 결과:', analysis);

        // 분석 결과에 따른 자동 조치
        if (analysis.issues.length > 0) {
            for (const issue of analysis.issues) {
                if (issue.severity === 'high' && issue.autoFixAvailable) {
                    await this.attemptAutoFix(issue);
                }
            }
        }

        // 분석 결과를 UI에 표시
        this.sdk.emit('debug-analysis-complete', {
            breakpointId: breakpoint.id,
            analysis: analysis,
            recommendations: analysis.recommendations
        });
    }

    async attemptAutoFix(breakpoint, data) {
        console.log(`자동 수정 시도: ${breakpoint.id}`);

        const fixSuggestions = await this.debugger.generateAutoFix({
            breakpoint: breakpoint,
            context: data,
            gameState: this.sdk.getCurrentGameState()
        });

        for (const fix of fixSuggestions) {
            if (fix.confidence > 0.8) {
                try {
                    // 안전한 자동 수정 실행
                    const result = await this.codeExecutor.executeCode(
                        fix.code,
                        'javascript',
                        {
                            timeout: 1000,
                            safeMode: true,
                            gameAPI: this.sdk.getGameAPI()
                        }
                    );

                    if (result.success) {
                        console.log(`자동 수정 성공: ${fix.description}`);
                        this.sdk.emit('auto-fix-applied', {
                            breakpointId: breakpoint.id,
                            fix: fix,
                            result: result
                        });
                        break;
                    }
                } catch (error) {
                    console.warn(`자동 수정 실패: ${fix.description}`, error);
                }
            }
        }
    }

    monitorSensorData(sensorData) {
        // 감시 중인 변수 업데이트
        for (const [varName, watchInfo] of this.watchedVariables.entries()) {
            const currentValue = this.extractVariableValue(varName, sensorData);

            if (currentValue !== undefined) {
                // 값 변화 기록
                watchInfo.history.push({
                    value: currentValue,
                    timestamp: Date.now()
                });

                // 히스토리 크기 제한
                if (watchInfo.history.length > 100) {
                    watchInfo.history.shift();
                }

                // 임계값 확인
                if (watchInfo.threshold !== null) {
                    if (this.checkThreshold(currentValue, watchInfo.threshold, watchInfo.lastValue)) {
                        this.triggerVariableAlert(varName, currentValue, watchInfo);
                    }
                }

                watchInfo.lastValue = currentValue;
            }
        }
    }

    extractVariableValue(varName, sensorData) {
        // 변수명에 따른 값 추출 (점 표기법 지원)
        const path = varName.split('.');
        let value = sensorData;

        for (const key of path) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }

        return value;
    }

    checkThreshold(currentValue, threshold, lastValue) {
        if (typeof threshold === 'number') {
            return Math.abs(currentValue - (lastValue || 0)) > threshold;
        } else if (typeof threshold === 'object') {
            if (threshold.min !== undefined && currentValue < threshold.min) return true;
            if (threshold.max !== undefined && currentValue > threshold.max) return true;
            if (threshold.change !== undefined && lastValue !== undefined) {
                return Math.abs(currentValue - lastValue) > threshold.change;
            }
        }
        return false;
    }

    triggerVariableAlert(varName, currentValue, watchInfo) {
        watchInfo.alertCount++;

        console.warn(`🚨 변수 임계값 초과: ${varName} = ${currentValue}`);

        this.sdk.emit('variable-threshold-exceeded', {
            variableName: varName,
            currentValue: currentValue,
            threshold: watchInfo.threshold,
            alertCount: watchInfo.alertCount,
            history: watchInfo.history.slice(-10) // 최근 10개 값
        });
    }

    async performAutomaticDebugging(error) {
        console.log('자동 디버깅 시작:', error.message);

        // 에러 컨텍스트 수집
        const errorContext = {
            error: error,
            gameState: this.sdk.getCurrentGameState(),
            sensorData: this.sdk.getLastSensorData(),
            recentEvents: this.sdk.contextManager.getRecentEvents(this.sdk.activeSession, 20),
            stackTrace: this.getCurrentStackTrace()
        };

        // AI 기반 에러 분석
        const analysis = await this.debugger.analyzeError(errorContext);

        // 자동 수정 시도
        if (analysis.autoFixAvailable && analysis.confidence > 0.7) {
            try {
                const fixResult = await this.codeExecutor.executeCode(
                    analysis.fixCode,
                    'javascript',
                    {
                        timeout: 2000,
                        safeMode: true,
                        errorContext: errorContext
                    }
                );

                if (fixResult.success) {
                    console.log('자동 에러 수정 성공:', analysis.description);
                    this.sdk.emit('error-auto-fixed', {
                        originalError: error,
                        fix: analysis,
                        result: fixResult
                    });
                    return;
                }
            } catch (fixError) {
                console.warn('자동 수정 실패:', fixError);
            }
        }

        // 수정 제안 사용자에게 표시
        this.sdk.emit('debug-suggestions', {
            error: error,
            analysis: analysis,
            manualFixes: analysis.manualFixes || [],
            preventionTips: analysis.preventionTips || []
        });
    }

    getCurrentStackTrace() {
        // 현재 실행 스택 추적
        try {
            throw new Error();
        } catch (e) {
            return e.stack.split('\n').slice(2, 10); // 상위 8개 스택 프레임
        }
    }

    getCurrentVariables() {
        // 현재 게임 컨텍스트의 주요 변수들
        return {
            gameState: this.sdk.getCurrentGameState(),
            sessionInfo: this.sdk.getSessionInfo(),
            playerCount: this.sdk.getConnectedPlayerCount(),
            lastSensorData: this.sdk.getLastSensorData(),
            performance: this.sdk.getPerformanceMetrics()
        };
    }

    async getPerformanceSnapshot() {
        return {
            memory: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null,
            timing: {
                fps: this.sdk.getCurrentFPS(),
                frameTime: this.sdk.getAverageFrameTime(),
                networkLatency: this.sdk.getNetworkLatency()
            },
            resources: this.sdk.getResourceUsage()
        };
    }

    getDebugSuggestions(context) {
        return [
            '변수 값 확인하기',
            '최근 이벤트 검토하기',
            '성능 지표 분석하기',
            '센서 데이터 패턴 확인하기',
            '네트워크 상태 점검하기'
        ];
    }

    showDebugInterface(debugData) {
        this.sdk.emit('debug-interface-show', {
            debugData: debugData,
            actions: [
                { id: 'continue', label: '계속 실행', action: () => this.continueExecution() },
                { id: 'step', label: '단계 실행', action: () => this.stepExecution() },
                { id: 'analyze', label: '상태 분석', action: () => this.analyzeCurrentState() },
                { id: 'fix', label: '자동 수정', action: () => this.attemptQuickFix() }
            ]
        });
    }
}
```

---

## 📊 만족도 추적 및 성능 모니터링

### 1. 실시간 사용자 만족도 측정
```javascript
class RealTimeSatisfactionMonitor {
    constructor(sdk) {
        this.sdk = sdk;
        this.satisfactionTracker = sdk.satisfactionTracker;
        this.satisfactionMetrics = new Map();
        this.alertThresholds = {
            low: 0.4,
            critical: 0.2
        };
        this.setupSatisfactionMonitoring();
    }

    setupSatisfactionMonitoring() {
        // 게임 이벤트별 만족도 추적
        this.sdk.on('game-action', (event) => {
            const action = event.detail || event;
            this.trackActionSatisfaction(action);
        });

        // 사용자 반응 시간 측정
        this.sdk.on('user-input', (event) => {
            const input = event.detail || event;
            this.measureResponseSatisfaction(input);
        });

        // 에러 발생 시 만족도 영향 분석
        this.sdk.on('error', (error) => {
            this.analyzeErrorImpactOnSatisfaction(error);
        });

        // 주기적 만족도 체크
        setInterval(() => {
            this.performSatisfactionCheck();
        }, 30000); // 30초마다

        // 세션 종료 시 종합 분석
        this.sdk.on('session-ended', (event) => {
            const session = event.detail || event;
            this.generateSatisfactionReport(session);
        });
    }

    async trackActionSatisfaction(action) {
        // 액션별 만족도 점수 계산
        const satisfactionScore = await this.calculateActionSatisfaction(action);

        // 세션별 만족도 업데이트
        await this.satisfactionTracker.trackUserInteraction(this.sdk.activeSession, {
            type: 'game-action',
            action: action.type,
            context: action.context,
            timestamp: Date.now(),
            satisfactionScore: satisfactionScore
        });

        // 실시간 만족도 모니터링
        this.updateRealTimeSatisfaction(satisfactionScore);

        // 임계값 확인
        if (satisfactionScore < this.alertThresholds.critical) {
            await this.handleCriticalSatisfactionDrop(action, satisfactionScore);
        } else if (satisfactionScore < this.alertThresholds.low) {
            await this.handleLowSatisfaction(action, satisfactionScore);
        }
    }

    async calculateActionSatisfaction(action) {
        const factors = {
            responseTime: this.evaluateResponseTime(action.responseTime),
            accuracy: this.evaluateAccuracy(action.accuracy),
            difficulty: this.evaluateDifficulty(action.difficulty),
            engagement: this.evaluateEngagement(action.engagement),
            progress: this.evaluateProgress(action.progress)
        };

        // 가중 평균 계산
        const weights = {
            responseTime: 0.2,
            accuracy: 0.3,
            difficulty: 0.2,
            engagement: 0.2,
            progress: 0.1
        };

        let weightedSum = 0;
        let totalWeight = 0;

        for (const [factor, value] of Object.entries(factors)) {
            if (value !== null) {
                weightedSum += value * weights[factor];
                totalWeight += weights[factor];
            }
        }

        return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
    }

    evaluateResponseTime(responseTime) {
        if (responseTime === undefined) return null;

        // 응답 시간이 빠를수록 높은 점수
        if (responseTime < 200) return 1.0;
        if (responseTime < 500) return 0.8;
        if (responseTime < 1000) return 0.6;
        if (responseTime < 2000) return 0.4;
        return 0.2;
    }

    evaluateAccuracy(accuracy) {
        if (accuracy === undefined) return null;

        // 정확도가 높을수록 높은 점수
        return Math.max(0, Math.min(1, accuracy));
    }

    evaluateDifficulty(difficulty) {
        if (difficulty === undefined) return null;

        // 적절한 난이도일 때 높은 점수 (0.5 - 0.7 범위가 이상적)
        if (difficulty >= 0.5 && difficulty <= 0.7) {
            return 1.0;
        } else if (difficulty >= 0.3 && difficulty <= 0.9) {
            return 0.8;
        } else {
            return 0.4;
        }
    }

    evaluateEngagement(engagement) {
        if (engagement === undefined) return null;

        // 참여도가 높을수록 높은 점수
        return Math.max(0, Math.min(1, engagement));
    }

    evaluateProgress(progress) {
        if (progress === undefined) return null;

        // 진전이 있을 때 높은 점수
        if (progress > 0.1) return 1.0;
        if (progress > 0.05) return 0.7;
        if (progress > 0) return 0.5;
        return 0.3;
    }

    updateRealTimeSatisfaction(newScore) {
        const sessionId = this.sdk.activeSession;

        if (!this.satisfactionMetrics.has(sessionId)) {
            this.satisfactionMetrics.set(sessionId, {
                scores: [],
                movingAverage: 0.5,
                trend: 'stable',
                alerts: []
            });
        }

        const metrics = this.satisfactionMetrics.get(sessionId);
        metrics.scores.push({
            score: newScore,
            timestamp: Date.now()
        });

        // 최근 10개 점수의 이동 평균 계산
        const recentScores = metrics.scores.slice(-10);
        metrics.movingAverage = recentScores.reduce((sum, item) => sum + item.score, 0) / recentScores.length;

        // 트렌드 분석
        metrics.trend = this.analyzeTrend(recentScores);

        // 실시간 UI 업데이트
        this.sdk.emit('satisfaction-updated', {
            currentScore: newScore,
            movingAverage: metrics.movingAverage,
            trend: metrics.trend,
            sessionId: sessionId
        });
    }

    analyzeTrend(scores) {
        if (scores.length < 3) return 'stable';

        const recent = scores.slice(-3);
        const older = scores.slice(-6, -3);

        if (older.length === 0) return 'stable';

        const recentAvg = recent.reduce((sum, item) => sum + item.score, 0) / recent.length;
        const olderAvg = older.reduce((sum, item) => sum + item.score, 0) / older.length;

        const difference = recentAvg - olderAvg;

        if (difference > 0.1) return 'improving';
        if (difference < -0.1) return 'declining';
        return 'stable';
    }

    async handleCriticalSatisfactionDrop(action, score) {
        console.warn(`🚨 치명적 만족도 하락 감지: ${score.toFixed(2)}`);

        // 즉시 개입 조치
        const interventions = await this.satisfactionTracker.generateEmergencyInterventions({
            sessionId: this.sdk.activeSession,
            triggerAction: action,
            currentScore: score,
            context: this.sdk.contextManager.getSessionContext(this.sdk.activeSession)
        });

        // 자동 조치 실행
        for (const intervention of interventions.automatic) {
            try {
                await this.executeIntervention(intervention);
                console.log(`자동 개입 실행: ${intervention.description}`);
            } catch (error) {
                console.error('자동 개입 실행 실패:', error);
            }
        }

        // 수동 조치 제안
        if (interventions.manual.length > 0) {
            this.sdk.emit('manual-intervention-suggested', {
                interventions: interventions.manual,
                urgency: 'critical',
                context: action
            });
        }

        // 관리자 알림
        this.sdk.emit('admin-alert', {
            type: 'critical-satisfaction-drop',
            sessionId: this.sdk.activeSession,
            score: score,
            action: action,
            timestamp: Date.now()
        });
    }

    async handleLowSatisfaction(action, score) {
        console.warn(`⚠️ 낮은 만족도 감지: ${score.toFixed(2)}`);

        // 점진적 개선 조치
        const improvements = await this.satisfactionTracker.suggestImprovements({
            sessionId: this.sdk.activeSession,
            currentScore: score,
            recentActions: this.getRecentActions(10),
            userProfile: this.getUserProfile()
        });

        // 개선 조치 실행
        for (const improvement of improvements) {
            if (improvement.automatic && improvement.confidence > 0.7) {
                await this.executeImprovement(improvement);
            }
        }

        // 사용자에게 피드백 요청
        this.sdk.emit('feedback-request', {
            type: 'satisfaction-improvement',
            currentScore: score,
            suggestedImprovements: improvements.filter(i => !i.automatic)
        });
    }

    async executeIntervention(intervention) {
        switch (intervention.type) {
            case 'difficulty-adjustment':
                this.sdk.emit('difficulty-adjust', {
                    newDifficulty: intervention.targetDifficulty,
                    reason: 'satisfaction-intervention'
                });
                break;

            case 'hint-provision':
                this.sdk.emit('hint-show', {
                    hint: intervention.hint,
                    urgency: 'high',
                    duration: intervention.duration
                });
                break;

            case 'control-assistance':
                this.sdk.emit('control-assistance-enable', {
                    level: intervention.assistanceLevel,
                    duration: intervention.duration
                });
                break;

            case 'encouragement':
                this.sdk.emit('encouragement-show', {
                    message: intervention.message,
                    type: intervention.messageType
                });
                break;

            case 'pause-suggestion':
                this.sdk.emit('pause-suggested', {
                    reason: intervention.reason,
                    benefits: intervention.benefits
                });
                break;
        }
    }

    async performSatisfactionCheck() {
        const sessionId = this.sdk.activeSession;
        if (!sessionId) return;

        // 현재 만족도 상태 분석
        const satisfactionData = await this.satisfactionTracker.getSessionSatisfaction(sessionId);

        // 예측 분석
        const prediction = await this.satisfactionTracker.predictSatisfactionTrend({
            sessionId: sessionId,
            lookAheadMinutes: 5,
            currentContext: this.sdk.contextManager.getSessionContext(sessionId)
        });

        // 예방적 조치 확인
        if (prediction.futureScore < this.alertThresholds.low) {
            const preventiveMeasures = await this.satisfactionTracker.suggestPreventiveMeasures({
                sessionId: sessionId,
                prediction: prediction,
                timeUntilDrop: prediction.timeUntilDrop
            });

            this.sdk.emit('preventive-measures-suggested', {
                prediction: prediction,
                measures: preventiveMeasures
            });
        }

        // 정기 보고
        this.sdk.emit('satisfaction-check-complete', {
            sessionId: sessionId,
            current: satisfactionData,
            prediction: prediction,
            timestamp: Date.now()
        });
    }

    generateSatisfactionReport(session) {
        const sessionMetrics = this.satisfactionMetrics.get(session.sessionCode);

        if (!sessionMetrics) {
            console.warn('세션 만족도 데이터를 찾을 수 없음:', session.sessionCode);
            return;
        }

        const report = {
            sessionId: session.sessionCode,
            duration: session.duration,
            totalInteractions: sessionMetrics.scores.length,
            averageSatisfaction: sessionMetrics.movingAverage,
            finalTrend: sessionMetrics.trend,
            satisfactionRange: {
                min: Math.min(...sessionMetrics.scores.map(s => s.score)),
                max: Math.max(...sessionMetrics.scores.map(s => s.score))
            },
            criticalEvents: sessionMetrics.alerts.filter(a => a.severity === 'critical').length,
            improvementOpportunities: this.identifyImprovementOpportunities(sessionMetrics),
            recommendations: this.generateSessionRecommendations(sessionMetrics, session)
        };

        console.log('세션 만족도 보고서:', report);

        this.sdk.emit('satisfaction-report-generated', {
            report: report,
            session: session
        });

        return report;
    }

    identifyImprovementOpportunities(metrics) {
        const opportunities = [];

        // 낮은 점수 구간 분석
        const lowScorePeriods = metrics.scores.filter(s => s.score < 0.5);
        if (lowScorePeriods.length > metrics.scores.length * 0.3) {
            opportunities.push({
                type: 'consistent-low-satisfaction',
                description: '지속적인 낮은 만족도',
                priority: 'high',
                suggestion: '게임 난이도 조정 및 사용자 지원 강화 필요'
            });
        }

        // 만족도 하락 패턴 분석
        const declines = this.findSatisfactionDeclines(metrics.scores);
        if (declines.length > 3) {
            opportunities.push({
                type: 'frequent-satisfaction-drops',
                description: '빈번한 만족도 하락',
                priority: 'medium',
                suggestion: '게임 플로우 개선 및 예방적 지원 시스템 도입 필요'
            });
        }

        return opportunities;
    }

    generateSessionRecommendations(metrics, session) {
        const recommendations = [];

        if (metrics.movingAverage < 0.6) {
            recommendations.push({
                category: 'difficulty',
                priority: 'high',
                suggestion: '게임 난이도를 낮춰 사용자 성취감을 높이세요',
                implementation: 'difficulty-auto-adjust'
            });
        }

        if (metrics.trend === 'declining') {
            recommendations.push({
                category: 'engagement',
                priority: 'high',
                suggestion: '더 자주 격려와 피드백을 제공하세요',
                implementation: 'feedback-frequency-increase'
            });
        }

        return recommendations;
    }
}
```

---

## 🏁 마무리

이 SessionSDK 심화 가이드는 다음과 같은 고급 기능들을 다루었습니다:

### ✅ 학습한 주요 내용
1. **고급 세션 관리** - 다중 세션, 모니터링, 자동 재연결
2. **이벤트 시스템 심화** - 커스텀 이벤트, 큐, 배치 처리
3. **에러 처리 및 복구** - 포괄적 에러 처리, 자동 복구
4. **성능 최적화** - 데이터 압축, 메모리 관리, 캐싱
5. **보안 및 검증** - 데이터 검증, 암호화 통신
6. **멀티플레이어 고급 기능** - 동기화, 충돌 해결
7. **실전 구현 패턴** - 상태 관리, 리소스 관리
8. **AI 지원 시스템 통합** - ContextManager, ConversationOptimizer와 SessionSDK 연동
9. **컨텍스트 관리 및 대화 최적화** - 게임 상황별 대화, 개인화된 응답
10. **실시간 디버깅 및 코드 실행** - 브레이크포인트, 변수 감시, 자동 수정
11. **만족도 추적 및 성능 모니터링** - 실시간 만족도 측정, 예방적 개입

### 🎯 다음 단계
- 실제 게임에 이 패턴들 적용
- 성능 측정 및 최적화
- 사용자 피드백 기반 개선
- 추가 고급 기능 구현
- AI 시스템과의 완전한 통합
- 실시간 분석 및 자동 최적화 구현
- 개인화된 게임 경험 제공

### 💡 핵심 포인트
> **Phase 2.2의 AI 지원 시스템들(ContextManager, ConversationOptimizer, CodeExecutionEngine, RealTimeDebugger, UserSatisfactionTracker)을 SessionSDK와 통합하면 단순한 게임 플랫폼을 넘어 지능형 게임 개발 환경으로 진화할 수 있습니다. 성능과 안정성을 위해서는 단계적 구현이 중요하며, AI 기능들은 선택적으로 활성화하여 시스템 부하를 관리해야 합니다.**

> **특히 실시간 디버깅과 만족도 추적 기능은 개발 단계에서는 필수이지만, 프로덕션 환경에서는 성능에 미치는 영향을 고려하여 조절해야 합니다.**

---

**📚 관련 문서**
- [게임 개발 아키텍처 가이드](01-architecture-design.md)
- [센서 데이터 완전 활용법](../sensor-processing/orientation-sensor.md)
- [실시간 멀티플레이어 구현](../game-types/realtime-multiplayer.md)
- [AI 매뉴얼 챗봇 시스템](../api-sdk/ai-assistant-integration.md)
- [코드 실행 엔진 활용법](../advanced/code-execution-patterns.md)
- [사용자 만족도 분석](../troubleshooting/satisfaction-optimization.md)

**🔧 Phase 2.2 구현 파일들**
- `/server/context/ContextManager.js` - 컨텍스트 관리 시스템
- `/server/conversation/ConversationHistoryOptimizer.js` - 대화 최적화
- `/server/execution/CodeExecutionEngine.js` - 코드 실행 엔진
- `/server/debugging/RealTimeDebugger.js` - 실시간 디버거
- `/server/satisfaction/UserSatisfactionTracker.js` - 만족도 추적

**⚡ 성능 최적화 팁**
- AI 기능들은 필요에 따라 선택적 활성화
- 실시간 분석 주기는 게임 타입에 맞게 조정
- 메모리 사용량 모니터링으로 안정성 확보
- 백그라운드 분석으로 게임 성능 영향 최소화