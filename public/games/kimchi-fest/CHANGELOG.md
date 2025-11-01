# Kimchi Fest — CHANGELOG (Template)

This file follows the "Keep a Changelog" style and Semantic Versioning when applicable.
It records user-visible changes for the game folder `public/games/kimchi-fest/`.

Notes
- This changelog exists before implementation to support pause/resume workflows.
- Version bumps should align with `game.json` once it exists.

## [Unreleased]
### Added
- Changelog template and folder scaffold for documentation only.
- Initial `index.html` shell with static layout placeholders.
- SessionSDK wiring with QR fallback, session status, and sensor connection count.
- Accelerometer-based shake detection with baseline smoothing, throttling, and on-screen log (public/games/kimchi-fest/index.html).
- Beat-synced judgement (Nice/Off/Miss) with scoring and stage rotation (public/games/kimchi-fest/index.html).
- Enhanced HUD: stage tracker, judgement summary chips, and live sensor list (public/games/kimchi-fest/index.html).
- Localised HUD/controls copy to Korean for player-facing UI (public/games/kimchi-fest/index.html).
- Debug 튜닝 패널 추가(?debug=1): 임계값/판정 슬라이더와 판정 시뮬레이션 버튼 제공 (public/games/kimchi-fest/index.html).
- 듀얼 경쟁 모드: 플레이어별 점수판(정확+5/살짝+2/실패−1), 승자 안내, 실시간 통계 반영 (public/games/kimchi-fest/index.html).

### Changed
- Session creation defaults to dual mode so multiple sensors can join a single session (public/games/kimchi-fest/index.html).
- Restored metronome audio/flash helpers so beats trigger sound and UI pulses again (public/games/kimchi-fest/index.html).
- Enhanced player list shows per-player 점수/판정과 라운드 승자 메시지를 노출 (public/games/kimchi-fest/index.html).
- Added judgement/start/end SFX with player flash and stage pulse animations (public/games/kimchi-fest/index.html).

### Fixed
- N/A

### Removed
- N/A

## [v0.1.0] - YYYY-MM-DD
### Added
- (To be filled after initial playable shell is added.)

---

Conventions
- Categorize changes under Added/Changed/Fixed/Removed.
- Reference files by path, e.g., `public/games/kimchi-fest/index.html:42`.
- Keep entries concise and task-focused. Larger context lives in `docs/kimchi-fest-PLAN.md` Progress Log.

