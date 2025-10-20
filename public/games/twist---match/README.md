# Twist & Match

1. 게임 설정
- 게임 모드: Solo (1인 플레이)
- 센서 데이터: 방향 센서(orientation)의 회전 데이터 활용
- 게임 목표: 주어진 퍼즐을 회전을 통해 정답 상태로 맞추기

2. 게임 흐름
- 게임 시작 시 랜덤한 퍼즐 상태가 생성됨
- 플레이어는 기기를 회전시켜 퍼즐 조각을 회전시킬 수 있음
- 퍼즐이 정답 상태가 되면 다음 레벨로 진행
- 일정 시간 내에 퍼즐을 맞추지 못하면 게임 오버

3. 핵심 구현 사항
- SessionSDK의 'orientation' 이벤트를 활용하여 기기 회전 데이터 수집
- 'event.detail || event' 패턴으로 이벤트 데이터 처리
- 퍼즐 조각의 회전 상태를 추적하고 정답 여부 확인
- 퍼즐 레벨 및 난이도 설정 기능 구현
- 타이머 기능 구현 및 게임 오버 처리

## 설치 방법

1. 이 폴더를 `/public/games/` 디렉토리에 복사하세요
2. 폴더명을 `twist---match`로 변경하세요
3. 서버를 재시작하거나 게임 재스캔을 실행하세요

## 접속 방법

- 게임 URL: `http://localhost:3000/games/twist---match`
- 센서 클라이언트: `http://localhost:3000/sensor.html`

## 게임 정보

- **타입**: solo
- **난이도**: medium
- **플레이어**: 1명
- **센서**: orientation

## 개발 정보

- 생성일: 2025. 10. 16. 오후 3:19:07
- 생성 도구: Sensor Game Hub v6.0 AI Generator
- SDK 버전: SessionSDK v6.0

---

*이 게임은 Sensor Game Hub v6.0의 대화형 AI 게임 생성기로 제작되었습니다.*
