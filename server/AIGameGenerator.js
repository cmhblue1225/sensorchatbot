/**
 * 🎮 AIGameGenerator v1.0
 * 
 * AI 기반 게임 자동 생성 통합 관리자
 * - 자연어 요구사항 분석
 * - 템플릿 기반 게임 코드 생성
 * - Claude API 연동으로 고도화된 게임 로직 생성
 */

const GameRequirementParser = require('./GameRequirementParser');
const GameTemplateEngine = require('./GameTemplateEngine');
const AIAssistant = require('./AIAssistant');

class AIGameGenerator {
    constructor() {
        this.parser = new GameRequirementParser();
        this.templateEngine = new GameTemplateEngine();
        this.aiAssistant = new AIAssistant();
        
        this.generationHistory = [];
        this.isInitialized = false;
    }

    /**
     * AI 게임 생성기 초기화
     */
    async initialize() {
        try {
            console.log('🎮 AI 게임 생성기 초기화 중...');
            
            // AI Assistant 초기화 대기
            if (!this.aiAssistant.llm) {
                console.log('⏳ AI Assistant 초기화 대기 중...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            this.isInitialized = true;
            console.log('✅ AI 게임 생성기 초기화 완료');
            
        } catch (error) {
            console.error('❌ AI 게임 생성기 초기화 실패:', error);
            throw error;
        }
    }

    /**
     * 자연어로부터 완전한 게임 생성
     */
    async generateGame(userInput, options = {}) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            console.log(`🚀 게임 생성 시작: "${userInput}"`);
            
            const generationId = `game_${Date.now()}`;
            const startTime = Date.now();

            // 1단계: 자연어 요구사항 파싱
            console.log('📝 1단계: 자연어 요구사항 분석 중...');
            const gameSpec = await this.parser.parseRequirement(userInput);
            
            // 2단계: AI 어시스턴트를 통한 요구사항 고도화
            console.log('🧠 2단계: AI 기반 요구사항 고도화 중...');
            const enhancedSpec = await this.enhanceGameSpec(gameSpec, userInput);
            
            // 3단계: 기본 템플릿 생성
            console.log('🏗️ 3단계: 기본 게임 템플릿 생성 중...');
            const baseGameCode = await this.templateEngine.generateGame(enhancedSpec);
            
            // 4단계: AI 기반 게임 로직 개선
            console.log('⚡ 4단계: AI 기반 게임 로직 개선 중...');
            const finalGameCode = await this.enhanceGameLogic(baseGameCode, enhancedSpec, userInput);
            
            // 5단계: 게임 코드 검증
            console.log('🔍 5단계: 게임 코드 검증 중...');
            const validation = this.validateGameCode(finalGameCode);
            
            const endTime = Date.now();
            const generationTime = endTime - startTime;

            // 생성 결과 구성
            const result = {
                success: true,
                generationId: generationId,
                gameSpec: enhancedSpec,
                gameCode: finalGameCode,
                validation: validation,
                metadata: {
                    originalInput: userInput,
                    generationTime: generationTime,
                    timestamp: new Date().toISOString(),
                    version: '1.0'
                }
            };

            // 생성 이력 저장
            this.generationHistory.push({
                id: generationId,
                input: userInput,
                result: result,
                timestamp: new Date().toISOString()
            });

            console.log(`✅ 게임 생성 완료! (${generationTime}ms)`);
            return result;

        } catch (error) {
            console.error('❌ 게임 생성 실패:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * AI 어시스턴트를 통한 게임 사양 고도화
     */
    async enhanceGameSpec(gameSpec, originalInput) {
        try {
            const enhancementPrompt = `다음 자동 파싱된 게임 사양을 보완하고 개선해주세요:

원본 요청: "${originalInput}"

파싱된 사양:
- 게임 타입: ${gameSpec.gameType}
- 장르: ${gameSpec.genre}
- 센서 메커니즘: ${gameSpec.sensorMechanics.join(', ')}
- 게임 오브젝트: ${gameSpec.gameObjects.join(', ')}
- 목표: ${gameSpec.objective}
- 규칙: ${gameSpec.rules.join(', ')}
- 난이도: ${gameSpec.difficulty}

다음 항목들을 JSON 형태로 보완해주세요:
1. 더 구체적인 게임 메커니즘
2. 추가적인 게임 규칙
3. 시각적 요소 및 UI 개선사항
4. 게임플레이 밸런싱 요소
5. 사용자 경험 개선점

JSON 형태로만 답변해주세요.`;

            const aiResponse = await this.aiAssistant.query(enhancementPrompt);
            
            if (aiResponse.success) {
                try {
                    // AI 응답에서 JSON 추출 시도
                    const jsonMatch = aiResponse.answer.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const enhancement = JSON.parse(jsonMatch[0]);
                        
                        // 원본 사양에 AI 개선사항 병합
                        return {
                            ...gameSpec,
                            aiEnhancements: enhancement,
                            enhanced: true,
                            enhancementTimestamp: new Date().toISOString()
                        };
                    }
                } catch (parseError) {
                    console.log('⚠️ AI 응답 JSON 파싱 실패, 원본 사양 사용');
                }
            }
            
            // AI 개선 실패 시 원본 사양 반환
            return gameSpec;

        } catch (error) {
            console.error('❌ 게임 사양 고도화 실패:', error);
            return gameSpec;
        }
    }

    /**
     * AI 기반 게임 로직 개선
     */
    async enhanceGameLogic(baseGameCode, gameSpec, originalInput) {
        try {
            const enhancePrompt = `다음 기본 게임 코드를 분석하고 개선해주세요:

원본 요청: "${originalInput}"
게임 타입: ${gameSpec.gameType}
장르: ${gameSpec.genre}

기본 게임 코드:
${baseGameCode.substring(0, 2000)}...

개선 요청사항:
1. 게임 로직의 완성도 향상
2. 센서 반응성 최적화
3. 시각적 효과 및 애니메이션 개선
4. 게임 밸런스 조정
5. 사용자 인터페이스 개선

완전한 HTML 파일 형태로 개선된 코드를 제공해주세요.
기존 SessionSDK 통합 코드는 반드시 유지해야 합니다.`;

            const aiResponse = await this.aiAssistant.generateCode(enhancePrompt);
            
            if (aiResponse.success && aiResponse.answer) {
                // AI가 개선한 코드에서 HTML 추출
                const htmlMatch = aiResponse.answer.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
                if (htmlMatch) {
                    console.log('✨ AI 기반 게임 로직 개선 완료');
                    return htmlMatch[0];
                }
            }
            
            console.log('⚠️ AI 개선 실패, 기본 템플릿 사용');
            return baseGameCode;

        } catch (error) {
            console.error('❌ AI 게임 로직 개선 실패:', error);
            return baseGameCode;
        }
    }

    /**
     * 게임 코드 검증
     */
    validateGameCode(gameCode) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            score: 100
        };

        try {
            // 1. 기본 HTML 구조 검증
            if (!gameCode.includes('<!DOCTYPE html>')) {
                validation.errors.push('DOCTYPE 선언이 없습니다');
                validation.score -= 10;
            }

            if (!gameCode.includes('<html>') || !gameCode.includes('</html>')) {
                validation.errors.push('HTML 태그가 완전하지 않습니다');
                validation.score -= 15;
            }

            // 2. SessionSDK 통합 검증
            if (!gameCode.includes('SessionSDK')) {
                validation.errors.push('SessionSDK가 포함되지 않았습니다');
                validation.score -= 25;
            }

            if (!gameCode.includes('event.detail || event')) {
                validation.warnings.push('CustomEvent 처리 패턴이 누락될 수 있습니다');
                validation.score -= 5;
            }

            // 3. 필수 게임 요소 검증
            if (!gameCode.includes('canvas') && !gameCode.includes('Canvas')) {
                validation.warnings.push('Canvas 요소가 감지되지 않습니다');
                validation.score -= 10;
            }

            if (!gameCode.includes('sensor-data')) {
                validation.warnings.push('센서 데이터 처리가 감지되지 않습니다');
                validation.score -= 10;
            }

            // 4. CSS 스타일 검증
            if (!gameCode.includes('<style>') && !gameCode.includes('.css')) {
                validation.warnings.push('스타일이 포함되지 않았습니다');
                validation.score -= 5;
            }

            // 5. JavaScript 코드 검증
            if (!gameCode.includes('function') && !gameCode.includes('=>')) {
                validation.warnings.push('JavaScript 함수가 감지되지 않습니다');
                validation.score -= 15;
            }

            // 유효성 결정
            validation.isValid = validation.errors.length === 0;
            validation.score = Math.max(validation.score, 0);

        } catch (error) {
            validation.errors.push(`검증 중 오류 발생: ${error.message}`);
            validation.isValid = false;
            validation.score = 0;
        }

        return validation;
    }

    /**
     * 게임 아이디어 제안
     */
    async suggestGameIdeas(category = 'all', count = 5) {
        try {
            const ideaPrompt = `Sensor Game Hub v6.0을 위한 창의적인 게임 아이디어를 ${count}개 제안해주세요.

카테고리: ${category}

각 아이디어는 다음 형식으로 제공해주세요:
{
  "title": "게임 제목",
  "description": "게임 설명 (1-2문장)",
  "gameType": "solo/dual/multi",
  "genre": "platformer/puzzle/racing/arcade/action",
  "sensorMechanics": ["센서 활용 방식"],
  "uniqueFeature": "독특한 특징",
  "difficulty": "easy/medium/hard"
}

JSON 배열 형태로만 답변해주세요.`;

            const aiResponse = await this.aiAssistant.query(ideaPrompt);
            
            if (aiResponse.success) {
                try {
                    const jsonMatch = aiResponse.answer.match(/\[[\s\S]*\]/);
                    if (jsonMatch) {
                        const ideas = JSON.parse(jsonMatch[0]);
                        return {
                            success: true,
                            ideas: ideas,
                            category: category,
                            count: ideas.length,
                            timestamp: new Date().toISOString()
                        };
                    }
                } catch (parseError) {
                    console.error('❌ 아이디어 JSON 파싱 실패:', parseError);
                }
            }
            
            return {
                success: false,
                error: '아이디어 생성에 실패했습니다',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ 게임 아이디어 제안 실패:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 생성 이력 조회
     */
    getGenerationHistory(limit = 10) {
        return {
            success: true,
            history: this.generationHistory.slice(-limit).reverse(),
            total: this.generationHistory.length,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 특정 게임 재생성
     */
    async regenerateGame(generationId, modifications = {}) {
        try {
            const originalGeneration = this.generationHistory.find(h => h.id === generationId);
            
            if (!originalGeneration) {
                throw new Error('생성 이력을 찾을 수 없습니다');
            }

            console.log(`🔄 게임 재생성: ${generationId}`);
            
            // 수정사항이 있으면 원본 입력에 반영
            let modifiedInput = originalGeneration.input;
            if (modifications.additionalRequirements) {
                modifiedInput += ` ${modifications.additionalRequirements}`;
            }

            // 재생성 실행
            const result = await this.generateGame(modifiedInput, {
                isRegeneration: true,
                originalId: generationId,
                modifications: modifications
            });

            if (result.success) {
                result.metadata.isRegeneration = true;
                result.metadata.originalId = generationId;
                result.metadata.modifications = modifications;
            }

            return result;

        } catch (error) {
            console.error('❌ 게임 재생성 실패:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 생성기 상태 확인
     */
    async getStatus() {
        try {
            const aiStatus = await this.aiAssistant.healthCheck();
            
            return {
                success: true,
                status: this.isInitialized ? 'ready' : 'initializing',
                components: {
                    parser: 'ready',
                    templateEngine: 'ready',
                    aiAssistant: aiStatus.status
                },
                statistics: {
                    totalGenerations: this.generationHistory.length,
                    successfulGenerations: this.generationHistory.filter(h => h.result.success).length,
                    averageGenerationTime: this.calculateAverageGenerationTime()
                },
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                success: false,
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 평균 생성 시간 계산
     */
    calculateAverageGenerationTime() {
        if (this.generationHistory.length === 0) return 0;
        
        const totalTime = this.generationHistory
            .filter(h => h.result.success && h.result.metadata.generationTime)
            .reduce((sum, h) => sum + h.result.metadata.generationTime, 0);
        
        const count = this.generationHistory.filter(h => h.result.success).length;
        
        return count > 0 ? Math.round(totalTime / count) : 0;
    }
}

module.exports = AIGameGenerator;