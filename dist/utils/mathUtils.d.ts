/**
 * 🔢 MathUtils v6.0 - TypeScript Edition
 *
 * 게임 개발을 위한 수학 유틸리티
 * - 벡터 연산
 * - 충돌 감지
 * - 보간 및 애니메이션
 * - 물리 계산
 */
import type { Vector2D, Vector3D, Rectangle, Circle } from '../types/index.js';
/**
 * 값을 최소값과 최대값 사이로 제한
 */
export declare function clamp(value: number, min: number, max: number): number;
/**
 * 선형 보간
 */
export declare function lerp(start: number, end: number, t: number): number;
/**
 * 값을 한 범위에서 다른 범위로 매핑
 */
export declare function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number;
/**
 * 각도를 라디안으로 변환
 */
export declare function degToRad(degrees: number): number;
/**
 * 라디안을 각도로 변환
 */
export declare function radToDeg(radians: number): number;
/**
 * 각도를 -π ~ π 범위로 정규화
 */
export declare function normalizeAngle(angle: number): number;
/**
 * 두 값이 거의 같은지 확인 (부동 소수점 오차 고려)
 */
export declare function approximately(a: number, b: number, epsilon?: number): boolean;
/**
 * 2D 벡터 생성
 */
export declare function vec2(x?: number, y?: number): Vector2D;
/**
 * 3D 벡터 생성
 */
export declare function vec3(x?: number, y?: number, z?: number): Vector3D;
/**
 * 벡터 덧셈
 */
export declare function vectorAdd(a: Vector2D, b: Vector2D): Vector2D;
/**
 * 벡터 뺄셈
 */
export declare function vectorSubtract(a: Vector2D, b: Vector2D): Vector2D;
/**
 * 벡터 스칼라 곱셈
 */
export declare function vectorMultiply(vector: Vector2D, scalar: number): Vector2D;
/**
 * 벡터 나눗셈
 */
export declare function vectorDivide(vector: Vector2D, scalar: number): Vector2D;
/**
 * 벡터 내적
 */
export declare function vectorDot(a: Vector2D, b: Vector2D): number;
/**
 * 벡터 외적 (2D에서는 스칼라 값)
 */
export declare function vectorCross(a: Vector2D, b: Vector2D): number;
/**
 * 벡터 크기
 */
export declare function vectorMagnitude(vector: Vector2D): number;
/**
 * 벡터 크기의 제곱 (성능 최적화용)
 */
export declare function vectorMagnitudeSquared(vector: Vector2D): number;
/**
 * 벡터 정규화
 */
export declare function vectorNormalize(vector: Vector2D): Vector2D;
/**
 * 두 벡터 사이의 거리
 */
export declare function vectorDistance(a: Vector2D, b: Vector2D): number;
/**
 * 두 벡터 사이의 거리의 제곱
 */
export declare function vectorDistanceSquared(a: Vector2D, b: Vector2D): number;
/**
 * 벡터 회전
 */
export declare function vectorRotate(vector: Vector2D, angle: number): Vector2D;
/**
 * 벡터 선형 보간
 */
export declare function vectorLerp(a: Vector2D, b: Vector2D, t: number): Vector2D;
/**
 * 벡터 반사 (법선 벡터에 대해)
 */
export declare function vectorReflect(vector: Vector2D, normal: Vector2D): Vector2D;
/**
 * 점과 원의 충돌
 */
export declare function pointInCircle(point: Vector2D, circle: Circle): boolean;
/**
 * 점과 사각형의 충돌
 */
export declare function pointInRectangle(point: Vector2D, rect: Rectangle): boolean;
/**
 * 원과 원의 충돌
 */
export declare function circleCircleCollision(a: Circle, b: Circle): boolean;
/**
 * 원과 사각형의 충돌
 */
export declare function circleRectangleCollision(circle: Circle, rect: Rectangle): boolean;
/**
 * 사각형과 사각형의 충돌 (AABB)
 */
export declare function rectangleRectangleCollision(a: Rectangle, b: Rectangle): boolean;
/**
 * 선분과 선분의 교차
 */
export declare function lineLineIntersection(p1: Vector2D, p2: Vector2D, p3: Vector2D, p4: Vector2D): Vector2D | null;
/**
 * 탄성 충돌 후 속도 계산
 */
export declare function elasticCollision(v1: Vector2D, v2: Vector2D, m1: number, m2: number, restitution?: number): {
    v1: Vector2D;
    v2: Vector2D;
};
/**
 * 포물선 운동 계산
 */
export declare function projectileMotion(initialPosition: Vector2D, initialVelocity: Vector2D, gravity: number, time: number): Vector2D;
/**
 * 스프링 힘 계산
 */
export declare function springForce(position: Vector2D, restPosition: Vector2D, springConstant: number, damping?: number, velocity?: Vector2D): Vector2D;
/**
 * 이징 함수들
 */
export declare const Easing: {
    linear: (t: number) => number;
    easeInQuad: (t: number) => number;
    easeOutQuad: (t: number) => number;
    easeInOutQuad: (t: number) => number;
    easeInCubic: (t: number) => number;
    easeOutCubic: (t: number) => number;
    easeInOutCubic: (t: number) => number;
    easeInSine: (t: number) => number;
    easeOutSine: (t: number) => number;
    easeInOutSine: (t: number) => number;
    easeInElastic: (t: number) => number;
    easeOutElastic: (t: number) => number;
    easeInBounce: (t: number) => number;
    easeOutBounce: (t: number) => number;
};
/**
 * 트윈 애니메이션 클래스
 */
export declare class Tween {
    private startValue;
    private endValue;
    private duration;
    private startTime;
    private easingFunction;
    private onUpdate?;
    private onComplete?;
    private isComplete;
    constructor(startValue: number, endValue: number, duration: number, easingFunction?: (t: number) => number);
    update(): number;
    onUpdateCallback(callback: (value: number) => void): Tween;
    onCompleteCallback(callback: () => void): Tween;
    complete(): boolean;
}
/**
 * 범위 내 랜덤 정수
 */
export declare function randomInt(min: number, max: number): number;
/**
 * 범위 내 랜덤 실수
 */
export declare function randomFloat(min: number, max: number): number;
/**
 * 랜덤 각도 (라디안)
 */
export declare function randomAngle(): number;
/**
 * 단위원 위의 랜덤 벡터
 */
export declare function randomUnitVector(): Vector2D;
/**
 * 배열에서 랜덤 요소 선택
 */
export declare function randomChoice<T>(array: T[]): T;
/**
 * 가중치 기반 랜덤 선택
 */
export declare function weightedRandomChoice<T>(items: T[], weights: number[]): T;
/**
 * RGB를 HEX로 변환
 */
export declare function rgbToHex(r: number, g: number, b: number): string;
/**
 * HEX를 RGB로 변환
 */
export declare function hexToRgb(hex: string): {
    r: number;
    g: number;
    b: number;
} | null;
/**
 * 색상 보간
 */
export declare function lerpColor(startColor: {
    r: number;
    g: number;
    b: number;
}, endColor: {
    r: number;
    g: number;
    b: number;
}, t: number): {
    r: number;
    g: number;
    b: number;
};
/**
 * 간단한 1D 노이즈 함수 (Perlin noise 기반)
 */
export declare function noise1D(x: number): number;
/**
 * 2D 노이즈 함수
 */
export declare function noise2D(x: number, y: number): number;
export declare const MathUtils: {
    clamp: typeof clamp;
    lerp: typeof lerp;
    mapRange: typeof mapRange;
    degToRad: typeof degToRad;
    radToDeg: typeof radToDeg;
    normalizeAngle: typeof normalizeAngle;
    approximately: typeof approximately;
    vec2: typeof vec2;
    vec3: typeof vec3;
    vectorAdd: typeof vectorAdd;
    vectorSubtract: typeof vectorSubtract;
    vectorMultiply: typeof vectorMultiply;
    vectorDivide: typeof vectorDivide;
    vectorDot: typeof vectorDot;
    vectorCross: typeof vectorCross;
    vectorMagnitude: typeof vectorMagnitude;
    vectorMagnitudeSquared: typeof vectorMagnitudeSquared;
    vectorNormalize: typeof vectorNormalize;
    vectorDistance: typeof vectorDistance;
    vectorDistanceSquared: typeof vectorDistanceSquared;
    vectorRotate: typeof vectorRotate;
    vectorLerp: typeof vectorLerp;
    vectorReflect: typeof vectorReflect;
    pointInCircle: typeof pointInCircle;
    pointInRectangle: typeof pointInRectangle;
    circleCircleCollision: typeof circleCircleCollision;
    circleRectangleCollision: typeof circleRectangleCollision;
    rectangleRectangleCollision: typeof rectangleRectangleCollision;
    lineLineIntersection: typeof lineLineIntersection;
    elasticCollision: typeof elasticCollision;
    projectileMotion: typeof projectileMotion;
    springForce: typeof springForce;
    Easing: {
        linear: (t: number) => number;
        easeInQuad: (t: number) => number;
        easeOutQuad: (t: number) => number;
        easeInOutQuad: (t: number) => number;
        easeInCubic: (t: number) => number;
        easeOutCubic: (t: number) => number;
        easeInOutCubic: (t: number) => number;
        easeInSine: (t: number) => number;
        easeOutSine: (t: number) => number;
        easeInOutSine: (t: number) => number;
        easeInElastic: (t: number) => number;
        easeOutElastic: (t: number) => number;
        easeInBounce: (t: number) => number;
        easeOutBounce: (t: number) => number;
    };
    Tween: typeof Tween;
    randomInt: typeof randomInt;
    randomFloat: typeof randomFloat;
    randomAngle: typeof randomAngle;
    randomUnitVector: typeof randomUnitVector;
    randomChoice: typeof randomChoice;
    weightedRandomChoice: typeof weightedRandomChoice;
    rgbToHex: typeof rgbToHex;
    hexToRgb: typeof hexToRgb;
    lerpColor: typeof lerpColor;
    noise1D: typeof noise1D;
    noise2D: typeof noise2D;
};
export default MathUtils;
//# sourceMappingURL=mathUtils.d.ts.map