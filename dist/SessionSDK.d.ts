/**
 * 🔧 SessionSDK v6.0
 *
 * 완벽한 게임별 독립 세션 관리를 위한 통합 SDK
 * - 게임에서 즉시 세션 생성
 * - 실시간 센서 데이터 처리
 * - 자동 연결 관리 및 복구
 */
export class SessionSDK extends EventTarget {
    constructor(options?: {});
    config: {
        serverUrl: any;
        gameId: any;
        gameType: any;
        autoReconnect: boolean;
        reconnectInterval: any;
        maxReconnectAttempts: any;
        debug: any;
    };
    state: {
        connected: boolean;
        session: null;
        reconnectAttempts: number;
        lastPing: number;
    };
    socket: any;
    eventHandlers: Map<any, any>;
    /**
     * 서버 연결
     */
    connect(): Promise<void>;
    /**
     * Socket.IO 이벤트 설정
     */
    setupSocketEvents(): void;
    /**
     * 게임 세션 생성 (게임에서 호출)
     */
    createSession(): Promise<any>;
    /**
     * 센서 연결 (모바일에서 호출)
     */
    connectSensor(sessionCode: any, deviceInfo?: {}): Promise<any>;
    /**
     * 센서 데이터 전송 (모바일에서 호출)
     */
    sendSensorData(sensorData: any): boolean;
    /**
     * 게임 시작 (게임에서 호출)
     */
    startGame(): Promise<any>;
    /**
     * 세션 정보 조회
     */
    getSession(): null;
    /**
     * 연결 상태 조회
     */
    isConnected(): boolean;
    /**
     * 센서 연결 정보 조회
     */
    getSensorConnection(): any;
    /**
     * 핑 테스트
     */
    ping(): Promise<any>;
    /**
     * 연결 해제
     */
    disconnect(): void;
    /**
     * 연결 대기
     */
    waitForConnection(timeout?: number): Promise<any>;
    /**
     * 재연결 스케줄링
     */
    scheduleReconnect(): void;
    /**
     * 이벤트 리스너 추가 (편의 메서드)
     */
    on(eventName: any, handler: any): void;
    /**
     * 이벤트 리스너 제거 (편의 메서드)
     */
    off(eventName: any, handler: any): void;
    /**
     * 이벤트 발생 (편의 메서드)
     */
    emit(eventName: any, data?: {}): void;
    /**
     * 디버그 로그
     */
    log(...args: any[]): void;
    /**
     * SDK 정리
     */
    destroy(): void;
}
export class QRCodeGenerator {
    static generate(text: any, size?: number): Promise<string>;
    static generateElement(text: any, size?: number): Promise<HTMLDivElement>;
}
export class SensorCollector {
    constructor(options?: {});
    options: {
        throttle: any;
        sensitivity: any;
    };
    isActive: boolean;
    lastUpdate: number;
    handlers: Set<any>;
    sensorData: {
        acceleration: {
            x: number;
            y: number;
            z: number;
        };
        rotationRate: {
            alpha: number;
            beta: number;
            gamma: number;
        };
        orientation: {
            alpha: number;
            beta: number;
            gamma: number;
        };
    };
    start(): Promise<void>;
    stop(): void;
    handleDeviceMotion(event: any): void;
    handleDeviceOrientation(event: any): void;
    checkSensorSupport(): boolean;
    onData(handler: any): void;
    offData(handler: any): void;
    notifyHandlers(): void;
    getCurrentData(): {
        acceleration: {
            x: number;
            y: number;
            z: number;
        };
        rotationRate: {
            alpha: number;
            beta: number;
            gamma: number;
        };
        orientation: {
            alpha: number;
            beta: number;
            gamma: number;
        };
    };
}
//# sourceMappingURL=SessionSDK.d.ts.map