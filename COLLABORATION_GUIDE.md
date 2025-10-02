# 🤝 Sensor Game Hub - 협업 가이드

## 📋 목차
1. [프로젝트 개요](#-프로젝트-개요)
2. [브랜치 전략](#-브랜치-전략)
3. [개발 워크플로우](#-개발-워크플로우)
4. [코드 리뷰 가이드](#-코드-리뷰-가이드)
5. [커밋 컨벤션](#-커밋-컨벤션)
6. [개발 환경 설정](#-개발-환경-설정)
7. [문제 해결](#-문제-해결)

---

## 🎯 프로젝트 개요

**Sensor Game Hub v6.0**은 모바일 센서를 활용한 인터랙티브 게임 플랫폼입니다.

### 주요 기능
- 🎮 센서 기반 게임 (Solo/Dual/Multi)
- 🤖 AI 기반 게임 생성 및 유지보수
- 📱 실시간 센서 데이터 전송
- 🔧 게임 버전 관리 시스템
- 💬 AI 챗봇 개발 도구

### 기술 스택
- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: HTML5, CSS3, JavaScript
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude (Anthropic), LangChain
- **Deployment**: Render.com

---

## 🌿 브랜치 전략

### 브랜치 구조

```
main (프로덕션)
  └── develop (통합 개발)
        ├── minhyuk (민혁 개인 작업)
        ├── jaewon (재원 개인 작업)
        └── jimin (지민 개인 작업)
```

### 브랜치별 역할

#### 📌 `main` 브랜치
- **용도**: 프로덕션 배포용
- **보호**: 직접 푸시 금지
- **병합**: `develop` 브랜치에서만 PR을 통해 병합
- **배포**: Render.com 자동 배포

#### 📌 `develop` 브랜치
- **용도**: 통합 개발 및 테스트
- **병합**: 개인 브랜치에서 PR을 통해 병합
- **규칙**: 모든 기능은 develop에서 먼저 테스트 후 main으로 병합

#### 📌 개인 브랜치 (`minhyuk`, `jaewon`, `jimin`)
- **용도**: 개인 작업 공간
- **자유도**: 자유롭게 커밋 가능
- **병합 전**: develop 브랜치와 충돌 해결 필수

---

## 🔄 개발 워크플로우

### 1. 초기 설정

```bash
# 저장소 클론
git clone https://github.com/cmhblue1225/sensorchatbot.git
cd sensorchatbot

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에 필요한 값 입력

# 개발 서버 실행
npm start
# → http://localhost:3000
```

### 2. 새 기능 개발 시작

```bash
# develop 브랜치로 이동 및 최신 상태 업데이트
git checkout develop
git pull origin develop

# 개인 브랜치로 이동
git checkout minhyuk  # 또는 jaewon, jimin

# 최신 develop 내용 가져오기
git merge develop

# 또는 rebase 사용 (히스토리 깔끔)
git rebase develop
```

### 3. 작업 진행

```bash
# 코드 작성 및 테스트
npm start

# 변경사항 확인
git status
git diff

# 스테이징 및 커밋
git add [파일명]
git commit -m "feat: 새 기능 추가"
```

### 4. 개인 브랜치에 푸시

```bash
# 개인 브랜치에 푸시
git push origin minhyuk  # 또는 jaewon, jimin
```

### 5. develop에 통합

```bash
# GitHub에서 Pull Request 생성
# minhyuk → develop

# 또는 로컬에서 병합
git checkout develop
git pull origin develop
git merge minhyuk
git push origin develop
```

### 6. main에 배포

```bash
# develop이 충분히 테스트된 후
git checkout main
git pull origin main
git merge develop
git push origin main

# → Render.com 자동 배포 시작
```

---

## 👀 코드 리뷰 가이드

### Pull Request 작성

#### PR 제목 형식
```
[유형] 간단한 설명

예시:
[feat] AI 게임 생성기 추가
[fix] 센서 연결 오류 수정
[docs] README 업데이트
```

#### PR 본문 템플릿
```markdown
## 변경 사항
- 주요 변경 내용 1
- 주요 변경 내용 2

## 테스트 방법
1. npm start 실행
2. http://localhost:3000 접속
3. 특정 기능 테스트

## 체크리스트
- [ ] 로컬에서 테스트 완료
- [ ] 코드 스타일 준수
- [ ] 문서 업데이트 (필요시)
- [ ] 충돌 해결 완료
```

### 리뷰어 가이드

#### ✅ 확인 사항
1. **기능 동작**: 설명된 대로 작동하는가?
2. **코드 품질**: 읽기 쉽고 유지보수 가능한가?
3. **성능**: 불필요한 리소스 사용은 없는가?
4. **보안**: 민감 정보 노출은 없는가?
5. **테스트**: 충분히 테스트되었는가?

#### 💬 리뷰 코멘트 예시
```
# 좋은 리뷰
👍 좋은 접근입니다! 다만 X 부분을 Y로 개선하면 더 효율적일 것 같습니다.

# 개선 요청
🤔 이 부분에서 에러가 발생할 수 있을 것 같은데, try-catch를 추가하면 어떨까요?

# 질문
❓ 이 로직을 선택한 이유가 궁금합니다. Z 방식도 고려해보셨나요?
```

---

## 📝 커밋 컨벤션

### 커밋 메시지 형식

```
<type>: <subject>

<body> (선택사항)

<footer> (선택사항)
```

### Type 종류

| Type | 설명 | 예시 |
|------|------|------|
| `feat` | 새 기능 추가 | `feat: AI 챗봇 기능 추가` |
| `fix` | 버그 수정 | `fix: 센서 연결 오류 해결` |
| `docs` | 문서 수정 | `docs: README 업데이트` |
| `style` | 코드 스타일 변경 | `style: 코드 포맷팅 적용` |
| `refactor` | 코드 리팩토링 | `refactor: 게임 로직 개선` |
| `test` | 테스트 추가/수정 | `test: 센서 연결 테스트 추가` |
| `chore` | 빌드/설정 변경 | `chore: 의존성 업데이트` |

### 커밋 메시지 예시

```bash
# 좋은 예시
git commit -m "feat: 틸트 브레이커 게임 추가"
git commit -m "fix: 패들 충돌 물리 로직 개선"
git commit -m "docs: 협업 가이드 문서 작성"

# 나쁜 예시 (지양)
git commit -m "수정"
git commit -m "테스트"
git commit -m "ㅇㅇ"
```

---

## 💻 개발 환경 설정

### 필수 환경 변수

`.env` 파일 생성 후 다음 값을 설정하세요:

```env
# Supabase 설정
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Claude API 설정
ANTHROPIC_API_KEY=your_anthropic_api_key

# 서버 설정
PORT=3000
NODE_ENV=development
```

### 로컬 개발 서버

```bash
# 개발 서버 시작
npm start

# 접속 URL
http://localhost:3000                # 메인 페이지
http://localhost:3000/developer      # 개발자 도구
http://localhost:3000/game-manager   # 게임 관리자
http://localhost:3000/sensor.html    # 센서 클라이언트
```

### 디렉토리 구조

```
sensorchatbot/
├── server/                  # 서버 코드
│   ├── index.js            # 메인 서버
│   ├── SessionManager.js   # 세션 관리
│   ├── GameScanner.js      # 게임 스캔
│   ├── GameMaintenanceManager.js  # 게임 유지보수
│   └── InteractiveGameGenerator.js # AI 게임 생성
├── public/                 # 클라이언트 파일
│   ├── js/
│   │   └── SessionSDK.js   # 클라이언트 SDK
│   ├── games/              # 게임 디렉토리
│   └── sensor.html         # 센서 페이지
├── supabase/              # DB 마이그레이션
│   └── migrations/
├── docs/                  # 문서
├── .env                   # 환경 변수 (git 제외)
├── package.json
└── README.md
```

---

## 🔧 문제 해결

### 자주 발생하는 문제

#### 1. Socket.IO 연결 오류

**증상**: `ERR_EMPTY_RESPONSE` 또는 `io is not defined`

**원인**: node_modules가 설치되지 않음

**해결**:
```bash
npm install
npm start
```

#### 2. 브랜치 충돌

**증상**: `git pull` 시 충돌 발생

**해결**:
```bash
# 1. 변경사항 임시 저장
git stash

# 2. 최신 코드 가져오기
git pull origin develop

# 3. 저장한 변경사항 복원
git stash pop

# 4. 충돌 해결 후
git add [충돌 파일]
git commit -m "fix: 충돌 해결"
```

#### 3. 버전 불일치

**증상**: 게임 버전이 DB와 맞지 않음

**해결**:
```bash
# 서버 재시작으로 캐시 초기화
# Ctrl+C로 서버 종료 후
npm start
```

#### 4. 환경 변수 오류

**증상**: `Cannot find module 'dotenv'` 또는 API 키 오류

**해결**:
```bash
# 1. 의존성 재설치
npm install

# 2. .env 파일 확인
cat .env

# 3. 필요시 .env.example 참고하여 수정
```

### 도움 요청

문제가 해결되지 않을 때:

1. **GitHub Issues** 생성
   - 상세한 오류 메시지 포함
   - 재현 방법 설명
   - 환경 정보 (OS, Node 버전 등)

2. **팀 채팅** 문의
   - 스크린샷 첨부
   - 시도한 해결 방법 공유

3. **코드 리뷰** 요청
   - PR에 `help wanted` 라벨 추가
   - 구체적인 질문 작성

---

## 📚 참고 자료

### 프로젝트 문서
- [README.md](./README.md) - 프로젝트 소개
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - 개발자 가이드
- [GAME_TEMPLATE.html](./GAME_TEMPLATE.html) - 게임 개발 템플릿

### 외부 문서
- [Git 브랜치 전략](https://nvie.com/posts/a-successful-git-branching-model/)
- [커밋 메시지 컨벤션](https://www.conventionalcommits.org/)
- [Socket.IO 문서](https://socket.io/docs/)
- [Supabase 문서](https://supabase.com/docs)

---

## 🎉 협업 모범 사례

### ✅ DO (권장)
- 작은 단위로 자주 커밋
- 의미 있는 커밋 메시지 작성
- 코드 리뷰 적극 참여
- 문서 업데이트 (코드 변경 시)
- 테스트 후 PR 생성
- 충돌 조기 해결

### ❌ DON'T (지양)
- 한 번에 너무 많은 변경
- 모호한 커밋 메시지
- main 브랜치 직접 푸시
- 테스트 없이 병합
- 의존성 무단 추가
- .env 파일 커밋

---

## 🆘 긴급 상황 대응

### 프로덕션 버그 발생 시

1. **즉시 알림**
   ```bash
   # 팀 채팅에 긴급 태그
   @all 프로덕션 버그 발견!
   ```

2. **hotfix 브랜치 생성**
   ```bash
   git checkout main
   git checkout -b hotfix/버그명
   # 버그 수정
   git commit -m "hotfix: 긴급 버그 수정"
   git push origin hotfix/버그명
   ```

3. **긴급 배포**
   ```bash
   # PR 생성 후 즉시 병합
   git checkout main
   git merge hotfix/버그명
   git push origin main

   # develop에도 반영
   git checkout develop
   git merge hotfix/버그명
   git push origin develop
   ```

---

## 📞 연락처

### 팀원
- **민혁**: [@minhyuk] - AI 시스템, 게임 유지보수
- **재원**: [@jaewon] - 게임 개발, 프론트엔드
- **지민**: [@jimin] - 센서 시스템, 백엔드

### 협업 채널
- **GitHub**: https://github.com/cmhblue1225/sensorchatbot
- **Issues**: https://github.com/cmhblue1225/sensorchatbot/issues
- **Discussions**: https://github.com/cmhblue1225/sensorchatbot/discussions

---

**Happy Coding! 🚀**

*마지막 업데이트: 2025-10-02*
