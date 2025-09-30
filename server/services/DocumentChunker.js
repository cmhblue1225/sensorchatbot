/**
 * DocumentChunker.js
 *
 * Phase 3.2 벡터 임베딩 시스템을 위한 문서 청킹 최적화 시스템
 * 5,000+ 행의 고품질 문서를 효율적으로 청킹하여 검색 성능을 최적화
 */

const fs = require('fs').promises;
const path = require('path');

class DocumentChunker {
    constructor() {
        this.chunkSize = 1024; // 토큰 기준 (약 800-900자)
        this.overlap = 200; // 청크 간 중복 토큰
        this.minChunkSize = 200; // 최소 청크 크기

        this.chunks = [];
        this.metadata = new Map();

        // 문서 타입별 가중치
        this.documentTypes = {
            'game-development': { weight: 1.0, category: 'tutorial' },
            'api-sdk': { weight: 0.9, category: 'reference' },
            'sensor-processing': { weight: 0.8, category: 'technical' },
            'game-types': { weight: 1.0, category: 'guide' },
            'troubleshooting': { weight: 0.7, category: 'support' },
            'advanced': { weight: 0.6, category: 'advanced' },
            'examples': { weight: 1.2, category: 'example' }
        };
    }

    /**
     * 모든 문서를 청킹하여 임베딩 준비
     */
    async chunkAllDocuments() {
        console.log('🔍 문서 청킹 시작...');

        const docsPath = path.join(__dirname, '../../docs');
        await this.processDirectory(docsPath);

        console.log(`✅ 총 ${this.chunks.length}개 청크 생성 완료`);
        return this.chunks;
    }

    /**
     * 디렉토리를 재귀적으로 처리
     */
    async processDirectory(dirPath, relativePath = '') {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                const currentRelativePath = path.join(relativePath, entry.name);

                if (entry.isDirectory()) {
                    await this.processDirectory(fullPath, currentRelativePath);
                } else if (entry.name.endsWith('.md')) {
                    await this.processMarkdownFile(fullPath, currentRelativePath);
                }
            }
        } catch (error) {
            console.warn(`디렉토리 처리 실패: ${dirPath}`, error.message);
        }
    }

    /**
     * 마크다운 파일을 청킹
     */
    async processMarkdownFile(filePath, relativePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const docType = this.getDocumentType(relativePath);
            const metadata = this.extractMetadata(content, relativePath, docType);

            const chunks = this.chunkMarkdownContent(content, metadata);
            this.chunks.push(...chunks);

            console.log(`📄 ${relativePath}: ${chunks.length}개 청크 생성`);
        } catch (error) {
            console.warn(`파일 처리 실패: ${filePath}`, error.message);
        }
    }

    /**
     * 문서 타입 결정
     */
    getDocumentType(relativePath) {
        const pathParts = relativePath.split(path.sep);

        for (const [type, config] of Object.entries(this.documentTypes)) {
            if (pathParts.some(part => part.includes(type))) {
                return { type, ...config };
            }
        }

        return { type: 'general', weight: 0.5, category: 'general' };
    }

    /**
     * 메타데이터 추출
     */
    extractMetadata(content, relativePath, docType) {
        const lines = content.split('\n');
        const firstLine = lines[0] || '';

        // 제목 추출
        const titleMatch = firstLine.match(/^#\s+(.+)/) ||
                          content.match(/^#\s+(.+)/m);
        const title = titleMatch ? titleMatch[1].replace(/[🚀📚🎯🔧⚡🎮]/g, '').trim() :
                     path.basename(relativePath, '.md');

        // 태그 추출
        const tags = this.extractTags(content, relativePath);

        // 난이도 결정
        const difficulty = this.determineDifficulty(content, docType.type);

        // 코드 블록 수 계산
        const codeBlocks = (content.match(/```/g) || []).length / 2;

        return {
            title,
            file_path: relativePath,
            doc_type: docType.type,
            category: docType.category,
            weight: docType.weight,
            tags,
            difficulty,
            code_blocks: Math.floor(codeBlocks),
            word_count: content.split(/\s+/).length,
            created_at: new Date().toISOString()
        };
    }

    /**
     * 태그 추출
     */
    extractTags(content, relativePath) {
        const tags = new Set();

        // 파일 경로에서 태그 추출
        const pathParts = relativePath.split(path.sep);
        pathParts.forEach(part => {
            if (part !== 'docs' && !part.endsWith('.md')) {
                tags.add(part.replace(/-/g, ' '));
            }
        });

        // 내용에서 기술 키워드 추출
        const techKeywords = [
            'SessionSDK', 'sensor', 'orientation', 'acceleration', 'rotation',
            'WebSocket', 'canvas', 'javascript', 'html', 'css', 'game',
            'mobile', 'touch', 'gesture', 'physics', 'animation'
        ];

        techKeywords.forEach(keyword => {
            if (content.toLowerCase().includes(keyword.toLowerCase())) {
                tags.add(keyword);
            }
        });

        return Array.from(tags);
    }

    /**
     * 난이도 결정
     */
    determineDifficulty(content, docType) {
        let score = 0;

        // 코드 복잡도
        const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;
        score += codeBlocks * 0.2;

        // 고급 개념
        const advancedTerms = [
            'async', 'await', 'promise', 'websocket', 'vector', 'embedding',
            'optimization', 'performance', 'algorithm', 'architecture'
        ];
        advancedTerms.forEach(term => {
            if (content.toLowerCase().includes(term)) score += 0.1;
        });

        // 문서 타입별 기본 점수
        const typeScores = {
            'examples': 1,
            'game-development': 2,
            'api-sdk': 2,
            'sensor-processing': 3,
            'advanced': 4,
            'troubleshooting': 2
        };

        score += typeScores[docType] || 1;

        if (score < 2) return 'beginner';
        if (score < 4) return 'intermediate';
        return 'advanced';
    }

    /**
     * 마크다운 컨텐츠를 스마트 청킹
     */
    chunkMarkdownContent(content, metadata) {
        const chunks = [];
        const sections = this.splitIntoSections(content);

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const sectionChunks = this.chunkSection(section, metadata, i);
            chunks.push(...sectionChunks);
        }

        return chunks;
    }

    /**
     * 마크다운을 섹션으로 분할
     */
    splitIntoSections(content) {
        const sections = [];
        const lines = content.split('\n');
        let currentSection = [];
        let currentHeader = '';

        for (const line of lines) {
            const headerMatch = line.match(/^(#{1,6})\s+(.+)/);

            if (headerMatch && headerMatch[1].length <= 3) { // H1, H2, H3만 섹션 구분
                if (currentSection.length > 0) {
                    sections.push({
                        header: currentHeader,
                        content: currentSection.join('\n')
                    });
                }
                currentHeader = line;
                currentSection = [line];
            } else {
                currentSection.push(line);
            }
        }

        if (currentSection.length > 0) {
            sections.push({
                header: currentHeader,
                content: currentSection.join('\n')
            });
        }

        return sections;
    }

    /**
     * 섹션을 청크로 분할
     */
    chunkSection(section, baseMetadata, sectionIndex) {
        const chunks = [];
        const content = section.content;
        const words = content.split(/\s+/);

        // 섹션이 작으면 그대로 하나의 청크로
        if (words.length <= this.chunkSize) {
            chunks.push(this.createChunk(content, baseMetadata, sectionIndex, 0, section.header));
            return chunks;
        }

        // 큰 섹션은 여러 청크로 분할
        let chunkIndex = 0;
        for (let start = 0; start < words.length; start += this.chunkSize - this.overlap) {
            const end = Math.min(start + this.chunkSize, words.length);
            const chunkWords = words.slice(start, end);
            const chunkContent = chunkWords.join(' ');

            // 너무 작은 청크는 건너뛰기
            if (chunkWords.length < this.minChunkSize) {
                break;
            }

            chunks.push(this.createChunk(chunkContent, baseMetadata, sectionIndex, chunkIndex, section.header));
            chunkIndex++;
        }

        return chunks;
    }

    /**
     * 청크 객체 생성
     */
    createChunk(content, baseMetadata, sectionIndex, chunkIndex, sectionHeader) {
        const chunkId = `${baseMetadata.file_path}_s${sectionIndex}_c${chunkIndex}`;

        // 섹션 헤더에서 추가 메타데이터 추출
        const sectionTitle = sectionHeader.replace(/^#+\s+/, '').replace(/[🚀📚🎯🔧⚡🎮]/g, '').trim();

        return {
            id: chunkId,
            content: content.trim(),
            metadata: {
                ...baseMetadata,
                chunk_index: chunkIndex,
                section_index: sectionIndex,
                section_title: sectionTitle,
                chunk_size: content.length,
                word_count: content.split(/\s+/).length
            }
        };
    }

    /**
     * 특정 문서 유형별 청크 통계
     */
    getChunkStatistics() {
        const stats = {
            total_chunks: this.chunks.length,
            by_type: {},
            by_difficulty: {},
            by_category: {},
            avg_chunk_size: 0,
            total_words: 0
        };

        let totalSize = 0;

        for (const chunk of this.chunks) {
            const { doc_type, difficulty, category, word_count } = chunk.metadata;

            // 타입별 통계
            stats.by_type[doc_type] = (stats.by_type[doc_type] || 0) + 1;

            // 난이도별 통계
            stats.by_difficulty[difficulty] = (stats.by_difficulty[difficulty] || 0) + 1;

            // 카테고리별 통계
            stats.by_category[category] = (stats.by_category[category] || 0) + 1;

            // 크기 통계
            totalSize += chunk.content.length;
            stats.total_words += word_count;
        }

        stats.avg_chunk_size = Math.round(totalSize / this.chunks.length);

        return stats;
    }

    /**
     * 청크 데이터를 JSON으로 저장
     */
    async saveChunks(outputPath = null) {
        if (!outputPath) {
            outputPath = path.join(__dirname, '../../data/document_chunks.json');
        }

        const data = {
            chunks: this.chunks,
            statistics: this.getChunkStatistics(),
            created_at: new Date().toISOString(),
            version: '1.0'
        };

        // 디렉토리 생성
        const dir = path.dirname(outputPath);
        await fs.mkdir(dir, { recursive: true });

        await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
        console.log(`💾 청크 데이터 저장 완료: ${outputPath}`);

        return data;
    }

    /**
     * 저장된 청크 데이터 로드
     */
    async loadChunks(inputPath = null) {
        if (!inputPath) {
            inputPath = path.join(__dirname, '../../data/document_chunks.json');
        }

        try {
            const data = JSON.parse(await fs.readFile(inputPath, 'utf-8'));
            this.chunks = data.chunks;
            console.log(`📖 청크 데이터 로드 완료: ${this.chunks.length}개 청크`);
            return data;
        } catch (error) {
            console.warn('청크 데이터 로드 실패:', error.message);
            return null;
        }
    }
}

module.exports = DocumentChunker;