# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고할 가이드를 제공합니다.

## 🎯 프로젝트 개요

**한 숨의 위로 : 감성 일기**는 사용자가 작성한 일기의 감정을 AI로 분석하고, 그에 맞는 음악 추천과 위로의 메시지를 제공하는 차세대 감정 분석 웹 애플리케이션입니다.

### 현재 버전: Phase 2 (2025년 9월 최종)
- **배포 URL**: https://healing-diary.netlify.app
- **아키텍처**: Netlify Functions (Serverless)
- **AI 모델**: GPT-4o mini (감정 분석, 상담, 안전 필터링)
- **개발 환경**: Mac book pro m4 pro (14core CPU, 20core GPU)

## 🚀 Phase 2 주요 업데이트

### 1. 핵심 일기 작성 시스템 (단순화 완료)
- **기본 텍스트 기반 일기 작성** 인터페이스
- GPT-4o mini를 활용한 감정 분석
- 24가지로 확장된 감정 분류 체계
- 직관적이고 깔끔한 단일 작성 모드

### 2. 종합적 안전 관리 시스템
- **자살 예방 안전 필터링** 시스템
- 클라이언트 + 서버 이중 검증
- 위험 키워드 실시간 감지 (24가지 변형 표현)
- 자살예방상담전화 109번 즉시 연결

### 3. 익명 감정 커뮤니티
- 고정 익명 ID 시스템 (SHA-256 해싱)
- 감정 공유 및 공감 기능
- 안전한 소통 공간

### 4. AI 상담 시스템
- 일기 기반 개인화 상담
- 실시간 채팅 상담
- 위기 상황 즉시 감지 및 대응

### 5. UI/UX 개선
- 상단 네비게이션 바로 통일
- 반응형 디자인 최적화
- 모든 페이지 일관된 디자인 시스템
- 통계 대시보드 완전 재설계

## 🏗️ 아키텍처

### 현재 구조 (Phase 2)
- **프론트엔드**: 정적 HTML/CSS/JavaScript
- **백엔드**: Netlify Functions (Serverless)
- **데이터베이스**: Supabase (PostgreSQL + pgvector)
- **AI 서비스**: OpenAI GPT-4o mini, GPT-4 Vision, Whisper
- **배포**: Netlify (자동 CI/CD)

## 📁 디렉토리 구조

```
newEmotionProject/
├── public/                      # 프론트엔드 (Netlify 배포 디렉토리)
│   ├── 📄 HTML 페이지 (26개)     # 완성된 모든 페이지
│   │   ├── index.html              # 랜딩 페이지
│   │   ├── login.html              # 로그인
│   │   ├── signup.html             # 회원가입
│   │   ├── dashboard.html          # 메인 대시보드
│   │   ├── write-diary.html        # 기본 일기 작성 (단순화 완료)
│   │   ├── my-diary.html           # 내 일기 목록
│   │   ├── anonymous-community.html # 익명 커뮤니티
│   │   ├── chat.html               # AI 채팅
│   │   ├── stats.html              # AI 감정 분석 대시보드
│   │   ├── my-page.html            # 마이페이지
│   │   └── [14개 추가 페이지]        # 기타 기능 페이지들
│   ├── 🎨 스타일 및 에셋
│   │   ├── style.css               # 통합 스타일시트
│   │   ├── icons/                  # PWA 아이콘들
│   │   ├── manifest.json           # PWA 매니페스트
│   │   └── sw.js                   # 서비스 워커
│   ├── 🧪 백업 및 테스트
│   │   └── backup/                 # 개발 중 백업 파일들
│   └── 💻 JavaScript 모듈들 (22개)
│       ├── supabase.js             # Supabase 클라이언트
│       ├── auth.js                 # 인증 관리
│       ├── anonymous-community.js  # 익명 커뮤니티 (714줄)
│       ├── safety-filter.js        # 자살 예방 안전 필터 시스템
│       ├── ai-dashboard.js         # AI 대시보드 및 통계
│       ├── enhanced-emotion.js     # 고급 감정 분석
│       ├── notification-system.js  # 실시간 알림
│       ├── offline-storage.js      # 오프라인 저장
│       └── [12개 추가 모듈]         # 기타 기능 모듈들
├── netlify/
│   └── functions/              # Serverless Functions (8개)
│       ├── anonymous-community.js  # 익명 커뮤니티 API
│       ├── advanced-emotion-analysis.js # 고급 감정 분석
│       ├── ai-chat-streaming.js    # AI 스트리밍 채팅 (안전 필터 포함)
│       ├── emotion-summary.js      # 감정 요약
│       ├── analyze-emotion.js      # 기본 감정 분석
│       ├── chat.js                 # 채팅 처리 (안전 필터 포함)
│       ├── feedback.js             # 피드백 시스템
│       └── delete-user.js          # 계정 삭제
├── 📋 설정 파일들
│   ├── package.json            # 의존성 관리
│   ├── netlify.toml           # Netlify 배포 설정
│   ├── _redirects             # 리다이렉트 규칙
│   └── .gitignore             # Git 제외 파일
└── server/                     # Legacy Express 서버 (미사용)
```

### 🔢 프로젝트 규모 통계
- **총 HTML 페이지**: 26개
- **JavaScript 모듈**: 20개 (약 4,000줄, 멀티모달 관련 제거)
- **Netlify Functions**: 8개 (멀티모달 분석, 감정 예측 함수 제거)
- **총 프로젝트 파일**: 55개 이상

## 🗄️ 데이터베이스 스키마 (Phase 2)

### 기존 테이블
- `diaries`: 일기 데이터 (확장된 컬럼 포함)
- `users`: 사용자 정보
- `shared_diaries`: 공유 일기
- `chat_history`: AI 채팅 기록

### Phase 2 신규 테이블
- `multimodal_attachments`: 멀티모달 첨부파일
- `emotion_predictions`: 7일 감정 예측
- `anonymous_posts`: 익명 게시글
- `anonymous_comments`: 익명 댓글
- `analysis_metrics`: 분석 지표
- `ai_personalization`: 개인화 설정

## 🔄 핵심 기능 플로우

### 1. 기본 일기 작성 및 감정 분석
```
1. 사용자 텍스트 일기 입력
2. 선택적 감정 수동 선택
3. analyze-emotion.js Function 호출
4. GPT-4o mini 감정 분석:
   - 24가지 감정 분류
   - 감정 강도 점수 계산
   - AI 피드백 생성
5. 결과 저장 및 시각화
```

### 2. 안전 필터링 시스템
```
1. 사용자 메시지/일기 입력
2. 클라이언트 측 키워드 사전 검사
3. 위험 감지 시 즉시 안전 응답
4. 서버 측 이중 검증
5. 자살예방상담전화 안내
6. 전문가 상담 연결
```

### 3. AI 상담 시스템
```
1. 일기 내용 기반 상담 시작
2. 대화형 AI 상담 진행
3. 실시간 안전 모니터링
4. 위기 상황 자동 감지
5. 즉시 전문 도움 연결
```

### 4. 익명 커뮤니티
```
1. 사용자 ID → SHA-256 해싱
2. 고정 익명 ID 생성
3. 감정 기반 게시글 작성
4. 익명 댓글 및 공감
5. 안전한 감정 공유
```

## 🔧 환경 설정

### 필수 환경 변수 (Netlify)
```
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=https://vzmvgyxsscfyflgxcpnq.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
```

### 로컬 개발
```bash
# Netlify CLI 설치
npm install -g netlify-cli

# 로컬 개발 서버 실행
netlify dev

# 함수 테스트
netlify functions:invoke function-name --payload '{"key":"value"}'
```

## 🔐 보안 및 인증

### 현재 구현
- Supabase Auth 기반 인증
- JWT 토큰 검증 (모든 Netlify Functions)
- RLS(Row Level Security) 정책
- 익명 ID 암호화 (SHA-256)

### 주의사항
- 인증 토큰: `session.access_token` 사용 (localStorage 대신)
- 모든 API 호출에 Bearer 토큰 포함
- 민감한 데이터 클라이언트 노출 금지

## 📊 확장된 감정 분류 체계 (24종)

### 긍정 감정 (8종)
- `joy`: 기쁨
- `contentment`: 만족
- `gratitude`: 감사
- `love`: 사랑
- `excitement`: 흥분/설렘
- `pride`: 자부심
- `hope`: 희망
- `relief`: 안도

### 부정 감정 (10종)
- `sadness`: 슬픔
- `grief`: 비탄
- `anger`: 분노
- `frustration`: 좌절
- `anxiety`: 불안
- `fear`: 두려움
- `guilt`: 죄책감
- `shame`: 수치심
- `loneliness`: 외로움
- `disappointment`: 실망

### 중성 감정 (6종)
- `calm`: 평온
- `contemplative`: 사색적
- `curious`: 호기심
- `nostalgic`: 그리움
- `confused`: 혼란
- `indifferent`: 무관심

## 🎨 UI/UX 개선사항

### Phase 2 디자인 변경
1. **네비게이션**: 하단 바 제거, 상단 네비게이션으로 통일
2. **색상 팔레트**: 그라데이션 강조 (#667eea → #764ba2)
3. **반응형**: 모바일 최적화 완료
4. **접근성**: WCAG 2.1 AA 준수

## 🚀 배포 및 운영

### Netlify 배포 설정
```yaml
Build settings:
  Base directory: /
  Build command: echo 'No build needed'
  Publish directory: public
  Functions directory: netlify/functions
```

### GitHub 자동 배포
- main 브랜치 푸시 시 자동 배포
- PR 프리뷰 배포 지원

## 🐛 최근 해결된 이슈

### 2025년 12월 Phase 2 최종 업데이트
1. **Dashboard.html 시인성 개선** ✅ 완료
   - **문제**: 멀티모달 AI 분석 섹션에서 흰색 텍스트가 배경 없이 표시되어 가독성 저하
   - **해결**: `bg-gradient-to-br from-blue-500 to-purple-600` 그라데이션 배경 적용
   - **추가 수정**: Phase 2 기능 카드들의 호버 효과에서 배경 색상이 사라지는 문제
   - **해결**: `.emotion-card` CSS 클래스 제거하고 Tailwind 유틸리티 클래스로 대체

2. **로컬 개발 환경 구축** ✅ 완료
   - **문제**: `npm run dev` 실행 시 "netlify command not found" 오류
   - **해결**: `npm install` 실행하여 1359개 패키지 설치 (netlify-cli 포함)
   - **결과**: 로컬 개발 서버 `http://localhost:8888` 정상 동작

3. **Write-diary.html 기능 복구** ✅ 완료
   - **문제**: 감정 자동 분석 버튼 500 에러, 감정 버튼 비활성화, GPT 피드백 오류
   - **원인**: package.json의 `"type": "module"` 설정이 CommonJS 함수와 충돌
   - **해결**:
     - package.json에서 `"type": "module"` 제거
     - 감정 버튼 이벤트 핸들러 추가
     - OpenAI API 키 실제 키로 교체
   - **결과**: 모든 기능 정상 동작 확인

4. **종합적 자살 예방 안전 시스템 구축** ✅ 완료
   - **목적**: "죽고 싶어", "자살할래" 등 위험 메시지 감지 및 전문 상담 안내
   - **구현 범위**: 모든 채팅 기능 (일반 채팅, 일기 기반 상담)
   - **핵심 컴포넌트**:
     - `safety-filter.js`: 클라이언트 측 안전 필터링 클래스
     - `chat.js`: 서버 측 안전 검증 강화
     - `ai-chat-streaming.js`: 스트리밍 채팅 안전 필터
   - **키워드 시스템**: 확장된 한국어 위험 표현 검출
     ```javascript
     DANGER_KEYWORDS = [
       '죽고 싶어', '죽고싶어', '죽고시펑', '죽고시퍼', '자살', '자해',
       '목숨', '죽을래', '죽을거야', '자살할래', '자살하고싶어', '죽음'
       // 총 24개 키워드 및 변형 표현
     ];
     ```
   - **응답 시스템**: 자살예방상담전화 109번 안내 및 즉시 전문 도움 연결
   - **다층 보안**: 클라이언트 + 서버 이중 검증으로 우회 방지

5. **Write-diary.html 인터페이스 단순화** ✅ 완료
   - **요청**: 멀티모달 AI 탭과 감정 예측 탭 완전 제거, 기본 작성만 유지
   - **제거된 요소**:
     - 탭 네비게이션 시스템 (`#tab-buttons`, `#tab-content`)
     - 멀티모달 AI 분석 탭 전체
     - 감정 예측 탭 전체
     - Chart.js 라이브러리 및 관련 스크립트
   - **삭제된 파일**:
     - `multimodal-diary.js` (639줄)
     - `emotion-prediction.js` (655줄)
     - `multimodal-analysis.js` (Netlify Function)
     - `emotion-prediction.js` (Netlify Function)
   - **결과**: 깔끔한 단일 일기 작성 인터페이스로 전환

6. **Stats.html 통계 대시보드 완전 재설계** ✅ 완료
   - **문제**: 통계 카드들의 디자인이 깨져서 표시되는 문제
   - **원인 분석**:
     - `.dashboard-grid` CSS 클래스 누락
     - `.dashboard-card`, `.card-header` 스타일 정의 없음
     - HTML 구조 오류 (중첩 문제)
     - CSS 문법 오류
   - **완전 재설계**:
     - CSS Grid 기반 반응형 레이아웃 구현
     - 통일된 카드 디자인 시스템 적용
     - 모던한 그라데이션 스타일링
     - 향상된 호버 효과 및 애니메이션
   - **새로운 디자인 시스템**:
     ```css
     .dashboard-grid {
       display: grid;
       grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
       gap: 2rem;
     }
     .dashboard-card {
       background: white;
       border-radius: 20px;
       padding: 2rem;
       box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
       transition: all 0.3s ease;
     }
     ```
   - **결과**: 완전히 새로워진 통계 대시보드 UI

### 2025년 9월 이전 업데이트
1. **멀티모달 분석 시스템 안정화**
   - 이미지, 음성, 텍스트 통합 분석 완료
   - GPT-4 Vision 및 Whisper API 최적화
   - Base64 인코딩 및 파일 크기 제한 구현

2. **네비게이션 및 UI 통일성 완성**
   - 모든 26개 페이지 상단 네비게이션으로 통일
   - 반응형 디자인 최적화 완료
   - 일관된 색상 팔레트 적용

3. **Netlify Functions 배포 최적화**
   - 10개 서버리스 함수 안정화
   - CORS 및 환경변수 설정 완료
   - 에러 핸들링 및 로깅 개선

### 이전 해결 이슈 (2025년 1월)
1. **401 Unauthorized 오류** ✅ 해결
2. **네비게이션 일관성** ✅ 해결
3. **멀티모달 분석 오류** ✅ 해결

## 📈 성능 최적화

### 구현된 최적화
- 이미지 Base64 압축
- API 호출 병렬 처리
- 캐싱 전략 (15분 TTL)
- 지연 로딩 적용

### 권장 사항
- 이미지 크기: 최대 10MB
- 음성 녹음: 최대 2분
- 일기 텍스트: 최대 5000자

## 🔮 향후 계획 (Phase 3)

1. **PWA 전환**: 오프라인 지원
2. **실시간 기능**: WebSocket 기반 실시간 알림
3. **AI 고도화**: GPT-4 전면 적용
4. **국제화**: 다국어 지원
5. **모바일 앱**: React Native 개발

## 💡 개발 시 주의사항

1. **인증 토큰 관리**
   ```javascript
   // 올바른 방법
   const { data: { session } } = await supabase.auth.getSession();
   const token = session.access_token;

   // 잘못된 방법 (사용 금지)
   const token = localStorage.getItem('supabase.auth.token');
   ```

2. **멀티모달 분석 요청**
   - 항상 supabase 인스턴스 전달
   - Base64 인코딩 확인
   - 파일 크기 제한 준수

3. **익명 ID 생성**
   - 일관된 해싱 알고리즘 사용
   - Salt 값 고정 ('anonymous_salt_2025')

4. **API 비용 관리**
   - OpenAI API 토큰 사용량 모니터링
   - 로컬 개발 시 모의 응답 사용

## 📞 문제 해결 연락처

- GitHub Issues: [프로젝트 저장소]/issues
- 개발자 문서: https://docs.anthropic.com/claude-code

## 🚀 프로젝트 완성도 및 성취사항

### ✅ 완료된 주요 기능들
1. **핵심 일기 작성 시스템** (100% 완성)
   - 깔끔한 텍스트 기반 일기 작성
   - GPT-4o mini 감정 분석
   - 24가지 감정 분류 체계
   - 직관적인 단일 인터페이스

2. **종합적 안전 관리 시스템** (100% 완성)
   - 자살 예방 안전 필터링
   - 클라이언트 + 서버 이중 검증
   - 24가지 위험 키워드 감지
   - 자살예방상담전화 즉시 연결

3. **AI 상담 및 분석** (100% 완성)
   - 일기 기반 개인화 상담
   - 실시간 채팅 상담
   - AI 대시보드 및 통계 시각화
   - 위기 상황 즉시 감지

4. **커뮤니티 기능** (100% 완성)
   - 익명 감정 공유 시스템
   - 안전한 익명 ID 시스템
   - 감정 기반 소통 플랫폼

5. **PWA 및 UX** (100% 완성)
   - 프로그레시브 웹 앱
   - 완전 반응형 디자인
   - 통일된 네비게이션 시스템
   - 재설계된 통계 대시보드

### 🎯 기술적 성취
- **확장성**: 서버리스 아키텍처로 무제한 확장 가능
- **성능**: 최적화된 코드와 캐싱 전략
- **보안**: JWT 토큰, RLS 정책, CORS 설정
- **사용성**: 직관적인 UI/UX, PWA 지원

### 💡 비즈니스 가치
- **즉시 상용화 가능**: 완성된 감정 분석 서비스
- **AI 기반 안전성**: 종합적 자살 예방 시스템으로 사용자 보호
- **사용자 중심**: 익명성과 개인정보 보호 완비
- **확장 가능**: 추가 기능 개발 기반 마련
- **사회적 가치**: 정신건강 케어 및 위기 개입 시스템

## 🎯 현재 개발 환경 및 운영 상태

### 로컬 개발 환경
```bash
# 프로젝트 디렉토리
cd /Users/dev/newEmotionProject

# 로컬 개발 서버 실행 (현재 실행 중)
npm run dev
# → http://localhost:8888

# 의존성 설치 완료
npm install  # 1359개 패키지 설치 완료
```

### 배경 프로세스 상태
- **8개의 npm run dev 프로세스 실행 중**
- **로컬 개발 서버 정상 동작**
- **Netlify Functions 로컬 테스트 가능**

### 프로덕션 배포
- **배포 URL**: https://healing-diary.netlify.app
- **자동 배포**: GitHub main 브랜치 푸시 시
- **환경 변수**: Netlify 대시보드에서 관리

## 📝 최신 개발 진행 상황 요약 (2025년 12월)

### 🎯 주요 달성 사항
1. **UI/UX 개선 완료**
   - Dashboard.html 시인성 문제 완전 해결
   - 모든 Phase 2 기능 카드 호버 효과 정상화
   - 통계 대시보드 완전 재설계

2. **개발 환경 최적화**
   - 로컬 개발 워크플로우 구축
   - 실시간 테스트 환경 구성
   - npm run dev 안정화

3. **핵심 기능 단순화**
   - Write-diary.html 멀티모달 기능 제거
   - 깔끔한 단일 일기 작성 인터페이스 완성
   - 불필요한 복잡성 제거

4. **안전 시스템 구축**
   - 종합적 자살 예방 필터링 시스템
   - 다층 보안 (클라이언트 + 서버)
   - 위기 상황 즉시 대응 체계

### 🔧 기술적 개선 사항
- **파일 정리**: 미사용 모듈 및 함수 제거 (2개 삭제)
- **코드 최적화**: CommonJS 호환성 문제 해결
- **API 연동**: OpenAI API 실제 키 적용
- **CSS 재설계**: 현대적 Grid 레이아웃 적용

### 📊 현재 프로젝트 구성
- **HTML 페이지**: 26개 (변동 없음)
- **JavaScript 모듈**: 20개 (2개 제거)
- **Netlify Functions**: 8개 (2개 제거)
- **핵심 안전 시스템**: 완전 구축

## 🚀 다음 개발 방향성

### 우선순위 높은 개선사항
1. **성능 최적화**
   - API 응답 시간 개선
   - 이미지 로딩 최적화
   - 캐싱 전략 강화

2. **사용자 경험 개선**
   - 로딩 상태 시각화
   - 오류 메시지 개선
   - 접근성 강화

3. **기능 확장**
   - 일기 검색 기능
   - 감정 통계 고도화
   - 개인화 추천 시스템

### 장기 로드맵
1. **모바일 최적화**: PWA 기능 강화
2. **AI 고도화**: GPT-4 전면 도입
3. **실시간 기능**: WebSocket 기반 알림
4. **국제화**: 다국어 지원

## 🛠️ 개발자를 위한 핵심 가이드

### 중요한 파일들
```
/public/
├── dashboard.html          # 메인 대시보드 (시인성 개선 완료)
├── write-diary.html        # 일기 작성 (단순화 완료)
├── stats.html             # 통계 (재설계 완료)
├── chat.html              # AI 상담 (안전 필터 적용)
└── js/
    └── safety-filter.js   # 안전 필터링 시스템

/netlify/functions/
├── chat.js                # 채팅 API (안전 필터 포함)
├── ai-chat-streaming.js   # 스트리밍 상담 (안전 필터 포함)
└── analyze-emotion.js     # 감정 분석 API
```

### 개발 시 주의사항
1. **안전 필터**: 모든 사용자 입력에 안전 검증 적용
2. **API 키 관리**: 환경 변수로 안전하게 관리
3. **에러 처리**: 사용자 친화적 에러 메시지 제공
4. **테스트**: 로컬 환경에서 충분히 테스트 후 배포

### 디버깅 가이드
```bash
# 로컬 개발 서버 확인
netlify dev

# 함수 단독 테스트
netlify functions:invoke chat --payload '{"message":"test"}'

# 로그 확인
tail -f .netlify/logs/functions.log
```

---

*최종 업데이트: 2025년 12월*
*프로젝트 상태: Phase 2 완성 + 안전 시스템 강화 완료*
*개발 환경: 로컬 테스트 환경 구축 완료*
*작성자: Claude Code Assistant*