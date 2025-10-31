Kimchi Fest — Pause‑Friendly Implementation Plan v0.1

Intent
- 언제든 중단/재개가 가능하도록 작은 단계와 종료 조건(Stop check)을 둔 계획입니다.
- 승인 전에는 구현을 시작하지 않습니다.

Phases (12)
1) 계획 승인 대기
- Deliverable: 본 계획/설계 확정. 구현 없음.
- Stop check: 승인 지시 수신.

2) 게임 폴더 생성만
- Task: public/games/kimchi-fest/ 빈 폴더 생성.
- Stop check: 서버/목록에 영향 없음(파일 미생성).

3) 최소 index 셸 추가
- Task: index.html 기본 스켈레톤, 캔버스/HUD 컨테이너만.
- Stop check: 정적 로드 OK, 기능 없음.

4) SessionSDK + QR 폴백 연결
- Task: /socket.io/socket.io.js, /js/SessionSDK.js 로드, connected 대기 후 createSession, event.detail || event 패턴, QR 폴백 처리.
- Stop check: 센서 연결/해제 표식만 동작.

5) 메트로놈 + 타이머
- Task: 내부 BPM(110) 비주얼/비프, 45s 카운트다운.
- Stop check: 박자/타이머 동작만 검증(판정 없음).

6) 센서 파이프라인
- Task: accel 기반 흔들기 검출(이동평균 300ms, 임계 3.5, 스로틀 33ms, 리프랙터리 120ms).
- Stop check: 흔들기 이벤트 로그만 출력.

7) 판정 + 스코어링
- Task: Nice ±70ms, Off ±160ms, Miss 그 외. 단계 일치 시에만 유효.
- Stop check: 점수 증가/라벨 표시 확인.

8) HUD + 피드백 UI
- Task: 타이머/점수/플레이어 수, 타이밍 링, Nice/Off/Miss 이펙트, 재시작 버튼.
- Stop check: 60fps 안정, 누수 없음.

9) 솔로 플레이 테스트/튜닝
- Task: THRESH/윈도우 소폭 조정(±0.5 m/s^2, ±20ms). 손맛 확보.
- Stop check: Nice 재현성 ≥80% 목표.

10) 듀얼/멀티 추가 (선택)
- Task: sensorId별 PlayerState, 합산 점수, 간단 레이아웃 확장.
- Stop check: 2대 동시 입력에서 안정 동작.

11) SFX + 폴리시 (선택)
- Task: 비프/“Nice!” 톤(WebAudio), 간단 애니메이션/색상 정제.
- Stop check: 오디오 지연/중첩 없음.

12) 문서 작성 + 핸드오프
- Task: game.json 메타, 튜닝 가이드, 사용법 요약. 변경점 기록.
- Stop check: /api/games 노출, 문서 링크 제공.

Parameters (initial)
- BPM 110, NICE_MS 70, OFF_MS 160, REFRACTORY_MS 120
- THRESH_SHAKE 3.5, SENSOR_THROTTLE_MS 33, ROUND_TIME_SEC 45

Controls & Rules to Honor
- connected 이후 createSession, 모든 이벤트는 event.detail || event.
- 절대 경로 로드, QR 폴백 구현.
- 성능: 스로틀, requestAnimationFrame, 리스너 정리, 입력 검증.

Resumption Guide
- 각 단계는 독립 산출물과 Stop check가 있음. 마지막 완료된 단계 번호를 기록 후 재개.
- 예시: “2–4단계 완료, 5단계부터 재개”.

Language Preference
- Implementation-required artifacts (코드, 주석, 로그 메시지 등)는 영어 사용.
- 설명, 문서 해설, 진행 보고 등 작업 이해에 지장 없는 커뮤니케이션은 한국어 사용.
- 문서/주석에서 한국어가 필요한 경우 괄호로 보조 설명 가능.

Scope Note
- 본 문서는 스냅샷이며, 코드 구현을 포함하지 않습니다.

Repo Guidelines Summary (지침 요약)
- 게임 구조: `public/games/<game-id>/index.html`(필수) + `game.json`(선택 메타). 서버는 GameScanner로 자동 감지.
- SessionSDK 규칙: `connected` 이벤트 이후 `createSession()` 호출. 모든 SDK 이벤트는 `event.detail || event` 패턴으로 처리.
- 경로/리소스: `/socket.io/socket.io.js`, `/js/SessionSDK.js` 등 절대 경로 사용.
- QR 코드: 라이브러리 미존재 시 이미지 API로 폴백(네트워크 실패 시도 감안한 예외 처리 권장).
- 성능: 센서 스로틀(기본 33ms), `requestAnimationFrame` 렌더 루프, 이벤트/타이머/오디오 리소스 해제 필수.
- 안정성/보안: 세션 코드/게임 ID 입력 검증, HTML 이스케이프, 허용 Origin/메서드만 노출, 간단한 레이트 리밋 권장.
- 협업: `main` 보호, `develop` 통합, 개인 브랜치→PR. 컨벤셔널 커밋 사용, `.env`/비밀키 커밋 금지.
- 테스트/유지보수: TEST_SCENARIOS 체크리스트 기반 수동 테스트, 필요 시 GameMaintenanceManager 플로우로 버그/기능 증분.

Compliance Checklist (준수 체크리스트)
- [ ] 폴더/파일 구조가 레포 규칙을 준수한다.
- [ ] 스크립트 로드는 절대 경로이며, CSP/보안 정책을 위반하지 않는다.
- [ ] `connected` 이후에만 `createSession()`을 호출한다.
- [ ] 모든 SDK 이벤트에서 `event.detail || event` 패턴을 사용한다.
- [ ] QR 생성은 라이브러리/폴백 모두 동작한다.
- [ ] 센서 파이프라인은 스로틀/임계/리프랙터리를 갖고, 누수가 없다.
- [ ] 입력값(세션 코드/ID)은 검증·이스케이프 처리한다.
- [ ] 타이머/리스너/오디오는 언마운트 시 정리된다.
- [ ] 수동 테스트 시나리오(솔로 기준)를 통과한다.
- [ ] 문서를 갱신하고 변경 이력을 기록한다.

Reference Docs (관련 문서)
- 프로젝트 개요/빠른 시작: `sensorchatbot/README.md`
- 개발 가이드(게임 추가·SDK·문제 해결): `sensorchatbot/DEVELOPER_GUIDE.md`
- 협업/브랜치/커밋: `sensorchatbot/COLLABORATION_GUIDE.md`
- UI/정보구조/보안/성능 기준: `sensorchatbot/interface.md`
- 품질/자동화 전략: `sensorchatbot/GAME_QUALITY_IMPROVEMENT.md`
- 테스트 체크리스트: `sensorchatbot/TEST_SCENARIOS.md`
- 에이전트 지침/프롬프트: `sensorchatbot/AI_ASSISTANT_PROMPTS.md`

Progress Log (작업 일지 템플릿)
- 목적: 중단/재개 지점 기록. 단계별 산출물과 Stop check 결과를 남깁니다.
- 규칙: 각 항목은 ISO 시각, 단계 범위, 파일, 확인 방법, 다음 재개 지점(RESUME_FROM)을 포함합니다.

예시 항목
```
## 2025-10-17T12:34:56Z
- 완료 단계: 1–3 (계획 승인 대기, 폴더 생성, 최소 index 셸)
- 변경 파일/경로: 
  - public/games/kimchi-fest/ (폴더)
  - public/games/kimchi-fest/index.html (기본 셸)
- Stop check: 정적 로드 OK, 기능 미구현.
- RESUME_FROM: 4 (SessionSDK + QR 폴백)
```

Handoff Summary (3-line 요약 템플릿)
- What we did: [핵심 변경 1–2줄]
- How to verify: [URL/동작 방법]
- What’s next: [다음 단계 번호와 간단 설명]

## 2025-10-17T12:43:27+09:00
- 완료 단계: 1 (계획 승인 대기)
- 변경 파일/경로:
  - sensorchatbot/docs/kimchi-fest-PLAN.md (Progress Log 업데이트)
- Stop check: 계획 승인 완료. 구현 작업 없음.
- RESUME_FROM: 2 (게임 폴더 생성만)

## 2025-10-17T12:44:19+09:00
- 완료 단계: 2 (게임 폴더 생성만)
- 변경 파일/경로:
  - public/games/kimchi-fest/ (폴더 생성)
  - sensorchatbot/docs/kimchi-fest-PLAN.md (Progress Log 업데이트)
- Stop check: 폴더만 생성, 파일 없음. GameScanner 영향 없음.
- RESUME_FROM: 3 (최소 index 셸 추가)

## 2025-10-17T12:46:40+09:00
- 완료 단계: 3 (최소 index 셸 추가)
- 변경 파일/경로:
  - public/games/kimchi-fest/index.html (정적 셸 생성)
  - sensorchatbot/docs/kimchi-fest-PLAN.md (Progress Log 업데이트)
- Stop check: 정적 레이아웃만 존재. 스크립트/SDK 미포함.
- RESUME_FROM: 4 (SessionSDK + QR 폴백)

## 2025-10-17T13:49:06+09:00
- 완료 단계: 4 (SessionSDK + QR 폴백)
- 변경 파일/경로:
  - public/games/kimchi-fest/index.html (SessionSDK 연결, QR 폴백, 센서 카운트 표시)
  - public/games/kimchi-fest/CHANGELOG.md (Unreleased 항목 갱신)
  - sensorchatbot/docs/kimchi-fest-PLAN.md (Progress Log 업데이트)
- Stop check: SDK 로드 실패 시 안내 메시지 표시, 세션 생성/QR 표시/센서 카운트 정상 동작 확인 필요.
- RESUME_FROM: 5 (메트로놈 + 타이머)

## 2025-10-17T14:12:01+09:00
- 완료 단계: 5 (메트로놈 + 타이머)
- 변경 파일/경로:
  - public/games/kimchi-fest/index.html (메트로놈 110 BPM, WebAudio 비프, 45초 라운드 타이머 및 UI 업데이트)
  - public/games/kimchi-fest/CHANGELOG.md (Unreleased 항목에 메트로놈/타이머 추가)
  - sensorchatbot/docs/kimchi-fest-PLAN.md (Progress Log 업데이트, Language Preference 반영)
- Stop check: 라운드 시작 시 타이머 카운트다운, 박자 비프 + 시각 플래시 정상 동작 여부 확인.
- RESUME_FROM: 6 (센서 파이프라인)

## 2025-10-19T20:48:09+09:00
- 완료 단계: 6 (센서 파이프라인)
- 변경 파일/경로:
  - public/games/kimchi-fest/index.html (가속도 기반 흔들림 검출, 베이스라인 보정, 센서 로그 UI 추가)
  - public/games/kimchi-fest/CHANGELOG.md (Unreleased 항목에 센서 감지 기능 기록)
  - sensorchatbot/docs/kimchi-fest-PLAN.md (Progress Log 업데이트)
- Stop check: 라운드 진행 중 흔들림을 발생시키면 로그 항목과 누적 감지 횟수가 즉시 갱신되는지 화면으로 확인.
- RESUME_FROM: 7 (판정 + 스코어링)
## 2025-10-19T22:25:22+09:00
- 완료 단계: 7 (판정 + 스코어링)
- 변경 파일/경로:
  - public/games/kimchi-fest/index.html (박자 기반 판정 창, Nice/Off/Miss 스코어, 단계 전환 로직)
  - public/games/kimchi-fest/CHANGELOG.md (Unreleased 항목에 판정/스코어 기능 기록)
  - sensorchatbot/docs/kimchi-fest-PLAN.md (Progress Log 업데이트)
- Stop check: 라운드 중 흔들림 타이밍에 따라 Nice/Off/Miss가 구분되고 점수·요약 지표가 즉시 반영됨을 확인.
- RESUME_FROM: 8 (HUD + 피드백 UI)

## 2025-10-21T09:43:41+09:00
- 완료 단계: 8 (HUD + 피드백 UI)
- 변경 파일/경로:
  - public/games/kimchi-fest/index.html (스테이지 패널, 판정 요약 칩, 센서 리스트, UI 한글화)
  - public/games/kimchi-fest/CHANGELOG.md (Unreleased 항목에 HUD/한글화 내역 추가)
- Stop check: HUD가 단계·센서·판정 통계를 실시간으로 갱신하고, 로그/칩/단계 하이라이트가 정상 동작함을 확인.
- RESUME_FROM: 9 (솔로 플레이 테스트/튜닝)

## 2025-10-21T10:15:00+09:00
- 완료 단계: 9 (솔로 플레이 테스트/튜닝)
- 변경 파일/경로:
  - public/games/kimchi-fest/index.html (임계값/판정 창 조정, 디버그 패널 및 시뮬레이터 추가)
  - public/games/kimchi-fest/CHANGELOG.md (Unreleased 항목에 디버그 패널/튜닝 내역 추가)
- Stop check: debug=1 모드에서 슬라이더/버튼으로 판정 값을 조정하고 N/O/M 키 또는 버튼으로 Nice/Off/Miss를 재현할 수 있으며, HUD 통계가 즉시 갱신되는지 확인.
- RESUME_FROM: 10 (듀얼/멀티 확장 – 선택)

## 2025-10-21T11:05:00+09:00
- 완료 단계: 10 (듀얼 경쟁 모드 확장)
- 변경 파일/경로:
  - public/games/kimchi-fest/index.html (듀얼 점수판, 플레이어별 세부 통계, 승자 안내, 디버그 튜닝 슬라이더)
  - public/games/kimchi-fest/CHANGELOG.md (경쟁 듀얼 모드 내역 추가)
- Stop check: 센서를 두 대 연결해 라운드 진행 시 플레이어별 점수/판정/승자 메시지가 표시되고, ?debug=1 패널에서 슬라이더·판정 버튼이 정상 동작함을 확인.
- RESUME_FROM: 11 (SFX + 폴리시 – 선택)

## 2025-10-21T12:15:00+09:00
- 완료 단계: 11 (SFX + 폴리시 – 연출)
- 변경 파일/경로:
  - public/games/kimchi-fest/index.html (WebAudio 판정 SFX, 라운드 cue 사운드, 플레이어/스테이지 연출 추가)
  - public/games/kimchi-fest/CHANGELOG.md (SFX 및 연출 개선 내역 추가)
- Stop check: 판정별 SFX와 라운드 시작/종료 cue가 재생되고, 플레이어 카드 및 스테이지 연출이 표시되는지 확인.
- RESUME_FROM: 12 (메타 데이터 + 등록 준비)

## 2025-10-21T12:40:00+09:00
- 완료 단계: 12 (메타 데이터 + 등록 준비)
- 변경 파일/경로:
  - public/games/kimchi-fest/game.json (게임 메타데이터/설명/컨트롤 JSON 정리)
  - public/games/kimchi-fest/CHANGELOG.md (Phase 11~12 내역 업데이트)
- Stop check: game.json이 UTF-8 유효 JSON으로 작성되고, 변경 로그에 최신 단계가 반영되었는지 확인.
- RESUME_FROM: N/A (prototype pass 완료)

## 2025-10-29T09:38:57+09:00
- 완료 단계: 확장 설계 스텝 (버킷 진행도/애니 레이어 스켈레톤)
- 변경 파일/경로:
  - public/games/kimchi-fest/index.html (버킷 진행도 UI, 애니메이션 레이어 구조/상태 스텁 추가)
  - sensorchatbot/docs/kimchi-fest-PLAN.md (Progress Log 업데이트)
- Stop check: 플레이어 리스트에 버킷 진행도가 0%로 표시되고 애니메이션 레이어가 Inactive 상태로 노출되는지 확인.
- RESUME_FROM: 확장 설계 후속 (애니메이션 연출 구현, 자산 매핑)

## 2025-10-30T14:33:17+09:00
- 완료 단계: 확장 설계 진행 (버킷 진행도 로직 연결)
- 변경 파일/경로:
  - public/games/kimchi-fest/index.html (판정별 fillAmount 누적, 단계별 배수, 마일스톤 큐 로직 추가)
  - sensorchatbot/docs/kimchi-fest-PLAN.md (Progress Log 업데이트)
- Stop check: 라운드 중 판정(Nice/Off/Miss)을 발생시키면 버킷 %가 가감되고 spread 단계에서 증가량이 커지는지 확인.
- RESUME_FROM: 확장 설계 후속 (버킷 마일스톤 연출/애니메이션 재생, 자산 매핑)

## 2025-10-30T16:58:12+09:00
- 완료 단계: 확장 설계 진행 (버킷 마일스톤 애니메이션)
- 변경 파일/경로:
  - public/games/kimchi-fest/index.html (애니메이션 레이어 CSS/JS 확장, 큐 소비/루프/이벤트 표시 구현)
  - sensorchatbot/docs/kimchi-fest-PLAN.md (Progress Log 업데이트)
- Stop check: 버킷 마일스톤 진입 시 애니메이션 레이어에 팝업이 표시되고 일정 시간 후 사라지는지, 라운드 리셋 시 진행 바/애니메이션 큐가 초기화되는지 확인.
- RESUME_FROM: 확장 설계 후속 (애니메이션 자산/스킨 매핑, stage별 연출 강화)

## 2025-10-30T17:08:18+09:00
- 완료 단계: 확장 설계 진행 (자산 매니페스트 로더)
- 변경 파일/경로:
  - public/games/kimchi-fest/manifest.json (스킨/버킷/이펙트 매핑 초안 추가)
  - public/games/kimchi-fest/index.html (매니페스트 기본값/로더, 레이블/배경/이펙트 연결)
  - sensorchatbot/docs/kimchi-fest-PLAN.md (Progress Log 업데이트)
- Stop check: 콘솔에서 `window.state.assetManifest`가 로드된 매니페스트를 반환하고, 애니 레이어 배경이 매니페스트 배경으로 교체되며 팝업에 해당 레이블과 효과 클래스(테두리 색)가 반영되는지 확인.
- RESUME_FROM: 확장 설계 후속 (자산 실제 연동, 스테이지별 시각/사운드 연출 적용)

## 2025-10-31T09:59:06+09:00
- 완료 단계: 확장 설계 진행 (판정 기반 아바타 프레임)
- 변경 파일/경로:
  - public/games/kimchi-fest/index.html (플레이어 아바타 DOM/CSS 추가, 판정별 프레임 전환 로직, 스킨 헬퍼 함수)
  - public/games/kimchi-fest/manifest.json (게임 폴더 내 자산 매니페스트 경로 조정)
  - sensorchatbot/docs/kimchi-fest-PLAN.md (Progress Log 업데이트, 테스트 항목 추가)
- Stop check: `?debug=1` 모드에서 N/O/M 판정 버튼을 눌러 플레이어 카드의 아바타 이미지가 각각 Nice/Off/Miss 포즈로 전환되고 약 1초 뒤 idle로 복귀하는지, manifest에 프레임 경로가 없을 경우 이니셜 fallback이 노출되는지 확인.
- RESUME_FROM: 확장 설계 후속 (실제 스킨 자산 추가, spread 단계용 실시간 연출 보완)

## 2025-10-31T10:39:37+09:00
- 완료 단계: 확장 설계 진행 (플레이필드 중심 UI 재배치)
- 변경 파일/경로:
  - public/games/kimchi-fest/index.html (메인 레이아웃 전환, HUD/세션 오버레이, DEV 패널 토글 추가)
  - sensorchatbot/docs/kimchi-fest-PLAN.md (Progress Log 업데이트)
- Stop check: 메인 화면이 캐릭터 플레이 필드 중심으로 표시되고 HUD/세션 정보가 오버레이로 노출되는지, DEV PANEL 토글로 기존 디버그/로그 패널을 열고 닫을 수 있는지 확인.
- RESUME_FROM: 확장 설계 후속 (플레이필드 씬 구성 및 캐릭터/배추 연출 삽입)

## 2025-10-31T11:01:28+09:00
- 완료 단계: 확장 설계 진행 (플레이필드 씬 레이아웃 스텁)
- 변경 파일/경로:
  - public/games/kimchi-fest/index.html (scene ground/캐릭터/배추/이펙트 레이어 DOM 및 placeholder 스타일 추가)
  - sensorchatbot/docs/kimchi-fest-PLAN.md (Progress Log 업데이트)
- Stop check: 플레이필드에 테이블·캐릭터·배추 레이어 스텁이 표시되고, DEV 패널이 게임 화면 밖 좌하단에 위치하는지 확인.
- RESUME_FROM: 확장 설계 후속 (실제 스프라이트/애니메이션 자산 주입, 판정 이벤트와 연동)

## 2025-10-31T12:30:53+09:00
- 완료 단계: 확장 설계 진행 (캐릭터 스킨/버킷 HUD 연동)
- 변경 파일/경로:
  - public/games/kimchi-fest/index.html (스킨 프레임 적용, 버킷 HUD 칩/시즌닝 하이라이트, DEV 패널 토글 정리)
- Stop check: 판정 버튼(N/O/M) 입력 시 플레이필드 캐릭터와 버킷 HUD, 배추 시즌닝 광택이 동시에 갱신되는지 확인.
- RESUME_FROM: 확장 설계 후속 (실제 스프라이트/양념 모션 연결, spread 단계 실시간 모션)

---

## 확장 설계 (김장 연출 업그레이드)
- 목표: 듀얼 경쟁에 맞춘 버킷(양동이) 진행도와 “양념 바르기” 애니메이션을 도입해 몰입감 강화.
- 주요 구성요소:
  1. **플레이어 버킷 진행도**
     - 각 플레이어 카드 내 `bucket-progress` 컨테이너 추가.
     - 판정 시 fillAmount 누적, CSS 변수 `--fill`로 시각화. 25/50/75% 이상에서 하이라이트 연출.
  2. **양념 바르기 애니메이션 레이어**
     - 중앙에 `animation-layer` 추가, gather→spread 전환 및 spread 단계 판정에 따라 애니메이션 재생.
     - 애니메이션 큐를 두어 requestAnimationFrame에서 순차 재생.
  3. **상태 확장**
     - `playersDetailed`: `fillAmount`, `flashUntil`, `flashRating`, `skinId`.
     - `state`: `animationQueue`, `stagePulseTimeout`, `sfxBus`.
  4. **사운드 & 연출 연계**
     - 판정별 SFX와 버킷/캐릭터 연출 동기화.
     - 라운드 종료 시 플레이어 버킷 overflow, 승자 발표 cue 재생.
- 산출물 체크리스트:
  - [ ] index.html: 버킷/애니메이션 레이어 DOM 구조 추가.
  - [ ] styles: 버킷 fill, flash, stage pulse CSS 정의.
  - [ ] scripts: 애니메이션 큐, 버킷 진행도 업데이트, asset manifest 로더.
  - [ ] game.json 또는 별도 manifests: 캐릭터 스킨/애니메이션/버킷 자산 경로 정의.
  - [ ] 자산 확보(사용자): 캐릭터 기본/판정 컷, 버킷 마스크, 양념/배추 애니메이션 스프라이트, 텍스처.
