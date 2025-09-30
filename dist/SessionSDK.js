"use strict";
/**
 * 🔧 SessionSDK v6.0
 *
 * 완벽한 게임별 독립 세션 관리를 위한 통합 SDK
 * - 게임에서 즉시 세션 생성
 * - 실시간 센서 데이터 처리
 * - 자동 연결 관리 및 복구
 */
class SessionSDK extends EventTarget {
    constructor(options = {}) {
        super();
        // 설정값
        this.config = {
            serverUrl: options.serverUrl || window.location.origin,
            gameId: options.gameId || 'unknown-game',
            gameType: options.gameType || 'solo', // 'solo', 'dual', 'multi'
            autoReconnect: options.autoReconnect !== false,
            reconnectInterval: options.reconnectInterval || 3000,
            maxReconnectAttempts: options.maxReconnectAttempts || 5,
            debug: options.debug || false
        };
        // 상태 관리
        this.state = {
            connected: false,
            session: null,
            reconnectAttempts: 0,
            lastPing: 0
        };
        // Socket.IO 연결
        this.socket = null;
        // 이벤트 핸들러 저장소
        this.eventHandlers = new Map();
        this.log('🔧 SessionSDK v6.0 초기화', this.config);
        // 자동 연결 시작
        this.connect();
    }
    /**
     * 서버 연결
     */
    async connect() {
        try {
            this.log('🔌 서버 연결 중...');
            // Socket.IO 연결
            this.socket = io(this.config.serverUrl, {
                transports: ['websocket', 'polling'],
                timeout: 10000
            });
            this.setupSocketEvents();
            // 연결 대기
            await this.waitForConnection();
            this.log('✅ 서버 연결 성공');
            this.emit('connected');
        }
        catch (error) {
            this.log('❌ 서버 연결 실패:', error.message);
            this.emit('connection-error', { error: error.message });
            if (this.config.autoReconnect) {
                this.scheduleReconnect();
            }
        }
    }
    /**
     * Socket.IO 이벤트 설정
     */
    setupSocketEvents() {
        this.socket.on('connect', () => {
            this.state.connected = true;
            this.state.reconnectAttempts = 0;
            this.log('✅ Socket 연결됨');
        });
        this.socket.on('disconnect', (reason) => {
            this.state.connected = false;
            this.log('❌ Socket 연결 해제:', reason);
            this.emit('disconnected', { reason });
            if (this.config.autoReconnect && reason !== 'io client disconnect') {
                this.scheduleReconnect();
            }
        });
        this.socket.on('connect_error', (error) => {
            this.log('❌ 연결 오류:', error.message);
            this.emit('connection-error', { error: error.message });
        });
        // 게임별 이벤트 핸들러
        this.socket.on('sensor-connected', (data) => {
            this.log('📱 센서 연결됨:', data);
            this.emit('sensor-connected', data);
        });
        this.socket.on('sensor-disconnected', (data) => {
            this.log('📱 센서 연결 해제:', data);
            this.emit('sensor-disconnected', data);
        });
        this.socket.on('sensor-update', (data) => {
            this.emit('sensor-data', data);
        });
        this.socket.on('game-ready', (data) => {
            this.log('🎮 게임 준비 완료:', data);
            this.emit('game-ready', data);
        });
        this.socket.on('game-started', (data) => {
            this.log('🎮 게임 시작:', data);
            this.emit('game-started', data);
        });
        this.socket.on('host-disconnected', (data) => {
            this.log('🖥️ 호스트 연결 해제:', data);
            this.emit('host-disconnected', data);
        });
        this.socket.on('sensor-error', (data) => {
            this.log('❌ 센서 오류:', data);
            this.emit('sensor-error', data);
        });
    }
    /**
     * 게임 세션 생성 (게임에서 호출)
     */
    async createSession() {
        if (!this.state.connected) {
            throw new Error('서버에 연결되지 않았습니다.');
        }
        this.log('🎮 세션 생성 중...', {
            gameId: this.config.gameId,
            gameType: this.config.gameType
        });
        return new Promise((resolve, reject) => {
            this.socket.emit('create-session', {
                gameId: this.config.gameId,
                gameType: this.config.gameType
            }, (response) => {
                if (response.success) {
                    this.state.session = response.session;
                    this.log('✅ 세션 생성 성공 - 전체 응답:', response);
                    this.log('✅ 세션 객체 상세:', JSON.stringify(response.session, null, 2));
                    this.log('✅ sessionCode 값:', response.session?.sessionCode);
                    this.log('✅ sessionCode 타입:', typeof response.session?.sessionCode);
                    this.emit('session-created', response.session);
                    resolve(response.session);
                }
                else {
                    this.log('❌ 세션 생성 실패:', response.error);
                    reject(new Error(response.error));
                }
            });
        });
    }
    /**
     * 센서 연결 (모바일에서 호출)
     */
    async connectSensor(sessionCode, deviceInfo = {}) {
        if (!this.state.connected) {
            throw new Error('서버에 연결되지 않았습니다.');
        }
        this.log('📱 센서 연결 중...', { sessionCode, deviceInfo });
        return new Promise((resolve, reject) => {
            this.socket.emit('connect-sensor', {
                sessionCode,
                deviceInfo: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    screenSize: `${screen.width}x${screen.height}`,
                    timestamp: Date.now(),
                    ...deviceInfo
                }
            }, (response) => {
                if (response.success) {
                    this.state.connection = response.connection;
                    this.log('✅ 센서 연결 성공:', response.connection);
                    this.emit('sensor-connection-success', response.connection);
                    resolve(response.connection);
                }
                else {
                    this.log('❌ 센서 연결 실패:', response.error);
                    reject(new Error(response.error));
                }
            });
        });
    }
    /**
     * 센서 데이터 전송 (모바일에서 호출)
     */
    sendSensorData(sensorData) {
        if (!this.state.connected || !this.state.connection) {
            this.log('❌ 센서 데이터 전송 실패: 연결되지 않음');
            return false;
        }
        const sendData = {
            sessionCode: this.state.connection.sessionId.split('_')[1], // Extract session code
            sensorId: this.state.connection.sensorId,
            sensorData: {
                ...sensorData,
                timestamp: Date.now()
            }
        };
        this.log('📤 센서 데이터 전송:', sendData);
        this.socket.emit('sensor-data', sendData);
        return true;
    }
    /**
     * 게임 시작 (게임에서 호출)
     */
    async startGame() {
        if (!this.state.connected || !this.state.session) {
            throw new Error('세션이 생성되지 않았습니다.');
        }
        this.log('🎮 게임 시작 요청...');
        return new Promise((resolve, reject) => {
            this.socket.emit('start-game', {
                sessionId: this.state.session.sessionId
            }, (response) => {
                if (response.success) {
                    this.log('✅ 게임 시작 성공:', response.game);
                    this.emit('game-start-success', response.game);
                    resolve(response.game);
                }
                else {
                    this.log('❌ 게임 시작 실패:', response.error);
                    reject(new Error(response.error));
                }
            });
        });
    }
    /**
     * 세션 정보 조회
     */
    getSession() {
        return this.state.session;
    }
    /**
     * 연결 상태 조회
     */
    isConnected() {
        return this.state.connected;
    }
    /**
     * 센서 연결 정보 조회
     */
    getSensorConnection() {
        return this.state.connection;
    }
    /**
     * 핑 테스트
     */
    async ping() {
        if (!this.state.connected) {
            return null;
        }
        const startTime = Date.now();
        return new Promise((resolve) => {
            this.socket.emit('ping', (response) => {
                const latency = Date.now() - startTime;
                this.state.lastPing = latency;
                resolve(latency);
            });
        });
    }
    /**
     * 연결 해제
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.state.connected = false;
        this.state.session = null;
        this.state.connection = null;
        this.log('🔌 연결 해제됨');
    }
    /**
     * 연결 대기
     */
    waitForConnection(timeout = 10000) {
        return new Promise((resolve, reject) => {
            if (this.socket.connected) {
                resolve();
                return;
            }
            const timer = setTimeout(() => {
                reject(new Error('연결 타임아웃'));
            }, timeout);
            this.socket.once('connect', () => {
                clearTimeout(timer);
                resolve();
            });
            this.socket.once('connect_error', (error) => {
                clearTimeout(timer);
                reject(error);
            });
        });
    }
    /**
     * 재연결 스케줄링
     */
    scheduleReconnect() {
        if (this.state.reconnectAttempts >= this.config.maxReconnectAttempts) {
            this.log('❌ 최대 재연결 시도 횟수 초과');
            this.emit('max-reconnect-attempts-reached');
            return;
        }
        this.state.reconnectAttempts++;
        this.log(`🔄 재연결 시도 ${this.state.reconnectAttempts}/${this.config.maxReconnectAttempts} (${this.config.reconnectInterval}ms 후)`);
        setTimeout(() => {
            this.connect();
        }, this.config.reconnectInterval);
    }
    /**
     * 이벤트 리스너 추가 (편의 메서드)
     */
    on(eventName, handler) {
        this.addEventListener(eventName, handler);
        // 핸들러 저장 (제거를 위해)
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, new Set());
        }
        this.eventHandlers.get(eventName).add(handler);
    }
    /**
     * 이벤트 리스너 제거 (편의 메서드)
     */
    off(eventName, handler) {
        this.removeEventListener(eventName, handler);
        if (this.eventHandlers.has(eventName)) {
            this.eventHandlers.get(eventName).delete(handler);
        }
    }
    /**
     * 이벤트 발생 (편의 메서드)
     */
    emit(eventName, data = {}) {
        const event = new CustomEvent(eventName, { detail: data });
        this.dispatchEvent(event);
    }
    /**
     * 디버그 로그
     */
    log(...args) {
        if (this.config.debug) {
            console.log(`[SessionSDK]`, ...args);
        }
    }
    /**
     * SDK 정리
     */
    destroy() {
        this.disconnect();
        // 모든 이벤트 리스너 제거
        for (const [eventName, handlers] of this.eventHandlers) {
            for (const handler of handlers) {
                this.removeEventListener(eventName, handler);
            }
        }
        this.eventHandlers.clear();
        this.log('🗑️ SessionSDK 정리됨');
    }
}
// QR 코드 생성 유틸리티
class QRCodeGenerator {
    static async generate(text, size = 200) {
        if (typeof QRCode !== 'undefined') {
            // QRCode 라이브러리가 있는 경우
            const canvas = document.createElement('canvas');
            await QRCode.toCanvas(canvas, text, { width: size, height: size });
            return canvas.toDataURL();
        }
        else {
            // 폴백: QR 코드 서비스 사용
            return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
        }
    }
    static async generateElement(text, size = 200) {
        const container = document.createElement('div');
        container.className = 'qr-code-container';
        container.style.textAlign = 'center';
        try {
            if (typeof QRCode !== 'undefined') {
                await QRCode.toCanvas(container, text, {
                    width: size,
                    height: size,
                    color: {
                        dark: '#3b82f6',
                        light: '#ffffff'
                    }
                });
            }
            else {
                const img = document.createElement('img');
                img.src = await this.generate(text, size);
                img.alt = 'QR Code';
                img.style.maxWidth = '100%';
                container.appendChild(img);
            }
        }
        catch (error) {
            console.error('QR 코드 생성 실패:', error);
            container.innerHTML = `<p>QR 코드 생성 실패: ${text}</p>`;
        }
        return container;
    }
}
// 센서 데이터 수집 유틸리티
class SensorCollector {
    constructor(options = {}) {
        this.options = {
            throttle: options.throttle || 50, // 50ms 간격
            sensitivity: options.sensitivity || 1,
            ...options
        };
        this.isActive = false;
        this.lastUpdate = 0;
        this.handlers = new Set();
        this.sensorData = {
            acceleration: { x: 0, y: 0, z: 0 },
            rotationRate: { alpha: 0, beta: 0, gamma: 0 },
            orientation: { alpha: 0, beta: 0, gamma: 0 }
        };
    }
    async start() {
        if (!this.checkSensorSupport()) {
            throw new Error('이 기기는 센서를 지원하지 않습니다.');
        }
        // 권한 요청 (iOS 13+)
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            const permission = await DeviceMotionEvent.requestPermission();
            if (permission !== 'granted') {
                throw new Error('센서 권한이 거부되었습니다.');
            }
        }
        // DeviceOrientationEvent 권한도 확인 (iOS 13+)
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission !== 'granted') {
                throw new Error('방향 센서 권한이 거부되었습니다.');
            }
        }
        this.isActive = true;
        // Device Motion 이벤트
        window.addEventListener('devicemotion', this.handleDeviceMotion.bind(this));
        // Device Orientation 이벤트
        window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this));
        console.log('📱 센서 수집 시작');
    }
    stop() {
        this.isActive = false;
        window.removeEventListener('devicemotion', this.handleDeviceMotion.bind(this));
        window.removeEventListener('deviceorientation', this.handleDeviceOrientation.bind(this));
        console.log('📱 센서 수집 중지');
    }
    handleDeviceMotion(event) {
        if (!this.isActive)
            return;
        const now = Date.now();
        if (now - this.lastUpdate < this.options.throttle)
            return;
        if (event.acceleration) {
            this.sensorData.acceleration = {
                x: (event.acceleration.x || 0) * this.options.sensitivity,
                y: (event.acceleration.y || 0) * this.options.sensitivity,
                z: (event.acceleration.z || 0) * this.options.sensitivity
            };
        }
        if (event.rotationRate) {
            this.sensorData.rotationRate = {
                alpha: (event.rotationRate.alpha || 0) * this.options.sensitivity,
                beta: (event.rotationRate.beta || 0) * this.options.sensitivity,
                gamma: (event.rotationRate.gamma || 0) * this.options.sensitivity
            };
        }
        this.lastUpdate = now;
        this.notifyHandlers();
    }
    handleDeviceOrientation(event) {
        if (!this.isActive)
            return;
        this.sensorData.orientation = {
            alpha: event.alpha || 0,
            beta: event.beta || 0,
            gamma: event.gamma || 0
        };
    }
    checkSensorSupport() {
        return 'DeviceMotionEvent' in window && 'DeviceOrientationEvent' in window;
    }
    onData(handler) {
        this.handlers.add(handler);
    }
    offData(handler) {
        this.handlers.delete(handler);
    }
    notifyHandlers() {
        const data = { ...this.sensorData };
        this.handlers.forEach(handler => handler(data));
    }
    getCurrentData() {
        return { ...this.sensorData };
    }
}
// 전역 노출
if (typeof window !== 'undefined') {
    window.SessionSDK = SessionSDK;
    window.QRCodeGenerator = QRCodeGenerator;
    window.SensorCollector = SensorCollector;
}
// 모듈 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SessionSDK, QRCodeGenerator, SensorCollector };
}
//# sourceMappingURL=SessionSDK.js.map