/**
 * 📱 SensorUtils v6.0 - TypeScript Edition
 *
 * 센서 데이터 처리 및 변환 유틸리티
 * - 센서 좌표계 변환
 * - 노이즈 필터링
 * - 데이터 검증 및 정규화
 */

import type {
    SensorData,
    SensorOrientation,
    SensorAcceleration,
    SensorRotationRate,
    Vector2D,
    Vector3D
} from '../types/index.js';

// ===== 센서 데이터 검증 =====

export function validateSensorData(data: any): data is SensorData {
    if (!data || typeof data !== 'object') return false;

    const { sensorId, gameType, data: sensorValues, timestamp } = data;

    return (
        typeof sensorId === 'string' &&
        typeof gameType === 'string' &&
        typeof timestamp === 'number' &&
        sensorValues &&
        validateOrientation(sensorValues.orientation) &&
        validateAcceleration(sensorValues.acceleration) &&
        validateRotationRate(sensorValues.rotationRate)
    );
}

export function validateOrientation(orientation: any): orientation is SensorOrientation {
    return (
        orientation &&
        typeof orientation.alpha === 'number' &&
        typeof orientation.beta === 'number' &&
        typeof orientation.gamma === 'number' &&
        isFinite(orientation.alpha) &&
        isFinite(orientation.beta) &&
        isFinite(orientation.gamma)
    );
}

export function validateAcceleration(acceleration: any): acceleration is SensorAcceleration {
    return (
        acceleration &&
        typeof acceleration.x === 'number' &&
        typeof acceleration.y === 'number' &&
        typeof acceleration.z === 'number' &&
        isFinite(acceleration.x) &&
        isFinite(acceleration.y) &&
        isFinite(acceleration.z)
    );
}

export function validateRotationRate(rotationRate: any): rotationRate is SensorRotationRate {
    return (
        rotationRate &&
        typeof rotationRate.alpha === 'number' &&
        typeof rotationRate.beta === 'number' &&
        typeof rotationRate.gamma === 'number' &&
        isFinite(rotationRate.alpha) &&
        isFinite(rotationRate.beta) &&
        isFinite(rotationRate.gamma)
    );
}

// ===== 좌표계 변환 =====

/**
 * 기기 방향에 따른 센서 좌표계 보정
 */
export function correctForScreenOrientation(
    orientation: SensorOrientation,
    screenOrientation: number = 0
): Vector2D {
    const { alpha, beta, gamma } = orientation;

    switch (screenOrientation) {
        case 0:   // Portrait
            return { x: gamma, y: beta };
        case 90:  // Landscape (시계방향)
            return { x: -beta, y: gamma };
        case 180: // Portrait (거꾸로)
            return { x: -gamma, y: -beta };
        case 270: // Landscape (반시계방향)
            return { x: beta, y: -gamma };
        default:
            return { x: gamma, y: beta };
    }
}

/**
 * 센서 데이터를 게임 좌표계로 변환
 */
export function convertToGameCoordinates(
    orientation: SensorOrientation,
    screenOrientation: number = 0,
    sensitivity: number = 1.0
): Vector2D {
    const corrected = correctForScreenOrientation(orientation, screenOrientation);

    return {
        x: corrected.x * sensitivity,
        y: corrected.y * sensitivity
    };
}

/**
 * 가속도계 데이터에서 중력 제거
 */
export function removeGravity(acceleration: SensorAcceleration): Vector3D {
    // 간단한 중력 제거 (실제로는 더 복잡한 필터가 필요)
    return {
        x: acceleration.x,
        y: acceleration.y - 9.8, // 표준 중력 가속도
        z: acceleration.z
    };
}

/**
 * 3D 벡터를 2D 게임 평면으로 투영
 */
export function projectTo2D(vector3d: Vector3D, plane: 'xy' | 'xz' | 'yz' = 'xy'): Vector2D {
    switch (plane) {
        case 'xy':
            return { x: vector3d.x, y: vector3d.y };
        case 'xz':
            return { x: vector3d.x, y: vector3d.z };
        case 'yz':
            return { x: vector3d.y, y: vector3d.z };
        default:
            return { x: vector3d.x, y: vector3d.y };
    }
}

// ===== 노이즈 필터링 =====

/**
 * 저역 통과 필터 (Low-pass filter)
 */
export class LowPassFilter {
    private previousOutput: Vector3D | null = null;
    private alpha: number;

    constructor(cutoffFrequency: number = 0.1) {
        this.alpha = cutoffFrequency;
    }

    filter(input: Vector3D): Vector3D {
        if (this.previousOutput === null) {
            this.previousOutput = { ...input };
            return input;
        }

        const output: Vector3D = {
            x: this.alpha * input.x + (1 - this.alpha) * this.previousOutput.x,
            y: this.alpha * input.y + (1 - this.alpha) * this.previousOutput.y,
            z: this.alpha * input.z + (1 - this.alpha) * this.previousOutput.z
        };

        this.previousOutput = output;
        return output;
    }

    reset(): void {
        this.previousOutput = null;
    }
}

/**
 * 이동 평균 필터 (Moving Average Filter)
 */
export class MovingAverageFilter {
    private buffer: Vector3D[] = [];
    private windowSize: number;

    constructor(windowSize: number = 5) {
        this.windowSize = windowSize;
    }

    filter(input: Vector3D): Vector3D {
        this.buffer.push({ ...input });

        if (this.buffer.length > this.windowSize) {
            this.buffer.shift();
        }

        const sum = this.buffer.reduce(
            (acc, val) => ({
                x: acc.x + val.x,
                y: acc.y + val.y,
                z: acc.z + val.z
            }),
            { x: 0, y: 0, z: 0 }
        );

        return {
            x: sum.x / this.buffer.length,
            y: sum.y / this.buffer.length,
            z: sum.z / this.buffer.length
        };
    }

    reset(): void {
        this.buffer = [];
    }
}

/**
 * 데드존 필터 (Dead Zone Filter)
 */
export function applyDeadzone(value: number, threshold: number = 5): number {
    return Math.abs(value) < threshold ? 0 : value;
}

export function applyDeadzoneVector(vector: Vector2D, threshold: number = 5): Vector2D {
    return {
        x: applyDeadzone(vector.x, threshold),
        y: applyDeadzone(vector.y, threshold)
    };
}

export function applyDeadzoneVector3D(vector: Vector3D, threshold: number = 5): Vector3D {
    return {
        x: applyDeadzone(vector.x, threshold),
        y: applyDeadzone(vector.y, threshold),
        z: applyDeadzone(vector.z, threshold)
    };
}

// ===== 센서 데이터 정규화 =====

/**
 * 값을 지정된 범위로 클램핑
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * 값을 한 범위에서 다른 범위로 매핑
 */
export function mapRange(
    value: number,
    fromMin: number,
    fromMax: number,
    toMin: number,
    toMax: number
): number {
    const normalized = (value - fromMin) / (fromMax - fromMin);
    return toMin + normalized * (toMax - toMin);
}

/**
 * 각도를 -180 ~ 180 범위로 정규화
 */
export function normalizeAngle(angle: number): number {
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    return angle;
}

/**
 * 센서 방향값을 정규화된 게임 입력으로 변환
 */
export function normalizeOrientation(orientation: SensorOrientation): SensorOrientation {
    return {
        alpha: normalizeAngle(orientation.alpha),
        beta: clamp(normalizeAngle(orientation.beta), -90, 90),
        gamma: clamp(normalizeAngle(orientation.gamma), -90, 90)
    };
}

// ===== 센서 보정 (Calibration) =====

export class SensorCalibrator {
    private baselineOrientation: SensorOrientation | null = null;
    private baselineAcceleration: SensorAcceleration | null = null;
    private isCalibrated: boolean = false;

    calibrate(sensorData: SensorData): void {
        this.baselineOrientation = { ...sensorData.data.orientation };
        this.baselineAcceleration = { ...sensorData.data.acceleration };
        this.isCalibrated = true;
    }

    getCalibratedData(sensorData: SensorData): SensorData {
        if (!this.isCalibrated || !this.baselineOrientation || !this.baselineAcceleration) {
            return sensorData;
        }

        return {
            ...sensorData,
            data: {
                ...sensorData.data,
                orientation: {
                    alpha: normalizeAngle(sensorData.data.orientation.alpha - this.baselineOrientation.alpha),
                    beta: normalizeAngle(sensorData.data.orientation.beta - this.baselineOrientation.beta),
                    gamma: normalizeAngle(sensorData.data.orientation.gamma - this.baselineOrientation.gamma)
                },
                acceleration: {
                    x: sensorData.data.acceleration.x - this.baselineAcceleration.x,
                    y: sensorData.data.acceleration.y - this.baselineAcceleration.y,
                    z: sensorData.data.acceleration.z - this.baselineAcceleration.z
                }
            }
        };
    }

    reset(): void {
        this.baselineOrientation = null;
        this.baselineAcceleration = null;
        this.isCalibrated = false;
    }

    isReady(): boolean {
        return this.isCalibrated;
    }
}

// ===== 센서 데이터 통계 =====

export class SensorDataStats {
    private samples: SensorData[] = [];
    private maxSamples: number;

    constructor(maxSamples: number = 100) {
        this.maxSamples = maxSamples;
    }

    addSample(data: SensorData): void {
        this.samples.push(data);

        if (this.samples.length > this.maxSamples) {
            this.samples.shift();
        }
    }

    getAverageOrientation(): SensorOrientation | null {
        if (this.samples.length === 0) return null;

        const sum = this.samples.reduce(
            (acc, sample) => ({
                alpha: acc.alpha + sample.data.orientation.alpha,
                beta: acc.beta + sample.data.orientation.beta,
                gamma: acc.gamma + sample.data.orientation.gamma
            }),
            { alpha: 0, beta: 0, gamma: 0 }
        );

        return {
            alpha: sum.alpha / this.samples.length,
            beta: sum.beta / this.samples.length,
            gamma: sum.gamma / this.samples.length
        };
    }

    getDataRate(): number {
        if (this.samples.length < 2) return 0;

        const timeSpan = this.samples[this.samples.length - 1].timestamp - this.samples[0].timestamp;
        return (this.samples.length - 1) / (timeSpan / 1000); // samples per second
    }

    getLatency(): number {
        if (this.samples.length === 0) return 0;

        const now = Date.now();
        const lastSample = this.samples[this.samples.length - 1];
        return now - lastSample.timestamp;
    }

    reset(): void {
        this.samples = [];
    }
}

// ===== 유틸리티 함수들 =====

/**
 * 벡터의 크기 계산
 */
export function vectorMagnitude(vector: Vector2D | Vector3D): number {
    if ('z' in vector) {
        return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    }
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}

/**
 * 두 벡터 사이의 거리
 */
export function vectorDistance(a: Vector2D, b: Vector2D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 벡터 정규화
 */
export function normalizeVector(vector: Vector2D): Vector2D {
    const magnitude = vectorMagnitude(vector);
    if (magnitude === 0) return { x: 0, y: 0 };

    return {
        x: vector.x / magnitude,
        y: vector.y / magnitude
    };
}

/**
 * 센서 데이터 스냅샷 생성
 */
export function createSensorSnapshot(data: SensorData): string {
    const { orientation, acceleration, rotationRate } = data.data;

    return JSON.stringify({
        timestamp: data.timestamp,
        orientation: {
            alpha: Math.round(orientation.alpha * 100) / 100,
            beta: Math.round(orientation.beta * 100) / 100,
            gamma: Math.round(orientation.gamma * 100) / 100
        },
        acceleration: {
            x: Math.round(acceleration.x * 100) / 100,
            y: Math.round(acceleration.y * 100) / 100,
            z: Math.round(acceleration.z * 100) / 100
        },
        rotationRate: {
            alpha: Math.round(rotationRate.alpha * 100) / 100,
            beta: Math.round(rotationRate.beta * 100) / 100,
            gamma: Math.round(rotationRate.gamma * 100) / 100
        }
    });
}

// ===== 내보내기 =====

export const SensorUtils = {
    // 검증
    validateSensorData,
    validateOrientation,
    validateAcceleration,
    validateRotationRate,

    // 좌표계 변환
    correctForScreenOrientation,
    convertToGameCoordinates,
    removeGravity,
    projectTo2D,

    // 필터링
    LowPassFilter,
    MovingAverageFilter,
    applyDeadzone,
    applyDeadzoneVector,
    applyDeadzoneVector3D,

    // 정규화
    clamp,
    mapRange,
    normalizeAngle,
    normalizeOrientation,

    // 보정
    SensorCalibrator,

    // 통계
    SensorDataStats,

    // 유틸리티
    vectorMagnitude,
    vectorDistance,
    normalizeVector,
    createSensorSnapshot
};

export default SensorUtils;