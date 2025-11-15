# Kimchi Fest - 3D Rhythm Game

> Beat-synchronized kimchi-making rhythm action game with swappable 3D assets

## 🎮 Quick Start

```bash
# Start server
cd sensorchatbot
npm start

# Open browser
http://localhost:3000/games/kimchi-fest/game-3d.html
```

**Controls:**
- **Space / Z / Click** = Swing (apply seasoning)
- **X / Enter** = Season (alternative)
- **C** = Shake
- **D** = Debug panel
- **Mobile**: Shake device to swing

---

## 🎯 Gameplay

1. Chef automatically moves along a path
2. **Seasoning** spawns first (rhythm-based)
3. **Cabbage** spawns second (rhythm-based)
4. **Swing** at the right moment to apply seasoning to cabbage
5. Earn **Perfect / Good** judgments for points
6. Build **combos** for score multipliers
7. Reach the end with highest score!

---

## 📦 Asset Replacement (Zero Code!)

### Step 1: Prepare GLB File
- Format: **GLB** (binary glTF 2.0)
- Orientation: **+Y Up** (required)
- Polygon count: < 10K tris recommended

### Step 2: Edit config.json
```json
{
  "assets": {
    "character": {
      "idle": {
        "url": "./characters/YOUR_CHEF.glb",  // ← Drop your file
        "scale": 2.0
      }
    }
  }
}
```

### Step 3: Refresh Browser
**That's it!** Your asset is now in the game.

📖 **Full guide**: [GAME_3D_GUIDE.md](./docs/GAME_3D_GUIDE.md)

---

## 🎵 BPM Tuning

```json
{
  "gameplay": {
    "rhythm": {
      "bpm": 120,          // ← Adjust tempo
      "timingWindows": {
        "perfect": 0.05,   // ← Tighter = harder
        "good": 0.15,
        "miss": 0.3
      }
    }
  }
}
```

---

## 🏗️ Architecture

```
Game.js
├── AssetLoader.js      → Manifest-based GLB loading
├── RhythmEngine.js     → BPM, beat detection, timing judgment
├── GameScene.js        → Three.js scene, chef rail, camera
├── SpawningSystem.js   → Rhythm-synced ingredient spawning
└── InputAdapter.js     → Sensor + keyboard/mouse input
```

**Design Principles:**
- **Modular**: Each system independent
- **Configurable**: Everything in `config.json`
- **Swappable**: Assets hot-reload without code changes
- **Extensible**: Easy to port to React Three Fiber

---

## 📁 File Structure

```
kimchi-fest/
├── game-3d.html              # 🎮 Main game (start here!)
├── test-integration.html     # 🧪 Asset test page
├── assets/
│   ├── config.json           # ⚙️ Main config (edit this!)
│   ├── characters/
│   │   ├── chef-character-idle.glb
│   │   ├── chef-character-swing.glb
│   │   ├── knife.glb
│   │   └── ladle.glb
│   ├── cabbage.glb
│   ├── onggi-jar.glb
│   ├── hanok.glb
│   ├── ground.glb
│   └── props.glb
├── js/
│   ├── Game.js
│   ├── RhythmEngine.js
│   ├── AssetLoader.js
│   ├── GameScene.js
│   ├── SpawningSystem.js
│   └── InputAdapter.js
└── docs/
    ├── GAME_3D_GUIDE.md      # 📖 Complete guide
    ├── phase2-threejs-integration-notes.md
    └── phase3-threejs-integration-guide.md
```

---

## ✨ Features

### Implemented ✅
- [x] BPM-based rhythm engine with high-precision timing
- [x] Perfect / Good / Miss judgment system
- [x] Combo system with score multipliers
- [x] Chef movement on curved rail path
- [x] Rhythm-synchronized spawning (seasoning → cabbage)
- [x] Material variant switching (raw → seasoned cabbage)
- [x] SessionSDK sensor integration + keyboard/mouse fallback
- [x] Manifest-based asset loading (hot-reload support)
- [x] Real-time UI (score, combo, judgment, beat indicator)
- [x] Results screen with grade calculation
- [x] Debug panel (beat, FPS, object counts)
- [x] Object pooling for performance
- [x] Shadow mapping and PBR materials
- [x] Comprehensive documentation

### Asset Swappable ✅
- Character (idle/swing animations)
- Tools (knife, ladle)
- Ingredients (cabbage with material variants, seasoning jar)
- Environment (hanok, ground, props)

---

## 🎨 Asset Conventions

### Required
- **+Y Up orientation** (critical!)
- **GLB format** (binary glTF 2.0)
- **Embedded textures** (or none)

### Recommended
- **Polygon count**: < 10K tris per asset
- **Texture resolution**: < 2048×2048
- **Animation FPS**: 24 fps
- **Units**: Meters (1 unit = 1 meter)

### Object Naming
- **Cabbage**: `Napa_Cabbage` (for material switching)
- **Jar**: `Onggi_Body`, `Onggi_Lid` (for lid animation)
- **Materials**: `Cabbage_Raw`, `Cabbage_Seasoned` (for variants)
- **Animations**: `idle`, `swing` (or `action_idle`, `action_swing`)

---

## 📊 Performance

**Current Stats:**
- Total asset size: **0.98 MB** (< 1 MB!)
- Total polygons: **~17K tris**
- Load time: **< 2 seconds**
- Target FPS: **60 FPS** (desktop), **30-60 FPS** (mobile)

**Optimization:**
- Object pooling (reuse spawned objects)
- Frustum culling (automatic)
- Shadow map: 2048×2048
- Instancing for props

---

## 🔧 Configuration Reference

### Rhythm
```json
"rhythm": {
  "bpm": 120,              // Beats per minute
  "beatsPerMeasure": 4,    // Time signature
  "offset": 0,             // Audio sync offset (ms)
  "timingWindows": {
    "perfect": 0.05,       // ±50ms
    "good": 0.15,          // ±150ms
    "miss": 0.3            // ±300ms
  }
}
```

### Spawning
```json
"spawning": {
  "seasoningInterval": 2,  // Beats between spawns
  "cabbageInterval": 2,
  "spawnDistance": 30,     // Distance from chef
  "despawnDistance": -10   // Cleanup threshold
}
```

### Scoring
```json
"scoring": {
  "perfect": 100,          // Base score
  "good": 50,
  "miss": 0,
  "comboMultiplier": 1.1   // Per combo level
}
```

### Rail
```json
"rail": {
  "pathLength": 50,        // Total path distance
  "chefSpeed": 5,          // Units per second
  "cameraOffset": [0, 5, 10],
  "cameraLookAhead": 5
}
```

---

## 🐛 Troubleshooting

### Assets not loading
1. Check file paths in `config.json`
2. Verify GLB files exist
3. Clear cache (Ctrl+Shift+R)
4. Check browser console (F12)

### Wrong orientation
1. Re-export with **+Y Up**
2. Or adjust rotation in `config.json`:
   ```json
   "rotation": [1.5708, 0, 0]  // 90° X rotation
   ```

### Performance issues
1. Reduce polygon counts (Decimate in Blender)
2. Lower shadow quality in `GameScene.js`
3. Reduce spawn density in `config.json`

### Timing feels off
1. Adjust `offset` in `config.json` (-100 to +100 ms)
2. Widen `timingWindows`
3. Test on different devices

**Full troubleshooting**: [GAME_3D_GUIDE.md](./docs/GAME_3D_GUIDE.md#troubleshooting)

---

## 📖 Documentation

- **[GAME_3D_GUIDE.md](./docs/GAME_3D_GUIDE.md)** - Complete guide (asset swap, BPM tuning, troubleshooting)
- **[phase2-threejs-integration-notes.md](./docs/phase2-threejs-integration-notes.md)** - Cabbage & jar integration
- **[phase3-threejs-integration-guide.md](./docs/phase3-threejs-integration-guide.md)** - Environment integration
- **[project-final-report.md](./docs/project-final-report.md)** - Asset creation report

---

## 🚀 Next Steps

### For Developers
1. **Test gameplay**: Play `game-3d.html`
2. **Verify assets**: Use `test-integration.html`
3. **Customize**: Edit `config.json`
4. **Replace assets**: Drop GLB files + update config
5. **Tune difficulty**: Adjust timing windows, BPM, spawn rates

### For Artists
1. **Export GLBs** with +Y Up orientation
2. **Update `config.json`** with your file paths
3. **Refresh browser** to see changes
4. **No code required!**

### For Integration
- **React Three Fiber**: Systems are modular, wrap in R3F components
- **SessionSDK**: Already integrated, uncomment in `Game.js`
- **Custom UI**: Replace HTML/CSS in `game-3d.html`

---

## 🎓 Learning Resources

**Three.js:**
- [Three.js Documentation](https://threejs.org/docs/)
- [Three.js Examples](https://threejs.org/examples/)

**glTF/GLB:**
- [glTF Specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
- [glTF Validator](https://github.khronos.org/glTF-Validator/)

**Blender Export:**
- [Blender glTF Exporter](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html)

---

## 🤝 Credits

**Game Systems**: Vanilla Three.js + custom rhythm engine
**Asset Format**: GLB (glTF 2.0)
**Input**: SessionSDK + keyboard/mouse fallback
**Performance**: Object pooling, shadow optimization

**Built with:** Three.js, love for kimchi, and a passion for modular architecture 🥬🌶️✨

---

## 📝 Version

**v1.0.0** - Initial release

**Milestone achievements:**
- ✅ Rhythm engine with BPM scheduling
- ✅ Asset manifest system with hot-reload
- ✅ Modular architecture (React Three Fiber ready)
- ✅ Complete documentation
- ✅ Asset-swappable design (zero code changes)

---

## 📞 Support

**Issues**: Check [GAME_3D_GUIDE.md](./docs/GAME_3D_GUIDE.md) troubleshooting section
**Questions**: See FAQ in guide
**Bug Reports**: Contact development team

**Happy kimchi-making! 🎮✨**
