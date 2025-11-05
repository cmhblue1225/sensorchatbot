# Sensor Game Hub v6.1 - 핵심 소스코드 보고서

> AI 기반 모바일 센서 게임 자동 생성 플랫폼
> 작성일: 2025-01-29
> 버전: v6.1.0

---

## 📑 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [핵심 백엔드 시스템](#3-핵심-백엔드-시스템)
   - [3.1 GameScanner - 게임 자동 등록 시스템](#31-gamescanner---게임-자동-등록-시스템)
   - [3.2 GameValidator - AI 코드 검증 시스템](#32-gamevalidator---ai-코드-검증-시스템)
   - [3.3 AIAssistant - RAG 기반 챗봇](#33-aiassistant---rag-기반-챗봇)
   - [3.4 DeveloperRoutes - 개발자 센터 API](#34-developerroutes---개발자-센터-api)
   - [3.5 AuthRoutes - 사용자 인증 시스템](#35-authroutes---사용자-인증-시스템)
   - [3.6 AuthMiddleware - 권한 검증 시스템](#36-authmiddleware---권한-검증-시스템)
4. [데이터베이스 스키마](#4-데이터베이스-스키마)
   - [4.1 generated_games 테이블](#41-generated_games-테이블)
   - [4.2 game_versions 테이블](#42-game_versions-테이블)
   - [4.3 권한 관리 마이그레이션](#43-권한-관리-마이그레이션)
5. [시스템 통합 플로우](#5-시스템-통합-플로우)
6. [결론](#6-결론)

---

## 1. 프로젝트 개요

### 1.1 프로젝트 정보

- **프로젝트명**: Sensor Game Hub v6.1
- **기술 스택**: Node.js, Express, Socket.IO, Claude Sonnet 4.5, OpenAI Embeddings, Supabase
- **주요 기능**:
  - AI 기반 센서 게임 자동 생성 (대화형 인터페이스)
  - 생성된 게임 코드 자동 검증 (최소 95점 품질 보장)
  - RAG 기반 개발자 도우미 챗봇
  - 권한 기반 게임 관리 시스템
  - 실시간 센서 데이터 처리 (WebSocket)

### 1.2 핵심 혁신 기술

1. **대화형 AI 게임 생성**: Claude Sonnet 4.5 (64K 토큰)를 활용한 5단계 생성 프로세스
2. **자동 코드 검증**: JSDOM 기반 HTML/JavaScript 구조 분석 및 품질 점수 산출
3. **장르별 특화 검증**: 6개 장르(arcade, physics, cooking 등) 맞춤형 검증 규칙
4. **프롬프트 캐싱**: Anthropic API 캐싱으로 비용 90% 절감
5. **하이브리드 게임 스캔**: 로컬 + Supabase DB 통합 게임 관리

---

## 2. 시스템 아키텍처

### 2.1 전체 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│                    클라이언트 계층                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  게임 플레이  │  │ 개발자 센터  │  │  센서 앱    │  │
│  │   (브라우저)  │  │   (React)    │  │  (모바일)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                    WebSocket + REST API
                          │
┌─────────────────────────────────────────────────────────┐
│                    서버 계층 (Express)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │           server/index.js (메인 서버)             │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                               │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┐  │
│  │SessionMgr│GameScan│GameValid│AI Gen   │DevRoutes│  │
│  └─────────┴─────────┴─────────┴─────────┴─────────┘  │
│  ┌─────────┬─────────┬─────────┬─────────┐             │
│  │AuthRoute│AuthMW   │AIAsst   │MaintenMgr│             │
│  └─────────┴─────────┴─────────┴─────────┘             │
└─────────────────────────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
┌─────────────────────┐  ┌─────────────────────┐
│   Supabase DB       │  │   Claude AI API     │
│  - generated_games  │  │  - Sonnet 4.5       │
│  - game_versions    │  │  - 프롬프트 캐싱     │
│  - game_creators    │  │  - RAG 검색         │
│  - game_knowledge   │  │                     │
└─────────────────────┘  └─────────────────────┘
```

### 2.2 핵심 모듈 구성

| 모듈명 | 파일 경로 | 라인 수 | 주요 역할 |
|--------|-----------|---------|----------|
| GameScanner | `server/GameScanner.js` | 435 | 로컬/원격 게임 자동 감지 |
| GameValidator | `server/GameValidator.js` | 972 | AI 생성 코드 검증 |
| AIAssistant | `server/AIAssistant.js` | 416 | RAG 기반 챗봇 |
| DeveloperRoutes | `server/routes/developerRoutes.js` | 4,348 | 개발자 센터 API |
| AuthRoutes | `server/routes/authRoutes.js` | 408 | 사용자 인증 |
| AuthMiddleware | `server/middleware/authMiddleware.js` | 236 | 권한 검증 |

---

## 3. 핵심 백엔드 시스템

### 3.1 GameScanner - 게임 자동 등록 시스템

#### 📄 파일 정보
- **경로**: `server/GameScanner.js`
- **라인 수**: 435줄
- **목적**: 로컬 및 원격 게임을 스캔하여 시스템에 자동 등록

#### 🎯 핵심 기능

1. **하이브리드 게임 스캔**: 로컬 `public/games/` 폴더 + Supabase DB 통합
2. **메타데이터 자동 파싱**: `game.json` 파일 분석 및 기본값 생성
3. **게임 타입 추론**: 폴더명 기반 장르 및 센서 타입 자동 분류
4. **중복 제거**: 원격 우선 정책으로 충돌 해결

#### 📌 주요 코드

```javascript
/**
 * 🔍 GameScanner v2.0
 * 게임 폴더 + Supabase DB를 스캔하여 메타데이터를 수집하는 시스템
 */
class GameScanner {
    constructor(gamesDirectory = '../public/games') {
        this.gamesDir = path.join(__dirname, gamesDirectory);
        this.games = new Map();
        this.categories = new Set(['solo', 'dual', 'multi', 'experimental']);

        // Supabase 클라이언트 초기화
        this.supabaseClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }

    /**
     * 모든 게임 스캔 및 등록 (로컬 + 원격 병합)
     */
    async scanGames() {
        this.games.clear();

        // 1. 로컬 게임 스캔
        const localGames = await this.scanLocalGames();
        console.log(`✅ 로컬 게임 ${localGames.length}개 발견`);

        // 2. 원격 게임 스캔 (Supabase DB)
        const remoteGames = await this.scanRemoteGames();
        console.log(`✅ 원격 게임 ${remoteGames.length}개 발견`);

        // 3. 게임 병합 (원격 우선, 중복 제거)
        const mergedGames = this.mergeGames(localGames, remoteGames);

        // 4. Map에 저장
        for (const game of mergedGames) {
            this.games.set(game.id, game);
        }

        console.log(`🎮 총 ${this.games.size}개 게임이 등록되었습니다.`);
        return Array.from(this.games.values());
    }

    /**
     * Supabase DB에서 원격 게임 스캔
     */
    async scanRemoteGames() {
        const { data, error } = await this.supabaseClient
            .from('generated_games')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ DB 쿼리 실패:', error);
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
            storageUrl: dbGame.storage_path ?
                `${process.env.SUPABASE_URL}/storage/v1/object/public/games/${dbGame.storage_path}`
                : null,
            source: 'remote',  // 출처 표시
            playCount: dbGame.play_count || 0
        }));

        return games;
    }

    /**
     * 로컬 게임과 원격 게임 병합 (원격 우선)
     */
    mergeGames(localGames, remoteGames) {
        const merged = new Map();

        // 1. 원격 게임 추가 (우선순위 높음)
        remoteGames.forEach(game => {
            merged.set(game.id, game);
        });

        // 2. 로컬 게임 추가 (원격에 없는 것만)
        localGames.forEach(game => {
            if (!merged.has(game.id)) {
                merged.set(game.id, game);
            } else {
                console.log(`⚠️ 중복 게임 무시 (원격 우선): ${game.id}`);
            }
        });

        return Array.from(merged.values());
    }
}

module.exports = GameScanner;
```

#### 🔑 핵심 알고리즘

**게임 스캔 플로우**:
```
1. 로컬 파일 시스템 스캔 → public/games/* 폴더 검색
2. Supabase DB 쿼리 → generated_games 테이블 조회
3. 메타데이터 파싱 → game.json 또는 기본값 생성
4. 게임 병합 → 원격 우선 정책 (충돌 시 DB 데이터 사용)
5. Map 저장 → 빠른 조회를 위한 메모리 캐싱
```

---

### 3.2 GameValidator - AI 코드 검증 시스템

#### 📄 파일 정보
- **경로**: `server/GameValidator.js`
- **라인 수**: 972줄
- **목적**: AI가 생성한 게임 코드의 완성도와 작동 가능성 검증

#### 🎯 핵심 기능

1. **HTML 구조 검증**: JSDOM 기반 DOM 파싱 및 필수 요소 확인
2. **JavaScript 문법 검증**: 정규표현식 기반 패턴 매칭
3. **SessionSDK 통합 검증**: 필수 API 호출 순서 및 이벤트 처리 확인
4. **장르별 특화 검증**: 6개 장르(arcade, physics, cooking 등) 맞춤 규칙
5. **품질 점수 산출**: 130점 만점 (기본 100점 + 장르 30점)

#### 📌 주요 코드

```javascript
/**
 * 🔍 GameValidator v1.0
 * AI가 생성한 게임의 완성도와 작동 가능성을 자동 검증
 */
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
                recommendedElements: ['score tracking', 'level progression'],
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
                keyFeatures: ['중력 시뮬레이션', '물체 충돌', '관성 적용']
            },
            'cooking': {
                requiredPatterns: [
                    /stir|mix|shake|flip/i,
                    /recipe|ingredient|cooking/i,
                    /timer|time|duration/i,
                ],
                keyFeatures: ['제스처 인식', '타이밍 시스템', '요리 진행도']
            }
        };

        // 기본 검증 규칙
        this.validationRules = {
            requiredElements: [
                { selectors: ['canvas#game-canvas', 'canvas'], name: '게임 캔버스' },
                { selectors: ['#session-code-display', '#session-code'], name: '세션 코드' },
                { selectors: ['#qr-container', '.qr-container'], name: 'QR 컨테이너' }
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
            ]
        };
    }

    /**
     * 게임 파일 전체 검증
     */
    async validateGame(gameId, gamePath, gameMetadata = null) {
        const results = {
            gameId, gamePath,
            isValid: true,
            score: 0,
            maxScore: 130,  // 기본 100점 + 장르 30점
            errors: [], warnings: [], suggestions: [],
            details: {}, genreCompliance: null
        };

        try {
            console.log(`🔍 게임 검증 시작: ${gameId}`);

            // 게임 장르 추출
            const genre = this.extractGenreInfo(gameMetadata, gameId);
            if (genre) {
                console.log(`🎯 장르별 검증 활성화: ${genre}`);
                results.genre = genre;
            }

            // 1. 파일 존재성 검증 (10점)
            const fileValidation = await this.validateFileStructure(gamePath);
            results.score += fileValidation.score;
            if (fileValidation.errors.length > 0) {
                results.errors.push(...fileValidation.errors);
                results.isValid = false;
            }

            // 2. HTML 구조 검증 (25점)
            const htmlPath = path.join(gamePath, 'index.html');
            const htmlValidation = await this.validateHTML(htmlPath);
            results.score += htmlValidation.score;
            results.errors.push(...htmlValidation.errors);
            results.warnings.push(...htmlValidation.warnings);

            // 3. JavaScript 코드 검증 (35점)
            const jsValidation = await this.validateJavaScript(htmlPath);
            results.score += jsValidation.score;
            results.errors.push(...jsValidation.errors);
            results.suggestions.push(...jsValidation.suggestions);

            // 4. SessionSDK 통합 검증 (20점)
            const sdkValidation = await this.validateSDKIntegration(htmlPath);
            results.score += sdkValidation.score;
            results.errors.push(...sdkValidation.errors);

            // 5. 장르별 특화 검증 (30점)
            if (results.genre) {
                const htmlContent = await fs.readFile(htmlPath, 'utf-8');
                const genreValidation = await this.validateGenreSpecifics(htmlContent, results.genre);
                results.score += genreValidation.score;
                results.genreCompliance = genreValidation.compliance;
                console.log(`🎯 ${results.genre} 장르 점수: ${genreValidation.score}/30`);
            }

            // 6. 성능 최적화 검증 (10점)
            const performanceValidation = await this.validatePerformance(htmlPath);
            results.score += performanceValidation.score;

            // 최종 점수 및 등급 계산
            results.score = Math.round(results.score);
            results.grade = this.calculateGrade(results.score);

            console.log(`✅ 검증 완료: ${gameId} - 점수: ${results.score}/130 (${results.grade})`);
            return results;

        } catch (error) {
            results.isValid = false;
            results.errors.push(`검증 프로세스 오류: ${error.message}`);
            return results;
        }
    }

    /**
     * HTML 구조 검증
     */
    async validateHTML(htmlPath) {
        const result = { score: 0, maxScore: 25, errors: [], warnings: [] };

        const htmlContent = await fs.readFile(htmlPath, 'utf-8');
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;

        // 필수 HTML 요소 존재 확인
        let foundElements = 0;
        let totalRequired = 0;

        for (const elementRule of this.validationRules.requiredElements) {
            if (!elementRule.optional) totalRequired++;

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

        // 필수 스크립트 확인
        const requiredScripts = ['/socket.io/socket.io.js', '/js/SessionSDK.js'];
        let foundScripts = 0;
        for (const scriptSrc of requiredScripts) {
            if (document.querySelector(`script[src="${scriptSrc}"]`)) {
                foundScripts++;
            } else {
                result.errors.push(`필수 스크립트 누락: ${scriptSrc}`);
            }
        }
        result.score += Math.round((foundScripts / requiredScripts.length) * 5);

        return result;
    }

    /**
     * 장르별 특화 검증
     */
    async validateGenreSpecifics(htmlContent, genre) {
        const results = {
            score: 0, maxScore: 30,
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

        return results;
    }

    /**
     * 등급 계산
     */
    calculateGrade(score) {
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B+';
        if (score >= 60) return 'B';
        if (score >= 50) return 'C';
        return 'F';
    }
}

module.exports = GameValidator;
```

#### 🔑 검증 프로세스

```
┌──────────────────────────────────────────────────────┐
│             GameValidator 검증 프로세스              │
└──────────────────────────────────────────────────────┘

1. 파일 구조 검증 (10점)
   └─ index.html 존재 확인
   └─ game.json 유효성 검사

2. HTML 구조 검증 (25점)
   └─ JSDOM 파싱
   └─ 필수 요소 6개 확인
   └─ 스크립트 태그 2개 확인

3. JavaScript 검증 (35점)
   └─ 필수 패턴 9개 매칭
   └─ 금지 패턴 검사
   └─ 문법 오류 검사

4. SessionSDK 통합 (20점)
   └─ SDK 초기화 패턴
   └─ 이벤트 순서 검증
   └─ CustomEvent 처리

5. 장르별 검증 (30점)
   └─ 장르 패턴 매칭
   └─ 핵심 기능 확인
   └─ 개선 제안 생성

6. 성능 최적화 (10점)
   └─ 애니메이션 루프
   └─ 메모리 관리
   └─ 반응형 처리

최종: 점수 합산 (130점 만점) → 등급 산출 (A+ ~ F)
      최소 95점 요구 (InteractiveGameGenerator)
```

---

### 3.3 AIAssistant - RAG 기반 챗봇

#### 📄 파일 정보
- **경로**: `server/AIAssistant.js`
- **라인 수**: 416줄
- **목적**: RAG 기반 개발자 도우미 AI 챗봇

#### 🎯 핵심 기능

1. **프롬프트 캐싱**: Anthropic API 캐싱으로 비용 90% 절감
2. **RAG 문서 검색**: OpenAI Embeddings + Supabase Vector DB
3. **대화 히스토리 관리**: 세션 기반 증분 캐싱
4. **Claude Sonnet 4.5**: 최신 모델 (2025-09-29) 활용

#### 📌 주요 코드

```javascript
/**
 * 🤖 AIAssistant v2.0 - 프롬프트 캐싱 최적화 버전
 * Sensor Game Hub 개발자를 위한 RAG 기반 AI 도우미
 */
class AIAssistant {
    constructor() {
        this.config = {
            claudeModel: 'claude-sonnet-4-5-20250929',  // 64K 토큰
            embeddingModel: 'text-embedding-3-small',
            maxTokens: 4096,
            temperature: 0.3
        };

        // Anthropic SDK 클라이언트
        this.anthropicClient = new Anthropic({
            apiKey: process.env.CLAUDE_API_KEY
        });

        // OpenAI 임베딩 (RAG용)
        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: this.config.embeddingModel
        });

        // Supabase Vector DB
        this.supabaseClient = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
    }

    /**
     * 📚 RAG 문서 검색 (벡터 유사도 기반)
     */
    async searchDocs(query) {
        // 질문을 임베딩으로 변환
        const queryEmbedding = await this.embeddings.embedQuery(query);

        // Supabase RPC 직접 호출 (코사인 유사도)
        const { data, error } = await this.supabaseClient
            .rpc('match_documents', {
                query_embedding: queryEmbedding,
                match_threshold: 0.7,  // 70% 이상 유사도
                match_count: 5         // Top-5 문서
            });

        if (error || !data || data.length === 0) {
            return '관련 문서를 찾을 수 없습니다.';
        }

        // 문서 내용 결합
        const relevantDocs = data.map(doc => doc.content).join('\n\n---\n\n');
        console.log(`📚 관련 문서 ${data.length}개 검색 완료`);

        return relevantDocs;
    }

    /**
     * 💬 챗봇 대화 처리 (프롬프트 캐싱 적용)
     */
    async processChat(message, conversationHistory = []) {
        try {
            // 1. RAG 문서 검색
            const relevantDocs = await this.searchDocs(message);

            // 2. 시스템 프롬프트 구성 (캐싱 적용)
            const systemMessages = [
                {
                    type: "text",
                    text: this.getSystemPrompt(),
                    cache_control: { type: "ephemeral" }  // ✨ 5분 캐싱
                },
                {
                    type: "text",
                    text: `\n\n📚 관련 문서:\n\n${relevantDocs}`,
                    cache_control: { type: "ephemeral" }  // ✨ RAG 캐싱
                }
            ];

            // 3. 대화 히스토리 구성 (마지막 메시지 캐싱)
            const messages = conversationHistory.map((msg, idx) => {
                if (idx === conversationHistory.length - 1) {
                    return {
                        role: msg.role,
                        content: [{
                            type: "text",
                            text: msg.content,
                            cache_control: { type: "ephemeral" }  // ✨ 증분 캐싱
                        }]
                    };
                }
                return { role: msg.role, content: msg.content };
            });

            messages.push({ role: 'user', content: message });

            // 4. Claude API 호출
            const response = await this.anthropicClient.messages.create({
                model: this.config.claudeModel,
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature,
                system: systemMessages,  // ✅ 캐싱된 시스템 프롬프트
                messages: messages
            });

            // 5. 캐시 통계 로깅
            if (response.usage) {
                const cacheRead = response.usage.cache_read_input_tokens || 0;
                const inputTokens = response.usage.input_tokens || 0;
                const cacheHitRate = cacheRead > 0 ?
                    `${Math.round(cacheRead / (cacheRead + inputTokens) * 100)}%` : '0%';

                console.log('📊 토큰 사용량:', {
                    input: inputTokens,
                    cache_read: cacheRead,
                    cache_create: response.usage.cache_creation_input_tokens || 0,
                    output: response.usage.output_tokens,
                    cache_hit_rate: cacheHitRate
                });
            }

            return {
                success: true,
                message: response.content[0].text,
                usage: response.usage,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ 챗봇 처리 실패:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 🎯 시스템 프롬프트 생성
     */
    getSystemPrompt() {
        return `당신은 Sensor Game Hub v6.0의 전문 게임 개발 도우미입니다.

주요 역할:
- 모바일 센서를 활용한 게임 개발 질문에 답변
- SessionSDK 사용법 안내
- 게임 코드 자동 생성 및 디버깅 도움

중요한 개발 규칙:
1. SessionSDK 이벤트는 반드시 'event.detail || event' 패턴 처리
2. 서버 연결 완료 후 세션 생성 ('connected' 이벤트 대기)
3. QR 코드 생성 시 폴백 처리 포함

센서 데이터 구조:
- orientation: alpha(회전), beta(앞뒤), gamma(좌우)
- acceleration: x(좌우), y(상하), z(앞뒤)
- rotationRate: alpha(Z축), beta(X축), gamma(Y축)

게임 타입:
- solo: 1명, 단일 센서
- dual: 2명 협력, 2개 센서
- multi: 3-8명 경쟁, 여러 센서

제공된 컨텍스트를 참조하여 정확한 답변을 제공하세요.`;
    }
}

module.exports = AIAssistant;
```

#### 🔑 프롬프트 캐싱 전략

```
┌────────────────────────────────────────────────────┐
│          Anthropic Prompt Caching 구조            │
└────────────────────────────────────────────────────┘

[System Prompt] (캐시 1 - 5분 TTL)
├─ 시스템 지시사항 (고정)
└─ cache_control: ephemeral

[RAG Documents] (캐시 2 - 5분 TTL)
├─ 검색된 관련 문서 (쿼리별 변경)
└─ cache_control: ephemeral

[Conversation History] (캐시 3 - 증분)
├─ 이전 메시지들 (일반 텍스트)
├─ 마지막 메시지 (캐싱)
└─ cache_control: ephemeral

[Current Message] (캐싱 안함)
└─ 현재 사용자 질문

결과:
- 첫 요청: cache_creation_input_tokens (비용 25% 추가)
- 이후 요청: cache_read_input_tokens (비용 90% 절감)
- 5분 내 동일 컨텍스트 재사용 시 최대 효율
```

---

### 3.4 DeveloperRoutes - 개발자 센터 API

#### 📄 파일 정보
- **경로**: `server/routes/developerRoutes.js`
- **라인 수**: 4,348줄
- **목적**: 개발자 센터의 모든 백엔드 로직 통합

#### 🎯 핵심 기능

1. **35개 마크다운 문서 렌더링**: 자동 목차 생성, 코드 하이라이팅
2. **AI 게임 생성기 UI**: 동적 HTML 생성 (generateStandaloneGameGeneratorPage)
3. **AI 챗봇 API**: `/api/developer/chat` (세션 관리)
4. **게임 다운로드**: ZIP 압축 및 실시간 스트리밍
5. **게임 업로드**: Supabase Storage 자동 업로드
6. **권한 기반 CRUD**: 게임 수정/삭제 (소유권 검증)

#### 📌 핵심 API 엔드포인트

```javascript
class DeveloperRoutes {
    constructor(gameScanner, aiServiceGetter) {
        this.gameScanner = gameScanner;
        this.aiServiceGetter = aiServiceGetter;
        this.router = express.Router();

        // 💬 챗봇 세션 관리 (메모리 기반)
        this.chatSessions = new Map();
        this.sessionTimeout = 30 * 60 * 1000;  // 30분

        this.setupRoutes();
    }

    setupRoutes() {
        // 📚 문서 렌더링
        this.router.get('/developer', this.renderDocsViewer.bind(this));
        this.router.get('/developer/docs/:docName', this.renderDocsViewer.bind(this));

        // 💬 AI 챗봇 API
        this.router.post('/api/developer/chat', this.handleChatRequest.bind(this));

        // 🎮 게임 관리 API
        this.router.get('/api/developer/games', this.getGamesList.bind(this));
        this.router.get('/api/developer/games/:gameId/download', this.downloadGame.bind(this));
        this.router.delete('/api/developer/games/:gameId',
            checkGameOwnership,  // 권한 검증 미들웨어
            this.deleteGame.bind(this)
        );

        // 📤 게임 업로드
        this.router.post('/api/developer/upload',
            multer({ dest: 'uploads/' }).single('gameZip'),
            this.uploadGame.bind(this)
        );
    }

    /**
     * 💬 AI 챗봇 대화 처리
     */
    async handleChatRequest(req, res) {
        const { message, sessionId } = req.body;

        if (!message || !sessionId) {
            return res.status(400).json({
                success: false,
                error: '메시지와 세션 ID가 필요합니다.'
            });
        }

        // 세션 조회 또는 생성
        let session = this.chatSessions.get(sessionId);
        if (!session) {
            session = { messages: [], lastAccess: Date.now() };
            this.chatSessions.set(sessionId, session);
            console.log(`🆕 새 챗봇 세션 생성: ${sessionId}`);
        }

        // AI 서비스 가져오기
        const aiService = this.aiServiceGetter();
        if (!aiService || !aiService.assistant) {
            return res.status(503).json({
                success: false,
                error: 'AI 서비스를 사용할 수 없습니다.'
            });
        }

        try {
            // AI 응답 생성 (대화 히스토리 전달)
            const result = await aiService.assistant.processChat(
                message,
                session.messages
            );

            if (result.success) {
                // 대화 히스토리 저장
                session.messages.push(
                    { role: 'user', content: message },
                    { role: 'assistant', content: result.message }
                );
                session.lastAccess = Date.now();

                // 토큰 사용량 로깅
                if (result.usage) {
                    const cacheRead = result.usage.cache_read_input_tokens || 0;
                    const cacheCreate = result.usage.cache_creation_input_tokens || 0;
                    console.log(`💰 비용 절감: ${cacheRead} 토큰 캐시 사용 (생성: ${cacheCreate})`);
                }

                return res.json({
                    success: true,
                    message: result.message,
                    sessionId: sessionId,
                    messageCount: session.messages.length,
                    usage: result.usage  // 캐시 통계 반환
                });
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('❌ 챗봇 API 오류:', error);
            return res.status(500).json({
                success: false,
                error: '챗봇 응답 생성 중 오류가 발생했습니다.',
                details: error.message
            });
        }
    }

    /**
     * 🎮 게임 다운로드 (ZIP 스트리밍)
     */
    async downloadGame(req, res) {
        const { gameId } = req.params;

        try {
            const game = this.gameScanner.getGame(gameId);
            if (!game) {
                return res.status(404).json({ error: '게임을 찾을 수 없습니다.' });
            }

            // ZIP 파일명
            const zipFilename = `${gameId}.zip`;

            // 응답 헤더 설정
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

            // 아카이버 생성 및 스트리밍
            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.on('error', (err) => {
                console.error('ZIP 생성 오류:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'ZIP 파일 생성 실패' });
                }
            });

            // 스트림 연결
            archive.pipe(res);

            // 게임 폴더 추가
            const gamePath = path.join(__dirname, '../public/games', gameId);
            archive.directory(gamePath, false);

            // ZIP 완료
            await archive.finalize();

            console.log(`✅ 게임 다운로드 완료: ${gameId}`);

        } catch (error) {
            console.error('게임 다운로드 오류:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: '다운로드 중 오류 발생' });
            }
        }
    }

    /**
     * 🗑️ 게임 삭제 (권한 검증 필수)
     */
    async deleteGame(req, res) {
        const { gameId } = req.params;
        const userId = req.user?.id;
        const isAdmin = req.isAdmin;  // checkGameOwnership에서 설정

        try {
            // 1. DB에서 삭제
            const { error: dbError } = await supabaseClient
                .from('generated_games')
                .delete()
                .eq('game_id', gameId);

            if (dbError) throw dbError;

            // 2. Supabase Storage에서 삭제
            const storagePath = `${gameId}/index.html`;
            const { error: storageError } = await supabaseClient
                .storage
                .from('games')
                .remove([storagePath]);

            if (storageError) {
                console.warn('Storage 삭제 실패:', storageError);
            }

            // 3. 로컬 파일 삭제 (있는 경우)
            const localPath = path.join(__dirname, '../../public/games', gameId);
            if (fs.existsSync(localPath)) {
                await fs.rm(localPath, { recursive: true, force: true });
            }

            // 4. 게임 스캐너 재스캔
            await this.gameScanner.scanGames();

            console.log(`✅ 게임 삭제 완료: ${gameId} (by ${isAdmin ? 'admin' : userId})`);

            res.json({
                success: true,
                message: '게임이 삭제되었습니다.',
                gameId: gameId
            });

        } catch (error) {
            console.error('게임 삭제 오류:', error);
            res.status(500).json({
                success: false,
                error: '게임 삭제 중 오류가 발생했습니다.'
            });
        }
    }
}

module.exports = DeveloperRoutes;
```

#### 🔑 주요 API 목록

| 엔드포인트 | 메서드 | 기능 | 권한 |
|-----------|--------|------|------|
| `/developer` | GET | 문서 뷰어 메인 | 공개 |
| `/developer/docs/:docName` | GET | 특정 문서 렌더링 | 공개 |
| `/api/developer/chat` | POST | AI 챗봇 대화 | 공개 |
| `/api/developer/games` | GET | 게임 목록 조회 | 공개 |
| `/api/developer/games/:id/download` | GET | 게임 다운로드 (ZIP) | 공개 |
| `/api/developer/games/:id` | DELETE | 게임 삭제 | 소유자/관리자 |
| `/api/developer/upload` | POST | 게임 업로드 | 인증 필요 |

---

### 3.5 AuthRoutes - 사용자 인증 시스템

#### 📄 파일 정보
- **경로**: `server/routes/authRoutes.js`
- **라인 수**: 408줄
- **목적**: Supabase Auth 기반 사용자 인증 관리

#### 🎯 핵심 기능

1. **회원가입**: 이메일 검증, 닉네임 중복 확인, `game_creators` 테이블 자동 생성
2. **로그인**: JWT 토큰 발급, 세션 관리
3. **사용자 정보 조회**: 프로필 및 제작자 통계 조회
4. **토큰 갱신**: Refresh Token 기반 세션 연장

#### 📌 주요 코드

```javascript
class AuthRoutes {
    constructor() {
        this.router = express.Router();

        // Supabase 클라이언트 (2종류)
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY  // 클라이언트용
        );
        this.supabaseAdmin = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY  // 관리자용
        );

        this.setupRoutes();
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

            // Supabase Auth 회원가입
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { name, nickname }  // 메타데이터 저장
                }
            });

            if (error) {
                return res.status(400).json({
                    error: this.getErrorMessage(error),
                    code: error.message
                });
            }

            // game_creators 테이블 자동 생성 (Service Role Key 사용)
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
            }

            // 회원가입 성공
            res.status(201).json({
                message: '회원가입이 완료되었습니다.',
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    name, nickname
                },
                session: data.session  // JWT 토큰 반환
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

            if (!email || !password) {
                return res.status(400).json({
                    error: '이메일과 비밀번호를 입력해주세요.',
                    code: 'MISSING_CREDENTIALS'
                });
            }

            // Supabase Auth 로그인
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email, password
            });

            if (error) {
                return res.status(401).json({
                    error: this.getErrorMessage(error),
                    code: error.message
                });
            }

            // 제작자 정보 조회
            let { data: creator } = await this.supabase
                .from('game_creators')
                .select('name, nickname, games_created')
                .eq('id', data.user.id)
                .single();

            // game_creators 없으면 자동 생성 (기존 사용자 대응)
            if (!creator) {
                const userName = data.user.user_metadata?.name || data.user.email.split('@')[0];
                const userNickname = data.user.user_metadata?.nickname || userName;

                const { data: newCreator } = await this.supabaseAdmin
                    .from('game_creators')
                    .insert({
                        id: data.user.id,
                        name: userName,
                        nickname: userNickname,
                        games_created: 0
                    })
                    .select('name, nickname, games_created')
                    .single();

                creator = newCreator;
            }

            // 로그인 성공
            res.json({
                message: '로그인되었습니다.',
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    ...creator
                },
                session: data.session  // JWT 토큰 반환
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
     * Supabase 에러 메시지를 사용자 친화적으로 변환
     */
    getErrorMessage(error) {
        const errorMap = {
            'User already registered': '이미 가입된 이메일입니다.',
            'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
            'Email not confirmed': '이메일 인증이 필요합니다.',
            'Password should be at least 6 characters': '비밀번호는 최소 6자 이상이어야 합니다.'
        };

        return errorMap[error.message] || error.message || '알 수 없는 오류가 발생했습니다.';
    }
}

module.exports = AuthRoutes;
```

#### 🔑 인증 플로우

```
┌────────────────────────────────────────────────────┐
│              인증 시스템 플로우                      │
└────────────────────────────────────────────────────┘

[회원가입]
1. 입력 검증 (이메일, 비밀번호, 닉네임)
2. 닉네임 중복 확인 (game_creators 테이블)
3. Supabase Auth 회원가입
4. game_creators 테이블 자동 생성 (Service Role Key)
5. JWT 토큰 발급

[로그인]
1. Supabase Auth 로그인
2. game_creators 정보 조회
3. 없으면 자동 생성 (기존 사용자 대응)
4. JWT 토큰 반환

[토큰 검증] (authMiddleware.js)
1. Authorization 헤더 추출
2. Bearer 토큰 파싱
3. Supabase에서 토큰 검증
4. req.user 객체 설정

[권한 확인]
1. 게임 소유권 확인 (creator_id 비교)
2. admin@admin.com 특별 권한
3. 허용/거부 응답
```

---

### 3.6 AuthMiddleware - 권한 검증 시스템

#### 📄 파일 정보
- **경로**: `server/middleware/authMiddleware.js`
- **라인 수**: 236줄
- **목적**: 권한 기반 API 접근 제어

#### 🎯 핵심 기능

1. **checkCreatorAuth**: 게임 제작자 인증 필수
2. **optionalAuth**: 선택적 인증 (로그인 여부만 확인)
3. **checkGameOwnership**: 게임 소유권 확인 (수정/삭제 시)
4. **admin 특별 권한**: `admin@admin.com` 계정은 모든 게임 관리 가능

#### 📌 주요 코드

```javascript
class AuthMiddleware {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
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

            const token = authHeader.substring(7);  // 'Bearer ' 제거

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

            // game_creators 없으면 자동 생성 (기존 사용자 대응)
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
}

// 싱글톤 패턴으로 미들웨어 인스턴스 생성
const authMiddleware = new AuthMiddleware();

module.exports = {
    checkCreatorAuth: authMiddleware.checkCreatorAuth,
    optionalAuth: authMiddleware.optionalAuth,
    checkGameOwnership: authMiddleware.checkGameOwnership
};
```

#### 🔑 권한 검증 플로우

```
┌────────────────────────────────────────────────────┐
│           권한 검증 미들웨어 플로우                 │
└────────────────────────────────────────────────────┘

[checkCreatorAuth] (필수 인증)
1. Authorization 헤더 확인
2. Bearer 토큰 추출
3. Supabase Auth 검증
4. game_creators 조회/생성
5. req.user, req.creator 설정
6. next() 또는 401 Unauthorized

[optionalAuth] (선택적 인증)
1. 토큰이 있으면 검증
2. 없으면 그냥 통과
3. 에러도 무시하고 진행

[checkGameOwnership] (소유권 확인)
1. gameId 파라미터 추출
2. admin@admin.com 체크 → 통과
3. DB에서 creator_id 조회
4. req.user.id와 비교
5. 일치하면 next()
6. 불일치면 403 Forbidden

사용 예:
- POST /api/start-game-session → checkCreatorAuth (로그인 필수)
- GET /api/games → optionalAuth (선택적)
- DELETE /api/developer/games/:gameId → checkGameOwnership (소유자만)
```

---

## 4. 데이터베이스 스키마

### 4.1 generated_games 테이블

#### 📄 파일 정보
- **경로**: `supabase/migrations/create_generated_games.sql`
- **목적**: AI 생성 게임 메타데이터 저장

#### 📌 스키마 정의

```sql
-- Generated Games 테이블 생성
CREATE TABLE IF NOT EXISTS generated_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id TEXT UNIQUE NOT NULL,  -- 게임 폴더명
    title TEXT NOT NULL,
    description TEXT,
    game_type TEXT NOT NULL,  -- solo, dual, multi
    genre TEXT,
    storage_path TEXT NOT NULL,  -- Supabase Storage 경로
    thumbnail_url TEXT,
    play_count INTEGER DEFAULT 0,
    creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- 제작자
    metadata JSONB,  -- 추가 메타데이터
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_generated_games_game_id ON generated_games(game_id);
CREATE INDEX IF NOT EXISTS idx_generated_games_game_type ON generated_games(game_type);
CREATE INDEX IF NOT EXISTS idx_generated_games_created_at ON generated_games(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_games_creator_id ON generated_games(creator_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_generated_games_updated_at
    BEFORE UPDATE ON generated_games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 활성화
ALTER TABLE generated_games ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (읽기: 모두, 쓰기: 본인 또는 관리자)
CREATE POLICY "Anyone can read games"
    ON generated_games FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert games"
    ON generated_games FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creator or admin can update games"
    ON generated_games FOR UPDATE TO authenticated
    USING (auth.uid() = creator_id OR auth.email() = 'admin@admin.com');

CREATE POLICY "Creator or admin can delete games"
    ON generated_games FOR DELETE TO authenticated
    USING (auth.uid() = creator_id OR auth.email() = 'admin@admin.com');

-- 코멘트 추가
COMMENT ON TABLE generated_games IS 'AI로 생성된 센서 게임 메타데이터';
COMMENT ON COLUMN generated_games.game_id IS '게임 고유 ID (폴더명)';
COMMENT ON COLUMN generated_games.storage_path IS 'Supabase Storage 경로';
COMMENT ON COLUMN generated_games.creator_id IS '제작자 ID (auth.users)';
```

#### 🔑 핵심 필드

| 필드명 | 타입 | 설명 | 제약 |
|--------|------|------|------|
| `id` | UUID | 내부 ID | PRIMARY KEY |
| `game_id` | TEXT | 게임 폴더명 | UNIQUE, NOT NULL |
| `title` | TEXT | 게임 제목 | NOT NULL |
| `game_type` | TEXT | 게임 타입 | solo/dual/multi |
| `storage_path` | TEXT | Storage 경로 | NOT NULL |
| `creator_id` | UUID | 제작자 ID | FK to auth.users |
| `metadata` | JSONB | 추가 정보 | NULL 가능 |
| `created_at` | TIMESTAMPTZ | 생성 시각 | DEFAULT NOW() |

---

### 4.2 game_versions 테이블

#### 📄 파일 정보
- **경로**: `supabase/migrations/create_game_versions_table.sql`
- **목적**: 게임 버전 관리 및 수정 이력 추적

#### 📌 스키마 정의

```sql
-- 게임 버전 관리 테이블
CREATE TABLE IF NOT EXISTS game_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id TEXT NOT NULL UNIQUE,
    current_version TEXT NOT NULL DEFAULT '1.0',
    title TEXT,
    description TEXT,
    game_type TEXT,
    modifications JSONB DEFAULT '[]'::jsonb,  -- 수정 이력
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_game_versions_game_id ON game_versions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_versions_updated_at ON game_versions(updated_at);

-- RLS 활성화
ALTER TABLE game_versions ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 (공개)
CREATE POLICY "Anyone can read game versions"
    ON game_versions FOR SELECT
    USING (true);

-- 서버에서만 쓸 수 있도록 (service_role)
CREATE POLICY "Service role can insert game versions"
    ON game_versions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service role can update game versions"
    ON game_versions FOR UPDATE
    USING (true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_game_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER game_versions_updated_at
    BEFORE UPDATE ON game_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_game_versions_updated_at();
```

#### 🔑 버전 관리 로직

```javascript
// GameMaintenanceManager에서 사용되는 버전 관리 로직

// 버전 증가 함수
function incrementVersion(currentVersion, modificationType) {
    const [major, minor] = currentVersion.split('.').map(Number);

    if (modificationType === 'major') {
        return `${major + 1}.0`;  // 대규모 변경
    } else {
        return `${major}.${minor + 1}`;  // 버그 수정/기능 추가
    }
}

// 수정 이력 추가
async function addModification(gameId, modificationType, description) {
    const { data: version } = await supabase
        .from('game_versions')
        .select('modifications, current_version')
        .eq('game_id', gameId)
        .single();

    const newModification = {
        type: modificationType,  // 'bug_fix', 'feature_add'
        description: description,
        version: version.current_version,
        timestamp: new Date().toISOString()
    };

    const updatedModifications = [...version.modifications, newModification];

    await supabase
        .from('game_versions')
        .update({
            modifications: updatedModifications,
            current_version: incrementVersion(version.current_version, 'minor')
        })
        .eq('game_id', gameId);
}

// 사용 예:
// v1.0 (생성) → v1.1 (버그 수정) → v1.2 (기능 추가) → v2.0 (대규모 변경)
```

---

### 4.3 권한 관리 마이그레이션

#### 📄 파일 정보
- **경로**: `supabase/migrations/add_creator_id_to_generated_games.sql`
- **목적**: 게임 소유권 기반 권한 관리 시스템 구축 (2025-10-17 추가)

#### 📌 마이그레이션 스크립트

```sql
-- Add creator_id column to generated_games table for user permission management

-- Step 1: Add creator_id column
ALTER TABLE generated_games
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_generated_games_creator_id
ON generated_games(creator_id);

-- Step 3: Migrate existing games to test@test.com account
UPDATE generated_games
SET creator_id = (SELECT id FROM auth.users WHERE email = 'test@test.com')
WHERE creator_id IS NULL;

-- Step 4: Drop old RLS policies
DROP POLICY IF EXISTS "Anyone can read generated games" ON generated_games;
DROP POLICY IF EXISTS "Authenticated users can insert games" ON generated_games;
DROP POLICY IF EXISTS "Anyone can update games" ON generated_games;
DROP POLICY IF EXISTS "Anyone can delete games" ON generated_games;

-- Step 5: Create new RLS policies with proper permissions

-- READ: Anyone can view all games (for gameplay)
CREATE POLICY "Anyone can read games"
ON generated_games FOR SELECT
USING (true);

-- INSERT: Only authenticated users can create games, must set themselves as creator
CREATE POLICY "Authenticated users can insert games"
ON generated_games FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- UPDATE: Only game creator or admin can update
CREATE POLICY "Creator or admin can update games"
ON generated_games FOR UPDATE
TO authenticated
USING (
    auth.uid() = creator_id OR
    auth.email() = 'admin@admin.com'
);

-- DELETE: Only game creator or admin can delete
CREATE POLICY "Creator or admin can delete games"
ON generated_games FOR DELETE
TO authenticated
USING (
    auth.uid() = creator_id OR
    auth.email() = 'admin@admin.com'
);

-- Step 6: Add comments for documentation
COMMENT ON COLUMN generated_games.creator_id IS 'User who created this game (references auth.users). NULL for legacy games.';
```

#### 🔑 RLS 정책 설명

```
┌────────────────────────────────────────────────────┐
│          Row Level Security (RLS) 정책            │
└────────────────────────────────────────────────────┘

[SELECT] - 읽기
├─ 조건: USING (true)
└─ 결과: 모든 사용자가 모든 게임 조회 가능

[INSERT] - 생성
├─ 조건: TO authenticated, auth.uid() = creator_id
└─ 결과: 로그인한 사용자만 생성 가능, 본인을 creator로 설정

[UPDATE] - 수정
├─ 조건: TO authenticated, (creator_id = auth.uid() OR email = 'admin@admin.com')
└─ 결과: 본인 게임 또는 관리자만 수정 가능

[DELETE] - 삭제
├─ 조건: TO authenticated, (creator_id = auth.uid() OR email = 'admin@admin.com')
└─ 결과: 본인 게임 또는 관리자만 삭제 가능

특별 권한:
- admin@admin.com: 모든 게임에 대한 UPDATE/DELETE 권한
- creator_id가 NULL: 레거시 게임 (읽기만 가능)
```

---

## 5. 시스템 통합 플로우

### 5.1 AI 게임 생성 전체 플로우

```
┌────────────────────────────────────────────────────────────────┐
│              AI 게임 생성 전체 프로세스 (5단계)                │
└────────────────────────────────────────────────────────────────┘

사용자 → [Interactive Game Generator]
  │
  ├─ Step 1: 게임 아이디어 분석 (0-20%)
  │   ├─ 사용자 요구사항 파싱
  │   └─ 게임 타입 결정 (solo/dual/multi)
  │
  ├─ Step 2: RAG 문서 검색 (20-40%)
  │   ├─ OpenAI Embeddings 생성
  │   ├─ Supabase Vector DB 쿼리
  │   └─ Top-5 유사 문서 검색
  │
  ├─ Step 3: Claude AI 코드 생성 (40-80%)
  │   ├─ 64K 토큰 컨텍스트
  │   ├─ GAME_TEMPLATE.html 기반
  │   └─ SessionSDK 통합 패턴 적용
  │
  ├─ Step 4: 코드 검증 (80-90%)
  │   ├─ [GameValidator] 실행
  │   ├─ HTML 구조 검증
  │   ├─ JavaScript 문법 검증
  │   ├─ SessionSDK 통합 검증
  │   ├─ 장르별 특화 검증
  │   └─ 점수: 95/130 이상 요구
  │
  └─ Step 5: 저장 및 등록 (90-100%)
      ├─ Supabase Storage 업로드
      ├─ generated_games 테이블 INSERT
      ├─ game_versions 테이블 INSERT (v1.0)
      ├─ [GameScanner] 재스캔
      └─ 완료 응답 (게임 ID 반환)
```

### 5.2 게임 유지보수 플로우

```
┌────────────────────────────────────────────────────────────────┐
│           GameMaintenanceManager 유지보수 플로우               │
└────────────────────────────────────────────────────────────────┘

개발자 센터 → [버그 수정 요청]
  │
  ├─ 1. 현재 게임 코드 읽기
  │   └─ Supabase Storage에서 HTML 다운로드
  │
  ├─ 2. Claude AI 버그 분석 및 수정
  │   ├─ 버그 설명 전달
  │   ├─ 현재 코드 컨텍스트 제공
  │   └─ 수정된 코드 생성
  │
  ├─ 3. 버전 백업
  │   └─ game_versions 테이블에 현재 버전 저장
  │
  ├─ 4. 수정 코드 저장
  │   └─ Supabase Storage 덮어쓰기
  │
  └─ 5. 버전 증가 및 이력 기록
      ├─ v1.0 → v1.1 (버그 수정)
      ├─ modifications 배열에 추가
      └─ game_versions 테이블 UPDATE

개발자 센터 → [기능 추가 요청]
  │
  └─ (동일한 플로우, 버전 증가만 다름)
      └─ v1.1 → v1.2 (기능 추가)
```

### 5.3 권한 검증 플로우

```
┌────────────────────────────────────────────────────────────────┐
│              권한 기반 게임 관리 플로우                         │
└────────────────────────────────────────────────────────────────┘

클라이언트 → [DELETE /api/developer/games/:gameId]
  │
  ├─ 1. [checkGameOwnership] 미들웨어 실행
  │   ├─ req.headers.authorization 추출
  │   ├─ Bearer 토큰 파싱
  │   ├─ Supabase Auth 검증 (getUser)
  │   ├─ game_creators 조회
  │   └─ req.user, req.creator 설정
  │
  ├─ 2. 게임 소유권 확인
  │   ├─ gameId 파라미터 추출
  │   ├─ admin@admin.com 체크
  │   │   └─ true → req.isAdmin = true → PASS
  │   │
  │   └─ generated_games 테이블 조회
  │       ├─ SELECT creator_id WHERE game_id = :gameId
  │       └─ creator_id == req.user.id ?
  │           ├─ true → PASS
  │           └─ false → 403 Forbidden
  │
  └─ 3. 게임 삭제 처리
      ├─ DB 삭제 (generated_games)
      ├─ Storage 삭제 (Supabase Storage)
      ├─ 로컬 파일 삭제 (있는 경우)
      ├─ [GameScanner] 재스캔
      └─ 200 OK 응답

결과:
- 본인 게임: 수정/삭제 가능
- 타인 게임: 403 Forbidden
- admin@admin.com: 모든 게임 관리 가능
- 비로그인: 401 Unauthorized
```

---

## 6. 결론

### 6.1 기술적 성과

**Sensor Game Hub v6.1**은 다음과 같은 기술적 성과를 달성했습니다:

1. **AI 기반 자동화**
   - Claude Sonnet 4.5 (64K 토큰) 활용한 대화형 게임 생성
   - RAG 기반 문서 검색으로 정확한 코드 생성
   - 자동 코드 검증 시스템 (95점 이상 품질 보장)

2. **확장 가능한 아키텍처**
   - 하이브리드 게임 스캔 (로컬 + Supabase DB)
   - 권한 기반 접근 제어 (RLS 정책)
   - 버전 관리 시스템 (자동 증분)

3. **비용 최적화**
   - Anthropic 프롬프트 캐싱 (비용 90% 절감)
   - 증분 캐싱 (대화 히스토리)
   - 효율적인 RAG 검색 (Top-5 문서)

4. **완전한 개발자 경험**
   - 35개 마크다운 문서 시스템
   - AI 챗봇 도우미 (세션 기반)
   - 게임 다운로드/업로드 API

### 6.2 핵심 소스코드 통계

| 카테고리 | 파일 수 | 총 라인 수 | 주요 기술 |
|---------|---------|-----------|----------|
| 백엔드 시스템 | 6개 | 6,815줄 | Node.js, Express |
| 데이터베이스 | 3개 | 178줄 | PostgreSQL, RLS |
| **전체** | **9개** | **6,993줄** | - |

### 6.3 프로젝트의 혁신성

1. **대화형 AI 게임 생성**: 자연어로 게임 아이디어를 입력하면 완전한 플레이 가능한 게임 생성
2. **자동 품질 검증**: JSDOM + 정규표현식 기반 코드 분석으로 최소 95점 보장
3. **장르별 특화 검증**: 6개 장르(arcade, physics, cooking 등) 맞춤형 검증 규칙
4. **권한 기반 관리**: RLS 정책으로 본인 게임만 수정 가능, 관리자 특별 권한
5. **프롬프트 캐싱**: Anthropic API 캐싱으로 비용 90% 절감

### 6.4 향후 확장 가능성

1. **다국어 지원**: i18n 기반 글로벌 서비스
2. **모바일 앱**: React Native 기반 네이티브 앱
3. **커뮤니티 기능**: 게임 공유, 리뷰, 평점 시스템
4. **AI 튜닝**: 장르별 fine-tuning으로 생성 품질 향상
5. **실시간 협업**: 여러 개발자가 동시에 게임 수정

---

## 📚 참고 자료

- **프로젝트 문서**: `/Users/dev/졸업작품/sensorchatbot/docs/`
- **데이터베이스 마이그레이션**: `/Users/dev/졸업작품/sensorchatbot/supabase/migrations/`
- **API 문서**: `DEVELOPER_GUIDE.md` (35개 마크다운 문서 시스템)
- **기술 스택**:
  - [Node.js](https://nodejs.org/)
  - [Express.js](https://expressjs.com/)
  - [Socket.IO](https://socket.io/)
  - [Claude AI](https://anthropic.com/)
  - [Supabase](https://supabase.com/)

---

**작성일**: 2025-01-29
**버전**: v6.1.0
**작성자**: Sensor Game Hub Development Team

