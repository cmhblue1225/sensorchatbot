# Phase 2: Three.js Integration Guide

## Overview

This document provides implementation notes for integrating Phase 2 game objects (Napa Cabbage and Onggi Jar) into Three.js/React Three Fiber.

## Asset Files

### Location
```
kimchi-fest/assets/
├── cabbage.glb       (0.18 MB, 3,357 tris)
└── onggi-jar.glb     (0.10 MB, 2,561 tris)
```

### Technical Specs
- **Format**: GLB (binary glTF 2.0)
- **Orientation**: +Y Up (CRITICAL - matches Three.js default)
- **FPS**: 24 (scene setting, no animations in these assets)
- **Total size**: 0.28 MB (well within 5MB budget)

---

## 1. Napa Cabbage (cabbage.glb)

### Model Structure
- **Object**: `Napa_Cabbage`
- **Polygon count**: 3,357 tris
- **Material Slots**: 2 (for runtime variant switching)

### Material Slots

#### Slot 0: `Cabbage_Raw`
- **Description**: Fresh raw cabbage (green/white)
- **BaseColor**: Green outer leaves → white inner core
- **Roughness**: 0.6 (slightly rough, organic)
- **Specular**: 0.3 (low sheen)
- **Normal**: Procedural noise for leaf texture

#### Slot 1: `Cabbage_Seasoned`
- **Description**: Seasoned cabbage with red pepper coating (gochugaru)
- **BaseColor**: Bright red-orange (Korean red pepper)
- **Roughness**: 0.7 (rough, powdery spice)
- **Specular**: 0.2 (very matte)
- **Normal**: Enhanced bump for spice granules

### Runtime Material Switching

The cabbage GLB contains both material definitions. Switch between variants at runtime:

```javascript
import { useGLTF } from '@react-three/drei'
import { useEffect } from 'react'

function Cabbage({ variant = 'raw' }) {
  const { scene, materials } = useGLTF('/games/kimchi-fest/assets/cabbage.glb')

  useEffect(() => {
    // Find the cabbage mesh
    const cabbageMesh = scene.getObjectByName('Napa_Cabbage')

    if (cabbageMesh) {
      // Switch material based on variant
      if (variant === 'raw') {
        cabbageMesh.material = materials['Cabbage_Raw']
      } else if (variant === 'seasoned') {
        cabbageMesh.material = materials['Cabbage_Seasoned']
      }
    }
  }, [variant, scene, materials])

  return <primitive object={scene} />
}

// Usage
<Cabbage variant="raw" />        // Fresh cabbage
<Cabbage variant="seasoned" />   // Red pepper coated
```

### Alternative: Material Array Access

```javascript
// Direct material slot access
cabbageMesh.material = cabbageMesh.material[0]  // Raw (Slot 0)
cabbageMesh.material = cabbageMesh.material[1]  // Seasoned (Slot 1)
```

### Gameplay Integration Suggestions
- **State transitions**: Raw → Seasoned (player adds seasoning)
- **Visual feedback**: Instant material swap when player interacts
- **Performance**: No additional loading required, both materials preloaded

---

## 2. Onggi Jar (onggi-jar.glb)

### Model Structure
- **Objects**: 2 separate meshes
  - `Onggi_Body` (1,686 tris)
  - `Onggi_Lid` (875 tris)
- **Total polygon count**: 2,561 tris
- **Material**: `Onggi_Ceramic` (shared by both objects)

### Material: `Onggi_Ceramic`
- **Description**: Traditional Korean earthenware
- **BaseColor**: Earthy brown/ochre with variation
- **Roughness**: 0.8 (rough ceramic)
- **Specular**: 0.3 (low sheen)
- **Normal**: Surface imperfections and fine cracks

### Accessing Separate Objects

```javascript
import { useGLTF } from '@react-three/drei'
import { useRef } from 'react'

function OnggiJar() {
  const { scene } = useGLTF('/games/kimchi-fest/assets/onggi-jar.glb')
  const bodyRef = useRef()
  const lidRef = useRef()

  // Find objects by name
  const body = scene.getObjectByName('Onggi_Body')
  const lid = scene.getObjectByName('Onggi_Lid')

  return (
    <group>
      <primitive ref={bodyRef} object={body} />
      <primitive ref={lidRef} object={lid} />
    </group>
  )
}
```

### Lid Animation/Interaction

The lid is a separate object, allowing for independent animation:

```javascript
function OnggiJar({ lidOpen = false }) {
  const { scene } = useGLTF('/games/kimchi-fest/assets/onggi-jar.glb')
  const lidRef = useRef()

  useFrame(() => {
    if (lidRef.current) {
      // Animate lid opening/closing
      const targetY = lidOpen ? 1.8 : 1.6  // Original Y: 1.6
      lidRef.current.position.y = THREE.MathUtils.lerp(
        lidRef.current.position.y,
        targetY,
        0.1
      )
    }
  })

  const body = scene.getObjectByName('Onggi_Body')
  const lid = scene.getObjectByName('Onggi_Lid')

  return (
    <group>
      <primitive object={body} />
      <primitive ref={lidRef} object={lid} />
    </group>
  )
}

// Usage
<OnggiJar lidOpen={false} />  // Lid closed
<OnggiJar lidOpen={true} />   // Lid raised
```

### Gameplay Integration Suggestions
- **Container**: Use as seasoning container
- **Interaction**: Click to open/close lid
- **State**: Track whether jar is open/closed
- **Collision**: Body only (lid doesn't need collision when open)

---

## Performance Notes

### File Sizes
- **cabbage.glb**: 0.18 MB
- **onggi-jar.glb**: 0.10 MB
- **Total**: 0.28 MB

Both assets are very lightweight. Consider:
- Preloading both at game start
- No need for lazy loading or progressive enhancement
- Combined with Phase 1 assets, total is still < 1 MB

### Polygon Counts
- **Cabbage**: 3,357 tris (within 2,000-5,000 target)
- **Onggi Jar**: 2,561 tris (within 1,500-3,000 target)

Both are optimized for real-time rendering. No LOD (Level of Detail) needed for typical gameplay distances.

---

## Material System Summary

| Asset | Object | Material Slots | Runtime Switching |
|-------|--------|----------------|-------------------|
| cabbage.glb | Napa_Cabbage | 2 (Raw, Seasoned) | ✅ Yes |
| onggi-jar.glb | Onggi_Body | 1 (Ceramic) | ❌ No |
| onggi-jar.glb | Onggi_Lid | 1 (Ceramic, shared) | ❌ No |

---

## Troubleshooting

### Cabbage material not switching
- **Check**: Material names are case-sensitive
- **Verify**: `materials['Cabbage_Raw']` and `materials['Cabbage_Seasoned']` exist
- **Debug**: `console.log(Object.keys(materials))` to see all available materials

### Onggi lid position incorrect
- **Default position**: Body at (3, 0, 0.75), Lid at (3, 0, 1.6)
- **Solution**: Reset parent group position to (0, 0, 0), objects maintain relative positions
- **Note**: Lid Y offset from body is 0.85 units

### Textures look flat
- **Cause**: Procedural textures are baked during export
- **Solution**: Ensure proper lighting in Three.js scene
- **Recommend**: Add `<ambientLight intensity={0.5} />` and `<directionalLight position={[5, 5, 5]} />`

---

## Example: Full Integration

```javascript
import { useGLTF } from '@react-three/drei'
import { useState } from 'react'

function KimchiFestGameObjects() {
  const [cabbageVariant, setCabbageVariant] = useState('raw')
  const [jarOpen, setJarOpen] = useState(false)

  return (
    <>
      {/* Cabbage with material variant switching */}
      <Cabbage
        position={[0, 0, 0]}
        variant={cabbageVariant}
        onClick={() => setCabbageVariant(
          cabbageVariant === 'raw' ? 'seasoned' : 'raw'
        )}
      />

      {/* Onggi Jar with lid interaction */}
      <OnggiJar
        position={[2, 0, 0]}
        lidOpen={jarOpen}
        onClick={() => setJarOpen(!jarOpen)}
      />
    </>
  )
}
```

---

## Next Steps

1. **Import assets** into your Three.js scene
2. **Test material switching** for cabbage variants
3. **Implement lid animation** for jar interaction
4. **Add click handlers** for gameplay interactions
5. **Tune lighting** to showcase PBR materials properly

For questions or issues, refer to the main project documentation or Blender source files in `blender-sources/cabbage.blend`.
