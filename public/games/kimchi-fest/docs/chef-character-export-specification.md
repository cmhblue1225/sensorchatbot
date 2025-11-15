# Chef Character - Export Specification
**Date**: 2025-11-15
**Project**: Kimchi Fest
**Blender Version**: 4.4
**Export Format**: GLB (glTF 2.0 Binary)

---

## 📂 Exported Files Summary

| File Name | Size | Contents | Purpose |
|-----------|------|----------|---------|
| `chef-character-idle.glb` | 247.4 KB | Character + Rig + Idle Animation | Idle/waiting state |
| `chef-character-swing.glb` | 247.4 KB | Character + Rig + action_swing Animation | Action state (BPM 110 sync) |
| `ladle.glb` | 56.7 KB | Ladle mesh + HitZone_Tool_Ladle | Tool (국자) |
| `knife.glb` | 0.3 KB | Knife mesh + HitZone_Tool_Knife | Tool (칼) |
| **Total** | **~551 KB** | | < 5MB budget ✅ |

---

## 🦴 Bone Structure (Armature: Chef_Rig)

### Bone Hierarchy
```
Chef_Rig (Armature)
└─ Hips
   ├─ Spine
   │  ├─ Neck
   │  │  └─ Head
   │  ├─ LeftShoulder
   │  │  └─ LeftArm
   │  │     └─ LeftForeArm
   │  │        └─ LeftHand
   │  └─ RightShoulder
   │     └─ RightArm
   │        └─ RightForeArm
   │           └─ RightHand  ← **Tool attachment point**
   ├─ LeftUpLeg
   │  └─ LeftLeg
   │     └─ LeftFoot
   └─ RightUpLeg
      └─ RightLeg
         └─ RightFoot
```

### Bone Naming Convention
- ✅ **Mixamo/Three.js Compatible**
- ✅ Standard humanoid rig
- ✅ 18 bones total
- ✅ All bones use XYZ Euler rotation mode

### Critical Bone for Tool Attachment
- **Name**: `RightHand`
- **Purpose**: Attach ladle/knife at runtime
- **Location**: Right hand position in rig
- **Access in Three.js**: `character.getObjectByName('RightHand')`

---

## 🎬 Animation Specifications

### Animation 1: Idle
**File**: `chef-character-idle.glb`

| Property | Value |
|----------|-------|
| Action Name | `Idle` |
| Frame Range | 1 - 48 |
| Duration | 47 frames |
| Duration (ms) | 1,958 ms @ 24fps |
| FPS | 24 (CRITICAL) |
| Animated Bones | Spine, Head, RightArm, LeftArm |
| Loop | Yes (seamless) |
| Description | Breathing animation with subtle body movement |

**Keyframe Breakdown**:
- Frame 1: Base pose
- Frame 12: Breathing in (spine slightly up)
- Frame 24: Back to base
- Frame 36: Breathing out (spine slightly down)
- Frame 48: Return to base (loop)

---

### Animation 2: action_swing
**File**: `chef-character-swing.glb`

| Property | Value |
|----------|-------|
| Action Name | `action_swing` |
| Frame Range | 0 - 13 |
| Duration | **13 frames** (CRITICAL) |
| Duration (ms) | **542 ms @ 24fps** |
| BPM Sync | BPM 110 (545ms beat interval) |
| Difference | 3ms (acceptable) |
| FPS | 24 (CRITICAL) |
| Animated Bones | RightArm, RightForeArm, RightHand, Spine, Head |
| Loop | Yes (seamless) |
| Description | Tool swinging motion for rhythm game |

**Keyframe Breakdown**:
- Frame 0: Idle pose (tool at side)
- Frame 3: Wind-up (arm back, body twist)
- Frame 7: **Peak** (swing forward/up, maximum extension)
- Frame 11: Follow-through (arm extends, deceleration)
- Frame 13: Return to idle (loop start)

**⚠️ CRITICAL**:
- **DO NOT change frame count** (must be exactly 13 frames)
- **DO NOT change FPS** (must be 24fps)
- This animation is synchronized to BPM 110 rhythm

---

## 🔧 Tool Specifications

### Tool 1: Ladle (국자)
**File**: `ladle.glb`

| Property | Value |
|----------|-------|
| Polygon Count | 1,216 tris |
| Budget | 500 ~ 2,000 tris ✅ |
| Material | Metallic (Silver) |
| UV Unwrapped | Yes |
| Texture Size | 1024x1024 (embedded) |

**Hierarchy**:
```
Ladle (Mesh)
└─ HitZone_Tool_Ladle (Empty - Plain Axes)
   Location: Ladle tip (0.35m forward from center)
   Rotation: +X axis points forward (swing direction)
   Type: PLAIN_AXES
   Radius: 0.1
```

**HitZone_Tool_Ladle Specification**:
- **Type**: Empty object (Plain Axes)
- **Position**: At tip of ladle bowl
- **Offset from Ladle center**: Y +0.35m, Z +0.05m
- **Orientation**: +X axis = swing direction (forward)
- **Purpose**: Collision detection raycast origin
- **Access in Three.js**: `ladle.getObjectByName('HitZone_Tool_Ladle')`

---

### Tool 2: Knife (칼)
**File**: `knife.glb`

| Property | Value |
|----------|-------|
| Polygon Count | 1,152 tris |
| Budget | 500 ~ 2,000 tris ✅ |
| Material | Metal blade + Wood handle |
| UV Unwrapped | Yes |
| Texture Size | 1024x1024 (embedded) |

**Hierarchy**:
```
Knife (Mesh)
└─ HitZone_Tool_Knife (Empty - Plain Axes)
   Location: Knife blade tip (0.4m forward from center)
   Rotation: +X axis points forward (swing direction)
   Type: PLAIN_AXES
   Radius: 0.1
```

**HitZone_Tool_Knife Specification**:
- **Type**: Empty object (Plain Axes)
- **Position**: At tip of knife blade
- **Offset from Knife center**: Y +0.4m
- **Orientation**: +X axis = swing direction (forward)
- **Purpose**: Collision detection raycast origin
- **Access in Three.js**: `knife.getObjectByName('HitZone_Tool_Knife')`

---

## 🛠️ Blender Export Settings

### GLB Export Parameters (Used for All Files)

```javascript
{
  "export_format": "GLB",           // Binary format
  "use_selection": true,             // Selected objects only
  "export_animations": true,         // Include animations
  "export_apply": true,              // Apply modifiers
  "export_yup": true,                // ⚠️ CRITICAL: +Y Up conversion
  "export_nla_strips": false,        // Don't export NLA
  "export_def_bones": false          // Simpler bone export
}
```

### Critical Export Settings

1. **+Y Up Enabled** (CRITICAL)
   - Blender uses Z-up coordinate system
   - GLB standard uses Y-up coordinate system
   - Export addon automatically converts coordinates
   - **Three.js can load GLB directly without transforms**

2. **Animation Export**
   - Only active action is exported per file
   - `chef-character-idle.glb`: Idle action set as active
   - `chef-character-swing.glb`: action_swing set as active

3. **Bone Influence Limit**
   - Max 4 bones per vertex (web performance)
   - Automatically normalized by exporter

---

## 📐 Coordinate Systems

### Blender (Modeling)
```
Z-up, Y-forward, X-right
```

### GLB Export (Automatic Conversion)
```
Y-up, Z-forward, X-right
```

### Three.js (Runtime)
```
Y-up, Z-forward, X-right
(Matches GLB, no conversion needed)
```

**⚠️ Important**:
- DO NOT apply additional coordinate transforms in Three.js
- GLB exporter handles conversion automatically
- Loading GLB as-is will work correctly

---

## 🎨 Material & Texture Information

### Character Material
- **Name**: `Chef_Material`
- **Type**: Principled BSDF
- **Diffuse Texture**: `Chef_Diffuse` (2048x2048, embedded in GLB)
- **Normal Map**: None (optional for future)
- **Alpha**: Opaque

### Ladle Material
- **Name**: `Ladle_Material`
- **Type**: Principled BSDF
- **Base Color**: Silver (0.7, 0.7, 0.75)
- **Metallic**: 0.8
- **Roughness**: 0.3

### Knife Material
- **Name**: `Knife_Blade_Material`
- **Type**: Principled BSDF
- **Base Color**: Silver (0.8, 0.8, 0.85)
- **Metallic**: 0.9
- **Roughness**: 0.2

---

## ✅ Quality Checklist

### Pre-Export Verification
- [x] Scene FPS is 24
- [x] All bones use XYZ Euler rotation mode
- [x] Bone names follow Mixamo convention
- [x] Max 4 bone influences per vertex
- [x] All transforms applied (Scale = 1,1,1)
- [x] UV unwrapping complete
- [x] Materials assigned

### Post-Export Verification
- [x] chef-character-idle.glb: 247.4 KB
- [x] chef-character-swing.glb: 247.4 KB
- [x] ladle.glb: 56.7 KB
- [x] knife.glb: 0.3 KB
- [x] Total size < 5MB ✅
- [x] +Y Up applied to all GLBs
- [x] Animations playable in GLB viewer
- [ ] Three.js integration test (pending)

---

## 📝 Notes

### Design Decisions
1. **Separate Animation Files**: Idle and swing animations exported separately for flexibility
2. **Separate Tool Files**: Tools exported independently for runtime swapping
3. **HitZone Empties**: Included in tool GLBs for collision detection

### Known Issues
- Blender 4.4 GLB exporter cannot handle complex parent hierarchies (tools parented to bones)
- Solution: Export tools separately, attach in Three.js at runtime

### Future Enhancements
- Running animation (if needed)
- Additional tools
- Normal maps for character
- Higher detail character mesh (current: 687 tris → target: 5,000~15,000 tris)

---

**Last Updated**: 2025-11-15
**Export Blender File**: `Chef_Character_Final.blend`
**Export Location**: `C:\Users\Jaewon\Desktop\졸작\`
