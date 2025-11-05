# 🚀 Render.com 배포 가이드

## 📋 사전 준비사항

### 1. 필수 계정
- [Render.com](https://render.com) 계정
- GitHub 계정 (저장소 연결용)

### 2. 필수 환경 변수
배포 전에 다음 API 키들을 준비하세요:

- **SUPABASE_URL**: Supabase 프로젝트 URL
- **SUPABASE_ANON_KEY**: Supabase Anonymous 키
- **CLAUDE_API_KEY**: Anthropic Claude API 키
- **OPENAI_API_KEY**: OpenAI API 키

## 🔧 Render.com 배포 단계

### Step 1: New Web Service 생성

1. Render 대시보드에서 **"New +"** 클릭
2. **"Web Service"** 선택
3. GitHub 저장소 연결

### Step 2: 기본 설정

**저장소 설정:**
- Repository: `cmhblue1225/sensorchatbot`
- Branch: `minhyuk` ⭐

**서비스 설정:**
- Name: `sensor-game-hub` (원하는 이름)
- Region: `Singapore` (아시아 최적)
- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

### Step 3: 환경 변수 설정

**Environment Variables** 섹션에서 다음 변수들을 추가:

```
NODE_ENV=production
PORT=3000
SUPABASE_URL=your_actual_supabase_url
SUPABASE_ANON_KEY=your_actual_supabase_anon_key
CLAUDE_API_KEY=your_actual_claude_api_key
OPENAI_API_KEY=your_actual_openai_api_key
```

⚠️ **중요**: 실제 값으로 교체하세요!

### Step 4: 고급 설정 (선택사항)

**Auto-Deploy:**
- ✅ Auto-Deploy 활성화
- minhyuk 브랜치에 푸시하면 자동 배포

**Health Check:**
- Health Check Path: `/`
- 서버 상태를 자동으로 모니터링

### Step 5: 배포 시작

1. **"Create Web Service"** 클릭
2. 빌드 로그 확인
3. 배포 완료 대기 (약 5-10분)

## ✅ 배포 확인

### 배포 성공 확인 사항

1. **빌드 로그 확인:**
```
🔐 SessionManager v6.0 초기화 완료
🎮 게임 템플릿 표준화 시스템 v6.0 초기화 완료
🏠 LandingRoutes 초기화 완료
👨‍💻 DeveloperRoutes 초기화 완료
🤖 AI Assistant 초기화 완료
🚀 Sensor Game Hub v6.0 서버 시작
```

2. **URL 접속 테스트:**
- Landing Page: `https://your-app.onrender.com/`
- 게임 목록: `https://your-app.onrender.com/games/`
- Developer Center: `https://your-app.onrender.com/developer`
- 센서 클라이언트: `https://your-app.onrender.com/sensor.html`

3. **기능 테스트:**
- ✅ Landing Page 정상 표시
- ✅ 게임 목록 12개 표시
- ✅ Developer Center 문서 로딩
- ✅ AI 챗봇 응답 확인

## 🔄 업데이트 방법

### 자동 배포 (권장)

```bash
# 로컬에서 변경사항 커밋 후 푸시
git add .
git commit -m "Update feature"
git push origin minhyuk
```

→ Render가 자동으로 감지하고 재배포 시작

### 수동 배포

1. Render 대시보드 접속
2. 해당 서비스 선택
3. **"Manual Deploy"** → **"Deploy latest commit"** 클릭

## 🐛 문제 해결

### 빌드 실패 시

**1. 로그 확인:**
- Render 대시보드 → Logs 탭
- 에러 메시지 확인

**2. 일반적인 문제:**

**환경 변수 누락:**
```
Error: SUPABASE_URL is not defined
```
→ Environment Variables에서 모든 필수 변수 확인

**의존성 설치 실패:**
```
npm ERR! missing script: start
```
→ package.json의 scripts 섹션 확인

**포트 문제:**
```
Error: listen EADDRINUSE
```
→ Render는 자동으로 PORT를 할당 (3000 고정 사용 가능)

### 서버 시작 실패 시

**AI Assistant 초기화 실패:**
```
⚠️ Claude API 키가 설정되지 않음
```
→ CLAUDE_API_KEY, OPENAI_API_KEY 확인

**Supabase 연결 실패:**
```
Error: Invalid Supabase URL
```
→ SUPABASE_URL, SUPABASE_ANON_KEY 확인

## 📊 모니터링

### Render 대시보드에서 확인 가능:

- **메트릭**: CPU, 메모리 사용량
- **로그**: 실시간 서버 로그
- **이벤트**: 배포 히스토리
- **Health Check**: 서버 상태

### 로그 모니터링

```bash
# 실시간 로그 보기
# Render 대시보드 → Logs 탭에서 확인
```

## 🔒 보안 체크리스트

- ✅ `.env` 파일이 `.gitignore`에 포함
- ✅ 환경 변수가 Render에만 저장
- ✅ API 키가 코드에 하드코딩되지 않음
- ✅ CORS 설정 확인
- ✅ Helmet 보안 헤더 활성화

## 💡 최적화 팁

### 1. Free Tier 제한사항
- 15분 무활동 시 sleep 모드
- 750시간/월 무료 사용 시간

### 2. Sleep 방지 (선택사항)
- UptimeRobot 같은 서비스로 주기적 ping
- 또는 Render Paid Plan 사용

### 3. 성능 최적화
- Gzip 압축 활성화 ✅ (이미 구현됨)
- 정적 파일 캐싱 ✅ (이미 구현됨)
- WebSocket 연결 최적화 ✅ (이미 구현됨)

## 📱 사용자 접근

배포 완료 후:

1. **모바일 센서 클라이언트:**
   - `https://your-app.onrender.com/sensor.html`
   - QR 코드로 접속 가능

2. **게임 URL:**
   - 각 게임 페이지에서 자동으로 QR 생성
   - 모바일에서 스캔하여 연결

3. **개발자 문서:**
   - `https://your-app.onrender.com/developer`
   - 35개 개발 문서 + AI 챗봇

---

## 🎉 배포 완료!

모든 단계를 완료했다면 Sensor Game Hub v6.0이 성공적으로 배포되었습니다!

**다음 단계:**
- 실제 게임 테스트
- 모바일 센서 연동 확인
- AI 챗봇 기능 확인
- 사용자 피드백 수집

**문제 발생 시:**
- Render 로그 확인
- GitHub Issues 등록
- 환경 변수 재확인
