/**
 * 🤖 AIAssistant v2.0 - 프롬프트 캐싱 최적화 버전
 *
 * Sensor Game Hub 개발자를 위한 RAG 기반 AI 도우미
 *
 * ✨ v2.0 주요 개선사항:
 * - Anthropic SDK 직접 사용 (LangChain 제거)
 * - 프롬프트 캐싱 적용 (비용 90% 절감)
 * - 대화 히스토리 지원 (세션 기반)
 * - Claude Sonnet 4.5 업그레이드
 */

const Anthropic = require('@anthropic-ai/sdk');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { createClient } = require('@supabase/supabase-js');

class AIAssistant {
    constructor() {
        this.config = {
            claudeApiKey: process.env.CLAUDE_API_KEY,
            openaiApiKey: process.env.OPENAI_API_KEY,
            supabaseUrl: process.env.SUPABASE_URL,
            supabaseKey: process.env.SUPABASE_ANON_KEY,
            embeddingModel: 'text-embedding-3-small',
            // 🚀 Claude Sonnet 4.5 (2025.09.29)
            claudeModel: 'claude-sonnet-4-5-20250929',
            maxTokens: 4096,
            temperature: 0.3
        };

        this.supabaseClient = null;
        this.embeddings = null;
        // ✨ Anthropic SDK 클라이언트
        this.anthropicClient = null;

        this.initialize();
    }

    async initialize() {
        try {
            console.log('🤖 AI Assistant v2.0 초기화 중...');

            // Supabase 클라이언트 초기화
            this.supabaseClient = createClient(
                this.config.supabaseUrl,
                this.config.supabaseKey
            );

            // OpenAI 임베딩 모델 초기화 (RAG용)
            this.embeddings = new OpenAIEmbeddings({
                openAIApiKey: this.config.openaiApiKey,
                modelName: this.config.embeddingModel,
            });

            // ✨ Anthropic SDK 클라이언트 초기화
            this.anthropicClient = new Anthropic({
                apiKey: this.config.claudeApiKey
            });

            console.log('✅ AI Assistant v2.0 초기화 완료');
            console.log(`📊 모델: ${this.config.claudeModel}`);
            console.log('💡 프롬프트 캐싱 활성화됨');

        } catch (error) {
            console.error('❌ AI Assistant 초기화 실패:', error);
            throw error;
        }
    }

    /**
     * 📚 RAG 문서 검색 (벡터 유사도 기반)
     */
    async searchDocs(query) {
        try {
            // 질문을 임베딩으로 변환
            const queryEmbedding = await this.embeddings.embedQuery(query);

            // Supabase RPC 직접 호출
            const { data, error } = await this.supabaseClient
                .rpc('match_documents', {
                    query_embedding: queryEmbedding,
                    match_threshold: 0.7,
                    match_count: 5
                });

            if (error) {
                console.error('❌ 벡터 검색 오류:', error);
                return '관련 문서를 찾을 수 없습니다.';
            }

            if (!data || data.length === 0) {
                return '관련 문서를 찾을 수 없습니다.';
            }

            // 문서 내용 결합
            const relevantDocs = data.map(doc => doc.content).join('\n\n---\n\n');

            console.log(`📚 관련 문서 ${data.length}개 검색 완료`);

            return relevantDocs;
        } catch (error) {
            console.error('❌ 문서 검색 오류:', error);
            return '문서 검색 중 오류가 발생했습니다.';
        }
    }

    /**
     * 🎯 시스템 프롬프트 생성 (캐싱 적용)
     */
    getSystemPrompt() {
        return `당신은 Sensor Game Hub v6.0의 전문 게임 개발 도우미입니다.

주요 역할:
- 모바일 센서를 활용한 게임 개발 질문에 답변
- SessionSDK 사용법 안내
- 게임 코드 자동 생성 및 디버깅 도움
- 개발 가이드라인 제공

중요한 개발 규칙:
1. SessionSDK 이벤트는 반드시 'event.detail || event' 패턴으로 처리
2. 서버 연결 완료 후 세션 생성 ('connected' 이벤트 대기)
3. QR 코드 생성 시 폴백 처리 포함
4. 기존 CSS 테마 변수 사용 (--primary, --secondary 등)
5. 절대 경로 사용, 허브로 돌아가기는 href="/"

센서 데이터 구조:
- orientation: alpha(회전), beta(앞뒤기울기), gamma(좌우기울기) - 기기 방향
- acceleration: x(좌우), y(상하), z(앞뒤) - 가속도
- rotationRate: alpha(Z축), beta(X축), gamma(Y축) - 회전 속도

게임 타입:
- solo: 1명 플레이어, 단일 센서
- dual: 2명 협력, 2개 센서
- multi: 3-8명 경쟁, 여러 센서

답변 시 고려사항:
- 구체적이고 실행 가능한 코드 예제 제공
- 일반적인 실수와 해결책 포함
- 단계별 구현 가이드 제공
- 기존 예제 게임들(solo, dual, multi) 참조

제공된 컨텍스트를 참조하여 정확하고 도움이 되는 답변을 제공하세요.`;
    }

    /**
     * 💬 챗봇 대화 처리 (프롬프트 캐싱 적용)
     *
     * @param {string} message - 사용자 메시지
     * @param {Array} conversationHistory - 대화 히스토리 [{ role, content }]
     * @returns {Object} { success, message, usage, timestamp }
     */
    async processChat(message, conversationHistory = []) {
        try {
            console.log(`💬 챗봇 메시지 처리 중: "${message.substring(0, 50)}..."`);

            if (!message || message.trim().length === 0) {
                return {
                    success: false,
                    error: '메시지를 입력해주세요.',
                    timestamp: new Date().toISOString()
                };
            }

            // 1️⃣ RAG 문서 검색
            const relevantDocs = await this.searchDocs(message);

            // 2️⃣ 시스템 프롬프트 구성 (캐싱 적용)
            const systemMessages = [
                {
                    type: "text",
                    text: this.getSystemPrompt(),
                    // ✨ 시스템 프롬프트 캐싱 (5분 TTL, 자동 갱신)
                    cache_control: { type: "ephemeral" }
                },
                {
                    type: "text",
                    text: `\n\n📚 관련 문서 및 예제:\n\n${relevantDocs}`,
                    // ✨ RAG 문서 캐싱 (5분 TTL, 자동 갱신)
                    cache_control: { type: "ephemeral" }
                }
            ];

            // 3️⃣ 대화 히스토리 구성 (마지막 메시지에 증분 캐싱)
            const messages = conversationHistory.map((msg, idx) => {
                // 마지막 메시지는 cache_control 적용
                if (idx === conversationHistory.length - 1) {
                    return {
                        role: msg.role,
                        content: [
                            {
                                type: "text",
                                text: msg.content,
                                // ✨ 대화 히스토리 증분 캐싱 (caching.md Line 888-1099)
                                cache_control: { type: "ephemeral" }
                            }
                        ]
                    };
                }

                // 이전 메시지들은 문자열로
                return {
                    role: msg.role,
                    content: msg.content
                };
            });

            // 현재 메시지 추가
            messages.push({
                role: 'user',
                content: message
            });

            // 4️⃣ Claude API 호출 (캐싱 적용)
            const response = await this.anthropicClient.messages.create({
                model: this.config.claudeModel,
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature,
                system: systemMessages, // ✅ 캐싱된 시스템 프롬프트
                messages: messages
            });

            // 5️⃣ 캐시 통계 로깅
            if (response.usage) {
                const cacheRead = response.usage.cache_read_input_tokens || 0;
                const cacheCreate = response.usage.cache_creation_input_tokens || 0;
                const inputTokens = response.usage.input_tokens || 0;

                console.log('📊 토큰 사용량:', {
                    input: inputTokens,
                    cache_read: cacheRead,
                    cache_create: cacheCreate,
                    output: response.usage.output_tokens,
                    cache_hit_rate: cacheRead > 0 ? `${Math.round(cacheRead / (cacheRead + inputTokens) * 100)}%` : '0%'
                });
            }

            console.log('✅ 답변 생성 완료');

            return {
                success: true,
                message: response.content[0].text,
                usage: response.usage, // 캐시 통계 포함
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ 챗봇 처리 실패:', error);

            return {
                success: false,
                error: error.message || '챗봇 응답 중 오류가 발생했습니다.',
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 🤔 단순 질문 처리 (대화 히스토리 없이)
     */
    async query(question, options = {}) {
        try {
            console.log(`🤔 질문 처리 중: "${question.substring(0, 50)}..."`);

            const result = await this.processChat(question, []);

            if (!result.success) {
                throw new Error(result.error);
            }

            return {
                success: true,
                answer: result.message,
                usage: result.usage,
                timestamp: result.timestamp
            };

        } catch (error) {
            console.error('❌ 질문 처리 실패:', error);

            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 💻 코드 생성 특화 함수
     */
    async generateCode(request) {
        try {
            const codePrompt = `다음 요청에 따라 Sensor Game Hub v6.0용 게임 코드를 생성해주세요:

요청: ${request}

생성할 코드:
- GAME_TEMPLATE.html 기반으로 구조화
- 필수 개발 패턴 준수 (event.detail || event, connected 이벤트 대기)
- 주석과 함께 완전한 코드 제공
- 센서 데이터 처리 및 게임 로직 포함

완전한 HTML 파일 형태로 제공하세요.`;

            return await this.query(codePrompt);

        } catch (error) {
            console.error('❌ 코드 생성 실패:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 🐛 디버깅 도움말 특화 함수
     */
    async debugHelp(errorDescription, codeSnippet = '') {
        try {
            const debugPrompt = `다음 오류를 해결해주세요:

오류 설명: ${errorDescription}

${codeSnippet ? `관련 코드:\n${codeSnippet}` : ''}

해결 방법:
- 구체적인 해결 단계 제시
- 수정된 코드 예제 제공
- 유사한 오류 방지 팁 포함`;

            return await this.query(debugPrompt);

        } catch (error) {
            console.error('❌ 디버깅 도움말 생성 실패:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 📊 지식 베이스 상태 확인
     */
    async getKnowledgeBaseStatus() {
        try {
            const { count, error } = await this.supabaseClient
                .from('game_knowledge')
                .select('*', { count: 'exact', head: true });

            if (error) {
                throw error;
            }

            return {
                success: true,
                totalDocuments: count || 0,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ 지식 베이스 상태 확인 실패:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * ❤️ 헬스 체크
     */
    async healthCheck() {
        try {
            // Supabase 연결 확인
            const { data, error } = await this.supabaseClient
                .from('game_knowledge')
                .select('id')
                .limit(1);

            if (error) {
                throw new Error(`Supabase 연결 실패: ${error.message}`);
            }

            return {
                success: true,
                status: 'healthy',
                version: '2.0',
                components: {
                    supabase: 'connected',
                    anthropic: this.anthropicClient ? 'initialized' : 'not_initialized',
                    embeddings: this.embeddings ? 'initialized' : 'not_initialized'
                },
                features: {
                    promptCaching: true,
                    conversationHistory: true,
                    ragSearch: true
                },
                model: this.config.claudeModel,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ 헬스 체크 실패:', error);
            return {
                success: false,
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = AIAssistant;
