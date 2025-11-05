/**
 * Supabase 삽입 테스트 - 실제 청크 데이터 사용
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function testInsert() {
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );

    // 실제 청크 데이터 로드
    const chunksPath = path.join(__dirname, 'data/document_chunks.json');
    const chunksData = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'));
    const firstChunk = chunksData.chunks[0];

    console.log('원본 청크 데이터:', JSON.stringify(firstChunk, null, 2));

    // 테스트 데이터 - 실제 청크 형식
    const testData = {
        id: 'test_' + Date.now(),
        content: firstChunk.content,
        embedding: '[' + Array(1536).fill(0).join(',') + ']',
        metadata: firstChunk.metadata,
        file_path: firstChunk.metadata.file_path,
        doc_type: firstChunk.metadata.doc_type,
        category: firstChunk.metadata.category,
        difficulty: firstChunk.metadata.difficulty,
        tags: firstChunk.metadata.tags,
        section_title: firstChunk.metadata.section_title,
        chunk_index: firstChunk.metadata.chunk_index,
        word_count: firstChunk.metadata.word_count
    };

    console.log('\n삽입할 데이터:', JSON.stringify(testData, null, 2));

    try {
        const { data, error } = await supabase
            .from('document_vectors')
            .insert(testData);

        if (error) {
            console.error('❌ 삽입 실패:', error);
        } else {
            console.log('✅ 삽입 성공:', data);
        }
    } catch (err) {
        console.error('💥 예외 발생:', err);
    }
}

testInsert();