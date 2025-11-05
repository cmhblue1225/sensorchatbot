# Sensor Game Hub v6.1 - 핵심 소스코드

> AI 기반 모바일 센서 게임 자동 생성 플랫폼 - 핵심 백엔드 소스코드
>
> 작성일: 2025-01-29 | 버전: v6.1.0

---

## 📑 목차

1. [게임 관리 시스템](#1-게임-관리-시스템)
   - [1.1 GameScanner.js](#11-gamescannerjs)
   - [1.2 GameValidator.js](#12-gamevalidatorjs)
2. [AI 시스템](#2-ai-시스템)
   - [2.1 AIAssistant.js](#21-aiassistantjs)
3. [인증 및 권한 시스템](#3-인증-및-권한-시스템)
   - [3.1 authRoutes.js](#31-authroutesjs)
   - [3.2 authMiddleware.js](#32-authmiddlewarejs)
4. [개발자 센터 API](#4-개발자-센터-api)
   - [4.1 developerRoutes.js](#41-developerroutesjs)

---

## 1. 게임 관리 시스템

### 1.1 GameScanner.js

#### 📄 파일 정보
- **경로**: `server/GameScanner.js`
- **라인 수**: 435줄
- **역할**: 로컬 및 원격 게임을 스캔하여 시스템에 자동 등록

#### 🎯 핵심 기능
1. 하이브리드 게임 스캔: 로컬 `public/games/` 폴더 + Supabase DB 통합
2. 메타데이터 자동 파싱: `game.json` 파일 분석 및 기본값 생성
3. 게임 타입 추론: 폴더명 기반 장르 및 센서 타입 자동 분류
4. 중복 제거: 원격 우선 정책으로 충돌 해결

#### 📌 전체 소스코드

```javascript
/**
 * 🔍 GameScanner v2.0
 *
 * 게임 폴더 + Supabase DB를 스캔하여 메타데이터를 수집하는 시스템
 * - games 폴더 내 모든 게임 자동 감지 (로컬)
 * - Supabase DB에서 원격 게임 자동 감지 (프로덕션)
 * - game.json 메타데이터 파싱
 * - 동적 게임 등록 및 라우팅
 */

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

class GameScanner {
    constructor(gamesDirectory = '../public/games') {
        this.gamesDir = path.join(__dirname, gamesDirectory);
        this.games = new Map();
        this.categories = new Set(['solo', 'dual', 'multi', 'experimental']);

        // Supabase 클라이언트 초기화
        this.supabaseClient = null;
        if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            this.supabaseClient = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_ROLE_KEY
            );
            console.log('✅ Supabase 클라이언트 초기화 (원격 게임 스캔 가능)');
        }

        console.log('🔍 GameScanner v2.0 초기화 (Hybrid 모드)');
    }

    /**
     * 모든 게임 스캔 및 등록 (로컬 + 원격 병합)
     */
    async scanGames() {
        try {
            this.games.clear();

            // 1. 로컬 게임 스캔
            console.log(`📂 로컬 게임 디렉토리 스캔 중: ${this.gamesDir}`);
            const localGames = await this.scanLocalGames();
            console.log(`✅ 로컬 게임 ${localGames.length}개 발견`);

            // 2. 원격 게임 스캔 (Supabase DB)
            let remoteGames = [];
            if (this.supabaseClient) {
                console.log(`☁️  Supabase DB에서 원격 게임 스캔 중...`);
                remoteGames = await this.scanRemoteGames();
                console.log(`✅ 원격 게임 ${remoteGames.length}개 발견`);
            }

            // 3. 게임 병합 (원격 우선, 중복 제거)
            const mergedGames = this.mergeGames(localGames, remoteGames);

            // 4. Map에 저장
            for (const game of mergedGames) {
                this.games.set(game.id, game);
            }

            console.log(`🎮 총 ${this.games.size}개 게임이 등록되었습니다.`);
            console.log(`   - 로컬: ${localGames.length}개`);
            console.log(`   - 원격: ${remoteGames.length}개`);

            return Array.from(this.games.values());

        } catch (error) {
            console.error('❌ 게임 스캔 실패:', error.message);
            return [];
        }
    }

    /**
     * 로컬 게임 디렉토리 스캔
     */
    async scanLocalGames() {
        try {
            const entries = await fs.readdir(this.gamesDir, { withFileTypes: true });
            const gameDirectories = entries.filter(entry => entry.isDirectory());

            const games = [];
            for (const dir of gameDirectories) {
                try {
                    const gameData = await this.scanGameDirectory(dir.name);
                    if (gameData) {
                        gameData.source = 'local';  // 출처 표시
                        games.push(gameData);
                        console.log(`✅ [로컬] ${gameData.title} (${dir.name})`);
                    }
                } catch (error) {
                    console.warn(`⚠️  게임 스캔 실패: ${dir.name} - ${error.message}`);
                }
            }

            return games;
        } catch (error) {
            console.error('❌ 로컬 게임 스캔 실패:', error.message);
            return [];
        }
    }

    /**
     * Supabase DB에서 원격 게임 스캔
     */
    async scanRemoteGames() {
        try {
            const { data, error } = await this.supabaseClient
                .from('generated_games')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ DB 쿼리 실패:', error);
                return [];
            }

            if (!data || data.length === 0) {
                console.log('ℹ️  DB에 원격 게임이 없습니다.');
                return [];
            }

            // DB 데이터를 GameScanner 형식으로 변환
            const games = data.map(dbGame => ({
                id: dbGame.game_id,
                title: dbGame.title,
                description: dbGame.description || `${dbGame.title} 게임`,
                category: dbGame.game_type || 'solo',
                icon: this.inferIcon(dbGame.game_id),
                sensors: this.inferSensorType(dbGame.game_id),
                maxPlayers: this.getMaxPlayersByCategory(dbGame.game_type),
                difficulty: dbGame.metadata?.difficulty || 'medium',
                version: dbGame.metadata?.version || '1.0.0',
                author: dbGame.metadata?.author || 'AI Generator',
                created: dbGame.created_at,
                updated: dbGame.updated_at,
                status: 'active',
                featured: false,
                experimental: true,  // AI 생성 게임은 실험적
                path: `/games/${dbGame.game_id}`,
                folder: dbGame.game_id,
                storageUrl: dbGame.storage_path ?
                    `${process.env.SUPABASE_URL}/storage/v1/object/public/games/${dbGame.storage_path}` : null,
                source: 'remote',  // 출처 표시
                playCount: dbGame.play_count || 0,
                ...(dbGame.thumbnail_url && { thumbnail: dbGame.thumbnail_url }),
                ...(dbGame.metadata?.tags && { tags: dbGame.metadata.tags })
            }));

            games.forEach(game => {
                console.log(`✅ [원격] ${game.title} (${game.id})`);
            });

            return games;

        } catch (error) {
            console.error('❌ 원격 게임 스캔 실패:', error.message);
            return [];
        }
    }

    /**
     * 로컬 게임과 원격 게임 병합 (원격 우선)
     */
    mergeGames(localGames, remoteGames) {
        const merged = new Map();

        // 1. 원격 게임 추가 (우선순위 높음) ☁️
        remoteGames.forEach(game => {
            merged.set(game.id, game);
        });

        // 2. 로컬 게임 추가 (원격에 없는 것만) 📁
        localGames.forEach(game => {
            if (!merged.has(game.id)) {
                merged.set(game.id, game);
            } else {
                console.log(`⚠️  중복 게임 무시 (원격 우선): ${game.id}`);
            }
        });

        return Array.from(merged.values());
    }

    /**
     * 개별 게임 디렉토리 스캔
     */
    async scanGameDirectory(gameFolderName) {
        const gameDir = path.join(this.gamesDir, gameFolderName);
        const metadataPath = path.join(gameDir, 'game.json');
        const indexPath = path.join(gameDir, 'index.html');

        // 필수 파일 존재 확인
        try {
            await fs.access(indexPath);
        } catch {
            console.warn(`⚠️  ${gameFolderName}: index.html이 없습니다.`);
            return null;
        }

        // 메타데이터 파일 읽기
        let metadata = {};
        try {
            const metadataContent = await fs.readFile(metadataPath, 'utf8');
            metadata = JSON.parse(metadataContent);
        } catch {
            console.log(`📝 ${gameFolderName}: game.json이 없어 기본 메타데이터를 생성합니다.`);
            metadata = this.generateDefaultMetadata(gameFolderName);
        }

        // 메타데이터 검증 및 보완
        const gameData = this.validateAndEnhanceMetadata(gameFolderName, metadata);

        return gameData;
    }

    /**
     * 기본 메타데이터 생성
     */
    generateDefaultMetadata(gameFolderName) {
        const title = gameFolderName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        return {
            id: gameFolderName,
            title: title,
            description: `${title} 게임`,
            category: this.inferCategory(gameFolderName),
            icon: this.inferIcon(gameFolderName),
            version: "1.0.0",
            author: "Unknown",
            sensors: this.inferSensorType(gameFolderName),
            status: "active"
        };
    }

    /**
     * 메타데이터 검증 및 보완
     */
    validateAndEnhanceMetadata(gameFolderName, metadata) {
        const validCategories = ['solo', 'dual', 'multi', 'experimental'];
        let category = metadata.category;

        if (!category || !validCategories.includes(category)) {
            category = metadata.gameType;
        }

        if (!category || !validCategories.includes(category)) {
            category = this.inferCategory(gameFolderName);
        }

        const enhanced = {
            // 필수 필드
            id: metadata.id || gameFolderName,
            title: metadata.title || this.generateDefaultMetadata(gameFolderName).title,
            description: metadata.description || `${metadata.title || gameFolderName} 게임`,
            category: category,
            icon: metadata.icon || this.inferIcon(gameFolderName),

            // 게임 설정
            sensors: metadata.sensors || this.inferSensorType(gameFolderName),
            maxPlayers: metadata.maxPlayers || this.getMaxPlayersByCategory(category),
            difficulty: metadata.difficulty || 'medium',

            // 메타 정보
            version: metadata.version || '1.0.0',
            author: metadata.author || 'Unknown',
            created: metadata.created || new Date().toISOString(),
            updated: new Date().toISOString(),

            // 상태 및 설정
            status: metadata.status || 'active',
            featured: metadata.featured || false,
            experimental: metadata.experimental || false,

            // 경로 정보
            path: `/games/${gameFolderName}`,
            folder: gameFolderName,

            // 추가 설정 (있는 경우만)
            ...(metadata.tags && { tags: metadata.tags }),
            ...(metadata.screenshots && { screenshots: metadata.screenshots }),
            ...(metadata.instructions && { instructions: metadata.instructions }),
            ...(metadata.controls && { controls: metadata.controls })
        };

        return enhanced;
    }

    /**
     * 게임 폴더명으로 카테고리 추론
     */
    inferCategory(folderName) {
        const name = folderName.toLowerCase();

        if (name.includes('multi') || name.includes('multiplayer')) return 'multi';
        if (name.includes('dual') || name.includes('coop')) return 'dual';
        if (name.includes('solo') || name.includes('single')) return 'solo';
        if (name.includes('test') || name.includes('demo')) return 'experimental';

        return 'solo';  // 기본값
    }

    /**
     * 게임 폴더명으로 아이콘 추론
     */
    inferIcon(folderName) {
        const name = folderName.toLowerCase();

        if (name.includes('racing') || name.includes('car')) return '🏎️';
        if (name.includes('ball') || name.includes('soccer')) return '⚽';
        if (name.includes('puzzle') || name.includes('maze')) return '🧩';
        if (name.includes('space') || name.includes('rocket')) return '🚀';
        if (name.includes('bird') || name.includes('fly')) return '🐦';
        if (name.includes('jump') || name.includes('platform')) return '🦘';
        if (name.includes('shoot') || name.includes('gun')) return '🎯';
        if (name.includes('multi')) return '👥';
        if (name.includes('dual')) return '🎮';

        return '🎯';  // 기본 아이콘
    }

    /**
     * 센서 타입 추론
     */
    inferSensorType(folderName) {
        const category = this.inferCategory(folderName);

        switch (category) {
            case 'solo': return ['orientation', 'motion'];
            case 'dual': return ['orientation', 'motion'];
            case 'multi': return ['orientation', 'motion'];
            default: return ['orientation'];
        }
    }

    /**
     * 카테고리별 최대 플레이어 수
     */
    getMaxPlayersByCategory(category) {
        switch (category) {
            case 'solo': return 1;
            case 'dual': return 2;
            case 'multi': return 8;
            default: return 1;
        }
    }

    // ===== 게임 조회 메서드 =====

    getGames() {
        return Array.from(this.games.values());
    }

    getGame(gameId) {
        return this.games.get(gameId);
    }

    getGamesByCategory(category) {
        return this.getGames().filter(game => game.category === category);
    }

    getActiveGames() {
        return this.getGames().filter(game => game.status === 'active');
    }

    getFeaturedGames() {
        return this.getGames().filter(game => game.featured);
    }

    searchGames(query) {
        const searchTerm = query.toLowerCase();

        return this.getGames().filter(game =>
            game.title.toLowerCase().includes(searchTerm) ||
            game.description.toLowerCase().includes(searchTerm) ||
            (game.tags && game.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }

    getStats() {
        const games = this.getGames();
        const categories = {};
        const statuses = {};

        games.forEach(game => {
            categories[game.category] = (categories[game.category] || 0) + 1;
            statuses[game.status] = (statuses[game.status] || 0) + 1;
        });

        return {
            total: games.length,
            categories,
            statuses,
            featured: games.filter(g => g.featured).length,
            experimental: games.filter(g => g.experimental).length
        };
    }
}

module.exports = GameScanner;
```

---

### 1.2 GameValidator.js

#### 📄 파일 정보
- **경로**: `server/GameValidator.js`
- **라인 수**: 972줄
- **역할**: AI가 생성한 게임 코드의 완성도와 작동 가능성 검증

#### 🎯 핵심 기능
1. HTML 구조 검증: JSDOM 기반 DOM 파싱 및 필수 요소 확인
2. JavaScript 문법 검증: 정규표현식 기반 패턴 매칭
3. SessionSDK 통합 검증: 필수 API 호출 순서 및 이벤트 처리 확인
4. 장르별 특화 검증: 6개 장르(arcade, physics, cooking 등) 맞춤 규칙
5. 품질 점수 산출: 130점 만점 (기본 100점 + 장르 30점)

#### 📌 전체 소스코드

```javascript
/**
 * 🔍 GameValidator v1.0
 *
 * AI가 생성한 게임의 완성도와 작동 가능성을 자동 검증
 * - HTML 구조 검증
 * - JavaScript 문법 검증
 * - SessionSDK 통합 패턴 검증
 * - 필수 요소 존재 여부 검증
 */

const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');

class GameValidator {
    constructor() {
        // 장르별 특화 검증 규칙
        this.genreSpecificRules = {
            'arcade': {
                requiredPatterns: [
                    /score|point/i,
                    /level|stage/i,
                    /timer|time|countdown/i,
                    /collision|hit/i,
                    /game.*over|gameOver/i,
                ],
                recommendedElements: ['score tracking', 'level progression', 'time management'],
                keyFeatures: ['점수 시스템', '레벨 진행', '타이머']
            },
            'physics': {
                requiredPatterns: [
                    /gravity/i,
                    /friction/i,
                    /velocity|vx.*vy|speed/i,
                    /collision|bounce|reflect/i,
                    /Math\.(sin|cos|atan2)/,
                ],
                recommendedElements: ['physics engine', 'collision detection', 'momentum'],
                keyFeatures: ['중력 시뮬레이션', '물체 충돌', '관성 적용']
            },
            'cooking': {
                requiredPatterns: [
                    /stir|mix|shake|flip/i,
                    /recipe|ingredient|cooking/i,
                    /timer|time|duration/i,
                    /temperature|heat|cook/i,
                    /progress|quality|done/i,
                ],
                recommendedElements: ['gesture recognition', 'timer system', 'progress tracking'],
                keyFeatures: ['제스처 인식', '타이밍 시스템', '요리 진행도']
            },
            'action': {
                requiredPatterns: [
                    /combo|score|points/i,
                    /speed|fast|quick/i,
                    /enemy|obstacle|avoid/i,
                    /powerup|bonus/i,
                ],
                keyFeatures: ['콤보 시스템', '점수 경쟁', '난이도 증가']
            },
            'puzzle': {
                requiredPatterns: [
                    /solve|solution|puzzle/i,
                    /hint|help|guide/i,
                    /level|stage|challenge/i,
                ],
                keyFeatures: ['문제 해결', '힌트 시스템', '단계적 진행']
            },
            'racing': {
                requiredPatterns: [
                    /steering|turn|control/i,
                    /track|road|path/i,
                    /speed|acceleration|brake/i,
                ],
                keyFeatures: ['조향 제어', '속도 관리', '경주 트랙']
            }
        };

        // 기본 검증 규칙
        this.validationRules = {
            requiredElements: [
                {
                    selectors: ['canvas#game-canvas', 'canvas#gameCanvas', 'canvas'],
                    name: '게임 캔버스',
                    description: 'canvas 요소'
                },
                {
                    selectors: ['#session-code-display', '#session-code'],
                    name: '세션 코드 표시'
                },
                {
                    selectors: ['#qr-container', '#qr-code', '[id*="qr"]'],
                    name: 'QR 코드 컨테이너'
                }
            ],

            requiredPatterns: [
                /new SessionSDK\(\{/,                  // SessionSDK 초기화
                /sdk\.on\('connected'/,                // connected 이벤트
                /sdk\.on\('session-created'/,          // session-created 이벤트
                /sdk\.on\('sensor-data'/,              // sensor-data 이벤트
                /event\.detail \|\| event/,            // CustomEvent 처리
                /createSession\(\)/,                   // 세션 생성
                /requestAnimationFrame/,               // 애니메이션 루프
                /getContext\('2d'\)/                   // 캔버스 컨텍스트
            ],

            requiredScripts: [
                '/socket.io/socket.io.js',
                '/js/SessionSDK.js'
            ]
        };
    }

    /**
     * 게임 파일 전체 검증
     */
    async validateGame(gameId, gamePath, gameMetadata = null) {
        const results = {
            gameId,
            gamePath,
            isValid: true,
            score: 0,
            maxScore: 130,  // 기본 100점 + 장르 30점
            errors: [],
            warnings: [],
            suggestions: [],
            details: {},
            genreCompliance: null
        };

        try {
            console.log(`🔍 게임 검증 시작: ${gameId}`);

            // 게임 장르 정보 추출
            const genre = this.extractGenreInfo(gameMetadata, gameId);
            if (genre) {
                console.log(`🎯 장르별 검증 활성화: ${genre}`);
                results.genre = genre;
            }

            // 1. 파일 존재성 검증 (10점)
            const fileValidation = await this.validateFileStructure(gamePath);
            results.details.files = fileValidation;
            results.score += fileValidation.score;

            if (fileValidation.errors.length > 0) {
                results.errors.push(...fileValidation.errors);
                results.isValid = false;
            }

            // 2. HTML 구조 검증 (25점)
            const htmlPath = path.join(gamePath, 'index.html');
            const htmlValidation = await this.validateHTML(htmlPath);
            results.details.html = htmlValidation;
            results.score += htmlValidation.score;

            if (htmlValidation.errors.length > 0) {
                results.errors.push(...htmlValidation.errors);
                results.isValid = false;
            }
            results.warnings.push(...htmlValidation.warnings);

            // 3. JavaScript 코드 검증 (35점)
            const jsValidation = await this.validateJavaScript(htmlPath);
            results.details.javascript = jsValidation;
            results.score += jsValidation.score;

            if (jsValidation.errors.length > 0) {
                results.errors.push(...jsValidation.errors);
                results.isValid = false;
            }
            results.warnings.push(...jsValidation.warnings);
            results.suggestions.push(...jsValidation.suggestions);

            // 4. SessionSDK 통합 패턴 검증 (20점)
            const sdkValidation = await this.validateSDKIntegration(htmlPath);
            results.details.sdk = sdkValidation;
            results.score += sdkValidation.score;

            if (sdkValidation.errors.length > 0) {
                results.errors.push(...sdkValidation.errors);
                results.isValid = false;
            }
            results.suggestions.push(...sdkValidation.suggestions);

            // 5. 장르별 특화 검증 (30점)
            if (results.genre) {
                const htmlContent = await fs.readFile(htmlPath, 'utf-8');
                const genreValidation = await this.validateGenreSpecifics(
                    htmlContent,
                    results.genre
                );
                results.details.genreCompliance = genreValidation;
                results.genreCompliance = genreValidation.compliance;
                results.score += genreValidation.score;

                console.log(`🎯 ${results.genre} 장르 검증 점수: ${genreValidation.score}/30`);

                if (genreValidation.compliance.recommendations.length > 0) {
                    results.suggestions.push('=== 장르별 특화 개선 제안 ===');
                    genreValidation.compliance.recommendations.forEach(rec => {
                        results.suggestions.push(`${rec.category}:`);
                        rec.items.forEach(item => results.suggestions.push(`  - ${item}`));
                    });
                }
            }

            // 6. 성능 및 최적화 검증 (10점)
            const performanceValidation = await this.validatePerformance(htmlPath);
            results.details.performance = performanceValidation;
            results.score += performanceValidation.score;
            results.suggestions.push(...performanceValidation.suggestions);

            // 최종 점수 계산
            results.score = Math.round(results.score);
            results.grade = this.calculateGrade(results.score);

            console.log(`✅ 검증 완료: ${gameId} - 점수: ${results.score}/130 (${results.grade})`);

            return results;

        } catch (error) {
            console.error(`❌ 게임 검증 실패: ${gameId}`, error);
            results.isValid = false;
            results.errors.push(`검증 프로세스 오류: ${error.message}`);
            return results;
        }
    }

    /**
     * 파일 구조 검증
     */
    async validateFileStructure(gamePath) {
        const result = { score: 0, maxScore: 10, errors: [], warnings: [] };

        try {
            // index.html 존재 확인
            const indexPath = path.join(gamePath, 'index.html');
            await fs.access(indexPath);
            result.score += 7;

            // game.json 존재 확인 (선택사항)
            try {
                const metadataPath = path.join(gamePath, 'game.json');
                await fs.access(metadataPath);
                result.score += 3;

                const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
                if (!metadata.title || !metadata.description) {
                    result.warnings.push('game.json에 title 또는 description이 누락됨');
                }
            } catch (jsonError) {
                result.warnings.push('game.json 파일이 없거나 유효하지 않음');
            }

        } catch (error) {
            result.errors.push('index.html 파일이 존재하지 않음');
        }

        return result;
    }

    /**
     * HTML 구조 검증
     */
    async validateHTML(htmlPath) {
        const result = { score: 0, maxScore: 25, errors: [], warnings: [] };

        try {
            const htmlContent = await fs.readFile(htmlPath, 'utf-8');
            const dom = new JSDOM(htmlContent);
            const document = dom.window.document;

            // 필수 HTML 요소 존재 확인
            let foundElements = 0;
            let totalRequired = 0;

            for (const elementRule of this.validationRules.requiredElements) {
                if (!elementRule.optional) {
                    totalRequired++;
                }

                let elementFound = false;
                for (const selector of elementRule.selectors) {
                    if (document.querySelector(selector)) {
                        elementFound = true;
                        foundElements++;
                        console.log(`✅ ${elementRule.name} 발견: ${selector}`);
                        break;
                    }
                }

                if (!elementFound && !elementRule.optional) {
                    result.errors.push(`필수 요소 누락: ${elementRule.name}`);
                }
            }

            result.score += Math.round((foundElements / Math.max(totalRequired, 1)) * 20);

            // 필수 스크립트 태그 확인
            let foundScripts = 0;
            for (const scriptSrc of this.validationRules.requiredScripts) {
                if (document.querySelector(`script[src="${scriptSrc}"]`)) {
                    foundScripts++;
                } else {
                    result.errors.push(`필수 스크립트 누락: ${scriptSrc}`);
                }
            }

            result.score += Math.round((foundScripts / this.validationRules.requiredScripts.length) * 5);

            // 모바일 최적화 메타 태그 검증
            const viewport = document.querySelector('meta[name="viewport"]');
            if (!viewport || !viewport.content.includes('user-scalable=no')) {
                result.warnings.push('모바일 최적화를 위한 viewport 설정이 불완전함');
            }

        } catch (error) {
            result.errors.push(`HTML 파싱 오류: ${error.message}`);
        }

        return result;
    }

    /**
     * JavaScript 코드 검증
     */
    async validateJavaScript(htmlPath) {
        const result = {
            score: 0,
            maxScore: 35,
            errors: [],
            warnings: [],
            suggestions: []
        };

        try {
            const htmlContent = await fs.readFile(htmlPath, 'utf-8');
            const jsCode = this.extractJavaScriptFromHTML(htmlContent);

            if (!jsCode || jsCode.trim().length === 0) {
                result.errors.push('JavaScript 코드가 없음');
                return result;
            }

            // 필수 패턴 검증
            let foundPatterns = 0;
            for (const pattern of this.validationRules.requiredPatterns) {
                if (pattern.test(jsCode)) {
                    foundPatterns++;
                } else {
                    const patternName = this.getPatternName(pattern);
                    result.errors.push(`필수 패턴 누락: ${patternName}`);
                }
            }

            result.score += Math.round((foundPatterns / this.validationRules.requiredPatterns.length) * 25);

            // 문법 오류 기본 검사
            const syntaxCheck = this.basicSyntaxCheck(jsCode);
            if (syntaxCheck.errors.length > 0) {
                result.errors.push(...syntaxCheck.errors);
                result.score -= syntaxCheck.errors.length * 2;
            }
            result.warnings.push(...syntaxCheck.warnings);

            // 추가 점수 (고급 패턴)
            if (/try\s*\{[\s\S]*\}\s*catch/.test(jsCode)) {
                result.score += 3;
                result.suggestions.push('✅ 적절한 에러 처리가 구현됨');
            }

            if (/requestAnimationFrame/.test(jsCode)) {
                result.score += 2;
                result.suggestions.push('✅ 최적화된 애니메이션 루프 사용');
            }

            if (/Math\.max.*Math\.min/.test(jsCode)) {
                result.score += 2;
                result.suggestions.push('✅ 센서 데이터 범위 제한 구현됨');
            }

            result.score = Math.max(0, result.score);

        } catch (error) {
            result.errors.push(`JavaScript 검증 오류: ${error.message}`);
        }

        return result;
    }

    /**
     * SessionSDK 통합 패턴 검증
     */
    async validateSDKIntegration(htmlPath) {
        const result = {
            score: 0,
            maxScore: 20,
            errors: [],
            suggestions: []
        };

        try {
            const htmlContent = await fs.readFile(htmlPath, 'utf-8');
            const jsCode = this.extractJavaScriptFromHTML(htmlContent);

            // SDK 초기화 패턴 검증
            const sdkInitPattern = /new SessionSDK\(\{[\s\S]*gameId:\s*['"`]([^'"`]+)['"`][\s\S]*gameType:\s*['"`](\w+)['"`]/;
            const sdkMatch = jsCode.match(sdkInitPattern);

            if (sdkMatch) {
                result.score += 5;
                result.suggestions.push(`✅ SessionSDK 초기화됨: ${sdkMatch[1]} (${sdkMatch[2]})`);
            } else {
                result.errors.push('SessionSDK 초기화 패턴이 올바르지 않음');
            }

            // 이벤트 리스너 순서 검증
            const eventListenerOrder = this.checkEventListenerOrder(jsCode);
            if (eventListenerOrder.isValid) {
                result.score += 8;
                result.suggestions.push('✅ 올바른 이벤트 리스너 순서');
            } else {
                result.errors.push(...eventListenerOrder.errors);
            }

            // CustomEvent 처리 패턴 검증
            const customEventPattern = /sdk\.on\([^,]+,\s*(?:\([^)]*\)\s*=>\s*\{|\function\s*\([^)]*\)\s*\{)[\s\S]*?(?:event\.detail\s*\|\|\s*event|const\s+\w+\s*=\s*event\.detail\s*\|\|\s*event)/;
            if (customEventPattern.test(jsCode)) {
                result.score += 5;
                result.suggestions.push('✅ CustomEvent 처리 패턴 올바름');
            } else {
                result.errors.push('CustomEvent 처리 패턴이 누락됨 (event.detail || event)');
            }

            // QR 코드 생성 및 폴백 검증
            const qrPattern = /QRCodeGenerator[\s\S]*try[\s\S]*catch[\s\S]*fallback/i;
            if (qrPattern.test(jsCode)) {
                result.score += 2;
                result.suggestions.push('✅ QR 코드 생성 폴백 처리 구현됨');
            }

        } catch (error) {
            result.errors.push(`SDK 통합 검증 오류: ${error.message}`);
        }

        return result;
    }

    /**
     * 성능 및 최적화 검증
     */
    async validatePerformance(htmlPath) {
        const result = {
            score: 0,
            maxScore: 10,
            suggestions: []
        };

        try {
            const htmlContent = await fs.readFile(htmlPath, 'utf-8');
            const jsCode = this.extractJavaScriptFromHTML(htmlContent);

            // 애니메이션 루프 최적화
            if (/requestAnimationFrame/.test(jsCode) && /deltaTime|elapsed/.test(jsCode)) {
                result.score += 3;
                result.suggestions.push('✅ 시간 기반 애니메이션 루프 사용');
            }

            // 센서 데이터 처리 최적화
            if (/if\s*\(\s*!gameState\.isRunning/.test(jsCode)) {
                result.score += 2;
                result.suggestions.push('✅ 게임 상태 기반 센서 데이터 처리');
            }

            // 캔버스 렌더링 최적화
            if (/clearRect/.test(jsCode) && /fillRect|drawImage/.test(jsCode)) {
                result.score += 2;
                result.suggestions.push('✅ 기본적인 캔버스 렌더링 구현');
            }

            // 메모리 관리
            if (/removeEventListener|cleanup|destroy/.test(jsCode)) {
                result.score += 2;
                result.suggestions.push('✅ 메모리 관리 고려됨');
            }

            // 반응형 처리
            if (/window\.addEventListener.*resize/.test(jsCode)) {
                result.score += 1;
                result.suggestions.push('✅ 반응형 화면 크기 처리');
            }

        } catch (error) {
            result.suggestions.push(`성능 검증 오류: ${error.message}`);
        }

        return result;
    }

    /**
     * 장르별 특화 검증
     */
    async validateGenreSpecifics(htmlContent, genre) {
        const results = {
            score: 0,
            maxScore: 30,
            compliance: {
                requiredPatterns: { found: 0, total: 0, details: [] },
                keyFeatures: { found: 0, total: 0, details: [] },
                recommendations: []
            }
        };

        if (!this.genreSpecificRules[genre]) {
            return results;
        }

        const rules = this.genreSpecificRules[genre];

        // 1. 필수 패턴 검증 (20점)
        const patternResults = this.validateGenrePatterns(htmlContent, rules.requiredPatterns);
        results.compliance.requiredPatterns = patternResults;
        results.score += Math.round((patternResults.found / patternResults.total) * 20);

        // 2. 핵심 기능 검증 (10점)
        const featureResults = this.validateKeyFeatures(htmlContent, rules.keyFeatures);
        results.compliance.keyFeatures = featureResults;
        results.score += Math.round((featureResults.found / featureResults.total) * 10);

        // 3. 개선 제안 생성
        results.compliance.recommendations = this.generateGenreRecommendations(
            rules,
            patternResults,
            featureResults
        );

        return results;
    }

    /**
     * 장르별 패턴 검증
     */
    validateGenrePatterns(htmlContent, patterns) {
        const results = {
            found: 0,
            total: patterns.length,
            details: []
        };

        for (const pattern of patterns) {
            const matches = htmlContent.match(pattern);
            const found = matches && matches.length > 0;

            results.details.push({
                pattern: pattern.toString(),
                found: found,
                matches: found ? matches.length : 0
            });

            if (found) {
                results.found++;
            }
        }

        return results;
    }

    /**
     * 핵심 기능 검증
     */
    validateKeyFeatures(htmlContent, keyFeatures) {
        const results = {
            found: 0,
            total: keyFeatures.length,
            details: []
        };

        const keywordMap = {
            '중력 시뮬레이션': ['gravity', '중력'],
            '물체 충돌': ['collision', 'hit', 'bounce'],
            '관성 적용': ['momentum', 'inertia', 'velocity'],
            '제스처 인식': ['gesture', 'shake', 'stir'],
            '타이밍 시스템': ['timer', 'timing'],
            '요리 진행도': ['progress', 'cooking', 'done'],
            '점수 시스템': ['score', 'point'],
            '레벨 진행': ['level', 'stage'],
            '타이머': ['timer', 'countdown']
        };

        for (const feature of keyFeatures) {
            const keywords = keywordMap[feature] || [feature];
            let featureFound = false;

            for (const keyword of keywords) {
                if (htmlContent.toLowerCase().includes(keyword.toLowerCase())) {
                    featureFound = true;
                    break;
                }
            }

            results.details.push({
                feature: feature,
                found: featureFound,
                keywords: keywords
            });

            if (featureFound) {
                results.found++;
            }
        }

        return results;
    }

    /**
     * 장르별 개선 제안 생성
     */
    generateGenreRecommendations(rules, patternResults, featureResults) {
        const recommendations = [];

        // 누락된 패턴에 대한 제안
        const missingPatterns = patternResults.details.filter(p => !p.found);
        if (missingPatterns.length > 0) {
            recommendations.push({
                category: '누락된 핵심 기능',
                items: missingPatterns.map(p => `패턴 구현 필요: ${p.pattern}`)
            });
        }

        // 누락된 핵심 기능에 대한 제안
        const missingFeatures = featureResults.details.filter(f => !f.found);
        if (missingFeatures.length > 0) {
            recommendations.push({
                category: '추천 기능 추가',
                items: missingFeatures.map(f => `${f.feature} 기능 구현 권장`)
            });
        }

        return recommendations;
    }

    // ===== 헬퍼 메서드 =====

    extractJavaScriptFromHTML(htmlContent) {
        const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
        let jsContent = '';
        let match;

        while ((match = scriptRegex.exec(htmlContent)) !== null) {
            if (!match[0].includes('src=')) {
                jsContent += match[1] + '\n\n';
            }
        }

        return jsContent.trim();
    }

    checkEventListenerOrder(jsCode) {
        const result = { isValid: true, errors: [] };

        const connectedMatch = jsCode.match(/sdk\.on\s*\(\s*['"`]connected['"`]/);
        const createSessionMatch = jsCode.match(/createSession\s*\(\s*\)/);

        if (connectedMatch && createSessionMatch) {
            const connectedIndex = connectedMatch.index;
            const createSessionIndex = createSessionMatch.index;

            if (createSessionIndex < connectedIndex) {
                result.isValid = false;
                result.errors.push('createSession()이 connected 이벤트 리스너보다 먼저 호출됨');
            }
        }

        return result;
    }

    basicSyntaxCheck(jsCode) {
        const result = { errors: [], warnings: [] };

        // 괄호 균형 검사
        const openBraces = (jsCode.match(/\{/g) || []).length;
        const closeBraces = (jsCode.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
            result.errors.push(`중괄호 불균형: { ${openBraces}개, } ${closeBraces}개`);
        }

        // 일반적인 오타 검사
        const commonTypos = [
            { pattern: /sesion/gi, correct: 'session' },
            { pattern: /sensot/gi, correct: 'sensor' },
            { pattern: /conected/gi, correct: 'connected' }
        ];

        commonTypos.forEach(typo => {
            if (typo.pattern.test(jsCode)) {
                result.warnings.push(`오타 가능성: "${typo.pattern.source}" -> "${typo.correct}"`);
            }
        });

        return result;
    }

    getPatternName(pattern) {
        const patternMap = {
            '/new SessionSDK\\(\\{/': 'SessionSDK 초기화',
            '/sdk\\.on\\(\'connected\'/': 'connected 이벤트 리스너',
            '/sdk\\.on\\(\'session-created\'/': 'session-created 이벤트 리스너',
            '/sdk\\.on\\(\'sensor-data\'/': 'sensor-data 이벤트 리스너',
            '/event\\.detail \\|\\| event/': 'CustomEvent 처리 패턴',
            '/createSession\\(\\)/': '세션 생성 호출',
            '/requestAnimationFrame/': '애니메이션 루프',
            '/getContext\\(\'2d\'\\)/': '캔버스 2D 컨텍스트'
        };

        return patternMap[pattern.toString()] || pattern.toString();
    }

    extractGenreInfo(gameMetadata, gameId) {
        if (gameMetadata && gameMetadata.genre) {
            return gameMetadata.genre.toLowerCase();
        }

        const genreKeywords = {
            'physics': ['physics', 'ball', 'gravity'],
            'cooking': ['cooking', 'cook', 'recipe'],
            'action': ['action', 'fight', 'battle'],
            'puzzle': ['puzzle', 'maze', 'solve'],
            'racing': ['racing', 'race', 'car']
        };

        for (const [genre, keywords] of Object.entries(genreKeywords)) {
            if (keywords.some(keyword => gameId.toLowerCase().includes(keyword))) {
                return genre;
            }
        }

        return null;
    }

    calculateGrade(score) {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B+';
        if (score >= 60) return 'B';
        if (score >= 50) return 'C';
        return 'F';
    }

    /**
     * 검증 보고서 생성
     */
    generateReport(validationResult) {
        const { gameId, score, maxScore, grade, errors, warnings, suggestions, genre } = validationResult;

        let report = `
🎮 게임 검증 보고서: ${gameId}
==================================

📊 총점: ${score}/${maxScore} (등급: ${grade})
🎯 게임 상태: ${validationResult.isValid ? '✅ 플레이 가능' : '❌ 수정 필요'}
${genre ? `🎮 장르: ${genre.toUpperCase()}` : ''}
`;

        if (errors.length > 0) {
            report += `\n❌ 오류 (${errors.length}개):\n`;
            errors.forEach((error, index) => {
                report += `  ${index + 1}. ${error}\n`;
            });
        }

        if (warnings.length > 0) {
            report += `\n⚠️ 경고 (${warnings.length}개):\n`;
            warnings.forEach((warning, index) => {
                report += `  ${index + 1}. ${warning}\n`;
            });
        }

        if (suggestions.length > 0) {
            report += `\n💡 제안 및 개선사항 (${suggestions.length}개):\n`;
            suggestions.forEach((suggestion, index) => {
                report += `  ${index + 1}. ${suggestion}\n`;
            });
        }

        report += '\n==================================\n';

        return report;
    }
}

module.exports = GameValidator;
```

---

## 2. AI 시스템

### 2.1 AIAssistant.js

#### 📄 파일 정보
- **경로**: `server/AIAssistant.js`
- **라인 수**: 416줄
- **역할**: RAG 기반 개발자 도우미 AI 챗봇

#### 🎯 핵심 기능
1. 프롬프트 캐싱: Anthropic API 캐싱으로 비용 90% 절감
2. RAG 문서 검색: OpenAI Embeddings + Supabase Vector DB
3. 대화 히스토리 관리: 세션 기반 증분 캐싱
4. Claude Sonnet 4.5: 최신 모델 (2025-09-29) 활용

#### 📌 전체 소스코드

```javascript
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
                                // ✨ 대화 히스토리 증분 캐싱
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
```

---

## 3. 인증 및 권한 시스템

### 3.1 authRoutes.js

#### 📄 파일 정보
- **경로**: `server/routes/authRoutes.js`
- **라인 수**: 408줄
- **역할**: Supabase Auth 기반 사용자 인증 관리

#### 🎯 핵심 기능
1. 회원가입: 이메일 검증, 닉네임 중복 확인, `game_creators` 테이블 자동 생성
2. 로그인: JWT 토큰 발급, 세션 관리
3. 사용자 정보 조회: 프로필 및 제작자 통계 조회
4. 토큰 갱신: Refresh Token 기반 세션 연장

#### 📌 전체 소스코드

```javascript
/**
 * 인증 관련 라우트
 * 회원가입, 로그인, 로그아웃 기능
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { optionalAuth } = require('../middleware/authMiddleware');

class AuthRoutes {
    constructor() {
        this.router = express.Router();
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        // Service Role Key for admin operations (server-side only)
        this.supabaseAdmin = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        this.setupRoutes();
    }

    setupRoutes() {
        // 회원가입
        this.router.post('/api/auth/signup', async (req, res) => {
            await this.handleSignup(req, res);
        });

        // 로그인
        this.router.post('/api/auth/login', async (req, res) => {
            await this.handleLogin(req, res);
        });

        // 로그아웃
        this.router.post('/api/auth/logout', async (req, res) => {
            await this.handleLogout(req, res);
        });

        // 사용자 정보 조회
        this.router.get('/api/auth/user', optionalAuth, async (req, res) => {
            await this.handleGetUser(req, res);
        });

        // 토큰 갱신
        this.router.post('/api/auth/refresh', async (req, res) => {
            await this.handleRefreshToken(req, res);
        });

        // 비밀번호 재설정 요청
        this.router.post('/api/auth/reset-password', async (req, res) => {
            await this.handleResetPassword(req, res);
        });
    }

    /**
     * 회원가입 처리
     */
    async handleSignup(req, res) {
        try {
            const { email, password, name, nickname } = req.body;

            // 입력 검증
            if (!email || !password || !name || !nickname) {
                return res.status(400).json({
                    error: '이메일, 비밀번호, 이름, 닉네임을 모두 입력해주세요.',
                    code: 'MISSING_FIELDS'
                });
            }

            // 이메일 형식 검증
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    error: '올바른 이메일 형식을 입력해주세요.',
                    code: 'INVALID_EMAIL'
                });
            }

            // 비밀번호 강도 검증
            if (password.length < 6) {
                return res.status(400).json({
                    error: '비밀번호는 최소 6자 이상이어야 합니다.',
                    code: 'WEAK_PASSWORD'
                });
            }

            // 닉네임 중복 확인
            const { data: existingCreator } = await this.supabase
                .from('game_creators')
                .select('nickname')
                .eq('nickname', nickname)
                .single();

            if (existingCreator) {
                return res.status(409).json({
                    error: '이미 사용 중인 닉네임입니다.',
                    code: 'NICKNAME_EXISTS'
                });
            }

            // Supabase Auth로 회원가입
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        nickname
                    }
                }
            });

            if (error) {
                console.error('Signup error:', error);
                return res.status(400).json({
                    error: this.getErrorMessage(error),
                    code: error.message
                });
            }

            // game_creators 테이블에 사용자 정보 삽입 (Service Role Key 사용)
            const { error: creatorError } = await this.supabaseAdmin
                .from('game_creators')
                .insert({
                    id: data.user.id,
                    name: name,
                    nickname: nickname,
                    games_created: 0
                });

            if (creatorError) {
                console.error('Creator insert error:', creatorError);
                // Auth 사용자는 생성되었지만 creator 테이블 삽입 실패
                // 로그만 남기고 계속 진행 (나중에 수동으로 추가 가능)
            }

            // 회원가입 성공
            res.status(201).json({
                message: '회원가입이 완료되었습니다.',
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    name,
                    nickname
                },
                session: data.session
            });

        } catch (error) {
            console.error('Signup handler error:', error);
            res.status(500).json({
                error: '회원가입 처리 중 오류가 발생했습니다.',
                code: 'SIGNUP_ERROR'
            });
        }
    }

    /**
     * 로그인 처리
     */
    async handleLogin(req, res) {
        try {
            const { email, password } = req.body;

            // 입력 검증
            if (!email || !password) {
                return res.status(400).json({
                    error: '이메일과 비밀번호를 입력해주세요.',
                    code: 'MISSING_CREDENTIALS'
                });
            }

            // Supabase Auth로 로그인
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('Login error:', error);
                return res.status(401).json({
                    error: this.getErrorMessage(error),
                    code: error.message
                });
            }

            // 제작자 정보 조회
            let { data: creator, error: creatorError } = await this.supabase
                .from('game_creators')
                .select('name, nickname, games_created')
                .eq('id', data.user.id)
                .single();

            // game_creators 테이블에 데이터가 없으면 생성 (기존 사용자 대응)
            if (creatorError || !creator) {
                const userName = data.user.user_metadata?.name || data.user.email.split('@')[0];
                const userNickname = data.user.user_metadata?.nickname || userName;

                const { data: newCreator, error: insertError } = await this.supabaseAdmin
                    .from('game_creators')
                    .insert({
                        id: data.user.id,
                        name: userName,
                        nickname: userNickname,
                        games_created: 0
                    })
                    .select('name, nickname, games_created')
                    .single();

                if (!insertError) {
                    creator = newCreator;
                }
            }

            // 로그인 시간 업데이트
            if (creator) {
                try {
                    await this.supabase.rpc('update_creator_login', {
                        creator_id: data.user.id
                    });
                } catch (rpcError) {
                    // RPC 함수가 없어도 로그인은 계속 진행
                    console.log('update_creator_login RPC not available');
                }
            }

            // 로그인 성공
            res.json({
                message: '로그인되었습니다.',
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    ...creator
                },
                session: data.session
            });

        } catch (error) {
            console.error('Login handler error:', error);
            res.status(500).json({
                error: '로그인 처리 중 오류가 발생했습니다.',
                code: 'LOGIN_ERROR'
            });
        }
    }

    /**
     * 로그아웃 처리
     */
    async handleLogout(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                await this.supabase.auth.signOut(token);
            }

            res.json({
                message: '로그아웃되었습니다.'
            });

        } catch (error) {
            console.error('Logout handler error:', error);
            res.status(500).json({
                error: '로그아웃 처리 중 오류가 발생했습니다.',
                code: 'LOGOUT_ERROR'
            });
        }
    }

    /**
     * 사용자 정보 조회
     */
    async handleGetUser(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    error: '로그인이 필요합니다.',
                    code: 'NOT_AUTHENTICATED'
                });
            }

            // 제작자 정보 조회
            const { data: creator } = await this.supabase
                .from('game_creators')
                .select('name, nickname, games_created, last_game_created_at, created_at')
                .eq('id', req.user.id)
                .single();

            res.json({
                success: true,
                user: {
                    id: req.user.id,
                    email: req.user.email,
                    ...creator
                }
            });

        } catch (error) {
            console.error('Get user handler error:', error);
            res.status(500).json({
                error: '사용자 정보 조회 중 오류가 발생했습니다.',
                code: 'USER_INFO_ERROR'
            });
        }
    }

    /**
     * 토큰 갱신
     */
    async handleRefreshToken(req, res) {
        try {
            const { refresh_token } = req.body;

            if (!refresh_token) {
                return res.status(400).json({
                    error: 'Refresh token이 필요합니다.',
                    code: 'MISSING_REFRESH_TOKEN'
                });
            }

            const { data, error } = await this.supabase.auth.refreshSession({
                refresh_token
            });

            if (error) {
                return res.status(401).json({
                    error: '토큰 갱신에 실패했습니다.',
                    code: 'REFRESH_FAILED'
                });
            }

            res.json({
                session: data.session
            });

        } catch (error) {
            console.error('Refresh token handler error:', error);
            res.status(500).json({
                error: '토큰 갱신 중 오류가 발생했습니다.',
                code: 'REFRESH_ERROR'
            });
        }
    }

    /**
     * 비밀번호 재설정 요청
     */
    async handleResetPassword(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    error: '이메일을 입력해주세요.',
                    code: 'MISSING_EMAIL'
                });
            }

            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`
            });

            if (error) {
                console.error('Reset password error:', error);
                return res.status(400).json({
                    error: '비밀번호 재설정 요청에 실패했습니다.',
                    code: 'RESET_FAILED'
                });
            }

            res.json({
                message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.'
            });

        } catch (error) {
            console.error('Reset password handler error:', error);
            res.status(500).json({
                error: '비밀번호 재설정 요청 중 오류가 발생했습니다.',
                code: 'RESET_ERROR'
            });
        }
    }

    /**
     * Supabase 에러 메시지를 사용자 친화적으로 변환
     */
    getErrorMessage(error) {
        const errorMap = {
            'User already registered': '이미 가입된 이메일입니다.',
            'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
            'Email not confirmed': '이메일 인증이 필요합니다.',
            'Password should be at least 6 characters': '비밀번호는 최소 6자 이상이어야 합니다.',
            'Unable to validate email address: invalid format': '올바른 이메일 형식을 입력해주세요.',
            'signup_disabled': '회원가입이 비활성화되어 있습니다.'
        };

        return errorMap[error.message] || error.message || '알 수 없는 오류가 발생했습니다.';
    }

    getRouter() {
        return this.router;
    }
}

module.exports = AuthRoutes;
```

---

### 3.2 authMiddleware.js

#### 📄 파일 정보
- **경로**: `server/middleware/authMiddleware.js`
- **라인 수**: 236줄
- **역할**: 권한 검증 미들웨어

#### 🎯 핵심 기능
1. `checkCreatorAuth`: 게임 제작자 인증 확인
2. `optionalAuth`: 선택적 인증 (로그인 여부 확인)
3. `checkGameOwnership`: 게임 소유권 확인 (수정/삭제 시)
4. **admin 특별 권한**: `admin@admin.com` 계정은 모든 게임 관리 가능

#### 📌 전체 소스코드

```javascript
/**
 * Supabase 인증 미들웨어
 * 게임 제작자 권한 확인을 위한 미들웨어
 */

const { createClient } = require('@supabase/supabase-js');

class AuthMiddleware {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        // Service Role Key for admin operations (server-side only)
        this.supabaseAdmin = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }

    /**
     * 게임 제작자 권한 확인 미들웨어
     * AI 게임 생성기 접근 시 사용
     */
    checkCreatorAuth = async (req, res, next) => {
        try {
            // Authorization 헤더에서 토큰 추출
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    error: '게임 제작을 위해서는 로그인이 필요합니다.',
                    code: 'AUTH_REQUIRED'
                });
            }

            const token = authHeader.substring(7); // 'Bearer ' 제거

            // Supabase에서 토큰 검증
            const { data: { user }, error } = await this.supabase.auth.getUser(token);

            if (error || !user) {
                return res.status(401).json({
                    error: '유효하지 않은 인증 토큰입니다.',
                    code: 'INVALID_TOKEN'
                });
            }

            // 제작자 테이블에서 사용자 확인
            let { data: creator, error: creatorError } = await this.supabase
                .from('game_creators')
                .select('id, name, nickname')
                .eq('id', user.id)
                .single();

            // game_creators 테이블에 데이터가 없으면 자동으로 생성 (기존 사용자 대응)
            if (creatorError || !creator) {
                const userName = user.user_metadata?.name || user.email.split('@')[0];
                const userNickname = user.user_metadata?.nickname || userName;

                const { data: newCreator, error: insertError } = await this.supabaseAdmin
                    .from('game_creators')
                    .insert({
                        id: user.id,
                        name: userName,
                        nickname: userNickname,
                        games_created: 0
                    })
                    .select('id, name, nickname')
                    .single();

                if (insertError) {
                    console.error('Auto-create creator error:', insertError);
                    return res.status(403).json({
                        error: '게임 제작 권한을 생성할 수 없습니다.',
                        code: 'CREATOR_CREATE_FAILED'
                    });
                }

                creator = newCreator;
            }

            // 요청 객체에 사용자 정보 추가
            req.user = user;
            req.creator = creator;

            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            return res.status(500).json({
                error: '인증 확인 중 오류가 발생했습니다.',
                code: 'AUTH_ERROR'
            });
        }
    };

    /**
     * 선택적 인증 미들웨어
     * 로그인된 경우에만 사용자 정보 추가
     */
    optionalAuth = async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                // 인증 없이 진행
                return next();
            }

            const token = authHeader.substring(7);
            const { data: { user }, error } = await this.supabase.auth.getUser(token);

            if (!error && user) {
                req.user = user;

                // 제작자 정보도 조회
                const { data: creator } = await this.supabase
                    .from('game_creators')
                    .select('id, name, nickname')
                    .eq('id', user.id)
                    .single();

                if (creator) {
                    req.creator = creator;
                }
            }

            next();
        } catch (error) {
            console.error('Optional auth middleware error:', error);
            // 에러가 있어도 진행
            next();
        }
    };

    /**
     * 관리자 권한 확인 (향후 확장용)
     */
    checkAdminAuth = async (req, res, next) => {
        try {
            // 먼저 기본 인증 확인
            await this.checkCreatorAuth(req, res, () => {});

            if (!req.creator) {
                return res.status(403).json({
                    error: '관리자 권한이 필요합니다.',
                    code: 'ADMIN_REQUIRED'
                });
            }

            // 관리자 확인 로직 (필요시 추가)
            // 현재는 모든 제작자가 관리자 권한 보유

            next();
        } catch (error) {
            console.error('Admin auth middleware error:', error);
            return res.status(500).json({
                error: '관리자 권한 확인 중 오류가 발생했습니다.',
                code: 'ADMIN_AUTH_ERROR'
            });
        }
    };

    /**
     * 게임 소유권 확인 미들웨어
     * 게임 수정/삭제 시 해당 게임의 제작자인지 확인
     * admin@admin.com 계정은 모든 게임에 접근 가능
     */
    checkGameOwnership = async (req, res, next) => {
        try {
            const gameId = req.params.gameId || req.body.gameId;

            if (!gameId) {
                return res.status(400).json({
                    error: 'gameId가 필요합니다.',
                    code: 'GAME_ID_REQUIRED'
                });
            }

            const userId = req.user?.id;
            const userEmail = req.user?.email;

            // 관리자는 모든 게임에 접근 가능
            if (userEmail === 'admin@admin.com') {
                req.isAdmin = true;
                return next();
            }

            // 일반 사용자는 자신이 만든 게임만 접근 가능
            const { data: game, error } = await this.supabase
                .from('generated_games')
                .select('creator_id')
                .eq('game_id', gameId)
                .single();

            if (error) {
                console.error('Game ownership check error:', error);
                return res.status(404).json({
                    error: '게임을 찾을 수 없습니다.',
                    code: 'GAME_NOT_FOUND'
                });
            }

            if (game.creator_id !== userId) {
                return res.status(403).json({
                    error: '이 게임에 대한 권한이 없습니다.',
                    code: 'FORBIDDEN'
                });
            }

            next();
        } catch (error) {
            console.error('Game ownership check error:', error);
            return res.status(500).json({
                error: '권한 확인 중 오류가 발생했습니다.',
                code: 'OWNERSHIP_CHECK_ERROR'
            });
        }
    };

    /**
     * 관리자 여부 확인 헬퍼 함수
     */
    isAdmin = (user) => {
        return user?.email === 'admin@admin.com';
    };
}

// 싱글톤 패턴으로 미들웨어 인스턴스 생성
const authMiddleware = new AuthMiddleware();

module.exports = {
    checkCreatorAuth: authMiddleware.checkCreatorAuth,
    optionalAuth: authMiddleware.optionalAuth,
    checkAdminAuth: authMiddleware.checkAdminAuth,
    checkGameOwnership: authMiddleware.checkGameOwnership,
    isAdmin: authMiddleware.isAdmin,
    AuthMiddleware
};
```

---

## 4. 개발자 센터 API

### 4.1 developerRoutes.js

#### 📄 파일 정보
- **경로**: `server/routes/developerRoutes.js`
- **라인 수**: 4,348줄 (핵심 코드만 발췌)
- **역할**: 개발자 센터의 모든 백엔드 로직 통합

#### 🎯 핵심 기능
1. 35개 마크다운 문서 렌더링: 자동 목차 생성, 코드 하이라이팅
2. AI 챗봇 API: `/api/developer/chat` (세션 관리)
3. 게임 다운로드: ZIP 압축 및 실시간 스트리밍
4. 게임 삭제: Storage + DB 완전 삭제 (권한 검증)
5. 게임 관리: CRUD 작업 및 권한 제어

#### 📌 핵심 소스코드 발췌

```javascript
/**
 * 👨‍💻 DeveloperRoutes v6.0
 *
 * 통합 개발자 센터 라우트
 * - 35개 마크다운 문서 뷰어
 * - AI 게임 생성기 통합
 * - AI 매뉴얼 챗봇 통합
 * - 좌측 사이드바 네비게이션
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const archiver = require('archiver');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { checkCreatorAuth, optionalAuth, checkGameOwnership } = require('../middleware/authMiddleware');

class DeveloperRoutes {
    constructor(gameScanner, aiServiceGetter) {
        this.gameScanner = gameScanner;
        this.aiServiceGetter = aiServiceGetter;
        this.router = express.Router();

        // 💬 챗봇 세션 관리 (메모리 기반)
        this.chatSessions = new Map();
        this.sessionTimeout = 30 * 60 * 1000; // 30분

        // 🗑️ 세션 정리 타이머 (10분마다 실행)
        setInterval(() => {
            const now = Date.now();
            let cleanedCount = 0;

            for (const [sessionId, session] of this.chatSessions.entries()) {
                if (now - session.lastAccess > this.sessionTimeout) {
                    this.chatSessions.delete(sessionId);
                    cleanedCount++;
                }
            }

            if (cleanedCount > 0) {
                console.log(`🗑️ 챗봇 세션 ${cleanedCount}개 정리됨`);
            }
        }, 10 * 60 * 1000);

        this.setupRoutes();
    }

    setupRoutes() {
        // 문서 뷰어
        this.router.get('/developer', this.renderDocsViewer.bind(this));
        this.router.get('/developer/docs/:docName', this.renderDocsViewer.bind(this));

        // AI 챗봇 API
        this.router.post('/api/developer/chat', this.handleChat.bind(this));

        // 게임 관리 API
        this.router.get('/api/developer/games', this.getGamesList.bind(this));
        this.router.get('/api/developer/games/:gameId/download', this.handleDownloadGame.bind(this));
        this.router.delete('/api/developer/games/:gameId',
            checkGameOwnership,  // 권한 검증
            this.handleDeleteGame.bind(this)
        );
    }

    /**
     * 💬 AI 챗봇 대화 처리
     */
    async handleChat(req, res) {
        try {
            const { message, sessionId: clientSessionId } = req.body;

            // ✅ 세션 ID 생성 또는 재사용
            const sessionId = clientSessionId || `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // aiServiceGetter를 호출하여 현재 aiService 가져오기
            const aiService = this.aiServiceGetter();

            if (!aiService) {
                return res.json({
                    response: '❌ AI 서비스가 초기화되지 않았습니다.',
                    sessionId: sessionId
                });
            }

            // 📚 세션 가져오기 또는 생성
            let session = this.chatSessions.get(sessionId);
            if (!session) {
                session = {
                    messages: [],
                    lastAccess: Date.now(),
                    createdAt: Date.now()
                };
                this.chatSessions.set(sessionId, session);
                console.log(`✨ 새 챗봇 세션 생성: ${sessionId}`);
            }

            // 📝 사용자 메시지 추가
            session.messages.push({
                role: 'user',
                content: message
            });
            session.lastAccess = Date.now();

            // 🤖 AI 서비스 호출 (전체 대화 히스토리 전달)
            const result = await aiService.processChat(message, session.messages);

            if (result.success) {
                // 💾 AI 응답 저장
                session.messages.push({
                    role: 'assistant',
                    content: result.message
                });

                res.json({
                    response: result.message,
                    sessionId: sessionId,
                    cacheStats: process.env.NODE_ENV === 'development' ? result.usage : undefined
                });
            } else {
                res.json({
                    response: '❌ ' + result.error,
                    sessionId: sessionId
                });
            }
        } catch (error) {
            console.error('❌ AI 챗봇 오류:', error);
            res.json({
                response: '❌ 오류가 발생했습니다: ' + error.message,
                sessionId: req.body.sessionId
            });
        }
    }

    /**
     * 📥 게임 다운로드 (ZIP 스트리밍)
     */
    async handleDownloadGame(req, res) {
        try {
            const { gameId } = req.params;

            if (!gameId) {
                return res.status(400).json({
                    success: false,
                    error: '게임 ID가 필요합니다.'
                });
            }

            console.log(`📥 게임 다운로드 요청 [게임 ID: ${gameId}]`);

            if (!this.supabaseAdmin) {
                return res.status(500).json({
                    success: false,
                    error: 'Storage 클라이언트가 초기화되지 않았습니다.'
                });
            }

            // Storage에서 파일 목록 조회
            const { data: fileList, error: listError } = await this.supabaseAdmin
                .storage
                .from('games')
                .list(gameId);

            if (listError) throw listError;

            if (!fileList || fileList.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: '게임 파일을 찾을 수 없습니다.'
                });
            }

            console.log(`📦 ZIP 압축 시작 [파일 수: ${fileList.length}]`);

            // ZIP 다운로드 헤더 설정
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${gameId}.zip"`);

            // archiver 인스턴스 생성
            const archive = archiver('zip', { zlib: { level: 9 } });

            // 오류 처리
            archive.on('error', (err) => {
                console.error('❌ ZIP 압축 오류:', err);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        error: 'ZIP 압축 중 오류 발생'
                    });
                }
            });

            // 완료 로깅
            archive.on('end', () => {
                console.log(`✅ ZIP 압축 완료 [${gameId}.zip]`);
            });

            // 스트림 연결
            archive.pipe(res);

            // Storage에서 파일 다운로드 후 ZIP에 추가
            for (const file of fileList) {
                const storagePath = `${gameId}/${file.name}`;

                const { data: fileData, error: downloadError } = await this.supabaseAdmin
                    .storage
                    .from('games')
                    .download(storagePath);

                if (downloadError) {
                    console.error(`❌ 다운로드 실패: ${storagePath}`, downloadError);
                    continue;
                }

                // ZIP에 파일 추가
                archive.append(Buffer.from(await fileData.arrayBuffer()), {
                    name: `${gameId}/${file.name}`
                });

                console.log(`  ✓ ${file.name}`);
            }

            // ZIP 생성 완료
            await archive.finalize();

        } catch (error) {
            console.error('❌ 게임 다운로드 오류:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        }
    }

    /**
     * 🗑️ 게임 삭제 핸들러 (권한 검증 필수)
     * Storage와 DB에서 게임 완전 삭제
     */
    async handleDeleteGame(req, res) {
        try {
            const { gameId } = req.params;

            if (!gameId) {
                return res.status(400).json({
                    success: false,
                    error: '게임 ID가 필요합니다.'
                });
            }

            console.log(`🗑️  게임 삭제 요청 [게임 ID: ${gameId}]`);

            if (!this.supabaseAdmin) {
                return res.status(500).json({
                    success: false,
                    error: 'Storage 클라이언트가 초기화되지 않았습니다.'
                });
            }

            // Storage에서 파일 목록 조회
            const { data: fileList, error: listError } = await this.supabaseAdmin
                .storage
                .from('games')
                .list(gameId);

            if (listError) throw listError;

            // Storage에서 파일 삭제
            if (fileList && fileList.length > 0) {
                console.log(`☁️  Storage 파일 삭제 중 [${fileList.length}개 파일]...`);

                const filePaths = fileList.map(file => `${gameId}/${file.name}`);

                const { error: deleteError } = await this.supabaseAdmin
                    .storage
                    .from('games')
                    .remove(filePaths);

                if (deleteError) throw deleteError;

                console.log(`✅ Storage 파일 삭제 완료`);
            }

            // DB에서 레코드 삭제
            console.log(`💾 DB 레코드 삭제 중...`);

            const { error: dbError } = await this.supabaseAdmin
                .from('generated_games')
                .delete()
                .eq('game_id', gameId);

            if (dbError) throw dbError;

            console.log(`✅ DB 레코드 삭제 완료`);

            // GameScanner 재스캔
            if (this.gameScanner) {
                await this.gameScanner.scanGames();
            }

            res.json({
                success: true,
                message: `게임 "${gameId}"이(가) 완전히 삭제되었습니다.`
            });

        } catch (error) {
            console.error('❌ 게임 삭제 오류:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    getRouter() {
        return this.router;
    }
}

module.exports = DeveloperRoutes;
```

---

## 📊 소스코드 통계

| 파일명 | 라인 수 | 역할 | 중요도 |
|--------|---------|------|--------|
| GameScanner.js | 435 | 게임 자동 등록 | ⭐⭐⭐⭐☆ |
| GameValidator.js | 972 | AI 코드 검증 | ⭐⭐⭐⭐⭐ |
| AIAssistant.js | 416 | RAG 챗봇 | ⭐⭐⭐⭐☆ |
| authRoutes.js | 408 | 사용자 인증 | ⭐⭐⭐⭐☆ |
| authMiddleware.js | 236 | 권한 검증 | ⭐⭐⭐⭐⭐ |
| developerRoutes.js | 4,348 (발췌 600) | 개발자 센터 API | ⭐⭐⭐⭐⭐ |
| **전체** | **6,815줄** | - | - |

---

## 🔗 관련 문서

- **API 문서**: `DEVELOPER_GUIDE.md`
- **시스템 아키텍처**: `SOURCE_CODE_REPORT.md`
- **데이터베이스 스키마**: `supabase/migrations/`
- **프로젝트 가이드**: `CLAUDE.md`

---

**작성일**: 2025-01-29
**버전**: v6.1.0
**작성자**: Sensor Game Hub Development Team

