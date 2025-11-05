# Sensor Game Hub v6.1 - AI 개발자 가이드

> AI 기반 모바일 센서 게임 생성 및 플레이 플랫폼
>
> 최종 업데이트: 2025-10-17 | 버전: v6.1.0

---

## 프로젝트 정보

- **경로**: `/Users/dev/졸업작품/sensorchatbot`
- **Supabase ID**: `rwkgktwdljsddowcxphc`
- **기술 스택**: Node.js, Express, Socket.IO, Claude Sonnet 4.5, OpenAI Embeddings, Supabase

---

## 최신 업데이트

### 권한 관리 시스템 (2025-10-17)
- `generated_games` 테이블에 `creator_id` 컬럼 추가
- RLS 정책 구현: admin@admin.com 전체 권한, 일반 사용자는 본인 게임만 접근
- `checkGameOwnership` 미들웨어 추가 (authMiddleware.js:167-217)
- UI 권한 배지: 👑 관리자, ✓ 내 게임, 🔒 읽기 전용
- 토큰 키 통일: `authToken` (camelCase)

### 유지보수 시스템 통합 (2025-10-11)
- InteractiveGameGenerator ↔ GameMaintenanceManager 자동 연동
- 게임 생성 시 v1.0 자동 등록, 버그 수정/기능 추가 시 자동 버전 증가
- DB 영구 저장으로 서버 재시작 후에도 버전 유지

### Interactive Game Generator UI 개선 (2025-10-30)

**⚠️ 중요**: `/interactive-game-generator`는 현재 유일하게 사용 중인 게임 생성기입니다. 절대 수정하지 마세요!

**실제 구현 위치:**
- **라우트**: `/interactive-game-generator` (server/index.js:155-157)
- **구현 메서드**: `generateStandaloneGameGeneratorPage()` (server/index.js:2401+)
- **주의**: `public/` 디렉토리의 HTML 파일이 아닌, 동적으로 생성되는 페이지입니다

**최근 UI 개선 사항:**
1. **멀티라인 입력창** (server/index.js:2981-2986)
   - `<input type="text">` → `<textarea rows="2">` 변경
   - 최소 높이 60px, 최대 높이 150px
   - 자동 크기 조절 (scrollHeight 기반, lines 3452-3455)
   - 텍스트가 길어지면 자동으로 줄바꿈

2. **로딩 인디케이터** (server/index.js:3199-3216)
   - AI 응답 생성 중 "🤖 AI가 응답을 생성하고 있습니다..." 메시지 표시
   - 애니메이션 점(dots) 효과
   - `addLoadingMessage()`, `removeLoadingMessage()` 함수 구현
   - sendGeneratorMessage() 함수에 통합 (lines 3238, 3259, 3289, 3309)

3. **CSS 개선** (server/index.js:2688-2702)
   - `resize: none`, `line-height: 1.5`
   - `overflow-y: auto` (스크롤 지원)
   - 일관된 폰트 패밀리 적용

**삭제된 레거시 파일 (사용하지 않음):**
- ❌ `public/ai-game-generator.html` - 구버전
- ❌ `public/interactive-game-generator-legacy.html` - 백업 버전
- ❌ `public/interactive-game-generator.html` - 미사용 정적 파일
- ❌ Routes (server/index.js:145-147, 150-152) - 레거시 라우트

**작업 시 주의사항:**
- interactive-game-generator 관련 작업은 반드시 `server/index.js`의 `generateStandaloneGameGeneratorPage()` 메서드를 수정해야 함
- `public/` 디렉토리의 HTML 파일은 실제로 서빙되지 않음
- 모든 기능이 유지되어야 함 (세션 관리, 대화형 생성, 진행률 표시 등)
- URL: https://sensorchatbot.onrender.com/interactive-game-generator

---

## 핵심 파일 구조

```
sensorchatbot/
├── server/
│   ├── index.js                      # 메인 서버 (755줄)
│   ├── InteractiveGameGenerator.js  # AI 게임 생성기 (1400줄)
│   ├── GameMaintenanceManager.js    # 유지보수 시스템 (680줄)
│   ├── SessionManager.js             # 세션 관리
│   ├── GameScanner.js                # 게임 스캔
│   ├── GameValidator.js              # 코드 검증
│   ├── AIAssistant.js               # AI 어시스턴트
│   ├── routes/
│   │   ├── developerRoutes.js        # 개발자 센터
│   │   └── authRoutes.js             # 인증
│   └── middleware/
│       └── authMiddleware.js         # 권한 검증
│
├── public/
│   ├── js/SessionSDK.js              # 통합 SDK (590줄)
│   ├── games/                        # 19개 게임
│   └── sensor.html                   # 센서 클라이언트
│
├── docs/                             # 문서 시스템 (28개 파일)
└── GAME_TEMPLATE.html                # 게임 템플릿
```

---

## 핵심 시스템

### 1. AI 게임 생성기 (InteractiveGameGenerator)

**5단계 생성 프로세스:**
1. 게임 아이디어 분석 (0-20%)
2. RAG 문서 검색 - Top-5 유사 문서 (20-40%)
3. Claude AI 코드 생성 - 64K 토큰 (40-80%)
4. 코드 검증 - 최소 95점 (80-90%)
5. 파일 저장 및 등록 (90-100%)

**설정:**
```javascript
{
  claudeModel: 'claude-sonnet-4-5-20250929',  // 64K 토큰
  ragTopK: 5,
  ragSimilarityThreshold: 0.7,
  minQualityScore: 95
}
```

### 2. 유지보수 시스템 (GameMaintenanceManager)

**버그 수정 플로우:**
```
현재 코드 읽기 → Claude AI 분석/수정 → 버전 백업 →
수정 코드 저장 → 버전 증가 (v1.0 → v1.1) → DB 저장
```

**기능 추가 플로우:**
```
현재 코드 읽기 → Claude AI 증분 업데이트 → 백업 →
저장 → 버전 증가 (v1.1 → v1.2) → DB 저장
```

### 3. SessionSDK (통합 SDK)

**3개 주요 클래스:**
- `SessionSDK`: 세션 관리, WebSocket 통신
- `QRCodeGenerator`: QR 코드 생성 (폴백 지원)
- `SensorCollector`: 센서 데이터 수집 (50ms 간격)

---

## 필수 개발 패턴

### SessionSDK 통합

```javascript
const sdk = new SessionSDK({
    gameId: 'my-game',
    gameType: 'solo',  // 'solo', 'dual', 'multi'
    debug: true
});

// 서버 연결 완료 후 세션 생성 (필수!)
sdk.on('connected', async () => {
    const session = await sdk.createSession();

    // QR 코드 생성
    const qrCode = await QRCodeGenerator.generateElement(
        `${window.location.origin}/sensor.html?code=${session.sessionCode}`,
        200
    );
    document.getElementById('qr-container').appendChild(qrCode);
});

// CustomEvent 처리 (필수 패턴!)
sdk.on('session-created', (event) => {
    const session = event.detail || event;  // ✅
    console.log('세션 코드:', session.sessionCode);
});

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;  // ✅
    // 센서 데이터 처리
});
```

### 센서 데이터 처리

```javascript
function processSensorData(sensorData) {
    const { data } = sensorData;

    // 방향 센서 (기울기)
    const tiltX = data.orientation.gamma;   // -90 ~ 90
    const tiltY = data.orientation.beta;    // -180 ~ 180

    // 가속도 센서
    const accelX = data.acceleration.x;

    // 게임 로직 적용
    ball.dx = tiltX / 10;
    ball.dy = tiltY / 10;
}
```

---

## API 엔드포인트

### 게임 관리
- `GET /api/games` - 게임 목록 + 버전 + creator_id
- `GET /api/games/:gameId` - 게임 상세 정보
- `GET /api/stats` - 서버 통계

### AI 게임 생성
- `POST /api/start-game-session` - 세션 시작
- `POST /api/game-chat` - 대화형 생성
- `POST /api/finalize-game` - 게임 완성

### 유지보수
- `POST /api/maintenance/report-bug` - 버그 수정 (권한 검증)
- `POST /api/maintenance/add-feature` - 기능 추가 (권한 검증)
- `GET /api/maintenance/version/:gameId` - 버전 정보

### 인증
- `POST /api/auth/login` - 로그인
- `GET /api/auth/user` - 사용자 정보

### WebSocket 이벤트
**클라이언트 → 서버:** `create-session`, `connect-sensor`, `sensor-data`
**서버 → 클라이언트:** `session-created`, `sensor-connected`, `sensor-update`, `game-generation-progress`

---

## 환경 변수

`.env` 파일:
```bash
CLAUDE_API_KEY=sk-ant-api03-xxxxx
OPENAI_API_KEY=sk-xxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
PORT=3000
```

---

## 실행 가이드

```bash
# 서버 시작
cd /Users/dev/졸업작품/sensorchatbot
npm install
npm start

# 접속
http://localhost:3000              # 게임 허브
http://localhost:3000/developer    # 개발자 센터
http://localhost:3000/sensor.html  # 센서 클라이언트
```

---

## 자주 발생하는 문제

### 1. "서버에 연결되지 않았습니다"
**원인:** `connected` 이벤트 대기 없이 `createSession()` 호출
**해결:** `sdk.on('connected', () => { sdk.createSession(); })`

### 2. 세션 코드가 undefined
**원인:** CustomEvent 처리 누락
**해결:** `const session = event.detail || event;`

### 3. 센서 데이터 전달 안됨
**원인:** iOS 13+ 권한 요청 누락
**해결:** `DeviceMotionEvent.requestPermission()` 호출

---

## Supabase 데이터베이스

### generated_games 테이블
```sql
game_id TEXT PRIMARY KEY,
title TEXT,
description TEXT,
game_type TEXT,
creator_id UUID REFERENCES auth.users(id),  -- 2025-10-17 추가
metadata JSONB,
created_at TIMESTAMPTZ,
updated_at TIMESTAMPTZ
```

### game_versions 테이블
```sql
id BIGSERIAL PRIMARY KEY,
game_id TEXT UNIQUE NOT NULL,
current_version TEXT NOT NULL,
modifications JSONB,
created_at TIMESTAMPTZ,
updated_at TIMESTAMPTZ
```

### RLS 정책
- SELECT: 모든 사용자 읽기 가능
- INSERT: 인증된 사용자, creator_id 검증
- UPDATE/DELETE: 본인 또는 admin@admin.com만 가능

---

## 중요 수정 이력

### 2025-10-17: 권한 관리 시스템
1. `supabase/migrations/add_creator_id_to_generated_games.sql`
2. `server/middleware/authMiddleware.js` - checkGameOwnership (Line 167-217)
3. `server/index.js` - creator_id 저장 및 조회
4. `server/routes/developerRoutes.js` - 토큰 키 통일, 권한 배지

### 2025-10-11: 유지보수 통합
1. `server/index.js` - /api/games 비동기, DB 버전 조회
2. `server/InteractiveGameGenerator.js` - 자동 세션 등록
3. `server/routes/developerRoutes.js` - API 파라미터 수정

---

## Git 작업 규칙

**사용자가 직접 commit/push 수행. AI는 git 작업 금지.**

---

**Sensor Game Hub v6.1** - AI로 게임을 만들고, 센서로 즐기세요!

관련 문서: [README.md](README.md) | [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | [docs/](docs/)
