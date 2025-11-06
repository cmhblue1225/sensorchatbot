# Kimchi Fest Asset Intake Checklist

## Visual Backdrop And Props
- [ ] Provide layered PNGs sized around 2560x1440 or higher for `background`, `ground`, and `cabbage` highlights; keep alpha baked into layers.
- [ ] Name files using lowercase kebab case (example: `hanok-yard-ground.png`) and place them in `assets/visuals/`.
- [ ] For props that sit on tables or crates, export isolated PNGs sized roughly to scale; use descriptive suffixes such as `-table`, `-crate`, `-accent`.
- [ ] Update `manifest.json -> bucket.background` and any prop paths so the runtime picks up new images on next reload.

## Character Skin Frames
- [ ] Export transparent PNGs for each frame: `idle`, `nice`, `off`, `miss`, with matching dimensions.
- [ ] Split hands and tool layers when motion blur or tool swaps are expected; save into `assets/skins/<skin-id>/`.
- [ ] Include a `thumbnail.png` for the skin selector using the same skin folder.
- [ ] Confirm frame filenames match keys in `manifest.json.skins[].frames`; only the manifest paths need updating when swapping assets.

## Runtime QA Pass
- [ ] Launch the game with `?debug=1`, use `N`, `O`, `M` keys to cycle judgement states, verify skin pose + HUD bucket + seasoning gloss sync together.
- [ ] Temporarily drop obviously stretched placeholder art (example: `debug-bg-4x3.png`) to confirm new aspect ratios respect the layout.
- [ ] Toggle the Dev Panel (bottom-left button) and ensure logs reflect the currently loaded skin/background after reload.
- [ ] Clear browser cache or hard reload (`Ctrl+Shift+R`) between swaps to avoid stale PNGs.

## Deliverable Handoff
- [ ] Supply a short changelog (bullet list) describing which files changed and whether dimensions differ from the previous batch.
- [ ] Bundle raw Blender renders or layered PSD/EXR files separately from the in-game PNGs for future tweaks.
- [ ] Note any special animation timing requirements so `setCharacterPose` and sensor hooks can be tuned without guesswork.
