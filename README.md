# 🎮 Sensor Game Hub v6.0

> **AI 기반 모바일 센서 게임 생성 및 플레이 플랫폼**
>
> 자연어 아이디어만 입력하면 30-60초 내에 완성된 센서 게임이 생성됩니다.

[![Version](https://img.shields.io/badge/version-6.0.0-blue.svg)](https://github.com/yourusername/sensorchatbot)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)

---

## 📍 목차

- [프로젝트 개요](#-프로젝트-개요)
- [핵심 기능](#-핵심-기능)
- [완전한 게임 컬렉션](#-완전한-게임-컬렉션)
- [시스템 아키텍처](#-시스템-아키텍처)
- [빠른 시작](#-빠른-시작)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [API 문서](#-api-문서)
- [개발자 가이드](#-개발자-가이드)
- [문서 시스템](#-문서-시스템)
- [라이선스](#-라이선스)

---

## 🎯 프로젝트 개요

**Sensor Game Hub v6.0**은 모바일 센서(가속도계, 자이로스코프, 방향 센서)를 활용한 게임을 **AI가 자동으로 생성**하고, **QR 코드로 즉시 플레이**할 수 있는 혁신적인 플랫폼입니다.

### 핵심 가치 제안

| 항목 | 기존 방식 | Sensor Game Hub |
|------|-----------|-----------------|
| **게임 개발 시간** | 수주 ~ 수개월 | **30-60초** |
| **필요한 기술** | 웹/모바일 개발 전문 지식 | **자연어만 입력** |
| **유지보수** | 수동 코드 수정 | **AI 자동 수정** |
| **플레이 방법** | 앱 설치 필요 | **QR 코드 스캔** |

### 프로젝트 특징

✨ **대화형 AI 게임 생성**
- Claude Sonnet 4.5 (64K 토큰) 기반
- RAG 시스템으로 400개 문서 참조
- 5단계 실시간 진행률 표시
- 95점 이상 자동 품질 검증

🎮 **즉시 플레이 가능**
- QR 코드 스캔으로 모바일 연결
- WebSocket 기반 50ms 고속 센서 전송
- 별도 앱 설치 불필요

🔧 **자동 유지보수 시스템**
- 버그 리포트 → AI 분석 → 자동 수정
- 기능 추가 요청 → 증분 업데이트
- 자동 버전 관리 및 백업

---

## 🌟 핵심 기능

### 1. 🤖 AI 게임 생성기 (InteractiveGameGenerator)

**대화형 게임 생성 플로우:**

```
사용자 아이디어
    ↓
AI 분석 및 요구사항 명확화
    ↓
RAG 문서 검색 (400개 문서)
    ↓
Claude Sonnet 4.5 코드 생성 (64K 토큰)
    ↓
품질 검증 (95점 이상)
    ↓
완성된 게임 배포
    ↓
QR 코드로 즉시 플레이
```

**5단계 실시간 진행률:**
1. **게임 아이디어 분석** (0-20%)
2. **벡터 DB 문서 검색** (20-40%)
3. **Claude AI 코드 생성** (40-80%)
4. **코드 검증** (80-90%)
5. **파일 저장 및 등록** (90-100%)

### 2. 📱 통합 센서 클라이언트 (SessionSDK)

**SessionSDK**를 통한 완벽한 센서 통합:
- **모든 게임 지원**: 하나의 센서 클라이언트로 모든 게임 타입 지원
- **자동 센서 감지**: iOS/Android 센서 자동 감지 및 권한 처리
- **실시간 데이터 전송**: 50ms 간격 고속 센서 데이터 전송
- **자동 재연결**: 네트워크 끊김 시 자동 복구

**센서 데이터 구조:**
```javascript
{
  sensorId: "sensor_001",
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

### 3. 🔧 게임 유지보수 시스템 (GameMaintenanceManager)

생성 후에도 지속적인 개선이 가능한 시스템:

**버그 수정 플로우:**
```
사용자 버그 리포트
  → Claude AI 분석
  → 원인 파악
  → 코드 수정
  → 자동 백업
  → 재배포
  → 버전 증가 (v1.0 → v1.1)
```

**기능 추가 플로우:**
```
기능 요청
  → 기존 코드 분석
  → 호환성 검토
  → 증분 업데이트
  → 테스트
  → 배포
```

---

## 🎮 완전한 게임 컬렉션

현재 **19개의 센서 게임**이 플레이 가능합니다:

### ⭐ 검증된 완성 게임 (5개)

| 게임 | 타입 | 설명 | 특징 |
|------|------|------|------|
| **Cake Delivery** | Solo | 케이크를 배달하는 밸런스 게임 | 복잡한 물리 엔진, 애니메이션 |
| **Shot Target** | Solo | 타겟을 조준하여 맞추는 슈팅 게임 | 정밀한 센서 제어, 스코어 시스템 |
| **Acorn Battle** | Multi | 도토리를 수집하는 대전 게임 | 멀티플레이어, 실시간 리더보드 |
| **Rhythm Blade** | Solo | 리듬에 맞춰 검을 휘두르는 게임 | 타이밍 시스템, 콤보 |
| **Telephone** | Dual | 두 개 센서로 협력하는 통신 게임 | 협동 플레이, 동기화 |

### 🎯 기본 게임 템플릿 (3개)

| 게임 | 타입 | 설명 |
|------|------|------|
| **Solo** | Solo | 1개 센서로 플레이하는 기본 공 조작 게임 |
| **Dual** | Dual | 2개 센서로 협력하는 미션 게임 |
| **Multi** | Multi | 최대 10명까지 동시 플레이하는 경쟁 게임 |

### 🔬 실험적 게임 (2개)

| 게임 | 타입 | 설명 |
|------|------|------|
| **Quick Draw** | Solo | 빠른 반응 속도 게임 |
| **Tilt Breaker** | Solo | 기울기 기반 블록 깨기 게임 |

### 🤖 AI 생성 게임 (9개)

최근 AI 게임 생성기로 만들어진 게임들:

1. **Gravity Ball 671102** - 중력 조작 게임
2. **Gravity Ball Sensor Game** - 센서 기반 중력 게임
3. **센서 볼 게임 084905** - 한글 센서 게임 실험
4. **센서 볼 게임 767063** - 한글 센서 게임 실험
5. **Undefined 517998** - 테스트 게임
6. **Undefined Sensor Game** - 테스트 게임
7-9. *기타 실험적 게임들*

> **참고**: AI 생성 게임은 지속적으로 개선되며, 품질이 검증되면 공식 게임으로 승격됩니다.

---

## 🏗️ 시스템 아키텍처

### 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    🌐 웹 인터페이스                           │
├─────────────────────────────────────────────────────────────┤
│  📱 사용자                  │  👨‍💻 개발자 센터               │
│  - 게임 허브 (/)            │  - AI 게임 생성기             │
│  - 게임 플레이              │  - 게임 관리                  │
│  - 센서 연결                │  - 유지보수 도구              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                🚀 Express + Socket.IO Server                 │
├─────────────────────────────────────────────────────────────┤
│  📡 WebSocket 실시간 통신   │  🔌 REST API                  │
│  - 세션 관리                │  - 게임 목록 조회             │
│  - 센서 데이터 전송         │  - 통계 API                   │
│  - 게임 상태 동기화         │  - 관리 API                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    🤖 AI 시스템 레이어                        │
├─────────────────────────────────────────────────────────────┤
│  InteractiveGameGenerator  │  GameMaintenanceManager        │
│  - Claude Sonnet 4.5       │  - 버그 자동 수정              │
│  - RAG (400개 문서)        │  - 기능 추가                   │
│  - 실시간 진행률           │  - 버전 관리                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    💾 데이터 레이어                           │
├─────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL)     │  파일 시스템                   │
│  - Vector Store (RAG)      │  - 게임 파일 (19개)           │
│  - 게임 버전 정보          │  - 백업 (자동)                │
│  - 임베딩 데이터           │  - 문서 (docs/)               │
└─────────────────────────────────────────────────────────────┘
```

### 핵심 모듈

#### 1. **SessionManager** (세션 관리)
- 4자리 세션 코드 생성 및 관리
- 게임-센서 연결 매칭
- 자동 세션 정리 (비활성 세션 제거)

#### 2. **GameScanner** (게임 자동 스캔)
- `public/games/` 디렉토리 자동 스캔
- `game.json` 메타데이터 파싱
- 게임 목록 실시간 업데이트

#### 3. **InteractiveGameGenerator** (AI 게임 생성)
- 대화형 요구사항 수집 (4단계)
- Claude API 호출 (64K 토큰)
- RAG 시스템으로 관련 문서 검색
- 실시간 진행률 WebSocket 전송

#### 4. **GameMaintenanceManager** (유지보수)
- 세션 기반 게임 추적 (30분 타임아웃)
- 버그 리포트 자동 분석 및 수정
- 기능 추가 요청 처리
- 자동 버전 증가 및 백업

---

## 🚀 빠른 시작

### 1. 사전 요구사항

- **Node.js**: 16.0.0 이상
- **npm**: 7.0.0 이상
- **환경 변수**: 아래 API 키 필요

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하세요:

```bash
# Claude AI (필수)
CLAUDE_API_KEY=sk-ant-api03-xxxxx

# OpenAI Embeddings (RAG 시스템용, 필수)
OPENAI_API_KEY=sk-xxxxx

# Supabase (RAG Vector Store용, 필수)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 서버 설정 (선택)
PORT=3000
```

> **참고**: `.env.example` 파일을 복사하여 시작하세요.

### 3. 설치 및 실행

```bash
# 1. 의존성 설치
npm install

# 2. 서버 시작
npm start

# 개발 모드 (동일)
npm run dev
```

### 4. 접속

서버가 시작되면 다음 URL로 접속할 수 있습니다:

| URL | 설명 |
|-----|------|
| http://localhost:3000 | 📱 **게임 허브** - 모든 게임 목록 |
| http://localhost:3000/developer | 👨‍💻 **개발자 센터** - AI 게임 생성기 |
| http://localhost:3000/sensor.html | 📡 **센서 클라이언트** - 모바일 연결 |
| http://localhost:3000/games/cake-delivery | 🎮 **특정 게임** - 케이크 배달 게임 예시 |

### 5. 게임 플레이 방법

#### PC에서 게임 시작:
1. http://localhost:3000 접속
2. 원하는 게임 클릭
3. 화면에 **4자리 세션 코드**와 **QR 코드** 표시

#### 모바일에서 센서 연결:
1. QR 코드 스캔 또는 http://localhost:3000/sensor.html 접속
2. 4자리 세션 코드 입력
3. 센서 권한 허용
4. 자동으로 게임 시작!

#### 게임 조작:
- **기울이기**: 공의 움직임 제어
- **회전**: 추가 제어 입력
- **가속도**: 특별한 액션 트리거

---

## 🔧 기술 스택

### Backend

| 기술 | 버전 | 용도 |
|------|------|------|
| **Node.js** | 16.0.0+ | 서버 런타임 |
| **Express** | 4.18.2 | HTTP 서버 |
| **Socket.IO** | 4.7.2 | WebSocket 실시간 통신 |
| **Helmet** | 7.0.0 | 보안 헤더 |
| **Compression** | 1.7.4 | Gzip 압축 |
| **CORS** | 2.8.5 | CORS 처리 |

### AI & RAG

| 기술 | 버전 | 용도 |
|------|------|------|
| **Anthropic SDK** | 0.30.1 | Claude API 호출 |
| **Langchain** | 0.3.7 | RAG 파이프라인 |
| **OpenAI** | 4.71.1 | Embeddings 생성 |
| **Supabase Client** | 2.58.0 | Vector Store |

**AI 모델 상세:**
- **Primary Model**: `claude-sonnet-4-5-20250929` (64K 토큰)
- **Alternative Model**: `claude-opus-4-1-20250805` (32K 토큰)
- **Embeddings**: `text-embedding-3-small` (1536 차원)
- **Temperature**: 0.3 (일관성 강화)
- **Top-P**: 0.9 (품질 우선)

### Frontend

| 기술 | 용도 |
|------|------|
| **HTML5 Canvas** | 게임 렌더링 |
| **Vanilla JavaScript ES6+** | 클라이언트 로직 |
| **Socket.IO Client** | WebSocket 통신 |
| **DeviceMotion API** | 센서 데이터 수집 |
| **DeviceOrientation API** | 방향 센서 |

### Utilities

| 기술 | 버전 | 용도 |
|------|------|------|
| **Archiver** | 7.0.1 | ZIP 파일 생성 |
| **JSDOM** | 26.1.0 | HTML 파싱 |
| **Marked** | 15.0.12 | Markdown 변환 |
| **Highlight.js** | 11.11.1 | 코드 하이라이팅 |

---

## 📂 프로젝트 구조

```
sensorchatbot/
├── server/                     # 서버 코드 (Node.js)
│   ├── index.js                # 🚀 메인 서버 (111KB, 755줄)
│   ├── SessionManager.js       # 세션 관리 시스템
│   ├── GameScanner.js          # 게임 자동 스캔
│   ├── InteractiveGameGenerator.js  # 🤖 AI 게임 생성기 (121KB)
│   ├── GameMaintenanceManager.js    # 🔧 유지보수 시스템 (23KB)
│   ├── DocumentEmbedder.js     # RAG 임베딩 시스템
│   ├── GameValidator.js        # 게임 코드 검증
│   ├── GameGenreClassifier.js  # 장르 분류
│   ├── RequirementCollector.js # 요구사항 수집
│   ├── PerformanceMonitor.js   # 성능 모니터링
│   ├── routes/                 # API 라우트
│   │   ├── developerRoutes.js  # 개발자 센터 (82KB)
│   │   ├── gameRoutes.js       # 게임 API
│   │   ├── landingRoutes.js    # 랜딩 페이지
│   │   ├── performanceRoutes.js # 성능 모니터링
│   │   └── testRoutes.js       # 테스트 API
│   ├── generators/             # 코드 생성기
│   │   ├── StructureGenerator.js
│   │   ├── GameLogicGenerator.js
│   │   └── IntegrationGenerator.js
│   ├── services/               # 비즈니스 로직
│   ├── utils/                  # 유틸리티
│   └── [기타 34개 파일]
├── public/                     # 클라이언트 파일
│   ├── js/
│   │   └── SessionSDK.js       # 🔧 통합 SDK (590줄)
│   ├── games/                  # 🎮 19개 게임
│   │   ├── cake-delivery/      # 케이크 배달 (검증됨)
│   │   ├── shot-target/        # 타겟 슈팅 (검증됨)
│   │   ├── acorn-battle/       # 도토리 배틀 (검증됨)
│   │   ├── rhythm-blade/       # 리듬 블레이드 (검증됨)
│   │   ├── telephone/          # 전화 게임 (검증됨)
│   │   ├── solo/               # 기본 솔로 게임
│   │   ├── dual/               # 기본 듀얼 게임
│   │   ├── multi/              # 기본 멀티 게임
│   │   ├── quick-draw/         # 퀵 드로우
│   │   ├── tilt-breaker-sensor-game/ # 틸트 브레이커
│   │   └── [AI 생성 게임 9개]
│   ├── sensor.html             # 📡 센서 클라이언트
│   ├── ai-game-generator.html  # (레거시)
│   └── interactive-game-generator.html # (레거시)
├── docs/                       # 📚 완전한 문서 시스템
│   ├── 개발자_온보딩_가이드.md (425KB)
│   ├── 프로젝트_설계_명세서_draft.md
│   ├── 프로젝트_part1.md ~ part10.md
│   ├── examples/               # 예제 코드
│   ├── game-development/       # 게임 개발 가이드
│   ├── sensor-processing/      # 센서 처리 가이드
│   ├── troubleshooting/        # 문제 해결
│   └── [기타 20개 문서]
├── package.json                # 의존성 및 프로젝트 설정
├── .env.example                # 환경 변수 예제
├── README.md                   # 이 파일 (사용자 가이드)
├── CLAUDE.md                   # AI 개발자 전문 가이드
└── [기타 문서 15개]
```

---

## 📡 API 문서

### HTTP API

#### 게임 관리

```http
GET /api/games
```
**응답:**
```json
{
  "success": true,
  "games": [
    {
      "id": "cake-delivery",
      "title": "Cake Delivery",
      "description": "케이크를 배달하는 밸런스 게임",
      "gameType": "solo",
      "verified": true
    }
  ],
  "count": 19
}
```

```http
GET /api/stats
```
**응답:**
```json
{
  "success": true,
  "stats": {
    "totalGames": 19,
    "activeSessions": 3,
    "totalPlayers": 12,
    "uptime": 3600
  }
}
```

### WebSocket Events

#### 클라이언트 → 서버

| 이벤트 | 데이터 | 설명 |
|--------|--------|------|
| `create-session` | `{ gameId, gameType }` | 게임 세션 생성 |
| `connect-sensor` | `{ sessionCode, deviceInfo }` | 센서 클라이언트 연결 |
| `sensor-data` | `{ sessionCode, sensorId, sensorData }` | 센서 데이터 전송 |
| `start-game` | `{ sessionId }` | 게임 시작 요청 |

#### 서버 → 클라이언트

| 이벤트 | 데이터 | 설명 |
|--------|--------|------|
| `session-created` | `{ sessionId, sessionCode, gameType }` | 세션 생성 완료 |
| `sensor-connected` | `{ sensorId, sessionId }` | 센서 연결됨 |
| `sensor-update` | `{ sensorId, data, timestamp }` | 센서 데이터 업데이트 |
| `game-started` | `{ sessionId, startTime }` | 게임 시작됨 |
| `game-generation-progress` | `{ step, percentage, message }` | AI 게임 생성 진행률 |

---

## 👨‍💻 개발자 가이드

### 새 게임 추가하기

#### 1. 수동으로 게임 추가

```bash
# 1. 게임 폴더 생성
mkdir -p public/games/my-new-game

# 2. index.html 작성 (GAME_TEMPLATE.html 참고)
cp GAME_TEMPLATE.html public/games/my-new-game/index.html

# 3. game.json 메타데이터 작성
cat > public/games/my-new-game/game.json << EOF
{
  "title": "My New Game",
  "description": "게임 설명",
  "gameType": "solo",
  "version": "1.0",
  "author": "Your Name"
}
EOF

# 4. 서버 재시작 (자동 스캔)
npm start
```

#### 2. AI로 게임 생성

```bash
# 1. http://localhost:3000/developer 접속
# 2. "AI 게임 생성기" 탭 클릭
# 3. 자연어로 게임 아이디어 입력:
#    예: "중력을 조작하여 공을 골대까지 유도하는 게임"
# 4. AI와 대화하며 요구사항 구체화
# 5. "게임 생성 시작" 버튼 클릭
# 6. 30-60초 후 완성!
```

### SessionSDK 사용법

```javascript
// 1. SDK 초기화
const sdk = new SessionSDK({
    gameId: 'my-game',
    gameType: 'solo',  // 'solo', 'dual', 'multi'
    debug: true
});

// 2. 서버 연결 대기
sdk.on('connected', async () => {
    console.log('서버 연결됨');

    // 3. 세션 생성
    const session = await sdk.createSession();
    console.log('세션 코드:', session.sessionCode);

    // 4. QR 코드 생성
    const qrCode = await QRCodeGenerator.generateElement(
        `http://localhost:3000/sensor.html?code=${session.sessionCode}`,
        200
    );
    document.body.appendChild(qrCode);
});

// 5. 센서 데이터 수신
sdk.on('sensor-data', (event) => {
    const data = event.detail || event;  // ✅ 반드시 이 패턴!

    // 센서 데이터 처리
    processSensorData(data);
});
```

---

## 📚 문서 시스템

이 프로젝트는 완전한 문서 시스템을 갖추고 있습니다:

### 사용자용 문서
- **README.md** (이 파일): 빠른 시작 가이드
- **docs/개발자_온보딩_가이드.md**: 신규 개발자 온보딩 (425KB)
- **docs/프로젝트_설계_명세서_draft.md**: 전체 시스템 설계

### 개발자용 문서
- **CLAUDE.md**: AI 개발자 전문 가이드 (프로젝트 내부 구조)
- **DEVELOPER_GUIDE.md**: 게임 개발 가이드
- **docs/examples/**: 예제 코드 모음
- **docs/troubleshooting/**: 문제 해결 가이드

### 기술 문서
- **AI_GAME_GENERATOR_V3_EXTREME.md**: AI 생성 시스템 상세
- **GAME_QUALITY_IMPROVEMENT.md**: 품질 향상 계획
- **TOKEN_LIMIT_SOLUTION.md**: 토큰 제한 해결책
- **docs/프로젝트_part1.md ~ part10.md**: 10개 파트 상세 문서

---

## 🐛 트러블슈팅

### 일반적인 문제

#### 1. 서버가 시작되지 않음
```bash
# 포트 충돌 확인
lsof -i :3000
kill -9 [PID]

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

#### 2. 센서가 연결되지 않음
- **iOS 13+**: 센서 권한 요청 필요
- **HTTPS 필요**: iOS는 HTTPS에서만 센서 동작 (로컬은 예외)
- **브라우저 호환성**: Safari, Chrome 최신 버전 권장

#### 3. AI 게임 생성 실패
```bash
# 1. API 키 확인
echo $CLAUDE_API_KEY
echo $OPENAI_API_KEY

# 2. 재시도 (일시적 API 오류 가능)
```

---

## 📈 향후 계획

### v6.1 (단기)
- [ ] 게임 결과 저장 시스템
- [ ] 사용자 랭킹 시스템
- [ ] PWA 지원 (오프라인 플레이)

### v7.0 (중기)
- [ ] 모바일 앱 (React Native)
- [ ] AI 추천 시스템
- [ ] 소셜 기능 (리뷰, 평점)

### v8.0 (장기)
- [ ] 다국어 지원
- [ ] 마이크로서비스 아키텍처
- [ ] Kubernetes 배포

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 🙏 감사의 말

- **Anthropic**: Claude API 제공
- **OpenAI**: Embeddings API 제공
- **Supabase**: Vector Store 및 데이터베이스 제공
- **Socket.IO**: 실시간 통신 라이브러리

---

**Sensor Game Hub v6.0** - 모바일 센서로 새로운 게임 경험을 만나보세요! 🎮✨

---

## 🔗 관련 문서

- [개발자 온보딩 가이드](docs/개발자_온보딩_가이드.md) - 신규 개발자 필독
- [AI 개발자 가이드 (CLAUDE.md)](CLAUDE.md) - 프로젝트 내부 구조 및 AI 가이드
- [프로젝트 설계 명세서](docs/프로젝트_설계_명세서_draft.md) - 전체 시스템 설계
- [게임 개발 가이드](DEVELOPER_GUIDE.md) - 게임 제작 상세 가이드

---

<div align="center">

**Made with ❤️ by Sensor Game Hub Team**

[⬆ Back to top](#-sensor-game-hub-v60)

</div>
