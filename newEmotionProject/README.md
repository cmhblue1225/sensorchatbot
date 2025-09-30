# 한 숨의 위로: 감성 일기 📝

> AI 기반 감정 분석으로 당신의 마음을 이해하고 위로하는 지능형 일기 서비스

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-production-green.svg)
![PWA](https://img.shields.io/badge/PWA-enabled-orange.svg)

## 🌟 주요 기능

### 📊 AI 감정 분석
- **OpenAI GPT 기반** 정확한 감정 분석
- **8가지 세분화된 감정** 분류 (행복, 슬픔, 분노, 불안, 보통, 신남, 평온, 혼란)
- **오프라인 키워드 분석** 지원으로 네트워크 없어도 기본 분석 가능
- **감정 강도 측정**으로 더 정확한 상태 파악

### 🎵 개인화된 위로
- **감정 맞춤형 음악 추천**
- **AI 생성 위로 메시지**
- **감정별 활동 제안**
- **실시간 AI 채팅 상담**

### 📱 현대적 사용자 경험
- **PWA 지원** - 앱처럼 설치 가능
- **오프라인 작동** - 네트워크 없어도 일기 작성
- **완전 반응형** - 모든 기기에서 완벽 작동
- **다크모드 지원** (계획 중)

### 🔍 지능형 검색
- **키워드, 감정, 날짜별** 고급 검색
- **태그 시스템** (#해시태그 지원)
- **유사 감정 일기** 찾기
- **검색 기록 및 제안**

### 📈 감정 통계 및 분석
- **인터랙티브 차트**로 감정 변화 추적
- **일별/주별/월별** 감정 패턴 분석
- **감정 개선 트렌드** 모니터링
- **성과 달성 알림**

### 🔔 스마트 알림
- **일기 작성 리마인더**
- **감정 기반 격려 메시지**
- **연속 작성 성과 알림**
- **사용자 정의 알림 시간**

## 🏗️ 기술 스택

### Frontend
- **Vanilla JavaScript** (ES6+ 모듈)
- **HTML5/CSS3** (반응형 디자인)
- **Chart.js** (데이터 시각화)
- **PWA** (Progressive Web App)

### Backend
- **Netlify Functions** (서버리스)
- **OpenAI API** (GPT-3.5-turbo)
- **Supabase** (데이터베이스, 인증, 실시간)

### Infrastructure
- **Netlify** (호스팅, CDN, CI/CD)
- **GitHub Actions** (자동 배포)
- **PostgreSQL** (Supabase)

## 🚀 배포 및 설정

### 환경 변수 설정

Netlify 대시보드에서 다음 환경 변수를 설정하세요:

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_for_user_deletion
```

### Netlify 배포

1. **GitHub 연결**
   ```bash
   git add .
   git commit -m "🚀 Initial release: AI-powered emotion diary"
   git push origin main
   ```

2. **Netlify 사이트 생성**
   - Netlify 대시보드에서 "New site from Git" 선택
   - GitHub 리포지토리 연결 (cmhblue1225/AI-Diary)
   - 빌드 설정 자동 감지됨 (`netlify.toml` 기반)

3. **환경 변수 설정**
   - Site settings > Environment variables에서 위 변수들 추가

4. **배포 완료**
   - 자동 빌드 및 배포
   - HTTPS 인증서 자동 생성
   - PWA 기능 활성화

### 로컬 개발

```bash
# 의존성 설치
npm install

# Netlify CLI로 로컬 개발 서버 실행
npx netlify dev

# 또는 간단한 HTTP 서버
cd public && python -m http.server 8000
```

## 📊 데이터베이스 스키마

### 주요 테이블

```sql
-- 일기 테이블
CREATE TABLE diaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    emotion TEXT CHECK (emotion IN ('happy', 'sad', 'angry', 'anxious', 'neutral', 'excited', 'peaceful', 'confused')),
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Seoul', now())
);

-- 채팅 기록 테이블
CREATE TABLE chat_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    diary_id BIGINT,
    role TEXT CHECK (role IN ('user', 'assistant')),
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 공유 일기 테이블
CREATE TABLE shared_diaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diary_id UUID REFERENCES diaries(id),
    user_id UUID REFERENCES auth.users(id),
    emotion TEXT,
    content TEXT,
    feedback TEXT,
    music TEXT,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

## 🎨 주요 화면

- **랜딩 페이지** - 애니메이션과 PWA 설치 프롬프트
- **일기 작성** - 실시간 감정 분석 + 음악 추천
- **일기 목록** - 감정별 필터링 + 고급 검색
- **AI 채팅** - 24/7 감정 상담 서비스
- **감정 통계** - 인터랙티브 데이터 시각화
- **커뮤니티** - 익명 일기 공유 및 소통
- **설정** - 알림, 테마, 데이터 관리

## 🔧 API 엔드포인트

### Netlify Functions

- `/.netlify/functions/analyze-emotion` - 감정 분석
- `/.netlify/functions/feedback` - 위로 메시지 및 음악 추천
- `/.netlify/functions/chat` - AI 채팅
- `/.netlify/functions/emotion-summary` - 감정 통계 요약
- `/.netlify/functions/delete-user` - 회원탈퇴

### 요청 예시

```javascript
// 감정 분석
const response = await fetch('/.netlify/functions/analyze-emotion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: '오늘 정말 힘든 하루였어...' })
});

const { emotion } = await response.json();
// { emotion: 'sad' }
```

## 🔒 보안 및 프라이버시

- **행 단위 보안**(RLS) - 사용자별 데이터 격리
- **JWT 토큰** 인증 - 안전한 API 접근
- **개인정보 최소화** - 필수 정보만 수집
- **암호화 저장** - 모든 데이터 암호화
- **CORS 정책** - 허용된 도메인만 접근

## 📱 PWA 기능

- **오프라인 지원** - 네트워크 없어도 기본 기능 사용
- **앱 설치** - 홈 화면에 앱처럼 추가 가능
- **푸시 알림** - 일기 작성 리마인더
- **백그라운드 동기화** - 온라인 복구 시 자동 동기화
- **빠른 로딩** - 서비스 워커 캐싱

## 🤝 기여하기

1. 이 저장소를 포크하세요
2. 새 기능 브랜치를 만드세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 열어주세요

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👨‍💻 개발자

**cmhblue1225**
- GitHub: [@cmhblue1225](https://github.com/cmhblue1225)
- Email: cmhblue1225@example.com

## 🙏 감사의 말

- **OpenAI** - GPT API 제공
- **Supabase** - 백엔드 인프라 제공
- **Netlify** - 호스팅 및 서버리스 함수
- **Chart.js** - 데이터 시각화 라이브러리

---

**감정을 기록하고, AI와 함께 성장하세요. 🌱**

*"모든 감정은 소중합니다. 한 숨의 위로가 당신의 마음을 돌봐드릴게요."*