/**
 * 🎮 Sensor Game Hub v6.0 - TypeScript Definitions
 *
 * 전체 프로젝트에서 사용되는 타입 정의
 */

// ===== 기본 타입 정의 =====

export type GameType = 'solo' | 'dual' | 'multi';
export type SessionStatus = 'created' | 'waiting' | 'active' | 'ended' | 'error';
export type SensorType = 'orientation' | 'acceleration' | 'rotationRate';

// ===== 센서 데이터 타입 =====

export interface SensorOrientation {
  alpha: number;  // Z축 회전 (0-360°)
  beta: number;   // X축 회전 (-180~180°)
  gamma: number;  // Y축 회전 (-90~90°)
}

export interface SensorAcceleration {
  x: number;      // 좌우 가속도
  y: number;      // 상하 가속도
  z: number;      // 앞뒤 가속도
}

export interface SensorRotationRate {
  alpha: number;  // Z축 회전 속도
  beta: number;   // X축 회전 속도
  gamma: number;  // Y축 회전 속도
}

export interface SensorData {
  sensorId: string;
  gameType: GameType;
  data: {
    orientation: SensorOrientation;
    acceleration: SensorAcceleration;
    rotationRate: SensorRotationRate;
  };
  timestamp: number;
}

// ===== 게임 관련 타입 =====

export interface GameConfig {
  id: string;
  name: string;
  gameType: GameType;
  description: string;
  category?: string;
  keywords?: string[];
  author?: string;
  version?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  maxPlayers?: number;
  minPlayers?: number;
  requiresSensor: boolean;
  supportedSensors: SensorType[];
}

export interface GameSession {
  id: string;
  code: string;
  gameId: string;
  gameType: GameType;
  status: SessionStatus;
  hostSocketId: string;
  connectedSensors: ConnectedSensor[];
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  qrCodeUrl?: string;
  sensorUrl?: string;
  gameUrl?: string;
  options?: Record<string, any>;
}

export interface ConnectedSensor {
  sensorId: string;
  socketId: string;
  connectedAt: number;
  lastDataAt?: number;
  isActive: boolean;
  userAgent?: string;
  ip?: string;
}

// ===== SessionSDK 관련 타입 =====

export interface SessionSDKConfig {
  gameId: string;
  gameType: GameType;
  serverUrl?: string;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  debug?: boolean;
}

export interface SessionSDKEvents {
  connected: () => void;
  disconnected: (reason: string) => void;
  'session-created': (session: GameSession) => void;
  'sensor-connected': (sensor: ConnectedSensor) => void;
  'sensor-disconnected': (sensorId: string) => void;
  'sensor-data': (data: SensorData) => void;
  'game-started': () => void;
  'game-ended': (reason: string) => void;
  error: (error: Error) => void;
}

// ===== API 응답 타입 =====

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PaginatedResponse<T = any> extends APIResponse<T[]> {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ===== 게임 엔진 타입 =====

export interface GameState {
  isRunning: boolean;
  isPaused: boolean;
  score: number;
  level: number;
  lives?: number;
  timeLeft?: number;
  [key: string]: any;
}

export interface GameObject {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  velocity?: {
    x: number;
    y: number;
  };
  acceleration?: {
    x: number;
    y: number;
  };
  rotation?: number;
  scale?: number;
  visible?: boolean;
  color?: string;
  [key: string]: any;
}

export interface GamePhysics {
  gravity: {
    x: number;
    y: number;
  };
  friction: number;
  bounce: number;
  airResistance?: number;
}

export interface GameBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// ===== 이벤트 관련 타입 =====

export interface GameEvent {
  type: string;
  timestamp: number;
  data?: any;
  source?: string;
}

export type EventHandler<T = any> = (data: T) => void;

export interface EventEmitter {
  on<K extends keyof SessionSDKEvents>(
    event: K,
    handler: SessionSDKEvents[K]
  ): void;
  off<K extends keyof SessionSDKEvents>(
    event: K,
    handler: SessionSDKEvents[K]
  ): void;
  emit<K extends keyof SessionSDKEvents>(
    event: K,
    ...args: Parameters<SessionSDKEvents[K]>
  ): void;
}

// ===== UI 컴포넌트 타입 =====

export interface UIElement {
  id: string;
  type: 'button' | 'text' | 'input' | 'canvas' | 'div';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  visible?: boolean;
  enabled?: boolean;
  style?: Partial<CSSStyleDeclaration>;
  onClick?: () => void;
  onChange?: (value: any) => void;
}

export interface GameUI {
  elements: UIElement[];
  layout: 'horizontal' | 'vertical' | 'grid' | 'absolute';
  responsive?: boolean;
}

// ===== 성능 및 메트릭 타입 =====

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage?: number;
  renderTime?: number;
  updateTime?: number;
  totalObjects?: number;
  activeObjects?: number;
}

export interface SessionMetrics {
  sessionId: string;
  gameId: string;
  duration: number;
  dataPackets: number;
  errors: number;
  performance: PerformanceMetrics;
  sensorStats: {
    [sensorId: string]: {
      packetsReceived: number;
      averageLatency: number;
      errorRate: number;
    };
  };
}

// ===== 설정 및 옵션 타입 =====

export interface GameSettings {
  graphics: {
    quality: 'low' | 'medium' | 'high';
    fps: number;
    fullscreen: boolean;
  };
  audio: {
    enabled: boolean;
    volume: number;
    sfxVolume: number;
    musicVolume: number;
  };
  controls: {
    sensitivity: number;
    deadzone: number;
    autoCalibrate: boolean;
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}

// ===== 에러 타입 =====

export interface GameError extends Error {
  code: string;
  category: 'network' | 'sensor' | 'game' | 'system';
  recoverable: boolean;
  timestamp: number;
  context?: Record<string, any>;
}

// ===== 유틸리티 타입 =====

export type Vector2D = {
  x: number;
  y: number;
};

export type Vector3D = {
  x: number;
  y: number;
  z: number;
};

export type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Circle = {
  x: number;
  y: number;
  radius: number;
};

export type Color = string | {
  r: number;
  g: number;
  b: number;
  a?: number;
};

// ===== 확장 가능한 타입 =====

export interface ExtendableGameObject extends GameObject {
  components?: Map<string, any>;
  tags?: Set<string>;
  update?(deltaTime: number): void;
  render?(ctx: CanvasRenderingContext2D): void;
  onCollision?(other: ExtendableGameObject): void;
  onSensorData?(data: SensorData): void;
}

export interface GamePlugin {
  name: string;
  version: string;
  initialize(game: any): void;
  cleanup(): void;
  update?(deltaTime: number): void;
  render?(ctx: CanvasRenderingContext2D): void;
}

// ===== 개발자 도구 타입 =====

export interface DebugInfo {
  enabled: boolean;
  showFPS: boolean;
  showObjects: boolean;
  showSensorData: boolean;
  showBounds: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface GameDevTools {
  debug: DebugInfo;
  commands: Map<string, Function>;
  inspect(object: any): void;
  log(message: string, level?: string): void;
  measure(name: string, fn: Function): any;
}

// ===== 타입 가드 함수들 =====

export function isSensorData(obj: any): obj is SensorData {
  return obj &&
    typeof obj.sensorId === 'string' &&
    typeof obj.gameType === 'string' &&
    obj.data &&
    obj.data.orientation &&
    typeof obj.data.orientation.alpha === 'number';
}

export function isGameSession(obj: any): obj is GameSession {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.code === 'string' &&
    typeof obj.gameId === 'string';
}

export function isGameError(obj: any): obj is GameError {
  return obj instanceof Error &&
    'code' in obj &&
    'category' in obj;
}

// ===== 전역 타입 확장 =====

declare global {
  interface Window {
    gameConfig?: GameConfig;
    debugMode?: boolean;
  }
}