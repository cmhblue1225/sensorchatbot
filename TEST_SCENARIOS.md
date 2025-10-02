# 🧪 게임 생성 시스템 테스트 시나리오 qudyls zz

**작성일**: 2025-10-02
**프로젝트**: 게임 생성 퀄리티 향상 시스템
**테스트 대상**: Phase 1-4 완료된 시스템

---

## 🚀 서버 시작

```bash
cd /Users/dev/졸업작품/sensorchatbot
npm start
```

서버가 시작되면:
```
✅ AI Assistant 및 게임 생성기 초기화 완료
✅ GameMaintenanceManager 초기화 완료
🚀 서버가 포트 3000에서 실행 중입니다
```

---

## 📋 테스트 시나리오

### 시나리오 1: 기본 게임 생성 테스트 (Phase 2-3)

**목적**: Multi-Stage Generation 및 자동 테스트 시스템이 정상 작동하는지 확인

**URL**: http://localhost:3000/interactive-game-generator

**테스트 단계**:
1. 브라우저에서 위 URL 접속
2. 채팅창에 "벽돌깨기 게임 만들어줘" 입력
3. AI 응답 확인:
   - Stage 1: 구조 생성 중...
   - Stage 2: 로직 생성 중...
   - Stage 3: 통합 중...
   - 자동 테스트 실행 중...
   - (필요시) 버그 자동 수정 중...
4. 생성 완료 후 게임 확인

**예상 결과**:
- ✅ 게임이 정상적으로 생성됨
- ✅ 테스트 점수 60점 이상
- ✅ 공이 패들에서 떨어지지 않는 버그 없음
- ✅ 타이머가 정상 작동

**확인 포인트**:
```javascript
// 생성된 게임에서 확인
- SessionSDK가 정상 초기화되는가?
- QR 코드가 생성되는가?
- 공이 게임 시작 전에는 패들에 붙어있고, 시작 후에는 독립적으로 움직이는가?
- 타이머가 1초마다 감소하는가?
```

---

### 시나리오 2: 유지보수 API 테스트 (Phase 4)

**목적**: 게임 생성 후 유지보수 시스템이 정상 작동하는지 확인

#### 2-1. 세션 정보 조회

**방법**:
```bash
# 생성된 게임의 ID 확인 (예: brick-breaker-1234)
curl http://localhost:3000/api/maintenance/sessions
```

**예상 결과**:
```json
{
  "success": true,
  "sessions": [
    {
      "gameId": "brick-breaker-1234",
      "version": "1.0",
      "createdAt": "2025-10-02T10:30:00.000Z",
      "lastAccessedAt": "2025-10-02T10:30:00.000Z",
      "modifications": 0
    }
  ],
  "count": 1
}
```

#### 2-2. 버그 리포트 테스트

**방법**:
```bash
curl -X POST http://localhost:3000/api/maintenance/report-bug \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "brick-breaker-1234",
    "bugDescription": "공이 패들에 붙어서 떨어지지 않아요"
  }'
```

**예상 결과**:
```json
{
  "success": true,
  "message": "버그가 수정되었습니다!",
  "version": "1.1",
  "changes": ["코드 수정됨"]
}
```

**확인 포인트**:
- ✅ 버그 수정된 게임 파일 생성됨
- ✅ backups 폴더에 v1.0 백업 생성됨
- ✅ 버전이 1.0 → 1.1로 증가

#### 2-3. 기능 추가 테스트

**방법**:
```bash
curl -X POST http://localhost:3000/api/maintenance/add-feature \
  -H "Content-Type: application/json" \
  -d '{
    "gameId": "brick-breaker-1234",
    "featureDescription": "점수가 100점 이상이면 속도가 빨라지게 해주세요"
  }'
```

**예상 결과**:
```json
{
  "success": true,
  "message": "기능이 추가되었습니다!",
  "version": "1.2",
  "changes": ["새로운 함수 추가됨", "코드 수정됨"]
}
```

#### 2-4. 수정 이력 조회

**방법**:
```bash
curl http://localhost:3000/api/maintenance/history/brick-breaker-1234
```

**예상 결과**:
```json
{
  "success": true,
  "history": [
    {
      "type": "🐛 버그 수정",
      "description": "공이 패들에 붙어서 떨어지지 않아요",
      "timestamp": "2025-10-02T10:35:00.000Z",
      "version": "1.1"
    },
    {
      "type": "✨ 기능 추가",
      "description": "점수가 100점 이상이면 속도가 빨라지게 해주세요",
      "timestamp": "2025-10-02T10:40:00.000Z",
      "version": "1.2"
    }
  ]
}
```

---

### 시나리오 3: 자동 테스트 시스템 검증

**목적**: GameCodeTester와 AutoFixer가 정상 작동하는지 확인

**테스트 코드**:
```javascript
// Node.js 콘솔에서 실행
const GameCodeTester = require('./server/GameCodeTester');
const AutoFixer = require('./server/AutoFixer');

const tester = new GameCodeTester();
const fixer = new AutoFixer({
    claudeApiKey: process.env.CLAUDE_API_KEY,
    claudeModel: 'claude-3-5-sonnet-20241022'
});

// 의도적으로 버그가 있는 HTML 테스트
const buggyHtml = `
<!DOCTYPE html>
<html>
<head><title>Test Game</title></head>
<body>
<script>
const sdk = new SessionSDK({ gameId: 'test', gameType: 'solo' });

// 버그: session.code 사용 (session.sessionCode여야 함)
sdk.on('session-created', (event) => {
    const session = event.detail || event;
    document.getElementById('session-code').textContent = session.code;
});

// 버그: 타이머가 작동하지 않음 (timeLeft-- 누락)
let timeLeft = 60;
setInterval(() => {
    // timeLeft--; 누락!
    if (timeLeft <= 0) {
        alert('Game Over');
    }
}, 1000);

// 버그: 공이 항상 패들에 붙어있음
function update() {
    ball.x = paddle.x + paddle.width/2;
    ball.y = paddle.y - ball.radius;
}
</script>
</body>
</html>
`;

// 테스트 실행
(async () => {
    console.log('🧪 테스트 시작...\n');

    // 1. 자동 테스트
    const testResults = await tester.testGame(buggyHtml, 'test-game');
    console.log(tester.generateReport(testResults));

    // 2. 자동 수정
    if (!testResults.passed) {
        console.log('\n🔧 자동 수정 시작...\n');
        const fixResults = await fixer.fixBugs(buggyHtml, testResults);
        console.log('수정 완료:', fixResults.success);
        console.log('시도 횟수:', fixResults.attempts);
    }
})();
```

**예상 결과**:
```
🧪 테스트 시작...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 게임 테스트 결과
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

게임 ID: test-game
총점: 35/100
등급: F
통과 여부: ❌ 실패

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 상세 테스트 결과
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ SessionSDK 통합: 7/8 (15점)
   └─ ❌ 버그: session.code 사용 (session.sessionCode여야 함)

❌ 타이머 시스템: 3/4 (9점)
   └─ ❌ 버그: 타이머가 작동하지 않을 수 있음

❌ 버그 패턴 감지: 0/3 (0점)
   └─ ❌ 치명적 버그: 공이 패들에 붙어있는 버그

🔧 자동 수정 시작...

🔧 자동 버그 수정 시작...
🔄 수정 시도 1/3...
✅ 시도 1 성공
✅ 모든 버그 수정 완료

수정 완료: true
시도 횟수: 1
```

---

### 시나리오 4: 세션 만료 테스트

**목적**: 30분 타임아웃이 정상 작동하는지 확인

**방법**:
1. 게임 생성
2. 세션 정보 조회 (정상 조회됨)
3. 30분 대기
4. 세션 정보 조회 (세션 만료)

**빠른 테스트** (개발용):
```javascript
// GameMaintenanceManager.js의 sessionTimeout을 임시로 수정
this.sessionTimeout = 5 * 1000; // 5초로 변경

// 5초 후 세션이 자동 삭제되는지 확인
```

---

## ✅ 테스트 체크리스트

### Phase 2: Multi-Stage Generation
- [ ] StructureGenerator가 HTML 뼈대를 생성하는가?
- [ ] GameLogicGenerator가 검증된 패턴을 사용하는가?
- [ ] IntegrationGenerator가 구조와 로직을 올바르게 통합하는가?

### Phase 3: 자동 테스트
- [ ] GameCodeTester가 7개 항목을 테스트하는가?
- [ ] 버그 패턴을 정확히 감지하는가?
- [ ] 점수 및 등급 계산이 정확한가?
- [ ] AutoFixer가 버그를 자동으로 수정하는가?
- [ ] 최대 3회 재시도가 작동하는가?

### Phase 4: 유지보수 시스템
- [ ] 게임 생성 후 세션이 등록되는가?
- [ ] 버그 리포트 API가 작동하는가?
- [ ] 기능 추가 API가 작동하는가?
- [ ] 버전 관리가 정상 작동하는가? (v1.0 → v1.1 → v1.2)
- [ ] 자동 백업이 생성되는가?
- [ ] 수정 이력이 기록되는가?
- [ ] 30분 후 세션이 자동 삭제되는가?

---

## 🐛 예상 가능한 문제 및 해결 방법

### 문제 1: "CLAUDE_API_KEY가 설정되지 않았습니다"
**해결**: `.env` 파일에 API 키 추가
```bash
CLAUDE_API_KEY=your_api_key_here
OPENAI_API_KEY=your_openai_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### 문제 2: "GameMaintenanceManager 초기화 실패"
**해결**:
```bash
cd /Users/dev/졸업작품/sensorchatbot
npm install @langchain/anthropic
npm start
```

### 문제 3: "세션을 찾을 수 없습니다"
**원인**: 30분 타임아웃 또는 서버 재시작
**해결**: 게임을 다시 생성하여 새 세션 생성

### 문제 4: 버그 수정이 작동하지 않음
**확인사항**:
- Claude API 키가 유효한가?
- Claude API 할당량이 남아있는가?
- 생성된 게임 파일이 존재하는가?

---

## 📊 성공 기준

### 최소 성공 기준 (Must Have)
- ✅ 게임이 생성됨
- ✅ 테스트 점수 60점 이상
- ✅ 치명적 버그가 없음

### 권장 성공 기준 (Should Have)
- ✅ 테스트 점수 80점 이상
- ✅ 자동 수정 1회 이내 성공
- ✅ 모든 유지보수 API 정상 작동

### 이상적 성공 기준 (Nice to Have)
- ✅ 테스트 점수 90점 이상 (A+ 등급)
- ✅ 버그 수정 없이 한 번에 성공
- ✅ 세션 관리 완벽 작동

---

## 🎯 테스트 완료 후

테스트가 모두 성공하면:

1. **생성된 게임 파일 확인**:
   ```bash
   ls -la public/games/[gameId]/
   # index.html, game.json, backups/ 폴더 확인
   ```

2. **백업 파일 확인**:
   ```bash
   ls -la public/games/[gameId]/backups/
   # index.v1.0.html, index.v1.1.html 등 확인
   ```

3. **로그 확인**:
   ```
   ✅ GameMaintenanceManager 초기화 완료
   💾 백업 완료: [경로]
   🔧 자동 버그 수정 시작...
   ✅ 버그 수정 완료: [gameId] (v1.1)
   ```

---

**테스트 문서 버전**: 1.0
**최종 업데이트**: 2025-10-02
**작성자**: Claude Code
