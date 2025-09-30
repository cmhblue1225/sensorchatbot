# 🎯 AI 게임 생성기 완전 수정 계획

**작성일**: 2025-10-01
**목표**: AI로 생성된 게임이 실제로 실행 가능하도록 완전한 시스템 구축
**예상 소요 시간**: 60분

---

## 📊 현재 상황 분석

### ✅ 정상 동작하는 부분

#### 1. `saveGameToFiles()` 메서드 (InteractiveGameGenerator.js:1647-1720)
**이미 올바른 폴더 구조를 생성하고 있습니다!**

```javascript
async saveGameToFiles(gameCode, metadata) {
    const gameId = this.generateGameId(metadata.title);
    const gamePath = path.join(process.cwd(), 'public', 'games', gameId);

    // ✅ 폴더 생성
    await fs.mkdir(gamePath, { recursive: true });

    // ✅ index.html 저장
    await fs.writeFile(path.join(gamePath, 'index.html'), gameCode, 'utf8');

    // ✅ game.json 저장
    await fs.writeFile(path.join(gamePath, 'game.json'), JSON.stringify(gameJson, null, 2), 'utf8');

    // ✅ README.md 저장
    await fs.writeFile(path.join(gamePath, 'README.md'), readme, 'utf8');

    // ✅ VALIDATION_REPORT.md 저장
    await fs.writeFile(path.join(gamePath, 'VALIDATION_REPORT.md'), validationReport, 'utf8');

    return {
        success: true,
        gameId: gameId,
        gamePath: gamePath,
        playUrl: `/games/${gameId}/`
    };
}
```

**생성되는 폴더 구조**:
```
public/games/{gameId}/
├── index.html              (게임 실행 파일)
├── game.json               (메타데이터)
├── README.md               (문서)
└── VALIDATION_REPORT.md    (검증 보고서)
```

#### 2. GameScanner.js
GameScanner는 위 구조를 **완벽하게 인식 가능**합니다.
- `index.html` 필수 (체크함)
- `game.json` 선택 (없으면 자동 생성)

### ❌ 발견된 문제점

#### 문제 1: 자동 스캔 시스템 부재
**증상**:
- 게임 생성 완료 → `public/games/{gameId}/` 폴더 생성됨
- 하지만 게임 목록(`/api/games`)에 표시 안 됨
- 서버 재시작해야만 게임 목록에 나타남

**원인**:
```javascript
// GameServer.js:83-95
initializeServer() {
    this.setupRoutes();

    // ❌ 서버 시작 시 1회만 실행
    this.gameService.initializeGames();

    this.aiService.initialize();
}
```

게임 생성 후 `gameService.initializeGames()`를 다시 호출하지 않음.

**영향**:
- 생성된 게임이 시스템에 등록되지 않음
- `/games/{gameId}/` URL 접근 불가
- 사용자가 게임 플레이 불가능

#### 문제 2: 다운로드 기능 불완전
**현재 구현** (developerRoutes.js:1928-1972):
```javascript
async handleDownloadGame(req, res) {
    const gamePath = path.join(__dirname, '../../public/games', gameId, 'index.html');

    // ❌ index.html 파일만 다운로드
    res.setHeader('Content-Disposition', `attachment; filename="${gameId}.html"`);
    res.sendFile(gamePath);
}
```

**문제점**:
- `index.html` 단일 파일만 다운로드
- 사용자가 받은 파일: `{gameId}.html`
- `game.json`, `README.md` 등 누락

**필요한 형태**:
```
다운로드 파일: {gameId}.zip
압축 내용:
  {gameId}/
  ├── index.html
  ├── game.json
  ├── README.md
  └── VALIDATION_REPORT.md
```

**이렇게 해야 하는 이유**:
1. GameScanner는 **폴더 구조**를 기대함
2. 단일 HTML 파일을 `public/games/`에 넣어도 인식 안 됨
3. ZIP을 풀면 `{gameId}/` 폴더가 나와야 바로 사용 가능

#### 문제 3: 생성된 게임 코드 품질
**가능성 있는 문제**:
- SessionSDK 통합 누락
- 센서 데이터 처리 로직 불완전
- CustomEvent 패턴 미적용

**현재 검증** (InteractiveGameGenerator.js:1684-1685):
```javascript
const validationResult = await this.gameValidator.validateGame(gameId, gamePath, metadata);
```

검증은 하지만, AI가 생성한 코드 자체의 품질 보장 필요.

---

## 🔧 상세 수정 계획

### Phase 1: 자동 스캔 시스템 추가 ⏰ 15분

#### 목표
게임 생성 완료 즉시 GameScanner가 자동으로 재실행되어 게임을 시스템에 등록

#### 수정할 파일

##### 1-1. `server/services/GameService.js`

**현재 구조 확인**:
```javascript
class GameService {
    constructor() {
        this.gameScanner = new GameScanner();
    }

    async initializeGames() {
        await this.gameScanner.scanGames();
    }
}
```

**추가할 메서드**:
```javascript
/**
 * 게임 재스캔 (게임 생성 후 호출용)
 */
async rescanGames() {
    console.log('🔄 게임 재스캔 시작...');
    await this.gameScanner.scanGames();
    console.log('✅ 게임 재스캔 완료');

    return {
        success: true,
        totalGames: this.gameScanner.games.size,
        games: Array.from(this.gameScanner.games.values())
    };
}
```

##### 1-2. `server/services/AIService.js`

**현재 코드** (AIService.js:162-219):
```javascript
async generateGame(requirements, sessionId, progressCallback) {
    // ... 게임 생성 로직

    const result = await this.interactiveGameGenerator.generateGame(
        requirements,
        wrappedCallback
    );

    // ❌ 여기서 끝남

    return {
        ...result,
        responseTime: responseTime,
        sessionId: sessionId
    };
}
```

**수정 후**:
```javascript
async generateGame(requirements, sessionId, progressCallback) {
    // ... 기존 로직 유지

    const result = await this.interactiveGameGenerator.generateGame(
        requirements,
        wrappedCallback
    );

    const responseTime = Date.now() - startTime;

    if (result.success) {
        this.stats.successfulGenerations++;

        // ✅ 게임 생성 성공 시 자동 스캔 실행
        console.log('🎮 게임 생성 성공 - 자동 스캔 실행 중...');

        // GameService 인스턴스 필요 - constructor에서 주입받아야 함
        if (this.gameService) {
            try {
                const scanResult = await this.gameService.rescanGames();
                console.log(`✅ 자동 스캔 완료 - 총 ${scanResult.totalGames}개 게임 등록`);
            } catch (scanError) {
                console.error('⚠️ 자동 스캔 실패:', scanError);
                // 게임은 생성됐으므로 오류로 처리하지 않음
            }
        }
    } else {
        this.stats.failedGenerations++;
    }

    this.updateAverageResponseTime(responseTime);

    return {
        ...result,
        responseTime: responseTime,
        sessionId: sessionId
    };
}
```

##### 1-3. `server/core/GameServer.js`

**현재 코드** (GameServer.js:44-48):
```javascript
// 서비스 초기화
this.sessionService = new SessionService();
this.gameService = new GameService();
this.aiService = new AIService();
```

**수정 후**:
```javascript
// 서비스 초기화
this.sessionService = new SessionService();
this.gameService = new GameService();

// ✅ AIService에 GameService 주입
this.aiService = new AIService(this.gameService);
```

##### 1-4. `server/services/AIService.js` - Constructor 수정

**현재**:
```javascript
constructor() {
    this.aiAssistant = null;
    // ...
}
```

**수정 후**:
```javascript
constructor(gameService = null) {
    this.aiAssistant = null;
    this.gameService = gameService;  // ✅ GameService 저장
    // ...
}
```

#### 검증 방법

1. **서버 시작**:
```bash
cd /Users/dev/졸업작품/sensorchatbot
PORT=3008 npm start
```

2. **게임 생성 테스트**:
   - http://localhost:3008/developer 접속
   - "🎮 게임 생성기" 탭 선택
   - 게임 생성 진행
   - **콘솔에서 확인할 로그**:
     ```
     🎮 게임 생성 성공 - 자동 스캔 실행 중...
     🔄 게임 재스캔 시작...
     ✅ 게임 재스캔 완료
     ✅ 자동 스캔 완료 - 총 12개 게임 등록
     ```

3. **게임 목록 확인**:
```bash
curl http://localhost:3008/api/games
```
새로 생성된 게임이 목록에 나타나야 함.

4. **게임 실행 테스트**:
   - 브라우저에서 `http://localhost:3008/games/{생성된게임ID}/` 접속
   - 게임이 정상 로드되어야 함

---

### Phase 2: ZIP 다운로드 기능 구현 ⏰ 25분

#### 목표
전체 게임 폴더를 ZIP 파일로 압축하여 다운로드

#### 필요한 패키지 설치

```bash
cd /Users/dev/졸업작품/sensorchatbot
npm install archiver
```

**archiver란?**
- Node.js용 압축 라이브러리
- ZIP, TAR 등 다양한 형식 지원
- 스트림 기반으로 메모리 효율적

#### 수정할 파일

##### 2-1. `server/routes/developerRoutes.js` - 상단 import 추가

**파일 위치**: developerRoutes.js:1-20

**추가할 코드**:
```javascript
const archiver = require('archiver');
```

**전체 import 섹션**:
```javascript
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const archiver = require('archiver');  // ✅ 추가

const HtmlGenerator = require('../utils/htmlGenerator');
const MarkdownRenderer = require('../utils/markdownRenderer');
```

##### 2-2. `server/routes/developerRoutes.js` - `handleDownloadGame()` 메서드 완전 재작성

**현재 위치**: developerRoutes.js:1928-1972

**현재 코드 (삭제할 부분)**:
```javascript
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

        // Game file path
        const gamePath = path.join(__dirname, '../../public/games', gameId, 'index.html');

        // Check file exists
        if (!fs.existsSync(gamePath)) {
            console.error(`❌ 게임 파일을 찾을 수 없음: ${gamePath}`);
            return res.status(404).json({
                success: false,
                error: '게임 파일을 찾을 수 없습니다.'
            });
        }

        console.log(`✅ 게임 파일 전송 시작: ${gamePath}`);

        // Set download headers
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${gameId}.html"`);

        // Send file
        res.sendFile(gamePath);

    } catch (error) {
        console.error('❌ 게임 다운로드 오류:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
```

**새로운 코드 (ZIP 다운로드)**:
```javascript
/**
 * 게임 다운로드 핸들러 (ZIP 압축)
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

        // 게임 폴더 경로
        const gameFolderPath = path.join(__dirname, '../../public/games', gameId);

        // 폴더 존재 확인
        try {
            await fs.access(gameFolderPath);
        } catch {
            console.error(`❌ 게임 폴더를 찾을 수 없음: ${gameFolderPath}`);
            return res.status(404).json({
                success: false,
                error: '게임 폴더를 찾을 수 없습니다.'
            });
        }

        console.log(`✅ 게임 폴더 발견: ${gameFolderPath}`);
        console.log(`📦 ZIP 압축 시작...`);

        // ZIP 다운로드 헤더 설정
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${gameId}.zip"`);

        // archiver 인스턴스 생성
        const archive = archiver('zip', {
            zlib: { level: 9 }  // 최대 압축
        });

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

        // 진행 상황 로깅
        archive.on('progress', (progress) => {
            console.log(`📦 압축 진행: ${progress.entries.processed}개 파일 처리됨`);
        });

        // 완료 로깅
        archive.on('end', () => {
            console.log(`✅ ZIP 압축 완료 [${gameId}.zip] - ${archive.pointer()} bytes`);
        });

        // 스트림 연결 (파일 → archive → response)
        archive.pipe(res);

        // 게임 폴더 전체를 ZIP에 추가 (폴더명 포함)
        // 결과: {gameId}/index.html, {gameId}/game.json 등의 구조
        archive.directory(gameFolderPath, gameId);

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
```

**코드 설명**:

1. **폴더 존재 확인**:
   - `fs.access()`로 폴더 존재 여부 체크
   - 없으면 404 에러 반환

2. **archiver 설정**:
   - `zlib: { level: 9 }`: 최대 압축률 (1-9, 9가 최대)
   - 파일 크기 최소화

3. **이벤트 핸들러**:
   - `error`: 압축 중 오류 처리
   - `progress`: 진행 상황 로깅 (디버깅용)
   - `end`: 완료 로깅

4. **폴더 압축**:
   - `archive.directory(gameFolderPath, gameId)`
   - 두 번째 인자 `gameId`가 ZIP 내부의 최상위 폴더명이 됨
   - 결과: `{gameId}/index.html` 구조

5. **스트림 처리**:
   - `archive.pipe(res)`: 메모리에 전체 파일을 올리지 않고 스트림으로 전송
   - 큰 게임 파일도 효율적으로 처리

#### 검증 방법

1. **서버 재시작**:
```bash
# 기존 프로세스 종료
lsof -ti:3008 | xargs kill -9 2>/dev/null

# 서버 시작
cd /Users/dev/졸업작품/sensorchatbot
PORT=3008 npm start
```

2. **게임 생성 및 다운로드**:
   - http://localhost:3008/developer 접속
   - 게임 생성 완료 후 "🎮 게임 다운로드" 버튼 클릭
   - `{gameId}.zip` 파일 다운로드 확인

3. **ZIP 파일 검증**:
```bash
# 다운로드 폴더로 이동
cd ~/Downloads

# ZIP 압축 해제
unzip {gameId}.zip

# 폴더 구조 확인
ls -la {gameId}/
# 출력 예상:
# index.html
# game.json
# README.md
# VALIDATION_REPORT.md
```

4. **게임 실행 테스트**:
```bash
# 압축 해제한 폴더를 games 디렉토리로 복사
cp -r ~/Downloads/{gameId} /Users/dev/졸업작품/sensorchatbot/public/games/

# 브라우저에서 접속
# http://localhost:3008/games/{gameId}/
```

5. **콘솔 로그 확인**:
```
📥 게임 다운로드 요청 [게임 ID: test-game-123456]
✅ 게임 폴더 발견: /Users/dev/졸업작품/sensorchatbot/public/games/test-game-123456
📦 ZIP 압축 시작...
📦 압축 진행: 4개 파일 처리됨
✅ ZIP 압축 완료 [test-game-123456.zip] - 15234 bytes
```

---

### Phase 3: 게임 코드 품질 검증 및 개선 ⏰ 20분

#### 목표
AI가 생성한 게임 코드가 SessionSDK를 올바르게 통합하고 실제 실행 가능하도록 보장

#### 문제 분석

**SessionSDK 필수 패턴**:
```javascript
// 1. SDK 초기화
const sdk = new SessionSDK({
    gameId: 'game-name',
    gameType: 'solo'  // 'solo', 'dual', 'multi'
});

// 2. 연결 대기
sdk.on('connected', () => {
    createSession();
});

// 3. CustomEvent 처리 (중요!)
sdk.on('session-created', (event) => {
    const session = event.detail || event;  // 반드시 이 패턴!
    displaySessionInfo(session);
});

sdk.on('sensor-data', (event) => {
    const data = event.detail || event;     // 반드시 이 패턴!
    processSensorData(data);
});
```

#### 수정할 파일

##### 3-1. `server/InteractiveGameGenerator.js` - AI 프롬프트 강화

**현재 위치**: InteractiveGameGenerator.js:859-1058 (`generateFinalGame()` 메서드)

**찾을 부분**:
```javascript
const gameGenerationPrompt = `당신은 센서 기반 HTML5 게임 개발 전문가입니다.
다음 요구사항에 따라 완전히 동작하는 게임을 생성해주세요.
...
```

**수정 방법**: 프롬프트에 SessionSDK 통합 가이드 추가

**새로운 프롬프트 구조**:
```javascript
const gameGenerationPrompt = `당신은 센서 기반 HTML5 게임 개발 전문가입니다.

🎯 **중요: 아래 지침을 정확히 따라야 합니다!**

## 📋 게임 요구사항
${JSON.stringify(session.gameRequirements, null, 2)}

## 🔧 필수 구현 사항

### 1. SessionSDK 통합 (필수!)

\`\`\`html
<!-- SDK 스크립트 로드 -->
<script src="/js/SessionSDK.js"></script>

<script>
// SDK 초기화
const sdk = new SessionSDK({
    gameId: '${session.gameRequirements.title.toLowerCase().replace(/\\s+/g, '-')}',
    gameType: '${session.gameRequirements.gameType || 'solo'}'  // 'solo', 'dual', 'multi'
});

// 연결 완료 후 세션 생성
sdk.on('connected', () => {
    console.log('✅ 서버 연결 완료');
    sdk.createSession();
});

// 세션 생성 완료
sdk.on('session-created', (event) => {
    const session = event.detail || event;  // ⚠️ 반드시 이 패턴 사용!
    console.log('✅ 세션 생성:', session);
    displaySessionInfo(session);
});

// 센서 연결
sdk.on('sensor-connected', (event) => {
    const data = event.detail || event;
    console.log('✅ 센서 연결:', data.sensorId);
});

// 센서 데이터 수신
sdk.on('sensor-data', (event) => {
    const data = event.detail || event;  // ⚠️ 반드시 이 패턴 사용!

    // 센서 데이터 처리
    const sensorId = data.sensorId;
    const orientation = data.data.orientation;  // alpha, beta, gamma
    const acceleration = data.data.acceleration;  // x, y, z

    // 게임 로직에서 사용
    updateGameWithSensorData(sensorId, orientation, acceleration);
});

// 게임 시작
sdk.on('game-started', (event) => {
    const data = event.detail || event;
    console.log('🎮 게임 시작!');
    startGameLoop();
});
</script>
\`\`\`

### 2. 센서 데이터 처리 예시

\`\`\`javascript
function updateGameWithSensorData(sensorId, orientation, acceleration) {
    // orientation: { alpha, beta, gamma }
    // alpha: 0-360도 (회전)
    // beta: -180 ~ 180도 (앞뒤 기울기)
    // gamma: -90 ~ 90도 (좌우 기울기)

    // acceleration: { x, y, z }
    // x: 좌우 가속도
    // y: 상하 가속도 (중력 포함, 정지 시 약 -9.8)
    // z: 앞뒤 가속도

    // 예시: 기울기로 공 이동
    if (sensorId === 'sensor1') {
        ball.velocityX = orientation.gamma * 0.5;   // 좌우
        ball.velocityY = orientation.beta * 0.5;    // 앞뒤
    }
}
\`\`\`

### 3. 세션 정보 표시 UI

\`\`\`javascript
function displaySessionInfo(session) {
    document.getElementById('session-code').textContent = session.sessionCode;
    document.getElementById('qr-code').src = session.qrCode;
}
\`\`\`

\`\`\`html
<div id="session-info">
    <h3>세션 코드: <span id="session-code">----</span></h3>
    <img id="qr-code" alt="QR Code">
    <p>센서 클라이언트에서 이 코드를 입력하세요</p>
</div>
\`\`\`

### 4. 게임 타입별 센서 구성

- **solo**: 1개 센서 (sensorId: 'sensor1')
- **dual**: 2개 센서 (sensorId: 'sensor1', 'sensor2')
- **multi**: 최대 10개 센서 (sensorId: 'player1' ~ 'player10')

## 📝 생성 가이드

1. **완전한 HTML5 문서** 생성 (<!DOCTYPE html>부터 </html>까지)
2. **Canvas 또는 DOM 기반** 게임 구현
3. **반응형 디자인** 적용 (모바일/데스크톱)
4. **시각적으로 매력적인** UI/UX
5. **게임 로직** 완전 구현 (시작, 진행, 종료)
6. **점수 시스템** 및 피드백

## ⚠️ 주의사항

- SessionSDK.js는 이미 서버에 있으므로 **절대 코드에 포함하지 마세요**
- CustomEvent 처리 시 **반드시 \`event.detail || event\` 패턴** 사용
- 센서 데이터는 **50ms 간격으로 수신**됨 (초당 20회)
- 게임 시작 전 **센서 연결 대기** 필요

## 🎨 참고: 기존 게임 스타일

다음과 같은 디자인을 참고하세요:
- 어두운 배경 (#1a1a2e, #16213e)
- 네온 색상 (cyan, magenta, yellow)
- 부드러운 애니메이션
- 명확한 UI 요소

이제 위 요구사항을 모두 충족하는 완전한 게임 코드를 생성해주세요!`;
```

**프롬프트 주요 개선 사항**:

1. **SessionSDK 통합 완전 예시 코드**
   - 초기화부터 이벤트 처리까지 전체 코드
   - CustomEvent 패턴 강조

2. **센서 데이터 구조 설명**
   - orientation, acceleration 상세 설명
   - 실제 값 범위 명시

3. **게임 타입별 센서 구성**
   - solo/dual/multi 차이 명확히

4. **필수 주의사항 강조**
   - SessionSDK.js 중복 포함 금지
   - CustomEvent 패턴 필수

##### 3-2. 검증 로직 강화 (선택 사항)

**위치**: InteractiveGameGenerator.js:1466-1620 (`validateGameCode()` 메서드)

**추가 검증 항목**:
```javascript
// 기존 검증에 추가
validations.push({
    name: 'SessionSDK 통합 확인',
    check: gameCode.includes('new SessionSDK({'),
    message: 'SessionSDK 초기화 코드 필요',
    severity: 'critical'
});

validations.push({
    name: 'CustomEvent 패턴 사용',
    check: gameCode.includes('event.detail || event'),
    message: 'CustomEvent 처리 패턴 필요',
    severity: 'warning'
});

validations.push({
    name: '센서 데이터 처리',
    check: gameCode.includes("sdk.on('sensor-data'"),
    message: 'sensor-data 이벤트 리스너 필요',
    severity: 'critical'
});
```

#### 검증 방법

1. **게임 생성 테스트**:
```bash
# 서버 실행
cd /Users/dev/졸업작품/sensorchatbot
PORT=3008 npm start
```

2. **개발자 센터에서 게임 생성**:
   - http://localhost:3008/developer
   - "🎮 게임 생성기" 탭
   - 게임 요구사항 입력 및 생성

3. **생성된 코드 확인**:
```bash
# 최근 생성된 게임 찾기
ls -lt /Users/dev/졸업작품/sensorchatbot/public/games/ | head -5

# 코드 확인
cat /Users/dev/졸업작품/sensorchatbot/public/games/{gameId}/index.html | grep -A 20 "SessionSDK"
```

**확인할 내용**:
- `<script src="/js/SessionSDK.js"></script>` 존재
- `new SessionSDK({` 존재
- `sdk.on('sensor-data'` 존재
- `event.detail || event` 패턴 사용

4. **실제 게임 플레이 테스트**:

**Step 1**: 게임 실행
```
http://localhost:3008/games/{gameId}/
```

**Step 2**: 세션 코드 확인 (예: "AB12")

**Step 3**: 센서 클라이언트 연결
```
http://localhost:3008/sensor.html
→ 세션 코드 "AB12" 입력
→ 연결 버튼 클릭
```

**Step 4**: 센서 데이터 전송 확인
- 모바일 기울이면 게임 반응 확인
- 브라우저 개발자 도구에서 센서 데이터 로그 확인

5. **검증 보고서 확인**:
```bash
cat /Users/dev/졸업작품/sensorchatbot/public/games/{gameId}/VALIDATION_REPORT.md
```

**기대 결과**:
```markdown
# 게임 검증 보고서

## 총점: 85/100

### ✅ 통과한 검증
- HTML5 문서 구조
- SessionSDK 통합
- 센서 데이터 처리
- 게임 타입 일치
- Canvas/DOM 존재

### ⚠️ 경고
- CustomEvent 패턴 일부 누락

### ❌ 실패한 검증
- (없음)
```

---

## 📊 전체 작업 체크리스트

### Phase 1: 자동 스캔 시스템 ✅
- [ ] `GameService.js`에 `rescanGames()` 메서드 추가
- [ ] `AIService.js` constructor에 `gameService` 파라미터 추가
- [ ] `AIService.js` `generateGame()`에 자동 스캔 로직 추가
- [ ] `GameServer.js`에서 `AIService` 초기화 시 `gameService` 주입
- [ ] 테스트: 게임 생성 → 게임 목록 자동 업데이트 확인
- [ ] 테스트: `/api/games` API에서 새 게임 확인
- [ ] 테스트: `/games/{gameId}/` URL로 게임 실행 확인

### Phase 2: ZIP 다운로드 기능 ✅
- [ ] `archiver` 패키지 설치
- [ ] `developerRoutes.js`에 archiver import 추가
- [ ] `handleDownloadGame()` 메서드 완전 재작성
- [ ] 테스트: 게임 다운로드 → ZIP 파일 받아짐
- [ ] 테스트: ZIP 압축 해제 → 폴더 구조 확인
- [ ] 테스트: 압축 해제한 폴더를 `public/games/`에 복사 → 게임 실행
- [ ] 콘솔 로그 확인 (압축 진행, 완료 메시지)

### Phase 3: 게임 코드 품질 개선 ✅
- [ ] `InteractiveGameGenerator.js`의 AI 프롬프트 강화
- [ ] SessionSDK 통합 가이드를 프롬프트에 추가
- [ ] 센서 데이터 구조 상세 설명 추가
- [ ] CustomEvent 패턴 강조
- [ ] (선택) `validateGameCode()`에 추가 검증 항목 추가
- [ ] 테스트: 게임 생성 → 코드에 SessionSDK 통합 확인
- [ ] 테스트: 실제 센서 연결 → 게임 반응 확인
- [ ] 테스트: `VALIDATION_REPORT.md` 확인 (80점 이상)

### 통합 테스트 ✅
- [ ] 전체 플로우 테스트:
  1. 게임 생성
  2. 게임 목록에 자동 추가 확인
  3. ZIP 다운로드
  4. 압축 해제 및 `public/games/` 복사
  5. 브라우저에서 게임 실행
  6. 센서 클라이언트 연결
  7. 센서 데이터로 게임 플레이

---

## 🎯 성공 기준

### ✅ Phase 1 성공 기준
- 게임 생성 완료 즉시 `/api/games`에 새 게임 표시
- 서버 재시작 없이 `/games/{gameId}/` URL 접근 가능
- 콘솔에 "자동 스캔 완료" 로그 출력

### ✅ Phase 2 성공 기준
- 다운로드 버튼 클릭 → `{gameId}.zip` 파일 다운로드
- ZIP 압축 해제 → `{gameId}/` 폴더 생성됨
- 폴더 내용: `index.html`, `game.json`, `README.md`, `VALIDATION_REPORT.md`
- 압축 해제한 폴더를 `public/games/`에 복사 → 즉시 게임 실행 가능

### ✅ Phase 3 성공 기준
- 생성된 게임 코드에 `<script src="/js/SessionSDK.js"></script>` 포함
- `new SessionSDK({` 초기화 코드 존재
- `event.detail || event` CustomEvent 패턴 사용
- 센서 클라이언트 연결 시 게임이 센서 데이터에 반응
- 검증 점수 80점 이상

---

## 📝 작업 진행 상황 기록

### 작업 시작 전
- [ ] 백업: `cp -r /Users/dev/졸업작품/sensorchatbot /Users/dev/졸업작품/sensorchatbot_backup_$(date +%Y%m%d_%H%M%S)`
- [ ] Git commit (선택 사항)

### Phase 1 진행 중
- [ ] 시작 시간: ___________
- [ ] 완료 시간: ___________
- [ ] 소요 시간: ___________
- [ ] 발생한 문제: ___________
- [ ] 해결 방법: ___________

### Phase 2 진행 중
- [ ] 시작 시간: ___________
- [ ] 완료 시간: ___________
- [ ] 소요 시간: ___________
- [ ] 발생한 문제: ___________
- [ ] 해결 방법: ___________

### Phase 3 진행 중
- [ ] 시작 시간: ___________
- [ ] 완료 시간: ___________
- [ ] 소요 시간: ___________
- [ ] 발생한 문제: ___________
- [ ] 해결 방법: ___________

---

## 🚨 예상 문제 및 해결 방안

### 문제 1: archiver 설치 실패
**증상**: `npm install archiver` 실패

**해결**:
```bash
# 캐시 삭제 후 재시도
npm cache clean --force
npm install archiver

# 버전 명시 설치
npm install archiver@5.3.1
```

### 문제 2: GameService 인스턴스 없음
**증상**: `TypeError: Cannot read property 'rescanGames' of undefined`

**원인**: `AIService` constructor에서 `gameService`를 받지 못함

**해결**: `GameServer.js`에서 의존성 주입 확인
```javascript
this.aiService = new AIService(this.gameService);
```

### 문제 3: ZIP 다운로드 시 헤더 오류
**증상**: `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent`

**원인**: 에러 발생 후 헤더 재설정 시도

**해결**: `handleDownloadGame()`에서 `res.headersSent` 체크
```javascript
if (!res.headersSent) {
    res.status(500).json({ error: '...' });
}
```

### 문제 4: AI가 SessionSDK를 코드에 포함
**증상**: 생성된 게임 코드에 `class SessionSDK {` 포함됨

**원인**: AI가 SDK 코드 자체를 생성함

**해결**: 프롬프트에 명시적으로 금지 사항 추가
```
⚠️ SessionSDK.js는 이미 서버에 있으므로 **절대 코드에 포함하지 마세요**
<script src="/js/SessionSDK.js"></script>만 추가하세요.
```

### 문제 5: 생성된 게임이 여전히 동작 안 함
**디버깅 순서**:

1. **브라우저 개발자 도구 확인**:
```javascript
// Console에서 확인
console.log(window.SessionSDK);  // SDK 로드 확인
console.log(sdk);  // SDK 인스턴스 확인
```

2. **네트워크 탭 확인**:
   - `/js/SessionSDK.js` 로드 성공 (200 OK)
   - WebSocket 연결 확인

3. **서버 로그 확인**:
```bash
# 실시간 로그 확인
tail -f /Users/dev/졸업작품/sensorchatbot/logs/server.log

# WebSocket 연결 로그
grep "WebSocket" /Users/dev/졸업작품/sensorchatbot/logs/server.log
```

4. **VALIDATION_REPORT.md 확인**:
```bash
cat /Users/dev/졸업작품/sensorchatbot/public/games/{gameId}/VALIDATION_REPORT.md
```

---

## 📚 참고 자료

### SessionSDK 문서
- **위치**: `/Users/dev/졸업작품/sensorchatbot/DEVELOPER_GUIDE.md`
- **주요 섹션**: "SessionSDK 통합 가이드"

### 기존 게임 예시
```bash
# 참고할 만한 기존 게임들
ls -la /Users/dev/졸업작품/sensorchatbot/public/games/

# 추천 참고 게임
- solo/             # 솔로 게임 기본 구조
- acorn-battle/     # 세션 관리 예시
- shot-target/      # 모듈형 구조 (고급)
```

### API 엔드포인트
```
GET  /api/games                           # 게임 목록
GET  /api/games/:gameId                   # 특정 게임 정보
GET  /developer/api/download-game/:gameId # 게임 다운로드
POST /api/ai/generate-game                # 게임 생성
```

---

## 🎉 완료 후 확인사항

### 최종 테스트 시나리오

#### 시나리오 1: 게임 생성 및 자동 등록
1. http://localhost:3008/developer 접속
2. "🎮 게임 생성기" 탭 선택
3. 게임 생성 진행 (제목: "Test Game Auto Scan")
4. 생성 완료 후 콘솔에서 "자동 스캔 완료" 확인
5. http://localhost:3008/api/games 에서 새 게임 확인
6. http://localhost:3008/games/{gameId}/ 접속 → 게임 로드 확인

#### 시나리오 2: ZIP 다운로드 및 재설치
1. 게임 생성 완료 모달에서 "🎮 게임 다운로드" 클릭
2. `{gameId}.zip` 파일 다운로드 확인
3. ZIP 압축 해제
4. 폴더 구조 확인: `{gameId}/index.html` 등
5. `cp -r ~/Downloads/{gameId} /Users/dev/졸업작품/sensorchatbot/public/games/`
6. 서버 재시작 후 게임 목록에 표시 확인
7. 게임 실행 확인

#### 시나리오 3: 센서 연결 및 플레이
1. 게임 실행 → 세션 코드 확인 (예: "XY34")
2. 센서 클라이언트 접속: http://localhost:3008/sensor.html
3. 세션 코드 입력 및 연결
4. 모바일 기울임 → 게임 반응 확인
5. 개발자 도구에서 센서 데이터 로그 확인
6. 게임 플레이 정상 동작 확인

### 성능 확인
```bash
# 생성된 게임 파일 크기
du -sh /Users/dev/졸업작품/sensorchatbot/public/games/{gameId}

# ZIP 파일 크기
ls -lh ~/Downloads/{gameId}.zip

# 총 게임 개수
ls /Users/dev/졸업작품/sensorchatbot/public/games/ | wc -l
```

---

## 📞 문제 발생 시 연락처

**이슈 트래킹**: GitHub Issues (프로젝트 저장소)
**문서 위치**: `/Users/dev/졸업작품/sensorchatbot/AI_GAME_GENERATOR_FIX_PLAN.md`
**백업 위치**: `/Users/dev/졸업작품/sensorchatbot_backup_*/`

---

**작성자**: Claude Code
**버전**: 1.0.0
**최종 수정**: 2025-10-01
**상태**: 실행 대기 중 ⏳

---

## 🚀 다음 단계

이 문서를 기반으로 작업을 시작하려면:

```bash
# 1. 백업 생성
cp -r /Users/dev/졸업작품/sensorchatbot /Users/dev/졸업작품/sensorchatbot_backup_$(date +%Y%m%d_%H%M%S)

# 2. Phase 1 시작
# (이 문서의 Phase 1 섹션 참조)

# 3. 진행 상황 기록
# (이 문서의 "작업 진행 상황 기록" 섹션에 기록)
```

**준비 완료! 작업을 시작하시겠습니까?** ✅
