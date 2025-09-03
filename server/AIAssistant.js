/**
 * 🤖 AIAssistant v1.0
 * 
 * Sensor Game Hub 개발자를 위한 RAG 기반 AI 도우미
 * - Claude API 연동
 * - Supabase 벡터 저장소 활용
 * - 게임 개발 질문 답변 및 코드 생성
 */

const { ChatAnthropic } = require('@langchain/anthropic');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { SupabaseVectorStore } = require('@langchain/community/vectorstores/supabase');
const { createClient } = require('@supabase/supabase-js');
const { PromptTemplate } = require('@langchain/core/prompts');
const { RunnableSequence } = require('@langchain/core/runnables');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const fs = require('fs').promises;
const path = require('path');

class AIAssistant {
    constructor() {
        this.config = {
            claudeApiKey: process.env.CLAUDE_API_KEY,
            openaiApiKey: process.env.OPENAI_API_KEY,
            supabaseUrl: process.env.SUPABASE_URL,
            supabaseKey: process.env.SUPABASE_ANON_KEY,
            embeddingModel: 'text-embedding-3-small',
            claudeModel: 'claude-3-haiku-20240307',
            chunkSize: 1000,
            chunkOverlap: 200,
            maxTokens: 4000
        };

        this.supabaseClient = null;
        this.vectorStore = null;
        this.embeddings = null;
        this.llm = null;
        this.ragChain = null;

        this.initialize();
    }

    async initialize() {
        try {
            console.log('🤖 AI Assistant 초기화 중...');

            // Supabase 클라이언트 초기화
            this.supabaseClient = createClient(
                this.config.supabaseUrl,
                this.config.supabaseKey
            );

            // OpenAI 임베딩 모델 초기화
            this.embeddings = new OpenAIEmbeddings({
                openAIApiKey: this.config.openaiApiKey,
                modelName: this.config.embeddingModel,
            });

            // Claude LLM 초기화
            this.llm = new ChatAnthropic({
                anthropicApiKey: this.config.claudeApiKey,
                modelName: this.config.claudeModel,
                maxTokens: this.config.maxTokens,
                temperature: 0.3, // 일관성 있는 답변을 위해 낮은 temperature
            });

            // Supabase 벡터 저장소 초기화
            this.vectorStore = new SupabaseVectorStore(this.embeddings, {
                client: this.supabaseClient,
                tableName: 'game_knowledge',
                queryName: 'match_documents'
            });

            // RAG 체인 구성
            await this.setupRAGChain();

            console.log('✅ AI Assistant 초기화 완료');

        } catch (error) {
            console.error('❌ AI Assistant 초기화 실패:', error);
            throw error;
        }
    }

    async setupRAGChain() {
        // 시스템 프롬프트 템플릿
        const systemPrompt = `당신은 Sensor Game Hub v6.0의 전문 게임 개발 도우미입니다.

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

제공된 컨텍스트를 참조하여 정확하고 도움이 되는 답변을 제공하세요.

컨텍스트:
{context}

질문: {question}

답변:`;

        // 프롬프트 템플릿 생성
        const promptTemplate = PromptTemplate.fromTemplate(systemPrompt);

        // RAG 체인 구성 - 직접 벡터 검색 구현
        this.ragChain = RunnableSequence.from([
            {
                context: async (input) => {
                    try {
                        // 질문을 임베딩으로 변환
                        const queryEmbedding = await this.embeddings.embedQuery(input.question);
                        
                        // Supabase RPC 직접 호출
                        const { data, error } = await this.supabaseClient
                            .rpc('match_documents', {
                                query_embedding: queryEmbedding,
                                match_threshold: 0.7,
                                match_count: 5
                            });

                        if (error) {
                            console.error('벡터 검색 오류:', error);
                            return '관련 문서를 찾을 수 없습니다.';
                        }

                        if (!data || data.length === 0) {
                            return '관련 문서를 찾을 수 없습니다.';
                        }

                        return data.map(doc => doc.content).join('\n\n');
                    } catch (error) {
                        console.error('컨텍스트 검색 오류:', error);
                        return '문서 검색 중 오류가 발생했습니다.';
                    }
                },
                question: (input) => input.question,
            },
            promptTemplate,
            this.llm,
            new StringOutputParser(),
        ]);
    }

    /**
     * 사용자 질문에 대한 답변 생성
     */
    async query(question, options = {}) {
        try {
            console.log(`🤔 질문 처리 중: "${question}"`);

            if (!this.ragChain) {
                throw new Error('RAG 체인이 초기화되지 않았습니다.');
            }

            // RAG 체인을 통해 답변 생성
            const response = await this.ragChain.invoke({
                question: question
            });

            console.log('✅ 답변 생성 완료');

            return {
                success: true,
                answer: response,
                timestamp: new Date().toISOString()
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
     * 코드 생성 특화 함수
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
     * 디버깅 도움말 특화 함수
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
     * 지식 베이스 상태 확인
     */
    async getKnowledgeBaseStatus() {
        try {
            const { data, error } = await this.supabaseClient
                .from('game_knowledge')
                .select('document_type, count(*)')
                .groupBy('document_type');

            if (error) {
                throw error;
            }

            return {
                success: true,
                status: data || [],
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
     * 헬스 체크
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
                components: {
                    supabase: 'connected',
                    claude: this.llm ? 'initialized' : 'not_initialized',
                    embeddings: this.embeddings ? 'initialized' : 'not_initialized',
                    vectorStore: this.vectorStore ? 'initialized' : 'not_initialized'
                },
                knowledgeBase: {
                    totalDocuments: data?.length || 0
                },
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