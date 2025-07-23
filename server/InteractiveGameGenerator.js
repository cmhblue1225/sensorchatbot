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
        
        this.initialize();
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
                lastUpdated: new Date().toISOString()
            };

            this.activeSessions.set(sessionId, session);

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
     * 초기 단계: 게임 아이디어 수집
     */
    async processInitialStage(session, userMessage, context) {
        const prompt = `당신은 Sensor Game Hub의 전문 게임 개발 컨설턴트입니다. 
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

응답 형식:
- 자연스러운 대화체로 응답
- 게임 아이디어에 대한 긍정적 피드백
- 구체적인 질문으로 정보 수집
- 충분한 정보가 있으면 반드시 위 JSON을 포함하세요`;

        const response = await this.llm.invoke([{ role: 'user', content: prompt }]);
        
        // 개선된 JSON 추출 로직
        let extracted = this.extractJSONFromResponse(response.content);
        
        let newStage = session.stage;
        let requirements = {};

        // 게임 아이디어가 구체적이면 자동으로 다음 단계로
        const hasGameIdea = userMessage.length > 10 && 
            (userMessage.includes('게임') || userMessage.includes('만들') || 
             userMessage.includes('기울') || userMessage.includes('흔들') || 
             userMessage.includes('센서'));

        if (extracted.readyForNext || hasGameIdea) {
            newStage = 'details';
            requirements = {
                gameType: extracted.gameType || this.inferGameType(userMessage),
                genre: extracted.genre || this.inferGenre(userMessage),
                title: extracted.title || this.generateTitle(userMessage),
                description: userMessage
            };
        }

        // JSON 제거하여 깔끔한 메시지 반환
        const cleanMessage = this.removeJSONFromMessage(response.content);
        
        // 진행 안내 메시지 추가
        let finalMessage = cleanMessage;
        if (newStage === 'details') {
            finalMessage += '\n\n✅ 게임 아이디어가 확인되었습니다! 세부사항을 정의해보겠습니다.';
        }

        return {
            message: finalMessage,
            newStage: newStage,
            requirements: requirements
        };
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

        const response = await this.llm.invoke([{ role: 'user', content: prompt }]);
        
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

        const response = await this.llm.invoke([{ role: 'user', content: prompt }]);
        
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
        
        // 게임 생성 코드 감지
        const generateKeywords = ['생성', '만들어', '확인', '좋아', '완료', '시작', '진행'];
        const shouldGenerate = generateKeywords.some(keyword => 
            userMessage.toLowerCase().includes(keyword)
        );
        
        if (shouldGenerate) {
            // 요구사항 최종 업데이트
            session.gameRequirements.confirmed = true;
            
            return {
                message: "✨ 완볽합니다! 모든 요구사항이 정리되었습니다. \n\n🎮 이제 고품질 HTML5 게임을 생성하겠습니다. \n잠시만 기다려주세요...",
                newStage: 'generating'
            };
        }

        const prompt = `게임 "${requirements.title}"의 모든 요구사항을 최종 정리했습니다:

📋 **게임 사양 요약:**
- **제목**: ${requirements.title}
- **타입**: ${requirements.gameType} (센서 ${requirements.gameType === 'solo' ? '1개' : requirements.gameType === 'dual' ? '2개' : '여러개'} 사용)
- **장르**: ${requirements.genre}
- **센서 활용**: ${requirements.sensorMechanics?.join(', ') || '기울기 센서'}
- **난이도**: ${requirements.difficulty || '보통'}
- **게임 목표**: ${requirements.objectives || '기본 게임 목표'}
- **점수 시스템**: ${requirements.gameplayElements?.scoring || '기본 점수 시스템'}
- **특별 기능**: ${requirements.specialRequirements?.join(', ') || '없음'}

사용자 피드백: "${userMessage}"

최종 확인 메시지를 제공하고, 사용자가 수정을 원하는 부분이 있다면 반영해주세요. 

모든 것이 만족스럽다면 "게임 생성하기" 버튼을 누르거나 "생성해주세요"라고 말씀해주세요!`;

        const response = await this.llm.invoke([{ role: 'user', content: prompt }]);

        return {
            message: response.content + '\n\n🎯 **준비 완료!** 위 내용으로 게임을 생성하시려면 "게임 생성하기" 버튼을 눌러주세요!',
            newStage: session.stage, // 확인 단계 유지
            requirements: { confirmed: true } // 확인 완료 표시
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
            if (session.stage !== 'generating') {
                throw new Error(`잘못된 세션 단계: ${session.stage}. 'generating' 단계에서만 게임을 생성할 수 있습니다.`);
            }

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

            // 게임 생성 프롬프트
            const gameGenerationPrompt = `당신은 Sensor Game Hub v6.0의 최고 전문 게임 개발자입니다.
다음 상세 요구사항에 따라 완벽히 실행 가능한 HTML5 게임을 생성해주세요.

📋 게임 상세 사양:
제목: ${session.gameRequirements.title}
설명: ${session.gameRequirements.description}
게임 타입: ${session.gameRequirements.gameType}
장르: ${session.gameRequirements.genre}
센서 메커니즘: ${session.gameRequirements.sensorMechanics?.join(', ')}
난이도: ${session.gameRequirements.difficulty}
목표: ${session.gameRequirements.objectives}
특별 요구사항: ${session.gameRequirements.specialRequirements?.join(', ')}

🎯 필수 구현 사항:
1. **SessionSDK 완벽 통합**:
   - new SessionSDK({ gameId: '${session.gameRequirements.title?.replace(/[^a-zA-Z0-9]/g, '-')}', gameType: '${session.gameRequirements.gameType}' })
   - sdk.on('connected', () => { createSession(); }) 패턴 준수
   - sdk.on('session-created', (event) => { const session = event.detail || event; }) 패턴 사용
   - sdk.on('sensor-data', (event) => { const data = event.detail || event; }) 패턴 사용

2. **센서 데이터 활용**:
   - orientation 데이터: alpha(0-360), beta(-180~180), gamma(-90~90)
   - acceleration 데이터: x, y, z 축 가속도
   - rotationRate 데이터: alpha, beta, gamma 회전 속도
   - 센서 데이터 smoothing 및 threshold 적용

3. **게임 로직 완성도**:
   - 완전한 게임 루프 (update, render)
   - 승리/실패 조건 명확히 구현
   - 점수 시스템 완성
   - 게임 상태 관리 (ready, playing, paused, gameOver)

4. **UI/UX 요소**:
   - 게임 상태 표시
   - 센서 연결 상태 표시
   - QR 코드 표시 (Session SDK 자동 생성)
   - 점수 및 생명 표시
   - 게임 종료 시 결과 화면

5. **기술적 품질**:
   - CSS 커스텀 속성 활용 (--primary: #3b82f6, --secondary: #8b5cf6 등)
   - Canvas 2D Context 최적화
   - 반응형 디자인 (모바일 우선)
   - requestAnimationFrame 사용
   - 메모리 누수 방지 코드

📚 개발 참고자료:
${context}

🚨 중요 제약조건:
- HTML5 DOCTYPE 선언 필수
- 단일 HTML 파일로 완성 (외부 의존성 최소화)
- SessionSDK는 "/js/SessionSDK.js" 경로에서 로드
- 모든 JavaScript 코드는 DOMContentLoaded 이후 실행
- 에러 처리 및 폴백 로직 포함
- 브라우저 호환성 고려 (iOS Safari, Android Chrome)

⚡ 성능 최적화:
- Canvas 렌더링 최적화
- 센서 데이터 throttling (50ms 간격)
- 불필요한 DOM 조작 최소화
- 게임 객체 pooling 적용

🎨 디자인 가이드라인:
- 다크 테마 기반 (#0f172a 배경)
- 네온 색상 액센트
- 깔끔한 미니멀 UI
- 터치 친화적 버튼 크기 (44px 이상)

반드시 완전하고 실행 가능한 HTML 파일을 생성하세요. 게임이 즉시 플레이 가능해야 합니다.`;

            console.log('🤖 Claude API 호출 시작...');
            const response = await this.llm.invoke([{ role: 'user', content: gameGenerationPrompt }]);
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

            // 게임 검증
            const validation = this.validateGameCode(gameCode);

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

            // 세션 정리
            session.stage = 'completed';
            session.lastUpdated = new Date().toISOString();

            console.log(`✅ 게임 생성 완료: ${session.gameRequirements.title}`);

            return {
                success: true,
                sessionId: sessionId,
                gameCode: gameCode,
                metadata: metadata,
                validation: validation,
                requirements: session.gameRequirements
            };

        } catch (error) {
            console.error('❌ 게임 생성 실패:', error);
            console.error('❌ 오류 세부 정보:', {
                message: error.message,
                stack: error.stack,
                sessionId: sessionId
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
     * 관련 컨텍스트 검색
     */
    async getRelevantContext(userMessage) {
        try {
            const retriever = this.vectorStore.asRetriever({
                k: 3,
                searchType: 'similarity'
            });
            const docs = await retriever.getRelevantDocuments(userMessage);
            return docs.map(doc => doc.pageContent).join('\n\n');
        } catch (error) {
            console.error('컨텍스트 검색 실패:', error);
            return '';
        }
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
     * 헬스 체크
     */
    async healthCheck() {
        try {
            return {
                success: true,
                status: 'healthy',
                components: {
                    claude: this.llm ? 'initialized' : 'not_initialized',
                    supabase: this.supabaseClient ? 'connected' : 'disconnected',
                    vectorStore: this.vectorStore ? 'initialized' : 'not_initialized'
                },
                activeSessions: this.activeSessions.size,
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
}

module.exports = InteractiveGameGenerator;