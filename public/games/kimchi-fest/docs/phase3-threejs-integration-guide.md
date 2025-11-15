# Phase 3: Three.js Integration Guide - Environment

## Overview

This document provides implementation notes for integrating Phase 3 environment assets (Hanok Building, Ground, and Props) into Three.js/React Three Fiber.

## Asset Files

### Location
```
kimchi-fest/assets/
├── hanok.glb         (0.08 MB, 1,576 tris)
├── ground.glb        (< 0.01 MB, 36 tris)
└── props.glb         (0.03 MB, 454 tris)
```

### Combined with Previous Phases
```
Phase 1: ~0.56 MB
Phase 2: ~0.28 MB
Phase 3: ~0.12 MB
Total:   ~0.96 MB (< 1 MB!)
```

### Technical Specs
- **Format**: GLB (binary glTF 2.0)
- **Orientation**: +Y Up (CRITICAL - matches Three.js default)
- **FPS**: 24 (scene setting)
- **Total Phase 3**: ~0.12 MB, 2,066 tris

---

## 1. Hanok Building (hanok.glb)

### Model Structure
- **Total**: 11 separate objects (1,576 tris combined)
- **Modular design**: Roof, Pillars, Walls, Beams, Platform

### Objects

| Object Name | Polygon Count | Material | Purpose |
|-------------|--------------|----------|---------|
| Hanok_Roof | 1,144 tris | Hanok_RoofTiles | Curved traditional Korean roof |
| Hanok_Pillar_1-4 | 72 tris each | Hanok_Wood | Wooden support columns |
| Hanok_FrontBeam | 24 tris | Hanok_Wood | Horizontal front beam |
| Hanok_BackBeam | 24 tris | Hanok_Wood | Horizontal back beam |
| Hanok_BackWall | 24 tris | Hanok_Wall | Back wall |
| Hanok_LeftWall | 24 tris | Hanok_Wall | Left side wall |
| Hanok_RightWall | 24 tris | Hanok_Wall | Right side wall |
| Hanok_Platform | 24 tris | Hanok_Wood | Wooden floor platform |

### Materials

#### Hanok_RoofTiles
- **Description**: Traditional grey ceramic roof tiles (Giwa)
- **BaseColor**: Blue-grey (0.25, 0.25, 0.3)
- **Roughness**: 0.6
- **Specular**: 0.4
- **Style**: Procedural noise for tile variation

#### Hanok_Wood
- **Description**: Natural wood for pillars, beams, platform
- **BaseColor**: Brown (0.4, 0.25, 0.15)
- **Roughness**: 0.7
- **Specular**: 0.3
- **Style**: Clean, stylized wood

#### Hanok_Wall
- **Description**: Hanji paper or white plaster walls
- **BaseColor**: Warm off-white (0.9, 0.88, 0.85)
- **Roughness**: 0.8
- **Specular**: 0.2
- **Style**: Matte, traditional

### Basic Integration

```javascript
import { useGLTF } from '@react-three/drei'

function HanokBuilding({ position = [0, 0, 0] }) {
  const { scene } = useGLTF('/games/kimchi-fest/assets/hanok.glb')

  return <primitive object={scene} position={position} />
}

// Usage
<HanokBuilding position={[0, -8, 0]} />
```

### Advanced: Accessing Individual Objects

```javascript
function HanokBuilding({ position = [0, 0, 0] }) {
  const { scene } = useGLTF('/games/kimchi-fest/assets/hanok.glb')

  useEffect(() => {
    // Access specific objects for customization
    const roof = scene.getObjectByName('Hanok_Roof')
    const pillar1 = scene.getObjectByName('Hanok_Pillar_1')

    // Example: Add slight sway animation to pillars
    // (This would be done in useFrame)
  }, [scene])

  return <primitive object={scene} position={position} />
}
```

---

## 2. Ground / Courtyard (ground.glb)

### Model Structure
- **Object**: `Ground_Courtyard` (single mesh)
- **Polygon count**: 36 tris
- **Size**: 20x20 units

### Material: Ground_Courtyard_Mat

- **Description**: Earthy courtyard floor (stone/packed earth)
- **BaseColor**: Earthy brown with procedural variation
- **Roughness**: 0.9 (very rough)
- **Specular**: 0.2 (low sheen)
- **Tiling**: 4x scale (adjustable)
- **Normal**: Bump mapping for surface detail

### Tiling-Ready UVs

The ground uses angle-based UV unwrapping with tiling in mind. The material is set to tile 4x in Blender, but you can adjust this in Three.js:

```javascript
import { useGLTF } from '@react-three/drei'
import { useEffect } from 'react'

function Ground() {
  const { scene, materials } = useGLTF('/games/kimchi-fest/assets/ground.glb')

  useEffect(() => {
    const groundMat = materials['Ground_Courtyard_Mat']

    // Adjust tiling (if needed)
    // The procedural texture tiles automatically
    // but you can scale the mesh for different coverage:
    const ground = scene.getObjectByName('Ground_Courtyard')
    if (ground) {
      ground.scale.set(1.5, 1, 1.5)  // Scale up for larger area
    }
  }, [scene, materials])

  return <primitive object={scene} position={[0, 0, 0]} />
}
```

### Placement Notes
- Default position: (0, 0, 0)
- Sized to fit under hanok building and gameplay area
- Can be scaled up for larger scenes

---

## 3. Environmental Props (props.glb)

### Model Structure
- **3 separate objects** in single GLB (instancing-ready)
- **Total**: 454 tris combined

### Props

| Object Name | Polygons | Material | Use Case |
|-------------|----------|----------|----------|
| Prop_WoodenCrate | 216 tris | Prop_WoodCrate_Mat | Storage box, obstacle |
| Prop_Lantern | 202 tris | Prop_Lantern_Mat | Hanging light (emissive) |
| Prop_SeasoningBasket | 36 tris | Prop_Basket_Mat | Bamboo basket |

### Materials

#### Prop_WoodCrate_Mat
- **BaseColor**: Wood brown (0.5, 0.35, 0.2)
- **Roughness**: 0.8
- **Use**: Reusable wooden crate

#### Prop_Lantern_Mat
- **BaseColor**: Off-white paper (0.95, 0.9, 0.8)
- **Emission Color**: Warm white (1.0, 0.9, 0.7)
- **Emission Strength**: 2.0 ⭐
- **Roughness**: 0.9
- **Use**: Glowing lantern (light source)

#### Prop_Basket_Mat
- **BaseColor**: Light bamboo (0.6, 0.5, 0.3)
- **Roughness**: 0.7
- **Use**: Woven bamboo container

### Instancing Props

```javascript
import { useGLTF, Instance, Instances } from '@react-three/drei'

function EnvironmentProps() {
  const { nodes } = useGLTF('/games/kimchi-fest/assets/props.glb')

  // Get individual prop geometries
  const crateGeometry = nodes.Prop_WoodenCrate.geometry
  const lanternGeometry = nodes.Prop_Lantern.geometry
  const basketGeometry = nodes.Prop_SeasoningBasket.geometry

  return (
    <>
      {/* Instance wooden crates */}
      <Instances geometry={crateGeometry}>
        <meshStandardMaterial {...nodes.Prop_WoodenCrate.material} />
        <Instance position={[5, 0.4, 2]} />
        <Instance position={[6, 0.4, 3]} rotation={[0, 0.5, 0]} />
        <Instance position={[4.5, 0.4, 1.5]} rotation={[0, -0.3, 0]} />
      </Instances>

      {/* Instance lanterns */}
      <Instances geometry={lanternGeometry}>
        <meshStandardMaterial
          {...nodes.Prop_Lantern.material}
          emissive={[1.0, 0.9, 0.7]}
          emissiveIntensity={2.0}
        />
        <Instance position={[6, 2.5, 2]} />
        <Instance position={[-5, 2.5, -6]} />
      </Instances>

      {/* Instance baskets */}
      <Instances geometry={basketGeometry}>
        <meshStandardMaterial {...nodes.Prop_Basket_Mat.material} />
        <Instance position={[7, 0.15, 2]} />
        <Instance position={[7.5, 0.15, 2.5]} rotation={[0, 0.8, 0]} />
      </Instances>
    </>
  )
}
```

### Simple Non-Instanced Approach

```javascript
function EnvironmentProps() {
  const { scene } = useGLTF('/games/kimchi-fest/assets/props.glb')

  // Clone props for multiple instances
  const crate1 = scene.getObjectByName('Prop_WoodenCrate').clone()
  const crate2 = scene.getObjectByName('Prop_WoodenCrate').clone()
  const lantern = scene.getObjectByName('Prop_Lantern')
  const basket = scene.getObjectByName('Prop_SeasoningBasket')

  return (
    <group>
      <primitive object={crate1} position={[5, 0.4, 2]} />
      <primitive object={crate2} position={[6, 0.4, 3]} />
      <primitive object={lantern} position={[6, 2.5, 2]} />
      <primitive object={basket} position={[7, 0.15, 2]} />
    </group>
  )
}
```

---

## 4. Lighting Setup Recommendations

### Baseline Three.js Lighting

```javascript
function SceneLighting() {
  return (
    <>
      {/* HDRI Environment Map (recommended) */}
      <Environment
        preset="sunset"  // Or "city", "forest", "dawn"
        background={false}  // Don't use as background
      />

      {/* Ambient Light (base illumination) */}
      <ambientLight intensity={0.4} color="#f0e6d2" />

      {/* Key Light (main directional light) */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        color="#fff5e6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Fill Light (soften shadows) */}
      <directionalLight
        position={[-3, 5, -3]}
        intensity={0.3}
        color="#b3d9ff"  // Cool fill
      />

      {/* Rim Light (edge highlight, optional) */}
      <spotLight
        position={[0, 5, -10]}
        angle={0.5}
        intensity={0.5}
        penumbra={0.5}
        color="#ffd9b3"
      />
    </>
  )
}
```

### HDRI Recommendations

For traditional Korean aesthetics, use warm, natural lighting:

| HDRI Preset | Time of Day | Mood | Best For |
|-------------|-------------|------|----------|
| `sunset` | Golden hour | Warm, nostalgic | General gameplay |
| `dawn` | Early morning | Soft, peaceful | Calm scenes |
| `forest` | Midday | Natural, balanced | Outdoor feel |
| `city` | Evening | Urban, mixed | Contemporary twist |

### Lantern Glow Enhancement

The lanterns have emission built-in, but add point lights for full glow effect:

```javascript
function LanternWithLight({ position }) {
  return (
    <group position={position}>
      {/* Lantern mesh (from props.glb) */}
      <primitive object={lanternMesh} />

      {/* Point light for glow */}
      <pointLight
        position={[0, 0, 0]}
        distance={3}
        intensity={0.8}
        color="#ffe4b3"
        decay={2}
      />
    </group>
  )
}
```

### Shadow Configuration

Enable shadows for realism:

```javascript
// In Canvas
<Canvas shadows shadowMap>
  {/* ... */}
</Canvas>

// Make objects cast shadows
const hanok = useGLTF('/games/kimchi-fest/assets/hanok.glb')

useEffect(() => {
  hanok.scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })
}, [hanok])

// Ground receives shadows
const ground = useGLTF('/games/kimchi-fest/assets/ground.glb')

useEffect(() => {
  const groundMesh = ground.scene.getObjectByName('Ground_Courtyard')
  if (groundMesh) {
    groundMesh.receiveShadow = true
  }
}, [ground])
```

---

## 5. Complete Scene Setup Example

```javascript
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'
import { Suspense, useEffect } from 'react'

function KimchiFestScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [10, 5, 10], fov: 50 }}
    >
      <Suspense fallback={null}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <Environment preset="sunset" background={false} />

        {/* Environment Assets */}
        <Ground />
        <HanokBuilding position={[0, -8, 0]} />
        <EnvironmentProps />

        {/* Controls */}
        <OrbitControls />
      </Suspense>
    </Canvas>
  )
}

function Ground() {
  const { scene } = useGLTF('/games/kimchi-fest/assets/ground.glb')

  useEffect(() => {
    const ground = scene.getObjectByName('Ground_Courtyard')
    if (ground) {
      ground.receiveShadow = true
    }
  }, [scene])

  return <primitive object={scene} />
}

function HanokBuilding({ position }) {
  const { scene } = useGLTF('/games/kimchi-fest/assets/hanok.glb')

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  return <primitive object={scene} position={position} />
}

function EnvironmentProps() {
  const { scene } = useGLTF('/games/kimchi-fest/assets/props.glb')

  const crate = scene.getObjectByName('Prop_WoodenCrate')
  const lantern = scene.getObjectByName('Prop_Lantern')

  return (
    <group>
      {/* Crates */}
      <primitive object={crate.clone()} position={[5, 0.4, 2]} />

      {/* Lantern with light */}
      <group position={[6, 2.5, 2]}>
        <primitive object={lantern} />
        <pointLight distance={3} intensity={0.8} color="#ffe4b3" />
      </group>
    </group>
  )
}

export default KimchiFestScene
```

---

## 6. Performance Optimization

### Level of Detail (LOD)

The assets are already optimized, but for very distant views:

```javascript
import { Lod } from '@react-three/drei'

function HanokWithLOD() {
  const highDetail = useGLTF('/games/kimchi-fest/assets/hanok.glb')

  // Create simplified version by hiding some objects
  const lowDetail = useMemo(() => {
    const clone = highDetail.scene.clone()
    // Hide beams and some details at distance
    clone.getObjectByName('Hanok_FrontBeam')?.visible = false
    clone.getObjectByName('Hanok_BackBeam')?.visible = false
    return clone
  }, [highDetail])

  return (
    <Lod distances={[0, 15, 30]}>
      <primitive object={highDetail.scene} />  {/* 0-15 units */}
      <primitive object={lowDetail} />         {/* 15-30 units */}
      <mesh visible={false} />                 {/* 30+ units: invisible */}
    </Lod>
  )
}
```

### Instancing Best Practices

- Use `<Instances>` from Drei for repeated props (crates, baskets)
- Each instance shares same geometry/material → saves memory
- Recommended for 3+ instances of same object

---

## 7. Object Names Reference

### Hanok Building Objects
- `Hanok_Roof`
- `Hanok_Pillar_1` through `Hanok_Pillar_4`
- `Hanok_FrontBeam`, `Hanok_BackBeam`
- `Hanok_BackWall`, `Hanok_LeftWall`, `Hanok_RightWall`
- `Hanok_Platform`

### Ground
- `Ground_Courtyard`

### Props
- `Prop_WoodenCrate`
- `Prop_Lantern`
- `Prop_SeasoningBasket`

### Materials
- `Hanok_RoofTiles`, `Hanok_Wood`, `Hanok_Wall`
- `Ground_Courtyard_Mat`
- `Prop_WoodCrate_Mat`, `Prop_Lantern_Mat`, `Prop_Basket_Mat`

---

## 8. Troubleshooting

### Hanok appears too dark
- Increase ambient light intensity (try 0.6-0.8)
- Add Environment with brighter preset ("forest", "city")
- Check directional light intensity

### Ground texture doesn't tile properly
- Material uses procedural tiling (should work automatically)
- If needed, adjust mesh scale: `ground.scale.set(1.5, 1, 1.5)`

### Lanterns don't glow
- Check emission is enabled: `material.emissive.set('#ffe4b3')`
- Set `material.emissiveIntensity = 2.0`
- Add point lights inside/near lanterns for full glow effect

### Props are too small/large
- Default scale is 1:1 with game world
- Adjust individual prop scale: `prop.scale.set(1.5, 1.5, 1.5)`

### Shadows look pixelated
- Increase shadow map size: `shadow-mapSize={[4096, 4096]}`
- Adjust shadow camera bounds to fit scene tighter

---

## Next Steps

1. **Import Phase 3 assets** into your Three.js scene
2. **Set up baseline lighting** (ambient + directional + Environment)
3. **Enable shadows** on canvas and relevant meshes
4. **Instance props** for multiple placements
5. **Test performance** and adjust LOD/shadows as needed

For questions or additional integration needs, refer to the Blender source file: `blender-sources/cabbage.blend` (contains all Phase 1, 2, and 3 assets).
