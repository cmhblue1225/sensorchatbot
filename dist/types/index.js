/**
 * 🎮 Sensor Game Hub v6.0 - TypeScript Definitions
 *
 * 전체 프로젝트에서 사용되는 타입 정의
 */
// ===== 타입 가드 함수들 =====
export function isSensorData(obj) {
    return obj &&
        typeof obj.sensorId === 'string' &&
        typeof obj.gameType === 'string' &&
        obj.data &&
        obj.data.orientation &&
        typeof obj.data.orientation.alpha === 'number';
}
export function isGameSession(obj) {
    return obj &&
        typeof obj.id === 'string' &&
        typeof obj.code === 'string' &&
        typeof obj.gameId === 'string';
}
export function isGameError(obj) {
    return obj instanceof Error &&
        'code' in obj &&
        'category' in obj;
}
//# sourceMappingURL=index.js.map