/**
 * 🎯 InteractiveGameGenerator v2.0
 * 
 * 대화형 AI 게임 생성 시스템
 * - Claude API 중심의 단순화된 아키텍처
 * - 다중 턴 대화를 통한 요구사항 명확화
 * - Supabase RAG 시스템 활용
 * - 실행 가능한 고품질 게임 생성 보장
 */

const { ChatAnthropic } = require('@langchain/anthropic');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { SupabaseVectorStore } = require('@langchain/community/vectorstores/supabase');
const { createClient } = require('@supabase/supabase-js');
const { PromptTemplate } = require('@langchain/core/prompts');
const fs = require('fs').promises;
const path = require('path');
const GameValidator = require('./GameValidator');
const GameGenreClassifier = require('./GameGenreClassifier');
const RequirementCollector = require('./RequirementCollector');
const PerformanceMonitor = require('./PerformanceMonitor');

class InteractiveGameGenerator {
    constructor() {
        this.config = {
            claudeApiKey: process.env.CLAUDE_API_KEY,
            openaiApiKey: process.env.OPENAI_API_KEY,
            supabaseUrl: process.env.SUPABASE_URL,
            supabaseKey: process.env.SUPABASE_ANON_KEY,
            claudeModel: 'claude-3-5-sonnet-20241022',
            maxTokens: 8000
        };

        // 컴포넌트 초기화
        this.supabaseClient = null;
        this.vectorStore = null;
        this.embeddings = null;
        this.llm = null;
        this.mockMode = false;

        // 대화 세션 관리
        this.activeSessions = new Map(); // sessionId -> conversationData
        
        // 게임 검증 시스템
        this.gameValidator = new GameValidator();
        
        // 게임 장르 분류 시스템
        this.genreClassifier = new GameGenreClassifier();
        
        // 요구사항 수집 시스템
        this.requirementCollector = new RequirementCollector();
        
        // 성능 모니터링 시스템
        this.performanceMonitor = new PerformanceMonitor();
        this.setupPerformanceMonitoring();
        
        this.initialize();
    }

    /**
     * 성능 모니터링 시스템 설정
     */
    setupPerformanceMonitoring() {
        // 성능 경고 이벤트 핸들러 등록
        this.performanceMonitor.on('alert', (alert) => {
            console.warn(`🚨 [성능 경고] ${alert.message}`, alert.data);
        });

        // 10분마다 성능 통계 출력
        setInterval(() => {
            this.performanceMonitor.printStatistics();
        }, 10 * 60 * 1000);

        console.log('📊 성능 모니터링 시스템이 초기화되었습니다.');
    }

    async initialize() {
        try {
            console.log('🎯 대화형 게임 생성기 초기화 중...');

            // 환경변수 체크
            if (!this.config.claudeApiKey) {
                console.log('⚠️ Claude API 키가 설정되지 않음 - 더미 모드로 동작');
                this.mockMode = true;
                console.log('✅ 대화형 게임 생성기 초기화 완료 (더미 모드)');
                return;
            }

            // Supabase 클라이언트 초기화
            if (this.config.supabaseUrl && this.config.supabaseKey) {
                this.supabaseClient = createClient(
                    this.config.supabaseUrl,
                    this.config.supabaseKey
                );
            }

            // OpenAI 임베딩 초기화
            if (this.config.openaiApiKey) {
                this.embeddings = new OpenAIEmbeddings({
                    openAIApiKey: this.config.openaiApiKey,
                    modelName: 'text-embedding-3-small',
                });
            }

            // Claude LLM 초기화
            this.llm = new ChatAnthropic({
                anthropicApiKey: this.config.claudeApiKey,
                modelName: this.config.claudeModel,
                maxTokens: this.config.maxTokens,
                temperature: 0.7, // 창의적이지만 일관된 답변
            });

            // Supabase 벡터 저장소 초기화
            if (this.supabaseClient && this.embeddings) {
                this.vectorStore = new SupabaseVectorStore(this.embeddings, {
                    client: this.supabaseClient,
                    tableName: 'game_knowledge',
                    queryName: 'match_documents'
                });
            }

            console.log('✅ 대화형 게임 생성기 초기화 완료');

        } catch (error) {
            console.error('❌ 대화형 게임 생성기 초기화 실패:', error);
            console.log('⚠️ 더미 모드로 대체 동작');
            this.mockMode = true;
        }
    }

    /**
     * 새로운 대화 세션 시작
     */
    async startNewSession(sessionId) {
        try {
            // 성능 추적 시작
            const performanceTracking = this.performanceMonitor.startGameGenerationTracking(sessionId, {
                sessionType: 'traditional',
                startMethod: 'startNewSession'
            });

            const session = {
                id: sessionId,
                stage: 'initial', // initial -> details -> mechanics -> confirmation -> generation
                gameRequirements: {
                    title: null,
                    description: null,
                    gameType: null, // solo, dual, multi
                    genre: null,
                    sensorMechanics: [],
                    gameplayElements: {},
                    difficulty: null,
                    specialRequirements: []
                },
                conversationHistory: [],
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                performanceTracking: performanceTracking // 성능 추적 참조 추가
            };

            this.activeSessions.set(sessionId, session);
            
            // 초기화 단계 완료 기록
            this.performanceMonitor.recordStageCompletion(sessionId, 'initialization', {
                sessionType: 'traditional'
            });

            // 초기 환영 메시지 생성
            const welcomeMessage = await this.generateWelcomeMessage();
            
            session.conversationHistory.push({
                role: 'assistant',
                content: welcomeMessage,
                timestamp: new Date().toISOString(),
                stage: 'initial'
            });

            return {
                success: true,
                sessionId: sessionId,
                message: welcomeMessage,
                stage: 'initial',
                progress: this.getStageProgress('initial')
            };

        } catch (error) {
            console.error('❌ 세션 시작 실패:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 사용자 메시지 처리 및 응답 생성
     */
    async processUserMessage(sessionId, userMessage) {
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session) {
                throw new Error('세션을 찾을 수 없습니다.');
            }

            // 사용자 메시지 기록
            session.conversationHistory.push({
                role: 'user',
                content: userMessage,
                timestamp: new Date().toISOString(),
                stage: session.stage
            });

            // 현재 단계에 따른 메시지 처리
            const response = await this.processMessageByStage(session, userMessage);

            // AI 응답 기록
            session.conversationHistory.push({
                role: 'assistant',
                content: response.message,
                timestamp: new Date().toISOString(),
                stage: response.newStage || session.stage
            });

            // 세션 상태 업데이트
            if (response.newStage) {
                session.stage = response.newStage;
            }
            if (response.requirements) {
                Object.assign(session.gameRequirements, response.requirements);
            }
            session.lastUpdated = new Date().toISOString();

            return {
                success: true,
                sessionId: sessionId,
                message: response.message,
                stage: session.stage,
                progress: this.getStageProgress(session.stage),
                requirements: session.gameRequirements,
                canGenerate: session.stage === 'confirmation'
            };

        } catch (error) {
            console.error('❌ 메시지 처리 실패:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 단계별 메시지 처리
     */
    async processMessageByStage(session, userMessage) {
        const context = await this.getRelevantContext(userMessage);
        
        switch (session.stage) {
            case 'initial':
                return await this.processInitialStage(session, userMessage, context);
            case 'details':
                return await this.processDetailsStage(session, userMessage, context);
            case 'mechanics':
                return await this.processMechanicsStage(session, userMessage, context);
            case 'confirmation':
                return await this.processConfirmationStage(session, userMessage, context);
            default:
                throw new Error('알 수 없는 세션 단계입니다.');
        }
    }

    /**
     * 초기 단계: 게임 아이디어 수집 (장르 분류 시스템 통합)
     */
    async processInitialStage(session, userMessage, context) {
        // GameGenreClassifier를 사용하여 사용자 입력 분석
        console.log('🎯 장르 분류 시스템으로 게임 주제 분석 중...');
        const genreAnalysis = await this.genreClassifier.classifyGameIdea(userMessage);
        console.log('📊 장르 분석 결과:', genreAnalysis);
        
        // 분류 결과를 바탕으로 특화된 프롬프트 생성
        const specializedPrompt = this.generateSpecializedPrompt(userMessage, genreAnalysis, context);
        
        const response = await this.safeInvokeLLM(specializedPrompt, 'initial', userMessage);
        
        // 개선된 JSON 추출 로직
        let extracted = this.extractJSONFromResponse(response.content);
        
        let newStage = session.stage;
        let requirements = {};

        // 장르 분석 결과를 활용하여 자동 진행 결정
        const hasGameIdea = userMessage.length > 10 && (
            genreAnalysis.confidence > 0.6 ||
            userMessage.includes('게임') || userMessage.includes('만들') || 
            userMessage.includes('기울') || userMessage.includes('흔들') || 
            userMessage.includes('센서')
        );

        if (extracted.readyForNext || hasGameIdea) {
            newStage = 'details';
            requirements = {
                gameType: extracted.gameType || genreAnalysis.gameType || this.inferGameType(userMessage),
                genre: extracted.genre || genreAnalysis.primaryGenre || this.inferGenre(userMessage),
                title: extracted.title || genreAnalysis.suggestedTitle || this.generateTitle(userMessage),
                description: userMessage,
                // 장르 분류 결과도 저장
                genreAnalysis: genreAnalysis
            };
        }

        // JSON 제거하여 깔끔한 메시지 반환
        const cleanMessage = this.removeJSONFromMessage(response.content);
        
        // 진행 안내 메시지 추가 (장르 분류 정보 포함)
        let finalMessage = cleanMessage;
        if (newStage === 'details') {
            finalMessage += `\n\n✅ 게임 아이디어가 확인되었습니다! 
📊 분석 결과: "${genreAnalysis.primaryGenre}" 장르로 분류되었으며, ${genreAnalysis.gameType} 타입이 적합합니다.
🎮 세부사항을 정의해보겠습니다.`;
        } else if (genreAnalysis.confidence > 0.3) {
            finalMessage += `\n\n💡 예상 장르: "${genreAnalysis.primaryGenre}" (${Math.round(genreAnalysis.confidence * 100)}% 확신도)`;
        }

        return {
            message: finalMessage,
            newStage: newStage,
            requirements: requirements
        };
    }

    /**
     * 장르별 특화 프롬프트 생성
     */
    generateSpecializedPrompt(userMessage, genreAnalysis, context) {
        const basePrompt = `당신은 Sensor Game Hub의 전문 게임 개발 컨설턴트입니다.`;
        
        if (genreAnalysis.confidence < 0.3) {
            // 장르 확신도가 낮을 때는 기본 프롬프트 사용
            return `${basePrompt} 
사용자의 게임 아이디어를 듣고 다음을 수행하세요:

1. 게임 아이디어 분석 및 피드백
2. 게임 타입 결정 (solo, dual, multi)
3. 기본 장르 식별
4. 다음 단계로 진행할 준비가 되었는지 판단

사용자 입력: "${userMessage}"

관련 컨텍스트:
${context}

중요: 사용자가 구체적인 게임 아이디어를 제시했다면 다음 정확한 JSON 형식으로 응답 끝에 포함하세요:
{"readyForNext": true, "gameType": "solo|dual|multi", "genre": "추정장르", "title": "제안제목"}

응답은 자연스러운 대화체로 하되, 충분한 정보가 있으면 반드시 위 JSON을 포함하세요.`;
        }
        
        // 장르별 특화 프롬프트
        const genreSpecificPrompts = {
            'physics': `${basePrompt}
사용자가 **물리 기반 게임**을 원합니다. 이는 중력, 관성, 충돌 등의 물리 법칙을 활용하는 게임입니다.

🎯 **물리 게임 특화 분석:**
- **핵심 센서**: 중력센서(gravity), 가속도센서(acceleration), 기울기(orientation)
- **게임 메커니즘**: 공 굴리기, 균형 잡기, 물체 이동, 관성 활용
- **추천 요소**: 경사면, 장애물, 목표 지점, 물리 퍼즐
- **성공 게임 예시**: 미로 게임, 볼 플래퍼, 평형 게임

사용자 입력: "${userMessage}"
예상 장르: ${genreAnalysis.primaryGenre}
추천 게임 타입: ${genreAnalysis.gameType}
핵심 센서: ${genreAnalysis.sensorMechanics.join(', ')}

특별히 다음 사항들을 확인해보세요:
1. 어떤 물체(공, 블록, 캐릭터)를 조작하고 싶은가요?
2. 중력이나 관성을 어떻게 활용하고 싶은가요?
3. 장애물이나 목표물은 어떤 것들이 있나요?

JSON 형식: {"readyForNext": true, "gameType": "${genreAnalysis.gameType}", "genre": "물리 게임", "title": "${genreAnalysis.suggestedTitle}"}`,

            'cooking': `${basePrompt}
사용자가 **요리/시뮬레이션 게임**을 원합니다. 이는 순서, 타이밍, 재료 조합이 중요한 게임입니다.

🍳 **요리 게임 특화 분석:**
- **핵심 센서**: 흔들기(shake), 회전(rotation), 기울기(tilt), 탭핑(tap)
- **게임 메커니즘**: 재료 섞기, 조리 시간 관리, 순서 맞추기, 레시피 완성
- **추천 요소**: 재료 선택, 조리 도구, 타이머, 품질 평가
- **성공 게임 예시**: 쿠킹 시뮬레이터, 레스토랑 관리, 레시피 퍼즐

사용자 입력: "${userMessage}"
예상 장르: ${genreAnalysis.primaryGenre}
추천 게임 타입: ${genreAnalysis.gameType}
핵심 센서: ${genreAnalysis.sensorMechanics.join(', ')}

특별히 다음 사항들을 확인해보세요:
1. 어떤 요리나 음식을 만들고 싶나요?
2. 센서로 어떤 조리 동작(섞기, 뒤집기, 저어주기)을 하고 싶나요?
3. 시간 제한이나 순서가 중요한가요?

JSON 형식: {"readyForNext": true, "gameType": "${genreAnalysis.gameType}", "genre": "요리 시뮬레이션", "title": "${genreAnalysis.suggestedTitle}"}`,

            'action': `${basePrompt}
사용자가 **액션/아케이드 게임**을 원합니다. 이는 빠른 반응과 정확한 조작이 필요한 게임입니다.

⚡ **액션 게임 특화 분석:**
- **핵심 센서**: 가속도(acceleration), 자이로스코프(gyroscope), 터치(tap)
- **게임 메커니즘**: 빠른 움직임, 적 피하기, 점수 경쟁, 콤보 시스템
- **추천 요소**: 스피드 증가, 파워업, 장애물, 레벨 진행
- **성공 게임 예시**: 러너 게임, 슈팅 게임, 리듬 게임

사용자 입력: "${userMessage}"
예상 장르: ${genreAnalysis.primaryGenre}
추천 게임 타입: ${genreAnalysis.gameType}
핵심 센서: ${genreAnalysis.sensorMechanics.join(', ')}

특별히 다음 사항들을 확인해보세요:
1. 어떤 캐릭터나 오브젝트를 조작하나요?
2. 피하거나 공격해야 할 것들이 있나요?
3. 게임 속도나 난이도가 점점 올라가나요?

JSON 형식: {"readyForNext": true, "gameType": "${genreAnalysis.gameType}", "genre": "액션 게임", "title": "${genreAnalysis.suggestedTitle}"}`,

            'puzzle': `${basePrompt}
사용자가 **퍼즐/논리 게임**을 원합니다. 이는 사고력과 문제 해결 능력이 필요한 게임입니다.

🧩 **퍼즐 게임 특화 분석:**
- **핵심 센서**: 정밀한 기울기(orientation), 회전(rotation), 위치 감지
- **게임 메커니즘**: 패턴 맞추기, 경로 찾기, 블록 배치, 논리 추론
- **추천 요소**: 단계별 난이도, 힌트 시스템, 창의적 해답
- **성공 게임 예시**: 미로 게임, 블록 퍼즐, 패턴 게임

사용자 입력: "${userMessage}"
예상 장르: ${genreAnalysis.primaryGenre}
추천 게임 타입: ${genreAnalysis.gameType}
핵심 센서: ${genreAnalysis.sensorMechanics.join(', ')}

특별히 다음 사항들을 확인해보세요:
1. 어떤 종류의 퍼즐이나 문제를 풀고 싶나요?
2. 단계별로 난이도가 올라가는 게임인가요?
3. 시간 제한이 있거나 점수 시스템이 필요한가요?

JSON 형식: {"readyForNext": true, "gameType": "${genreAnalysis.gameType}", "genre": "퍼즐 게임", "title": "${genreAnalysis.suggestedTitle}"}`,

            'racing': `${basePrompt}
사용자가 **레이싱/운전 게임**을 원합니다. 이는 속도감과 조작감이 중요한 게임입니다.

🏎️ **레이싱 게임 특화 분석:**
- **핵심 센서**: 기울기(tilt), 가속도(acceleration), 자이로스코프
- **게임 메커니즘**: 스티어링 제어, 속도 조절, 경쟁, 트랙 완주
- **추천 요소**: 다양한 트랙, 차량 종류, 랩타임, 장애물
- **성공 게임 예시**: 카트 레이싱, 무한 러너, 항공 시뮬레이션

사용자 입력: "${userMessage}"
예상 장르: ${genreAnalysis.primaryGenre}
추천 게임 타입: ${genreAnalysis.gameType}
핵심 센서: ${genreAnalysis.sensorMechanics.join(', ')}

특별히 다음 사항들을 확인해보세요:
1. 어떤 종류의 탈것(자동차, 비행기, 우주선)인가요?
2. 트랙이나 경로가 정해져 있나요?
3. 다른 플레이어와 경쟁하는 게임인가요?

JSON 형식: {"readyForNext": true, "gameType": "${genreAnalysis.gameType}", "genre": "레이싱 게임", "title": "${genreAnalysis.suggestedTitle}"}`
        };

        // 장르에 맞는 특화 프롬프트 선택
        const matchedGenre = Object.keys(genreSpecificPrompts).find(genre => 
            genreAnalysis.primaryGenre.toLowerCase().includes(genre) ||
            genreAnalysis.detectedKeywords.some(keyword => genre.includes(keyword))
        );

        if (matchedGenre) {
            console.log(`🎯 "${matchedGenre}" 장르에 특화된 프롬프트 사용`);
            return genreSpecificPrompts[matchedGenre];
        }

        // 기본 프롬프트에 장르 정보 추가
        return `${basePrompt} 
장르 분석 시스템이 사용자의 게임을 "${genreAnalysis.primaryGenre}"로 분류했습니다.

🎮 **분석 결과:**
- **장르**: ${genreAnalysis.primaryGenre} (확신도: ${Math.round(genreAnalysis.confidence * 100)}%)
- **게임 타입**: ${genreAnalysis.gameType}
- **추천 센서**: ${genreAnalysis.sensorMechanics.join(', ')}
- **핵심 키워드**: ${genreAnalysis.detectedKeywords.join(', ')}

사용자 입력: "${userMessage}"

이 분석을 바탕으로 다음을 수행하세요:
1. 게임 아이디어 분석 및 피드백
2. 장르별 특화 요소 제안
3. 적절한 센서 활용 방안 제시
4. 다음 단계 진행 준비 확인

관련 컨텍스트:
${context}

중요: 사용자가 구체적인 게임 아이디어를 제시했다면 다음 정확한 JSON 형식으로 응답 끝에 포함하세요:
{"readyForNext": true, "gameType": "${genreAnalysis.gameType}", "genre": "${genreAnalysis.primaryGenre}", "title": "${genreAnalysis.suggestedTitle}"}

응답은 자연스러운 대화체로 하되, 장르 특성을 반영한 구체적인 제안을 해주세요.`;
    }

    /**
     * 장르별 특화 게임 생성 프롬프트 생성
     */
    generateGameCreationPrompt(requirements, context) {
        const basePrompt = `당신은 Sensor Game Hub v6.0의 최고 전문 게임 개발자입니다.
다음 상세 요구사항에 따라 **실제로 작동하는** 완벽한 HTML5 센서 게임을 생성해주세요.`;

        // 장르 분석 정보가 있는 경우 활용
        const genreAnalysis = requirements.genreAnalysis;
        let genreSpecificInstructions = '';

        if (genreAnalysis && genreAnalysis.primaryGenre) {
            const genre = genreAnalysis.primaryGenre.toLowerCase();
            
            if (genre.includes('physics') || genre.includes('물리')) {
                genreSpecificInstructions = `
🎯 **물리 게임 특화 요구사항:**
- 중력과 관성을 활용한 현실적인 물리 엔진 구현
- 공이나 오브젝트의 자연스러운 움직임과 충돌 처리
- 기울기에 따른 중력 방향 변경 시스템
- 마찰력과 탄성을 고려한 정밀한 물리 계산
- 장애물과의 충돌 시 현실적인 반사 및 에너지 감소`;
            
            } else if (genre.includes('cooking') || genre.includes('요리')) {
                genreSpecificInstructions = `
🍳 **요리 게임 특화 요구사항:**
- 흔들기, 저어주기, 뒤집기 등 다양한 센서 제스처 활용
- 타이밍과 순서가 중요한 레시피 시스템
- 재료 조합과 조리 시간에 따른 품질 평가
- 시각적 피드백(색상 변화, 연기 효과, 완성도 표시)
- 단계별 가이드와 성공/실패 판정 시스템`;
            
            } else if (genre.includes('action') || genre.includes('액션')) {
                genreSpecificInstructions = `
⚡ **액션 게임 특화 요구사항:**
- 빠른 반응과 정밀한 센서 조작이 핵심
- 콤보 시스템과 연속 액션 보상
- 난이도 점진적 증가 및 스피드 향상
- 즉각적인 시각/청각 피드백
- 점수 경쟁과 개인 기록 갱신 시스템`;
            
            } else if (genre.includes('puzzle') || genre.includes('퍼즐')) {
                genreSpecificInstructions = `
🧩 **퍼즐 게임 특화 요구사항:**
- 정밀한 센서 조작과 문제 해결 능력 요구
- 단계별 난이도 상승과 새로운 메커니즘 도입
- 힌트 시스템과 창의적 해결 방안 제시
- 사고 시간 제공과 차근차근 접근 가능한 UI
- 성취감을 주는 명확한 문제 해결 과정`;
            
            } else if (genre.includes('racing') || genre.includes('레이싱')) {
                genreSpecificInstructions = `
🏎️ **레이싱 게임 특화 요구사항:**
- 기울기를 활용한 직관적인 스티어링 시스템
- 속도감과 가속도를 체감할 수 있는 시각 효과
- 트랙 설계와 코너링 최적화 시스템
- 경쟁 요소와 랩타임 기록 시스템
- 차량 조작감과 관성을 고려한 물리 처리`;
            }
        }

        return `${basePrompt}

📋 **게임 상세 사양:**
- **제목**: ${requirements.title}
- **설명**: ${requirements.description}  
- **게임 타입**: ${requirements.gameType}
- **장르**: ${requirements.genre}
- **센서 메커니즘**: ${requirements.sensorMechanics?.join(', ')}
- **난이도**: ${requirements.difficulty}
- **목표**: ${requirements.objectives}
- **특별 요구사항**: ${requirements.specialRequirements?.join(', ')}

${genreSpecificInstructions}

🎯 **필수 구현 사항 (완전한 코드로 구현):**

1. **SessionSDK 완벽 통합**
2. **QR 코드 생성 (반드시 포함)**
3. **장르별 특화 센서 데이터 처리**
4. **완전한 UI 구조**
5. **게임 로직 완성도**
6. **필수 스크립트 태그**

📚 **개발 참고자료:**
${context}

🚨 **절대적 요구사항:**
1. 단일 HTML 파일로 완성 (모든 CSS/JS 인라인)
2. 완전히 작동하는 SessionSDK 통합
3. QR 코드가 실제로 생성되고 표시됨
4. 센서 연결 시 게임이 실제로 플레이 가능함
5. 모든 UI 요소가 올바르게 작동함
6. 에러 처리 및 폴백 완전 구현
7. ${requirements.genre} 장르 특성을 완벽히 반영

**반드시 즉시 플레이 가능한 완전한 게임을 생성하세요. 템플릿이 아닌 실제 작동하는 게임이어야 합니다!**`;
    }

    /**
     * 장르별 특화 모션 코드 생성
     */
    getGenreSpecificMotionCode(requirements) {
        const genre = requirements.genre?.toLowerCase() || '';
        
        if (genre.includes('physics') || genre.includes('물리')) {
            return `// 물리 게임: 중력과 관성 적용`;
        } else if (genre.includes('cooking') || genre.includes('요리')) {
            return `// 요리 게임: 제스처 패턴 인식`;
        } else if (genre.includes('action') || genre.includes('액션')) {
            return `// 액션 게임: 빠른 반응 처리`;
        } else if (genre.includes('racing') || genre.includes('레이싱')) {
            return `// 레이싱 게임: 스티어링과 가속도`;
        } else {
            return `// 기본 게임: 일반적인 움직임 적용`;
        }
    }

    /**
     * 세부사항 단계: 게임 메커니즘 구체화
     */
    async processDetailsStage(session, userMessage, context) {
        // 키워드 기반 단계 전환 체크
        const progressKeywords = ['진행', '다음', '계속', '확인', '넘어가', '완료', '좋아', '괜찮', '맞아'];
        const hasProgressKeyword = progressKeywords.some(keyword => 
            userMessage.toLowerCase().includes(keyword)
        );

        const prompt = `사용자가 ${session.gameRequirements.gameType} 타입의 "${session.gameRequirements.title}" 게임을 개발 중입니다.

현재 수집된 정보:
- 게임 타입: ${session.gameRequirements.gameType}
- 장르: ${session.gameRequirements.genre}
- 기본 설명: ${session.gameRequirements.description}

사용자 추가 입력: "${userMessage}"

다음을 수행하세요:
1. 센서 활용 방식 구체화 (기울기, 흔들기, 회전 등)
2. 게임 목표와 승리 조건 명확화
3. 난이도 수준 결정
4. 메커니즘 단계로 진행 준비 확인

중요: 충분한 정보가 수집되었다고 판단되면 다음 정확한 JSON 형식으로 응답 끝에 포함하세요:
{"readyForMechanics": true, "sensorMechanics": ["tilt", "shake"], "difficulty": "easy|medium|hard", "objectives": "승리조건"}

관련 컨텍스트:
${context}

자연스러운 대화체로 응답하되, 충분한 정보가 수집되었다고 판단되면 반드시 위 JSON을 포함하세요.`;

        const response = await this.safeInvokeLLM(prompt, 'initial', userMessage);
        
        // 개선된 JSON 추출 로직
        let extracted = this.extractJSONFromResponse(response.content);
        
        let newStage = session.stage;
        let requirements = {};

        // 키워드 기반 전환 또는 JSON 기반 전환
        const shouldProgress = hasProgressKeyword || extracted.readyForMechanics || 
            this.hasMinimumDetailsRequirements(session.gameRequirements);

        if (shouldProgress) {
            newStage = 'mechanics';
            requirements = {
                sensorMechanics: extracted.sensorMechanics || ['tilt'],
                difficulty: extracted.difficulty || 'medium',
                objectives: extracted.objectives || '게임 목표 달성'
            };
        }

        // JSON 제거하여 깔끔한 메시지 반환
        const cleanMessage = this.removeJSONFromMessage(response.content);
        
        // 진행 안내 메시지 추가
        let finalMessage = cleanMessage;
        if (shouldProgress) {
            finalMessage += '\n\n✅ 세부사항이 정리되었습니다! 게임 메커니즘 단계로 넘어가겠습니다.';
        } else if (!hasProgressKeyword) {
            finalMessage += '\n\n💡 더 추가하고 싶은 내용이 있으시면 말씀해주세요. 준비가 되면 "다음으로 진행해줘"라고 말씀해주세요.';
        }

        return {
            message: finalMessage,
            newStage: newStage,
            requirements: requirements
        };
    }

    /**
     * 메커니즘 단계: 게임 로직 세부사항
     */
    async processMechanicsStage(session, userMessage, context) {
        // 키워드 기반 단계 전환 체크
        const progressKeywords = ['진행', '다음', '계속', '확인', '넘어가', '완료', '좋아', '괜찮', '맞아'];
        const hasProgressKeyword = progressKeywords.some(keyword => 
            userMessage.toLowerCase().includes(keyword)
        );

        const prompt = `게임 "${session.gameRequirements.title}"의 세부 메커니즘을 정의하고 있습니다.

현재 요구사항:
- 타입: ${session.gameRequirements.gameType}
- 센서: ${session.gameRequirements.sensorMechanics?.join(', ')}
- 난이도: ${session.gameRequirements.difficulty}
- 목표: ${session.gameRequirements.objectives}

사용자 입력: "${userMessage}"

다음을 구체화하세요:
1. 게임 오브젝트와 상호작용
2. 점수 시스템
3. 시각적/청각적 피드백
4. 특별한 기능이나 파워업
5. 최종 확인 단계 준비 여부

중요: 사용자가 더 이상 추가할 내용이 없거나 다음 단계로 진행하려는 의도를 보이면, 
다음과 같은 정확한 JSON 형식으로 응답 끝에 포함하세요:
{"readyForConfirmation": true, "gameplayElements": {"scoring": "점수방식", "interactions": "상호작용", "feedback": "피드백"}, "specialRequirements": ["특별요구사항들"]}

관련 컨텍스트:
${context}

자연스러운 대화체로 응답하되, 충분한 정보가 수집되었다고 판단되면 반드시 위 JSON을 포함하세요.`;

        const response = await this.safeInvokeLLM(prompt, 'initial', userMessage);
        
        // 개선된 JSON 추출 로직
        let extracted = this.extractJSONFromResponse(response.content);
        
        let newStage = session.stage;
        let requirements = {};

        // 키워드 기반 전환 또는 JSON 기반 전환
        const shouldProgress = hasProgressKeyword || extracted.readyForConfirmation || 
            this.hasMinimumMechanicsRequirements(session.gameRequirements);

        if (shouldProgress) {
            newStage = 'confirmation';
            requirements = {
                gameplayElements: extracted.gameplayElements || {
                    scoring: '점수 획득 시스템',
                    interactions: '게임 상호작용',
                    feedback: '시각적 피드백'
                },
                specialRequirements: extracted.specialRequirements || [],
                confirmed: false // 확인 단계 진입 표시
            };
        }

        // JSON 제거하여 깔끔한 메시지 반환
        const cleanMessage = this.removeJSONFromMessage(response.content);
        
        // 진행 안내 메시지 추가
        let finalMessage = cleanMessage;
        if (shouldProgress) {
            finalMessage += '\n\n✅ 충분한 정보가 수집되었습니다! 최종 확인 단계로 넘어가겠습니다.';
        } else if (!hasProgressKeyword) {
            finalMessage += '\n\n💡 더 추가하고 싶은 내용이 있으시면 말씀해주세요. 준비가 되면 "다음 단계로 진행해줘"라고 말씀해주세요.';
        }

        return {
            message: finalMessage,
            newStage: newStage,
            requirements: requirements
        };
    }

    /**
     * 확인 단계: 최종 요구사항 정리
     */
    async processConfirmationStage(session, userMessage, context) {
        const requirements = session.gameRequirements;
        
        // 요구사항 수정 요청 감지
        const modificationKeywords = ['수정', '변경', '바꿔', '다르게', '추가', '빼줘', '없애'];
        const hasModificationRequest = modificationKeywords.some(keyword => 
            userMessage.toLowerCase().includes(keyword)
        );
        
        if (hasModificationRequest) {
            // 수정 요청이 있을 때는 이전 단계로 돌아감
            const prompt = `사용자가 게임 "${requirements.title}"의 요구사항을 수정하고 싶어합니다.

현재 요구사항:
- 제목: ${requirements.title}
- 타입: ${requirements.gameType}
- 장르: ${requirements.genre}
- 센서: ${requirements.sensorMechanics?.join(', ')}
- 난이도: ${requirements.difficulty}
- 목표: ${requirements.objectives}
- 특별기능: ${requirements.specialRequirements?.join(', ')}

사용자 수정 요청: "${userMessage}"

요청에 따라 수정사항을 반영하고, 다시 확인해주세요.`;
            
            const response = await this.safeInvokeLLM(prompt, 'initial', userMessage);
            
            return {
                message: response.content + '\n\n💡 수정이 완료되었다면 "확인" 또는 "좋아"라고 말씀해주세요!',
                newStage: 'confirmation',
                requirements: {} // 수정 반영을 위해 빈 객체
            };
        }

        // 최종 확인 및 정리
        const finalSummary = `🎯 **게임 개발 요구사항 최종 정리**

📋 **"${requirements.title}" 게임 사양:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎮 **기본 정보**
• **게임 타입**: ${requirements.gameType} ${requirements.gameType === 'solo' ? '(1인용)' : requirements.gameType === 'dual' ? '(2인 협력)' : '(다중 플레이어)'}
• **장르**: ${requirements.genre}
• **난이도**: ${requirements.difficulty || '보통'}

📱 **센서 활용**
• **센서 메커니즘**: ${requirements.sensorMechanics?.join(', ') || '기울기 센서'}

🎯 **게임 목표**
• **주요 목표**: ${requirements.objectives || '기본 게임 목표 달성'}

⭐ **특별 기능**
${requirements.specialRequirements?.length > 0 ? 
    requirements.specialRequirements.map(req => `• ${req}`).join('\n') : 
    '• 기본 게임 기능'}

🏆 **점수 시스템**
• ${requirements.gameplayElements?.scoring || '기본 점수 획득 시스템'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ **모든 요구사항이 정리되었습니다!**

🎮 이제 **"게임 생성하기"** 버튼을 눌러서 실제 게임을 제작해보세요!

💡 **참고**: 수정하고 싶은 부분이 있다면 언제든 말씀해주세요.`;

        // 요구사항 최종 확정
        session.gameRequirements.confirmed = true;
        
        return {
            message: finalSummary,
            newStage: 'confirmation', // 확인 단계 유지 (generating으로 자동 전환하지 않음)
            requirements: { confirmed: true },
            canGenerate: true // 게임 생성 버튼 활성화
        };
    }

    /**
     * 최종 게임 생성
     */
    async generateFinalGame(sessionId) {
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session) {
                throw new Error('세션을 찾을 수 없습니다.');
            }
            // 확인 단계 또는 generating 단계에서 게임 생성 가능
            if (session.stage !== 'confirmation' && session.stage !== 'generating') {
                throw new Error(`잘못된 세션 단계: ${session.stage}. 'confirmation' 또는 'generating' 단계에서만 게임을 생성할 수 있습니다.`);
            }
            
            // 요구사항이 확정되었는지 확인
            if (!session.gameRequirements.confirmed) {
                throw new Error('게임 요구사항이 아직 확정되지 않았습니다. 대화를 통해 요구사항을 완성해주세요.');
            }
            
            // 세션 단계를 generating으로 변경
            session.stage = 'generating';

            // 게임 생성 시작 추적
            this.performanceMonitor.recordStageCompletion(sessionId, 'aiGeneration', {
                startTime: Date.now()
            });

            console.log(`🎮 최종 게임 생성 시작: ${session.gameRequirements.title}`);
            console.log(`🔍 게임 사양:`, {
                title: session.gameRequirements.title,
                gameType: session.gameRequirements.gameType,
                genre: session.gameRequirements.genre,
                sensorMechanics: session.gameRequirements.sensorMechanics,
                difficulty: session.gameRequirements.difficulty
            });

            // Claude API 사용 가능 여부 확인
            if (!this.llm) {
                throw new Error('Claude API가 초기화되지 않았습니다. 환경변수를 확인해주세요.');
            }

            // 관련 컨텍스트 수집
            console.log('📚 컨텍스트 수집 중...');
            const context = await this.getGameDevelopmentContext(session.gameRequirements);

            // 장르별 특화 게임 생성 프롬프트
            const gameGenerationPrompt = this.generateGameCreationPrompt(session.gameRequirements, context);

            console.log('🤖 Claude API 호출 시작...');
            const aiRequestStartTime = Date.now();
            const response = await this.llm.invoke([{ role: 'user', content: gameGenerationPrompt }]);
            const aiRequestEndTime = Date.now();
            
            // AI 요청 성능 추적
            this.performanceMonitor.trackAIRequest(
                sessionId,
                'game_generation',
                aiRequestStartTime,
                aiRequestEndTime,
                null, // 토큰 사용량은 Claude API에서 직접 제공되지 않음
                true
            );
            
            console.log('✅ Claude API 응답 수신 완료');
            console.log(`📝 응답 길이: ${response.content.length} 문자`);

            // HTML 추출
            console.log('🔍 HTML 코드 추출 시도...');
            let gameCode = null;
            const htmlMatch = response.content.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
            
            if (htmlMatch) {
                gameCode = htmlMatch[0];
                console.log(`✅ HTML 추출 성공: ${gameCode.length} 문자`);
            } else {
                console.error('❌ HTML 추출 실패. 응답 내용:');
                console.error(response.content.substring(0, 500) + '...');
                
                // 대체 HTML 패턴 시도
                const altPatterns = [
                    /```html\s*([\s\S]*?)\s*```/i,
                    /<html[\s\S]*<\/html>/i,
                    /<!doctype[\s\S]*<\/html>/i
                ];
                
                for (const pattern of altPatterns) {
                    const match = response.content.match(pattern);
                    if (match) {
                        gameCode = match[1] || match[0];
                        console.log(`✅ 대체 패턴으로 HTML 발견: ${pattern}`);
                        console.log(`✅ 대체 HTML 추출 성공: ${gameCode.length} 문자`);
                        break;
                    }
                }
                
                if (!gameCode) {
                    throw new Error('유효한 HTML 게임 코드가 생성되지 않았습니다. Claude 응답에서 HTML을 찾을 수 없습니다.');
                }
            }

            // 게임 검증 (성능 추적 포함)
            console.log('🔍 게임 코드 검증 중...');
            const validationStartTime = Date.now();
            const validation = this.validateGameCode(gameCode);
            const validationEndTime = Date.now();
            
            // 검증 성능 추적
            this.performanceMonitor.trackValidation(
                sessionId,
                {
                    score: validation.score,
                    genre: session.gameRequirements.genre
                },
                validationEndTime - validationStartTime
            );
            
            this.performanceMonitor.recordStageCompletion(sessionId, 'validation', {
                score: validation.score,
                isValid: validation.isValid,
                duration: validationEndTime - validationStartTime
            });

            // 게임 메타데이터 생성
            const metadata = {
                title: session.gameRequirements.title,
                description: session.gameRequirements.description,
                gameType: session.gameRequirements.gameType,
                genre: session.gameRequirements.genre,
                difficulty: session.gameRequirements.difficulty,
                sensorMechanics: session.gameRequirements.sensorMechanics,
                generatedAt: new Date().toISOString(),
                sessionId: sessionId
            };

            // 게임 파일 저장
            console.log('💾 게임 파일 저장 중...');
            this.performanceMonitor.recordStageCompletion(sessionId, 'fileGeneration', {
                startTime: Date.now()
            });
            
            const saveResult = await this.saveGameToFiles(gameCode, metadata);
            
            if (!saveResult.success) {
                // 실패한 세션 완료 처리
                this.performanceMonitor.completeGameGeneration(sessionId, false, {
                    error: saveResult.error,
                    stage: 'file_save_failed'
                });
                throw new Error(`게임 파일 저장 실패: ${saveResult.error}`);
            }

            this.performanceMonitor.recordStageCompletion(sessionId, 'completion', {
                success: true,
                gamePath: saveResult.gamePath,
                gameId: saveResult.gameId
            });

            // 세션 정리
            session.stage = 'completed';
            session.lastUpdated = new Date().toISOString();

            // 성공적인 세션 완료 처리
            const performanceTracking = this.performanceMonitor.completeGameGeneration(sessionId, true, {
                validationScore: validation.score,
                gameId: saveResult.gameId,
                genre: session.gameRequirements.genre,
                gameType: session.gameRequirements.gameType
            });

            console.log(`✅ 게임 생성 및 저장 완료: ${session.gameRequirements.title}`);
            console.log(`📁 게임 경로: ${saveResult.gamePath}`);
            console.log(`📊 성능 통계: 총 소요시간 ${Math.round(performanceTracking.totalDuration/1000)}초`);

            return {
                success: true,
                sessionId: sessionId,
                gameCode: gameCode,
                metadata: metadata,
                validation: validation,
                requirements: session.gameRequirements,
                gamePath: saveResult.gamePath,
                gameId: saveResult.gameId,
                playUrl: saveResult.playUrl,
                performanceStats: {
                    totalDuration: performanceTracking.totalDuration,
                    validationScore: validation.score,
                    stageBreakdown: performanceTracking.stages
                }
            };

        } catch (error) {
            console.error('❌ 게임 생성 실패:', error);
            console.error('❌ 오류 세부 정보:', {
                message: error.message,
                stack: error.stack,
                sessionId: sessionId
            });
            
            // 실패한 세션 성능 추적 완료
            this.performanceMonitor.completeGameGeneration(sessionId, false, {
                error: error.message,
                errorType: error.constructor.name,
                stage: 'failed'
            });
            
            return {
                success: false,
                error: error.message,
                details: {
                    sessionId: sessionId,
                    timestamp: new Date().toISOString(),
                    errorType: error.constructor.name
                }
            };
        }
    }

    /**
     * 게임 개발 컨텍스트 수집
     */
    async getGameDevelopmentContext(requirements) {
        try {
            const queries = [
                `${requirements.gameType} 게임 개발 방법`,
                `${requirements.genre} 게임 구현`,
                `센서 데이터 ${requirements.sensorMechanics?.join(' ')} 활용`,
                'SessionSDK 기본 사용법',
                'GAME_TEMPLATE.html 구조'
            ];

            const contexts = [];
            for (const query of queries) {
                const retriever = this.vectorStore.asRetriever({
                    k: 2,
                    searchType: 'similarity'
                });
                const docs = await retriever.getRelevantDocuments(query);
                contexts.push(...docs.map(doc => doc.pageContent));
            }

            return contexts.slice(0, 8).join('\n\n---\n\n');

        } catch (error) {
            console.error('컨텍스트 수집 실패:', error);
            return '기본 개발 가이드를 참조하세요.';
        }
    }

    /**
     * 안전한 LLM 호출 (더미 모드 지원)
     */
    async safeInvokeLLM(prompt, stage = 'general', userMessage = '') {
        if (this.mockMode || !this.llm) {
            console.log('🎭 더미 모드 - 기본 응답 생성');
            return { content: this.generateMockResponse(stage, userMessage) };
        }
        
        try {
            return await this.llm.invoke([{ role: 'user', content: prompt }]);
        } catch (error) {
            console.error('❌ Claude API 호출 실패:', error);
            console.log('🎭 더미 모드로 대체');
            return { content: this.generateMockResponse(stage, userMessage) };
        }
    }

    /**
     * 더미 응답 생성
     */
    generateMockResponse(stage, userMessage) {
        switch (stage) {
            case 'initial':
                return `🎮 **흥미로운 게임 아이디어네요!**

"${userMessage}"에 대한 피드백을 드리겠습니다.

모바일 센서를 활용한 게임으로 개발하기에 매우 좋은 아이디어입니다. 다음과 같은 방향으로 구체화해보는 것이 어떨까요?

몇 가지 질문이 있습니다:
1. 혼자 플레이하는 게임인가요, 여러 명이 함께 하는 게임인가요?
2. 어떤 센서를 주로 사용하고 싶으신가요? (기울기, 흔들기, 회전 등)
3. 게임의 목표는 무엇인가요?

더 자세히 알려주시면 완벽한 게임으로 만들어드리겠습니다! ✨

{"readyForNext": false}`;

            case 'details':
                return `📝 **게임 세부사항을 구체화해보겠습니다.**

말씀해주신 내용을 바탕으로 게임의 세부 요소들을 정리해보았습니다.

추가로 알고 싶은 것들:
1. 게임의 난이도는 어느 정도로 생각하시나요?
2. 특별한 시각적 효과나 사운드가 필요한가요?
3. 점수나 레벨 시스템이 있나요?

이 정보들을 바탕으로 게임 메카닉을 설계해보겠습니다! 🎯

{"readyForNext": false}`;

            case 'mechanics':
                return `⚙️ **게임 메카닉 설계 중입니다.**

지금까지의 정보를 종합하여 게임 메카닉을 구성해보았습니다.

현재까지 정리된 내용:
- 게임 타입: Solo Game
- 기본 조작: 기울기 센서
- 목표: 점수 획득

이 설계가 맞는지 확인해주시고, 수정하고 싶은 부분이 있으면 알려주세요! 🔧

{"readyForNext": true}`;

            case 'confirmation':
                return `✅ **게임 생성을 확인해주세요.**

최종 게임 사양:
- 제목: 센서 게임
- 타입: Solo Game  
- 장르: 액션
- 조작: 모바일 센서

이대로 게임을 생성할까요? "확인" 또는 "생성"이라고 말씀해주시면 바로 게임을 만들어드리겠습니다! 🚀

{"readyForNext": true, "canGenerate": true}`;

            default:
                return `안녕하세요! 어떤 게임을 만들어드릴까요? 🎮`;
        }
    }

    /**
     * 관련 컨텍스트 검색
     */
    async getRelevantContext(userMessage) {
        try {
            // vectorStore가 초기화되지 않은 경우 기본 컨텍스트 반환
            if (!this.vectorStore) {
                console.log('⚠️ VectorStore가 초기화되지 않음 - 기본 컨텍스트 사용');
                return this.getDefaultContext();
            }

            const retriever = this.vectorStore.asRetriever({
                k: 3,
                searchType: 'similarity'
            });
            const docs = await retriever.getRelevantDocuments(userMessage);
            return docs.map(doc => doc.pageContent).join('\n\n');
        } catch (error) {
            console.error('컨텍스트 검색 실패:', error);
            console.log('📋 기본 컨텍스트 사용으로 대체');
            return this.getDefaultContext();
        }
    }

    /**
     * 기본 컨텍스트 반환 (RAG 사용 불가 시)
     */
    getDefaultContext() {
        return `# Sensor Game Hub 게임 개발 기본 정보

## 지원하는 게임 타입
- **Solo Game**: 1개 센서로 플레이하는 게임 (예: 공 굴리기, 미로 탈출)
- **Dual Game**: 2개 센서로 협력하는 게임 (예: 협동 퍼즐)
- **Multi Game**: 3-8명이 동시에 플레이하는 경쟁 게임

## 센서 데이터 구조
- **orientation**: alpha(회전), beta(앞뒤기울기), gamma(좌우기울기)
- **acceleration**: x(좌우), y(상하), z(앞뒤) 가속도
- **rotationRate**: 회전 속도

## 필수 개발 패턴
- SessionSDK 사용 필수
- 서버 연결 완료 후 세션 생성
- event.detail || event 패턴으로 이벤트 처리
- HTML5 Canvas 기반 렌더링`;
    }

    /**
     * 환영 메시지 생성
     */
    async generateWelcomeMessage() {
        return `🎮 **Sensor Game Hub 대화형 게임 생성기에 오신 것을 환영합니다!**

저는 여러분의 게임 아이디어를 현실로 만들어드리는 AI 개발 파트너입니다. 

📝 **어떤 게임을 만들고 싶으신가요?**

예를 들어:
- "스마트폰을 기울여서 공을 굴리는 미로 게임"
- "친구와 함께 흔들어서 요리하는 협력 게임"
- "여러 명이 경쟁하는 반응속도 테스트 게임"

아이디어를 자유롭게 말씀해주세요! 함께 완벽한 게임을 만들어보겠습니다. ✨`;
    }

    /**
     * 단계별 진행률 계산
     */
    getStageProgress(stage) {
        const stages = {
            'initial': { step: 1, total: 4, name: '아이디어 수집' },
            'details': { step: 2, total: 4, name: '세부사항 정의' },
            'mechanics': { step: 3, total: 4, name: '게임 메커니즘' },
            'confirmation': { step: 4, total: 4, name: '최종 확인' },
            'generating': { step: 4, total: 4, name: '게임 생성 중' },
            'completed': { step: 4, total: 4, name: '완료' }
        };

        return stages[stage] || { step: 1, total: 4, name: '시작' };
    }

    /**
     * 고도화된 게임 코드 검증 시스템
     */
    validateGameCode(gameCode) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            score: 100,
            details: {
                structure: { score: 0, max: 20 },
                sessionSDK: { score: 0, max: 30 },
                gameLogic: { score: 0, max: 25 },
                sensors: { score: 0, max: 15 },
                ui: { score: 0, max: 10 }
            }
        };

        try {
            // 1. HTML 구조 검증 (20점)
            this.validateHTMLStructure(gameCode, validation);
            
            // 2. SessionSDK 통합 검증 (30점)
            this.validateSessionSDK(gameCode, validation);
            
            // 3. 게임 로직 검증 (25점)
            this.validateGameLogic(gameCode, validation);
            
            // 4. 센서 처리 검증 (15점)
            this.validateSensorHandling(gameCode, validation);
            
            // 5. UI/UX 검증 (10점)
            this.validateUI(gameCode, validation);

            // 전체 점수 계산
            validation.score = Object.values(validation.details)
                .reduce((sum, category) => sum + category.score, 0);
                
            // 유효성 결정 (80점 이상이면 유효)
            validation.isValid = validation.errors.length === 0 && validation.score >= 80;

        } catch (error) {
            validation.errors.push(`검증 중 오류 발생: ${error.message}`);
            validation.isValid = false;
            validation.score = 0;
        }

        return validation;
    }

    /**
     * HTML 구조 검증
     */
    validateHTMLStructure(gameCode, validation) {
        let score = 0;
        
        // DOCTYPE 검증
        if (gameCode.includes('<!DOCTYPE html>')) {
            score += 5;
        } else {
            validation.errors.push('HTML5 DOCTYPE 선언이 없습니다');
        }

        // HTML 태그 검증
        if (gameCode.includes('<html>') && gameCode.includes('</html>')) {
            score += 5;
        } else {
            validation.errors.push('HTML 태그가 완전하지 않습니다');
        }

        // HEAD 섹션 검증
        if (gameCode.includes('<head>') && gameCode.includes('</head>')) {
            score += 3;
            if (gameCode.includes('<meta charset=')) score += 2;
            if (gameCode.includes('<title>')) score += 2;
        } else {
            validation.warnings.push('HEAD 섹션이 누락되었습니다');
        }

        // BODY 섹션 검증
        if (gameCode.includes('<body>') && gameCode.includes('</body>')) {
            score += 3;
        } else {
            validation.warnings.push('BODY 섹션이 누락되었습니다');
        }

        validation.details.structure.score = Math.min(score, 20);
    }

    /**
     * SessionSDK 통합 검증
     */
    validateSessionSDK(gameCode, validation) {
        let score = 0;

        // SDK 로드 검증
        if (gameCode.includes('SessionSDK.js') || gameCode.includes('SessionSDK')) {
            score += 10;
        } else {
            validation.errors.push('SessionSDK 로드 코드가 없습니다');
        }

        // SDK 초기화 검증
        if (gameCode.includes('new SessionSDK')) {
            score += 8;
            if (gameCode.includes('gameId:') && gameCode.includes('gameType:')) {
                score += 2;
            }
        } else {
            validation.errors.push('SessionSDK 초기화 코드가 없습니다');
        }

        // 이벤트 처리 패턴 검증
        if (gameCode.includes('event.detail || event')) {
            score += 5;
        } else {
            validation.warnings.push('CustomEvent 처리 패턴이 누락되었습니다');
        }

        // 연결 대기 패턴 검증
        if (gameCode.includes("sdk.on('connected'")) {
            score += 3;
        } else {
            validation.warnings.push('connected 이벤트 대기 패턴이 누락되었습니다');
        }

        // 세션 생성 패턴 검증
        if (gameCode.includes("session-created")) {
            score += 2;
        } else {
            validation.warnings.push('session-created 이벤트 처리가 누락되었습니다');
        }

        validation.details.sessionSDK.score = Math.min(score, 30);
    }

    /**
     * 게임 로직 검증
     */
    validateGameLogic(gameCode, validation) {
        let score = 0;

        // Canvas 요소 검증
        if (gameCode.includes('<canvas') || gameCode.includes('canvas')) {
            score += 8;
            if (gameCode.includes('getContext')) score += 2;
        } else {
            validation.warnings.push('Canvas 요소가 감지되지 않습니다');
        }

        // 게임 루프 검증
        if (gameCode.includes('requestAnimationFrame') || gameCode.includes('setInterval')) {
            score += 6;
        } else {
            validation.warnings.push('게임 루프가 감지되지 않습니다');
        }

        // 게임 상태 관리 검증
        const gameStates = ['playing', 'paused', 'gameOver', 'ready'];
        if (gameStates.some(state => gameCode.includes(state))) {
            score += 4;
        } else {
            validation.warnings.push('게임 상태 관리가 감지되지 않습니다');
        }

        // 점수 시스템 검증
        if (gameCode.includes('score') && (gameCode.includes('++') || gameCode.includes('+='))) {
            score += 3;
        } else {
            validation.warnings.push('점수 시스템이 감지되지 않습니다');
        }

        // 승리/실패 조건 검증
        if (gameCode.includes('win') || gameCode.includes('lose') || gameCode.includes('gameover')) {
            score += 2;
        } else {
            validation.warnings.push('승리/실패 조건이 명확하지 않습니다');
        }

        validation.details.gameLogic.score = Math.min(score, 25);
    }

    /**
     * 센서 처리 검증
     */
    validateSensorHandling(gameCode, validation) {
        let score = 0;

        // 센서 데이터 이벤트 검증
        if (gameCode.includes("sensor-data")) {
            score += 8;
        } else {
            validation.errors.push('센서 데이터 처리가 감지되지 않습니다');
        }

        // 센서 타입별 처리 검증
        const sensorTypes = ['orientation', 'acceleration', 'rotationRate'];
        const detectedSensors = sensorTypes.filter(type => gameCode.includes(type));
        score += detectedSensors.length * 2;

        // 센서 데이터 스무딩 검증
        if (gameCode.includes('smooth') || gameCode.includes('filter') || gameCode.includes('threshold')) {
            score += 3;
        } else {
            validation.warnings.push('센서 데이터 스무딩 처리가 권장됩니다');
        }

        validation.details.sensors.score = Math.min(score, 15);
    }

    /**
     * UI/UX 검증
     */
    validateUI(gameCode, validation) {
        let score = 0;

        // CSS 스타일 검증
        if (gameCode.includes('<style>') || gameCode.includes('css')) {
            score += 4;
            if (gameCode.includes('--primary') || gameCode.includes('var(--')) {
                score += 2;
            }
        } else {
            validation.warnings.push('CSS 스타일이 포함되지 않았습니다');
        }

        // 반응형 디자인 검증
        if (gameCode.includes('@media') || gameCode.includes('viewport')) {
            score += 2;
        } else {
            validation.warnings.push('반응형 디자인 고려가 권장됩니다');
        }

        // UI 요소 검증
        if (gameCode.includes('button') || gameCode.includes('onclick')) {
            score += 2;
        }

        validation.details.ui.score = Math.min(score, 10);
    }

    /**
     * 세션 정보 조회
     */
    getSession(sessionId) {
        return this.activeSessions.get(sessionId) || null;
    }

    /**
     * 활성 세션 목록
     */
    getActiveSessions() {
        return Array.from(this.activeSessions.keys());
    }

    /**
     * 세션 정리
     */
    cleanupSession(sessionId) {
        return this.activeSessions.delete(sessionId);
    }

    /**
     * 개선된 JSON 추출 로직
     */
    extractJSONFromResponse(content) {
        try {
            // 여러 JSON 패턴 시도
            const patterns = [
                /\{[^{}]*"ready[^}]*\}/g,  // readyFor... 키를 포함한 JSON
                /\{[^{}]*"gameType"[^}]*\}/g,  // gameType을 포함한 JSON
                /\{[^{}]*"sensorMechanics"[^}]*\}/g,  // sensorMechanics를 포함한 JSON
                /\{[^{}]*"gameplayElements"[^}]*\}/g,  // gameplayElements를 포함한 JSON
                /\{[\s\S]*?\}/g  // 일반적인 JSON 패턴
            ];

            for (const pattern of patterns) {
                const matches = content.match(pattern);
                if (matches) {
                    for (const match of matches) {
                        try {
                            const parsed = JSON.parse(match);
                            return parsed;
                        } catch (e) {
                            continue;
                        }
                    }
                }
            }

            return {};
        } catch (error) {
            console.log('JSON 추출 실패:', error);
            return {};
        }
    }

    /**
     * 메시지에서 JSON 제거
     */
    removeJSONFromMessage(content) {
        try {
            // JSON 패턴들을 제거
            return content
                .replace(/\{[\s\S]*?\}/g, '')
                .replace(/```json[\s\S]*?```/g, '')
                .trim();
        } catch (error) {
            return content;
        }
    }

    /**
     * 게임 타입 추론
     */
    inferGameType(userMessage) {
        const message = userMessage.toLowerCase();
        if (message.includes('친구') || message.includes('둘이') || message.includes('협력')) {
            return 'dual';
        } else if (message.includes('여러') || message.includes('경쟁') || message.includes('멀티')) {
            return 'multi';
        }
        return 'solo';
    }

    /**
     * 장르 추론
     */
    inferGenre(userMessage) {
        const message = userMessage.toLowerCase();
        if (message.includes('미로')) return '미로 게임';
        if (message.includes('공') || message.includes('볼')) return '물리 게임';
        if (message.includes('반응') || message.includes('빠르')) return '반응속도 게임';
        if (message.includes('우주') || message.includes('비행')) return '시뮬레이션';
        if (message.includes('요리')) return '시뮬레이션';
        if (message.includes('벽돌') || message.includes('블록')) return '아케이드';
        return '액션 게임';
    }

    /**
     * 제목 생성
     */
    generateTitle(userMessage) {
        const message = userMessage.toLowerCase();
        if (message.includes('미로')) return '센서 미로 게임';
        if (message.includes('공')) return '센서 볼 게임';
        if (message.includes('반응')) return '센서 반응속도 게임';
        if (message.includes('우주')) return '센서 우주선 게임';
        if (message.includes('요리')) return '센서 요리 게임';
        if (message.includes('벽돌')) return '센서 벽돌깨기';
        return '센서 게임';
    }

    /**
     * 세부사항 최소 요구사항 체크
     */
    hasMinimumDetailsRequirements(requirements) {
        return requirements && 
               requirements.gameType && 
               requirements.title && 
               requirements.description;
    }

    /**
     * 메커니즘 최소 요구사항 체크
     */
    hasMinimumMechanicsRequirements(requirements) {
        return requirements && 
               requirements.gameType && 
               requirements.sensorMechanics && 
               requirements.difficulty && 
               requirements.objectives;
    }

    /**
     * 게임 파일 저장
     */
    async saveGameToFiles(gameCode, metadata) {
        try {
            const gameId = this.generateGameId(metadata.title);
            const gamePath = path.join(process.cwd(), 'public', 'games', gameId);
            
            console.log(`📁 게임 폴더 생성: ${gamePath}`);
            
            // 게임 폴더 생성
            await fs.mkdir(gamePath, { recursive: true });
            
            // index.html 파일 저장
            const indexPath = path.join(gamePath, 'index.html');
            await fs.writeFile(indexPath, gameCode, 'utf8');
            console.log(`✅ index.html 저장 완료: ${indexPath}`);
            
            // game.json 메타데이터 파일 저장
            const gameJson = {
                ...metadata,
                gameId: gameId,
                filePaths: {
                    index: 'index.html'
                },
                createdAt: new Date().toISOString(),
                version: '1.0.0'
            };
            
            const metadataPath = path.join(gamePath, 'game.json');
            await fs.writeFile(metadataPath, JSON.stringify(gameJson, null, 2), 'utf8');
            console.log(`✅ game.json 저장 완료: ${metadataPath}`);
            
            // README.md 파일 생성
            const readme = this.generateReadme(metadata);
            const readmePath = path.join(gamePath, 'README.md');
            await fs.writeFile(readmePath, readme, 'utf8');
            console.log(`✅ README.md 저장 완료: ${readmePath}`);
            
            // 🔍 게임 자동 검증 실행 (메타데이터 포함)
            console.log(`🔍 게임 검증 시작: ${gameId}`);
            const validationResult = await this.gameValidator.validateGame(gameId, gamePath, metadata);
            
            // 검증 보고서 생성 및 출력
            const validationReport = this.gameValidator.generateReport(validationResult);
            console.log(validationReport);
            
            // 검증 결과를 파일로 저장 (개발자용)
            const reportPath = path.join(gamePath, 'VALIDATION_REPORT.md');
            await fs.writeFile(reportPath, validationReport, 'utf8');
            console.log(`📋 검증 보고서 저장: ${reportPath}`);
            
            const playUrl = `/games/${gameId}/`;
            
            return {
                success: true,
                gameId: gameId,
                gamePath: gamePath,
                playUrl: playUrl,
                validation: validationResult,
                files: {
                    index: indexPath,
                    metadata: metadataPath,
                    readme: readmePath,
                    validation: reportPath
                }
            };
            
        } catch (error) {
            console.error('❌ 게임 파일 저장 실패:', error);
            return {
                success: false,
                error: error.message,
                details: error.stack
            };
        }
    }

    /**
     * 게임 ID 생성 (제목을 기반으로 안전한 폴더명 생성)
     */
    generateGameId(title) {
        // 제목을 안전한 폴더명으로 변환
        const baseId = title
            .toLowerCase()
            .replace(/[^a-z0-9가-힣\s]/g, '') // 알파벳, 숫자, 한글, 공백만 허용
            .replace(/\s+/g, '-') // 공백을 하이픈으로 변경
            .replace(/-+/g, '-') // 연속 하이픈 제거
            .replace(/^-|-$/g, '') // 시작/끝 하이픈 제거
            .substring(0, 50); // 최대 50자
            
        // 타임스탬프 추가로 고유성 보장
        const timestamp = Date.now().toString().slice(-6);
        return `${baseId}-${timestamp}`;
    }

    /**
     * README.md 파일 내용 생성
     */
    generateReadme(metadata) {
        return `# ${metadata.title}

${metadata.description}

## 게임 정보
- **타입**: ${metadata.gameType}
- **장르**: ${metadata.genre}
- **난이도**: ${metadata.difficulty}
- **센서 메커니즘**: ${metadata.sensorMechanics?.join(', ')}

## 플레이 방법
1. 게임 화면에 표시되는 QR 코드를 모바일로 스캔하거나
2. 세션 코드를 센서 클라이언트에 입력하세요
3. 센서가 연결되면 게임이 시작됩니다!

## 생성 정보
- **생성 시간**: ${metadata.generatedAt}
- **세션 ID**: ${metadata.sessionId}
- **버전**: 1.0.0

---
🎮 Generated by Sensor Game Hub v6.0 Interactive Game Generator
`;
    }

    /**
     * 🎯 요구사항 기반 게임 생성 시작 (새로운 워크플로)
     * RequirementCollector와 통합된 고도화된 게임 생성 프로세스
     */
    async startRequirementBasedGeneration(userId, initialMessage = '') {
        try {
            console.log('🎯 요구사항 기반 게임 생성 시작...');
            
            // 요구사항 수집 세션 시작
            const requirementSession = this.requirementCollector.startSession(userId, initialMessage);
            
            // 게임 생성 세션도 병렬로 시작
            const gameSession = this.startSession();
            
            // 두 세션을 연결
            const integratedSession = {
                gameSessionId: gameSession.sessionId,
                requirementSessionId: requirementSession.sessionId,
                userId: userId,
                startTime: new Date(),
                phase: 'requirement_collection', // requirement_collection -> game_generation -> finalization
                requirementProgress: requirementSession.progress,
                nextQuestion: requirementSession.nextQuestion,
                isActive: true
            };

            // 통합 세션 저장
            this.activeSessions.set(`integrated_${gameSession.sessionId}`, integratedSession);

            console.log(`✅ 통합 세션 시작 완료 - ID: integrated_${gameSession.sessionId}`);

            return {
                success: true,
                sessionId: `integrated_${gameSession.sessionId}`,
                phase: 'requirement_collection',
                nextQuestion: requirementSession.nextQuestion,
                progress: requirementSession.progress,
                message: this.generateWelcomeMessage(initialMessage)
            };

        } catch (error) {
            console.error('❌ 요구사항 기반 생성 시작 실패:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 🎯 통합 세션에서 사용자 입력 처리
     */
    async processIntegratedSession(sessionId, userInput) {
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session) {
                throw new Error('세션을 찾을 수 없습니다.');
            }

            console.log(`📝 통합 세션 처리: ${sessionId}, 현재 단계: ${session.phase}`);

            if (session.phase === 'requirement_collection') {
                return await this.handleRequirementCollection(session, userInput);
            } else if (session.phase === 'game_generation') {
                return await this.handleGameGeneration(session, userInput);
            } else if (session.phase === 'finalization') {
                return await this.handleFinalization(session, userInput);
            }

            throw new Error('알 수 없는 세션 단계입니다.');

        } catch (error) {
            console.error('❌ 통합 세션 처리 실패:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 요구사항 수집 단계 처리
     */
    async handleRequirementCollection(session, userInput) {
        try {
            // RequirementCollector로 입력 처리
            const result = this.requirementCollector.processUserInput(
                session.requirementSessionId, 
                userInput
            );

            // 진행 상황 업데이트
            session.requirementProgress = result.progress;

            if (result.isComplete) {
                // 요구사항 수집 완료 - 게임 생성 단계로 전환
                console.log('✅ 요구사항 수집 완료, 게임 생성 단계로 전환');
                
                session.phase = 'game_generation';
                session.finalRequirements = this.requirementCollector.completeSession(session.requirementSessionId);
                
                // 수집된 요구사항으로 게임 생성 시작
                const gameGenerationStart = await this.initializeGameGeneration(session);

                return {
                    success: true,
                    sessionId: session.gameSessionId,
                    phase: 'game_generation',
                    message: gameGenerationStart.message,
                    requirements: session.finalRequirements.requirements,
                    progress: { 
                        requirementCollection: 100,
                        gameGeneration: 0 
                    }
                };
            } else {
                // 다음 질문 제공
                return {
                    success: true,
                    sessionId: session.gameSessionId,
                    phase: 'requirement_collection',
                    nextQuestion: result.nextQuestion,
                    progress: result.progress,
                    message: this.generateProgressMessage(result),
                    extractedInfo: result.extractedInfo
                };
            }

        } catch (error) {
            console.error('❌ 요구사항 수집 처리 실패:', error);
            throw error;
        }
    }

    /**
     * 게임 생성 단계 초기화
     */
    async initializeGameGeneration(session) {
        try {
            const gameSession = this.activeSessions.get(session.gameSessionId);
            if (!gameSession) {
                throw new Error('게임 세션을 찾을 수 없습니다.');
            }

            // 요구사항을 게임 세션에 적용
            this.applyRequirementsToGameSession(gameSession, session.finalRequirements.requirements);

            return {
                message: `✅ 요구사항 분석 완료! 다음과 같은 게임을 생성하겠습니다:

🎮 **${gameSession.gameRequirements.title}**
${gameSession.gameRequirements.description}

**게임 세부사항:**
- 장르: ${session.finalRequirements.requirements.genre}
- 타입: ${session.finalRequirements.requirements.gameType}
- 난이도: ${session.finalRequirements.requirements.difficulty}
- 조작 방식: ${session.finalRequirements.requirements.mechanics.join(', ')}

게임 생성을 시작하려면 "생성"이라고 말씀해주세요!`,
                gameRequirements: gameSession.gameRequirements
            };

        } catch (error) {
            console.error('❌ 게임 생성 초기화 실패:', error);
            throw error;
        }
    }

    /**
     * 게임 생성 단계 처리
     */
    async handleGameGeneration(session, userInput) {
        try {
            // 기존 게임 생성 로직 활용하되, 수집된 요구사항 반영
            const gameSession = this.activeSessions.get(session.gameSessionId);
            if (!gameSession) {
                throw new Error('게임 세션을 찾을 수 없습니다.');
            }

            // 요구사항을 게임 세션에 반영
            this.applyRequirementsToGameSession(gameSession, session.finalRequirements.requirements);

            // 기존 processMessage 로직 활용
            const result = await this.processMessage(session.gameSessionId, userInput);

            if (result.canGenerate) {
                session.phase = 'finalization';
            }

            return {
                ...result,
                phase: session.phase,
                requirements: session.finalRequirements.requirements
            };

        } catch (error) {
            console.error('❌ 게임 생성 처리 실패:', error);
            throw error;
        }
    }

    /**
     * 마무리 단계 처리
     */
    async handleFinalization(session, userInput) {
        try {
            // 최종 게임 생성
            if (userInput.toLowerCase().includes('생성') || userInput.toLowerCase().includes('완료')) {
                const finalResult = await this.generateGame(session.gameSessionId);
                
                session.phase = 'completed';
                session.endTime = new Date();
                
                return {
                    ...finalResult,
                    phase: 'completed',
                    requirements: session.finalRequirements.requirements,
                    sessionSummary: this.generateSessionSummary(session)
                };
            }

            // 추가 수정 요청 처리
            return await this.handleGameGeneration(session, userInput);

        } catch (error) {
            console.error('❌ 마무리 단계 처리 실패:', error);
            throw error;
        }
    }

    /**
     * 요구사항을 게임 세션에 적용
     */
    applyRequirementsToGameSession(gameSession, requirements) {
        gameSession.gameRequirements = {
            title: this.generateGameTitle(requirements),
            description: this.generateGameDescription(requirements),
            gameType: requirements.gameType,
            genre: requirements.genre,
            difficulty: requirements.difficulty,
            sensorMechanics: requirements.mechanics,
            objectives: requirements.objectives,
            visuals: requirements.visuals,
            specialFeatures: requirements.specialFeatures
        };

        // 확인 단계로 바로 설정 (요구사항이 명확하므로)
        gameSession.stage = 'confirmation';
    }

    /**
     * 게임 제목 생성
     */
    generateGameTitle(requirements) {
        const genreMap = {
            action: '액션',
            puzzle: '퍼즐',
            physics: '물리',
            cooking: '요리',
            racing: '레이싱',
            casual: '캐주얼'
        };

        const typeMap = {
            solo: '솔로',
            dual: '듀얼',
            multi: '멀티'
        };

        const genre = genreMap[requirements.genre] || '센서';
        const type = typeMap[requirements.gameType] || '';
        
        return `${genre} ${type} 게임`.trim();
    }

    /**
     * 게임 설명 생성
     */
    generateGameDescription(requirements) {
        const mechanics = requirements.mechanics.join(', ');
        const objectives = requirements.objectives.slice(0, 2).join('하고 ');
        
        return `${mechanics}을 통해 ${objectives}하는 ${requirements.genre} 장르의 ${requirements.gameType} 게임입니다.`;
    }

    /**
     * 환영 메시지 생성
     */
    generateWelcomeMessage(initialMessage) {
        if (initialMessage) {
            return `안녕하세요! 귀하의 아이디어를 바탕으로 완벽한 센서 게임을 만들어드리겠습니다. 
            
몇 가지 질문을 통해 게임의 세부사항을 구체화해보겠습니다.`;
        }
        
        return `안녕하세요! 센서 게임 생성 시스템입니다. 
        
어떤 게임을 만들고 싶으신가요? 아이디어를 자유롭게 말씀해주세요!`;
    }

    /**
     * 진행 메시지 생성
     */
    generateProgressMessage(result) {
        const progress = Math.round(result.progress.percentage);
        const completionScore = Math.round(result.completionScore);
        
        let message = `현재 진행률: ${progress}% (완성도: ${completionScore}점)\n\n`;
        
        if (result.nextQuestion) {
            message += `📋 ${result.nextQuestion.text}`;
        }
        
        if (result.extractedInfo) {
            message += '\n\n✅ 현재까지 파악된 정보:';
            
            if (result.extractedInfo.genre) {
                message += `\n- 장르: ${result.extractedInfo.genre}`;
            }
            if (result.extractedInfo.gameType) {
                message += `\n- 게임 타입: ${result.extractedInfo.gameType}`;
            }
            if (result.extractedInfo.mechanics && result.extractedInfo.mechanics.length > 0) {
                message += `\n- 조작 방식: ${result.extractedInfo.mechanics.join(', ')}`;
            }
        }
        
        return message;
    }

    /**
     * 세션 요약 생성
     */
    generateSessionSummary(session) {
        const duration = session.endTime - session.startTime;
        const durationMinutes = Math.round(duration / (1000 * 60));
        
        return {
            totalDuration: `${durationMinutes}분`,
            requirementCollectionScore: session.finalRequirements.completionScore,
            gameGenerationSuccess: session.phase === 'completed',
            finalRequirements: session.finalRequirements.requirements
        };
    }

    /**
     * 🎯 요구사항 수집 상태 조회
     */
    getRequirementCollectionStatus(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session || !session.requirementSessionId) {
            return null;
        }

        return this.requirementCollector.getSessionStatus(session.requirementSessionId);
    }

    /**
     * 헬스 체크 (성능 모니터링 정보 포함)
     */
    async healthCheck() {
        try {
            const performanceAnalysis = this.performanceMonitor.generatePerformanceAnalysis();
            
            return {
                success: true,
                status: 'healthy',
                components: {
                    claude: this.llm ? 'initialized' : 'not_initialized',
                    supabase: this.supabaseClient ? 'connected' : 'disconnected',
                    vectorStore: this.vectorStore ? 'initialized' : 'not_initialized',
                    requirementCollector: this.requirementCollector ? 'initialized' : 'not_initialized',
                    performanceMonitor: this.performanceMonitor ? 'initialized' : 'not_initialized'
                },
                activeSessions: this.activeSessions.size,
                requirementCollectorStats: this.requirementCollector.getStatistics(),
                performanceStats: {
                    totalGenerations: performanceAnalysis.overview.totalGenerations,
                    successRate: performanceAnalysis.overview.successRate,
                    averageGenerationTime: Math.round(performanceAnalysis.overview.averageTime / 1000) + 's',
                    averageAIResponseTime: Math.round(performanceAnalysis.overview.aiPerformance.averageResponseTime) + 'ms',
                    activeMonitoringSessions: this.performanceMonitor.activeSessions.size
                },
                systemHealth: {
                    memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                    uptime: Math.round(process.uptime()) + 's',
                    nodeVersion: process.version
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 성능 대시보드 데이터 조회
     */
    getPerformanceDashboard() {
        return this.performanceMonitor.getDashboardData();
    }

    /**
     * 성능 분석 리포트 생성
     */
    generatePerformanceReport() {
        return this.performanceMonitor.generatePerformanceAnalysis();
    }
}

module.exports = InteractiveGameGenerator;