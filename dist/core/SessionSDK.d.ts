/**
 * 🔧 SessionSDK v6.0 - TypeScript Edition
 *
 * 완벽한 게임별 독립 세션 관리를 위한 통합 SDK
 * - TypeScript로 재작성된 타입 안전한 버전
 * - 게임에서 즉시 세션 생성
 * - 실시간 센서 데이터 처리
 * - 자동 연결 관리 및 복구
 */
import type { SessionSDKConfig, SessionSDKEvents, GameSession } from '../types/index.js';
interface Socket {
    connected: boolean;
    connect(): void;
    disconnect(): void;
    on(event: string, callback: Function): void;
    off(event: string, callback?: Function): void;
    emit(event: string, ...args: any[]): void;
}
declare global {
    interface Window {
        io?: (url: string, options?: any) => Socket;
    }
}
export declare class SessionSDK extends EventTarget {
    private config;
    private state;
    private socket;
    private eventHandlers;
    private reconnectTimer;
    private pingTimer;
    constructor(options: SessionSDKConfig);
    /**
     * 서버 연결
     */
    connect(): Promise<void>;
    /**
     * 소켓 이벤트 설정
     */
    private setupSocketEvents;
    /**
     * 세션 생성
     */
    createSession(callback?: (session: GameSession) => void): void;
    /**
     * 세션 종료
     */
    endSession(reason?: string): void;
    /**
     * 연결 해제
     */
    disconnect(): void;
    /**
     * 이벤트 리스너 등록 (타입 안전)
     */
    on<K extends keyof SessionSDKEvents>(event: K, handler: SessionSDKEvents[K]): void;
    /**
     * 일회성 이벤트 리스너
     */
    once<K extends keyof SessionSDKEvents>(event: K, handler: SessionSDKEvents[K]): void;
    /**
     * 이벤트 리스너 제거
     */
    off<K extends keyof SessionSDKEvents>(event: K, handler: SessionSDKEvents[K]): void;
    /**
     * 이벤트 발생
     */
    private emit;
    /**
     * 재연결 시도
     */
    private attemptReconnect;
    /**
     * 재연결 타이머 중지
     */
    private stopReconnectTimer;
    /**
     * Ping 타이머 시작
     */
    private startPingTimer;
    /**
     * Ping 타이머 중지
     */
    private stopPingTimer;
    /**
     * 센서 데이터 검증
     */
    private validateSensorData;
    /**
     * 에러 처리
     */
    private handleError;
    /**
     * 디버그 로깅
     */
    private log;
    /**
     * 현재 상태 조회
     */
    getState(): Readonly<typeof this.state>;
    /**
     * 설정 조회
     */
    getConfig(): Readonly<typeof this.config>;
    /**
     * 연결 상태 확인
     */
    isConnected(): boolean;
    /**
     * 세션 존재 확인
     */
    hasSession(): boolean;
    /**
     * 현재 세션 정보
     */
    getCurrentSession(): GameSession | null;
    /**
     * 연결 품질 정보
     */
    getConnectionQuality(): {
        latency: number;
        uptime: number;
        reconnectCount: number;
    };
}
declare global {
    interface Window {
        SessionSDK?: typeof SessionSDK;
    }
}
export default SessionSDK;
//# sourceMappingURL=SessionSDK.d.ts.map