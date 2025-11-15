# Three.js Integration Guide - Chef Character
**Date**: 2025-11-15
**Project**: Kimchi Fest
**Three.js Version**: r150+ recommended

---

## 📦 Required Assets

```
/public/games/kimchi-fest/assets/characters/
├── chef-character-idle.glb     (247.4 KB)
├── chef-character-swing.glb    (247.4 KB)
├── ladle.glb                   (56.7 KB)
└── knife.glb                   (0.3 KB)
```

**Total Size**: ~551 KB

---

## 🚀 Quick Start

### 1. Load Character with Idle Animation

```javascript
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Initialize loader
const loader = new GLTFLoader();

// Load character with Idle animation
const idleGltf = await loader.loadAsync('/games/kimchi-fest/assets/characters/chef-character-idle.glb');

const character = idleGltf.scene;
scene.add(character);

// Setup animation mixer
const mixer = new THREE.AnimationMixer(character);

// Play Idle animation
const idleAction = mixer.clipAction(idleGltf.animations[0]);
idleAction.play();

console.log('✅ Character loaded with Idle animation');
console.log('Animation name:', idleGltf.animations[0].name); // "Idle"
console.log('Duration:', idleGltf.animations[0].duration, 'seconds'); // ~1.958s
```

---

## 🎬 Animation System

### Animation Mixer Setup

```javascript
class ChefCharacter {
  constructor(scene) {
    this.scene = scene;
    this.character = null;
    this.mixer = null;
    this.currentAction = null;
    this.animations = {
      idle: null,
      swing: null
    };
  }

  async load() {
    const loader = new GLTFLoader();

    // Load Idle animation character
    const idleGltf = await loader.loadAsync(
      '/games/kimchi-fest/assets/characters/chef-character-idle.glb'
    );

    this.character = idleGltf.scene;
    this.scene.add(this.character);

    // Setup mixer
    this.mixer = new THREE.AnimationMixer(this.character);

    // Store Idle animation
    this.animations.idle = idleGltf.animations[0];

    // Load swing animation
    const swingGltf = await loader.loadAsync(
      '/games/kimchi-fest/assets/characters/chef-character-swing.glb'
    );

    // Store swing animation (from different GLB)
    this.animations.swing = swingGltf.animations[0];

    // Play Idle by default
    this.playIdle();

    console.log('✅ Character animations loaded');
    console.log('Idle duration:', this.animations.idle.duration, 's');
    console.log('Swing duration:', this.animations.swing.duration, 's');
  }

  playIdle() {
    if (this.currentAction) {
      this.currentAction.fadeOut(0.2);
    }

    const action = this.mixer.clipAction(this.animations.idle);
    action.reset();
    action.fadeIn(0.2);
    action.play();

    this.currentAction = action;
    console.log('▶️ Playing Idle animation');
  }

  playSwing() {
    if (this.currentAction) {
      this.currentAction.fadeOut(0.1);
    }

    const action = this.mixer.clipAction(this.animations.swing);
    action.reset();
    action.setLoop(THREE.LoopOnce); // Or LoopRepeat for continuous
    action.clampWhenFinished = true;
    action.fadeIn(0.1);
    action.play();

    this.currentAction = action;
    console.log('▶️ Playing Swing animation');

    // Return to Idle after swing completes
    setTimeout(() => {
      this.playIdle();
    }, action.getClip().duration * 1000); // 542ms
  }

  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }
}
```

---

## 🔧 Tool Attachment

### Attach Ladle to RightHand Bone

```javascript
class ChefCharacter {
  // ... (previous code)

  async attachLadle() {
    const loader = new GLTFLoader();

    // Load ladle GLB
    const ladleGltf = await loader.loadAsync(
      '/games/kimchi-fest/assets/characters/ladle.glb'
    );

    const ladle = ladleGltf.scene;

    // Find RightHand bone in character skeleton
    const rightHand = this.character.getObjectByName('RightHand');

    if (!rightHand) {
      console.error('❌ RightHand bone not found!');
      return;
    }

    // Attach ladle to RightHand
    rightHand.add(ladle);

    // Store reference to HitZone
    this.hitZone = ladle.getObjectByName('HitZone_Tool_Ladle');

    if (this.hitZone) {
      console.log('✅ Ladle attached with HitZone');
      console.log('HitZone position:', this.hitZone.position);
    } else {
      console.warn('⚠️ HitZone_Tool_Ladle not found');
    }

    this.currentTool = 'ladle';
  }

  async attachKnife() {
    const loader = new GLTFLoader();

    // Load knife GLB
    const knifeGltf = await loader.loadAsync(
      '/games/kimchi-fest/assets/characters/knife.glb'
    );

    const knife = knifeGltf.scene;

    // Find RightHand bone
    const rightHand = this.character.getObjectByName('RightHand');

    if (!rightHand) {
      console.error('❌ RightHand bone not found!');
      return;
    }

    // Remove existing tool
    if (rightHand.children.length > 0) {
      rightHand.children.forEach(child => {
        if (child.name === 'Ladle' || child.name === 'Knife') {
          rightHand.remove(child);
        }
      });
    }

    // Attach knife to RightHand
    rightHand.add(knife);

    // Store reference to HitZone
    this.hitZone = knife.getObjectByName('HitZone_Tool_Knife');

    if (this.hitZone) {
      console.log('✅ Knife attached with HitZone');
    }

    this.currentTool = 'knife';
  }

  // Switch between tools at runtime
  async switchTool(toolName) {
    if (toolName === 'ladle') {
      await this.attachLadle();
    } else if (toolName === 'knife') {
      await this.attachKnife();
    }
  }
}
```

---

## 🎯 HitZone Collision Detection

### Using HitZone for Raycasting

```javascript
class ChefCharacter {
  // ... (previous code)

  getHitZoneWorldPosition() {
    if (!this.hitZone) {
      console.warn('⚠️ HitZone not found');
      return new THREE.Vector3();
    }

    // Get HitZone world position
    const worldPos = new THREE.Vector3();
    this.hitZone.getWorldPosition(worldPos);

    return worldPos;
  }

  getHitZoneWorldDirection() {
    if (!this.hitZone) {
      console.warn('⚠️ HitZone not found');
      return new THREE.Vector3(0, 0, 1);
    }

    // +X axis of HitZone points forward (swing direction)
    const direction = new THREE.Vector3(1, 0, 0);

    // Transform by HitZone world rotation
    const worldQuaternion = new THREE.Quaternion();
    this.hitZone.getWorldQuaternion(worldQuaternion);
    direction.applyQuaternion(worldQuaternion);

    return direction;
  }

  checkCollision(targetObjects) {
    if (!this.hitZone) return null;

    // Create raycaster from HitZone
    const raycaster = new THREE.Raycaster();
    const origin = this.getHitZoneWorldPosition();
    const direction = this.getHitZoneWorldDirection();

    raycaster.set(origin, direction);

    // Check intersections
    const intersects = raycaster.intersectObjects(targetObjects, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      console.log('💥 Hit detected!', hit.object.name);
      console.log('Distance:', hit.distance);
      return hit;
    }

    return null;
  }
}
```

---

## 🎵 BPM 110 Rhythm Synchronization

### Timing Integration

```javascript
class RhythmController {
  constructor(chefCharacter) {
    this.chef = chefCharacter;
    this.bpm = 110;
    this.beatInterval = (60 / this.bpm) * 1000; // 545ms
    this.lastBeatTime = 0;
  }

  update(currentTime) {
    // Check if it's time for next beat
    if (currentTime - this.lastBeatTime >= this.beatInterval) {
      this.onBeat();
      this.lastBeatTime = currentTime;
    }
  }

  onBeat() {
    console.log('🎵 Beat!');

    // Trigger swing animation on beat
    this.chef.playSwing();

    // Check collision at peak of swing (frame 7 = ~320ms into animation)
    setTimeout(() => {
      const hit = this.chef.checkCollision(this.gameObjects);
      if (hit) {
        console.log('✅ Nice!');
        this.scoreManager.addScore('nice');
      }
    }, 320); // Peak frame timing
  }
}

// Usage
const chef = new ChefCharacter(scene);
await chef.load();
await chef.attachLadle();

const rhythmController = new RhythmController(chef);

// In animation loop
function animate(time) {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();

  // Update character animations
  chef.update(deltaTime);

  // Update rhythm system
  rhythmController.update(time);

  renderer.render(scene, camera);
}
```

---

## 🎮 Complete Integration Example

```javascript
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class KimchiFestGame {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.clock = new THREE.Clock();

    this.chef = null;

    this.init();
  }

  async init() {
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Setup camera
    this.camera.position.set(0, 5, 15);
    this.camera.lookAt(0, 0, -5);

    // Setup lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    this.scene.add(directionalLight);

    // Load chef character
    this.chef = new ChefCharacter(this.scene);
    await this.chef.load();
    await this.chef.attachLadle();

    console.log('✅ Game initialized');

    // Start animation loop
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();

    // Update character
    if (this.chef) {
      this.chef.update(deltaTime);
    }

    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Start game
const game = new KimchiFestGame();
```

---

## 🐛 Troubleshooting

### Issue: Animations not playing
**Solution**:
```javascript
// Make sure to update mixer in animation loop
function animate() {
  const deltaTime = clock.getDelta();
  mixer.update(deltaTime); // ⚠️ Don't forget this!
  renderer.render(scene, camera);
}
```

### Issue: HitZone not found
**Solution**:
```javascript
// Check object hierarchy
console.log(ladle.children); // Should contain HitZone_Tool_Ladle

// Alternative: Traverse entire scene
ladle.traverse((child) => {
  if (child.name === 'HitZone_Tool_Ladle') {
    console.log('Found HitZone:', child);
  }
});
```

### Issue: Character appears upside down
**Solution**:
- GLB files are exported with +Y Up
- No rotation needed in Three.js
- If character appears wrong, check GLB export settings in Blender

### Issue: Tool not following hand
**Solution**:
```javascript
// Make sure to attach to bone, not mesh
const rightHand = character.getObjectByName('RightHand');
console.log('Bone type:', rightHand.type); // Should be "Bone"

// Update skeleton BEFORE rendering
character.traverse((child) => {
  if (child.isSkinnedMesh) {
    child.skeleton.update();
  }
});
```

---

## 📊 Performance Optimization

### Asset Preloading

```javascript
class AssetManager {
  constructor() {
    this.loader = new GLTFLoader();
    this.cache = new Map();
  }

  async preloadAll() {
    const assets = [
      '/games/kimchi-fest/assets/characters/chef-character-idle.glb',
      '/games/kimchi-fest/assets/characters/chef-character-swing.glb',
      '/games/kimchi-fest/assets/characters/ladle.glb',
      '/games/kimchi-fest/assets/characters/knife.glb'
    ];

    const promises = assets.map(async (url) => {
      const gltf = await this.loader.loadAsync(url);
      this.cache.set(url, gltf);
      console.log('✅ Preloaded:', url);
    });

    await Promise.all(promises);
    console.log('✅ All assets preloaded');
  }

  get(url) {
    return this.cache.get(url);
  }
}

// Usage
const assetManager = new AssetManager();
await assetManager.preloadAll();

// Load from cache (instant)
const idleGltf = assetManager.get('/games/kimchi-fest/assets/characters/chef-character-idle.glb');
```

---

## ✅ Integration Checklist

### Initial Setup
- [ ] Import GLTFLoader from Three.js examples
- [ ] Copy all 4 GLB files to `/public/games/kimchi-fest/assets/characters/`
- [ ] Verify file paths are correct

### Character Loading
- [ ] Load chef-character-idle.glb
- [ ] Create AnimationMixer
- [ ] Play Idle animation
- [ ] Load chef-character-swing.glb
- [ ] Store swing animation clip

### Tool Attachment
- [ ] Load ladle.glb or knife.glb
- [ ] Find RightHand bone using `getObjectByName('RightHand')`
- [ ] Attach tool to RightHand bone
- [ ] Verify HitZone_Tool exists in tool hierarchy

### Animation Control
- [ ] Implement playIdle() method
- [ ] Implement playSwing() method
- [ ] Update mixer in animation loop
- [ ] Test animation transitions (idle ↔ swing)

### Collision Detection
- [ ] Get HitZone world position
- [ ] Get HitZone world direction (+X axis)
- [ ] Setup raycaster from HitZone
- [ ] Test collision with game objects

### Rhythm Integration
- [ ] Calculate beat interval from BPM 110 (545ms)
- [ ] Trigger playSwing() on beat
- [ ] Check collision at swing peak (~320ms after swing starts)

---

## 📝 API Reference

### ChefCharacter Class Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `load()` | None | `Promise<void>` | Load character with animations |
| `attachLadle()` | None | `Promise<void>` | Attach ladle to RightHand |
| `attachKnife()` | None | `Promise<void>` | Attach knife to RightHand |
| `switchTool(name)` | `'ladle' \| 'knife'` | `Promise<void>` | Switch between tools |
| `playIdle()` | None | `void` | Play Idle animation |
| `playSwing()` | None | `void` | Play action_swing animation |
| `update(deltaTime)` | `number` | `void` | Update animation mixer |
| `getHitZoneWorldPosition()` | None | `THREE.Vector3` | Get HitZone world position |
| `getHitZoneWorldDirection()` | None | `THREE.Vector3` | Get HitZone forward direction |
| `checkCollision(objects)` | `THREE.Object3D[]` | `Intersection \| null` | Check collision with objects |

---

## 🔗 Additional Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [GLTFLoader Guide](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
- [AnimationMixer](https://threejs.org/docs/#api/en/animation/AnimationMixer)
- [Raycaster](https://threejs.org/docs/#api/en/core/Raycaster)

---

**Last Updated**: 2025-11-15
**Maintained By**: Claude (AI Assistant - Worker)
**Approved By**: Codex (Manager)
