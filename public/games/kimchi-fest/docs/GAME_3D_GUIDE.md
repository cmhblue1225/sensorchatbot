# Kimchi Fest 3D Rhythm Game - Complete Guide

## Table of Contents

1. [Quick Start](#quick-start)
2. [Asset Replacement Workflow](#asset-replacement-workflow)
3. [BPM and Rhythm Tuning](#bpm-and-rhythm-tuning)
4. [SessionSDK Integration](#sessionsdk-integration)
5. [Troubleshooting](#troubleshooting)
6. [Architecture Overview](#architecture-overview)

---

## Quick Start

### Running the Game

1. **Start the server:**
   ```bash
   cd C:\Users\Jaewon\Desktop\졸작\sensorchatbot
   npm start
   ```

2. **Open in browser:**
   ```
   http://localhost:3000/games/kimchi-fest/game-3d.html
   ```

3. **Play!**
   - Press **START GAME**
   - Use **Space / Z / Click** to swing
   - Or shake mobile device (after sensor connection)

---

## Asset Replacement Workflow

### 🎯 Goal: Replace 3D assets without touching code

### Step 1: Prepare Your Assets

**Requirements:**
- **File Format**: GLB (binary glTF 2.0)
- **Orientation**: +Y Up (REQUIRED)
- **Units**: Meters (1 unit = 1 meter)
- **Polygon Budget**: < 10K tris per asset (for mobile)
- **Textures**: Embed in GLB or < 2K resolution

**Export from Blender:**
```
File → Export → glTF 2.0 (.glb)
☑ +Y Up
☑ Apply Modifiers
☑ Include Materials
☑ Export Textures
```

### Step 2: Update config.json

**Location**: `kimchi-fest/assets/config.json`

**Replace character asset:**
```json
{
  "assets": {
    "character": {
      "idle": {
        "url": "./characters/my-custom-chef-idle.glb",  // ← Your file
        "scale": 2.0,  // Adjust size
        "animations": ["idle", "action_idle"]
      }
    }
  }
}
```

**Replace ingredient asset:**
```json
{
  "assets": {
    "ingredients": {
      "cabbage": {
        "url": "./my-custom-cabbage.glb",  // ← Your file
        "scale": 1.5,
        "objectName": "My_Cabbage_Mesh",  // Must match object name in GLB
        "materials": {
          "raw": "Material_Raw",  // Material names in your GLB
          "seasoned": "Material_Seasoned"
        }
      }
    }
  }
}
```

### Step 3: Drop Files & Refresh

1. **Copy your GLB files** to the correct folders:
   ```
   assets/
   ├── characters/
   │   └── my-custom-chef-idle.glb  ← Drop here
   ├── my-custom-cabbage.glb         ← Or here
   ```

2. **Refresh browser** (F5 or Ctrl+R)

**That's it!** Your assets are now in the game.

---

## Asset Naming Conventions

### Object Names (Inside GLB)

**Character:**
- Any skeleton with Mixamo-compatible bones
- Root bone recommended: `Hips` or `mixamorig:Hips`

**Cabbage (Material Switching):**
- Object name: `Napa_Cabbage` (or update `config.json`)
- Material slots:
  - Slot 0: `Cabbage_Raw`
  - Slot 1: `Cabbage_Seasoned`

**Onggi Jar (Separate Objects):**
- `Onggi_Body` - Jar body
- `Onggi_Lid` - Jar lid (for animation)

**Hanok Building:**
- Any object names (modular design)
- Recommended: `Hanok_Roof`, `Hanok_Wall_Left`, etc.

**Props (Instancing):**
- `Prop_WoodenCrate`
- `Prop_Lantern`
- `Prop_SeasoningBasket`

### Animation Names

**Character animations must match:**
- `idle` or `action_idle` - Looping idle
- `swing` or `action_swing` - One-shot swing action

**Export from Blender:**
- NLA Editor → Actions → Export with names

---

## BPM and Rhythm Tuning

### Adjusting BPM

**Location**: `assets/config.json`

```json
{
  "gameplay": {
    "rhythm": {
      "bpm": 120,  // ← Beats per minute (60-180 recommended)
      "beatsPerMeasure": 4,  // ← Time signature
      "offset": 0,  // ← Audio sync offset (ms)
      "timingWindows": {
        "perfect": 0.05,  // ±50ms
        "good": 0.15,     // ±150ms
        "miss": 0.3       // ±300ms
      }
    }
  }
}
```

**BPM Guide:**
- **60-90**: Slow, relaxed
- **90-120**: Moderate (default)
- **120-140**: Upbeat
- **140-180**: Fast, challenging

### Timing Windows

**Tighter windows = Harder game:**
```json
"timingWindows": {
  "perfect": 0.03,  // ±30ms (very strict)
  "good": 0.10,     // ±100ms
  "miss": 0.20      // ±200ms
}
```

**Looser windows = Easier game:**
```json
"timingWindows": {
  "perfect": 0.08,  // ±80ms (forgiving)
  "good": 0.20,     // ±200ms
  "miss": 0.40      // ±400ms
}
```

### Audio Offset Calibration

If audio and visuals are out of sync:

1. **Play game and observe**:
   - Beats sound **before** visual cues → Positive offset needed
   - Beats sound **after** visual cues → Negative offset needed

2. **Adjust offset** (in milliseconds):
   ```json
   "offset": 50  // Audio is 50ms early
   ```

3. **Test and iterate** until synced

---

## Spawning Configuration

### Adjust Spawn Intervals

**Location**: `assets/config.json → gameplay.spawning`

```json
{
  "spawning": {
    "seasoningInterval": 2,  // Spawn seasoning every 2 beats
    "cabbageInterval": 2,    // Spawn cabbage every 2 beats
    "spawnDistance": 30,     // Distance in front of chef
    "despawnDistance": -10   // Distance behind chef (cleanup)
  }
}
```

**Dense spawning (harder):**
```json
"seasoningInterval": 1,
"cabbageInterval": 1
```

**Sparse spawning (easier):**
```json
"seasoningInterval": 4,
"cabbageInterval": 4
```

---

## Scoring Configuration

**Location**: `assets/config.json → gameplay.scoring`

```json
{
  "scoring": {
    "perfect": 100,        // Points for perfect hit
    "good": 50,            // Points for good hit
    "miss": 0,             // Points for miss
    "comboMultiplier": 1.1 // Multiplier per combo level
  }
}
```

**Combo Multiplier:**
- Combo 1: 1.0×
- Combo 2: 1.1×
- Combo 3: 1.21× (1.1²)
- Combo 4: 1.33× (1.1³)
- ...caps at combo 10

**High scoring game:**
```json
"perfect": 200,
"good": 100,
"comboMultiplier": 1.2  // Faster ramp-up
```

---

## SessionSDK Integration

### Mobile Sensor Setup

**The game already includes SessionSDK fallback code.**

To enable mobile sensors:

1. **Uncomment SessionSDK initialization** in `js/Game.js`:
   ```javascript
   // In Game.initialize():
   if (typeof window.SessionSDK !== 'undefined') {
       await this.inputAdapter.initializeSDK(new window.SessionSDK({
           gameId: 'kimchi-fest-3d',
           gameType: 'solo',
           debug: true
       }));
   }
   ```

2. **Include SessionSDK script** in `game-3d.html`:
   ```html
   <script src="/js/SessionSDK.js"></script>
   ```

3. **Create QR code** for sensor connection:
   - Session code appears in console
   - Navigate to `/sensor.html?session=CODE`

### Sensor Input Mapping

**Current mapping** (in `InputAdapter.js`):
- **Shake** (acceleration > 15) → `swing` action
- **Tilt** (beta/gamma > 30°) → `tilt` action

**Adjust thresholds:**
```javascript
this.inputAdapter.setThreshold('shake', 20); // More sensitive
this.inputAdapter.setThreshold('tilt', 45);  // Less sensitive
```

---

## Troubleshooting

### Assets Not Loading

**Symptom**: Black screen, console errors about failed GLB loads

**Solutions:**
1. **Check file paths** in `config.json`:
   ```
   "./characters/chef.glb" ✓
   "/characters/chef.glb"  ✗ (absolute path, wrong)
   ```

2. **Verify GLB files exist**:
   ```bash
   ls assets/characters/
   ```

3. **Check browser console** (F12) for specific errors

4. **Clear cache** (Ctrl+Shift+R)

---

### Wrong Asset Orientation

**Symptom**: Character lying down, objects sideways

**Cause**: Asset not exported as +Y Up

**Solution:**
- Re-export with +Y Up
- Or adjust in `config.json`:
  ```json
  "rotation": [1.5708, 0, 0]  // 90° X rotation (radians)
  ```

---

### Performance Issues (Low FPS)

**Symptoms**: Game runs < 30 FPS, stuttering

**Solutions:**

1. **Reduce polygon counts**:
   - Use Decimate modifier in Blender
   - Target < 10K tris per asset

2. **Lower shadow quality** in `GameScene.js`:
   ```javascript
   this.lights.key.shadow.mapSize.width = 1024;  // Default: 2048
   this.lights.key.shadow.mapSize.height = 1024;
   ```

3. **Disable shadows** for props:
   ```javascript
   // In GameScene.loadProps():
   // crate1.castShadow = false;  // ← Comment out
   ```

4. **Reduce spawn density**:
   ```json
   "seasoningInterval": 4,
   "cabbageInterval": 4
   ```

---

### Timing Feels Off

**Symptom**: Perfect hits feel late/early

**Solutions:**

1. **Adjust offset**:
   ```json
   "offset": 50  // Try values between -100 to +100
   ```

2. **Widen timing windows**:
   ```json
   "timingWindows": {
     "perfect": 0.08,
     "good": 0.20
   }
   ```

3. **Test on different devices** - latency varies

---

### Material Switching Not Working

**Symptom**: Cabbage doesn't change color when seasoned

**Causes & Fixes:**

1. **Wrong material names**:
   ```json
   // config.json must match GLB material names exactly
   "materials": {
     "raw": "Cabbage_Raw",      // ← Case-sensitive!
     "seasoned": "Cabbage_Seasoned"
   }
   ```

2. **Wrong object name**:
   ```json
   "objectName": "Napa_Cabbage"  // Must match GLB
   ```

3. **Debug in browser console**:
   ```javascript
   // In console (F12):
   game.assetLoader.get('ingredients', 'cabbage')
   // Check .materials property
   ```

---

## Architecture Overview

### System Components

```
Game.js (Main Controller)
├── AssetLoader.js      → Manifest system, GLB loading
├── RhythmEngine.js     → BPM, beat detection, timing
├── GameScene.js        → Three.js scene, chef, camera
├── SpawningSystem.js   → Ingredient spawning, lifecycle
└── InputAdapter.js     → Sensor + keyboard/mouse input
```

### Data Flow

```
1. AssetLoader reads config.json
   ↓
2. Loads all GLB files
   ↓
3. RhythmEngine starts beat clock
   ↓
4. SpawningSystem spawns on beats
   ↓
5. InputAdapter captures player action
   ↓
6. Game.js judges timing & updates score
   ↓
7. GameScene.js renders + animates
```

### File Structure

```
kimchi-fest/
├── game-3d.html              # Main game page
├── test-integration.html     # Asset test page
├── assets/
│   ├── config.json           # ← MAIN CONFIG
│   ├── characters/           # Character GLBs
│   ├── cabbage.glb
│   ├── onggi-jar.glb
│   ├── hanok.glb
│   ├── ground.glb
│   └── props.glb
├── js/
│   ├── Game.js               # Main controller
│   ├── RhythmEngine.js       # Timing system
│   ├── AssetLoader.js        # Asset manager
│   ├── GameScene.js          # 3D scene
│   ├── SpawningSystem.js     # Object spawning
│   └── InputAdapter.js       # Input handling
└── docs/
    ├── GAME_3D_GUIDE.md      # This file
    ├── phase2-threejs-integration-notes.md
    └── phase3-threejs-integration-guide.md
```

---

## Advanced Customization

### Custom Rail Path

**Edit**: `GameScene.js → createRailPath()`

```javascript
// Straight path
for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = -t * pathLength;
    const x = 0;  // Straight
    points.push(new THREE.Vector3(x, 0, z));
}

// S-curve path
const x = Math.sin(t * Math.PI * 2) * 4;

// Spiral path
const x = Math.cos(t * Math.PI * 4) * (t * 5);
const z = Math.sin(t * Math.PI * 4) * (t * 5);
```

### Custom Scoring Formula

**Edit**: `Game.js → handleHit()`

```javascript
// Linear scoring
const score = baseScore + (this.state.combo * 10);

// Exponential scoring
const score = baseScore * Math.pow(1.2, this.state.combo);

// Time-based bonus
const timeSinceStart = this.rhythmEngine.getCurrentTimeSec();
const timeBonus = Math.floor(timeSinceStart * 5);
const score = baseScore + timeBonus;
```

### Custom Spawn Patterns

**Edit**: `SpawningSystem.js → handleBeat()`

```javascript
// Random spawning
if (Math.random() < 0.5) {
    this.spawnSeasoning();
}

// Pattern-based spawning
const pattern = [1, 0, 1, 0, 1, 1, 0, 0]; // Binary pattern
if (pattern[beat % pattern.length] === 1) {
    this.spawnCabbage();
}
```

---

## Hot-Reload Support

### Quick Asset Testing

**Method 1: Config-only reload**
1. Edit `config.json`
2. Open browser console (F12)
3. Run:
   ```javascript
   await game.assetLoader.reload();
   ```

**Method 2: Replace GLB + refresh**
1. Replace GLB file
2. Refresh browser (F5)
3. Assets reload automatically

**Method 3: Development server** (future)
- Watch `config.json` for changes
- Auto-reload on file save

---

## Performance Benchmarks

**Target Performance:**
- **Desktop**: 60 FPS @ 1080p
- **Mobile**: 30-60 FPS @ 720p

**Current Asset Stats:**
- Total: ~0.98 MB (< 1 MB!)
- Polygons: ~17K tris total
- Load time: < 2 seconds

**Optimization Tips:**
- Use object pooling (already implemented)
- Limit active objects to < 50
- Use instancing for props
- Keep textures < 1024×1024

---

## FAQ

**Q: Can I use FBX files instead of GLB?**
A: Yes, but you need to change the loader in `AssetLoader.js` to `FBXLoader`. GLB is recommended.

**Q: How do I add more ingredient types?**
A: Add to `config.json → assets.ingredients`, then update `SpawningSystem.js` to spawn them.

**Q: Can I change the camera angle?**
A: Yes, edit `GameScene.js → cameraOffset` (default: `[0, 5, 10]`).

**Q: How do I make the game harder/easier?**
A: Adjust `timingWindows`, `spawnInterval`, and `comboMultiplier` in `config.json`.

**Q: Does this work in React Three Fiber?**
A: Yes! The systems are modular. Wrap components in R3F and use hooks.

---

## Support

**Issues**: Report at GitHub or contact dev team
**Documentation**: See `docs/` folder for detailed guides
**Test Page**: Use `test-integration.html` to verify assets before gameplay

---

**Kimchi Fest 3D Rhythm Game v1.0**
Built with Three.js, SessionSDK, and love for kimchi! 🥬🌶️✨
