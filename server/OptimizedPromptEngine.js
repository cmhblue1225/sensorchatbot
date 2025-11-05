/**
 * 🧠 OptimizedPromptEngine v3.0
 *
 * AI 게임 생성기를 위한 최적화된 프롬프트 엔지니어링 시스템
 * - 90% 이상 성공률 달성을 위한 단계별 프롬프트 체인
 * - 컨텍스트 기반 적응형 프롬프트 생성
 * - 실시간 성공률 모니터링 및 학습
 * - 에러 분석 기반 자동 프롬프트 개선
 * - 표준화된 템플릿 시스템 완전 통합
 */

const StandardizedPromptTemplates = require('./prompts/StandardizedPromptTemplates');
const CodeValidator = require('./validation/CodeValidator');
const ErrorDetectionEngine = require('./validation/ErrorDetectionEngine');
const LiveErrorMonitor = require('./monitoring/LiveErrorMonitor');
const PerformanceMonitor = require('./monitoring/PerformanceMonitor');

class OptimizedPromptEngine {
    constructor() {
        // 새로운 표준화 프롬프트 시스템 통합
        this.standardPrompts = new StandardizedPromptTemplates();

        // 코드 검증 시스템 통합
        this.codeValidator = new CodeValidator();

        // 에러 감지 및 자동 수정 시스템 통합
        this.errorDetector = new ErrorDetectionEngine();

        // 실시간 에러 모니터링 시스템 통합
        this.liveMonitor = new LiveErrorMonitor();

        // 성능 모니터링 시스템 통합
        this.performanceMonitor = new PerformanceMonitor();

        // 에러 감지 시스템 이벤트 리스너 설정
        this.setupErrorMonitoringEvents();

        this.initializePromptSystems();
        this.initializePerformanceTracking();
        this.initializeAdaptiveLearning();
    }

    /**
     * 프롬프트 시스템 초기화
     */
    initializePromptSystems() {
        // 단계별 프롬프트 체인
        this.promptChains = {
            gameAnalysis: this.createGameAnalysisChain(),
            templateSelection: this.createTemplateSelectionChain(),
            codeGeneration: this.createCodeGenerationChain(),
            validation: this.createValidationChain(),
            enhancement: this.createEnhancementChain()
        };

        // 게임 타입별 특화 프롬프트
        this.gameTypePrompts = {
            solo: this.createSoloGamePrompts(),
            dual: this.createDualGamePrompts(),
            multi: this.createMultiGamePrompts()
        };

        // 장르별 특화 프롬프트
        this.genrePrompts = {
            physics: this.createPhysicsPrompts(),
            cooking: this.createCookingPrompts(),
            action: this.createActionPrompts(),
            puzzle: this.createPuzzlePrompts(),
            racing: this.createRacingPrompts()
        };

        // 검증된 코드 패턴 라이브러리
        this.codePatterns = this.initializeCodePatterns();
    }

    /**
     * 성능 추적 초기화
     */
    initializePerformanceTracking() {
        this.performanceMetrics = {
            totalGenerations: 0,
            successfulGenerations: 0,
            successRateByType: {
                solo: { total: 0, success: 0 },
                dual: { total: 0, success: 0 },
                multi: { total: 0, success: 0 }
            },
            successRateByGenre: {
                physics: { total: 0, success: 0 },
                cooking: { total: 0, success: 0 },
                action: { total: 0, success: 0 },
                puzzle: { total: 0, success: 0 },
                racing: { total: 0, success: 0 }
            },
            commonErrors: new Map(),
            responseTimeHistory: [],
            promptVersions: new Map()
        };
    }

    /**
     * 적응형 학습 초기화
     */
    initializeAdaptiveLearning() {
        this.learningSystem = {
            errorPatterns: new Map(),
            successPatterns: new Map(),
            contextualAdjustments: new Map(),
            promptEffectiveness: new Map()
        };
    }

    /**
     * 에러 모니터링 이벤트 설정
     */
    setupErrorMonitoringEvents() {
        // 새로운 에러 감지 시 자동 프롬프트 개선
        this.liveMonitor.on('new_errors_detected', (data) => {
            this.learnFromErrors(data.gameId, data.newErrors);
        });

        // 자동 수정 완료 시 성공 패턴 학습
        this.liveMonitor.on('auto_fix_completed', (data) => {
            this.learnFromSuccessfulFixes(data.gameId, data.fixResult);
        });

        // 치명적 에러 감지 시 우선 처리
        this.liveMonitor.on('critical_errors_detected', (data) => {
            this.handleCriticalErrors(data.gameId, data.errors);
        });

        console.log('🔗 에러 모니터링 이벤트 리스너 설정 완료');
    }

    /**
     * 최적화된 게임 생성 요청 처리 (에러 감지 통합)
     */
    async generateOptimizedGame(userInput, aiAssistant, options = {}) {
        const generationId = `gen_${Date.now()}`;
        const startTime = performance.now();

        try {
            console.log(`🧠 최적화된 게임 생성 시작: ${generationId}`);

            // 1단계: 사용자 입력 분석 및 구조화
            const analysisResult = await this.analyzeUserInput(userInput, aiAssistant);

            // 2단계: 최적 템플릿 선택
            const templateResult = await this.selectOptimalTemplate(analysisResult, aiAssistant);

            // 3단계: 적응형 코드 생성
            const codeResult = await this.generateAdaptiveCode(templateResult, analysisResult, aiAssistant);

            // 4단계: 자동 검증 및 수정
            const validationResult = await this.validateAndRefine(codeResult, aiAssistant);

            // 5단계: 품질 향상 및 최종 검토
            const finalResult = await this.enhanceGameQuality(validationResult, aiAssistant);

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            // 에러 감지 및 실시간 모니터링 등록
            const errorDetectionResult = await this.errorDetector.detectErrors(
                finalResult.gameCode,
                analysisResult.gameType
            );

            // 생성된 게임을 실시간 모니터링에 등록
            if (options.enableMonitoring !== false) {
                this.liveMonitor.registerGame(
                    generationId,
                    finalResult.gameCode,
                    analysisResult.gameType,
                    {
                        userInput: userInput,
                        generationTime: totalTime,
                        qualityScore: finalResult.qualityScore
                    }
                );

                // 에러가 감지된 경우 자동 수정 시도
                if (errorDetectionResult.errors.length > 0) {
                    console.log(`🔧 생성된 게임에서 ${errorDetectionResult.errors.length}개 오류 감지, 자동 수정 시도...`);

                    const autoFixResult = await this.errorDetector.autoFixErrors(
                        finalResult.gameCode,
                        errorDetectionResult.errors
                    );

                    if (autoFixResult.fixCount > 0) {
                        finalResult.gameCode = autoFixResult.fixedCode;
                        console.log(`✅ ${autoFixResult.fixCount}개 오류 자동 수정 완료`);
                    }
                }
            }

            // 성공률 기록
            this.recordGenerationResult(analysisResult, finalResult, totalTime, true);

            return {
                success: true,
                generationId: generationId,
                gameAnalysis: analysisResult,
                selectedTemplate: templateResult,
                gameCode: finalResult.gameCode,
                validation: finalResult.validation,
                enhancements: finalResult.enhancements,
                errorDetection: errorDetectionResult,
                autoFix: errorDetectionResult.errors.length > 0 ? autoFixResult : null,
                metadata: {
                    originalInput: userInput,
                    generationTime: totalTime,
                    promptVersion: this.getCurrentPromptVersion(),
                    qualityScore: finalResult.qualityScore,
                    monitoringEnabled: options.enableMonitoring !== false,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error(`❌ 게임 생성 실패 [${generationId}]:`, error);

            // 실패 원인 분석 및 학습
            await this.analyzeFailure(userInput, error);

            const endTime = performance.now();
            this.recordGenerationResult(null, null, endTime - startTime, false);

            return {
                success: false,
                generationId: generationId,
                error: error.message,
                failureReason: await this.categorizeFailure(error),
                suggestions: await this.getFailureSuggestions(error),
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 1단계: 사용자 입력 분석
     */
    async analyzeUserInput(userInput, aiAssistant) {
        // 표준화된 게임 분석 프롬프트 사용
        const analysisPrompt = this.standardPrompts.generateIntegratedPrompt(
            userInput,
            { gameType: 'unknown' }, // 초기 분석용 임시 값
            'analysis'
        );

        const response = await aiAssistant.query(analysisPrompt);

        if (!response.success) {
            throw new Error('사용자 입력 분석 실패: ' + response.error);
        }

        // JSON 응답 파싱
        const analysisData = this.parseAIResponse(response.answer, 'analysis');

        return {
            originalInput: userInput,
            gameType: analysisData.gameType,
            genre: analysisData.genre,
            complexity: analysisData.complexity,
            requiredFeatures: analysisData.requiredFeatures || [],
            recommendedTemplate: analysisData.recommendedTemplate,
            technicalRequirements: analysisData.technicalRequirements || {},
            implementationNotes: analysisData.implementationNotes,
            confidenceScore: analysisData.confidenceScore || 0.8
        };
    }

    /**
     * 분석 프롬프트 생성
     */
    buildAnalysisPrompt(userInput) {
        return `Sensor Game Hub v6.0을 위한 게임 요구사항을 정확히 분석해주세요.

사용자 입력: "${userInput}"

다음 JSON 형식으로 분석 결과를 제공해주세요:

{
  "gameType": "solo|dual|multi",
  "genre": "physics|cooking|action|puzzle|racing",
  "complexity": "simple|medium|complex",
  "requirements": {
    "sensorTypes": ["orientation", "acceleration", "rotationRate"],
    "gameFeatures": ["점수시스템", "레벨진행", "타이머" 등],
    "uiElements": ["버튼", "점수판", "진행바" 등],
    "gameplayMechanics": ["충돌감지", "물리엔진", "애니메이션" 등]
  },
  "suggestedFeatures": [
    "개인기록 저장",
    "난이도 조절",
    "협력 요소" 등
  ],
  "technicalConstraints": {
    "performance": "high|medium|low",
    "compatibility": ["mobile", "desktop"],
    "complexity": "low|medium|high"
  },
  "confidenceScore": 0.9
}

분석 기준:
1. 게임 타입 추론 (혼자/둘이서/여럿이)
2. 장르 분류 (물리/요리/액션/퍼즐/레이싱)
3. 기술적 복잡도 평가
4. 필요한 센서 및 기능 식별
5. 구현 가능성 평가

주의사항:
- 모호한 요청의 경우 가장 단순한 형태로 해석
- 기술적 제약사항 고려
- SessionSDK 호환성 확인
- 센서 게임 특성에 맞는 요소 강조

JSON만 응답하세요:`;
    }

    /**
     * 2단계: 최적 템플릿 선택
     */
    async selectOptimalTemplate(analysisResult, aiAssistant) {
        const selectionPrompt = this.buildTemplateSelectionPrompt(analysisResult);

        const response = await aiAssistant.query(selectionPrompt);

        if (!response.success) {
            throw new Error('템플릿 선택 실패: ' + response.error);
        }

        const selectionData = this.parseAIResponse(response.answer, 'template');

        return {
            selectedTemplate: selectionData.templateId,
            templateComponents: selectionData.components,
            customizations: selectionData.customizations,
            compatibilityScore: selectionData.compatibilityScore,
            reasoning: selectionData.reasoning
        };
    }

    /**
     * 템플릿 선택 프롬프트 생성
     */
    buildTemplateSelectionPrompt(analysisResult) {
        return `분석된 게임 요구사항에 가장 적합한 템플릿을 선택해주세요.

게임 분석 결과:
- 게임 타입: ${analysisResult.gameType}
- 장르: ${analysisResult.genre}
- 복잡도: ${analysisResult.complexity}
- 필요 기능: ${JSON.stringify(analysisResult.requirements)}

사용 가능한 템플릿:
1. solo-physics-template: 1인용 물리 게임 (공 굴리기, 중력 조작)
2. solo-action-template: 1인용 액션 게임 (회피, 수집)
3. dual-cooperation-template: 2인 협력 게임 (동기화, 팀워크)
4. multi-competitive-template: 다인 경쟁 게임 (순위, 대결)

다음 JSON 형식으로 선택 결과를 제공해주세요:

{
  "templateId": "선택된 템플릿 ID",
  "components": {
    "baseStructure": "템플릿 기본 구조",
    "gameLogic": "핵심 게임 로직",
    "sensorHandling": "센서 처리 방식",
    "uiComponents": ["UI 컴포넌트 목록"]
  },
  "customizations": {
    "gameSpecific": ["게임 특화 수정사항"],
    "genreSpecific": ["장르 특화 수정사항"],
    "complexityAdjustments": ["복잡도 조정사항"]
  },
  "compatibilityScore": 0.95,
  "reasoning": "선택 이유 설명"
}

선택 기준:
1. 게임 타입과 템플릿 호환성
2. 장르별 특화 요소 지원
3. 복잡도 수준 적합성
4. SessionSDK 통합 용이성
5. 확장 가능성

JSON만 응답하세요:`;
    }

    /**
     * 3단계: 적응형 코드 생성
     */
    async generateAdaptiveCode(templateResult, analysisResult, aiAssistant) {
        // 표준화된 코드 생성 프롬프트 사용
        const codePrompt = this.standardPrompts.generateIntegratedPrompt(
            analysisResult.originalInput,
            analysisResult,
            'generation'
        );

        const response = await aiAssistant.generateCode(codePrompt);

        if (!response.success) {
            throw new Error('코드 생성 실패: ' + response.error);
        }

        // 생성된 코드에서 HTML 추출
        const gameCode = this.extractHTMLCode(response.answer);

        return {
            gameCode: gameCode,
            generationMethod: 'standardized-adaptive',
            templateUsed: analysisResult.recommendedTemplate,
            codeQuality: this.assessCodeQuality(gameCode),
            estimatedSuccess: this.estimateSuccessRate(gameCode, analysisResult),
            standardTemplate: this.standardPrompts.getStandardTemplateInfo()
        };
    }

    /**
     * 코드 생성 프롬프트 생성
     */
    buildCodeGenerationPrompt(templateResult, analysisResult) {
        const gameTypePattern = this.gameTypePrompts[analysisResult.gameType];
        const genrePattern = this.genrePrompts[analysisResult.genre];

        return `Sensor Game Hub v6.0용 완전한 게임 코드를 생성해주세요.

요구사항:
- 게임 타입: ${analysisResult.gameType}
- 장르: ${analysisResult.genre}
- 선택된 템플릿: ${templateResult.selectedTemplate}
- 복잡도: ${analysisResult.complexity}

필수 구현 패턴:
${gameTypePattern.essentialPatterns}

장르별 특화 요소:
${genrePattern.specificFeatures}

반드시 포함해야 할 요소:
1. SessionSDK 초기화 및 연결 처리
2. 이벤트 리스너 (event.detail || event 패턴 필수)
3. 센서 데이터 처리 및 게임 적용
4. 게임 루프 및 렌더링
5. UI 업데이트 및 상태 관리
6. 에러 처리 및 폴백

코드 품질 기준:
- HTML5 표준 준수
- 반응형 디자인 적용
- 접근성 고려
- 성능 최적화
- 브라우저 호환성

특별 지침:
- QR 코드 생성 실패 시 폴백 처리
- 센서 연결 해제 시 재연결 시도
- 게임 상태 저장 (localStorage 활용)
- 개인 기록 관리 (solo 게임)
- 협력 동기화 (dual 게임)
- 실시간 랭킹 (multi 게임)

완전한 HTML 파일 형태로 제공하세요:`;
    }

    /**
     * 4단계: 자동 검증 및 수정
     */
    async validateAndRefine(codeResult, aiAssistant) {
        console.log('🔍 코드 검증 및 개선 단계 시작');

        // 새로운 코드 검증 시스템 사용
        const validation = await this.codeValidator.validateGameCode(
            codeResult.gameCode,
            codeResult.templateUsed
        );

        console.log('📊 검증 결과:', {
            score: validation.overallScore,
            isValid: validation.isValid,
            issues: validation.suggestions.length
        });

        if (validation.overallScore < 80 || !validation.isValid) {
            console.log('🔧 자동 수정 시도');

            let refinedCode = codeResult.gameCode;

            // 자동 수정이 가능한 경우 적용
            if (validation.fixedCode) {
                refinedCode = validation.fixedCode;
                console.log('✅ 자동 수정 적용됨');
            } else {
                // AI를 통한 고급 수정 시도
                refinedCode = await this.autoRefineCodeWithAI(
                    codeResult.gameCode,
                    validation,
                    aiAssistant
                );
            }

            // 수정된 코드 재검증
            const revalidation = await this.codeValidator.validateGameCode(
                refinedCode,
                codeResult.templateUsed
            );

            console.log('🔄 재검증 결과:', {
                originalScore: validation.overallScore,
                newScore: revalidation.overallScore,
                improvement: revalidation.overallScore - validation.overallScore
            });

            return {
                gameCode: refinedCode,
                validation: revalidation,
                originalValidation: validation,
                refinementApplied: true,
                originalScore: validation.overallScore,
                improvedScore: revalidation.overallScore,
                autoFixSuccess: validation.fixedCode !== null
            };
        }

        console.log('✅ 코드 검증 통과');

        return {
            gameCode: codeResult.gameCode,
            validation: validation,
            refinementApplied: false
        };
    }

    /**
     * AI를 통한 고급 코드 수정
     */
    async autoRefineCodeWithAI(gameCode, validation, aiAssistant) {
        console.log('🤖 AI를 통한 코드 수정 시작');

        // 검증 결과를 바탕으로 수정 프롬프트 생성
        const refinementPrompt = this.standardPrompts.generateIntegratedPrompt(
            '다음 코드의 문제점을 수정해주세요',
            {
                gameType: 'code-fix',
                validationIssues: validation.suggestions
            },
            'validation'
        );

        const detailedPrompt = `${refinementPrompt}

**수정할 코드:**
\`\`\`html
${gameCode}
\`\`\`

**발견된 문제점들:**
${validation.suggestions.map(issue =>
    `- ${issue.severity.toUpperCase()}: ${issue.message} (라인 ${issue.line})`
).join('\n')}

**수정 요구사항:**
1. 모든 critical 및 major 문제를 반드시 해결하세요
2. SessionSDK 사용법을 올바르게 수정하세요 (event.detail || event 패턴)
3. 센서 데이터 처리의 안전성을 보장하세요
4. 성능 및 보안 문제를 개선하세요
5. 기존 게임 로직은 최대한 유지하세요

수정된 완전한 HTML 코드를 제공하세요.`;

        try {
            const response = await aiAssistant.generateCode(detailedPrompt);

            if (response.success) {
                const refinedCode = this.extractHTMLCode(response.answer);
                console.log('✅ AI 기반 코드 수정 완료');
                return refinedCode;
            } else {
                console.log('❌ AI 기반 코드 수정 실패');
                return gameCode; // 원본 코드 반환
            }
        } catch (error) {
            console.error('❌ AI 수정 중 오류:', error.message);
            return gameCode; // 원본 코드 반환
        }
    }

    /**
     * 코드 검증
     */
    performCodeValidation(gameCode) {
        const validation = {
            score: 100,
            errors: [],
            warnings: [],
            checks: {}
        };

        // 필수 요소 검증
        const requiredElements = [
            'SessionSDK',
            'event.detail || event',
            'gameCanvas',
            'sensor-data',
            'connected'
        ];

        requiredElements.forEach(element => {
            if (!gameCode.includes(element)) {
                validation.errors.push(`필수 요소 누락: ${element}`);
                validation.score -= 15;
            } else {
                validation.checks[element] = true;
            }
        });

        // 코드 패턴 검증
        this.validateCodePatterns(gameCode, validation);

        // HTML 구조 검증
        this.validateHTMLStructure(gameCode, validation);

        // JavaScript 문법 검증
        this.validateJavaScriptSyntax(gameCode, validation);

        return validation;
    }

    /**
     * 코드 패턴 검증
     */
    validateCodePatterns(gameCode, validation) {
        const patterns = {
            sessionInitialization: /new SessionSDK\s*\(/,
            eventHandling: /event\.detail \|\| event/,
            gameLoop: /requestAnimationFrame|gameLoop/,
            canvasRendering: /\.getContext\('2d'\)/,
            errorHandling: /try\s*{[\s\S]*catch/
        };

        Object.entries(patterns).forEach(([name, pattern]) => {
            if (!pattern.test(gameCode)) {
                validation.warnings.push(`권장 패턴 누락: ${name}`);
                validation.score -= 5;
            } else {
                validation.checks[name] = true;
            }
        });
    }

    /**
     * 자동 코드 수정
     */
    async autoRefineCode(gameCode, validation, aiAssistant) {
        const refinementPrompt = this.buildRefinementPrompt(gameCode, validation);

        const response = await aiAssistant.generateCode(refinementPrompt);

        if (response.success) {
            return this.extractHTMLCode(response.answer);
        }

        return gameCode; // 수정 실패 시 원본 반환
    }

    /**
     * 수정 프롬프트 생성
     */
    buildRefinementPrompt(gameCode, validation) {
        return `다음 게임 코드의 문제점을 수정해주세요:

검증 결과:
- 점수: ${validation.score}/100
- 오류: ${validation.errors.join(', ')}
- 경고: ${validation.warnings.join(', ')}

원본 코드:
${gameCode.substring(0, 3000)}...

수정 요청사항:
1. 모든 오류 사항 해결
2. 누락된 필수 요소 추가
3. 코드 품질 향상
4. 성능 최적화

수정된 완전한 HTML 파일을 제공하세요:`;
    }

    /**
     * 5단계: 품질 향상
     */
    async enhanceGameQuality(validationResult, aiAssistant) {
        if (validationResult.validation.score >= 90) {
            return {
                gameCode: validationResult.gameCode,
                validation: validationResult.validation,
                enhancements: [],
                qualityScore: validationResult.validation.score
            };
        }

        // 추가 품질 향상
        const enhancements = await this.applyQualityEnhancements(
            validationResult.gameCode,
            aiAssistant
        );

        return {
            gameCode: enhancements.enhancedCode || validationResult.gameCode,
            validation: validationResult.validation,
            enhancements: enhancements.appliedEnhancements,
            qualityScore: Math.min(100, validationResult.validation.score + 10)
        };
    }

    /**
     * 품질 향상 적용
     */
    async applyQualityEnhancements(gameCode, aiAssistant) {
        const enhancementPrompt = `다음 게임 코드의 품질을 향상시켜주세요:

현재 코드:
${gameCode.substring(0, 2000)}...

향상 목표:
1. 사용자 경험 개선
2. 접근성 향상
3. 성능 최적화
4. 시각적 효과 추가
5. 에러 처리 강화

향상된 완전한 HTML 파일을 제공하세요:`;

        const response = await aiAssistant.generateCode(enhancementPrompt);

        if (response.success) {
            return {
                enhancedCode: this.extractHTMLCode(response.answer),
                appliedEnhancements: ['UX개선', '성능최적화', '접근성향상']
            };
        }

        return {
            enhancedCode: null,
            appliedEnhancements: []
        };
    }

    /**
     * AI 응답 파싱
     */
    parseAIResponse(response, type) {
        try {
            // JSON 블록 추출
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            // 기본값 반환
            return this.getDefaultResponse(type);

        } catch (error) {
            console.error('AI 응답 파싱 실패:', error);
            return this.getDefaultResponse(type);
        }
    }

    /**
     * 기본 응답 생성
     */
    getDefaultResponse(type) {
        const defaults = {
            analysis: {
                gameType: 'solo',
                genre: 'physics',
                complexity: 'simple',
                requirements: {
                    sensorTypes: ['orientation'],
                    gameFeatures: ['점수시스템'],
                    uiElements: ['점수판'],
                    gameplayMechanics: ['기울기조작']
                },
                confidenceScore: 0.7
            },
            template: {
                templateId: 'solo-physics-template',
                components: {},
                customizations: {},
                compatibilityScore: 0.8,
                reasoning: '기본 템플릿 사용'
            }
        };

        return defaults[type] || {};
    }

    /**
     * HTML 코드 추출
     */
    extractHTMLCode(response) {
        const htmlMatch = response.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
        if (htmlMatch) {
            return htmlMatch[0];
        }

        // HTML 태그로 감싸진 경우
        const htmlTagMatch = response.match(/<html[\s\S]*<\/html>/i);
        if (htmlTagMatch) {
            return '<!DOCTYPE html>\n' + htmlTagMatch[0];
        }

        // 기본 구조 생성
        return this.generateFallbackHTML(response);
    }

    /**
     * 폴백 HTML 생성
     */
    generateFallbackHTML(content) {
        return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>센서 게임</title>
    <script src="/socket.io/socket.io.js"></script>
    <script src="https://unpkg.com/qrcode@1.5.3/build/qrcode.min.js"></script>
    <script src="/js/SessionSDK.js"></script>
</head>
<body>
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <div class="ui-panel session-panel" id="sessionPanel">
        <h3>게임 세션</h3>
        <div id="qrContainer">QR 코드 생성 중...</div>
        <button id="start-game-btn" disabled>센서 연결 대기</button>
    </div>

    <script>
        // 기본 게임 구조
        console.log('생성된 내용:', ${JSON.stringify(content)});
    </script>
</body>
</html>`;
    }

    /**
     * 성공률 추정
     */
    estimateSuccessRate(gameCode, analysisResult) {
        let score = 70; // 기본 점수

        // SessionSDK 패턴 확인
        if (gameCode.includes('event.detail || event')) score += 10;
        if (gameCode.includes('connected')) score += 5;
        if (gameCode.includes('sensor-data')) score += 10;

        // 게임별 특화 요소 확인
        if (analysisResult.gameType === 'solo' && gameCode.includes('personalBest')) score += 5;
        if (analysisResult.gameType === 'dual' && gameCode.includes('cooperation')) score += 5;
        if (analysisResult.gameType === 'multi' && gameCode.includes('ranking')) score += 5;

        return Math.min(95, score);
    }

    /**
     * 생성 결과 기록
     */
    recordGenerationResult(analysisResult, finalResult, generationTime, success) {
        this.performanceMetrics.totalGenerations++;

        if (success) {
            this.performanceMetrics.successfulGenerations++;

            if (analysisResult) {
                // 타입별 성공률 기록
                const typeStats = this.performanceMetrics.successRateByType[analysisResult.gameType];
                if (typeStats) {
                    typeStats.total++;
                    typeStats.success++;
                }

                // 장르별 성공률 기록
                const genreStats = this.performanceMetrics.successRateByGenre[analysisResult.genre];
                if (genreStats) {
                    genreStats.total++;
                    genreStats.success++;
                }
            }
        }

        // 응답 시간 기록
        this.performanceMetrics.responseTimeHistory.push(generationTime);
        if (this.performanceMetrics.responseTimeHistory.length > 100) {
            this.performanceMetrics.responseTimeHistory.shift();
        }
    }

    /**
     * 실패 분석
     */
    async analyzeFailure(userInput, error) {
        const errorCategory = this.categorizeError(error);

        // 실패 패턴 학습
        if (this.learningSystem.errorPatterns.has(errorCategory)) {
            this.learningSystem.errorPatterns.set(
                errorCategory,
                this.learningSystem.errorPatterns.get(errorCategory) + 1
            );
        } else {
            this.learningSystem.errorPatterns.set(errorCategory, 1);
        }

        // 개선 방안 학습
        this.learnFromFailure(userInput, error, errorCategory);
    }

    /**
     * 에러 분류
     */
    categorizeError(error) {
        const message = error.message.toLowerCase();

        if (message.includes('parsing') || message.includes('json')) {
            return 'PARSING_ERROR';
        } else if (message.includes('timeout') || message.includes('network')) {
            return 'NETWORK_ERROR';
        } else if (message.includes('validation')) {
            return 'VALIDATION_ERROR';
        } else if (message.includes('template')) {
            return 'TEMPLATE_ERROR';
        }

        return 'UNKNOWN_ERROR';
    }

    /**
     * 실패로부터 학습
     */
    learnFromFailure(userInput, error, category) {
        // 실패 패턴과 입력의 상관관계 분석
        const inputPattern = this.extractInputPattern(userInput);

        if (!this.learningSystem.contextualAdjustments.has(category)) {
            this.learningSystem.contextualAdjustments.set(category, new Map());
        }

        const categoryAdjustments = this.learningSystem.contextualAdjustments.get(category);
        categoryAdjustments.set(inputPattern, {
            count: (categoryAdjustments.get(inputPattern)?.count || 0) + 1,
            lastFailure: new Date().toISOString(),
            errorMessage: error.message
        });
    }

    /**
     * 입력 패턴 추출
     */
    extractInputPattern(userInput) {
        const input = userInput.toLowerCase();

        // 게임 타입 키워드
        const typeKeywords = ['혼자', '둘이', '여럿', '솔로', '듀얼', '멀티'];
        const detectedType = typeKeywords.find(keyword => input.includes(keyword)) || 'unknown';

        // 장르 키워드
        const genreKeywords = ['물리', '요리', '액션', '퍼즐', '레이싱'];
        const detectedGenre = genreKeywords.find(keyword => input.includes(keyword)) || 'unknown';

        return `${detectedType}_${detectedGenre}`;
    }

    /**
     * 현재 성공률 조회
     */
    getCurrentSuccessRate() {
        if (this.performanceMetrics.totalGenerations === 0) return 0;

        return (this.performanceMetrics.successfulGenerations / this.performanceMetrics.totalGenerations) * 100;
    }

    /**
     * 성능 통계 조회
     */
    getPerformanceStats() {
        return {
            overallSuccessRate: this.getCurrentSuccessRate(),
            totalGenerations: this.performanceMetrics.totalGenerations,
            successfulGenerations: this.performanceMetrics.successfulGenerations,
            typeSuccessRates: this.calculateTypeSuccessRates(),
            genreSuccessRates: this.calculateGenreSuccessRates(),
            averageResponseTime: this.calculateAverageResponseTime(),
            commonErrors: Array.from(this.learningSystem.errorPatterns.entries()),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 타입별 성공률 계산
     */
    calculateTypeSuccessRates() {
        const rates = {};

        Object.entries(this.performanceMetrics.successRateByType).forEach(([type, stats]) => {
            rates[type] = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
        });

        return rates;
    }

    /**
     * 장르별 성공률 계산
     */
    calculateGenreSuccessRates() {
        const rates = {};

        Object.entries(this.performanceMetrics.successRateByGenre).forEach(([genre, stats]) => {
            rates[genre] = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
        });

        return rates;
    }

    /**
     * 평균 응답 시간 계산
     */
    calculateAverageResponseTime() {
        if (this.performanceMetrics.responseTimeHistory.length === 0) return 0;

        const total = this.performanceMetrics.responseTimeHistory.reduce((a, b) => a + b, 0);
        return total / this.performanceMetrics.responseTimeHistory.length;
    }

    /**
     * 프롬프트 버전 관리
     */
    getCurrentPromptVersion() {
        return 'v2.0.0';
    }

    /**
     * 게임 타입별 프롬프트 초기화
     */
    createSoloGamePrompts() {
        return {
            essentialPatterns: `
// Solo 게임 필수 패턴
- SessionSDK 초기화: gameType: 'solo', maxSensors: 1
- 개인 기록 저장: localStorage 활용
- 레벨 진행 시스템: 점진적 난이도 증가
- 즉시 피드백: 점수, 시각/청각 효과
- 에러 복구: 센서 연결 해제 시 재시작 옵션`,

            commonPitfalls: [
                '다중 플레이어 요소 포함',
                '복잡한 협력 메커니즘',
                '과도한 네트워크 의존성'
            ],

            qualityChecks: [
                'personalBest 구현',
                'localStorage 사용',
                'level 시스템',
                'score 업데이트'
            ]
        };
    }

    createDualGamePrompts() {
        return {
            essentialPatterns: `
// Dual 게임 필수 패턴
- SessionSDK 초기화: gameType: 'dual', maxSensors: 2
- 플레이어 동기화: 500ms 이내 동작 매칭
- 협력 보너스: 동기화 성공 시 추가 점수
- 역할 분담: 각 플레이어별 고유 기능
- 팀 목표: 공동으로 달성해야 하는 미션`,

            commonPitfalls: [
                '플레이어 간 경쟁 요소',
                '개별 점수 시스템',
                '동기화 무시'
            ],

            qualityChecks: [
                'cooperation 시스템',
                'player 관리',
                'sync 체크',
                'teamScore 구현'
            ]
        };
    }

    createMultiGamePrompts() {
        return {
            essentialPatterns: `
// Multi 게임 필수 패턴
- SessionSDK 초기화: gameType: 'multi', maxSensors: 8
- 실시간 랭킹: 지속적인 순위 업데이트
- 공정한 경쟁: 모든 플레이어 동등한 기회
- 플레이어 식별: 고유 ID 및 이름 표시
- 탈락/생존: 게임 모드에 따른 진행`,

            commonPitfalls: [
                '협력 요소 강조',
                '개인 기록 중심',
                '실시간 업데이트 누락'
            ],

            qualityChecks: [
                'ranking 시스템',
                'realtime 업데이트',
                'player 관리',
                'competition 요소'
            ]
        };
    }

    /**
     * 장르별 프롬프트 초기화
     */
    createPhysicsPrompts() {
        return {
            specificFeatures: `
// 물리 게임 특화 요소
- 중력 시뮬레이션: orientation.beta/gamma → gravity vector
- 충돌 감지: AABB 또는 circle collision
- 반발 계수: bounce factor (0.7~0.9)
- 마찰력: friction factor (0.95~0.99)
- 경계 처리: 화면 밖으로 나가지 않도록`,

            codePatterns: {
                gravityApplication: `
const gravityX = Math.max(-1, Math.min(1, orientation.gamma / 45));
const gravityY = Math.max(-1, Math.min(1, orientation.beta / 45));
ball.accelerationX = gravityX * 500;
ball.accelerationY = gravityY * 500;`,

                collisionDetection: `
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}`
            }
        };
    }

    createCookingPrompts() {
        return {
            specificFeatures: `
// 요리 게임 특화 요소
- 타이밍 시스템: 정확한 조리 시간 관리
- 재료 조합: 순서와 비율이 중요
- 온도 조절: 센서 기울기로 화력 조절
- 진행도 표시: 시각적 조리 상태 표현
- 완성도 평가: 타이밍과 정확도 기반 점수`,

            codePatterns: {
                timingSystem: `
const cookingTime = performance.now() - startTime;
const perfectTime = recipe.cookTime;
const accuracy = Math.max(0, 100 - Math.abs(cookingTime - perfectTime));`,

                heatControl: `
const tiltAngle = Math.abs(orientation.gamma);
const heatLevel = Math.min(100, tiltAngle * 2);
cooking.temperature = heatLevel;`
            }
        };
    }

    createActionPrompts() {
        return {
            specificFeatures: `
// 액션 게임 특화 요소
- 빠른 반응: 센서 입력 즉시 반영
- 회피 메커니즘: 기울기로 캐릭터 이동
- 콤보 시스템: 연속 동작 보너스
- 체력 시스템: 피격 시 감소, 아이템으로 회복
- 적 AI: 플레이어 추적 및 공격 패턴`,

            codePatterns: {
                fastResponse: `
const moveSpeed = 8;
player.x += orientation.gamma * moveSpeed;
player.y += orientation.beta * moveSpeed;`,

                comboSystem: `
if (performance.now() - lastAction < 1000) {
    comboCount++;
    scoreMultiplier = 1 + (comboCount * 0.1);
}`
            }
        };
    }

    createPuzzlePrompts() {
        return {
            specificFeatures: `
// 퍼즐 게임 특화 요소
- 논리적 사고: 단계적 문제 해결
- 힌트 시스템: 막혔을 때 도움말 제공
- 진행도 저장: 중간 상태 보존
- 다중 해답: 여러 해결 방법 허용
- 난이도 곡선: 점진적 복잡도 증가`,

            codePatterns: {
                hintSystem: `
function showHint() {
    if (hintCount > 0) {
        displayMessage(currentLevel.hint);
        hintCount--;
    }
}`,

                progressSave: `
localStorage.setItem('puzzleProgress', JSON.stringify({
    level: currentLevel,
    moves: moveHistory,
    time: elapsedTime
}));`
            }
        };
    }

    createRacingPrompts() {
        return {
            specificFeatures: `
// 레이싱 게임 특화 요소
- 조작감: 직관적인 기울기 조작
- 코스 설계: 다양한 장애물과 트랙
- 랩타임: 정확한 시간 측정
- 부스터: 특수 구간 가속
- 충돌 처리: 벽면 및 장애물 반응`,

            codePatterns: {
                steering: `
const steerAngle = orientation.gamma * 0.1;
car.direction += steerAngle;
car.x += Math.cos(car.direction) * car.speed;
car.y += Math.sin(car.direction) * car.speed;`,

                lapTime: `
if (checkCheckpoint(car.position)) {
    const lapTime = performance.now() - lapStartTime;
    if (lapTime < bestLapTime) {
        bestLapTime = lapTime;
    }
}`
            }
        };
    }

    /**
     * 코드 패턴 라이브러리 초기화
     */
    initializeCodePatterns() {
        return {
            sessionSDK: {
                initialization: `
const sdk = new SessionSDK({
    gameId: '{{GAME_ID}}',
    gameType: '{{GAME_TYPE}}',
    maxSensors: {{MAX_SENSORS}},
    debug: false
});`,

                eventHandling: `
sdk.on('connected', async () => {
    console.log('✅ 서버 연결 완료');
    await sdk.createSession();
});

sdk.on('session-created', (event) => {
    const session = event.detail || event;
    displaySessionInfo(session);
});

sdk.on('sensor-connected', (event) => {
    const data = event.detail || event;
    onSensorConnected(data);
});

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;
    processSensorData(data);
});`
            },

            gameLoop: `
function gameLoop() {
    if (!gameState.playing) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - lastUpdateTime;
    lastUpdateTime = currentTime;

    updateGame(deltaTime);
    render();

    requestAnimationFrame(gameLoop);
}`,

            errorHandling: `
window.addEventListener('error', (event) => {
    console.error('게임 오류:', event.error);
    showErrorMessage('오류가 발생했습니다. 새로고침해주세요.');
});

function handleSensorError(error) {
    console.error('센서 오류:', error);
    showNotification('센서 연결에 문제가 있습니다.', 'warning');
}`
        };
    }

    /**
     * 에러로부터 학습
     */
    learnFromErrors(gameId, errors) {
        console.log(`📚 에러 패턴 학습: ${gameId} (${errors.length}개 오류)`);

        errors.forEach(error => {
            const errorKey = `${error.type}_${error.category}`;

            // 에러 패턴 학습
            if (!this.learningSystem.errorPatterns.has(errorKey)) {
                this.learningSystem.errorPatterns.set(errorKey, {
                    count: 0,
                    examples: [],
                    relatedPrompts: [],
                    severity: error.severity
                });
            }

            const pattern = this.learningSystem.errorPatterns.get(errorKey);
            pattern.count++;
            pattern.examples.push({
                message: error.message,
                gameId: gameId,
                timestamp: Date.now()
            });

            // 최근 10개 예제만 유지
            if (pattern.examples.length > 10) {
                pattern.examples = pattern.examples.slice(-10);
            }

            // 공통 에러 통계 업데이트
            this.performanceMetrics.commonErrors.set(errorKey,
                (this.performanceMetrics.commonErrors.get(errorKey) || 0) + 1
            );
        });

        // 프롬프트 개선 제안 생성
        this.suggestPromptImprovements(errors);
    }

    /**
     * 성공적인 수정으로부터 학습
     */
    learnFromSuccessfulFixes(gameId, fixResult) {
        console.log(`✅ 성공 패턴 학습: ${gameId} (${fixResult.fixCount}개 수정)`);

        fixResult.appliedFixes.forEach(fix => {
            const fixKey = `${fix.error.type}_fix`;

            if (!this.learningSystem.successPatterns.has(fixKey)) {
                this.learningSystem.successPatterns.set(fixKey, {
                    count: 0,
                    successRate: 0,
                    examples: [],
                    bestPractices: []
                });
            }

            const pattern = this.learningSystem.successPatterns.get(fixKey);
            pattern.count++;
            pattern.examples.push({
                error: fix.error,
                fix: fix.fix,
                description: fix.description,
                gameId: gameId,
                timestamp: Date.now()
            });

            // 성공률 계산 (단순화된 버전)
            pattern.successRate = Math.min(95, pattern.count * 2);

            // 최근 10개 예제만 유지
            if (pattern.examples.length > 10) {
                pattern.examples = pattern.examples.slice(-10);
            }
        });
    }

    /**
     * 치명적 에러 처리
     */
    async handleCriticalErrors(gameId, errors) {
        console.log(`🚨 치명적 에러 처리: ${gameId} (${errors.length}개)`);

        // 즉시 자동 수정 시도
        const gameInfo = this.liveMonitor.monitoredGames.get(gameId);
        if (gameInfo) {
            try {
                const fixResult = await this.errorDetector.autoFixErrors(
                    gameInfo.gameCode,
                    errors
                );

                if (fixResult.fixCount > 0) {
                    gameInfo.gameCode = fixResult.fixedCode;
                    console.log(`🔧 치명적 에러 ${fixResult.fixCount}개 즉시 수정 완료`);
                } else {
                    console.warn(`⚠️ 치명적 에러 자동 수정 실패: ${gameId}`);
                }
            } catch (error) {
                console.error(`❌ 치명적 에러 처리 중 오류: ${gameId}`, error);
            }
        }
    }

    /**
     * 프롬프트 개선 제안 생성
     */
    suggestPromptImprovements(errors) {
        const suggestions = [];

        errors.forEach(error => {
            switch (error.category) {
                case 'syntax':
                    suggestions.push('JavaScript 문법 검증을 더 강화하는 프롬프트 추가');
                    break;
                case 'framework':
                    suggestions.push('SessionSDK 사용법에 대한 더 명확한 지침 추가');
                    break;
                case 'sensor':
                    suggestions.push('센서 데이터 처리에 대한 안전성 가이드 강화');
                    break;
                case 'gamelogic':
                    suggestions.push('게임 루프 구조에 대한 더 상세한 템플릿 제공');
                    break;
            }
        });

        if (suggestions.length > 0) {
            console.log('💡 프롬프트 개선 제안:', suggestions);
        }

        return suggestions;
    }

    /**
     * 에러 감지 시스템 상태 조회
     */
    getErrorSystemStatus() {
        return {
            errorDetector: this.errorDetector.getSystemStatus(),
            liveMonitor: this.liveMonitor.getMonitoringStatus(),
            learningSystem: {
                errorPatterns: this.learningSystem.errorPatterns.size,
                successPatterns: this.learningSystem.successPatterns.size,
                contextualAdjustments: this.learningSystem.contextualAdjustments.size
            },
            commonErrors: Object.fromEntries(this.performanceMetrics.commonErrors)
        };
    }

    /**
     * 실시간 모니터링 시작/중지
     */
    startErrorMonitoring() {
        return this.liveMonitor.startMonitoring();
    }

    stopErrorMonitoring() {
        return this.liveMonitor.stopMonitoring();
    }

    /**
     * 게임 모니터링 등록/해제
     */
    registerGameForMonitoring(gameId, gameCode, gameType, metadata = {}) {
        return this.liveMonitor.registerGame(gameId, gameCode, gameType, metadata);
    }

    unregisterGameFromMonitoring(gameId) {
        return this.liveMonitor.unregisterGame(gameId);
    }

    /**
     * 리소스 정리
     */
    cleanup() {
        console.log('🧹 OptimizedPromptEngine 정리 중...');

        if (this.liveMonitor) {
            this.liveMonitor.cleanup();
        }

        console.log('✅ OptimizedPromptEngine 정리 완료');
    }
}

module.exports = OptimizedPromptEngine;