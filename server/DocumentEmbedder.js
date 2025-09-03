/**
 * 📚 DocumentEmbedder v1.0
 * 
 * 게임 개발 문서들을 벡터 임베딩으로 변환하여 Supabase에 저장
 * - 텍스트 청킹 및 임베딩 생성
 * - 메타데이터 추출
 * - 벡터 데이터베이스 업로드
 */

const { OpenAIEmbeddings } = require('@langchain/openai');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

class DocumentEmbedder {
    constructor() {
        this.config = {
            openaiApiKey: process.env.OPENAI_API_KEY,
            supabaseUrl: process.env.SUPABASE_URL,
            supabaseKey: process.env.SUPABASE_ANON_KEY,
            embeddingModel: 'text-embedding-3-small',
            chunkSize: 1000,
            chunkOverlap: 200
        };

        this.supabaseClient = createClient(
            this.config.supabaseUrl,
            this.config.supabaseKey
        );

        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: this.config.openaiApiKey,
            modelName: this.config.embeddingModel,
        });

        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: this.config.chunkSize,
            chunkOverlap: this.config.chunkOverlap,
        });
    }

    /**
     * 전체 문서 임베딩 프로세스 실행
     */
    async embedAllDocuments() {
        try {
            console.log('📚 문서 임베딩 시작...');

            // 기존 데이터 정리
            await this.clearExistingData();

            // 문서 파일들 정의 (현재 프로젝트 경로로 수정)
            const basePath = '/Users/dev/졸업작품/sensorchatbot';
            const documents = [
                {
                    filePath: `${basePath}/AI_ASSISTANT_PROMPTS.md`,
                    type: 'prompt',
                    description: 'AI 어시스턴트용 프롬프트 템플릿'
                },
                {
                    filePath: `${basePath}/DEVELOPER_GUIDE.md`,
                    type: 'guide',
                    description: '개발자 가이드 문서'
                },
                {
                    filePath: `${basePath}/learning_data`,
                    type: 'guide',
                    description: '종합 학습 데이터'
                },
                {
                    filePath: `${basePath}/README.md`,
                    type: 'guide',
                    description: '프로젝트 개요 문서'
                },
                {
                    filePath: `${basePath}/GAME_TEMPLATE.html`,
                    type: 'template',
                    description: '게임 개발 템플릿'
                },
                {
                    filePath: `${basePath}/public/js/SessionSDK.js`,
                    type: 'api',
                    description: 'SessionSDK API 참조'
                }
            ];

            // 각 문서 처리
            for (const doc of documents) {
                await this.processDocument(doc);
            }

            // 예제 게임들 처리
            await this.processExampleGames();

            console.log('✅ 모든 문서 임베딩 완료');

            // 임베딩 결과 통계
            const stats = await this.getEmbeddingStats();
            console.log('📊 임베딩 통계:', stats);

            return {
                success: true,
                stats: stats,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ 문서 임베딩 실패:', error);
            throw error;
        }
    }

    /**
     * 기존 임베딩 데이터 정리
     */
    async clearExistingData() {
        try {
            console.log('🧹 기존 임베딩 데이터 정리 중...');
            
            const { error } = await this.supabaseClient
                .from('game_knowledge')
                .delete()
                .neq('id', 0); // 모든 행 삭제

            if (error) {
                throw error;
            }

            console.log('✅ 기존 데이터 정리 완료');

        } catch (error) {
            console.error('❌ 데이터 정리 실패:', error);
            throw error;
        }
    }

    /**
     * 개별 문서 처리
     */
    async processDocument(docInfo) {
        try {
            console.log(`📄 처리 중: ${path.basename(docInfo.filePath)}`);

            // 파일 읽기
            const content = await fs.readFile(docInfo.filePath, 'utf-8');

            // 텍스트 청킹
            const chunks = await this.textSplitter.splitText(content);
            console.log(`📋 ${chunks.length}개 청크 생성됨`);

            // 각 청크 임베딩 및 저장
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                
                // 임베딩 생성
                const embedding = await this.embeddings.embedQuery(chunk);

                // 메타데이터 생성
                const metadata = {
                    source_file: path.basename(docInfo.filePath),
                    document_type: docInfo.type,
                    description: docInfo.description,
                    chunk_index: i,
                    total_chunks: chunks.length,
                    char_count: chunk.length
                };

                // Supabase에 저장
                await this.saveEmbedding(chunk, embedding, metadata);
            }

            console.log(`✅ ${path.basename(docInfo.filePath)} 처리 완료`);

        } catch (error) {
            console.error(`❌ 문서 처리 실패 (${docInfo.filePath}):`, error);
            throw error;
        }
    }

    /**
     * 예제 게임들 처리
     */
    async processExampleGames() {
        try {
            const gamesDir = '/Users/dev/졸업작품/sensorchatbot/public/games';
            const gameTypes = ['solo', 'dual', 'multi', 'quick-draw', 'tilt-maze', 'cake-delivery', 'acorn-battle', 'rhythm-blade', 'shot-target', 'telephone'];

            for (const gameType of gameTypes) {
                const gamePath = path.join(gamesDir, gameType, 'index.html');
                
                try {
                    // 파일 존재 확인
                    await fs.access(gamePath);
                    
                    console.log(`🎮 예제 게임 처리 중: ${gameType}`);

                    const content = await fs.readFile(gamePath, 'utf-8');
                    
                    // HTML에서 JavaScript 코드 추출
                    const jsContent = this.extractJavaScriptFromHTML(content);
                    
                    if (jsContent) {
                        // JavaScript 코드 청킹
                        const chunks = await this.textSplitter.splitText(jsContent);

                        for (let i = 0; i < chunks.length; i++) {
                            const chunk = chunks[i];
                            const embedding = await this.embeddings.embedQuery(chunk);

                            const metadata = {
                                source_file: `${gameType}/index.html`,
                                document_type: 'example',
                                description: `${gameType} 게임 예제 코드`,
                                game_type: gameType,
                                chunk_index: i,
                                total_chunks: chunks.length,
                                char_count: chunk.length
                            };

                            await this.saveEmbedding(chunk, embedding, metadata);
                        }
                    }

                    console.log(`✅ ${gameType} 게임 처리 완료`);

                } catch (fileError) {
                    console.log(`⚠️ ${gameType} 게임 파일 없음, 건너뜀`);
                }
            }

        } catch (error) {
            console.error('❌ 예제 게임 처리 실패:', error);
            throw error;
        }
    }

    /**
     * HTML에서 JavaScript 코드 추출
     */
    extractJavaScriptFromHTML(htmlContent) {
        const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
        let jsContent = '';
        let match;

        while ((match = scriptRegex.exec(htmlContent)) !== null) {
            const scriptContent = match[1];
            // 외부 스크립트 제외 (src 속성이 있는 경우)
            if (!match[0].includes('src=')) {
                jsContent += scriptContent + '\n\n';
            }
        }

        return jsContent.trim();
    }

    /**
     * 임베딩 데이터 저장
     */
    async saveEmbedding(content, embedding, metadata) {
        try {
            const { error } = await this.supabaseClient
                .from('game_knowledge')
                .insert({
                    content: content,
                    embedding: embedding,
                    metadata: metadata,
                    document_type: metadata.document_type,
                    source_file: metadata.source_file,
                    chunk_index: metadata.chunk_index
                });

            if (error) {
                throw error;
            }

        } catch (error) {
            console.error('❌ 임베딩 저장 실패:', error);
            throw error;
        }
    }

    /**
     * 임베딩 통계 조회
     */
    async getEmbeddingStats() {
        try {
            const { data, error } = await this.supabaseClient
                .from('game_knowledge')
                .select('document_type, source_file')
                .order('document_type');

            if (error) {
                throw error;
            }

            // 타입별 통계
            const typeStats = {};
            const fileStats = {};

            data.forEach(row => {
                typeStats[row.document_type] = (typeStats[row.document_type] || 0) + 1;
                fileStats[row.source_file] = (fileStats[row.source_file] || 0) + 1;
            });

            return {
                total: data.length,
                byType: typeStats,
                byFile: fileStats
            };

        } catch (error) {
            console.error('❌ 통계 조회 실패:', error);
            return null;
        }
    }

    /**
     * 특정 문서 재임베딩
     */
    async reembedDocument(filePath) {
        try {
            console.log(`🔄 문서 재임베딩: ${path.basename(filePath)}`);

            // 기존 임베딩 삭제
            const { error: deleteError } = await this.supabaseClient
                .from('game_knowledge')
                .delete()
                .eq('source_file', path.basename(filePath));

            if (deleteError) {
                throw deleteError;
            }

            // 새로 임베딩
            const docInfo = {
                filePath: filePath,
                type: this.inferDocumentType(filePath),
                description: `재임베딩된 문서: ${path.basename(filePath)}`
            };

            await this.processDocument(docInfo);

            console.log(`✅ ${path.basename(filePath)} 재임베딩 완료`);

        } catch (error) {
            console.error(`❌ 재임베딩 실패 (${filePath}):`, error);
            throw error;
        }
    }

    /**
     * 파일 경로에서 문서 타입 추론
     */
    inferDocumentType(filePath) {
        const fileName = path.basename(filePath).toLowerCase();
        
        if (fileName.includes('prompt')) return 'prompt';
        if (fileName.includes('guide')) return 'guide';
        if (fileName.includes('template')) return 'template';
        if (fileName.includes('sdk')) return 'api';
        if (fileName.includes('readme')) return 'guide';
        
        return 'guide'; // 기본값
    }
}

module.exports = DocumentEmbedder;