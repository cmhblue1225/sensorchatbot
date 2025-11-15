# Kimchi Fest 3D Asset Design Specification
**Project**: Sensor Game Hub - Kimchi Fest
**Date**: 2025-11-14
**Version**: 1.1 (Codex Review Applied)
**Status**: Design Phase - Ready for Implementation

---

## 📂 File Path Conventions

### Path Reference Point
- **Base Directory**: `public/games/kimchi-fest/`
- **In this document**: Paths are written relative to base directory
- **In code/manifest**: Use absolute paths from web root

### Examples
| Document Path | Absolute Path (Runtime) |
|---------------|-------------------------|
| `assets/characters/chef.glb` | `/games/kimchi-fest/assets/characters/chef.glb` |
| `assets/objects/cabbage.glb` | `/games/kimchi-fest/assets/objects/cabbage.glb` |

**Rule**: When integrating into game code, always prepend `/games/kimchi-fest/` to document paths.

---

## 📋 Overview

### Game Concept
- **Genre**: Rhythm Action Game (BPM 110)
- **Platform**: Web-based (Mobile Sensor Integration)
- **Visual Style**: Cute Character + Korean Traditional Background
- **Color Tone**: Warm Palette

### Core Gameplay
```
[Chef Character - Fixed Position]
       ↑
  [Map Moves Toward Player]
       ↑
Seasoning → Cabbage → Seasoning → Cabbage (Loop)
       ↑
Player Action: Scoop Seasoning → Spread on Cabbage
```

### Required 3D Assets (Priority Order)
1. **Character**: Chef + Tools (Ladle/Knife) + 1 Action Pose
2. **Game Objects**: Whole Cabbage, Seasoning Jar
3. **Environment**: Hanok Yard Background + Traditional Props
4. **VFX**: Seasoning Splash Effect

---

## 🎯 Asset Specifications

### 1. CHARACTER: Chef Character

#### Design Direction
- **Style**: Cute, Casual Chef
- **Proportions**: Chibi/Deformed (Head:Body = 1:1.5 ~ 1:2)
- **Outfit**: Chef's Apron + Bandana/Hat
- **Tools**: Ladle OR Knife in hand (or both)

#### 1.2 Animation & Sprite Clarification

**🎬 3D Animation (Blender Output)**
| Animation Name | Description | Duration | Usage |
|----------------|-------------|----------|-------|
| **action_swing** | Tool swinging motion | **13 frames @ 24fps = 542ms** | Scoop seasoning → Spread on cabbage |

- **Purpose**: Real-time 3D character animation in game
- **Implementation**: Three.js AnimationMixer plays this loop during gameplay
- **Trigger**: Activated on rhythm beat / player input
- **Critical**: **MUST be exactly 13 frames @ 24fps** to sync with BPM 110 (545ms beat interval)
- **FPS Requirement**: Blender scene MUST use 24fps (no other FPS allowed)
- **Note**: 13 frames = 542ms, BPM 110 = 545ms (3ms difference is acceptable). If needed, programmer can fine-tune with `action.timeScale = 1.0055` in engine.

**🖼️ 2D Sprite Frames (UI Feedback)**
| Frame Name | Description | Source | Usage |
|------------|-------------|--------|-------|
| `idle.png` | Default standing pose | Render from Blender | Base state |
| `nice.png` | Success celebration pose | Render from Blender | Nice judgment UI |
| `off.png` | Near-miss reaction | Render from Blender | Off judgment UI |
| `miss.png` | Fail/disappointed pose | Render from Blender | Miss judgment UI |

- **Purpose**: Player card UI overlay (shown on HUD)
- **Implementation**: 2D image swap based on judgment result
- **Export Method**: Orthographic camera render from Blender (512x512 or 1024x1024)

**Important**: 3D model uses `action_swing` animation continuously, while UI shows 2D sprite frames for feedback. These are independent systems.

#### Modeling Specs
```
- Polygon Count: 5,000 ~ 15,000 tris (Web Optimized)
- Texture Size: 2048x2048 (Diffuse + Normal)
- Rig: Basic Humanoid (Arms/Hands/Torso/Head)
- Animation: action_swing (13 frames @ 24fps REQUIRED)
- FPS: 24fps ONLY (set in Blender scene properties)
```

#### Rigging Requirements

**Bone Naming Convention** (Mixamo/Three.js Compatible):
```
Root
├── Hips
│   ├── Spine
│   │   ├── Spine1 (optional)
│   │   └── Neck
│   │       └── Head
│   ├── LeftShoulder
│   │   ├── LeftArm
│   │   │   ├── LeftForeArm
│   │   │   └── LeftHand
│   ├── RightShoulder
│   │   ├── RightArm
│   │   │   ├── RightForeArm
│   │   │   └── RightHand
│   ├── LeftUpLeg
│   │   ├── LeftLeg
│   │   │   ├── LeftFoot
│   │   │   │   └── LeftToeBase (optional)
│   └── RightUpLeg
│       ├── RightLeg
│       │   ├── RightFoot
│       │   │   └── RightToeBase (optional)
```

**Note on Lower Body**:
- **Running animation required**: User wants character to appear running while map moves
- **LeftFoot/RightFoot**: **REQUIRED** for realistic running motion (heel-toe movement)
- **LeftToeBase/RightToeBase**: **OPTIONAL** - adds detail to run cycle, but not critical for chibi
- Running will be "in-place" animation (character doesn't translate, map moves instead)

**Weight Painting Rules**:
- Maximum 4 bone influences per vertex
- Normalize all weights (sum = 1.0)
- Test deformation in pose mode before export

**Hit Zone & Pivot Points**:
```
Tool Pivot: Parent to RightHand bone (or LeftHand if left-handed)
Hit Zone Marker: Add Empty object "HitZone_Tool" at tool tip
- Position: End of ladle/knife blade
- Forward Axis: +X (Blender coordinate) points toward swing direction
- Purpose: Engine raycasts from this point to detect object collision
- Export: Include in GLB hierarchy
```

**Coordinate System**:
```
Blender (Modeling):  Z-up, Y-forward, X-right
GLB Export:          Y-up, Z-forward, X-right (automatic conversion)

CRITICAL: When exporting GLB, verify "+Y Up" is enabled in export settings.
Blender's export addon handles coordinate conversion automatically.
Programmers can use GLB directly without additional transforms.
```

#### Tools (Props)
- **Ladle**: Large ladle, can hold seasoning
- **Knife**: Kimchi knife, wide blade
- **Recommend both** for interchangeable use

#### Export Files
```
/assets/characters/
├── chef-character.glb (or .fbx)
├── chef-diffuse.png (2048x2048)
├── chef-normal.png (2048x2048)
├── ladle.glb
└── knife.glb
```

---

### 2. GAME OBJECTS

#### 2.1 Whole Cabbage

**Design**:
- Korean-style whole cabbage (for kimchi)
- Detailed texture showing leaf patterns
- Before seasoning: White/Light green
- After seasoning: Red seasoning texture applied

**Modeling Specs**:
```
- Polygon Count: 2,000 ~ 5,000 tris
- Texture Size: 1024x1024
- 2 Versions Required:
  1. cabbage-raw.glb (Before seasoning)
  2. cabbage-seasoned.glb (After seasoning)

  OR texture swap only:
  1. cabbage.glb (Common model)
  2. cabbage-raw-diffuse.png
  3. cabbage-seasoned-diffuse.png
```

**Animation**:
- Conveyor Movement: Move along Z-axis (can be handled in code)
- Optional: Slight wobble/bounce animation

**Export Files**:
```
/assets/objects/
├── cabbage.glb
├── cabbage-raw-diffuse.png
├── cabbage-raw-normal.png
├── cabbage-seasoned-diffuse.png
└── cabbage-seasoned-normal.png
```

#### 2.2 Seasoning Container (Jar/Bowl)

**Design**:
- Korean traditional jar (Onggi) or large bowl
- Filled with red seasoning
- Placed near character

**Modeling Specs**:
```
- Polygon Count: 1,500 ~ 3,000 tris
- Texture Size: 1024x1024
- Seasoning Surface: Semi-transparent/Glossy shader recommended
```

**Export Files**:
```
/assets/objects/
├── seasoning-jar.glb
├── seasoning-jar-diffuse.png
└── seasoning-jar-normal.png
```

#### 2.3 Bucket Visualization Strategy

**Current Implementation (Phase 1):**
- ✅ **UI Progress Bar Only** (2D HUD)
- No 3D bucket model required initially
- Red fill bar increases as player spreads seasoning
- Milestone popups (25%, 50%, 75%, 100%) handled by UI overlay

**Future Enhancement (Phase 2 - Optional):**
- 🔮 **3D Bucket Model** (Low priority, add if desired later)
  - **Location**: On table next to character
  - **Animation**: Y-axis scale increases with fillAmount (0.0 → 1.0)
  - **Material**: Transparent container + red seasoning liquid (shader)
  - **Polygon Count**: 1,000 ~ 2,000 tris
  - **Implementation**: Three.js shader with `fillAmount` uniform variable

**Decision**: Start with UI-only. 3D bucket can be added later without disrupting existing system.

---

### 3. ENVIRONMENT: Hanok Yard Background

#### Design Direction
- **Concept**: Traditional Hanok yard, kimchi-making season atmosphere
- **Time of Day**: Daytime or afternoon (warm lighting)
- **Elements**:
  - Hanok tiled roof (background)
  - Yard floor (stone/dirt)
  - Traditional props (jars, wooden crates, platform, etc.)

#### Modeling Specs

**Background Layer Structure with Z-Axis Coordinates:**

| Layer | Description | Z Position (Three.js) | Scale |
|-------|-------------|----------------------|-------|
| **Sky** | Background image/skybox | -100 | N/A (2D) |
| **Hanok Building** | Far background | -50 ~ -80 | 1.0 |
| **Ground Plane** | Yard floor | -10 | 20x20m |
| **Props** | Jars, crates | -5 ~ -15 | 1.0 |
| **Conveyor Path** | Object spawn area | -2 ~ +5 | - |
| **Character** | Fixed position | 0 (origin) | 1.0 |

**Polygon Budget**:
- Total Environment: **15,000 tris or less** (mobile optimized)
- Individual Props: 500 ~ 1,500 tris
- **Critical**: Use instancing for repeated objects (jars, crates) to reduce draw calls

**Camera Position** (Recommended):
- Position: `(0, 5, 15)` (Slightly elevated, behind character)
- LookAt: `(0, 0, -5)` (Toward conveyor path)
- FOV: 50-60°

#### Required Elements

| Element | Description | Poly Count |
|---------|-------------|------------|
| **Hanok Building** | Tiled roof hanok (far background) | 5,000 ~ 10,000 |
| **Ground Plane** | Yard floor (stone/dirt texture) | 500 ~ 1,000 |
| **Onggi Jars** | Traditional jars (3~5 pieces) | ~1,000 each |
| **Wood Crates** | Wooden crates (2~3 pieces) | ~500 each |
| **Pyeongsang** | Traditional platform (optional) | ~1,500 |

#### Optimization Strategy: Instancing & Texture Atlas

**Instancing (for Repeated Props)**:
```
Purpose: Reduce draw calls by reusing same mesh multiple times

Blender Modeling Rules (CRITICAL):
1. Model object at World Origin (0, 0, 0)
2. Base of object MUST sit at Z=0 (Blender coordinate)
   - Example: Jar bottom at Z=0, top at Z=positive
3. Apply ALL transforms before export:
   - Object → Apply → All Transforms (Ctrl+A)
   - Scale MUST be (1, 1, 1)
   - Rotation MUST be (0, 0, 0)
   - Location MUST be (0, 0, 0)
4. Pivot point at object base (bottom center)

Allowed Variations (per-instance):
- ✅ Position (X, Y, Z translation in engine)
- ✅ Rotation (Y-axis rotation only recommended)
- ✅ Scale (uniform scale, e.g., 0.8x or 1.2x)
- ❌ Different materials (use same material)
- ❌ UV offset (bake into single texture)

Three.js Implementation (handled by programmer):
- Load GLB once
- Use InstancedMesh to place 3-5 copies at different positions
- Result: 1 draw call instead of 5

DO NOT create 5 separate jar models!
```

**Texture Atlas (for Small Props)**:
```
Purpose: Combine multiple textures into one atlas to reduce texture switches

Option 1 - Separate Textures (Current):
- onggi-diffuse.png (1024x1024)
- wood-diffuse.png (1024x1024)
- Total: 2 textures

Option 2 - Atlas (Recommended if adding more props):
- props-atlas.png (2048x2048)
  - Top-left quadrant: Onggi texture
  - Top-right quadrant: Wood texture
  - Bottom quadrants: Future props
- Adjust UV coordinates to map to correct atlas region
- Result: 1 texture instead of 4+
```

**Decision**: Start with separate textures (Option 1). If prop count exceeds 3-4 types, switch to atlas.

#### Export Files
```
/assets/environments/
├── hanok-building.glb
├── ground-plane.glb
├── onggi-jar.glb (single instance, reused in engine)
├── wood-crate.glb (single instance, reused in engine)
├── textures/
│   ├── hanok-roof-diffuse.png (2048x2048)
│   ├── ground-diffuse.png (2048x2048)
│   ├── onggi-diffuse.png (1024x1024)
│   └── wood-diffuse.png (1024x1024)
│   # Future: props-atlas.png (if needed)
```

---

### 4. VFX: Seasoning Splash Effect

#### Design
- **Purpose**: Effect when character scoops seasoning (tool gets covered)
- **Style**: Red seasoning splash particles
- **Implementation Method**:
  1. Render sprite sheet in Blender (8x8 or 4x4)
  2. Or individual PNG sequence

#### Specs
```
- Sprite Sheet: 1024x1024 (4x4 = 16 frames)
- Frame Rate: 24fps
- Duration: 0.5 ~ 1 sec
- Alpha Channel: Required
```

#### Export Files
```
/assets/vfx/
├── seasoning-splash-spritesheet.png
└── seasoning-splash-config.json (frame info)
```

---

## 🎨 Art Direction

### Color Palette (Warm Tones)

| Color Usage | Hex Code | Description |
|-------------|----------|-------------|
| **Primary (Red)** | `#DC2626` | Seasoning color |
| **Secondary (Orange)** | `#F97316` | Warm accent |
| **Background (Beige)** | `#FEF3C7` | Hanok wall/yard |
| **Cabbage (Light Green)** | `#BEF264` | Cabbage base |
| **Wood (Brown)** | `#78350F` | Wooden props |
| **Roof (Gray)** | `#64748B` | Tile roof |

### Lighting
- **Main Light**: Sunlight (warm yellow, 45° angle)
- **Ambient**: Soft sky lighting
- **Rim Light**: Character outline highlight (optional)

---

## 🔧 Technical Requirements

### Web Optimization

#### File Size Limits
```
- Character GLB/FBX: < 5MB
- Environment Models: < 10MB
- Textures (PNG): < 1MB each
- Total Asset Bundle: < 30MB
```

#### Texture Compression
- **Diffuse**: PNG or WebP
- **Normal Map**: PNG (Blue channel up)
- **Recommended**: Power-of-2 resolutions (512, 1024, 2048)

#### Model Formats
- **Priority**: GLB/GLTF 2.0 (Web standard)
- **Alternative**: FBX (Three.js compatible)

### Blender Rendering Settings

#### Eevee (Real-time Rendering - Recommended)
```python
# Blender Settings
Render Engine: Eevee
Samples: 64 ~ 128
Viewport Samples: 32
Ambient Occlusion: On
Bloom: On (for seasoning gloss)
Screen Space Reflections: On
```

#### Cycles (High Quality Rendering - Optional)
```python
# For 2D sprite rendering
Render Engine: Cycles
Samples: 256 ~ 512
Denoising: On
Light Paths: 8 ~ 12
```

---

## 📐 Animation System

### Gameplay Flow

```
[Game Start] → [Character Idle]
     ↓
{Rhythm Beat}
     ↓
[Seasoning Phase] → Seasoning Jar Appears
     ↓
[Player Input] → Character swing action
     ↓
[Tool Gets Seasoning] → {Next Beat}
     ↓
[Cabbage Phase] → Cabbage Appears
     ↓
[Player Input] → Character swing action
     ↓
[Spread Seasoning on Cabbage] → Cabbage Color Change
     ↓
{Loop Back to Seasoning Phase}
```

### Conveyor System (Map Movement)

#### Movement Method
- **Character**: Fixed position (center-bottom of screen)
- **Background**: Slowly moves along Z-axis (infinite loop)
- **Objects**: Move along Z-axis (Spawn → Front of Character → Despawn)

#### Timing
- **BPM**: 110
- **Beat Interval**: 545ms (60000 / 110)
- **Object Spawn Intervals**:
  - Seasoning Jar: 1 beat (545ms)
  - Cabbage: Next 1 beat (545ms)
  - Repeat

#### Blender Animation Setup (BPM 110 Synchronized)
```
BPM 110 = 545ms per beat
Object appears 1 beat before hit zone, despawns 1 beat after

- Keyframe 1 (0ms): Position Z = 5 (Spawn point, far away)
- Keyframe 2 (545ms): Position Z = 0 (Hit zone - in front of character)
- Keyframe 3 (1090ms): Position Z = -5 (Despawn point, off screen)
- Interpolation: Linear
- Total Duration: ~1.1 seconds (2 beats)

Note: Adjust Z positions based on actual camera FOV and game testing
```

---

## 📂 File Structure

### Final Directory Structure

```
public/games/kimchi-fest/
├── assets/
│   ├── characters/
│   │   ├── chef-character.glb
│   │   ├── chef-diffuse.png
│   │   ├── chef-normal.png
│   │   ├── ladle.glb
│   │   └── knife.glb
│   │
│   ├── objects/
│   │   ├── cabbage.glb
│   │   ├── cabbage-raw-diffuse.png
│   │   ├── cabbage-seasoned-diffuse.png
│   │   ├── seasoning-jar.glb
│   │   └── seasoning-jar-diffuse.png
│   │
│   ├── environments/
│   │   ├── hanok-background.glb
│   │   ├── ground-plane.glb
│   │   ├── props/
│   │   │   ├── onggi-jar.glb
│   │   │   └── wood-crate.glb
│   │   └── textures/
│   │       ├── hanok-roof-2k.png
│   │       ├── ground-2k.png
│   │       ├── onggi-1k.png
│   │       └── wood-1k.png
│   │
│   └── vfx/
│       ├── seasoning-splash-spritesheet.png
│       └── splash-config.json
│
├── blender-sources/ (Original Files)
│   ├── character.blend
│   ├── objects.blend
│   └── environment.blend
│
└── docs/
    ├── blender-3d-design-spec.md (This document)
    └── blender-workflow-checklist.md
```

---

## 🎬 Blender Workflow (Work Order)

### Phase 1: Character Modeling (Priority 1)
```
1. [ ] Create base mesh (chibi proportions)
2. [ ] Model outfit (chef's apron, bandana)
3. [ ] Rigging (humanoid)
4. [ ] action_swing animation (1 sec)
5. [ ] UV unwrap
6. [ ] Texture painting (Diffuse + Normal)
7. [ ] Model tools (ladle + knife)
8. [ ] Export: GLB/FBX
```

### Phase 2: Game Objects (Priority 2)
```
1. [ ] Model whole cabbage
2. [ ] UV unwrap
3. [ ] 2 textures (raw + seasoned)
4. [ ] Model seasoning jar
5. [ ] Seasoning shader (glossy/semi-transparent)
6. [ ] Export: GLB
```

### Phase 3: Environment/Background (Priority 3)
```
1. [ ] Model hanok building (Low Poly)
2. [ ] Create ground plane
3. [ ] Model traditional props (jars, crates)
4. [ ] Texture baking
5. [ ] Lighting setup
6. [ ] Export: GLB
```

### Phase 4: VFX (Priority 4)
```
1. [ ] Seasoning particle system
2. [ ] Render sprite sheet (4x4)
3. [ ] Check alpha channel
4. [ ] Export: PNG
```

---

## ✅ Quality Checklist

### Modeling
- [ ] Polygon count limit adhered
- [ ] No non-manifold edges
- [ ] Scale applied (Apply Scale)
- [ ] Origin reset (Origin to Geometry)

### Textures
- [ ] Power-of-2 resolutions
- [ ] Alpha channel verified (if needed)
- [ ] File size < 1MB
- [ ] Color profile: sRGB

### Animation
- [ ] Frame rate 24fps
- [ ] Loopable (first frame = last frame)
- [ ] Baked (Bake Action)

### Export
- [ ] GLB/FBX format
- [ ] Textures embedded or separate
- [ ] Metadata verified (filename, size)

---

## 📝 Notes & Reminders

### Key Design Decisions
1. **Character poses**: Only 1 action pose needed (swing), UI handles feedback
2. **Bucket visualization**: UI-only (red progress bar), no 3D model needed for now
3. **Cabbage rendering**: 2 texture versions (raw/seasoned) more efficient than 2 models
4. **Seasoning effect**: Character tool gets seasoning (A) + Jar nearby (C)
5. **Map movement**: Objects move toward fixed character (conveyor style)

### Gameplay Rules (CRITICAL)
- ✅ Seasoning **ALWAYS** appears first
- ✅ After seasoning, **EXACTLY 1** cabbage appears
- ✅ Cabbage can **NEVER** appear before seasoning
- ✅ Pattern: Seasoning → Cabbage → Seasoning → Cabbage (infinite loop)

### Future Enhancements (Optional)
- 3D bucket/jar model with fill animation
- Character idle/reaction poses for better feedback
- More complex background scenery
- Seasonal variations (spring/summer/fall/winter kimchi)

---

## 🤝 Collaboration Workflow (Codex ↔ Claude)

### Team Structure
- **Manager**: Codex MCP (관리자)
  - Role: Project oversight, quality control, technical review
  - Responsibility: Approve/reject work, provide improvement feedback

- **Worker**: Claude Code (실무자)
  - Role: Implementation, 3D modeling, scripting, asset creation
  - Responsibility: Execute tasks, propose improvements, implement feedback

### Workflow Process

#### 1. Phase-by-Phase Review
```
[Claude] Phase N 작업 완료
    ↓
[Claude] Codex에게 리뷰 요청
    ↓
[Codex] 작업 검토 및 피드백 제공
    ↓
[Both] 상호 논의 (if needed)
    ↓
[Claude] 승인 OR 개선 사항 적용
    ↓
[Codex] 최종 승인
    ↓
[Claude] 다음 Phase 진행
```

#### 2. Feedback Guidelines

**Claude (실무자) 원칙:**
- ✅ **타당한 피드백은 즉시 수용** (기술적으로 올바른 지적, 품질 향상 제안)
- 🤔 **의문이 있는 경우 상호 논의** (트레이드오프, 대안 존재, 불명확한 요구사항)
- 💡 **건설적 건의** (더 나은 방법 제안, 잠재적 문제 지적)
- ❌ **무조건 수용 금지** (맹목적 수용보다 이해 후 실행)

**Codex (관리자) 역할:**
- 각 Phase 완료 후 품질 검토
- 구체적이고 실행 가능한 피드백 제공
- Claude의 건의사항에 대한 기술적 판단
- 최종 승인 권한

#### 3. Discussion Protocol

**상호 논의가 필요한 경우:**
- 폴리곤 예산 초과 시 (예: Edge loop 추가 vs. 단순화)
- 성능 vs. 품질 트레이드오프
- 기술적 제약 vs. 디자인 요구사항
- 애니메이션 타이밍/스타일 조정
- 텍스처 해상도/방식 선택

**논의 예시 (Character Phase 1 - Edge Loop):**
```
Codex: "관절에 edge loop 추가하면 변형이 부드러워집니다"
Claude: "subdivide하면 3,000 tris 초과합니다. 수동으로 loop cut 8개만 추가하면 어떨까요?"
Codex: "좋습니다. 더 정밀하고 예산 내에 들어옵니다"
Result: +144 tris, 부드러운 관절 변형 달성 ✅
```

#### 4. Phase Approval Checklist

각 Phase 완료 시 Codex 확인 사항:
- [ ] 사양 준수 (폴리곤 수, 텍스처 크기, 애니메이션 타이밍)
- [ ] 기술적 품질 (토폴로지, UV unwrap, 리깅, 웨이트 페인팅)
- [ ] 최적화 (web 성능, 파일 크기)
- [ ] 일관성 (디자인 방향, 아트 스타일)

**승인 후에만** 다음 Phase 진행 가능

---

## 📞 Contact & Collaboration

**Designer/Artist**: [Your Name]
**Developer/Worker**: Claude Code (AI Assistant - 実務者)
**Manager/Reviewer**: Codex MCP

**Review Schedule**: After each phase completion (mandatory)
**Feedback Loop**: Iterative improvement based on mutual discussion

---

**Last Updated**: 2025-11-14
**Document Version**: 1.0
**Status**: Ready for Blender Work
