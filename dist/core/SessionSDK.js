/**
 * 🔧 SessionSDK v6.0 - TypeScript Edition
 *
 * 완벽한 게임별 독립 세션 관리를 위한 통합 SDK
 * - TypeScript로 재작성된 타입 안전한 버전
 * - 게임에서 즉시 세션 생성
 * - 실시간 센서 데이터 처리
 * - 자동 연결 관리 및 복구
 */
export class SessionSDK extends EventTarget {
    constructor(options) {
        super();
        this.socket = null;
        this.eventHandlers = new Map();
        this.reconnectTimer = null;
        this.pingTimer = null;
        // 기본값으로 설정 완성
        this.config = {
            gameId: options.gameId,
            gameType: options.gameType,
            serverUrl: options.serverUrl || window.location.origin,
            autoReconnect: options.autoReconnect !== false,
            reconnectDelay: options.reconnectDelay || 3000,
            maxReconnectAttempts: options.maxReconnectAttempts || 5,
            debug: options.debug || false
        };
        // 상태 초기화
        this.state = {
            connected: false,
            session: null,
            reconnectAttempts: 0,
            lastPing: 0,
            connectionStartTime: 0
        };
        this.log('🔧 SessionSDK v6.0 TypeScript 초기화', this.config);
        // 자동 연결 시작
        this.connect();
    }
    /**
     * 서버 연결
     */
    async connect() {
        try {
            this.log('🔌 서버 연결 중...');
            this.state.connectionStartTime = Date.now();
            // Socket.IO 라이브러리 확인
            if (!window.io) {
                throw new Error('Socket.IO 라이브러리가 로드되지 않았습니다.');
            }
            // 소켓 연결 생성
            this.socket = window.io(this.config.serverUrl, {
                transports: ['websocket', 'polling'],
                timeout: 10000,
                reconnection: false // 수동으로 관리
            });
            // 소켓 이벤트 설정
            this.setupSocketEvents();
        }
        catch (error) {
            this.handleError('연결 실패', error);
        }
    }
    /**
     * 소켓 이벤트 설정
     */
    setupSocketEvents() {
        if (!this.socket)
            return;
        // 연결 성공
        this.socket.on('connect', () => {
            this.log('✅ 서버 연결 완료');
            this.state.connected = true;
            this.state.reconnectAttempts = 0;
            this.startPingTimer();
            this.emit('connected');
        });
        // 연결 끊김
        this.socket.on('disconnect', (reason) => {
            this.log('❌ 서버 연결 끊김:', reason);
            this.state.connected = false;
            this.stopPingTimer();
            this.emit('disconnected', reason);
            // 자동 재연결
            if (this.config.autoReconnect && reason !== 'io client disconnect') {
                this.attemptReconnect();
            }
        });
        // 세션 생성 응답
        this.socket.on('session-created', (session) => {
            this.log('🎮 세션 생성됨:', session);
            this.state.session = session;
            // CustomEvent로 발송 (기존 호환성)
            const event = new CustomEvent('session-created', { detail: session });
            this.dispatchEvent(event);
            this.emit('session-created', session);
        });
        // 센서 연결 알림
        this.socket.on('sensor-connected', (sensor) => {
            this.log('📱 센서 연결됨:', sensor);
            const event = new CustomEvent('sensor-connected', { detail: sensor });
            this.dispatchEvent(event);
            this.emit('sensor-connected', sensor);
        });
        // 센서 연결 해제 알림
        this.socket.on('sensor-disconnected', (sensorId) => {
            this.log('📱 센서 연결 해제됨:', sensorId);
            const event = new CustomEvent('sensor-disconnected', { detail: sensorId });
            this.dispatchEvent(event);
            this.emit('sensor-disconnected', sensorId);
        });
        // 센서 데이터 수신
        this.socket.on('sensor-data', (data) => {
            // 데이터 검증
            if (!this.validateSensorData(data)) {
                this.log('⚠️ 잘못된 센서 데이터:', data);
                return;
            }
            // CustomEvent로 발송 (기존 호환성)
            const event = new CustomEvent('sensor-data', { detail: data });
            this.dispatchEvent(event);
            this.emit('sensor-data', data);
        });
        // 게임 시작 알림
        this.socket.on('game-started', () => {
            this.log('🚀 게임 시작됨');
            const event = new CustomEvent('game-started');
            this.dispatchEvent(event);
            this.emit('game-started');
        });
        // 게임 종료 알림
        this.socket.on('game-ended', (reason) => {
            this.log('🏁 게임 종료됨:', reason);
            const event = new CustomEvent('game-ended', { detail: reason });
            this.dispatchEvent(event);
            this.emit('game-ended', reason);
        });
        // 에러 처리
        this.socket.on('error', (error) => {
            this.handleError('소켓 에러', error);
        });
        // Pong 응답
        this.socket.on('pong', () => {
            this.state.lastPing = Date.now();
        });
    }
    /**
     * 세션 생성
     */
    createSession(callback) {
        if (!this.state.connected || !this.socket) {
            throw new Error('서버에 연결되지 않았습니다.');
        }
        this.log('🎮 세션 생성 요청');
        // 콜백이 제공된 경우 이벤트 리스너로 등록
        if (callback) {
            this.once('session-created', callback);
        }
        // 서버에 세션 생성 요청
        this.socket.emit('create-session', {
            gameId: this.config.gameId,
            gameType: this.config.gameType,
            timestamp: Date.now()
        });
    }
    /**
     * 세션 종료
     */
    endSession(reason = 'user-request') {
        if (!this.state.session || !this.socket) {
            this.log('⚠️ 종료할 세션이 없습니다.');
            return;
        }
        this.log('🛑 세션 종료:', reason);
        this.socket.emit('end-session', {
            sessionCode: this.state.session.code,
            reason: reason,
            timestamp: Date.now()
        });
        this.state.session = null;
    }
    /**
     * 연결 해제
     */
    disconnect() {
        this.log('🔌 연결 해제 중...');
        this.config.autoReconnect = false; // 자동 재연결 비활성화
        this.stopReconnectTimer();
        this.stopPingTimer();
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.state.connected = false;
        this.state.session = null;
    }
    /**
     * 이벤트 리스너 등록 (타입 안전)
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }
    /**
     * 일회성 이벤트 리스너
     */
    once(event, handler) {
        const onceHandler = (...args) => {
            handler(...args);
            this.off(event, onceHandler);
        };
        this.on(event, onceHandler);
    }
    /**
     * 이벤트 리스너 제거
     */
    off(event, handler) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }
    /**
     * 이벤트 발생
     */
    emit(event, ...args) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(...args);
                }
                catch (error) {
                    this.log('❌ 이벤트 핸들러 에러:', error);
                }
            });
        }
    }
    /**
     * 재연결 시도
     */
    attemptReconnect() {
        if (this.state.reconnectAttempts >= this.config.maxReconnectAttempts) {
            this.log('❌ 최대 재연결 횟수 초과');
            this.handleError('재연결 실패', new Error('최대 재연결 횟수를 초과했습니다.'));
            return;
        }
        this.state.reconnectAttempts++;
        this.log(`🔄 재연결 시도 ${this.state.reconnectAttempts}/${this.config.maxReconnectAttempts}`);
        this.reconnectTimer = window.setTimeout(() => {
            this.connect();
        }, this.config.reconnectDelay);
    }
    /**
     * 재연결 타이머 중지
     */
    stopReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
    /**
     * Ping 타이머 시작
     */
    startPingTimer() {
        this.pingTimer = window.setInterval(() => {
            if (this.socket && this.state.connected) {
                this.socket.emit('ping');
            }
        }, 30000); // 30초마다 핑
    }
    /**
     * Ping 타이머 중지
     */
    stopPingTimer() {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
    }
    /**
     * 센서 데이터 검증
     */
    validateSensorData(data) {
        return data &&
            typeof data.sensorId === 'string' &&
            typeof data.gameType === 'string' &&
            data.data &&
            data.data.orientation &&
            typeof data.data.orientation.alpha === 'number' &&
            typeof data.data.orientation.beta === 'number' &&
            typeof data.data.orientation.gamma === 'number' &&
            data.data.acceleration &&
            typeof data.data.acceleration.x === 'number' &&
            typeof data.data.acceleration.y === 'number' &&
            typeof data.data.acceleration.z === 'number';
    }
    /**
     * 에러 처리
     */
    handleError(context, error) {
        const gameError = Object.assign(error, {
            code: 'SDK_ERROR',
            category: 'system',
            recoverable: true,
            timestamp: Date.now(),
            context: { context, config: this.config }
        });
        this.log('❌', context, ':', gameError);
        const event = new CustomEvent('error', { detail: gameError });
        this.dispatchEvent(event);
        this.emit('error', gameError);
    }
    /**
     * 디버그 로깅
     */
    log(...args) {
        if (this.config.debug) {
            console.log('[SessionSDK]', ...args);
        }
    }
    /**
     * 현재 상태 조회
     */
    getState() {
        return { ...this.state };
    }
    /**
     * 설정 조회
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * 연결 상태 확인
     */
    isConnected() {
        return this.state.connected && this.socket?.connected === true;
    }
    /**
     * 세션 존재 확인
     */
    hasSession() {
        return this.state.session !== null;
    }
    /**
     * 현재 세션 정보
     */
    getCurrentSession() {
        return this.state.session;
    }
    /**
     * 연결 품질 정보
     */
    getConnectionQuality() {
        return {
            latency: this.state.lastPing > 0 ? Date.now() - this.state.lastPing : -1,
            uptime: this.state.connectionStartTime > 0 ? Date.now() - this.state.connectionStartTime : 0,
            reconnectCount: this.state.reconnectAttempts
        };
    }
}
if (typeof window !== 'undefined') {
    window.SessionSDK = SessionSDK;
}
export default SessionSDK;
//# sourceMappingURL=SessionSDK.js.map