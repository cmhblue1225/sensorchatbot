/**
 * 🔢 MathUtils v6.0 - TypeScript Edition
 *
 * 게임 개발을 위한 수학 유틸리티
 * - 벡터 연산
 * - 충돌 감지
 * - 보간 및 애니메이션
 * - 물리 계산
 */

import type { Vector2D, Vector3D, Rectangle, Circle, Color } from '../types/index.js';

// ===== 기본 수학 함수 =====

/**
 * 값을 최소값과 최대값 사이로 제한
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * 선형 보간
 */
export function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * clamp(t, 0, 1);
}

/**
 * 값을 한 범위에서 다른 범위로 매핑
 */
export function mapRange(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
): number {
    return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/**
 * 각도를 라디안으로 변환
 */
export function degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * 라디안을 각도로 변환
 */
export function radToDeg(radians: number): number {
    return radians * (180 / Math.PI);
}

/**
 * 각도를 -π ~ π 범위로 정규화
 */
export function normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
}

/**
 * 두 값이 거의 같은지 확인 (부동 소수점 오차 고려)
 */
export function approximately(a: number, b: number, epsilon: number = 0.0001): boolean {
    return Math.abs(a - b) < epsilon;
}

// ===== 벡터 연산 =====

/**
 * 2D 벡터 생성
 */
export function vec2(x: number = 0, y: number = 0): Vector2D {
    return { x, y };
}

/**
 * 3D 벡터 생성
 */
export function vec3(x: number = 0, y: number = 0, z: number = 0): Vector3D {
    return { x, y, z };
}

/**
 * 벡터 덧셈
 */
export function vectorAdd(a: Vector2D, b: Vector2D): Vector2D {
    return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * 벡터 뺄셈
 */
export function vectorSubtract(a: Vector2D, b: Vector2D): Vector2D {
    return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * 벡터 스칼라 곱셈
 */
export function vectorMultiply(vector: Vector2D, scalar: number): Vector2D {
    return { x: vector.x * scalar, y: vector.y * scalar };
}

/**
 * 벡터 나눗셈
 */
export function vectorDivide(vector: Vector2D, scalar: number): Vector2D {
    if (scalar === 0) throw new Error('Division by zero');
    return { x: vector.x / scalar, y: vector.y / scalar };
}

/**
 * 벡터 내적
 */
export function vectorDot(a: Vector2D, b: Vector2D): number {
    return a.x * b.x + a.y * b.y;
}

/**
 * 벡터 외적 (2D에서는 스칼라 값)
 */
export function vectorCross(a: Vector2D, b: Vector2D): number {
    return a.x * b.y - a.y * b.x;
}

/**
 * 벡터 크기
 */
export function vectorMagnitude(vector: Vector2D): number {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}

/**
 * 벡터 크기의 제곱 (성능 최적화용)
 */
export function vectorMagnitudeSquared(vector: Vector2D): number {
    return vector.x * vector.x + vector.y * vector.y;
}

/**
 * 벡터 정규화
 */
export function vectorNormalize(vector: Vector2D): Vector2D {
    const magnitude = vectorMagnitude(vector);
    if (magnitude === 0) return { x: 0, y: 0 };
    return vectorDivide(vector, magnitude);
}

/**
 * 두 벡터 사이의 거리
 */
export function vectorDistance(a: Vector2D, b: Vector2D): number {
    const diff = vectorSubtract(a, b);
    return vectorMagnitude(diff);
}

/**
 * 두 벡터 사이의 거리의 제곱
 */
export function vectorDistanceSquared(a: Vector2D, b: Vector2D): number {
    const diff = vectorSubtract(a, b);
    return vectorMagnitudeSquared(diff);
}

/**
 * 벡터 회전
 */
export function vectorRotate(vector: Vector2D, angle: number): Vector2D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: vector.x * cos - vector.y * sin,
        y: vector.x * sin + vector.y * cos
    };
}

/**
 * 벡터 선형 보간
 */
export function vectorLerp(a: Vector2D, b: Vector2D, t: number): Vector2D {
    return {
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t)
    };
}

/**
 * 벡터 반사 (법선 벡터에 대해)
 */
export function vectorReflect(vector: Vector2D, normal: Vector2D): Vector2D {
    const dot = vectorDot(vector, normal);
    return vectorSubtract(vector, vectorMultiply(normal, 2 * dot));
}

// ===== 충돌 감지 =====

/**
 * 점과 원의 충돌
 */
export function pointInCircle(point: Vector2D, circle: Circle): boolean {
    return vectorDistanceSquared(point, { x: circle.x, y: circle.y }) <= circle.radius * circle.radius;
}

/**
 * 점과 사각형의 충돌
 */
export function pointInRectangle(point: Vector2D, rect: Rectangle): boolean {
    return (
        point.x >= rect.x &&
        point.x <= rect.x + rect.width &&
        point.y >= rect.y &&
        point.y <= rect.y + rect.height
    );
}

/**
 * 원과 원의 충돌
 */
export function circleCircleCollision(a: Circle, b: Circle): boolean {
    const distance = vectorDistance({ x: a.x, y: a.y }, { x: b.x, y: b.y });
    return distance <= a.radius + b.radius;
}

/**
 * 원과 사각형의 충돌
 */
export function circleRectangleCollision(circle: Circle, rect: Rectangle): boolean {
    const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
    const closestY = clamp(circle.y, rect.y, rect.y + rect.height);

    const distance = vectorDistance({ x: circle.x, y: circle.y }, { x: closestX, y: closestY });
    return distance <= circle.radius;
}

/**
 * 사각형과 사각형의 충돌 (AABB)
 */
export function rectangleRectangleCollision(a: Rectangle, b: Rectangle): boolean {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

/**
 * 선분과 선분의 교차
 */
export function lineLineIntersection(
    p1: Vector2D,
    p2: Vector2D,
    p3: Vector2D,
    p4: Vector2D
): Vector2D | null {
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);

    if (approximately(denom, 0)) return null; // 평행선

    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / denom;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y)
        };
    }

    return null;
}

// ===== 물리 계산 =====

/**
 * 탄성 충돌 후 속도 계산
 */
export function elasticCollision(
    v1: Vector2D,
    v2: Vector2D,
    m1: number,
    m2: number,
    restitution: number = 1
): { v1: Vector2D; v2: Vector2D } {
    const totalMass = m1 + m2;

    const newV1: Vector2D = {
        x: ((m1 - m2 * restitution) * v1.x + (1 + restitution) * m2 * v2.x) / totalMass,
        y: ((m1 - m2 * restitution) * v1.y + (1 + restitution) * m2 * v2.y) / totalMass
    };

    const newV2: Vector2D = {
        x: ((m2 - m1 * restitution) * v2.x + (1 + restitution) * m1 * v1.x) / totalMass,
        y: ((m2 - m1 * restitution) * v2.y + (1 + restitution) * m1 * v1.y) / totalMass
    };

    return { v1: newV1, v2: newV2 };
}

/**
 * 포물선 운동 계산
 */
export function projectileMotion(
    initialPosition: Vector2D,
    initialVelocity: Vector2D,
    gravity: number,
    time: number
): Vector2D {
    return {
        x: initialPosition.x + initialVelocity.x * time,
        y: initialPosition.y + initialVelocity.y * time + 0.5 * gravity * time * time
    };
}

/**
 * 스프링 힘 계산
 */
export function springForce(
    position: Vector2D,
    restPosition: Vector2D,
    springConstant: number,
    damping: number = 0,
    velocity: Vector2D = { x: 0, y: 0 }
): Vector2D {
    const displacement = vectorSubtract(restPosition, position);
    const springForce = vectorMultiply(displacement, springConstant);
    const dampingForce = vectorMultiply(velocity, -damping);

    return vectorAdd(springForce, dampingForce);
}

// ===== 애니메이션 및 이징 =====

/**
 * 이징 함수들
 */
export const Easing = {
    linear: (t: number): number => t,

    easeInQuad: (t: number): number => t * t,
    easeOutQuad: (t: number): number => t * (2 - t),
    easeInOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

    easeInCubic: (t: number): number => t * t * t,
    easeOutCubic: (t: number): number => (--t) * t * t + 1,
    easeInOutCubic: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

    easeInSine: (t: number): number => 1 - Math.cos(t * Math.PI / 2),
    easeOutSine: (t: number): number => Math.sin(t * Math.PI / 2),
    easeInOutSine: (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2,

    easeInElastic: (t: number): number => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    },

    easeOutElastic: (t: number): number => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },

    easeInBounce: (t: number): number => 1 - Easing.easeOutBounce(1 - t),

    easeOutBounce: (t: number): number => {
        const n1 = 7.5625;
        const d1 = 2.75;

        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    }
};

/**
 * 트윈 애니메이션 클래스
 */
export class Tween {
    private startValue: number;
    private endValue: number;
    private duration: number;
    private startTime: number;
    private easingFunction: (t: number) => number;
    private onUpdate?: (value: number) => void;
    private onComplete?: () => void;
    private isComplete: boolean = false;

    constructor(
        startValue: number,
        endValue: number,
        duration: number,
        easingFunction: (t: number) => number = Easing.linear
    ) {
        this.startValue = startValue;
        this.endValue = endValue;
        this.duration = duration;
        this.easingFunction = easingFunction;
        this.startTime = Date.now();
    }

    update(): number {
        if (this.isComplete) return this.endValue;

        const elapsed = Date.now() - this.startTime;
        const t = clamp(elapsed / this.duration, 0, 1);
        const easedT = this.easingFunction(t);
        const currentValue = lerp(this.startValue, this.endValue, easedT);

        if (this.onUpdate) this.onUpdate(currentValue);

        if (t >= 1) {
            this.isComplete = true;
            if (this.onComplete) this.onComplete();
        }

        return currentValue;
    }

    onUpdateCallback(callback: (value: number) => void): Tween {
        this.onUpdate = callback;
        return this;
    }

    onCompleteCallback(callback: () => void): Tween {
        this.onComplete = callback;
        return this;
    }

    complete(): boolean {
        return this.isComplete;
    }
}

// ===== 랜덤 유틸리티 =====

/**
 * 범위 내 랜덤 정수
 */
export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 범위 내 랜덤 실수
 */
export function randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/**
 * 랜덤 각도 (라디안)
 */
export function randomAngle(): number {
    return Math.random() * 2 * Math.PI;
}

/**
 * 단위원 위의 랜덤 벡터
 */
export function randomUnitVector(): Vector2D {
    const angle = randomAngle();
    return {
        x: Math.cos(angle),
        y: Math.sin(angle)
    };
}

/**
 * 배열에서 랜덤 요소 선택
 */
export function randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * 가중치 기반 랜덤 선택
 */
export function weightedRandomChoice<T>(items: T[], weights: number[]): T {
    if (items.length !== weights.length) {
        throw new Error('Items and weights arrays must have the same length');
    }

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let randomWeight = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
        randomWeight -= weights[i];
        if (randomWeight <= 0) {
            return items[i];
        }
    }

    return items[items.length - 1];
}

// ===== 색상 유틸리티 =====

/**
 * RGB를 HEX로 변환
 */
export function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * HEX를 RGB로 변환
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * 색상 보간
 */
export function lerpColor(
    startColor: { r: number; g: number; b: number },
    endColor: { r: number; g: number; b: number },
    t: number
): { r: number; g: number; b: number } {
    return {
        r: lerp(startColor.r, endColor.r, t),
        g: lerp(startColor.g, endColor.g, t),
        b: lerp(startColor.b, endColor.b, t)
    };
}

// ===== 노이즈 생성 =====

/**
 * 간단한 1D 노이즈 함수 (Perlin noise 기반)
 */
export function noise1D(x: number): number {
    let n = Math.sin(x) * 43758.5453;
    return n - Math.floor(n);
}

/**
 * 2D 노이즈 함수
 */
export function noise2D(x: number, y: number): number {
    let n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
}

// ===== 내보내기 =====

export const MathUtils = {
    // 기본 함수
    clamp,
    lerp,
    mapRange,
    degToRad,
    radToDeg,
    normalizeAngle,
    approximately,

    // 벡터
    vec2,
    vec3,
    vectorAdd,
    vectorSubtract,
    vectorMultiply,
    vectorDivide,
    vectorDot,
    vectorCross,
    vectorMagnitude,
    vectorMagnitudeSquared,
    vectorNormalize,
    vectorDistance,
    vectorDistanceSquared,
    vectorRotate,
    vectorLerp,
    vectorReflect,

    // 충돌 감지
    pointInCircle,
    pointInRectangle,
    circleCircleCollision,
    circleRectangleCollision,
    rectangleRectangleCollision,
    lineLineIntersection,

    // 물리
    elasticCollision,
    projectileMotion,
    springForce,

    // 애니메이션
    Easing,
    Tween,

    // 랜덤
    randomInt,
    randomFloat,
    randomAngle,
    randomUnitVector,
    randomChoice,
    weightedRandomChoice,

    // 색상
    rgbToHex,
    hexToRgb,
    lerpColor,

    // 노이즈
    noise1D,
    noise2D
};

export default MathUtils;