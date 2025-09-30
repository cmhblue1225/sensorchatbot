/**
 * VectorEmbeddingService.js
 *
 * Phase 3.2 벡터 임베딩 시스템 - 통합 관리 서비스
 * DocumentChunker, EmbeddingGenerator, SearchAPI를 통합 관리하는 메인 서비스
 */

const DocumentChunker = require('./DocumentChunker');
const EmbeddingGenerator = require('./EmbeddingGenerator');
const SearchAPI = require('./SearchAPI');
const fs = require('fs').promises;
const path = require('path');

class VectorEmbeddingService {
    constructor() {
        this.documentChunker = new DocumentChunker();
        this.embeddingGenerator = new EmbeddingGenerator();
        this.searchAPI = new SearchAPI();

        // 서비스 설정
        this.dataDir = path.join(__dirname, '../../data');
        this.chunksFilePath = path.join(this.dataDir, 'document_chunks.json');
        this.logFilePath = path.join(this.dataDir, 'embedding_service.log');

        // 상태 관리
        this.isInitialized = false;
        this.isProcessing = false;
        this.lastProcessingTime = null;

        // 진행 상황 추적
        this.progress = {
            currentPhase: '',
            percentage: 0,
            details: '',
            startTime: null,
            estimatedEndTime: null
        };

        // 이벤트 리스너 (옵션)
        this.eventListeners = new Map();
    }

    /**
     * 전체 임베딩 시스템 초기화 및 구축
     */
    async initializeEmbeddingSystem(options = {}) {
        try {
            this.isProcessing = true;
            this.progress.startTime = Date.now();
            await this.log('🚀 벡터 임베딩 시스템 초기화 시작');

            const {
                forceRebuild = false,
                skipExisting = true,
                enableProgress = true
            } = options;

            // Phase 1: 문서 청킹
            await this.updateProgress('문서 청킹', 10, '문서를 최적화된 청크로 분할 중...');
            const chunkResult = await this.processDocumentChunking(forceRebuild);

            if (!chunkResult.success) {
                throw new Error(`문서 청킹 실패: ${chunkResult.error}`);
            }

            // Phase 2: 임베딩 생성
            await this.updateProgress('임베딩 생성', 30, '문서 청크에 대한 벡터 임베딩 생성 중...');
            const embeddingResult = await this.processEmbeddingGeneration(skipExisting);

            if (!embeddingResult.success) {
                throw new Error(`임베딩 생성 실패: ${embeddingResult.error}`);
            }

            // Phase 3: 검색 시스템 검증
            await this.updateProgress('검색 시스템 검증', 80, '하이브리드 검색 시스템 기능 검증 중...');
            const searchResult = await this.validateSearchSystem();

            if (!searchResult.success) {
                throw new Error(`검색 시스템 검증 실패: ${searchResult.error}`);
            }

            // Phase 4: 완료
            await this.updateProgress('완료', 100, '벡터 임베딩 시스템 구축 완료');
            this.isInitialized = true;
            this.lastProcessingTime = Date.now();

            const result = {
                success: true,
                totalTime: Date.now() - this.progress.startTime,
                chunksProcessed: chunkResult.chunksProcessed,
                embeddingsGenerated: embeddingResult.totalProcessed,
                searchTests: searchResult.testsRun,
                systemReady: true
            };

            await this.log(`✅ 벡터 임베딩 시스템 구축 완료: ${JSON.stringify(result, null, 2)}`);
            this.emit('initialization-complete', result);

            return result;

        } catch (error) {
            await this.log(`❌ 시스템 초기화 실패: ${error.message}`);
            this.emit('initialization-error', error);

            return {
                success: false,
                error: error.message,
                progress: this.progress
            };
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 문서 청킹 처리
     */
    async processDocumentChunking(forceRebuild = false) {
        try {
            // 기존 청크 파일 확인
            if (!forceRebuild) {
                try {
                    const existingData = await fs.readFile(this.chunksFilePath, 'utf-8');
                    const parsedData = JSON.parse(existingData);

                    if (parsedData.chunks && parsedData.chunks.length > 0) {
                        await this.log(`📄 기존 청크 데이터 사용: ${parsedData.chunks.length}개 청크`);
                        return {
                            success: true,
                            chunksProcessed: parsedData.chunks.length,
                            fromCache: true
                        };
                    }
                } catch (error) {
                    await this.log('기존 청크 파일을 찾을 수 없음, 새로 생성합니다.');
                }
            }

            // 새로운 청크 생성
            const chunks = await this.documentChunker.chunkAllDocuments();
            const chunkData = await this.documentChunker.saveChunks(this.chunksFilePath);

            return {
                success: true,
                chunksProcessed: chunks.length,
                statistics: chunkData.statistics,
                fromCache: false
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 임베딩 생성 처리
     */
    async processEmbeddingGeneration(skipExisting = true) {
        try {
            // Supabase에서 기존 임베딩 확인
            if (skipExisting) {
                const systemStatus = await this.embeddingGenerator.getSystemStatus();
                if (systemStatus.system_ready && systemStatus.total_vectors > 0) {
                    await this.log(`📊 기존 임베딩 데이터 사용: ${systemStatus.total_vectors}개`);
                    return {
                        success: true,
                        totalProcessed: systemStatus.total_vectors,
                        fromCache: true
                    };
                }
            }

            // 새로운 임베딩 생성
            const result = await this.embeddingGenerator.generateEmbeddings(this.chunksFilePath);
            return result;

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 검색 시스템 검증
     */
    async validateSearchSystem() {
        try {
            const testQueries = [
                {
                    query: 'SessionSDK 사용 방법',
                    type: 'semantic',
                    expectedResults: 1
                },
                {
                    query: 'sensor orientation',
                    type: 'keyword',
                    expectedResults: 1
                },
                {
                    query: '센서 데이터 처리',
                    type: 'hybrid',
                    expectedResults: 1
                }
            ];

            const testResults = [];
            let testsRun = 0;

            for (const test of testQueries) {
                try {
                    const result = await this.searchAPI.search(test.query, {
                        searchType: test.type,
                        limit: 5
                    });

                    const success = result.success && result.results.length >= test.expectedResults;
                    testResults.push({
                        query: test.query,
                        type: test.type,
                        success: success,
                        resultCount: result.results.length,
                        responseTime: result.meta.responseTime
                    });

                    testsRun++;
                } catch (error) {
                    testResults.push({
                        query: test.query,
                        type: test.type,
                        success: false,
                        error: error.message
                    });
                }
            }

            const successfulTests = testResults.filter(t => t.success).length;
            const allTestsPassed = successfulTests === testQueries.length;

            await this.log(`🧪 검색 시스템 테스트: ${successfulTests}/${testQueries.length} 통과`);

            return {
                success: allTestsPassed,
                testsRun: testsRun,
                testResults: testResults,
                successRate: (successfulTests / testQueries.length * 100).toFixed(1) + '%'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 통합 검색 인터페이스
     */
    async search(query, options = {}) {
        if (!this.isInitialized) {
            throw new Error('벡터 임베딩 시스템이 초기화되지 않았습니다. initializeEmbeddingSystem()을 먼저 실행하세요.');
        }

        return await this.searchAPI.search(query, options);
    }

    /**
     * 시스템 상태 조회
     */
    async getSystemStatus() {
        try {
            const [
                embeddingStatus,
                searchStats,
                chunkStats
            ] = await Promise.all([
                this.embeddingGenerator.getSystemStatus(),
                this.searchAPI.getSearchStats(),
                this.getChunkStatistics()
            ]);

            return {
                initialized: this.isInitialized,
                processing: this.isProcessing,
                lastProcessingTime: this.lastProcessingTime,
                progress: this.progress,
                embedding_system: embeddingStatus,
                search_system: searchStats,
                chunk_system: chunkStats,
                overall_health: this.isInitialized && embeddingStatus.system_ready ? 'healthy' : 'needs_initialization'
            };

        } catch (error) {
            return {
                initialized: false,
                processing: false,
                error: error.message,
                overall_health: 'error'
            };
        }
    }

    /**
     * 청크 통계 조회
     */
    async getChunkStatistics() {
        try {
            const data = JSON.parse(await fs.readFile(this.chunksFilePath, 'utf-8'));
            return {
                available: true,
                ...data.statistics,
                file_path: this.chunksFilePath,
                last_updated: data.created_at
            };
        } catch (error) {
            return {
                available: false,
                error: error.message
            };
        }
    }

    /**
     * 시스템 재구축
     */
    async rebuildSystem(options = {}) {
        await this.log('🔄 시스템 재구축 시작');

        const result = await this.initializeEmbeddingSystem({
            ...options,
            forceRebuild: true,
            skipExisting: false
        });

        await this.log(`🔄 시스템 재구축 ${result.success ? '완료' : '실패'}`);
        return result;
    }

    /**
     * 증분 업데이트 (새로운 문서만 처리)
     */
    async incrementalUpdate() {
        try {
            await this.log('📈 증분 업데이트 시작');

            // 새로운 문서만 청킹
            const chunks = await this.documentChunker.chunkAllDocuments();

            // 기존 데이터와 비교하여 새로운 청크만 식별
            const existingData = await this.getChunkStatistics();
            const newChunks = this.identifyNewChunks(chunks, existingData);

            if (newChunks.length === 0) {
                await this.log('📈 새로운 문서가 없습니다.');
                return { success: true, newDocuments: 0 };
            }

            // 새로운 청크만 임베딩 생성
            const embeddingResult = await this.embeddingGenerator.processBatch(newChunks);

            await this.log(`📈 증분 업데이트 완료: ${newChunks.length}개 새 문서 처리`);

            return {
                success: true,
                newDocuments: newChunks.length,
                embeddingResult: embeddingResult
            };

        } catch (error) {
            await this.log(`❌ 증분 업데이트 실패: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 새로운 청크 식별
     */
    identifyNewChunks(currentChunks, existingStats) {
        // 간단한 구현: 파일 수정 시간 기반
        const cutoffTime = existingStats.last_updated ?
            new Date(existingStats.last_updated) :
            new Date(0);

        return currentChunks.filter(chunk =>
            new Date(chunk.metadata.created_at) > cutoffTime
        );
    }

    /**
     * 진행 상황 업데이트
     */
    async updateProgress(phase, percentage, details) {
        this.progress = {
            currentPhase: phase,
            percentage: percentage,
            details: details,
            startTime: this.progress.startTime,
            estimatedEndTime: this.calculateEstimatedEndTime(percentage)
        };

        await this.log(`📊 ${phase} (${percentage}%): ${details}`);
        this.emit('progress-update', this.progress);
    }

    /**
     * 예상 종료 시간 계산
     */
    calculateEstimatedEndTime(currentPercentage) {
        if (!this.progress.startTime || currentPercentage <= 0) {
            return null;
        }

        const elapsedTime = Date.now() - this.progress.startTime;
        const estimatedTotalTime = (elapsedTime / currentPercentage) * 100;
        return this.progress.startTime + estimatedTotalTime;
    }

    /**
     * 로그 기록
     */
    async log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;

        try {
            // 데이터 디렉토리 생성
            await fs.mkdir(this.dataDir, { recursive: true });
            await fs.appendFile(this.logFilePath, logEntry);
        } catch (error) {
            console.error('로그 기록 실패:', error.message);
        }

        console.log(message);
    }

    /**
     * 이벤트 발생
     */
    emit(eventName, data) {
        const listeners = this.eventListeners.get(eventName) || [];
        listeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error(`이벤트 리스너 오류 (${eventName}):`, error.message);
            }
        });
    }

    /**
     * 이벤트 리스너 등록
     */
    on(eventName, listener) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push(listener);
    }

    /**
     * 캐시 정리
     */
    async clearCache() {
        try {
            this.searchAPI.clearCache();
            await this.log('🧹 캐시 정리 완료');
            return { success: true };
        } catch (error) {
            await this.log(`❌ 캐시 정리 실패: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * 성능 최적화
     */
    async optimizePerformance() {
        try {
            await this.log('⚡ 성능 최적화 시작');

            // 1. 캐시 정리
            await this.clearCache();

            // 2. 검색 통계 분석
            const searchStats = await this.searchAPI.getSearchStats();

            // 3. 인기 검색어 기반 캐시 예열
            if (searchStats.popularQueries && searchStats.popularQueries.length > 0) {
                for (const popularQuery of searchStats.popularQueries.slice(0, 5)) {
                    await this.search(popularQuery.query, { limit: 5 });
                }
            }

            await this.log('⚡ 성능 최적화 완료');
            return { success: true, optimizations: ['cache_cleared', 'cache_prewarmed'] };

        } catch (error) {
            await this.log(`❌ 성능 최적화 실패: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * 시스템 종료
     */
    async shutdown() {
        try {
            await this.log('🛑 벡터 임베딩 서비스 종료');
            this.isInitialized = false;
            this.isProcessing = false;
            this.eventListeners.clear();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = VectorEmbeddingService;