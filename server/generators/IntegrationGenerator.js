/**
 * 🔗 IntegrationGenerator v1.0
 *
 * Stage 3: 통합 생성기
 * - Stage 1 (구조) + Stage 2 (로직) 통합
 * - 최종 HTML 파일 생성
 *
 * ✅ 구조와 로직을 완벽하게 결합
 */

class IntegrationGenerator {
    constructor(config) {
        this.config = config;
    }

    /**
     * 구조 + 로직 통합
     */
    async integrate(structureHtml, logicCode) {
        console.log('🔗 Stage 3: 구조 + 로직 통합 시작...');

        try {
            // HTML 파싱
            const finalHtml = this.mergeHtmlAndLogic(structureHtml, logicCode);

            console.log('✅ Stage 3: 통합 완료');
            return {
                success: true,
                html: finalHtml,
                stage: 'integration'
            };
        } catch (error) {
            console.error('❌ Stage 3 실패:', error.message);
            return {
                success: false,
                error: error.message,
                stage: 'integration'
            };
        }
    }

    /**
     * HTML과 로직 병합
     */
    mergeHtmlAndLogic(structureHtml, logicCode) {
        // Stage 1 HTML에서 JavaScript 섹션 찾기
        const scriptStartMarker = '// 게임 상수 (Stage 2에서 수정 가능)';
        const scriptEndMarker = '// 게임 루프 시작 (Stage 2에서 실제 로직 추가)';

        const scriptStart = structureHtml.indexOf(scriptStartMarker);
        const scriptEnd = structureHtml.indexOf(scriptEndMarker);

        if (scriptStart === -1 || scriptEnd === -1) {
            throw new Error('HTML 구조에서 JavaScript 섹션을 찾을 수 없습니다');
        }

        // 빈 함수들 제거하고 Stage 2 로직으로 교체
        const before = structureHtml.substring(0, scriptStart);
        const after = structureHtml.substring(scriptEnd);

        // 최종 HTML 조립
        const finalHtml = `${before}${logicCode}\n\n        ${after}`;

        return finalHtml;
    }

    /**
     * 간단한 검증
     */
    validate(html) {
        const checks = {
            hasSessionSDK: html.includes('new SessionSDK'),
            hasGameState: html.includes('gameState'),
            hasInitGame: html.includes('function initGame()'),
            hasProcessSensorData: html.includes('function processSensorData'),
            hasUpdate: html.includes('function update()'),
            hasRender: html.includes('function render()'),
            hasGameLoop: html.includes('gameLoop()')
        };

        const passed = Object.values(checks).filter(v => v).length;
        const total = Object.keys(checks).length;

        return {
            passed,
            total,
            success: passed === total,
            checks
        };
    }
}

module.exports = IntegrationGenerator;
