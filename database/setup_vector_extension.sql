-- ====================================================================
-- Phase 3.2 벡터 임베딩 시스템 - Supabase Vector Extension 설정
-- ====================================================================
-- 이 스크립트는 Supabase에서 벡터 검색을 위한 테이블과 함수를 설정합니다.
-- Supabase Dashboard의 SQL Editor에서 실행하세요.

-- 1. Vector Extension 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 문서 벡터 테이블 생성
CREATE TABLE IF NOT EXISTS document_vectors (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(1536), -- OpenAI text-embedding-3-small 차원
    metadata JSONB,
    file_path TEXT,
    doc_type TEXT,
    category TEXT,
    difficulty TEXT,
    tags TEXT[],
    section_title TEXT,
    chunk_index INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성 (성능 최적화)
-- Vector 유사도 검색을 위한 HNSW 인덱스
CREATE INDEX IF NOT EXISTS document_vectors_embedding_idx
ON document_vectors USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 일반 검색을 위한 인덱스들
CREATE INDEX IF NOT EXISTS document_vectors_doc_type_idx ON document_vectors (doc_type);
CREATE INDEX IF NOT EXISTS document_vectors_category_idx ON document_vectors (category);
CREATE INDEX IF NOT EXISTS document_vectors_difficulty_idx ON document_vectors (difficulty);
CREATE INDEX IF NOT EXISTS document_vectors_file_path_idx ON document_vectors (file_path);
CREATE INDEX IF NOT EXISTS document_vectors_created_at_idx ON document_vectors (created_at);

-- 전문 검색을 위한 GIN 인덱스
CREATE INDEX IF NOT EXISTS document_vectors_content_gin_idx
ON document_vectors USING gin (to_tsvector('korean', content));

CREATE INDEX IF NOT EXISTS document_vectors_section_title_gin_idx
ON document_vectors USING gin (to_tsvector('korean', section_title));

CREATE INDEX IF NOT EXISTS document_vectors_tags_gin_idx
ON document_vectors USING gin (tags);

-- 4. 유사도 검색 함수 생성
CREATE OR REPLACE FUNCTION search_documents(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.6,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id text,
    content text,
    metadata jsonb,
    file_path text,
    doc_type text,
    category text,
    difficulty text,
    tags text[],
    section_title text,
    chunk_index integer,
    word_count integer,
    similarity float,
    created_at timestamp with time zone
)
LANGUAGE sql STABLE
AS $$
    SELECT
        dv.id,
        dv.content,
        dv.metadata,
        dv.file_path,
        dv.doc_type,
        dv.category,
        dv.difficulty,
        dv.tags,
        dv.section_title,
        dv.chunk_index,
        dv.word_count,
        1 - (dv.embedding <=> query_embedding) AS similarity,
        dv.created_at
    FROM document_vectors dv
    WHERE 1 - (dv.embedding <=> query_embedding) > match_threshold
    ORDER BY dv.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- 5. 하이브리드 검색 함수 생성 (의미론적 + 키워드)
CREATE OR REPLACE FUNCTION hybrid_search_documents(
    query_text text,
    query_embedding vector(1536),
    semantic_weight float DEFAULT 0.7,
    keyword_weight float DEFAULT 0.3,
    match_threshold float DEFAULT 0.6,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id text,
    content text,
    metadata jsonb,
    file_path text,
    doc_type text,
    category text,
    difficulty text,
    tags text[],
    section_title text,
    chunk_index integer,
    word_count integer,
    semantic_score float,
    keyword_score float,
    hybrid_score float,
    created_at timestamp with time zone
)
LANGUAGE sql STABLE
AS $$
    WITH semantic_search AS (
        SELECT
            dv.*,
            1 - (dv.embedding <=> query_embedding) AS semantic_score
        FROM document_vectors dv
        WHERE 1 - (dv.embedding <=> query_embedding) > match_threshold
    ),
    keyword_search AS (
        SELECT
            dv.*,
            CASE
                WHEN dv.content ILIKE '%' || query_text || '%' OR
                     dv.section_title ILIKE '%' || query_text || '%' OR
                     query_text = ANY(dv.tags)
                THEN
                    -- TF-IDF 기반 키워드 스코어 계산
                    LEAST(
                        (
                            -- 제목에서의 매치
                            CASE WHEN dv.section_title ILIKE '%' || query_text || '%' THEN 0.5 ELSE 0 END +
                            -- 내용에서의 매치 빈도
                            LEAST(
                                (LENGTH(dv.content) - LENGTH(REPLACE(LOWER(dv.content), LOWER(query_text), '')))
                                / LENGTH(query_text) * 0.1,
                                0.4
                            ) +
                            -- 태그 정확 매치
                            CASE WHEN query_text = ANY(dv.tags) THEN 0.3 ELSE 0 END
                        ),
                        1.0
                    )
                ELSE 0.0
            END AS keyword_score
        FROM document_vectors dv
    )
    SELECT
        COALESCE(s.id, k.id) as id,
        COALESCE(s.content, k.content) as content,
        COALESCE(s.metadata, k.metadata) as metadata,
        COALESCE(s.file_path, k.file_path) as file_path,
        COALESCE(s.doc_type, k.doc_type) as doc_type,
        COALESCE(s.category, k.category) as category,
        COALESCE(s.difficulty, k.difficulty) as difficulty,
        COALESCE(s.tags, k.tags) as tags,
        COALESCE(s.section_title, k.section_title) as section_title,
        COALESCE(s.chunk_index, k.chunk_index) as chunk_index,
        COALESCE(s.word_count, k.word_count) as word_count,
        COALESCE(s.semantic_score, 0.0) as semantic_score,
        COALESCE(k.keyword_score, 0.0) as keyword_score,
        (COALESCE(s.semantic_score, 0.0) * semantic_weight +
         COALESCE(k.keyword_score, 0.0) * keyword_weight) as hybrid_score,
        COALESCE(s.created_at, k.created_at) as created_at
    FROM semantic_search s
    FULL OUTER JOIN keyword_search k ON s.id = k.id
    WHERE (COALESCE(s.semantic_score, 0.0) * semantic_weight +
           COALESCE(k.keyword_score, 0.0) * keyword_weight) > match_threshold
    ORDER BY hybrid_score DESC
    LIMIT match_count;
$$;

-- 6. 문서 통계 함수 생성
CREATE OR REPLACE FUNCTION get_document_stats()
RETURNS TABLE (
    total_documents bigint,
    doc_types jsonb,
    categories jsonb,
    difficulties jsonb,
    avg_word_count numeric,
    total_words bigint,
    latest_update timestamp with time zone
)
LANGUAGE sql STABLE
AS $$
    SELECT
        COUNT(*) as total_documents,
        jsonb_object_agg(doc_type, count_by_type) as doc_types,
        jsonb_object_agg(category, count_by_category) as categories,
        jsonb_object_agg(difficulty, count_by_difficulty) as difficulties,
        ROUND(AVG(word_count), 2) as avg_word_count,
        SUM(word_count) as total_words,
        MAX(created_at) as latest_update
    FROM (
        SELECT
            doc_type,
            category,
            difficulty,
            word_count,
            created_at,
            COUNT(*) OVER (PARTITION BY doc_type) as count_by_type,
            COUNT(*) OVER (PARTITION BY category) as count_by_category,
            COUNT(*) OVER (PARTITION BY difficulty) as count_by_difficulty
        FROM document_vectors
    ) stats
    GROUP BY ()
$$;

-- 7. 유사 문서 추천 함수
CREATE OR REPLACE FUNCTION get_similar_documents(
    document_id text,
    similarity_threshold float DEFAULT 0.7,
    limit_count int DEFAULT 5
)
RETURNS TABLE (
    id text,
    content text,
    file_path text,
    doc_type text,
    section_title text,
    similarity float
)
LANGUAGE sql STABLE
AS $$
    WITH target_doc AS (
        SELECT embedding
        FROM document_vectors
        WHERE document_vectors.id = document_id
    )
    SELECT
        dv.id,
        dv.content,
        dv.file_path,
        dv.doc_type,
        dv.section_title,
        1 - (dv.embedding <=> target_doc.embedding) AS similarity
    FROM document_vectors dv, target_doc
    WHERE dv.id != document_id
      AND 1 - (dv.embedding <=> target_doc.embedding) > similarity_threshold
    ORDER BY dv.embedding <=> target_doc.embedding
    LIMIT limit_count;
$$;

-- 8. 문서 클러스터링을 위한 함수
CREATE OR REPLACE FUNCTION get_document_clusters(
    cluster_threshold float DEFAULT 0.8,
    min_cluster_size int DEFAULT 3
)
RETURNS TABLE (
    cluster_id int,
    document_ids text[],
    representative_content text,
    avg_similarity float,
    doc_count bigint
)
LANGUAGE sql STABLE
AS $$
    WITH similarity_matrix AS (
        SELECT
            a.id as doc_a,
            b.id as doc_b,
            1 - (a.embedding <=> b.embedding) as similarity
        FROM document_vectors a
        CROSS JOIN document_vectors b
        WHERE a.id != b.id
    ),
    clusters AS (
        SELECT
            doc_a,
            ARRAY_AGG(doc_b) FILTER (WHERE similarity > cluster_threshold) as similar_docs,
            AVG(similarity) FILTER (WHERE similarity > cluster_threshold) as avg_sim
        FROM similarity_matrix
        GROUP BY doc_a
        HAVING COUNT(*) FILTER (WHERE similarity > cluster_threshold) >= min_cluster_size
    )
    SELECT
        ROW_NUMBER() OVER (ORDER BY avg_sim DESC) as cluster_id,
        ARRAY[doc_a] || similar_docs as document_ids,
        dv.content as representative_content,
        avg_sim as avg_similarity,
        ARRAY_LENGTH(ARRAY[doc_a] || similar_docs, 1) as doc_count
    FROM clusters c
    JOIN document_vectors dv ON c.doc_a = dv.id
    ORDER BY avg_sim DESC;
$$;

-- 9. 검색 성능 분석을 위한 뷰
CREATE OR REPLACE VIEW search_performance_stats AS
SELECT
    'vector_search' as search_type,
    COUNT(*) as total_documents,
    AVG(array_length(tags, 1)) as avg_tags_per_doc,
    AVG(word_count) as avg_word_count,
    MIN(created_at) as oldest_document,
    MAX(created_at) as newest_document
FROM document_vectors

UNION ALL

SELECT
    'by_category' as search_type,
    COUNT(*) as total_documents,
    0 as avg_tags_per_doc,
    AVG(word_count) as avg_word_count,
    MIN(created_at) as oldest_document,
    MAX(created_at) as newest_document
FROM document_vectors
GROUP BY category;

-- 10. 자동 업데이트 트리거 설정
CREATE OR REPLACE FUNCTION update_document_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_vectors_timestamp
    BEFORE UPDATE ON document_vectors
    FOR EACH ROW
    EXECUTE FUNCTION update_document_timestamp();

-- 11. Row Level Security (RLS) 설정
ALTER TABLE document_vectors ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Enable read access for all users" ON document_vectors
    FOR SELECT USING (true);

-- 인증된 사용자만 쓰기 가능 (필요시 조정)
CREATE POLICY "Enable insert for authenticated users only" ON document_vectors
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON document_vectors
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON document_vectors
    FOR DELETE USING (auth.role() = 'authenticated');

-- 12. 데이터 검증 함수
CREATE OR REPLACE FUNCTION validate_vector_data()
RETURNS TABLE (
    check_name text,
    status text,
    details text
)
LANGUAGE sql STABLE
AS $$
    SELECT 'total_documents' as check_name,
           'OK' as status,
           COUNT(*)::text || ' documents found' as details
    FROM document_vectors

    UNION ALL

    SELECT 'embedding_dimensions' as check_name,
           CASE WHEN COUNT(DISTINCT array_length(embedding::real[], 1)) = 1
                THEN 'OK'
                ELSE 'ERROR'
           END as status,
           'Embedding dimensions: ' || string_agg(DISTINCT array_length(embedding::real[], 1)::text, ', ') as details
    FROM document_vectors
    WHERE embedding IS NOT NULL

    UNION ALL

    SELECT 'null_embeddings' as check_name,
           CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END as status,
           COUNT(*)::text || ' documents with null embeddings' as details
    FROM document_vectors
    WHERE embedding IS NULL

    UNION ALL

    SELECT 'empty_content' as check_name,
           CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END as status,
           COUNT(*)::text || ' documents with empty content' as details
    FROM document_vectors
    WHERE content = '' OR content IS NULL;
$$;

-- 실행 예시 주석들
/*
-- 벡터 검색 예시:
SELECT * FROM search_documents(
    '[0.1, 0.2, ...]'::vector(1536),  -- 실제 임베딩 벡터
    0.7,  -- 유사도 임계값
    10    -- 결과 개수
);

-- 하이브리드 검색 예시:
SELECT * FROM hybrid_search_documents(
    'SessionSDK 센서 데이터',         -- 검색 텍스트
    '[0.1, 0.2, ...]'::vector(1536), -- 임베딩 벡터
    0.7,  -- 의미론적 가중치
    0.3,  -- 키워드 가중치
    0.6,  -- 유사도 임계값
    10    -- 결과 개수
);

-- 문서 통계 조회:
SELECT * FROM get_document_stats();

-- 유사 문서 추천:
SELECT * FROM get_similar_documents('document_id_here', 0.7, 5);

-- 데이터 검증:
SELECT * FROM validate_vector_data();
*/

-- 설정 완료 메시지
SELECT 'Vector Extension 설정이 완료되었습니다!' as message,
       'search_documents, hybrid_search_documents 함수를 사용하여 검색을 시작할 수 있습니다.' as instructions;