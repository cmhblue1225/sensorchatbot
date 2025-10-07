# 🎮 Sensor Game Hub v6.0 프로젝트

## 📍 프로젝트 위치 및 기본 정보
- **경로**: `/Users/minhyuk/Desktop/센서게임/minhyuk/sensor-game-hub-v6/`
- **버전**: v6.0.0
- **설명**: 완벽한 게임별 독립 세션 시스템을 갖춘 센서 게임 허브
- **주요 기술**: Node.js, Express, Socket.IO, HTML5 Canvas, WebSocket

## 🏗️ 프로젝트 아키텍처

```
sensor-game-hub-v6/
├── server/                     # 서버 코드
│   ├── index.js                # 메인 서버 (Express + Socket.IO)
│   ├── SessionManager.js       # 세션 관리 시스템
│   └── GameScanner.js          # 게임 자동 스캔 시스템
├── public/                     # 클라이언트 파일
│   ├── js/
│   │   └── SessionSDK.js       # 통합 SDK (QR코드, 센서 수집기 포함)
│   ├── games/                  # 게임 디렉토리
│   │   ├── solo/               # 솔로 게임 
│   │   ├── dual/               # 듀얼 게임
│   │   ├── multi/              # 멀티플레이어 게임
│   │   ├── quick-draw/         # 퀵드로우 게임
│   │   └── tilt-maze/          # 틸트 미로 게임
│   └── sensor.html             # 통합 센서 클라이언트
├── package.json                # 의존성 및 프로젝트 설정
├── README.md                   # 프로젝트 문서
├── DEVELOPER_GUIDE.md          # 개발자 가이드
└── GAME_TEMPLATE.html          # 게임 개발 템플릿
```

## 🎯 핵심 기능

### 1. 게임별 독립 세션 시스템
- **즉시 세션 생성**: 게임 진입 시 자동으로 4자리 세션 코드 생성
- **QR 코드 지원**: 모바일 연결을 위한 QR 코드 자동 생성
- **실시간 상태 관리**: 연결 상태 및 게임 진행 상황 실시간 표시

### 2. 통합 센서 클라이언트
- **모든 게임 지원**: 하나의 센서 클라이언트로 모든 게임 타입 지원
- **자동 센서 감지**: iOS/Android 센서 자동 감지 및 권한 처리
- **실시간 데이터 전송**: 50ms 간격 고속 센서 데이터 전송

### 3. 완전한 게임 컬렉션
- **Solo Game**: 1개 센서로 플레이하는 공 조작 게임
- **Dual Game**: 2개 센서로 협력하는 미션 게임
- **Multi Game**: 최대 10명까지 동시 플레이하는 경쟁 게임
- **Quick Draw**: 빠른 반응 게임
- **Tilt Maze**: 기울기 기반 미로 게임

## 🚀 실행 방법

### 서버 시작
```bash
cd /Users/minhyuk/Desktop/센서게임/minhyuk/sensor-game-hub-v6
npm install
npm start
```

### 접속 URL
- **게임 허브**: http://localhost:3000
- **센서 클라이언트**: http://localhost:3000/sensor.html
- **특정 게임**: http://localhost:3000/games/[게임ID]

## 🔧 주요 파일 설명

### server/index.js:755
메인 서버 파일로 Express와 Socket.IO를 이용한 웹소켓 서버를 구현합니다.
- HTTP API 엔드포인트 제공
- 실시간 웹소켓 통신 처리
- 동적 홈페이지 생성
- 게임 라우팅 시스템

### public/js/SessionSDK.js
게임 개발을 위한 통합 SDK입니다.
- 세션 생성 및 관리
- 센서 데이터 수신 처리
- WebSocket 연결 관리
- 이벤트 기반 아키텍처

### 게임 개발 패턴

#### 필수 구현 패턴
```javascript
// 1. SDK 초기화 및 연결 대기
const sdk = new SessionSDK({
    gameId: 'game-name',
    gameType: 'solo'  // 'solo', 'dual', 'multi'
});

// 2. 서버 연결 완료 후 세션 생성
sdk.on('connected', () => {
    createSession();
});

// 3. CustomEvent 처리 패턴 (중요!)
sdk.on('session-created', (event) => {
    const session = event.detail || event;  // 반드시 이 패턴 사용!
    displaySessionInfo(session);
});

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;     // 반드시 이 패턴 사용!
    processSensorData(data);
});
```

## 📱 센서 데이터 구조
```javascript
{
    sensorId: "sensor",
    gameType: "solo",
    data: {
        orientation: {
            alpha: 45.0,    // 회전 (0-360°)
            beta: 15.0,     // 앞뒤 기울기 (-180~180°)
            gamma: -30.0    // 좌우 기울기 (-90~90°)
        },
        acceleration: {
            x: 0.1,         // 좌우 가속도
            y: -9.8,        // 상하 가속도  
            z: 0.2          // 앞뒤 가속도
        },
        rotationRate: {
            alpha: 0.0,     // Z축 회전 속도
            beta: 0.5,      // X축 회전 속도
            gamma: -0.3     // Y축 회전 속도
        }
    },
    timestamp: 1641234567890
}
```

## 🔗 주요 API 엔드포인트

### HTTP API
- `GET /api/games` - 게임 목록 조회
- `GET /api/games/:gameId` - 특정 게임 정보
- `GET /api/stats` - 서버 통계
- `POST /api/admin/rescan` - 게임 재스캔 (개발용)

### WebSocket Events
- `create-session` - 게임 세션 생성
- `connect-sensor` - 센서 클라이언트 연결
- `sensor-data` - 센서 데이터 전송
- `start-game` - 게임 시작

## 🎮 게임 개발 가이드

### 새 게임 추가하기
1. `public/games/` 폴더에 새 게임 폴더 생성
2. `index.html` 파일 작성 (GAME_TEMPLATE.html 참고)
3. `game.json` 메타데이터 파일 생성 (선택사항)
4. 서버 재시작 또는 `/api/admin/rescan` 호출

### 필수 개발 패턴
- 서버 연결 완료 후 세션 생성
- `event.detail || event` 패턴으로 CustomEvent 처리
- QR 코드 생성 시 폴백 처리 구현

## 🚨 중요 주의사항

### 반드시 따라야 할 패턴
1. **서버 연결 순서**: `connected` 이벤트 대기 후 세션 생성
2. **CustomEvent 처리**: 모든 SDK 이벤트에서 `event.detail || event` 패턴 사용
3. **QR 코드 생성**: 라이브러리 로드 실패 시 외부 API 폴백 사용

### 자주 발생하는 문제
- "서버에 연결되지 않았습니다" 오류 → 연결 완료 전 세션 생성 시도
- 세션 코드 undefined → CustomEvent 처리 누락
- QR 코드 생성 실패 → 라이브러리 로드 실패, 폴백 처리 필요

## 📈 성능 최적화
- 센서 데이터 50ms 간격 전송
- 자동 세션 정리 및 가비지 컬렉션
- Gzip 압축으로 대역폭 최적화
- 자동 재연결 시스템

## 🔄 다음 버전 계획
- 게임 결과 저장 시스템
- 사용자 랭킹 시스템
- PWA 지원
- 더 많은 게임 타입 추가

---

## 💡 개발 팁

### 테스트 및 디버깅
```bash
# 개발 서버 시작
npm start

# 게임 목록 확인
curl http://localhost:3000/api/games

# 게임 재스캔
curl -X POST http://localhost:3000/api/admin/rescan
```

### 공통 명령어
```bash
# 서버 실행
npm start

# 의존성 설치
npm install

# 테스트 (아직 미구현)
npm test
```

### 빠른 게임 개발
1. `GAME_TEMPLATE.html`을 복사하여 새 게임 폴더에 배치
2. 게임 ID와 제목 수정
3. `update()`, `render()`, `processSensorData()` 함수 구현
4. 서버 재시작하여 확인

---

## 🤖 AI 게임 생성기 시스템 V3 EXTREME (2025-10-08 대규모 업그레이드)

### 개요
Developer Center에 통합된 **극한 성능 향상** AI 게임 생성 시스템으로, Claude AI와 고급 RAG (Retrieval-Augmented Generation), 완벽한 게임 패턴 학습을 활용하여 **100% 실행 가능한 고품질 센서 게임**을 생성합니다.

### 🚀 V3 EXTREME 주요 개선사항
- **생성 성공률**: 60% → **100% 목표**
- **게임 품질**: 45점 → **95점 목표** (100점 만점)
- **버그 발생률**: 80% → **5% 이하 목표**
- **토큰 사용량**: 4,000 → **20,000 허용** (품질 우선)
- **모델 최적화**: Temperature 0.7 → **0.3** (일관성 2.3배 향상)
- **컨텍스트 확장**: 16,384 토큰 (2배 증가)

### 핵심 기술 스택 (V4 UPGRADE - 2025-10-08)
- **Claude AI**: Anthropic Claude Sonnet 4.5 & Opus 4.1 (최신 2025 모델) ⭐
  - **Primary Model**: claude-sonnet-4-5-20250929 (일반 게임)
  - **Opus Model**: claude-opus-4-1-20250805 (복잡한 게임 대안)
  - **Max Tokens**: 64,000 (Sonnet 4.5) / 32,000 (Opus 4.1) - **8배 증가!**
  - **Context Window**: 200K 토큰
  - **Temperature**: 0.3 (Sonnet) / 0.2 (Opus) - 일관성 강화
  - **Top-P**: 0.9 (품질 우선)
- **OpenAI Embeddings**: text-embedding-3-small - 문서 임베딩
- **Supabase Vector Store**: PostgreSQL + pgvector - 500+ 게임 개발 문서 검색
  - **Top-K**: 5 (3에서 증가)
  - **Similarity Threshold**: 0.7+
- **Socket.IO**: 실시간 진행률 트래킹 (5단계)
- **Langchain**: 고급 RAG 파이프라인
- **완벽 게임 패턴**: cake-delivery, shot-target 등 11개 검증된 게임 학습

### 아키텍처

#### 1. 대화형 생성 플로우 (4단계)
```
1. Initial (초기) → 게임 아이디어 입력
2. Details (상세) → 게임 장르, 테마 결정
3. Mechanics (메커닉) → 센서 조작 방식 정의
4. Confirmation (확인) → 최종 요구사항 검토
```

#### 2. RAG 시스템
```
사용자 입력
    ↓
OpenAI Embeddings (벡터화)
    ↓
Supabase Vector Search (game_knowledge 테이블)
    ↓
Top-K 관련 문서 검색 (k=3)
    ↓
Claude AI 프롬프트에 컨텍스트 추가
    ↓
게임 코드 생성
```

**임베딩 데이터**:
- 총 400개 문서 (35개 마크다운 파일을 청크로 분할)
- 게임 개발 가이드, API 레퍼런스, 예제 코드 포함
- 벡터 차원: 1536 (text-embedding-3-small)

#### 3. 5단계 실시간 진행률 트래킹

**백엔드 (InteractiveGameGenerator.js)**:
```javascript
// Step 1 (0-20%): 게임 아이디어 분석
this.io.emit('game-generation-progress', {
    sessionId, step: 1, percentage: 10,
    message: '게임 아이디어 분석 중...'
});

// Step 2 (20-40%): 벡터 DB 문서 검색
this.io.emit('game-generation-progress', {
    sessionId, step: 2, percentage: 20,
    message: '관련 문서 검색 중... (벡터 DB)'
});

// Step 3 (40-80%): Claude AI 코드 생성
this.io.emit('game-generation-progress', {
    sessionId, step: 3, percentage: 50,
    message: 'Claude AI로 게임 코드 생성 중...'
});

// Step 4 (80-90%): 코드 검증
this.io.emit('game-generation-progress', {
    sessionId, step: 4, percentage: 80,
    message: '게임 코드 검증 중...'
});

// Step 5 (90-100%): 파일 저장 및 등록
this.io.emit('game-generation-progress', {
    sessionId, step: 5, percentage: 100,
    message: '✅ 게임 생성 완료!'
});
```

**프론트엔드 (developerRoutes.js)**:
```javascript
const socket = io();

socket.on('game-generation-progress', (data) => {
    // 진행률 바 업데이트
    progressBar.style.width = data.percentage + '%';

    // 단계 아이콘 업데이트 (⏳ → ✅)
    updateProgressUI(data.step, data.percentage, data.message);
});
```

### 주요 파일 위치

#### 서버 코드
- `server/InteractiveGameGenerator.js:1-1400` - 핵심 생성 로직
  - `generateFinalGame()` (line 1027) - 5단계 진행 이벤트 발생
  - `getGameDevelopmentContext()` (line 1374) - RAG 문서 검색
  - `validateGameCode()` (line 1589) - 생성된 코드 검증

- `server/routes/developerRoutes.js:1-2300` - API 엔드포인트 및 UI
  - `/api/start-game-session` (line 123) - 세션 시작
  - `/api/game-chat` (line 128) - 대화 처리
  - `/api/finalize-game` (line 133) - 게임 생성 실행
  - `/api/download-game/:gameId` (line 138) - ZIP 다운로드

#### 프론트엔드
- 게임 생성기 UI (developerRoutes.js:1550-1767)
  - 대화형 채팅 인터페이스
  - 5단계 진행 모달 (line 1711-1743)
  - 결과 모달 및 다운로드 (line 1746-1766)

### 사용 방법

#### 1. 게임 생성
```
1. http://localhost:3000/developer 접속
2. "AI 게임 생성기" 탭 클릭
3. 게임 아이디어 입력 (예: "스마트폰을 기울여서 공을 굴리는 미로 게임")
4. AI와 대화하며 요구사항 구체화
5. "🚀 게임 생성 시작" 버튼 클릭
6. 5단계 진행 과정 실시간 확인 (약 30-60초 소요)
7. 생성 완료 후 "🎮 바로 플레이하기" 또는 "💾 게임 다운로드"
```

#### 2. 다운로드 및 설치
```
1. "💾 게임 다운로드" 클릭 → {gameId}.zip 다운로드
2. ZIP 파일 압축 해제
3. 압축 해제된 폴더를 `public/games/` 경로에 복사
4. GameScanner가 자동으로 게임 감지 및 등록
5. http://localhost:3000/games/{gameId} 접속하여 플레이
```

### 성능 및 제한사항

#### 생성 시간
- 평균: 30-60초
- 최소: 20초 (간단한 게임)
- 최대: 90초 (복잡한 게임)

#### 제한사항
- Claude API Rate Limit: 분당 50회 요청
- 최대 토큰: 4096 토큰 (약 3000단어)
- 지원 게임 타입: solo, dual, multi
- 센서: orientation (기울기), acceleration (가속도)

### 검증 시스템

생성된 게임 코드는 자동으로 다음 항목을 검증합니다:
- ✅ SessionSDK 통합 여부 (20점)
- ✅ 센서 데이터 처리 로직 존재 (25점)
- ✅ 게임 루프 구현 (update/render) (20점)
- ✅ Canvas 렌더링 (15점)
- ✅ 게임 상태 관리 (10점)
- ✅ 코드 품질 (오류 처리, 주석) (10점)

**최소 통과 점수**: 60/100

### 트러블슈팅

#### Vector DB 오류
```bash
# 증상: "match_documents 함수 없음" 오류
# 해결: queryName 제거 (2025-10-01 수정 완료)
this.vectorStore = new SupabaseVectorStore(this.embeddings, {
    client: this.supabaseClient,
    tableName: 'game_knowledge'
    // queryName 제거됨
});
```

#### 진행률 표시 안 됨
```bash
# 증상: 모달은 보이지만 진행률 업데이트 안 됨
# 해결: Socket.IO 연결 확인 (2025-10-01 추가 완료)
const socket = io();
socket.on('game-generation-progress', (data) => { ... });
```

#### 다운로드 파일 형식
```bash
# 변경: .html → .zip (2025-10-01 수정)
# 압축 내용: {gameId}/index.html, {gameId}/game.json
```

### 개선 이력

**2025-10-01 - AI 게임 생성기 대폭 개선**:
- ✅ Phase 1: Supabase Vector DB 수정 (`queryName` 제거)
- ✅ Phase 2: 실시간 진행률 트래킹 구현 (WebSocket 5단계 이벤트)
- ✅ Phase 3: ZIP 다운로드 안내 메시지 개선

상세 내역: `AI_GAME_GENERATOR_IMPROVEMENT_LOG.md` 참조

---

## 🚀 게임 생성 퀄리티 향상 프로젝트 (2025-10-02 업데이트)

### 📊 현재 문제점 및 새로운 솔루션

**기존 방식의 한계**:
- 단일 API 호출로 전체 게임 생성 → 버그 검증 불가
- 프롬프트에 버그 패턴 추가해도 AI가 무시 (80% 버그 발생률)
- 생성 후 유지보수 불가능

**새로운 아키텍처**: **Multi-Stage Generation with Automated Testing & Continuous Maintenance**

```
┌─────────────────────────────────────────────────────────────────┐
│              🎯 게임 퀄리티 향상 시스템 플로우                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│            1️⃣ Stage 1: Structure Generation                      │
│       HTML 뼈대 + SessionSDK 통합 + 캔버스 초기화                │
│       - StructureGenerator.js                                   │
│       - 기본 구조만 생성 (로직 없음)                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│            2️⃣ Stage 2: Game Logic Generation                     │
│       물리 + 충돌 감지 + 타이머 + 상태 관리                       │
│       - GameLogicGenerator.js                                   │
│       - 검증된 패턴 라이브러리 사용                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│            3️⃣ Stage 3: Automated Testing & Fix                   │
│       실제 브라우저 테스트 → 버그 감지 → 자동 수정               │
│       - GameCodeTester.js (Puppeteer 기반)                      │
│       - AutoFixer.js (Claude API로 버그 수정)                   │
│       - 최대 3회 재시도                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│            4️⃣ Continuous Maintenance ✅ 완료                     │
│       사용자 버그 리포트 → 챗봇 분석 → 자동 수정 → 재배포        │
│       - GameMaintenanceManager.js (429줄)                       │
│       - 5개 API 엔드포인트 추가                                  │
│       - 자동 버전 관리 및 백업 시스템                             │
└─────────────────────────────────────────────────────────────────┘
```

**Phase 4 완료 (2025-10-02 19:00)**:
- ✅ GameMaintenanceManager.js 구현
- ✅ 세션 유지 시스템 (30분 타임아웃)
- ✅ 버그 리포트 처리 (`POST /api/maintenance/report-bug`)
- ✅ 기능 추가 요청 (`POST /api/maintenance/add-feature`)
- ✅ 세션 정보 조회 (`GET /api/maintenance/session/:gameId`)
- ✅ 수정 이력 조회 (`GET /api/maintenance/history/:gameId`)
- ✅ 자동 버전 관리 (v1.0 → v1.1 → ...)
- ✅ 자동 백업 시스템

### 📋 핵심 컴포넌트

#### 1. Multi-Stage Generators
```javascript
// server/generators/StructureGenerator.js
class StructureGenerator {
    // HTML 뼈대, SessionSDK 통합, 캔버스 초기화만 생성
    async generate(requirements) { ... }
}

// server/generators/GameLogicGenerator.js
class GameLogicGenerator {
    // 검증된 게임 로직 패턴 라이브러리에서 조합
    async generate(requirements, structure) { ... }
}

// server/generators/IntegrationGenerator.js
class IntegrationGenerator {
    // Stage 1 + Stage 2 통합 + 센서 연결
    async integrate(structure, logic) { ... }
}
```

#### 2. Automated Testing System
```javascript
// server/GameCodeTester.js
class GameCodeTester {
    async testGame(gameHtml, gameId) {
        // Puppeteer로 실제 브라우저 테스트
        const results = {
            sdkConnection: true/false,      // SessionSDK 연결
            ballMovement: true/false,        // 공이 패들에서 떨어지는지
            timerWorking: true/false,        // 타이머 작동
            collisionDetection: true/false,  // 충돌 감지
            gameOverHandling: true/false     // 게임 오버 처리
        };
        return results;
    }
}

// server/AutoFixer.js
class AutoFixer {
    async fixBugs(gameHtml, testResults) {
        // 테스트 실패 항목 분석 → Claude API로 수정 → 재테스트
        // 최대 3회 반복
        return { success, fixedHtml, attempts };
    }
}
```

#### 3. Continuous Maintenance System
```javascript
// 생성 후에도 세션 유지 → 대화 계속 가능
activeSessions.set(gameId, {
    requirements,
    conversationHistory,
    generatedCode,
    testResults
});

// 버그 리포트 API
POST /api/report-bug
{
    gameId: "game-123",
    userReport: "공이 패들에 붙어있어요"
}
→ Claude API 분석 → 버그 찾기 → 수정 → 자동 배포

// 기능 추가 API
POST /api/add-feature
{
    gameId: "game-123",
    feature: "파워업 아이템 추가"
}
→ 기존 코드 분석 → 증분 업데이트 → 테스트 → 배포
```

### 🎨 사용자 친화적 UI 개선

#### 상세 진행률 표시
```
기존: [====>    ] 50% - 게임 코드 생성 중...

신규:
┌─────────────────────────────────────────────┐
│  1️⃣ 게임 구조 생성          ✅ 완료        │
│     └─ SessionSDK 통합       ✅             │
│     └─ 캔버스 초기화         ✅             │
│                                             │
│  2️⃣ 게임 로직 생성          🔄 진행 중     │
│     └─ 물리 시뮬레이션       ✅             │
│     └─ 충돌 감지             🔄 45%         │
│     └─ 타이머 시스템         ⏳ 대기        │
│                                             │
│  3️⃣ 자동 테스트             ⏳ 대기        │
│  4️⃣ 버그 수정               ⏳ 대기        │
│  5️⃣ 최종 배포               ⏳ 대기        │
└─────────────────────────────────────────────┘
```

#### 테스트 결과 시각화
```
┌─────────────────────────────────────────────┐
│          🧪 게임 테스트 결과                 │
├─────────────────────────────────────────────┤
│  ✅ SessionSDK 연결           통과          │
│  ✅ 세션 코드 생성             통과          │
│  ❌ 공 이동 로직               실패          │
│     └─ 문제: 공이 패들에 붙어있음            │
│     └─ 수정: gameStarted 플래그 추가         │
│  ✅ 타이머 작동               통과          │
│  ✅ 충돌 감지                 통과          │
├─────────────────────────────────────────────┤
│  총점: 80/100 (B 등급)                      │
│  🔧 1개 버그 자동 수정됨                    │
└─────────────────────────────────────────────┘
```

#### 유지보수 인터페이스
```
┌─────────────────────────────────────────────┐
│          🔧 게임 유지보수 패널               │
├─────────────────────────────────────────────┤
│  [버그 리포트] [기능 추가] [수정 이력]       │
│                                             │
│  💬 버그를 발견하셨나요?                     │
│  ┌─────────────────────────────────────┐   │
│  │ 공이 패들에서 떨어지지 않아요          │   │
│  └─────────────────────────────────────┘   │
│  [🔍 분석 및 수정]                          │
│                                             │
│  ✅ 최근 수정 (v1.1)                        │
│  └─ 공 이동 로직 버그 수정                  │
│     2025-10-02 15:30                       │
└─────────────────────────────────────────────┘
```

### 📈 예상 성과

| 지표 | 기존 | 개선 후 | 향상률 |
|------|------|---------|--------|
| 버그 발생률 | 80% | 10% | **-87.5%** |
| 게임 품질 점수 | 45/100 | 85/100 | **+88.9%** |
| 생성 성공률 | 60% | 95% | **+58.3%** |
| 유지보수 가능 | ❌ | ✅ | **새 기능** |

### 📁 새로운 파일 구조

```
server/
├── generators/                    # 신규: 단계별 생성기
│   ├── StructureGenerator.js      # Stage 1: 구조 생성
│   ├── GameLogicGenerator.js      # Stage 2: 로직 생성
│   └── IntegrationGenerator.js    # Stage 3: 통합
├── GameCodeTester.js              # 신규: 자동 테스트
├── AutoFixer.js                   # 신규: 자동 버그 수정
└── InteractiveGameGenerator.js    # 기존: 메인 생성기 (개선)
```

### 🔗 관련 문서

**상세 구현 계획**: `GAME_QUALITY_IMPROVEMENT.md`
- Phase별 체크리스트
- 기술 스펙
- 테스트 케이스
- UI 개선 사항

**작업 시 주의사항**:
1. **항상 `GAME_QUALITY_IMPROVEMENT.md` 참조하며 작업**
2. **각 Phase 완료 시 문서 업데이트**
3. **체크박스로 진행 상황 추적**
4. **버그 패턴 발견 시 문서에 추가**

---

**Sensor Game Hub v6.0** - 모바일 센서로 새로운 게임 경험을 만나보세요! 🎮✨