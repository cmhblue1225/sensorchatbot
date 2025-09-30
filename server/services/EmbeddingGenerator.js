/**
 * EmbeddingGenerator.js
 *
 * Phase 3.2 벡터 임베딩 시스템 - 임베딩 생성 및 저장 시스템
 * OpenAI API와 Supabase Vector Extension을 활용한 고성능 임베딩 시스템
 */

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

class EmbeddingGenerator {
    constructor() {
        this.openaiApiKey = process.env.OPENAI_API_KEY || '';
        this.supabaseUrl = process.env.SUPABASE_URL || '';
        this.supabaseKey = process.env.SUPABASE_ANON_KEY || '';

        // Supabase 클라이언트 초기화
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey);

        // 임베딩 설정
        this.embeddingModel = 'text-embedding-3-small'; // 최신 OpenAI 모델
        this.embeddingDimension = 1536; // text-embedding-3-small의 차원
        this.batchSize = 100; // 배치 처리 크기
        this.maxRetries = 3; // 최대 재시도 횟수

        // 레이트 리미팅 설정
        this.requestDelay = 100; // API 요청 간 대기 시간 (ms)
        this.lastRequestTime = 0;

        this.statistics = {
            totalProcessed: 0,
            totalErrors: 0,
            totalTokensUsed: 0,
            processingStartTime: null,
            avgProcessingTime: 0
        };
    }

    /**
     * 청크 데이터를 로드하고 임베딩 생성
     */
    async generateEmbeddings(chunksFilePath = null) {
        console.log('🚀 임베딩 생성 시작...');
        this.statistics.processingStartTime = Date.now();

        try {
            // 청크 데이터 로드
            const chunksData = await this.loadChunks(chunksFilePath);
            if (!chunksData) {
                throw new Error('청크 데이터를 로드할 수 없습니다.');
            }

            const chunks = chunksData.chunks;
            console.log(`📊 처리할 청크 개수: ${chunks.length}개`);

            // Vector 테이블 초기화
            await this.initializeVectorTable();

            // 배치 처리로 임베딩 생성
            const results = await this.processBatches(chunks);

            // 통계 출력
            this.printStatistics();

            return {
                success: true,
                totalProcessed: this.statistics.totalProcessed,
                results: results
            };

        } catch (error) {
            console.error('❌ 임베딩 생성 실패:', error.message);
            return {
                success: false,
                error: error.message,
                statistics: this.statistics
            };
        }
    }

    /**
     * 청크 데이터 로드
     */
    async loadChunks(inputPath = null) {
        if (!inputPath) {
            inputPath = path.join(__dirname, '../../data/document_chunks.json');
        }

        try {
            const data = JSON.parse(await fs.readFile(inputPath, 'utf-8'));
            console.log(`📖 청크 데이터 로드 완료: ${data.chunks.length}개 청크`);
            return data;
        } catch (error) {
            console.warn('청크 데이터 로드 실패:', error.message);
            return null;
        }
    }

    /**
     * Vector 테이블 초기화 (Supabase Vector Extension 사용)
     */
    async initializeVectorTable() {
        try {
            // 기존 벡터 데이터 확인
            const { count } = await this.supabase
                .from('document_vectors')
                .select('*', { count: 'exact', head: true });

            if (count > 0) {
                console.log(`📋 기존 벡터 데이터 발견: ${count}개 (삭제 후 재생성)`);
                await this.supabase
                    .from('document_vectors')
                    .delete()
                    .neq('id', '');
            }

            console.log('🗄️ Vector 테이블 초기화 완료');
        } catch (error) {
            console.warn('Vector 테이블 초기화 중 오류:', error.message);
        }
    }

    /**
     * 배치 단위로 임베딩 처리
     */
    async processBatches(chunks) {
        const results = [];
        const totalBatches = Math.ceil(chunks.length / this.batchSize);

        for (let i = 0; i < chunks.length; i += this.batchSize) {
            const batchNumber = Math.floor(i / this.batchSize) + 1;
            const batch = chunks.slice(i, i + this.batchSize);

            console.log(`🔄 배치 ${batchNumber}/${totalBatches} 처리 중... (${batch.length}개 청크)`);

            try {
                const batchResults = await this.processBatch(batch);
                results.push(...batchResults);

                // 레이트 리미팅을 위한 대기
                if (i + this.batchSize < chunks.length) {
                    await this.sleep(this.requestDelay);
                }
            } catch (error) {
                console.error(`❌ 배치 ${batchNumber} 처리 실패:`, error.message);
                this.statistics.totalErrors += batch.length;
            }
        }

        return results;
    }

    /**
     * 단일 배치 처리
     */
    async processBatch(chunks) {
        const batchResults = [];

        for (const chunk of chunks) {
            try {
                const startTime = Date.now();

                // 임베딩 생성
                const embedding = await this.generateSingleEmbedding(chunk.content);

                if (embedding) {
                    // Supabase에 저장
                    const vectorData = this.prepareVectorData(chunk, embedding);
                    const saved = await this.saveToSupabase(vectorData);

                    if (saved) {
                        batchResults.push({
                            chunkId: chunk.id,
                            success: true,
                            embeddingDimension: embedding.length
                        });
                        this.statistics.totalProcessed++;
                    }
                }

                // 처리 시간 추적
                const processingTime = Date.now() - startTime;
                this.updateProcessingStats(processingTime);

            } catch (error) {
                console.error(`청크 ${chunk.id} 처리 실패:`, error.message);
                batchResults.push({
                    chunkId: chunk.id,
                    success: false,
                    error: error.message
                });
                this.statistics.totalErrors++;
            }
        }

        return batchResults;
    }

    /**
     * 단일 텍스트에 대한 임베딩 생성
     */
    async generateSingleEmbedding(text) {
        // 텍스트 전처리
        const cleanText = this.preprocessText(text);

        // 레이트 리미팅
        await this.enforceRateLimit();

        let retries = 0;
        while (retries < this.maxRetries) {
            try {
                const response = await fetch('https://api.openai.com/v1/embeddings', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.openaiApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: this.embeddingModel,
                        input: cleanText,
                        encoding_format: 'float'
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`OpenAI API 오류: ${errorData.error?.message || response.statusText}`);
                }

                const data = await response.json();

                // 토큰 사용량 추적
                if (data.usage) {
                    this.statistics.totalTokensUsed += data.usage.total_tokens;
                }

                return data.data[0].embedding;

            } catch (error) {
                retries++;
                console.warn(`임베딩 생성 재시도 ${retries}/${this.maxRetries}:`, error.message);

                if (retries >= this.maxRetries) {
                    throw error;
                }

                // 지수 백오프
                await this.sleep(Math.pow(2, retries) * 1000);
            }
        }
    }

    /**
     * 텍스트 전처리
     */
    preprocessText(text) {
        return text
            .replace(/\s+/g, ' ') // 연속된 공백 정리
            .replace(/[^\w\s가-힣\.\,\!\?\-\(\)]/g, '') // 특수문자 제거
            .trim()
            .substring(0, 8000); // OpenAI 토큰 제한 고려
    }

    /**
     * Vector 데이터 준비
     */
    prepareVectorData(chunk, embedding) {
        return {
            id: chunk.id,
            content: chunk.content,
            embedding: embedding,
            metadata: {
                ...chunk.metadata,
                embedding_model: this.embeddingModel,
                embedding_dimension: this.embeddingDimension,
                created_at: new Date().toISOString()
            },
            file_path: chunk.metadata.file_path,
            doc_type: chunk.metadata.doc_type,
            category: chunk.metadata.category,
            difficulty: chunk.metadata.difficulty,
            tags: chunk.metadata.tags || [],
            section_title: chunk.metadata.section_title || '',
            chunk_index: chunk.metadata.chunk_index || 0,
            word_count: chunk.metadata.word_count || 0
        };
    }

    /**
     * Supabase에 벡터 데이터 저장
     */
    async saveToSupabase(vectorData) {
        try {
            const { data, error } = await this.supabase
                .from('document_vectors')
                .insert([vectorData])
                .select();

            if (error) {
                throw new Error(`Supabase 저장 오류: ${error.message}`);
            }

            return data && data.length > 0;
        } catch (error) {
            console.error('Supabase 저장 실패:', error.message);
            return false;
        }
    }

    /**
     * 레이트 리미팅 적용
     */
    async enforceRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.requestDelay) {
            await this.sleep(this.requestDelay - timeSinceLastRequest);
        }

        this.lastRequestTime = Date.now();
    }

    /**
     * 처리 통계 업데이트
     */
    updateProcessingStats(processingTime) {
        const currentAvg = this.statistics.avgProcessingTime;
        const count = this.statistics.totalProcessed;

        this.statistics.avgProcessingTime =
            (currentAvg * (count - 1) + processingTime) / count;
    }

    /**
     * 통계 출력
     */
    printStatistics() {
        const duration = Date.now() - this.statistics.processingStartTime;
        const durationMinutes = Math.round(duration / 60000 * 100) / 100;

        console.log('\n📊 임베딩 생성 통계:');
        console.log(`⏱️  총 처리 시간: ${durationMinutes}분`);
        console.log(`✅ 성공적으로 처리된 청크: ${this.statistics.totalProcessed}개`);
        console.log(`❌ 실패한 청크: ${this.statistics.totalErrors}개`);
        console.log(`🎯 토큰 사용량: ${this.statistics.totalTokensUsed.toLocaleString()}`);
        console.log(`⚡ 평균 처리 시간: ${Math.round(this.statistics.avgProcessingTime)}ms/청크`);

        if (this.statistics.totalProcessed > 0) {
            const successRate = ((this.statistics.totalProcessed /
                (this.statistics.totalProcessed + this.statistics.totalErrors)) * 100).toFixed(1);
            console.log(`📈 성공률: ${successRate}%`);
        }
    }

    /**
     * 특정 쿼리에 대한 유사도 검색
     */
    async searchSimilar(query, limit = 10, minSimilarity = 0.7) {
        try {
            // 쿼리 임베딩 생성
            const queryEmbedding = await this.generateSingleEmbedding(query);
            if (!queryEmbedding) {
                throw new Error('쿼리 임베딩 생성 실패');
            }

            // Supabase Vector 검색 (cosine similarity)
            const { data, error } = await this.supabase.rpc('search_documents', {
                query_embedding: queryEmbedding,
                match_threshold: minSimilarity,
                match_count: limit
            });

            if (error) {
                throw new Error(`벡터 검색 오류: ${error.message}`);
            }

            return data.map(item => ({
                ...item,
                similarity: item.similarity
            }));

        } catch (error) {
            console.error('유사도 검색 실패:', error.message);
            return [];
        }
    }

    /**
     * 하이브리드 검색 (의미론적 + 키워드)
     */
    async hybridSearch(query, options = {}) {
        const {
            limit = 10,
            semanticWeight = 0.7,
            keywordWeight = 0.3,
            minSimilarity = 0.6
        } = options;

        try {
            // 1. 의미론적 검색
            const semanticResults = await this.searchSimilar(query, limit * 2, minSimilarity);

            // 2. 키워드 검색
            const keywordResults = await this.keywordSearch(query, limit * 2);

            // 3. 하이브리드 스코어 계산
            const hybridResults = this.combineSearchResults(
                semanticResults,
                keywordResults,
                semanticWeight,
                keywordWeight
            );

            // 4. 상위 결과 반환
            return hybridResults
                .sort((a, b) => b.hybrid_score - a.hybrid_score)
                .slice(0, limit);

        } catch (error) {
            console.error('하이브리드 검색 실패:', error.message);
            return [];
        }
    }

    /**
     * 키워드 기반 검색
     */
    async keywordSearch(query, limit = 20) {
        try {
            const { data, error } = await this.supabase
                .from('document_vectors')
                .select('*')
                .or(`content.ilike.%${query}%,section_title.ilike.%${query}%,tags.cs.{${query}}`)
                .limit(limit);

            if (error) {
                throw new Error(`키워드 검색 오류: ${error.message}`);
            }

            return data.map(item => ({
                ...item,
                keyword_score: this.calculateKeywordScore(item, query)
            }));

        } catch (error) {
            console.error('키워드 검색 실패:', error.message);
            return [];
        }
    }

    /**
     * 키워드 스코어 계산
     */
    calculateKeywordScore(item, query) {
        const content = item.content.toLowerCase();
        const title = (item.section_title || '').toLowerCase();
        const queryLower = query.toLowerCase();

        let score = 0;

        // 제목에서의 매치 (높은 가중치)
        if (title.includes(queryLower)) {
            score += 0.5;
        }

        // 내용에서의 매치 빈도
        const contentMatches = (content.match(new RegExp(queryLower, 'g')) || []).length;
        score += Math.min(contentMatches * 0.1, 0.4);

        // 태그 매치
        if (item.tags && item.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
            score += 0.3;
        }

        return Math.min(score, 1.0);
    }

    /**
     * 검색 결과 결합
     */
    combineSearchResults(semanticResults, keywordResults, semanticWeight, keywordWeight) {
        const resultMap = new Map();

        // 의미론적 검색 결과 추가
        semanticResults.forEach(item => {
            resultMap.set(item.id, {
                ...item,
                semantic_score: item.similarity || 0,
                keyword_score: 0
            });
        });

        // 키워드 검색 결과 병합
        keywordResults.forEach(item => {
            if (resultMap.has(item.id)) {
                resultMap.get(item.id).keyword_score = item.keyword_score || 0;
            } else {
                resultMap.set(item.id, {
                    ...item,
                    semantic_score: 0,
                    keyword_score: item.keyword_score || 0
                });
            }
        });

        // 하이브리드 스코어 계산
        return Array.from(resultMap.values()).map(item => ({
            ...item,
            hybrid_score: (item.semantic_score * semanticWeight) +
                         (item.keyword_score * keywordWeight)
        }));
    }

    /**
     * 임베딩 시스템 상태 확인
     */
    async getSystemStatus() {
        try {
            const { count: totalVectors } = await this.supabase
                .from('document_vectors')
                .select('*', { count: 'exact', head: true });

            const { data: recentVectors } = await this.supabase
                .from('document_vectors')
                .select('metadata')
                .order('created_at', { ascending: false })
                .limit(5);

            return {
                total_vectors: totalVectors,
                embedding_model: this.embeddingModel,
                embedding_dimension: this.embeddingDimension,
                recent_updates: recentVectors?.map(v => v.metadata?.created_at) || [],
                system_ready: totalVectors > 0
            };
        } catch (error) {
            console.error('시스템 상태 확인 실패:', error.message);
            return {
                error: error.message,
                system_ready: false
            };
        }
    }

    /**
     * 유틸리티: Sleep 함수
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = EmbeddingGenerator;