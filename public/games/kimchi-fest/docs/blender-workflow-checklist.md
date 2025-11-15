# Kimchi Fest - Blender Workflow Checklist
**Date**: 2025-11-14
**Version**: 1.0

---

## 🎯 Quick Start Guide

### Before You Start
- [ ] Read `blender-3d-design-spec.md` completely
- [ ] Understand gameplay flow (Seasoning → Cabbage → Loop)
- [ ] Review color palette (warm tones)
- [ ] Check polygon budgets for each asset

### Blender Setup
- [ ] Blender version: 3.6+ recommended
- [ ] Set units to Metric (meters)
- [ ] **Set frame rate to 24fps** (Properties → Output → Frame Rate)
- [ ] **CRITICAL**: DO NOT use any other FPS (30/60/etc) - animations MUST be 24fps
- [ ] Install GLB/GLTF export addon (built-in)

---

## 📋 Phase 1: Character Modeling (Priority 1)

### Step 1.1: Base Mesh
**Estimated Time**: 2-3 hours

- [ ] Create new Blender file: `character.blend`
- [ ] Add cube → Convert to character base mesh
- [ ] Set proportions: Head:Body = 1:1.5 ~ 1:2 (chibi style)
- [ ] Model head (round, cute)
- [ ] Model torso (simple cylinder/cube base)
- [ ] Model arms (short, rounded)
- [ ] Model legs (short, stable stance)
- [ ] **Polygon Check**: Body < 3,000 tris

**Reference**:
- Look for "chibi character" or "cute chef" references
- Keep shapes simple and rounded
- Avoid small details (web optimization)

### Step 1.2: Outfit & Details
**Estimated Time**: 1-2 hours

- [ ] Model chef's apron (front only, simple geo)
- [ ] Model bandana or chef's hat
- [ ] Add simple face (eyes, mouth) - can be texture
- [ ] Model hands (simple mittens or 3-finger style)
- [ ] **Polygon Check**: Outfit < 2,000 tris

**Tips**:
- Use Mirror modifier for symmetry
- Keep topology clean
- No need for fingers (mittens are fine)

### Step 1.3: UV Unwrapping
**Estimated Time**: 1 hour

- [ ] Switch to UV Editing workspace
- [ ] Mark seams (back of character, under arms)
- [ ] UV unwrap → U → Unwrap
- [ ] Scale UV islands to use full 0-1 space
- [ ] Check for stretching (use Checker texture)
- [ ] Export UV layout (for painting reference)

### Step 1.4: Texturing
**Estimated Time**: 2-3 hours

- [ ] Create new image: 2048x2048, RGBA
- [ ] Switch to Texture Paint mode
- [ ] Paint base colors:
  - Skin: Warm beige/peach
  - Apron: White or light color
  - Bandana: Red or pattern
  - Eyes/mouth: Simple dots/lines
- [ ] Add shading (soft shadows in creases)
- [ ] Add highlights (nose, cheeks, hands)
- [ ] Save as `chef-diffuse.png`

**Optional Normal Map**:
- [ ] Duplicate diffuse layer
- [ ] Paint height details (fabric folds, facial features)
- [ ] Bake to normal map: `chef-normal.png`

### Step 1.5: Rigging
**Estimated Time**: 1-2 hours

- [x] Add Armature (humanoid)
- [x] Bones needed (Mixamo/Three.js compatible names):
  - Hips
  - Spine (→ Spine1 optional → Neck → Head)
  - **Upper Body**:
    - LeftShoulder → LeftArm → LeftForeArm → LeftHand
    - RightShoulder → RightArm → RightForeArm → RightHand
  - **Lower Body (for running animation)**:
    - LeftUpLeg → LeftLeg → LeftFoot (→ LeftToeBase optional)
    - RightUpLeg → RightLeg → RightFoot (→ RightToeBase optional)
    - **Critical**: Foot bones REQUIRED for running motion
- [x] Parent mesh to armature (Automatic Weights)
- [x] Test rig (pose mode, move arms AND legs)
- [x] Fix weight painting issues (especially ankles/feet)
- [x] **Limit bone influences to 4 per vertex** (important for web performance)

**Tips**:
- Use Rigify addon for faster rigging (optional)
- Keep bone hierarchy simple
- Test shoulder/arm rotation

### Step 1.6: Animation - action_swing
**Estimated Time**: 1-2 hours

- [x] Switch to Animation workspace
- [x] **Set scene FPS to 24** (Properties → Output → Frame Rate)
- [x] Create new action: "action_swing"
- [x] **Set timeline: 0-13 frames** (542ms @ 24fps)
- [x] **CRITICAL**: MUST be exactly 13 frames to sync with BPM 110 (545ms beat)
- [x] Animate swing motion:
  - Frame 0: Idle pose (tool at side)
  - Frame 3: Wind up (arm back)
  - Frame 7: Swing peak (arm forward/up)
  - Frame 11: Follow through (arm extends)
  - Frame 13: Return to idle (loop start)
- [x] Add slight body rotation for weight
- [x] Add head follow (looks at tool)
- [x] **Preview loop**: Check seamless transition

**Tips**:
- Use Auto Key or Manual Keyframes
- Keep motion exaggerated (cartoon style)
- Test loop by enabling "Repeat" in timeline
- **DO NOT change FPS** - must stay at 24fps!
- **DO NOT add extra frames** - 13 frames is absolute requirement!

### Step 1.7: Tools (Ladle & Knife)
**Estimated Time**: 1 hour each

**Ladle**:
- [x] Model bowl part (hemisphere)
- [x] Model handle (cylinder, curved)
- [x] UV unwrap
- [x] Texture (metallic or wood)
- [x] **Polygon Check**: 1,216 tris (500~2,000 budget)
- [x] Export as separate object: `ladle.glb`

**Knife**:
- [x] Model blade (flat, wide rectangle)
- [x] Model handle (cylinder, tapered)
- [x] UV unwrap
- [x] Texture (metal blade, wood handle)
- [x] **Polygon Check**: 1,152 tris (500~2,000 budget)
- [x] Export as separate object: `knife.glb`

**Parent to Hand**:
- [x] Position tool in hand bone
- [x] Parent: Tool → RightHand (Keep Transform)
- [x] **Add Empty object: "HitZone_Tool"**
  - [x] Create Empty (Plain Axes)
  - [x] Position at tool tip (end of ladle/knife blade)
  - [x] Rotate so +X axis points forward (swing direction)
  - [x] Parent: HitZone_Tool → Tool mesh
- [x] Test animation with tool

### Step 1.8: Export Character
**Estimated Time**: 30 minutes

- [x] Select character mesh + armature + tool
- [x] File → Export → glTF 2.0 (.glb)
- [x] Settings:
  - Format: GLB (binary)
  - Include: Selected Objects
  - **Transform: +Y Up** (CRITICAL - handles Blender Z-up → Engine Y-up conversion)
  - Geometry: Apply Modifiers
  - Animation: Include
- [x] Export as `chef-character-only.glb` (0.23 MB - character + rig + animation)
- [x] Export as `ladle.glb` (56.7 KB - with HitZone_Tool_Ladle)
- [x] Export as `knife.glb` (0.3 KB - with HitZone_Tool_Knife)
- [x] **File Size Check**: Total ~0.29 MB (< 5MB budget ✅)
- [ ] Test in Three.js viewer or Babylon.js sandbox

### Step 1.9: Early Integration Test (Phase 1)
**Estimated Time**: 30 minutes

**Purpose**: Catch issues early before moving to next phase

- [ ] **Pre-export verification** (in Blender):
  - [ ] Scene FPS is 24 (Properties → Output → Frame Rate)
  - [ ] +Y Up is enabled in export settings (glTF 2.0 export)
  - [ ] Max 4 bone influences per vertex
  - [ ] HitZone_Tool Empty has correct orientation (Blender)

- [ ] Upload `chef-character.glb` to https://gltf-viewer.donmccurdy.com/
- [ ] Verify checklist:
  - [ ] Textures load correctly
  - [ ] Animation "action_swing" appears in list
  - [ ] **Animation is EXACTLY 13 frames** (check viewer timeline)
  - [ ] **Animation duration ≈ 0.542 seconds** (542ms)
  - [ ] Character scale is reasonable (~1-2 units tall)
  - [ ] No missing materials or black textures
  - [ ] **Bone names follow convention** (Hips, Spine, RightHand, etc.)
  - [ ] **HitZone_Tool Empty exists** in hierarchy
  - [ ] **HitZone_Tool maintains orientation/scale** after export
- [ ] Record file size: _____ MB
- [ ] If issues found: **FIX NOW** before Phase 2
- [ ] Optional: Test load in Three.js test page

---

## 📋 Phase 2: Game Objects (Priority 2)

### Step 2.1: Whole Cabbage
**Estimated Time**: 2-3 hours

- [ ] Create new Blender file: `objects.blend`
- [ ] Model cabbage base (oval sphere)
- [ ] Add leaf details:
  - Outer leaves (large, curved)
  - Inner leaves (smaller, tighter)
  - Stem (bottom, thick)
- [ ] Use Array modifier for leaf rows
- [ ] **Polygon Check**: 2,000 ~ 5,000 tris
- [ ] UV unwrap (seams between leaves)

**Texturing - Raw Version**:
- [ ] Create image: 1024x1024
- [ ] Paint colors:
  - Outer leaves: Light green (#BEF264)
  - Inner leaves: White/cream
  - Veins: Darker green lines
  - Stem: White/beige
- [ ] Add shading (shadows between leaves)
- [ ] Save as `cabbage-raw-diffuse.png`

**Texturing - Seasoned Version**:
- [ ] Duplicate texture
- [ ] Paint red seasoning (#DC2626):
  - Cover outer leaves
  - Leave some green showing (realistic)
  - Add darker red in creases
  - Keep stem mostly clean
- [ ] Save as `cabbage-seasoned-diffuse.png`

**Optional Normal Map**:
- [ ] Bake leaf veins and depth
- [ ] Save as `cabbage-raw-normal.png`

**Export**:
- [ ] Export model: `cabbage.glb`
- [ ] Export both textures separately
- [ ] **File Size Check**: Model < 2MB, Textures < 500KB each

### Step 2.2: Seasoning Jar
**Estimated Time**: 1-2 hours

- [ ] Model jar body (cylinder, tapered)
- [ ] Model jar rim (top edge, slight lip)
- [ ] Model seasoning inside (separate mesh):
  - Shape: Slightly below rim
  - Surface: Irregular (paste-like)
- [ ] **Polygon Check**: 1,500 ~ 3,000 tris total
- [ ] UV unwrap

**Texturing**:
- [ ] Jar body: Brown/terracotta (#78350F)
- [ ] Jar rim: Darker edge
- [ ] Seasoning: Bright red (#DC2626)
- [ ] Add specular/glossy map for seasoning
- [ ] Save as `seasoning-jar-diffuse.png`

**Shader Setup (Eevee)**:
- [ ] Jar: Principled BSDF (Roughness 0.5)
- [ ] Seasoning: Principled BSDF (Roughness 0.2, slight SSS)
- [ ] Test with Bloom enabled (glowing effect)

**Export**:
- [ ] Export: `seasoning-jar.glb`
- [ ] **File Size Check**: < 1MB

### Step 2.3: Early Integration Test (Phase 2)
**Estimated Time**: 20 minutes

**Purpose**: Verify game objects load correctly

- [ ] Upload all Phase 2 GLBs to https://gltf-viewer.donmccurdy.com/
  - [ ] cabbage.glb
  - [ ] seasoning-jar.glb
- [ ] Verify checklist:
  - [ ] Textures swap correctly (raw vs seasoned cabbage)
  - [ ] Object scales match character (~reasonable size)
  - [ ] Materials/shaders render correctly
- [ ] Record total file size: _____ MB
- [ ] Cumulative assets (Phase 1+2): _____ MB (must be < 15MB)
- [ ] If issues found: **FIX NOW** before Phase 3

---

## 📋 Phase 3: Environment (Priority 3)

### Step 3.1: Hanok Building (Background)
**Estimated Time**: 3-4 hours

- [ ] Create new Blender file: `environment.blend`
- [ ] Model hanok structure:
  - Walls (simple planes)
  - Roof (curved planes, tile pattern)
  - Support beams (cylinders)
  - Windows/doors (simple cutouts)
- [ ] Keep Low Poly (far background)
- [ ] **Polygon Check**: 5,000 ~ 10,000 tris
- [ ] UV unwrap

**Texturing**:
- [ ] Walls: Beige/cream (#FEF3C7)
- [ ] Roof tiles: Gray (#64748B), tile pattern
- [ ] Beams: Dark wood (#78350F)
- [ ] Windows: Simple dark rectangles
- [ ] Save as `hanok-roof-diffuse.png` (2048x2048)

**Export**:
- [ ] Export: `hanok-building.glb`

### Step 3.2: Ground Plane
**Estimated Time**: 30 minutes

- [ ] Create large plane (10m x 10m)
- [ ] Subdivide slightly (for texture detail)
- [ ] UV unwrap (simple planar)
- [ ] **Polygon Check**: 500 ~ 1,000 tris

**Texturing**:
- [ ] Stone/dirt pattern (warm brown/beige)
- [ ] Add subtle variation (cracks, stones)
- [ ] Save as `ground-diffuse.png` (2048x2048)

**Export**:
- [ ] Export: `ground-plane.glb`

### Step 3.3: Props (Onggi Jars & Crates)
**Estimated Time**: 1 hour each

**Onggi Jar** (Traditional Korean jar):
- [ ] Model jar body (round, tapered)
- [ ] Model lid (optional)
- [ ] **Polygon Check**: ~1,000 tris
- [ ] UV unwrap
- [ ] Texture: Brown/terracotta, glazed look
- [ ] Save as `onggi-diffuse.png` (1024x1024)
- [ ] Export: `onggi-jar.glb`

**Wood Crate**:
- [ ] Model box (cube base)
- [ ] Add plank details (edge loops)
- [ ] **Polygon Check**: ~500 tris
- [ ] UV unwrap
- [ ] Texture: Wood grain, weathered
- [ ] Save as `wood-diffuse.png` (1024x1024)
- [ ] Export: `wood-crate.glb`

### Step 3.4: Lighting Setup
**Estimated Time**: 1 hour

- [ ] Add Sun lamp:
  - Angle: 45° (warm afternoon)
  - Color: Warm yellow (#FEF3C7)
  - Strength: 1.5 ~ 2.0
- [ ] Add Sky texture (World Properties)
- [ ] Enable Ambient Occlusion
- [ ] Test render (Eevee)

**Export Scene**:
- [ ] Export all environment objects
- [ ] Keep lighting settings in .blend file for reference

### Step 3.4.1: Instancing Validation (Before Export)
**Estimated Time**: 10 minutes

**Purpose**: Verify props are ready for instancing

- [ ] Select each instanced prop (onggi-jar, wood-crate)
- [ ] Run validation script in Blender (see below)
- [ ] Fix any issues before export

**Blender Python Validation Script**:
```python
# Run this in Blender Scripting workspace
import bpy
from mathutils import Vector

def validate_instancing_ready():
    obj = bpy.context.active_object
    if not obj:
        print("❌ No object selected!")
        return False

    issues = []

    # Check location
    if any(abs(v) > 0.001 for v in obj.location):
        issues.append(f"Location not at origin: {obj.location}")

    # Check scale
    if any(abs(v - 1.0) > 0.001 for v in obj.scale):
        issues.append(f"Scale not (1,1,1): {obj.scale}")

    # Check rotation
    if any(abs(v) > 0.001 for v in obj.rotation_euler):
        issues.append(f"Rotation not (0,0,0): {obj.rotation_euler}")

    # Check matrix world is identity (NEW)
    if not obj.matrix_world.is_identity:
        issues.append("Matrix world is not identity (transforms not fully applied)")

    # Check parent (NEW)
    if obj.parent:
        issues.append(f"Object has parent: '{obj.parent.name}' (may reintroduce transforms)")

    # Check base at Z=0 using bounding box
    bbox = [obj.matrix_world @ Vector(v) for v in obj.bound_box]
    min_z = min(v.z for v in bbox)
    if abs(min_z) > 0.01:
        issues.append(f"Base not at Z=0, currently at Z={min_z:.3f}")

    # Check pivot using actual geometry (NEW - more accurate)
    if obj.type == 'MESH' and obj.data.vertices:
        verts = [obj.matrix_world @ v.co for v in obj.data.vertices]
        mesh_min_z = min(v.z for v in verts)
        if abs(mesh_min_z) > 0.01:
            issues.append(f"Mesh vertices not at Z=0, min Z={mesh_min_z:.3f}")

    if issues:
        print(f"\n❌ Issues found for '{obj.name}':")
        for issue in issues:
            print(f"  - {issue}")
        print("\n🔧 Fix:")
        print("  1. Clear parent: Alt+P → Clear Parent")
        print("  2. Apply transforms: Ctrl+A → All Transforms")
        print("  3. Move to origin: G → 0, 0, 0")
        print("  4. Adjust Z so base sits at Z=0")
    else:
        print(f"\n✅ '{obj.name}' is ready for instancing!")

    return len(issues) == 0

# Run check
validate_instancing_ready()
```

- [ ] All props pass validation
- [ ] If failed: Apply transforms (Ctrl+A) and reposition

### Step 3.5: Early Integration Test (Phase 3)
**Estimated Time**: 30 minutes

**Purpose**: Verify environment performance and appearance

- [ ] Upload all Phase 3 GLBs to https://gltf-viewer.donmccurdy.com/
  - [ ] hanok-building.glb
  - [ ] ground-plane.glb
  - [ ] onggi-jar.glb
  - [ ] wood-crate.glb
- [ ] Verify checklist:
  - [ ] Total environment polys ≤ 15,000 tris (check in viewer stats)
  - [ ] Z-axis layering works correctly (background to foreground)
  - [ ] Textures are clear and not blurry
  - [ ] Lighting/materials match art direction (warm tones)
- [ ] Record cumulative size: _____ MB (must be < 25MB)
- [ ] If issues found: **FIX NOW** before Phase 4
- [ ] **Critical**: Test all assets together in Three.js scene

---

## 📋 Phase 4: VFX (Priority 4)

### Step 4.1: Seasoning Splash Particle
**Estimated Time**: 2-3 hours

- [ ] Create new Blender file: `vfx.blend`
- [ ] Create particle emitter (small sphere)
- [ ] Setup particle system:
  - Frame Start: 1
  - Frame End: 24 (1 second)
  - Number: 50-100 particles
  - Lifetime: 12-18 frames
  - Velocity: Random cone (upward/outward)
- [ ] Create splash material:
  - Red color (#DC2626)
  - Transparency/Alpha
  - Glow effect

### Step 4.2: Render Sprite Sheet
**Estimated Time**: 1 hour

- [ ] Setup camera (orthographic, top view)
- [ ] Setup lighting (3-point light)
- [ ] Set render resolution: 1024x1024
- [ ] Render frames 1-16:
  - Frame 1 → Top-left cell
  - Frame 2 → Second cell
  - ...
  - Frame 16 → Bottom-right cell
- [ ] Composite into 4x4 grid in image editor
- [ ] **Check alpha channel** (transparent background)
- [ ] Save as `seasoning-splash-spritesheet.png`

### Step 4.3: Config File
- [ ] Create JSON file: `splash-config.json`
```json
{
  "frames": 16,
  "grid": "4x4",
  "frameWidth": 256,
  "frameHeight": 256,
  "frameRate": 24,
  "loop": false
}
```

### Step 4.4: Early Integration Test (Phase 4)
**Estimated Time**: 15 minutes

**Purpose**: Verify VFX sprite sheet is ready for engine

- [ ] Open `seasoning-splash-spritesheet.png` in image viewer
- [ ] Verify checklist:
  - [ ] Alpha channel is present (transparency works)
  - [ ] 4x4 grid is clearly visible (16 frames)
  - [ ] File size < 500KB
  - [ ] No artifacts or compression issues
- [ ] Record cumulative size: _____ MB (must be < 30MB)
- [ ] Test sprite animation preview (optional: use online sprite sheet viewer)

---

## 📋 Phase 5: Integration Testing (Priority 5)

**Purpose**: Verify 3D assets work correctly in the actual game environment.

### Step 5.1: GLB Format Verification
**Estimated Time**: 30 minutes

**Recommended Testing Tools**:
- [ ] **GLB Viewer**: https://gltf-viewer.donmccurdy.com/
  - Upload chef-character.glb
  - Verify textures load
  - Check animation playback
- [ ] **Three.js Editor**: https://threejs.org/editor/
  - Import GLB files
  - Test lighting/materials
  - Check scale (should be ~1 unit)
- [ ] **Babylon.js Sandbox**: https://sandbox.babylonjs.com/
  - Alternative viewer
  - Validates GLTF 2.0 spec compliance

### Step 5.2: Three.js Load Test
**Estimated Time**: 1-2 hours

- [ ] Create test HTML file with Three.js
- [ ] Load chef-character.glb using GLTFLoader
- [ ] Verify scene hierarchy (bones, meshes)
- [ ] Check animation clips: `gltf.animations`
- [ ] Play action_swing animation:
  ```javascript
  const mixer = new THREE.AnimationMixer(gltf.scene);
  const action = mixer.clipAction(gltf.animations[0]);
  action.play();
  ```
- [ ] Test cabbage texture swap (raw → seasoned)
- [ ] Verify environment Z-axis positioning

### Step 5.3: Game Integration Test
**Estimated Time**: 2-3 hours

- [ ] Integrate character into `index.html`
- [ ] Test sensor data → swing animation trigger
- [ ] Verify timing synchronization (BPM 110 = 545ms)
- [ ] Test conveyor movement (objects moving toward camera)
- [ ] Check Nice/Off/Miss UI overlay with character action

### Step 5.4: Performance Profiling
**Estimated Time**: 1 hour

- [ ] Open Chrome DevTools → Performance tab
- [ ] Record 1 minute of gameplay
- [ ] Verify 60fps maintained (desktop)
- [ ] Test mobile simulator (throttle CPU 4x)
- [ ] Check 30fps+ on mobile
- [ ] Memory leak check: Play for 10 minutes, check Memory tab

### Step 5.5: Cross-device Testing
**Estimated Time**: 1-2 hours

- [ ] Test on desktop (Chrome, Firefox, Safari)
- [ ] Test on real mobile device (Android/iOS)
- [ ] Check file load times (<5 seconds on 4G)
- [ ] Verify touch input works with sensor

---

## ✅ Final Quality Check

### Before Export
- [ ] All models within polygon budget
- [ ] All textures power-of-2 resolution
- [ ] All materials baked/assigned
- [ ] All transforms applied (Ctrl+A → All Transforms)
- [ ] All origins centered (Origin to Geometry)
- [ ] No unused materials/textures
- [ ] Scene scale correct (1 unit = 1 meter)

### After Export
- [ ] Test each GLB in online viewer (see Phase 5.1 links)
- [ ] Check file sizes (total < 30MB)
- [ ] Verify animations play correctly
- [ ] Check textures load properly
- [ ] Test in Three.js (Phase 5.2)

### File Organization
```
✅ All files named correctly (kebab-case)
✅ All textures in correct folders
✅ All .blend source files saved
✅ All export files in /assets/ folders
✅ Documentation updated
```

---

## 📊 Time Estimates Summary

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| **Phase 1: Character** | 8 steps | 10-15 hours |
| **Phase 2: Objects** | 2 steps | 3-5 hours |
| **Phase 3: Environment** | 4 steps | 6-8 hours |
| **Phase 4: VFX** | 3 steps | 3-4 hours |
| **Phase 5: Integration** | 5 steps | 5-9 hours |
| **Total** | 22 steps | **27-41 hours** |

**Note**: Actual time may vary ±50% based on experience level and tools used.

**Recommendation**: Work in phases, test each phase before moving to next.

---

## 🚀 Ready to Start?

### Checklist Before First Blender Session
- [ ] Read design spec document
- [ ] Gather reference images (cute chef, kimchi, hanok)
- [ ] Setup Blender with correct settings
- [ ] Create project folder structure
- [ ] Have color palette ready (#DC2626, #F97316, etc.)

### Checklist After Each Phase
- [ ] Export files completed
- [ ] Quality check passed
- [ ] Files organized correctly
- [ ] Source .blend files saved
- [ ] Ready for next phase

---

## 📝 Notes & Tips

### General Blender Tips
- **Save often**: Ctrl+S every 10-15 minutes
- **Use collections**: Organize objects (Character, Props, Lights)
- **Name everything**: Clear names for objects/materials/textures
- **Backup files**: Save incremental versions (character_v1, v2, etc.)

### Web Optimization Tips
- **Low poly first**: Model low poly, add detail only if needed
- **Texture reuse**: Share textures between similar objects
- **Atlas textures**: Combine multiple textures into one atlas
- **Test early**: Export and test in browser frequently

### Artistic Tips
- **Silhouette first**: Strong silhouette makes cute characters
- **Color contrast**: Use warm/cool contrast for depth
- **Keep it simple**: Simpler designs = better web performance
- **Consistent style**: All assets should match visual style

---

**Good luck with your Blender work! 🎨**

**Questions?** Refer back to `blender-3d-design-spec.md` for detailed specs.

**Last Updated**: 2025-11-14
