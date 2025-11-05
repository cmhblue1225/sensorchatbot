/**
 * 📱 SensorUtils v6.0 - TypeScript Edition
 *
 * 센서 데이터 처리 및 변환 유틸리티
 * - 센서 좌표계 변환
 * - 노이즈 필터링
 * - 데이터 검증 및 정규화
 */
import type { SensorData, SensorOrientation, SensorAcceleration, SensorRotationRate, Vector2D, Vector3D } from '../types/index.js';
export declare function validateSensorData(data: any): data is SensorData;
export declare function validateOrientation(orientation: any): orientation is SensorOrientation;
export declare function validateAcceleration(acceleration: any): acceleration is SensorAcceleration;
export declare function validateRotationRate(rotationRate: any): rotationRate is SensorRotationRate;
/**
 * 기기 방향에 따른 센서 좌표계 보정
 */
export declare function correctForScreenOrientation(orientation: SensorOrientation, screenOrientation?: number): Vector2D;
/**
 * 센서 데이터를 게임 좌표계로 변환
 */
export declare function convertToGameCoordinates(orientation: SensorOrientation, screenOrientation?: number, sensitivity?: number): Vector2D;
/**
 * 가속도계 데이터에서 중력 제거
 */
export declare function removeGravity(acceleration: SensorAcceleration): Vector3D;
/**
 * 3D 벡터를 2D 게임 평면으로 투영
 */
export declare function projectTo2D(vector3d: Vector3D, plane?: 'xy' | 'xz' | 'yz'): Vector2D;
/**
 * 저역 통과 필터 (Low-pass filter)
 */
export declare class LowPassFilter {
    private previousOutput;
    private alpha;
    constructor(cutoffFrequency?: number);
    filter(input: Vector3D): Vector3D;
    reset(): void;
}
/**
 * 이동 평균 필터 (Moving Average Filter)
 */
export declare class MovingAverageFilter {
    private buffer;
    private windowSize;
    constructor(windowSize?: number);
    filter(input: Vector3D): Vector3D;
    reset(): void;
}
/**
 * 데드존 필터 (Dead Zone Filter)
 */
export declare function applyDeadzone(value: number, threshold?: number): number;
export declare function applyDeadzoneVector(vector: Vector2D, threshold?: number): Vector2D;
export declare function applyDeadzoneVector3D(vector: Vector3D, threshold?: number): Vector3D;
/**
 * 값을 지정된 범위로 클램핑
 */
export declare function clamp(value: number, min: number, max: number): number;
/**
 * 값을 한 범위에서 다른 범위로 매핑
 */
export declare function mapRange(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number;
/**
 * 각도를 -180 ~ 180 범위로 정규화
 */
export declare function normalizeAngle(angle: number): number;
/**
 * 센서 방향값을 정규화된 게임 입력으로 변환
 */
export declare function normalizeOrientation(orientation: SensorOrientation): SensorOrientation;
export declare class SensorCalibrator {
    private baselineOrientation;
    private baselineAcceleration;
    private isCalibrated;
    calibrate(sensorData: SensorData): void;
    getCalibratedData(sensorData: SensorData): SensorData;
    reset(): void;
    isReady(): boolean;
}
export declare class SensorDataStats {
    private samples;
    private maxSamples;
    constructor(maxSamples?: number);
    addSample(data: SensorData): void;
    getAverageOrientation(): SensorOrientation | null;
    getDataRate(): number;
    getLatency(): number;
    reset(): void;
}
/**
 * 벡터의 크기 계산
 */
export declare function vectorMagnitude(vector: Vector2D | Vector3D): number;
/**
 * 두 벡터 사이의 거리
 */
export declare function vectorDistance(a: Vector2D, b: Vector2D): number;
/**
 * 벡터 정규화
 */
export declare function normalizeVector(vector: Vector2D): Vector2D;
/**
 * 센서 데이터 스냅샷 생성
 */
export declare function createSensorSnapshot(data: SensorData): string;
export declare const SensorUtils: {
    validateSensorData: typeof validateSensorData;
    validateOrientation: typeof validateOrientation;
    validateAcceleration: typeof validateAcceleration;
    validateRotationRate: typeof validateRotationRate;
    correctForScreenOrientation: typeof correctForScreenOrientation;
    convertToGameCoordinates: typeof convertToGameCoordinates;
    removeGravity: typeof removeGravity;
    projectTo2D: typeof projectTo2D;
    LowPassFilter: typeof LowPassFilter;
    MovingAverageFilter: typeof MovingAverageFilter;
    applyDeadzone: typeof applyDeadzone;
    applyDeadzoneVector: typeof applyDeadzoneVector;
    applyDeadzoneVector3D: typeof applyDeadzoneVector3D;
    clamp: typeof clamp;
    mapRange: typeof mapRange;
    normalizeAngle: typeof normalizeAngle;
    normalizeOrientation: typeof normalizeOrientation;
    SensorCalibrator: typeof SensorCalibrator;
    SensorDataStats: typeof SensorDataStats;
    vectorMagnitude: typeof vectorMagnitude;
    vectorDistance: typeof vectorDistance;
    normalizeVector: typeof normalizeVector;
    createSensorSnapshot: typeof createSensorSnapshot;
};
export default SensorUtils;
//# sourceMappingURL=sensorUtils.d.ts.map