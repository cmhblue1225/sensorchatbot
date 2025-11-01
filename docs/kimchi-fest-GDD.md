Kimchi Fest: Shake & Spread — GDD Snapshot v0.1

Overview
- Theme: Butter/Bread를 양념/배추로 대체한 김치 테마. 플레이 감각은 동일.
- Goal: 박자에 맞춰 휴대폰을 흔들어 양념을 모으고, 이어서 배추에 바르기.
- Session Length: 기본 45초(설정 가능 30–60초). 단판.
- Modes: Solo(1인 테스트 가능), Dual(2인 합산 점수, 확장 가능 다인 지원).

Core Loop
- Countdown 3s → Play(반복 사이클) → End → Result
- Cycle(2박): 1박=양념 모으기, 다음 1박=배추 바르기. 반복.

Timing & Judgement
- BPM: 110(기본). 추후 제공 음악에 맞춰 동기화 예정.
- Beat Interval: 60000 / BPM ms, 최근접 박자와의 시간차로 판정.
- Windows: Nice ±70ms, Off ±160ms, Miss 그 외.
- Refractory: 120ms(같은 박자에 중복 트리거 방지).

Sensor Design
- Input: accelerationIncludingGravity → r = sqrt(x^2 + y^2 + z^2).
- Baseline: 300ms 이동평균으로 저주파/중력 완화(간단 하이패스).
- Trigger: (r - baseline) > THRESH_SHAKE 이면 히트 후보.
- Defaults: THRESH_SHAKE 3.5 m/s^2, SENSOR_THROTTLE_MS 33ms.
- Mapping: 모으기/바르기 모두 흔들기 임계치 초과 시점을 해당 단계의 입력으로만 인정.

Scoring
- Nice: +2점, 황금 효과 + “Nice!” SFX.
- Off: +1점, 약한 스파크 + 짧은 비프.
- Miss: +0점, 붉은 링 플래시.
- Solo는 개인 합계, Dual/Multi는 합산 점수.

UI/UX
- Orientation: Landscape(웹 HUD 배치 유리). 필요 시 Portrait 전환 가능.
- Top HUD: 남은 시간, 총점, 연결 플레이어 수.
- Center: 좌측 테이블/양념/배추(플레이스홀더), 우측 타이밍 링/바 + 현재 단계 배지.
- Bottom: 판정 로그(Nice/Off/Miss), 재시작 버튼.
- Visual Tone: Gather=붉은/주황, Spread=초록(배추).

Audio
- Metronome: 다운비트 강세 비프 톤.
- SFX: Nice/Off 전용 톤(WebAudio 임시 톤). 최종 음악 제공 시 BPM 동기화.

State Machine
- INIT → WAIT_CONNECTION → COUNTDOWN → PLAYING{GATHER|SPREAD} ↔(beat toggle) → END
- Events: sensor_shake, beat_tick, timer_expired, restart.

Data Model
- GameState: phase, startTime, elapsed, currentBeat, stage, bpm, players[]
- PlayerState: id, score, lastHitAt, hits[]({t, deltaMs, stage, rating})
- Config: 파라미터 묶음 중앙화(BPM, 윈도우, 임계치 등).

Parameters (initial)
- BPM=110
- NICE_MS=70, OFF_MS=160, REFRACTORY_MS=120
- THRESH_SHAKE=3.5
- SENSOR_THROTTLE_MS=33
- ROUND_TIME_SEC=45
- STAGE_ORDER=Gather → Spread 반복

SessionSDK Integration (rules only)
- connected 이벤트 후 createSession 호출.
- 모든 이벤트는 event.detail || event 패턴으로 처리.
- QR 라이브러리 부재 시 이미지 API 폴백 적용.

Testing Notes (manual)
- Solo에서 흔들기 강/약/빈도에 따른 Nice/Off/Miss 분포 확인.
- 메트로놈(시각/음향) 동기화 지연 체감 < 20ms.
- 임계치/윈도우 소폭 조정(±0.5 m/s^2, ±20ms)으로 손맛 튜닝.

Open Items
- 실제 음악 BPM 동기화(추후 자원 제공 시).
- 진짜 에셋(양념/배추/배경/폰트) 교체.
- Dual/Multi 초기 동시 접속 인원 한도 확정.

Scope Note
- 본 문서는 설계 스냅샷이며, 코드 구현을 포함하지 않습니다.


---

Upgrade Blueprint (김장 연출 확장안)
- Bucket Progress
  - 각 플레이어 라인 아이템에 `bucket` 컨테이너 삽입.
  - `fillAmount ∈ [0,1]`를 CSS 변수 `--fill`과 마스크로 표현, 25/50/75% 단위에서 글로우/파티클 트리거.
  - 듀얼 대전 구조 유지: 플레이어별 개별 버킷, 라운드 종료 시 버스트 애니메이션.
- Animation Layer
  - 중앙 레이어 `animation-layer`에서 Lottie/SVG로 양념 국자, 배추 바르기 연출.
  - `animationQueue`를 두어 스테이지 전환(gather→spread), 판정(Nice/Off/Miss)별로 애니메이션 enqueue.
  - `playersDetailed`에 `flashUntil`, `flashRating` 필드를 추가해 카드/버킷의 플래시 효과와 동기.
- SFX Integration
  - WebAudio 기반 `playTone`/`playJudgementSFX`/`playRoundCue` 유틸로 판정, 라운드 시작·종료, 결과 발표 음향 제공.
  - 모듈화된 `state.sfxBus`를 통해 전체 볼륨과 테마 교체 용이.
- Asset Strategy
  - 캐릭터 스킨: idle/action/hit 3컷 또는 Lottie, JSON manifest에서 `skinId`와 경로 관리.
  - 버킷 그래픽: 단일 SVG + 마스크 또는 3단계 스프라이트.
  - 양념/배추 연출: 짧은 스프라이트 시퀀스 혹은 Lottie JSON, stage 전환과 판정 이벤트로 재사용.
