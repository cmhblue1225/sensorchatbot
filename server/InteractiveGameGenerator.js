/**
 * 🎯 InteractiveGameGenerator v2.0
 * 
 * 대화형 AI 게임 생성 시스템
 * - Claude API 중심의 단순화된 아키텍처
 * - 다중 턴 대화를 통한 요구사항 명확화
 * - Supabase RAG 시스템 활용
 * - 실행 가능한 고품질 게임 생성 보장
 */

const Anthropic = require('@anthropic-ai/sdk');
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
    constructor(gameScanner = null, io = null, gameMaintenanceManager = null) {
        this.config = {
            claudeApiKey: process.env.CLAUDE_API_KEY,
            openaiApiKey: process.env.OPENAI_API_KEY,
            supabaseUrl: process.env.SUPABASE_URL,
            supabaseKey: process.env.SUPABASE_ANON_KEY,
            supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,  // Storage 업로드용
            // 🚀 V4 UPGRADE: Claude Sonnet 4.5 (최신 모델)
            claudeModel: 'claude-sonnet-4-5-20250929',  // Claude Sonnet 4.5 (2025.09.29)
            claudeOpusModel: 'claude-opus-4-1-20250805',  // Claude Opus 4.1 (32k max)
            maxTokens: 64000,  // ✅ Claude Sonnet 4.5 최대 출력 토큰 (8x 증가!)
            temperature: 0.3,  // 🎯 일관성 강화: 0.7 → 0.3 (버그 감소)
            // RAG 설정
            ragTopK: 5,        // 검색 문서 수 증가: 3 → 5
            ragSimilarityThreshold: 0.7,  // 유사도 임계값
            // 품질 보증
            minQualityScore: 95,  // 최소 품질 점수
            maxRetries: 3         // 실패 시 재시도 횟수
        };

        // 컴포넌트 초기화
        this.supabaseClient = null;
        this.supabaseAdminClient = null;  // Storage 업로드용 (Service Role)
        this.vectorStore = null;
        this.embeddings = null;
        this.llm = null;
        this.mockMode = false;

        // GameScanner 주입 (자동 스캔을 위해)
        this.gameScanner = gameScanner;

        // Socket.IO 주입 (진행률 트래킹을 위해)
        this.io = io;

        // GameMaintenanceManager 주입 (게임 생성 후 자동 등록)
        this.gameMaintenanceManager = gameMaintenanceManager;

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

            // Supabase Admin 클라이언트 초기화 (Storage 업로드용)
            if (this.config.supabaseUrl && this.config.supabaseServiceKey) {
                this.supabaseAdminClient = createClient(
                    this.config.supabaseUrl,
                    this.config.supabaseServiceKey
                );
                console.log('✅ Supabase Admin Client 초기화 완료 (Storage 업로드용)');
            }

            // OpenAI 임베딩 초기화
            if (this.config.openaiApiKey) {
                this.embeddings = new OpenAIEmbeddings({
                    openAIApiKey: this.config.openaiApiKey,
                    modelName: 'text-embedding-3-small',
                });
            }

            // 🚀 Anthropic SDK만 사용 (LangChain 완전 제거 - top_p 문제 해결)
            this.anthropicClient = new Anthropic({
                apiKey: this.config.claudeApiKey
            });

            console.log('✅ Anthropic SDK 초기화 완료 (LangChain 미사용)');

            // Supabase 벡터 저장소 초기화
            if (this.supabaseClient && this.embeddings) {
                console.log('🔍 Supabase Vector Store 초기화 중...');
                this.vectorStore = new SupabaseVectorStore(this.embeddings, {
                    client: this.supabaseClient,
                    tableName: 'game_knowledge',
                    // queryName 제거 - Supabase 기본 유사도 검색 사용
                });
                console.log('✅ Vector Store 초기화 완료 (game_knowledge 테이블)');
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
    async startNewSession(sessionId, creatorId = null) {
        try {
            // 성능 추적 시작
            const performanceTracking = this.performanceMonitor.startGameGenerationTracking(sessionId, {
                sessionType: 'traditional',
                startMethod: 'startNewSession'
            });

            // ✨ 자유 대화 시스템: 단계 없이 자연스러운 대화
            const session = {
                id: sessionId,
                creatorId: creatorId,      // 🔐 게임 제작자 ID (권한 관리용)
                // ❌ stage 필드 제거: 4단계 강제 없음
                conversationHistory: [],  // { role: 'user|assistant', content: '...' }
                collectedInfo: {
                    gameType: null,        // 'solo', 'dual', 'multi'
                    genre: null,           // '액션', '퍼즐', '물리', '요리' 등
                    title: null,
                    description: null,
                    mechanics: [],         // 핵심 메카닉
                    sensorUsage: [],       // 센서 사용 방법
                    difficulty: null,      // '쉬움', '보통', '어려움'
                    visualStyle: null,     // 시각적 스타일
                    additionalFeatures: [] // 특수 기능들
                },
                infoCompleteness: 0,       // 0-100% 정보 수집 완성도
                readyToGenerate: false,    // 게임 생성 가능 여부
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
                content: welcomeMessage
            });

            return {
                success: true,
                sessionId: sessionId,
                message: welcomeMessage,
                sessionData: {
                    infoCompleteness: 0,
                    readyToGenerate: false,
                    collectedInfo: session.collectedInfo
                }
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
     * ✨ 자유 대화 시스템: 사용자 메시지 처리 및 응답 생성
     */
    async processUserMessage(sessionId, userMessage) {
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session) {
                throw new Error('세션을 찾을 수 없습니다.');
            }

            // 사용자 메시지 히스토리에 추가
            session.conversationHistory.push({
                role: 'user',
                content: userMessage
            });

            // ✨ 자유 대화 처리 (단계 없음)
            const response = await this.processFreeformConversation(session, userMessage);

            // AI 응답 히스토리에 추가
            session.conversationHistory.push({
                role: 'assistant',
                content: response.message
            });

            // 세션 상태 업데이트
            if (response.metadata) {
                if (response.metadata.collectedInfo) {
                    Object.assign(session.collectedInfo, response.metadata.collectedInfo);
                }
                if (typeof response.metadata.infoCompleteness === 'number') {
                    session.infoCompleteness = response.metadata.infoCompleteness;
                }
                if (typeof response.metadata.readyToGenerate === 'boolean') {
                    session.readyToGenerate = response.metadata.readyToGenerate;
                }
            }
            session.lastUpdated = new Date().toISOString();

            return {
                success: true,
                sessionId: sessionId,
                message: response.message,
                metadata: {
                    infoCompleteness: session.infoCompleteness,
                    readyToGenerate: session.readyToGenerate,
                    collectedInfo: session.collectedInfo,
                    nextAction: session.readyToGenerate ? 'generate' : 'ask_more'
                },
                sessionData: {  // backward compatibility
                    infoCompleteness: session.infoCompleteness,
                    readyToGenerate: session.readyToGenerate,
                    collectedInfo: session.collectedInfo
                }
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
     * ✨ 자유 대화 처리 (Claude 4 Best Practices 적용)
     *
     * 단계 없이 자연스럽게 대화하며 게임 정보 수집
     */
    async processFreeformConversation(session, userMessage) {
        try {
            console.log('💬 자유 대화 처리 중...');

            // 1. 대화 프롬프트 생성
            const conversationPrompt = this.buildConversationPrompt(session, userMessage);

            // 2. Claude AI 호출 (프롬프트 캐싱 적용)
            const aiResponse = await this.callClaudeForConversation(conversationPrompt, session.conversationHistory);

            // 3. AI 응답 파싱
            const { text, metadata } = this.parseAIResponse(aiResponse);

            console.log('✅ 자유 대화 처리 완료');
            console.log('📊 정보 완성도:', metadata?.infoCompleteness || 0, '%');
            console.log('🎮 생성 가능:', metadata?.readyToGenerate || false);

            return {
                success: true,
                message: text,
                metadata: metadata || null
            };

        } catch (error) {
            console.error('❌ 자유 대화 처리 실패:', error);
            return {
                success: false,
                message: '죄송합니다. 응답 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
                metadata: null
            };
        }
    }

    /**
     * 🧠 대화 프롬프트 생성 (Claude 4 Best Practices)
     */
    buildConversationPrompt(session, userMessage) {
        return `당신은 Sensor Game Hub v6.0의 친절한 게임 기획 전문가입니다.

<role_and_mission>
**역할**: 사용자와 자연스러운 대화를 나누며 게임 아이디어를 구체화하는 전문가
**미션**: 충분한 정보를 수집하여 완벽한 센서 게임을 생성할 수 있도록 돕기
</role_and_mission>

<conversation_guidelines>
1. **자연스러운 대화**: 단계나 턴에 구애받지 않고 자유롭게 대화하세요
2. **적극적인 질문**: 불확실한 부분은 구체적으로 질문하세요 (한 번에 1-2개)
3. **중간 요약**: 중요한 정보가 모이면 자연스럽게 요약하여 확인받으세요
4. **유연한 수정**: 사용자가 언제든 내용을 수정할 수 있도록 열린 태도를 유지하세요
5. **명령 인식**: "요약해줘", "확인", "생성" 등의 명령을 즉시 인식하세요
6. **마크다운 최소화**: **굵게**, *기울임*, ## 제목, - 리스트 등을 사용하지 마세요. 자연스러운 문장으로 대화하세요.
</conversation_guidelines>

<information_to_collect>
필수 정보 (최소 수집):
- **게임 타입** (solo/dual/multi): 혼자 플레이인지, 여러 명이 함께 하는지
- **센서 사용법**: 어떤 센서를 어떻게 사용할지 (기울기/흔들기/회전)
- **게임 목표**: 무엇을 달성하는 게임인지

선택 정보 (더 좋은 게임을 위해):
- 게임 장르 (액션/퍼즐/물리/요리/레이싱 등)
- 게임 제목
- 난이도 (쉬움/보통/어려움)
- 시각적 스타일
- 특수 기능 (타이머/점수/레벨/콤보 등)
</information_to_collect>

<commands_to_recognize>
사용자가 다음 명령을 하면 즉시 응답하세요:
- "요약" 또는 "정리" → 지금까지 수집한 정보를 정리하여 보여주고 확인 요청
- "수정" → 특정 부분을 변경할 수 있도록 안내
- "확인", "생성", "만들어줘", "만들어" → readyToGenerate: true 반환
</commands_to_recognize>

<output_format>
응답 마지막에 반드시 다음 JSON을 포함하세요:

JSON_START
{
  "collectedInfo": {
    "gameType": "solo" | "dual" | "multi" | null,
    "genre": "액션" | "퍼즐" | "물리" | "요리" | "레이싱" | null,
    "title": "게임 제목" | null,
    "description": "간단한 설명" | null,
    "mechanics": ["메카닉1", "메카닉2"] | [],
    "sensorUsage": ["기울기", "흔들기", "회전"] | [],
    "difficulty": "쉬움" | "보통" | "어려움" | null,
    "visualStyle": "설명" | null,
    "additionalFeatures": ["타이머", "점수"] | []
  },
  "infoCompleteness": 0-100,
  "readyToGenerate": false | true,
  "nextAction": "ask_more" | "summarize" | "generate"
}
JSON_END

**절대 금지**:
- 백틱 3개 사용 금지
- 마크다운 코드 블록 금지
- HTML 태그 사용 금지
- JSON 앞뒤로 JSON_START와 JSON_END 마커만 사용

**예시**:
사용자의 아이디어가 흥미롭네요! 센서를 활용한 게임이군요.

JSON_START
{"collectedInfo":{"gameType":"solo","genre":"액션",...},"infoCompleteness":50,"readyToGenerate":false,"nextAction":"ask_more"}
JSON_END
</output_format>

<current_conversation_state>
지금까지 수집된 정보:
${JSON.stringify(session.collectedInfo, null, 2)}

정보 완성도: ${session.infoCompleteness}%
생성 가능: ${session.readyToGenerate}
</current_conversation_state>

<conversation_history>
${session.conversationHistory.slice(-6).map(msg =>
  `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}`
).join('\n\n')}
</conversation_history>

<current_user_message>
사용자: ${userMessage}
</current_user_message>

이제 위 메시지에 자연스럽게 응답하세요. 마크다운 없이 부드러운 문장으로 대화하고, 응답 마지막에 JSON을 포함하세요.`;
    }

    /**
     * 🤖 Claude AI 호출 (프롬프트 캐싱 적용)
     */
    async callClaudeForConversation(systemPrompt, conversationHistory) {
        // 더미 모드 체크
        if (this.mockMode || !this.anthropicClient) {
            console.log('🎭 더미 모드 - 기본 응답 생성');
            return {
                content: [{
                    type: 'text',
                    text: `좋아요! 어떤 게임을 만들고 싶으신가요? 혼자 플레이하는 게임인가요, 친구들과 함께 하는 게임인가요?

JSON_START
{"collectedInfo":{"gameType":null,"genre":null,"title":null,"description":null,"mechanics":[],"sensorUsage":[],"difficulty":null,"visualStyle":null,"additionalFeatures":[]},"infoCompleteness":10,"readyToGenerate":false,"nextAction":"ask_more"}
JSON_END`
                }]
            };
        }

        try {
            // 대화 히스토리를 증분 캐싱 포맷으로 변환
            const messages = conversationHistory.map((msg, idx) => {
                // 마지막 메시지에 캐싱 적용
                if (idx === conversationHistory.length - 1) {
                    return {
                        role: msg.role,
                        content: [{
                            type: "text",
                            text: msg.content,
                            cache_control: { type: "ephemeral" }
                        }]
                    };
                }
                return { role: msg.role, content: msg.content };
            });

            const response = await this.anthropicClient.messages.create({
                model: this.config.claudeModel,
                max_tokens: 4096,  // 대화는 긴 응답 필요 없음
                temperature: 0.3,  // 일관성 중요
                // ✨ 시스템 프롬프트 캐싱 (5분 TTL)
                system: [{
                    type: "text",
                    text: systemPrompt,
                    cache_control: { type: "ephemeral" }
                }],
                messages: messages
            });

            // 캐시 통계 로깅
            if (response.usage) {
                const cacheRead = response.usage.cache_read_input_tokens || 0;
                const cacheCreate = response.usage.cache_creation_input_tokens || 0;
                console.log('📊 프롬프트 캐싱:', {
                    cache_read: cacheRead,
                    cache_create: cacheCreate,
                    cache_hit: cacheRead > 0 ? '✅' : '❌'
                });
            }

            return response;

        } catch (error) {
            console.error('❌ Claude API 호출 실패:', error);
            throw error;
        }
    }

    /**
     * 📝 AI 응답 파싱 (텍스트 + JSON 메타데이터)
     */
    parseAIResponse(aiResponse) {
        try {
            let fullText = aiResponse.content[0].text;

            // 1️⃣ 마크다운 코드 블록 제거 (```json ... ``` 형식)
            fullText = fullText.replace(/```json\s*/g, '');
            fullText = fullText.replace(/```\s*/g, '');

            // 2️⃣ HTML 태그 제거 (<code>, <pre> 등)
            fullText = fullText.replace(/<[^>]*>/g, '');

            // 3️⃣ JSON_START ... JSON_END 사이의 JSON 추출
            let metadata = null;
            let text = fullText;

            const jsonStartMatch = fullText.match(/JSON_START\s*([\s\S]*?)\s*JSON_END/);

            if (jsonStartMatch) {
                try {
                    const jsonString = jsonStartMatch[1].trim();
                    metadata = JSON.parse(jsonString);

                    // JSON 부분 완전히 제거 (JSON_START ~ JSON_END까지)
                    text = fullText.replace(/JSON_START[\s\S]*?JSON_END/, '').trim();

                    console.log('✅ JSON 메타데이터 파싱 성공');
                } catch (parseError) {
                    console.warn('⚠️ JSON 파싱 실패:', parseError.message);
                    // JSON_START/END 사이 내용 출력 (디버깅용)
                    console.warn('JSON 원본:', jsonStartMatch[1]);
                }
            } else {
                // 폴백: JSON_START/END 없으면 마지막 {...} 블록 찾기
                const jsonMatch = fullText.match(/\{[\s\S]*\}(?=[^{]*$)/);
                if (jsonMatch) {
                    try {
                        metadata = JSON.parse(jsonMatch[0]);
                        text = fullText.substring(0, jsonMatch.index).trim();
                        console.log('⚠️ JSON_START/END 마커 없음 - 폴백 파싱 사용');
                    } catch (parseError) {
                        console.warn('⚠️ 폴백 JSON 파싱도 실패:', parseError.message);
                    }
                }
            }

            // 4️⃣ 텍스트에서 남은 특수 문자 정리
            text = text.replace(/\n{3,}/g, '\n\n');  // 연속 줄바꿈 정리
            text = text.trim();

            return { text, metadata };

        } catch (error) {
            console.error('❌ AI 응답 파싱 실패:', error);
            return {
                text: aiResponse.content[0].text,
                metadata: null
            };
        }
    }

    /**
     * ❌ 레거시: 단계별 메시지 처리 (사용 중지)
     *
     * 자유 대화 시스템(processFreeformConversation)으로 대체됨
     */
    async processMessageByStage_LEGACY(session, userMessage) {
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

            // 제목 결정 로직 (폴백 포함)
            let gameTitle = extracted.title || genreAnalysis.suggestedTitle || this.generateTitle(userMessage);

            // 제목이 여전히 undefined이거나 빈 문자열이면 기본값 설정
            if (!gameTitle || gameTitle === 'undefined' || gameTitle === '') {
                gameTitle = '센서 게임';
            }

            requirements = {
                gameType: extracted.gameType || genreAnalysis.gameType || this.inferGameType(userMessage),
                genre: extracted.genre || genreAnalysis.primaryGenre || this.inferGenre(userMessage),
                title: gameTitle,
                description: userMessage,
                // 장르 분류 결과도 저장
                genreAnalysis: genreAnalysis
            };
        }

        // JSON 제거하여 깔끔한 메시지 반환
        const cleanMessage = this.removeJSONFromMessage(response.content);

        // ✅ 간소화된 진행 안내 메시지 (불필요한 분석 정보 제거)
        let finalMessage = cleanMessage;
        if (newStage === 'details') {
            finalMessage += `\n\n✅ 아이디어 확인되었습니다! 세부사항을 정의해보겠습니다.`;
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

        // sensorMechanics를 문자열로 변환하는 헬퍼 함수
        const formatSensorMechanics = (mechanics) => {
            if (Array.isArray(mechanics)) {
                return mechanics.join(', ');
            } else if (typeof mechanics === 'object' && mechanics !== null) {
                return mechanics.primary || 'tilt';
            } else {
                return 'tilt';
            }
        };

        const sensorMechanicsStr = formatSensorMechanics(genreAnalysis.sensorMechanics);

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
핵심 센서: ${sensorMechanicsStr}

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
핵심 센서: ${sensorMechanicsStr}

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
핵심 센서: ${sensorMechanicsStr}

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
핵심 센서: ${sensorMechanicsStr}

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
핵심 센서: ${sensorMechanicsStr}

특별히 다음 사항들을 확인해보세요:
1. 어떤 종류의 탈것(자동차, 비행기, 우주선)인가요?
2. 트랙이나 경로가 정해져 있나요?
3. 다른 플레이어와 경쟁하는 게임인가요?

JSON 형식: {"readyForNext": true, "gameType": "${genreAnalysis.gameType}", "genre": "레이싱 게임", "title": "${genreAnalysis.suggestedTitle}"}`
        };

        // 장르에 맞는 특화 프롬프트 선택
        const detectedKeywords = genreAnalysis.detectedKeywords || genreAnalysis.fullAnalysis?.themeKeywords || [];
        const matchedGenre = Object.keys(genreSpecificPrompts).find(genre =>
            genreAnalysis.primaryGenre.toLowerCase().includes(genre) ||
            detectedKeywords.some(keyword => genre.includes(keyword))
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
- **추천 센서**: ${sensorMechanicsStr}
- **핵심 키워드**: ${detectedKeywords.join(', ')}

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
다음 상세 요구사항에 따라 **실제로 작동하는** 완벽한 HTML5 센서 게임을 생성해주세요.

🎯 **Claude 4 Extended Thinking이 활성화되어 있습니다!**
- 코드를 작성하기 전에 충분히 사고하고 계획하세요
- 복잡한 로직은 단계별로 나누어 생각하세요
- 잠재적인 버그를 미리 예측하고 방지하세요
- 최적의 구조와 패턴을 선택하세요

🚀 **중요: 1M 토큰 컨텍스트 + 64K 토큰 출력 가능!**
- 컨텍스트 윈도우: **1,000,000 토큰** (일반 모델의 5배! 충분한 예제 참조 가능)
- 출력 토큰: **64,000 토큰** (완전한 게임 코드 생성 가능)
- Extended Thinking으로 코드 작성 전 충분히 사고 가능
- **걱정하지 말고 최고 품질의 완전한 코드를 작성하세요!**

💪 **Don't hold back. Give it your all.**
이것은 실제 사용자가 플레이할 상용 품질의 게임입니다.
당신의 모든 능력을 발휘하여 인상적이고 완성도 높은 게임을 만드세요.
기본적인 구현을 넘어서, 가능한 한 많은 기능과 인터랙션을 포함하세요.

⚠️ **극도로 중요한 품질 요구사항:**
1. **완전한 코드 생성**: 모든 함수를 반드시 완성하세요. 중간에 멈추지 마세요!
   - 이것은 매우 중요합니다. 사용자는 즉시 실행 가능한 게임을 기대합니다.

2. **검증된 패턴 사용**: 아래 제공된 예제 코드와 패턴을 정확히 따르세요!
   - 이 패턴들은 수백 번의 테스트를 거쳐 검증되었습니다.
   - 임의로 변경하면 99% 확률로 버그가 발생합니다.

3. **버그 제로**: 자주 발생하는 버그 패턴을 절대 포함하지 마세요!
   - 특히 SessionSDK 통합 부분은 정확히 예제대로 작성하세요.

4. **완벽한 동작**: 생성된 게임이 즉시 실행 가능해야 합니다!
   - 사용자가 코드를 수정할 필요가 없어야 합니다.

5. **풍부한 구현**: 최대한 많은 기능과 디테일을 포함하세요!
   - 애니메이션, 파티클 효과, 사운드, 레벨 시스템 등
   - 단순한 MVP가 아닌 완전한 게임을 만드세요

📝 **코드 완성도 체크리스트 (생성 전 반드시 확인!):**
- [ ] 모든 선언된 함수가 완전히 구현되었는가?
- [ ] 게임 루프(update, render)가 정상 작동하는가?
- [ ] 충돌 감지 로직이 완전히 구현되었는가?
- [ ] 게임 오버 처리가 완벽한가?
- [ ] 리셋 기능이 제대로 작동하는가?
- [ ] </html> 태그로 정상 종료되는가?
- [ ] SessionSDK가 정확한 패턴으로 통합되었는가?
- [ ] QR 코드 생성이 올바르게 구현되었는가?`;

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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 **SessionSDK 통합 필수 구현 패턴 (반드시 이 패턴 사용!):**

\`\`\`html
<!-- 1. 필수 스크립트 태그 (반드시 포함) -->
<script src="/socket.io/socket.io.js"></script>
<script src="/js/SessionSDK.js"></script>
<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>

<script>
// 2. SDK 초기화 (반드시 gameId와 gameType 설정)
const sdk = new SessionSDK({
    gameId: '${requirements.title.toLowerCase().replace(/\\s+/g, '-')}',
    gameType: '${requirements.gameType}'  // 'solo', 'dual', 'multi' 중 하나
});

// 3. 서버 연결 완료 후 세션 생성 (순서 중요!)
sdk.on('connected', () => {
    console.log('✅ 서버 연결 완료');
    createSession();
});

// 4. 세션 생성 함수
function createSession() {
    sdk.createSession().then(session => {
        console.log('✅ 세션 생성됨:', session);
    }).catch(error => {
        console.error('❌ 세션 생성 실패:', error);
        alert('세션 생성에 실패했습니다: ' + error.message);
    });
}

// 5. CustomEvent 처리 패턴 (반드시 event.detail || event 사용!)
sdk.on('session-created', (event) => {
    const session = event.detail || event;  // 🔥 필수 패턴!

    // 세션 코드 표시 (반드시 sessionCode 속성 사용!)
    document.getElementById('session-code').textContent = session.sessionCode;

    // QR 코드 URL 생성 (qrCodeUrl 속성은 존재하지 않음!)
    const qrUrl = \`\${window.location.origin}/sensor.html?session=\${session.sessionCode}\`;
    generateQRCode(qrUrl);
});

sdk.on('sensor-connected', (event) => {
    const data = event.detail || event;  // 🔥 필수 패턴!
    console.log('✅ 센서 연결됨:', data.sensorId);

    // UI 업데이트
    document.getElementById('sensor-status').textContent = '센서 연결됨';
    document.getElementById('sensor-status').className = 'connected';

    // 🚀 중요: 센서 연결 1초 후 자동 게임 시작 (플레이어블리티 필수!)
    setTimeout(() => {
        if (!gameStarted && !gameOver) {
            startGame(); // ✅ 센서 연결 시 자동 시작 (필수 구현!)
        }
    }, 1000);
});

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;  // 🔥 필수 패턴!

    // 센서 데이터 구조:
    // {
    //   sensorId: "sensor",
    //   gameType: "solo",
    //   data: {
    //     orientation: { alpha, beta, gamma },  // 회전, 앞뒤 기울기, 좌우 기울기
    //     acceleration: { x, y, z },            // 가속도
    //     rotationRate: { alpha, beta, gamma }  // 회전 속도
    //   },
    //   timestamp: 1234567890
    // }

    processSensorData(data);
});

sdk.on('sensor-disconnected', (event) => {
    const data = event.detail || event;  // 🔥 필수 패턴!
    console.log('⚠️ 센서 연결 해제:', data.sensorId);

    // UI 업데이트
    document.getElementById('sensor-status').textContent = '센서 연결 대기 중...';
    document.getElementById('sensor-status').className = 'disconnected';
});

// 6. QR 코드 생성 함수 (라이브러리 폴백 포함)
function generateQRCode(url) {
    const qrContainer = document.getElementById('qr-code');
    qrContainer.innerHTML = ''; // 초기화

    if (typeof QRCode !== 'undefined') {
        // QRCode.js 라이브러리 사용
        new QRCode(qrContainer, {
            text: url,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    } else {
        // 폴백: 외부 API 사용
        const img = document.createElement('img');
        img.src = \`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=\${encodeURIComponent(url)}\`;
        img.alt = 'QR Code';
        img.style.width = '200px';
        img.style.height = '200px';
        qrContainer.appendChild(img);
    }
}

// 7. 센서 데이터 처리 함수 (게임 타입별 예시)
function processSensorData(sensorData) {
    const { orientation, acceleration, rotationRate } = sensorData.data;

    // ${requirements.gameType} 타입 센서 처리:
    if ('${requirements.gameType}' === 'solo') {
        // Solo 게임: 단일 센서로 오브젝트 조작
        // beta: 앞뒤 기울기 (-180 ~ 180)
        // gamma: 좌우 기울기 (-90 ~ 90)
        const tiltX = orientation.gamma / 90;  // -1 ~ 1 정규화
        const tiltY = orientation.beta / 180;  // -1 ~ 1 정규화

        // 예: 공 위치 업데이트
        // ball.x += tiltX * speed;
        // ball.y += tiltY * speed;
    } else if ('${requirements.gameType}' === 'dual') {
        // Dual 게임: 2개 센서 협력 플레이
        // sensorId로 구분하여 각각 처리
        if (sensorData.sensorId === 'sensor1') {
            // 첫 번째 센서 처리
        } else if (sensorData.sensorId === 'sensor2') {
            // 두 번째 센서 처리
        }
    } else if ('${requirements.gameType}' === 'multi') {
        // Multi 게임: 최대 10개 센서 경쟁
        // players[sensorData.sensorId] 업데이트
    }

    // 흔들기 감지 (가속도 활용)
    const shake = Math.sqrt(
        acceleration.x ** 2 +
        acceleration.y ** 2 +
        acceleration.z ** 2
    );
    if (shake > 20) {
        // 흔들기 이벤트 처리
        console.log('🔥 흔들기 감지!');
    }
}
</script>
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 **개발 참고자료:**
${context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 **검증된 실제 작동하는 게임 패턴 (shot-target, cake-delivery 기반):**

\`\`\`javascript
// ✅ 완벽한 세션 생성 및 QR 코드 생성 패턴
sdk.on('session-created', (event) => {
    const session = event.detail || event;
    console.info('세션 생성 완료:', session);

    // 세션 코드 표시 (sessionCode 속성 필수!)
    const sessionCodeEl = document.getElementById('session-code');
    if (sessionCodeEl && session.sessionCode) {
        sessionCodeEl.textContent = session.sessionCode;
        console.info('세션 코드 표시:', session.sessionCode);
    }

    // QR 코드 생성 (URL 직접 생성 필수!)
    setTimeout(() => {
        const qrUrl = \`\${window.location.origin}/sensor.html?session=\${session.sessionCode}\`;
        console.info('QR URL 생성:', qrUrl);

        const qrContainer = document.getElementById('qr-code');
        if (qrContainer) {
            qrContainer.innerHTML = '';

            if (typeof QRCode !== 'undefined') {
                new QRCode(qrContainer, {
                    text: qrUrl,
                    width: 200,
                    height: 200,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            } else {
                // 폴백: 외부 API 사용
                const img = document.createElement('img');
                img.src = \`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=\${encodeURIComponent(qrUrl)}\`;
                img.alt = 'QR Code';
                img.style.width = '200px';
                img.style.height = '200px';
                qrContainer.appendChild(img);
            }
        }
    }, 100);
});
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 **절대적 요구사항:**
1. 단일 HTML 파일로 완성 (모든 CSS/JS 인라인)
2. 완전히 작동하는 SessionSDK 통합 (위 패턴 필수!)
3. **session.sessionCode 사용 (session.code 아님!)**
4. **QR URL 직접 생성 (session.qrCodeUrl 속성 없음!)**
5. QR 코드가 실제로 생성되고 표시됨 (폴백 포함)
6. 센서 연결 시 게임이 실제로 플레이 가능함
7. 모든 UI 요소가 올바르게 작동함
8. 에러 처리 및 폴백 완전 구현
9. ${requirements.genre} 장르 특성을 완벽히 반영
10. CustomEvent 패턴 (event.detail || event) 반드시 사용
11. 서버 연결 완료 후 세션 생성 순서 준수

**⚠️ 치명적 주의사항:**
- session.code (❌ 틀림) → session.sessionCode (✅ 올바름)
- session.qrCodeUrl (❌ 존재하지 않음) → URL 직접 생성 (✅ 올바름)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🐛 **자주 발생하는 버그 패턴 (반드시 피할 것!):**

**1. 벽돌깨기/퐁 게임 버그:**
\`\`\`javascript
// ❌ 잘못된 패턴 - 공이 패들에서 떨어지지 않음
} else {
    ball.x = paddle.x + paddle.width/2;  // 매 프레임 강제 위치 지정
    ball.y = paddle.y - ball.radius;
}

// ✅ 올바른 패턴 - 게임 시작 전에만 위치 설정
if (!gameStarted) {
    ball.x = paddle.x + paddle.width/2;
    ball.y = paddle.y - ball.radius;
    ball.dx = 0;  // 속도를 0으로!
    ball.dy = 0;
} else {
    ball.x += ball.dx;  // 게임 시작 후 정상 이동
    ball.y += ball.dy;
}

// 게임 시작 이벤트
document.addEventListener('click', () => {
    if (!gameStarted) {
        gameStarted = true;
        ball.dx = 4;   // 클릭 시 속도 부여
        ball.dy = -4;
    }
});
\`\`\`

**2. 충돌 감지 버그:**
\`\`\`javascript
// ❌ 잘못된 패턴 - 불완전한 충돌 감지
if (ball.y + ball.radius >= paddle.y &&
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.width) {
    ball.dy = -Math.abs(ball.dy);  // 중복 충돌 발생 가능
}

// ✅ 올바른 패턴 - 완전한 충돌 감지
if (ball.y + ball.radius >= paddle.y &&
    ball.y + ball.radius <= paddle.y + paddle.height &&  // Y축 범위 체크
    ball.x >= paddle.x &&
    ball.x <= paddle.x + paddle.width &&
    ball.dy > 0) {  // 아래로 이동 중일 때만
    ball.dy = -Math.abs(ball.dy);
}
\`\`\`

**3. 게임 상태 관리 버그:**
\`\`\`javascript
// ❌ 잘못된 패턴 - 게임 오버 후 계속 진행
if (lives <= 0) {
    alert('Game Over!');
    // 게임이 계속 실행됨!
}

// ✅ 올바른 패턴 - 게임 완전 중지
if (lives <= 0) {
    gameStarted = false;
    alert('Game Over! Score: ' + score);
    resetGame();  // 게임 리셋
    return;       // 게임 루프 중단
}
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ **게임 퀄리티 체크리스트 (모두 구현 필수!):**

**필수 HTML 구조 (반드시 지켜야 할 ID/Class 규칙!):**
- **캔버스**: \`<canvas id="gameCanvas">\` 또는 \`<canvas id="game-canvas">\` (둘 중 하나)
- **세션 패널**: \`<div class="session-panel">\` 또는 \`<div id="session-panel">\`
- **세션 코드**: \`<span id="session-code">\` 또는 \`<span id="session-code-display">\`
- **QR 코드**: \`<div id="qr-code">\` 또는 \`<div id="qr-container">\`
- **센서 상태**: \`<div id="sensor-status">\` (필수)

🎨 **UI 레이아웃 필수 규칙 (게임 화면 가림 방지!):**

**중요**: QR 코드와 세션 정보가 게임 화면 중앙을 가리면 안 됩니다!

✅ **올바른 레이아웃 패턴**:
\`\`\`html
<style>
/* 세션 정보는 좌측 상단 모서리에 배치 (게임 화면 안 가림) */
.session-panel {
    position: fixed;
    top: 20px;
    left: 20px;
    background: rgba(255, 255, 255, 0.95);
    padding: 15px;
    border-radius: 15px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    z-index: 1000;
    max-width: 250px;
}

/* 게임 정보 (점수, 레벨)는 우측 상단에 배치 */
.game-info {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.95);
    padding: 15px;
    border-radius: 15px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    z-index: 1000;
    min-width: 150px;
}

/* 센서 상태는 좌측 하단에 배치 */
#sensor-status {
    position: fixed;
    bottom: 20px;
    left: 20px;
    padding: 10px 20px;
    border-radius: 25px;
    z-index: 1000;
}

/* QR 코드는 작게 표시 (200x200px 이하) */
#qr-code, #qr-container {
    max-width: 150px;
    max-height: 150px;
}

/* 캔버스는 전체 화면 사용 */
#gameCanvas, #game-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
}
</style>
\`\`\`

❌ **절대 하지 마세요 - 잘못된 레이아웃**:
\`\`\`css
/* ❌ 중앙 배치로 게임 화면 가림 */
.session-panel {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

/* ❌ QR 코드가 너무 큼 */
#qr-code img {
    width: 400px;
    height: 400px;
}
\`\`\`

⚠️ **절대 포함하지 말아야 할 치명적 버그 패턴 (CRITICAL BUGS):**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 **가장 중요한 플레이어블리티 버그 (반드시 해결!):**

🚨 **CRITICAL BUG #0: 센서 연결해도 게임이 자동 시작 안 되는 치명적 버그**

이 버그는 **사용자가 게임을 플레이할 수 없게 만드는 가장 심각한 버그**입니다!
센서를 연결했는데 게임이 시작되지 않으면 사용자는 게임을 할 수 없습니다.

❌ **절대 하지 마세요 - 잘못된 코드**:
\`\`\`javascript
// ❌ 치명적 실수: 센서 연결되어도 메시지만 표시하고 게임 시작 안함
sdk.on('sensor-connected', (event) => {
    sensorConnected = true;
    // 메시지만 표시하고 startGame()을 호출하지 않음!
    showOverlay('센서 연결됨! 화면을 클릭하거나 흔들어서 시작하세요');
    // ❌ 이렇게 하면 사용자가 수동으로 클릭/흔들기를 해야만 게임 시작!
});
\`\`\`

✅ **반드시 이렇게 하세요 - 올바른 코드**:
\`\`\`javascript
// ✅ 완벽한 패턴: 센서 연결되면 1초 후 자동으로 게임 시작
sdk.on('sensor-connected', (event) => {
    const data = event.detail || event;
    console.log('✅ 센서 연결됨:', data.sensorId);

    sensorConnected = true;

    // UI 업데이트
    document.getElementById('sensor-status').textContent = '센서 연결됨 ✓';

    // 🚀 필수: 1초 후 자동 게임 시작 (플레이어블리티 핵심!)
    setTimeout(() => {
        if (!gameStarted && !gameOver) {
            startGame(); // ✅ 자동으로 게임 시작!
            console.log('🎮 게임 자동 시작됨!');
        }
    }, 1000);
});

function startGame() {
    console.log('🚀 게임 시작!');
    gameStarted = true;

    // 게임 타입에 따라 초기화
    if (ball) {
        ball.stuck = false;
        ball.dx = 4;   // ✅ 초기 속도 반드시 설정!
        ball.dy = -4;
    }

    hideOverlay(); // 오버레이 숨기기
}
\`\`\`

**왜 이게 중요한가?**
1. 사용자가 핸드폰으로 QR 스캔 → 센서 페이지 열기 → **자동으로 게임 시작되어야 함**
2. 추가 클릭/흔들기를 요구하면 사용자 경험이 나빠짐
3. 이 버그가 있으면 게임이 "기술적으로는 완성"이지만 "플레이 불가능"한 상태가 됨

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 **BUG #1: 레벨 전환 시 센서 입력이 중단되는 버그**

이 버그는 **레벨을 클리어한 후 다음 레벨에서 센서 입력이 작동하지 않는** 문제입니다!
첫 번째 레벨은 정상 작동하지만, 두 번째 레벨부터 센서로 조작이 안 되는 현상이 발생합니다.

**원인**: 레벨 클리어 메시지를 표시할 때 오버레이를 사용하면 게임 루프가 멈추거나 센서 입력이 차단됩니다.

❌ **절대 하지 마세요 - 잘못된 코드**:
\`\`\`javascript
// 레벨 클리어 처리
function checkLevelComplete() {
    const allStarsCollected = stars.every(star => star.collected);

    if (allStarsCollected && stars.length > 0) {
        level++;
        generateLevel(level);

        // ❌ 치명적 실수: 오버레이로 메시지 표시하면 센서 입력 중단!
        showOverlay(\`레벨 \${level - 1} 클리어!\`, \`레벨 \${level} 시작\`);
        setTimeout(() => {
            hideOverlay();
        }, 2000);

        // ❌ 오버레이가 표시되는 동안 게임 루프가 멈추고 센서 입력 무시됨!
    }
}
\`\`\`

✅ **반드시 이렇게 하세요 - 올바른 코드**:
\`\`\`javascript
// ✅ 방법 1: 오버레이 대신 HUD 토스트 메시지 사용 (추천!)
function checkLevelComplete() {
    const allStarsCollected = stars.every(star => star.collected);

    if (allStarsCollected && stars.length > 0) {
        level++;
        score += 500;

        // ✅ 게임을 멈추지 않고 토스트 메시지만 표시
        showToastMessage(\`🎉 레벨 \${level - 1} 클리어! 레벨 \${level} 시작\`);

        // 다음 레벨 생성 (게임은 계속 진행)
        generateLevel(level);

        // 공 위치 초기화
        ball.x = CANVAS_WIDTH / 2;
        ball.y = CANVAS_HEIGHT / 2;
        ball.vx = 0;
        ball.vy = 0;

        // ✅ 센서 입력은 계속 유지됨!
    }
}

// 토스트 메시지 함수 (오버레이 사용 안함!)
function showToastMessage(message) {
    const toast = document.getElementById('toast-message') || createToastElement();
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.opacity = '1';

    // 2초 후 페이드아웃
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 300);
    }, 2000);
}

function createToastElement() {
    const toast = document.createElement('div');
    toast.id = 'toast-message';
    toast.style.cssText = \`
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 20px 40px;
        border-radius: 15px;
        font-size: 24px;
        font-weight: bold;
        z-index: 999;
        pointer-events: none;
        transition: opacity 0.3s ease;
    \`;
    document.body.appendChild(toast);
    return toast;
}
\`\`\`

✅ **방법 2: 오버레이를 사용하되 센서 입력 유지**:
\`\`\`javascript
// 오버레이 표시 시에도 센서 데이터 처리 계속
sdk.on('sensor-data', (event) => {
    const data = event.detail || event;

    // ✅ 게임 오버가 아니면 항상 센서 데이터 처리
    // 오버레이 표시 중에도 센서 입력 유지!
    if (!gameOver) {
        processSensorData(data);
    }
});

function showOverlay(title, message, pauseGame = false) {
    const overlay = document.getElementById('overlay');
    overlay.querySelector('.overlay-title').textContent = title;
    overlay.querySelector('.overlay-message').innerHTML = message;
    overlay.classList.remove('hidden');

    // ✅ 레벨 전환 메시지는 게임을 멈추지 않음
    if (pauseGame) {
        gamePaused = true;
    }
    // pauseGame === false이면 센서 입력 계속 작동
}
\`\`\`

**왜 이게 중요한가?**
1. 첫 레벨만 플레이 가능하고 이후 레벨은 플레이 불가능하면 게임 완성도가 0%
2. 사용자가 "버그 있는 게임"으로 인식하게 됨
3. 레벨 시스템이 있는 게임은 반드시 이 패턴 적용 필수!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 **BUG #2: 공/오브젝트가 움직이지 않는 버그**
❌ **잘못된 코드**:
\`\`\`javascript
// 공이 패들에 붙어있는 상태에서 게임 시작 안됨
if (ball.stuck) {
    ball.x = paddle.x + paddle.width / 2;
    return; // ❌ 게임이 영원히 stuck 상태!
}
\`\`\`
✅ **올바른 코드**:
\`\`\`javascript
// 게임 시작 전에만 공을 패들에 고정
if (!gameStarted) {
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius;
    ball.dx = 0;  // 시작 전에는 속도 0
    ball.dy = 0;
} else {
    // 게임 시작 후에는 정상 이동
    ball.x += ball.dx;
    ball.y += ball.dy;
}

function startGame() {
    gameStarted = true;
    ball.stuck = false;
    ball.dx = 4;  // ✅ 초기 속도 설정 필수!
    ball.dy = -4;
}
\`\`\`

🚨 **BUG #2: 초기 속도가 0인 버그**
❌ **잘못된 코드**:
\`\`\`javascript
ball.stuck = false; // stuck은 풀었지만
// ball.dx = 0, ball.dy = 0 ← 속도가 0이면 안움직임!
\`\`\`
✅ **올바른 코드**:
\`\`\`javascript
ball.stuck = false;
ball.dx = 4;  // ✅ 반드시 0이 아닌 값!
ball.dy = -4;
\`\`\`

🚨 **BUG #3: gameStarted 플래그를 설정하지 않는 버그**
❌ **잘못된 코드**:
\`\`\`javascript
function updateGame() {
    // gameStarted 체크 없이 업데이트
    ball.x += ball.dx; // ❌ 조건 없이 항상 실행
}
\`\`\`
✅ **올바른 코드**:
\`\`\`javascript
function updateGame() {
    if (!gameStarted || gamePaused) return; // ✅ 플래그 체크 필수!

    if (!ball.stuck) { // ✅ stuck 체크도 필수!
        ball.x += ball.dx;
        ball.y += ball.dy;
    }
}
\`\`\`

🚨 **BUG #4: 클릭/흔들기 시작이 작동하지 않는 버그**
❌ **잘못된 코드**:
\`\`\`javascript
canvas.addEventListener('click', () => {
    ball.stuck = false; // ❌ gameStarted를 true로 안바꿈!
});
\`\`\`
✅ **올바른 코드**:
\`\`\`javascript
canvas.addEventListener('click', () => {
    if (!gameStarted && !gameOver && sensorConnected) {
        startGame(); // ✅ startGame() 함수 호출!
    }
});

// 흔들기로도 시작 가능
function processSensorData(data) {
    const { acceleration } = data.data;
    if (acceleration) {
        const shake = Math.sqrt(
            acceleration.x ** 2 +
            acceleration.y ** 2 +
            acceleration.z ** 2
        );

        // 흔들기로 게임 시작
        if (!gameStarted && shake > 20 && sensorConnected && !gameOver) {
            startGame(); // ✅ 흔들기로도 시작!
        }
    }
}
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**기본 요구사항:**
1. 🚨 **필수!** 센서 연결 후 1초 뒤 자동으로 게임 시작 (플레이어블리티 핵심!)
2. ✅ 게임 시작 시 반드시 gameStarted = true, ball.stuck = false, 초기 속도 설정
3. ✅ 위의 5가지 치명적 버그 패턴 절대 포함 금지! (특히 BUG #0!)
4. ✅ 게임 오버/승리 조건이 명확해야 함
5. ✅ 게임 오버 후 재시작 가능해야 함

**UI/UX 요구사항:**
6. ✅ 점수/시간/목표 등 게임 정보가 화면에 표시되어야 함
7. ✅ 현재 게임 상태가 명확히 표시되어야 함 (대기중/플레이중/종료)
8. ✅ 센서 조작에 대한 시각적 피드백이 있어야 함
9. ✅ 색상/크기 등이 구분 가능해야 함 (너무 작거나 비슷하면 안됨)
10. ✅ 모바일 화면에서 잘 보여야 함 (반응형)

**게임 플레이 요구사항:**
11. ✅ 센서 조작이 직관적이어야 함 (기울기 = 이동, 흔들기 = 동작)
12. ✅ 난이도가 적절해야 함 (너무 쉽거나 어렵지 않게)
13. ✅ 게임이 재미있어야 함 (목표가 명확하고 도전적)
14. ✅ 센서 반응속도가 적절해야 함 (너무 빠르거나 느리지 않게)
15. ✅ 게임 진행이 자연스러워야 함 (갑작스런 멈춤/튀김 없이)

**코드 품질 요구사항:**
16. ✅ 변수명이 명확해야 함 (a, b, x 같은 모호한 이름 금지)
17. ✅ 매직 넘버 사용 금지 (상수로 정의)
18. ✅ 주석이 필요한 부분에 적절히 추가
19. ✅ 성능 최적화 (불필요한 계산 반복 금지)
20. ✅ 에러 처리 완비 (센서 미지원, 연결 끊김 등)

**반드시 위의 체크리스트를 모두 만족하는 고품질 게임을 생성하세요!**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 **최종 출력 지시사항 (극도로 중요!):**

1. **완전한 HTML 파일 생성**: <!DOCTYPE html>부터 </html>까지 완전한 파일을 생성하세요.

2. **모든 함수 완성 필수**:
   - drawBricks(), drawPaddle(), drawBall() - 모든 렌더링 함수
   - collisionDetection() - 완전한 충돌 감지 로직
   - updateGame() - 게임 상태 업데이트
   - resetGame() - 게임 리셋
   - gameLoop() - 메인 게임 루프
   - processSensorData() - 센서 데이터 처리
   - initGame() - 게임 초기화

3. **충분한 출력 토큰**: 64,000 토큰 사용 가능! 걱정 없이 풍부하고 완전한 코드를 작성하세요!

4. **검증 완료 후 출력**: 생성된 코드가 위의 모든 체크리스트를 만족하는지 확인 후 출력하세요.

5. **절대 중간에 멈추지 마세요**: 반드시 </html> 태그로 완전히 종료하세요!

⚠️ **경고**: 불완전한 코드 생성 시 자동으로 낮은 점수를 받습니다!
✅ **목표**: 100/130점 이상 (A+ 등급) 달성하기!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 **게임 설명 생성 요구사항 (중요!):**

게임 코드를 생성하기 전에, 먼저 이 게임에 대한 매력적이고 전문적인 설명을 1-2문장으로 작성하세요.

**설명 작성 가이드:**
- 플레이어가 무엇을 하는지 명확하게 설명
- 어떤 센서를 사용하는지 자연스럽게 포함
- 게임의 핵심 재미 요소 강조
- 마케팅 문구처럼 매력적으로 작성

**좋은 예시:**
- "스마트폰을 기울여 공을 조작하며 미로를 탈출하는 물리 퍼즐 게임입니다. 중력을 활용해 장애물을 피하고 목표 지점에 도달하세요!"
- "핸드폰을 흔들어 재료를 섞고 기울여 요리를 완성하는 요리 시뮬레이션 게임입니다. 타이밍을 맞춰 완벽한 요리를 만들어보세요!"

**나쁜 예시 (피하세요):**
- "게임을 만들고 싶어." (사용자 원본 입력)
- "센서를 사용하는 게임입니다." (너무 일반적)

**응답 형식 (반드시 지켜주세요!):**

먼저 다음 JSON 형식으로 게임 설명을 제공하세요:
{"gameDescription": "여기에 1-2문장으로 게임 설명을 작성하세요"}

그 다음 완전한 HTML 게임 코드를 제공하세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

이제 위의 모든 지시사항을 완벽히 따라 고품질 게임을 생성하세요! 🚀`;
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

        // ✅ 간소화된 진행 안내 메시지
        let finalMessage = cleanMessage;
        if (shouldProgress) {
            finalMessage += '\n\n✅ 세부사항이 정리되었습니다! 다음 단계로 넘어가겠습니다.';
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

        // ✅ 간소화된 진행 안내 메시지
        let finalMessage = cleanMessage;
        if (shouldProgress) {
            finalMessage += '\n\n✅ 정보 수집 완료! 최종 확인 단계로 넘어가겠습니다.';
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

        // ✅ 간소화된 최종 확인 메시지
        const finalSummary = `✨ **게임 사양 정리 완료!**

**${requirements.title}**
• 타입: ${requirements.gameType}
• 장르: ${requirements.genre}
• 난이도: ${requirements.difficulty || '보통'}
• 센서: ${requirements.sensorMechanics?.join(', ') || '기울기'}

🎮 **이제 게임을 생성할 준비가 되었습니다!**

아래 **"게임 생성하기"** 버튼을 눌러주세요.
수정이 필요하면 언제든 말씀해주세요.`;

        // 요구사항 최종 확정
        session.gameRequirements.confirmed = true;

        return {
            message: finalSummary,
            newStage: 'confirmation',
            requirements: { confirmed: true }
            // ✅ canGenerate 제거: 프론트엔드에서 stage === 'confirmation'으로 판단
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
            // ✨ 자유 대화 시스템: readyToGenerate 체크
            if (!session.readyToGenerate) {
                throw new Error('아직 게임 생성 준비가 되지 않았습니다. 대화를 통해 필요한 정보를 완성해주세요.');
            }

            // ✨ collectedInfo를 gameRequirements 형식으로 변환
            const requirements = {
                title: session.collectedInfo.title || '센서 게임',
                description: session.collectedInfo.description || '모바일 센서를 활용한 게임',
                gameType: session.collectedInfo.gameType || 'solo',
                genre: session.collectedInfo.genre || '액션',
                sensorMechanics: session.collectedInfo.sensorUsage || ['기울기'],
                difficulty: session.collectedInfo.difficulty || '보통',
                gameplayElements: {
                    mechanics: session.collectedInfo.mechanics || [],
                    visualStyle: session.collectedInfo.visualStyle,
                    additionalFeatures: session.collectedInfo.additionalFeatures || []
                },
                confirmed: true
            };

            // 임시로 gameRequirements에 할당 (기존 코드 호환성)
            session.gameRequirements = requirements;

            // 게임 생성 시작 추적
            this.performanceMonitor.recordStageCompletion(sessionId, 'aiGeneration', {
                startTime: Date.now()
            });

            console.log(`🎮 최종 게임 생성 시작: ${requirements.title}`);
            console.log(`📝 사용자 요청: "${requirements.description}"`);
            console.log(`🔍 게임 사양:`, {
                title: requirements.title,
                gameType: requirements.gameType,
                genre: requirements.genre,
                sensorMechanics: requirements.sensorMechanics,
                difficulty: requirements.difficulty
            });

            // 🎯 Step 1: 게임 아이디어 분석 (0-20%)
            if (this.io) {
                this.io.emit('game-generation-progress', {
                    sessionId,
                    step: 1,
                    percentage: 10,
                    message: `게임 아이디어 분석 중: ${session.gameRequirements.title}`
                });
            }

            // Claude API 사용 가능 여부 확인 (Anthropic SDK)
            if (!this.anthropicClient) {
                throw new Error('Claude API가 초기화되지 않았습니다. 환경변수를 확인해주세요.');
            }

            // 🎯 Step 2: 관련 문서 검색 (20-40%)
            if (this.io) {
                this.io.emit('game-generation-progress', {
                    sessionId,
                    step: 2,
                    percentage: 20,
                    message: '관련 문서 검색 중... (벡터 DB 검색)'
                });
            }

            // 관련 컨텍스트 수집
            console.log('📚 컨텍스트 수집 중...');
            const context = await this.getGameDevelopmentContext(session.gameRequirements);

            // 🎯 Step 2 완료 - 문서 검색 완료
            if (this.io) {
                this.io.emit('game-generation-progress', {
                    sessionId,
                    step: 2,
                    percentage: 40,
                    message: '문서 검색 완료! Claude AI 코드 생성 준비 중...'
                });
            }

            // 장르별 특화 게임 생성 프롬프트
            const gameGenerationPrompt = this.generateGameCreationPrompt(session.gameRequirements, context);

            // 🎯 Step 3: Claude AI 코드 생성 (40-80%)
            if (this.io) {
                this.io.emit('game-generation-progress', {
                    sessionId,
                    step: 3,
                    percentage: 50,
                    message: 'Claude AI로 게임 코드 생성 중... (최대 5분 소요)'
                });
            }

            console.log('🤖 Anthropic SDK 호출 시작...');
            console.log('🧠 Extended Thinking 활성화 (10K 토큰 사고 예산)');
            console.log('📚 1M 토큰 컨텍스트 윈도우 베타 활성화');
            console.log('💾 프롬프트 캐싱 활성화 (RAG 문서 + 시스템 프롬프트)');
            console.log('⚠️ 참고: beta API는 스트리밍 미지원 - 응답 대기 시간 30-60초');
            const aiRequestStartTime = Date.now();

            // 🚀 Claude 4 Best Practices:
            // 1. Extended Thinking: 코딩 품질 20-30% 향상
            // 2. 1M Token Context: 대규모 컨텍스트 처리 (200K → 1M)
            // 3. Prompt Caching: RAG 문서 + 시스템 프롬프트 캐싱 (비용 90% 절감)
            //
            // ⚠️ 중요: beta.messages.stream()은 지원하지 않음!
            // beta.messages.create()만 지원 (스트리밍 없이 한 번에 응답)
            // 참고: https://docs.anthropic.com/en/docs/build-with-claude/context-windows#1m-token-context-window
            //
            // 🔥 중요: Extended Thinking 사용 시 temperature는 반드시 1이어야 함!
            // 참고: https://docs.claude.com/en/docs/build-with-claude/extended-thinking#important-considerations-when-using-extended-thinking
            //
            // ✨ 프롬프트 캐싱: 시스템 프롬프트와 RAG 문서를 분리하여 캐싱
            // 참고: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching

            // 프롬프트 분리: 시스템 부분 (캐싱 가능) + 게임 요구사항 (매번 변경)
            const baseSystemPrompt = gameGenerationPrompt.split('📋 **게임 상세 사양:**')[0].trim();
            const gameSpec = '📋 **게임 상세 사양:**' + gameGenerationPrompt.split('📋 **게임 상세 사양:**')[1];

            const message = await this.anthropicClient.beta.messages.create({
                model: this.config.claudeModel,
                max_tokens: this.config.maxTokens,  // 64,000 토큰
                temperature: 1,  // Extended Thinking 사용 시 필수값
                betas: ['context-1m-2025-08-07'],  // 🎯 1M 토큰 베타 헤더
                thinking: {  // 🧠 Extended Thinking 활성화
                    type: 'enabled',
                    budget_tokens: 10000  // 10K 토큰 사고 예산
                },
                // ✨ 시스템 프롬프트 (캐싱 적용)
                system: [
                    {
                        type: "text",
                        text: baseSystemPrompt,
                        cache_control: { type: "ephemeral" } // ✅ 시스템 프롬프트 캐싱
                    },
                    {
                        type: "text",
                        text: `\n\n📚 참고 문서 및 예제:\n\n${context}`,
                        cache_control: { type: "ephemeral" } // ✅ RAG 문서 캐싱
                    }
                ],
                messages: [{
                    role: 'user',
                    content: gameSpec // 게임 요구사항만 user 메시지로 (매번 다름)
                }]
            });

            const aiRequestEndTime = Date.now();

            // 응답 데이터 추출
            const fullContent = message.content
                .filter(block => block.type === 'text')
                .map(block => block.text)
                .join('');

            const response = {
                content: fullContent,
                response_metadata: {
                    stop_reason: message.stop_reason,
                    usage: message.usage
                }
            };

            // 진행률 75%로 업데이트
            if (this.io) {
                this.io.emit('game-generation-progress', {
                    sessionId,
                    step: 3,
                    percentage: 75,
                    message: `Claude AI 응답 완료! (${Math.floor(fullContent.length / 1000)}KB 생성됨)`
                });
            }

            console.log(`✅ 스트리밍 완료 (${((aiRequestEndTime - aiRequestStartTime) / 1000).toFixed(1)}초 소요)`);

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

            // 🔍 V3.1: stop_reason 로깅 추가 (토큰 제한 진단용)
            if (response.response_metadata?.stop_reason) {
                console.log(`🛑 Stop Reason: ${response.response_metadata.stop_reason}`);
                if (response.response_metadata.stop_reason === 'max_tokens') {
                    console.warn('⚠️ 경고: maxTokens 제한에 도달하여 응답이 잘림! 토큰 증가 또는 멀티스테이지 생성 고려 필요');
                }
            }
            if (response.response_metadata?.usage) {
                console.log(`📊 토큰 사용량:`, response.response_metadata.usage);
            }

            // 🎯 Step 3 진행 중 - 게임 설명 및 HTML 추출
            if (this.io) {
                this.io.emit('game-generation-progress', {
                    sessionId,
                    step: 3,
                    percentage: 75,
                    message: 'Claude AI 응답 완료! 게임 설명 및 HTML 코드 추출 중...'
                });
            }

            // 🎯 게임 설명 추출 (새로 추가)
            console.log('📝 AI 생성 게임 설명 추출 중...');
            let generatedDescription = null;

            // JSON 형식에서 설명 추출 시도
            const descMatch = response.content.match(/\{"gameDescription"\s*:\s*"([^"]+)"\}/);
            if (descMatch) {
                generatedDescription = descMatch[1];
                console.log(`✅ AI 생성 설명 추출 성공: "${generatedDescription}"`);
            } else {
                console.log('⚠️ AI 생성 설명을 찾을 수 없습니다. 원본 설명을 사용합니다.');
                console.log('💡 힌트: Claude 응답에서 {"gameDescription": "..."} 패턴을 찾지 못했습니다.');
            }

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

            // 🎯 Step 4: 게임 코드 검증 (80-90%)
            if (this.io) {
                this.io.emit('game-generation-progress', {
                    sessionId,
                    step: 4,
                    percentage: 80,
                    message: '게임 코드 검증 중...'
                });
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
                description: generatedDescription || session.gameRequirements.description, // AI 생성 설명 우선 사용
                originalUserInput: session.gameRequirements.description, // 원본 사용자 입력 보존
                gameType: session.gameRequirements.gameType,
                genre: session.gameRequirements.genre,
                difficulty: session.gameRequirements.difficulty,
                sensorMechanics: session.gameRequirements.sensorMechanics,
                generatedAt: new Date().toISOString(),
                sessionId: sessionId,
                creatorId: session.creatorId  // 🔐 게임 제작자 ID
            };

            // 메타데이터 로깅 (설명 확인용)
            console.log('📋 게임 메타데이터:');
            console.log(`   제목: ${metadata.title}`);
            console.log(`   설명: ${metadata.description}`);
            if (generatedDescription) {
                console.log(`   ✅ AI 생성 설명 사용됨`);
            } else {
                console.log(`   ⚠️  원본 사용자 입력 사용됨 (AI 설명 생성 실패)`);
            }

            // 🎯 Step 5: 게임 파일 저장 및 등록 (90-100%)
            if (this.io) {
                this.io.emit('game-generation-progress', {
                    sessionId,
                    step: 5,
                    percentage: 90,
                    message: '게임 파일 저장 및 등록 중...'
                });
            }

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

            // 🎯 Step 5 완료 - 100%
            if (this.io) {
                this.io.emit('game-generation-progress', {
                    sessionId,
                    step: 5,
                    percentage: 100,
                    message: `✅ 게임 생성 완료! (${saveResult.gameId})`
                });
            }

            // 🔄 게임 생성 성공 시 자동 스캔 실행
            if (this.gameScanner) {
                try {
                    console.log('🔄 게임 자동 스캔 시작...');
                    await this.gameScanner.scanGames();
                    console.log(`✅ 게임 자동 스캔 완료 - ${saveResult.gameId} 등록됨`);
                } catch (scanError) {
                    console.error('⚠️ 게임 자동 스캔 실패:', scanError.message);
                    // 게임은 생성되었으므로 오류로 처리하지 않음
                }
            } else {
                console.log('⚠️ GameScanner가 주입되지 않아 자동 스캔을 건너뜁니다.');
            }

            // 🔧 게임 유지보수 시스템에 자동 등록
            if (this.gameMaintenanceManager) {
                try {
                    console.log('🔧 GameMaintenanceManager에 게임 등록 중...');
                    this.gameMaintenanceManager.registerGameSession(saveResult.gameId, {
                        title: metadata.title,
                        description: metadata.description,
                        gameType: metadata.gameType,
                        genre: metadata.genre,
                        path: `games/${saveResult.gameId}`,
                        generatedAt: metadata.generatedAt
                    });
                    console.log(`✅ 게임 유지보수 세션 등록 완료 - ${saveResult.gameId} (v1.0)`);
                } catch (registerError) {
                    console.error('⚠️ 게임 유지보수 세션 등록 실패:', registerError.message);
                    // 게임은 생성되었으므로 오류로 처리하지 않음
                }
            } else {
                console.log('⚠️ GameMaintenanceManager가 주입되지 않아 자동 등록을 건너뜁니다.');
            }

            // ✨ Phase 3: 게임 설명 자동 생성
            let gameExplanation = null;
            try {
                console.log('📝 게임 설명 생성 중...');
                gameExplanation = await this.generateGameExplanation(metadata, gameCode);
                console.log('✅ 게임 설명 생성 완료');

                // Socket.IO로 게임 설명 전송
                if (this.io) {
                    this.io.emit('game-explanation', {
                        sessionId,
                        explanation: gameExplanation,
                        gameId: saveResult.gameId
                    });
                }
            } catch (explanationError) {
                console.error('⚠️ 게임 설명 생성 실패:', explanationError.message);
                // 게임은 이미 생성되었으므로 오류로 처리하지 않음
            }

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
                explanation: gameExplanation,  // ✅ 게임 설명 포함
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
     * 📝 게임 설명 자동 생성 (Phase 3)
     *
     * 생성된 게임의 조작법, 목표, 팁 등을 AI가 자동으로 설명
     */
    async generateGameExplanation(metadata, gameCode) {
        try {
            console.log('📝 게임 설명 생성 중...');

            // 더미 모드 체크
            if (this.mockMode || !this.anthropicClient) {
                return `게임이 생성되었습니다! "${metadata.title}" 게임을 즐겨보세요.`;
            }

            const explanationPrompt = `생성된 게임에 대한 친절한 설명을 작성하세요.

<game_metadata>
제목: ${metadata.title}
타입: ${metadata.gameType}
장르: ${metadata.genre || '일반'}
난이도: ${metadata.difficulty || '보통'}
</game_metadata>

<generated_code_analysis>
생성된 코드를 분석하여 다음 정보를 추출하세요:
- 실제 센서 사용 방식
- 게임 목표 및 승리 조건
- 점수/레벨 시스템
- 특수 기능들

코드 일부:
${gameCode.substring(0, 8000)}
</generated_code_analysis>

<explanation_format>
자연스러운 대화 형식으로 다음 내용을 포함하세요:

1. **게임 소개** (한 줄로 간단히)
   예: "스마트폰을 기울여서 공을 굴려 미로를 탈출하는 게임이에요!"

2. **조작 방법** (구체적으로, 어떻게 센서를 사용하는지)
   예: "스마트폰을 좌우로 기울이면 공이 그 방향으로 굴러가요. 기울기가 클수록 공이 빠르게 움직입니다."

3. **게임 목표**
   예: "벽에 부딪히지 않으면서 초록색 골인 지점에 도착하는 것이 목표예요."

4. **플레이 팁** (2-3개)
   - 첫 번째 팁
   - 두 번째 팁
   - 세 번째 팁

5. **특별한 기능** (있다면)
   예: "점수 시스템이 있어서 빠르게 클리어할수록 높은 점수를 받아요!"

**중요**: 마크다운 없이 자연스러운 문장으로 작성하세요. 리스트는 사용해도 됩니다.
</explanation_format>`;

            const response = await this.anthropicClient.messages.create({
                model: this.config.claudeModel,
                max_tokens: 2048,  // 설명은 짧게
                temperature: 0.3,  // 일관성 중요
                system: [{
                    type: "text",
                    text: explanationPrompt,
                    cache_control: { type: "ephemeral" }
                }],
                messages: [{
                    role: 'user',
                    content: '위 게임에 대한 설명을 작성해주세요.'
                }]
            });

            const explanation = response.content[0].text;
            console.log('✅ 게임 설명 생성 완료 (' + explanation.length + '자)');

            return explanation;

        } catch (error) {
            console.error('❌ 게임 설명 생성 실패:', error);
            // 기본 설명 반환
            return `게임이 생성되었습니다! "${metadata.title}" 게임을 즐겨보세요.`;
        }
    }

    /**
     * 게임 개발 컨텍스트 수집
     */
    async getGameDevelopmentContext(requirements) {
        try {
            // Phase 3-3 개선: 더 구체적인 쿼리 + 증가된 검색 결과 (k=3→5)
            const queries = [
                `${requirements.gameType} ${requirements.genre} 게임 개발 완전한 예제 코드`,
                `센서 ${requirements.sensorMechanics?.join(', ')} 활용한 게임 구현`,
                'SessionSDK 통합 패턴 및 세션 생성 코드',
                '게임 루프 update render 패턴',
                '완벽한 게임 템플릿 HTML 구조'
            ];

            const contexts = [];
            console.log('🔍 RAG 검색 시작:', queries.join(' | '));

            for (const query of queries) {
                try {
                    // Phase 3-3 개선: k=2→5, similarity threshold 추가
                    const retriever = this.vectorStore.asRetriever({
                        k: 5,  // 검색 결과 증가 (기존 2 → 5)
                        searchType: 'similarity',
                        filter: { similarity_threshold: 0.7 }  // 유사도 70% 이상
                    });

                    const docs = await retriever.getRelevantDocuments(query);
                    console.log(`  ✅ "${query.slice(0, 30)}..." → ${docs.length}개 문서 검색됨`);
                    contexts.push(...docs.map(doc => doc.pageContent));

                } catch (err) {
                    console.log(`  ⚠️ 검색 실패 (${query.slice(0, 30)}...):`, err.message);
                }
            }

            // 검색된 컨텍스트가 있으면 사용, 없으면 기본 컨텍스트
            if (contexts.length > 0) {
                console.log(`✅ 총 ${contexts.length}개 컨텍스트 검색 완료`);
                return contexts.join('\n\n---\n\n');
            } else {
                console.log('⚠️ Vector DB 검색 결과 없음 - 기본 컨텍스트 사용');
                return this.getDefaultGameContext();
            }

        } catch (error) {
            console.error('❌ 컨텍스트 수집 실패:', error);
            return this.getDefaultGameContext();
        }
    }

    /**
     * 안전한 LLM 호출 (더미 모드 지원) - Anthropic SDK 사용
     */
    async safeInvokeLLM(prompt, stage = 'general', userMessage = '') {
        if (this.mockMode || !this.anthropicClient) {
            console.log('🎭 더미 모드 - 기본 응답 생성');
            return { content: this.generateMockResponse(stage, userMessage) };
        }

        try {
            // 🎯 Claude 4 Best Practice: 마크다운 최소화 시스템 프롬프트
            const systemPrompt = `<avoid_excessive_markdown_and_bullet_points>
당신은 사용자와 자연스러운 대화를 나누는 게임 기획 전문가입니다.

중요한 규칙:
1. 마크다운 형식을 사용하지 마세요 (**굵게**, *기울임*, ## 제목, - 리스트 등)
2. 자연스러운 문장으로 부드럽게 대화하세요
3. 중요한 내용은 문장 안에 자연스럽게 녹여서 표현하세요
4. 친근하고 편안한 톤으로 이야기하세요
5. 질문은 자연스럽게 문장 안에 포함시키세요

예시:
❌ 나쁜 예: "**게임 타입**은 무엇인가요? - Solo - Dual - Multi"
✅ 좋은 예: "혼자 플레이하는 게임인가요, 아니면 친구들과 함께 하는 게임을 만들고 싶으신가요?"
</avoid_excessive_markdown_and_bullet_points>`;

            // Anthropic SDK 직접 사용 + 프롬프트 캐싱
            const response = await this.anthropicClient.messages.create({
                model: this.config.claudeModel,
                max_tokens: 4096,  // 대화 단계는 적은 토큰
                temperature: this.config.temperature,
                // ✨ 시스템 프롬프트 캐싱 (5분 TTL)
                system: [{
                    type: "text",
                    text: systemPrompt,
                    cache_control: { type: "ephemeral" }
                }],
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            return { content: response.content[0].text };
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
     * 기본 게임 개발 컨텍스트 (getGameDevelopmentContext fallback)
     */
    getDefaultGameContext() {
        return this.getDefaultContext();
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
        if (!userMessage || typeof userMessage !== 'string') {
            return '센서 게임';
        }

        const message = userMessage.toLowerCase();

        // 키워드 기반 제목 생성
        if (message.includes('미로')) return '센서 미로 게임';
        if (message.includes('공')) return '센서 볼 게임';
        if (message.includes('반응')) return '센서 반응속도 게임';
        if (message.includes('우주')) return '센서 우주선 게임';
        if (message.includes('요리')) return '센서 요리 게임';
        if (message.includes('벽돌')) return '센서 벽돌깨기';
        if (message.includes('기울')) return '센서 기울기 게임';
        if (message.includes('흔들')) return '센서 흔들기 게임';
        if (message.includes('균형')) return '센서 균형 게임';
        if (message.includes('점프')) return '센서 점프 게임';
        if (message.includes('피하')) return '센서 피하기 게임';
        if (message.includes('타겟')) return '센서 타겟 게임';
        if (message.includes('경주') || message.includes('레이싱')) return '센서 레이싱 게임';

        // 기본 제목 (절대 undefined 반환 안 함)
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
     * 게임 파일 저장 (Storage 우선, 로컬은 옵션)
     */
    async saveGameToFiles(gameCode, metadata) {
        try {
            const gameId = this.generateGameId(metadata.title);

            // 🌐 Storage 우선 정책: 로컬 저장은 개발 환경에서만
            const saveToLocal = process.env.SAVE_GAMES_LOCALLY === 'true' || process.env.NODE_ENV === 'development';

            let gamePath = null;

            // 로컬 저장 (옵션)
            if (saveToLocal) {
                gamePath = path.join(process.cwd(), 'public', 'games', gameId);
                console.log(`📁 게임 폴더 생성: ${gamePath}`);
                await fs.mkdir(gamePath, { recursive: true });
            } else {
                console.log(`☁️  Storage 전용 모드: 로컬 저장 건너뜀`);
                // 임시 경로 설정 (검증 보고서용)
                gamePath = path.join(process.cwd(), 'public', 'games', gameId);
            }

            // game.json 메타데이터 생성 (Storage 업로드용)
            const gameJson = {
                ...metadata,
                gameId: gameId,
                filePaths: {
                    index: 'index.html'
                },
                createdAt: new Date().toISOString(),
                version: '1.0.0'
            };

            // 로컬 파일 저장 (옵션)
            let indexPath, metadataPath, readmePath;

            if (saveToLocal) {
                // index.html 파일 저장
                indexPath = path.join(gamePath, 'index.html');
                await fs.writeFile(indexPath, gameCode, 'utf8');
                console.log(`✅ index.html 로컬 저장 완료: ${indexPath}`);

                // game.json 메타데이터 파일 저장
                metadataPath = path.join(gamePath, 'game.json');
                await fs.writeFile(metadataPath, JSON.stringify(gameJson, null, 2), 'utf8');
                console.log(`✅ game.json 로컬 저장 완료: ${metadataPath}`);

                // README.md 파일 생성
                const readme = this.generateReadme(metadata);
                readmePath = path.join(gamePath, 'README.md');
                await fs.writeFile(readmePath, readme, 'utf8');
                console.log(`✅ README.md 로컬 저장 완료: ${readmePath}`);
            } else {
                console.log(`☁️  로컬 파일 저장 건너뜀 (Storage 전용)`);
                // 경로만 설정 (반환용)
                indexPath = path.join(gamePath, 'index.html');
                metadataPath = path.join(gamePath, 'game.json');
                readmePath = path.join(gamePath, 'README.md');
            }
            
            // 🔍 게임 자동 검증 실행 (메타데이터 포함)
            console.log(`🔍 게임 검증 시작: ${gameId}`);
            const validationResult = await this.gameValidator.validateGame(gameId, gamePath, metadata);

            // 검증 보고서 생성 및 출력
            const validationReport = this.gameValidator.generateReport(validationResult);
            console.log(validationReport);

            // 검증 결과를 파일로 저장 (로컬 저장 시에만)
            let reportPath = null;
            if (saveToLocal) {
                reportPath = path.join(gamePath, 'VALIDATION_REPORT.md');
                await fs.writeFile(reportPath, validationReport, 'utf8');
                console.log(`📋 검증 보고서 로컬 저장: ${reportPath}`);
            }

            // 🌐 Supabase Storage에 업로드 (프로덕션 배포용)
            let storageUrl = null;
            if (this.supabaseAdminClient) {
                try {
                    console.log('☁️  Supabase Storage에 게임 파일 업로드 중...');

                    // 1. index.html 업로드
                    const htmlStoragePath = `${gameId}/index.html`;
                    const { error: htmlError } = await this.supabaseAdminClient
                        .storage
                        .from('games')
                        .upload(htmlStoragePath, gameCode, {
                            contentType: 'text/html',
                            upsert: true
                        });

                    if (htmlError) {
                        console.error('❌ index.html 업로드 실패:', htmlError);
                    } else {
                        console.log('✅ index.html 업로드 완료');
                    }

                    // 2. game.json 업로드
                    const jsonStoragePath = `${gameId}/game.json`;
                    const { error: jsonError } = await this.supabaseAdminClient
                        .storage
                        .from('games')
                        .upload(jsonStoragePath, JSON.stringify(gameJson, null, 2), {
                            contentType: 'application/json',
                            upsert: true
                        });

                    if (jsonError) {
                        console.error('❌ game.json 업로드 실패:', jsonError);
                    } else {
                        console.log('✅ game.json 업로드 완료');
                    }

                    // 3. README.md 업로드
                    const readme = this.generateReadme(metadata);
                    const readmeStoragePath = `${gameId}/README.md`;
                    const { error: readmeError } = await this.supabaseAdminClient
                        .storage
                        .from('games')
                        .upload(readmeStoragePath, readme, {
                            contentType: 'text/markdown',
                            upsert: true
                        });

                    if (readmeError) {
                        console.error('❌ README.md 업로드 실패:', readmeError);
                    } else {
                        console.log('✅ README.md 업로드 완료');
                    }

                    // Storage 업로드 완료
                    if (!htmlError) {

                        // Public URL 생성
                        const { data: urlData } = this.supabaseAdminClient
                            .storage
                            .from('games')
                            .getPublicUrl(htmlStoragePath);

                        storageUrl = urlData.publicUrl;
                        console.log('🔗 Public URL:', storageUrl);

                        // 💾 DB에 메타데이터 저장
                        const { data: dbData, error: dbError } = await this.supabaseAdminClient
                            .from('generated_games')
                            .insert({
                                game_id: gameId,
                                title: metadata.title,
                                description: metadata.description || '',
                                game_type: metadata.gameType || 'solo',
                                genre: metadata.genre || '',
                                storage_path: htmlStoragePath,  // index.html 경로
                                thumbnail_url: null,
                                play_count: 0,
                                creator_id: metadata.creatorId || null,  // 🔐 게임 제작자 ID
                                metadata: {
                                    requirements: metadata.requirements,
                                    validation: validationResult,
                                    version: '1.0.0',
                                    createdAt: new Date().toISOString()
                                }
                            })
                            .select()
                            .single();

                        if (dbError) {
                            // 중복 키 에러는 무시 (이미 존재하는 게임)
                            if (dbError.code === '23505') {
                                console.log('⚠️  게임이 이미 DB에 존재합니다. 업데이트...');

                                // 기존 레코드 업데이트
                                await this.supabaseAdminClient
                                    .from('generated_games')
                                    .update({
                                        title: metadata.title,
                                        description: metadata.description || '',
                                        storage_path: htmlStoragePath,  // index.html 경로
                                        creator_id: metadata.creatorId || null,  // 🔐 게임 제작자 ID
                                        metadata: {
                                            requirements: metadata.requirements,
                                            validation: validationResult,
                                            version: '1.0.0',
                                            updatedAt: new Date().toISOString()
                                        }
                                    })
                                    .eq('game_id', gameId);
                            } else {
                                console.error('❌ DB 저장 실패:', dbError);
                            }
                        } else {
                            console.log('✅ DB에 게임 메타데이터 저장 완료');
                        }
                    }
                } catch (storageError) {
                    console.error('❌ Supabase 업로드 중 오류:', storageError);
                }
            } else {
                console.log('⚠️  Supabase Admin Client가 없습니다. 로컬 저장만 수행됨.');
            }

            const playUrl = `/games/${gameId}/`;

            return {
                success: true,
                gameId: gameId,
                gamePath: gamePath,
                playUrl: playUrl,
                storageUrl: storageUrl,  // Supabase Storage URL 추가
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
     * Supabase Storage 호환: 영문, 숫자, 하이픈만 허용
     */
    generateGameId(title) {
        // 제목이 없거나 유효하지 않으면 기본값 사용
        let safeTitle = title;
        if (!safeTitle || typeof safeTitle !== 'string' || safeTitle === 'undefined' || safeTitle.trim() === '') {
            safeTitle = 'sensor-game';
        }

        // 한글을 로마자로 간단 변환 (기본 매핑)
        const koreanToRoman = {
            '가': 'ga', '나': 'na', '다': 'da', '라': 'ra', '마': 'ma', '바': 'ba', '사': 'sa', '아': 'a', '자': 'ja', '차': 'cha', '카': 'ka', '타': 'ta', '파': 'pa', '하': 'ha',
            '게': 'ge', '눈': 'nun', '덩': 'dung', '이': 'i', '굴': 'gul', '리': 'ri', '기': 'gi', '공': 'gong', '미': 'mi', '로': 'ro',
            '볼': 'ball', '슈': 'shu', '팅': 'ting', '레': 're', '이': 'i', '싱': 'sing', '스': 's', '타': 'ta', '트': 't'
        };

        let romanized = safeTitle;
        // 한글을 로마자로 변환 시도
        for (const [kor, rom] of Object.entries(koreanToRoman)) {
            romanized = romanized.replace(new RegExp(kor, 'g'), rom);
        }

        // 제목을 안전한 폴더명으로 변환 (영문, 숫자, 하이픈만 허용)
        const baseId = romanized
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // 영문, 숫자, 공백, 하이픈만 허용 (한글 제거)
            .replace(/\s+/g, '-') // 공백을 하이픈으로 변경
            .replace(/-+/g, '-') // 연속 하이픈 제거
            .replace(/^-|-$/g, '') // 시작/끝 하이픈 제거
            .substring(0, 50); // 최대 50자

        // 만약 변환 후에도 빈 문자열이면 기본값 사용
        const finalBaseId = baseId || 'sensor-game';

        // 타임스탬프 추가로 고유성 보장
        const timestamp = Date.now().toString().slice(-6);
        return `${finalBaseId}-${timestamp}`;
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