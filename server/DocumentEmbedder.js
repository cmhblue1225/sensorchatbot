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
     * 배포 환경에 따른 기본 경로 감지
     */
    detectBasePath() {
        // Render.com 배포 환경 감지
        if (process.env.RENDER) {
            return '/opt/render/project/src';
        }
        
        // 로컬 개발 환경 감지
        if (process.cwd().includes('졸업작품/sensorchatbot')) {
            return '/Users/dev/졸업작품/sensorchatbot';
        }
        
        // 기본적으로 현재 작업 디렉토리 사용
        return process.cwd();
    }

    /**
     * 실제 존재하는 파일만 필터링
     */
    async filterExistingFiles(potentialDocuments) {
        const existingDocuments = [];
        
        console.log('📋 파일 존재 여부 확인 중...');
        
        for (const doc of potentialDocuments) {
            try {
                await fs.access(doc.filePath);
                existingDocuments.push(doc);
                console.log(`  ✅ ${path.basename(doc.filePath)} - 존재함`);
            } catch (error) {
                console.log(`  ❌ ${path.basename(doc.filePath)} - 없음 (${doc.filePath})`);
            }
        }
        
        console.log(`📊 총 ${existingDocuments.length}/${potentialDocuments.length}개 파일이 사용 가능합니다.`);
        return existingDocuments;
    }

    /**
     * 전체 문서 임베딩 프로세스 실행
     */
    async embedAllDocuments() {
        try {
            console.log('📚 문서 임베딩 시작...');

            // 기존 데이터 정리
            await this.clearExistingData();

            // 문서 파일들 정의 (동적 경로 감지)
            const basePath = this.detectBasePath();
            console.log(`📁 감지된 기본 경로: ${basePath}`);
            console.log(`🔍 현재 작업 디렉토리: ${process.cwd()}`);
            console.log(`🌍 환경: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🏢 Render 환경: ${process.env.RENDER ? 'Yes' : 'No'}`);
            
            // 사용 가능한 파일만 필터링하여 문서 목록 생성
            const potentialDocuments = [
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
                    filePath: `${basePath}/CLAUDE.md`,
                    type: 'guide',
                    description: '프로젝트 상세 문서 및 아키텍처 가이드'
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
                },
                {
                    filePath: `${basePath}/public/sensor.html`,
                    type: 'template',
                    description: '센서 클라이언트 템플릿'
                }
            ];

            // 실제 존재하는 파일만 필터링
            const documents = await this.filterExistingFiles(potentialDocuments);

            // 각 문서 처리
            for (const doc of documents) {
                await this.processDocument(doc);
            }

            // 예제 게임들 처리
            await this.processExampleGames();

            // 주요 서버 파일들 처리
            await this.processServerFiles();

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
     * 개별 문서 처리 (재시도 로직 포함)
     */
    async processDocument(docInfo, retryCount = 0) {
        try {
            console.log(`📄 처리 중: ${path.basename(docInfo.filePath)}`);

            // 파일 읽기
            const content = await fs.readFile(docInfo.filePath, 'utf-8');

            // 빈 파일 체크
            if (!content || content.trim().length === 0) {
                console.log(`⚠️ ${path.basename(docInfo.filePath)} 파일이 비어있음, 건너뜀`);
                return;
            }

            // 텍스트 청킹
            const chunks = await this.textSplitter.splitText(content);
            console.log(`📋 ${chunks.length}개 청크 생성됨`);

            let processedChunks = 0;
            let failedChunks = 0;

            // 각 청크 임베딩 및 저장
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                
                try {
                    // 빈 청크 스킵
                    if (!chunk || chunk.trim().length < 10) {
                        continue;
                    }

                    // 임베딩 생성 (재시도 포함)
                    const embedding = await this.generateEmbeddingWithRetry(chunk, 3);

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
                    await this.saveEmbeddingWithRetry(chunk, embedding, metadata, 3);
                    processedChunks++;

                } catch (chunkError) {
                    console.error(`❌ 청크 ${i} 처리 실패:`, chunkError.message);
                    failedChunks++;
                }
            }

            console.log(`✅ ${path.basename(docInfo.filePath)} 처리 완료 (${processedChunks}/${chunks.length} 청크 성공)`);

            if (failedChunks > 0) {
                console.log(`⚠️ ${failedChunks}개 청크 처리 실패`);
            }

        } catch (error) {
            console.error(`❌ 문서 처리 실패 (${docInfo.filePath}):`, error.message);
            
            // 재시도 로직
            if (retryCount < 2) {
                console.log(`🔄 재시도 중... (${retryCount + 1}/2)`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // 지수 백오프
                return this.processDocument(docInfo, retryCount + 1);
            }
            
            console.error(`❌ ${path.basename(docInfo.filePath)} 최종 처리 실패`);
            // 개별 문서 실패로 전체 프로세스를 중단하지 않음
        }
    }

    /**
     * 예제 게임들 처리
     */
    async processExampleGames() {
        try {
            const basePath = this.detectBasePath();
            const gamesDir = `${basePath}/public/games`;
            
            console.log(`🎮 게임 디렉토리 확인 중: ${gamesDir}`);
            
            // 실제 존재하는 게임 디렉토리 스캔
            let availableGames = [];
            try {
                const gameEntries = await fs.readdir(gamesDir, { withFileTypes: true });
                availableGames = gameEntries
                    .filter(entry => entry.isDirectory())
                    .map(entry => entry.name);
                    
                console.log(`📁 발견된 게임 폴더: ${availableGames.join(', ')}`);
            } catch (error) {
                console.log(`❌ 게임 디렉토리 접근 실패: ${error.message}`);
                return;
            }

            for (const gameType of availableGames) {
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
     * 주요 서버 파일들 처리
     */
    async processServerFiles() {
        try {
            const basePath = this.detectBasePath();
            const serverDir = `${basePath}/server`;
            
            console.log(`🔧 서버 디렉토리 확인 중: ${serverDir}`);
            
            const potentialServerFiles = [
                {
                    fileName: 'SessionManager.js',
                    description: '세션 관리 시스템'
                },
                {
                    fileName: 'GameScanner.js', 
                    description: '게임 자동 스캔 시스템'
                },
                {
                    fileName: 'AIAssistant.js',
                    description: 'AI 어시스턴트 RAG 시스템'
                },
                {
                    fileName: 'GameTemplateEngine.js',
                    description: '게임 템플릿 엔진'
                },
                {
                    fileName: 'InteractiveGameGenerator.js',
                    description: '대화형 게임 생성기'
                }
            ];

            // 실제 존재하는 서버 파일만 필터링
            const availableServerFiles = [];
            for (const fileInfo of potentialServerFiles) {
                const filePath = path.join(serverDir, fileInfo.fileName);
                try {
                    await fs.access(filePath);
                    availableServerFiles.push(fileInfo);
                    console.log(`  ✅ ${fileInfo.fileName} - 존재함`);
                } catch (error) {
                    console.log(`  ❌ ${fileInfo.fileName} - 없음`);
                }
            }
            
            console.log(`📊 총 ${availableServerFiles.length}/${potentialServerFiles.length}개 서버 파일이 사용 가능합니다.`);

            for (const fileInfo of availableServerFiles) {
                const filePath = path.join(serverDir, fileInfo.fileName);
                
                try {
                    console.log(`🔧 서버 파일 처리 중: ${fileInfo.fileName}`);

                    const content = await fs.readFile(filePath, 'utf-8');
                    
                    // JavaScript 코드 청킹
                    const chunks = await this.textSplitter.splitText(content);

                    for (let i = 0; i < chunks.length; i++) {
                        const chunk = chunks[i];
                        const embedding = await this.embeddings.embedQuery(chunk);

                        const metadata = {
                            source_file: fileInfo.fileName,
                            document_type: 'server_code',
                            description: fileInfo.description,
                            file_type: 'javascript',
                            chunk_index: i,
                            total_chunks: chunks.length,
                            char_count: chunk.length
                        };

                        await this.saveEmbedding(chunk, embedding, metadata);
                    }

                    console.log(`✅ ${fileInfo.fileName} 처리 완료`);

                } catch (fileError) {
                    console.log(`⚠️ ${fileInfo.fileName} 파일 없음, 건너뜀`);
                }
            }

            console.log('✅ 모든 서버 파일 처리 완료');

        } catch (error) {
            console.error('❌ 서버 파일 처리 실패:', error);
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
     * 재시도 포함 임베딩 생성
     */
    async generateEmbeddingWithRetry(text, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const embedding = await this.embeddings.embedQuery(text);
                return embedding;
            } catch (error) {
                lastError = error;
                console.log(`⚠️ 임베딩 생성 실패 (시도 ${attempt + 1}/${maxRetries}): ${error.message}`);
                
                if (attempt < maxRetries - 1) {
                    // 지수 백오프
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }
        
        throw new Error(`임베딩 생성 최종 실패: ${lastError?.message}`);
    }

    /**
     * 재시도 포함 임베딩 저장
     */
    async saveEmbeddingWithRetry(content, embedding, metadata, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
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
                
                return; // 성공
                
            } catch (error) {
                lastError = error;
                console.log(`⚠️ 임베딩 저장 실패 (시도 ${attempt + 1}/${maxRetries}): ${error.message}`);
                
                if (attempt < maxRetries - 1) {
                    // 지수 백오프
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }
        
        throw new Error(`임베딩 저장 최종 실패: ${lastError?.message}`);
    }

    /**
     * 임베딩 데이터 저장 (하위 호환성)
     */
    async saveEmbedding(content, embedding, metadata) {
        return this.saveEmbeddingWithRetry(content, embedding, metadata, 1);
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