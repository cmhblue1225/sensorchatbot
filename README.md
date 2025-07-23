# 🚀 Sensor Game Hub v6.0

완벽한 게임별 독립 세션 시스템을 갖춘 모바일 센서 기반 게임 플랫폼

## ✨ 주요 기능

### 🎮 게임별 독립 세션 시스템
- **즉시 세션 생성**: 게임 진입 시 자동으로 4자리 세션 코드 생성
- **QR 코드 지원**: 모바일 연결을 위한 QR 코드 자동 생성
- **실시간 상태 관리**: 연결 상태 및 게임 진행 상황 실시간 표시

### 📱 통합 센서 클라이언트
- **모든 게임 지원**: 하나의 센서 클라이언트로 모든 게임 타입 지원
- **자동 센서 감지**: iOS/Android 센서 자동 감지 및 권한 처리
- **실시간 데이터 전송**: 50ms 간격 고속 센서 데이터 전송

### 🎯 완전한 게임 컬렉션

#### Solo Game (솔로 게임)
- 1개 센서로 플레이하는 공 조작 게임
- 목표 수집 및 점수 시스템
- 연속 콤보 및 물리 엔진

#### Dual Game (듀얼 센서 게임)
- 2개 센서로 협력하는 미션 게임
- 공동 목표 달성 시스템
- 센서별 개별 진행률 표시

#### Multi Game (멀티플레이어 게임)
- 최대 10명까지 동시 플레이
- 실시간 리더보드
- 3분 타이머 기반 경쟁 시스템

## 🏗️ 시스템 아키텍처

```
sensor-game-hub-v6/
├── server/
│   ├── index.js              # 메인 게임 서버 (Express + Socket.IO)
│   └── SessionManager.js     # 세션 관리 시스템
├── public/
│   ├── js/
│   │   └── SessionSDK.js     # 통합 SDK (QR코드, 센서 수집기 포함)
│   ├── games/
│   │   ├── solo/index.html   # 솔로 게임
│   │   ├── dual/index.html   # 듀얼 게임
│   │   └── multi/index.html  # 멀티플레이어 게임
│   └── sensor.html           # 통합 센서 클라이언트
└── package.json
```

## 🚀 빠른 시작

### 1. 서버 시작
```bash
cd sensor-game-hub-v6
npm install
npm start
```

### 2. 게임 접속
- **솔로 게임**: http://localhost:3000/games/solo
- **듀얼 게임**: http://localhost:3000/games/dual  
- **멀티 게임**: http://localhost:3000/games/multi
- **센서 클라이언트**: http://localhost:3000/sensor.html

### 3. 모바일 연결
1. PC에서 원하는 게임에 접속
2. 화면에 표시되는 4자리 코드 확인 또는 QR 코드 스캔
3. 모바일에서 센서 클라이언트 접속 후 코드 입력
4. 센서 권한 허용 후 자동으로 게임 시작

## 🎮 게임 플레이 방법

### 📱 센서 조작법
- **기울이기**: 공의 움직임 제어
- **회전**: 추가 제어 입력
- **가속도**: 특별한 액션 트리거

### 🎯 게임별 목표
- **Solo**: 목표물 수집하여 최고 점수 달성
- **Dual**: 두 센서로 협력하여 미션 완료
- **Multi**: 제한 시간 내 가장 많은 점수 획득

## 🔧 기술 스택

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: HTML5, Canvas API, WebSockets
- **Sensors**: DeviceMotion API, DeviceOrientation API
- **Real-time**: Socket.IO 기반 실시간 통신
- **QR Codes**: QRCode.js 라이브러리

## 📊 API 엔드포인트

### HTTP API
- `GET /api/stats` - 서버 통계 조회
- `GET /api/session/:code` - 세션 정보 조회
- `GET /games/:type` - 게임 페이지 라우팅

### WebSocket Events
- `create-session` - 게임 세션 생성
- `connect-sensor` - 센서 클라이언트 연결
- `sensor-data` - 센서 데이터 전송
- `start-game` - 게임 시작

## 🔒 보안 기능

- **Helmet.js**: HTTP 보안 헤더
- **CORS**: 교차 출처 리소스 공유 제어
- **Input Validation**: 모든 입력값 검증
- **Session Timeout**: 비활성 세션 자동 정리

## 🌟 v6.0 새로운 기능

1. **게임별 독립 세션**: 허브를 거치지 않고 게임에서 직접 세션 생성
2. **통합 센서 클라이언트**: 모든 게임을 하나의 클라이언트로 지원
3. **자동 QR 코드**: 세션 생성 시 QR 코드 자동 생성
4. **향상된 UI/UX**: 모던한 디자인과 실시간 상태 표시
5. **완벽한 멀티플레이어**: 최대 10명 동시 접속 지원

## 📈 성능 최적화

- **센서 데이터 스로틀링**: 50ms 간격으로 데이터 전송
- **메모리 관리**: 자동 세션 정리 및 가비지 컬렉션
- **압축 지원**: Gzip 압축으로 대역폭 최적화
- **연결 복구**: 자동 재연결 시스템

## 🎯 다음 버전 계획

- [ ] 게임 결과 저장 시스템
- [ ] 사용자 랭킹 시스템  
- [ ] 더 많은 게임 타입 추가
- [ ] PWA 지원으로 앱 설치 가능
- [ ] 음성/음향 효과 추가

---

**Sensor Game Hub v6.0** - 모바일 센서로 새로운 게임 경험을 만나보세요! 🎮✨