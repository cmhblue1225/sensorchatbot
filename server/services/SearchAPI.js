/**
 * SearchAPI.js
 *
 * Phase 3.2 벡터 임베딩 시스템 - 하이브리드 검색 API 시스템
 * 의미론적 검색 + 키워드 검색을 결합한 고성능 검색 시스템
 */

const EmbeddingGenerator = require('./EmbeddingGenerator');
const { createClient } = require('@supabase/supabase-js');

class SearchAPI {
    constructor() {
        this.embeddingGenerator = new EmbeddingGenerator();
        this.supabase = createClient(
            process.env.SUPABASE_URL || '',
            process.env.SUPABASE_ANON_KEY || ''
        );

        // 검색 설정
        this.defaultLimit = 10;
        this.maxLimit = 50;
        this.minSimilarity = 0.6;
        this.defaultSemanticWeight = 0.7;
        this.defaultKeywordWeight = 0.3;

        // 캐싱 설정
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5분 캐시
        this.maxCacheSize = 1000;

        // 통계 추적
        this.stats = {
            totalSearches: 0,
            cacheHits: 0,
            avgResponseTime: 0,
            popularQueries: new Map()
        };
    }

    /**
     * 통합 검색 API - 메인 엔트리포인트
     */
    async search(query, options = {}) {
        const startTime = Date.now();

        try {
            // 입력 검증 및 정규화
            const normalizedQuery = this.normalizeQuery(query);
            if (!normalizedQuery) {
                return this.createErrorResponse('검색어를 입력해주세요.');
            }

            // 옵션 처리
            const searchOptions = this.processSearchOptions(options);

            // 캐시 확인
            const cacheKey = this.generateCacheKey(normalizedQuery, searchOptions);
            const cachedResult = this.getCachedResult(cacheKey);
            if (cachedResult) {
                this.stats.cacheHits++;
                return cachedResult;
            }

            // 검색 유형 결정
            const searchType = this.determineSearchType(normalizedQuery, searchOptions);
            let results;

            switch (searchType) {
                case 'semantic':
                    results = await this.semanticSearch(normalizedQuery, searchOptions);
                    break;
                case 'keyword':
                    results = await this.keywordSearch(normalizedQuery, searchOptions);
                    break;
                case 'hybrid':
                default:
                    results = await this.hybridSearch(normalizedQuery, searchOptions);
                    break;
            }

            // 결과 후처리
            const processedResults = this.postProcessResults(results, normalizedQuery);

            // 응답 생성
            const response = this.createSuccessResponse(
                processedResults,
                normalizedQuery,
                searchOptions,
                Date.now() - startTime
            );

            // 캐시 저장
            this.setCachedResult(cacheKey, response);

            // 통계 업데이트
            this.updateStats(normalizedQuery, Date.now() - startTime);

            return response;

        } catch (error) {
            console.error('검색 실패:', error.message);
            return this.createErrorResponse(error.message);
        }
    }

    /**
     * 쿼리 정규화
     */
    normalizeQuery(query) {
        if (!query || typeof query !== 'string') {
            return null;
        }

        return query
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .substring(0, 500); // 최대 길이 제한
    }

    /**
     * 검색 옵션 처리
     */
    processSearchOptions(options) {
        return {
            limit: Math.min(options.limit || this.defaultLimit, this.maxLimit),
            minSimilarity: options.minSimilarity || this.minSimilarity,
            semanticWeight: options.semanticWeight || this.defaultSemanticWeight,
            keywordWeight: options.keywordWeight || this.defaultKeywordWeight,
            filters: options.filters || {},
            sortBy: options.sortBy || 'relevance',
            includeMetadata: options.includeMetadata !== false,
            searchType: options.searchType || 'auto'
        };
    }

    /**
     * 검색 유형 자동 결정
     */
    determineSearchType(query, options) {
        if (options.searchType !== 'auto') {
            return options.searchType;
        }

        // 기술 용어나 특정 키워드가 많으면 키워드 검색 우선
        const techTerms = [
            'SessionSDK', 'sensor', 'orientation', 'acceleration', 'rotation',
            'WebSocket', 'canvas', 'javascript', 'html', 'css', 'game',
            'function', 'class', 'method', 'api', 'event'
        ];

        const hasTechTerms = techTerms.some(term =>
            query.toLowerCase().includes(term.toLowerCase())
        );

        if (hasTechTerms) {
            return 'hybrid'; // 기술 검색은 하이브리드가 효과적
        }

        // 자연어 질문이면 의미론적 검색 우선
        const questionWords = ['어떻게', '무엇', '왜', '언제', '어디서', '누가'];
        const isQuestion = questionWords.some(word => query.includes(word)) ||
                          query.includes('?');

        if (isQuestion) {
            return 'semantic';
        }

        // 기본값은 하이브리드
        return 'hybrid';
    }

    /**
     * 의미론적 검색
     */
    async semanticSearch(query, options) {
        const results = await this.embeddingGenerator.searchSimilar(
            query,
            options.limit * 2, // 더 많은 결과를 가져와서 필터링
            options.minSimilarity
        );

        return this.applyFilters(results, options.filters);
    }

    /**
     * 키워드 검색
     */
    async keywordSearch(query, options) {
        try {
            let supabaseQuery = this.supabase
                .from('document_vectors')
                .select('*');

            // 키워드 검색 조건 구성
            const searchTerms = query.split(' ').filter(term => term.length > 1);
            const searchConditions = [];

            searchTerms.forEach(term => {
                searchConditions.push(`content.ilike.%${term}%`);
                searchConditions.push(`section_title.ilike.%${term}%`);
                searchConditions.push(`tags.cs.{${term}}`);
            });

            if (searchConditions.length > 0) {
                supabaseQuery = supabaseQuery.or(searchConditions.join(','));
            }

            // 필터 적용
            supabaseQuery = this.applySupabaseFilters(supabaseQuery, options.filters);

            const { data, error } = await supabaseQuery.limit(options.limit);

            if (error) {
                throw new Error(`키워드 검색 오류: ${error.message}`);
            }

            // 키워드 스코어 계산
            return data.map(item => ({
                ...item,
                similarity: this.calculateKeywordScore(item, query),
                search_type: 'keyword'
            }));

        } catch (error) {
            console.error('키워드 검색 실패:', error.message);
            return [];
        }
    }

    /**
     * 하이브리드 검색
     */
    async hybridSearch(query, options) {
        try {
            // 병렬로 두 검색 실행
            const [semanticResults, keywordResults] = await Promise.all([
                this.semanticSearch(query, { ...options, limit: options.limit * 2 }),
                this.keywordSearch(query, { ...options, limit: options.limit * 2 })
            ]);

            // 결과 병합 및 점수 계산
            const combinedResults = this.combineSearchResults(
                semanticResults,
                keywordResults,
                options.semanticWeight,
                options.keywordWeight
            );

            // 정렬 및 제한
            return combinedResults
                .sort((a, b) => b.hybrid_score - a.hybrid_score)
                .slice(0, options.limit);

        } catch (error) {
            console.error('하이브리드 검색 실패:', error.message);
            return [];
        }
    }

    /**
     * 검색 결과 병합
     */
    combineSearchResults(semanticResults, keywordResults, semanticWeight, keywordWeight) {
        const resultMap = new Map();

        // 의미론적 검색 결과 추가
        semanticResults.forEach(item => {
            resultMap.set(item.id, {
                ...item,
                semantic_score: item.similarity || 0,
                keyword_score: 0,
                search_type: 'hybrid'
            });
        });

        // 키워드 검색 결과 병합
        keywordResults.forEach(item => {
            if (resultMap.has(item.id)) {
                resultMap.get(item.id).keyword_score = item.similarity || 0;
            } else {
                resultMap.set(item.id, {
                    ...item,
                    semantic_score: 0,
                    keyword_score: item.similarity || 0,
                    search_type: 'hybrid'
                });
            }
        });

        // 하이브리드 스코어 계산
        return Array.from(resultMap.values()).map(item => ({
            ...item,
            hybrid_score: (item.semantic_score * semanticWeight) +
                         (item.keyword_score * keywordWeight),
            similarity: (item.semantic_score * semanticWeight) +
                       (item.keyword_score * keywordWeight)
        }));
    }

    /**
     * 키워드 스코어 계산 (향상된 버전)
     */
    calculateKeywordScore(item, query) {
        const content = item.content.toLowerCase();
        const title = (item.section_title || '').toLowerCase();
        const queryTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);

        let score = 0;
        let maxScore = 0;

        queryTerms.forEach(term => {
            let termScore = 0;
            maxScore += 1;

            // 제목에서의 정확한 매치 (높은 가중치)
            if (title.includes(term)) {
                termScore += 0.5;
            }

            // 내용에서의 매치 빈도 (TF 기반)
            const contentMatches = (content.match(new RegExp(term, 'g')) || []).length;
            const contentLength = content.split(' ').length;
            const tf = contentMatches / contentLength;
            termScore += Math.min(tf * 10, 0.4);

            // 태그 정확 매치
            if (item.tags && item.tags.some(tag =>
                tag.toLowerCase().includes(term)
            )) {
                termScore += 0.3;
            }

            // 문서 타입 보너스
            if (item.doc_type && item.doc_type.toLowerCase().includes(term)) {
                termScore += 0.2;
            }

            score += Math.min(termScore, 1.0);
        });

        return maxScore > 0 ? score / maxScore : 0;
    }

    /**
     * 필터 적용
     */
    applyFilters(results, filters) {
        if (!filters || Object.keys(filters).length === 0) {
            return results;
        }

        return results.filter(item => {
            // 문서 타입 필터
            if (filters.docType && item.doc_type !== filters.docType) {
                return false;
            }

            // 카테고리 필터
            if (filters.category && item.category !== filters.category) {
                return false;
            }

            // 난이도 필터
            if (filters.difficulty && item.difficulty !== filters.difficulty) {
                return false;
            }

            // 태그 필터
            if (filters.tags && filters.tags.length > 0) {
                const hasMatchingTag = filters.tags.some(tag =>
                    item.tags && item.tags.includes(tag)
                );
                if (!hasMatchingTag) {
                    return false;
                }
            }

            // 파일 경로 필터
            if (filters.filePath && !item.file_path.includes(filters.filePath)) {
                return false;
            }

            return true;
        });
    }

    /**
     * Supabase 쿼리에 필터 적용
     */
    applySupabaseFilters(query, filters) {
        if (!filters || Object.keys(filters).length === 0) {
            return query;
        }

        if (filters.docType) {
            query = query.eq('doc_type', filters.docType);
        }

        if (filters.category) {
            query = query.eq('category', filters.category);
        }

        if (filters.difficulty) {
            query = query.eq('difficulty', filters.difficulty);
        }

        if (filters.filePath) {
            query = query.ilike('file_path', `%${filters.filePath}%`);
        }

        return query;
    }

    /**
     * 결과 후처리
     */
    postProcessResults(results, query) {
        return results.map(item => {
            // 하이라이트 생성
            const highlights = this.generateHighlights(item.content, query);

            // 요약 생성
            const summary = this.generateSummary(item.content, 150);

            return {
                id: item.id,
                content: item.content,
                summary: summary,
                highlights: highlights,
                similarity: item.similarity,
                metadata: item.metadata,
                file_path: item.file_path,
                doc_type: item.doc_type,
                category: item.category,
                difficulty: item.difficulty,
                section_title: item.section_title,
                tags: item.tags || [],
                word_count: item.word_count,
                search_type: item.search_type || 'unknown'
            };
        });
    }

    /**
     * 검색어 하이라이트 생성
     */
    generateHighlights(content, query, maxHighlights = 3) {
        const queryTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
        const highlights = [];
        const contentLower = content.toLowerCase();

        queryTerms.forEach(term => {
            const regex = new RegExp(`(.{0,50})(${term})(.{0,50})`, 'gi');
            let match;
            let count = 0;

            while ((match = regex.exec(contentLower)) && count < maxHighlights) {
                const before = match[1];
                const matched = match[2];
                const after = match[3];

                highlights.push({
                    text: `...${before}<mark>${matched}</mark>${after}...`,
                    term: term
                });
                count++;
            }
        });

        return highlights.slice(0, maxHighlights);
    }

    /**
     * 요약 생성
     */
    generateSummary(content, maxLength = 150) {
        if (content.length <= maxLength) {
            return content;
        }

        // 문장 단위로 자르기
        const sentences = content.match(/[^\.!?]+[\.!?]+/g) || [content];
        let summary = '';

        for (const sentence of sentences) {
            if (summary.length + sentence.length > maxLength) {
                break;
            }
            summary += sentence;
        }

        return summary.trim() + (summary.length < content.length ? '...' : '');
    }

    /**
     * 성공 응답 생성
     */
    createSuccessResponse(results, query, options, responseTime) {
        return {
            success: true,
            query: query,
            results: results,
            meta: {
                total: results.length,
                responseTime: responseTime,
                searchType: options.searchType,
                filters: options.filters,
                options: {
                    limit: options.limit,
                    minSimilarity: options.minSimilarity,
                    semanticWeight: options.semanticWeight,
                    keywordWeight: options.keywordWeight
                }
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 오류 응답 생성
     */
    createErrorResponse(message) {
        return {
            success: false,
            error: message,
            results: [],
            meta: {
                total: 0,
                responseTime: 0
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 캐시 관련 메서드들
     */
    generateCacheKey(query, options) {
        return `search:${query}:${JSON.stringify(options)}`;
    }

    getCachedResult(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    setCachedResult(key, data) {
        // 캐시 크기 제한
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * 통계 업데이트
     */
    updateStats(query, responseTime) {
        this.stats.totalSearches++;

        // 평균 응답 시간 업데이트
        const currentAvg = this.stats.avgResponseTime;
        const count = this.stats.totalSearches;
        this.stats.avgResponseTime = (currentAvg * (count - 1) + responseTime) / count;

        // 인기 검색어 추적
        const currentCount = this.stats.popularQueries.get(query) || 0;
        this.stats.popularQueries.set(query, currentCount + 1);

        // 인기 검색어 상위 100개만 유지
        if (this.stats.popularQueries.size > 100) {
            const sorted = Array.from(this.stats.popularQueries.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 100);

            this.stats.popularQueries = new Map(sorted);
        }
    }

    /**
     * 검색 통계 조회
     */
    getSearchStats() {
        const popularQueries = Array.from(this.stats.popularQueries.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([query, count]) => ({ query, count }));

        return {
            totalSearches: this.stats.totalSearches,
            cacheHitRate: this.stats.totalSearches > 0 ?
                (this.stats.cacheHits / this.stats.totalSearches * 100).toFixed(2) + '%' : '0%',
            avgResponseTime: Math.round(this.stats.avgResponseTime),
            cacheSize: this.cache.size,
            popularQueries: popularQueries
        };
    }

    /**
     * 캐시 초기화
     */
    clearCache() {
        this.cache.clear();
        console.log('검색 캐시가 초기화되었습니다.');
    }

    /**
     * 시스템 상태 확인
     */
    async getSystemHealth() {
        try {
            const embeddingStatus = await this.embeddingGenerator.getSystemStatus();
            const searchStats = this.getSearchStats();

            return {
                status: 'healthy',
                embedding_system: embeddingStatus,
                search_stats: searchStats,
                cache_status: {
                    size: this.cache.size,
                    maxSize: this.maxCacheSize,
                    timeout: this.cacheTimeout
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = SearchAPI;