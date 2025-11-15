/**
 * SpawningSystem.js
 *
 * Manages rhythm-synchronized spawning of seasoning and cabbage objects.
 * Spawns ingredients on beat, moves them toward chef, handles lifecycle.
 *
 * Features:
 * - Beat-synchronized spawning (seasoning ??cabbage sequence)
 * - Object pooling for performance
 * - Movement and lifecycle management
 * - Collision/interaction detection
 * - Visual feedback and cleanup
 */

import * as THREE from 'three';

export class SpawningSystem {
    constructor(scene, assetLoader, rhythmEngine, config = {}) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.rhythmEngine = rhythmEngine;
        this.config = config;

        // Spawning config
        const gameplay = assetLoader.getGameplayConfig();
        this.spawnInterval = gameplay.spawning?.spawnInterval ? Math.max(1, gameplay.spawning.spawnInterval) : 1; // beats between spawns
        this.spawnDistance = Math.min(Math.max(gameplay.spawning?.spawnDistance || 20, 10), 25);
        this.despawnDistance = gameplay.spawning?.despawnDistance || -10;

        // Active objects
        this.seasoningObjects = [];
        this.cabbageObjects = [];
        this.allObjects = [];

        // Object pools
        this.seasoningPool = [];
        this.cabbagePool = [];

        // State
        this.nextSpawnBeat = 0;
        this.spawnSeasoning = true; // Alternate: seasoning -> cabbage -> seasoning -> cabbage
        this.isActive = false;

        // Statistics
        this.totalSpawned = 0;
        this.totalDespawned = 0;
    }

    /**
     * Start spawning system
     */
    start() {
        if (this.isActive) return;

        this.isActive = true;

        // Register beat callback for spawning
        this.beatUnsubscribe = this.rhythmEngine.onBeat((beat, time) => {
            this.handleBeat(beat, time);
        });

        console.log('[SpawningSystem] Started');
    }

    /**
     * Stop spawning system
     */
    stop() {
        if (!this.isActive) return;

        this.isActive = false;

        // Unsubscribe from beat events
        if (this.beatUnsubscribe) {
            this.beatUnsubscribe();
            this.beatUnsubscribe = null;
        }

        // Clear all active objects
        this.clearAllObjects();

        console.log('[SpawningSystem] Stopped');
    }

    /**
     * Handle beat event for spawning
     */
    handleBeat(beat, time) {
        if (!this.isActive) return;

        // Alternate spawning: seasoning ??cabbage ??seasoning ??cabbage
        if (beat >= this.nextSpawnBeat) {
            if (this.spawnSeasoning) {
                this.spawnSeasoningObject();
            } else {
                this.spawnCabbage();
            }

            // Toggle for next spawn
            this.spawnSeasoning = !this.spawnSeasoning;
            this.nextSpawnBeat = beat + this.spawnInterval;
        }
    }

    /**
     * Spawn a seasoning object
     */
    spawnSeasoningObject() {
        let obj = this.seasoningPool.pop();

        if (!obj) {
            // Create new object
            obj = this.createSeasoningObject();
        }

        if (!obj) return;

        // Position in front of chef (straight line, no random offset)
        const chefPos = this.scene.getChefPosition();
        obj.position.set(
            0, // Center line (no X offset)
            1,
            chefPos.z - this.spawnDistance
        );

        obj.visible = true;
        obj.userData.isActive = true;
        obj.userData.type = 'seasoning';
        obj.userData.spawnTime = this.rhythmEngine.getCurrentTimeSec();

        this.scene.addToScene(obj);
        this.seasoningObjects.push(obj);
        this.allObjects.push(obj);

        this.totalSpawned++;

        console.log('[SpawningSystem] Spawned seasoning');
    }

    /**
     * Spawn a cabbage object
     */
    spawnCabbage() {
        let obj = this.cabbagePool.pop();

        if (!obj) {
            // Create new object
            obj = this.createCabbageObject();
        }

        if (!obj) return;

        // Position in front of chef (straight line, no random offset)
        const chefPos = this.scene.getChefPosition();
        obj.position.set(
            0, // Center line (no X offset)
            0.5,
            chefPos.z - this.spawnDistance
        );

        obj.visible = true;
        obj.userData.isActive = true;
        obj.userData.type = 'cabbage';
        obj.userData.spawnTime = this.rhythmEngine.getCurrentTimeSec();
        obj.userData.isRaw = true; // Start as raw

        this.scene.addToScene(obj);
        this.cabbageObjects.push(obj);
        this.allObjects.push(obj);

        this.totalSpawned++;

        console.log('[SpawningSystem] Spawned cabbage');
    }

    /**
     * Create seasoning object
     */
    createSeasoningObject() {
        const asset = this.assetLoader.get('ingredients', 'seasoning');
        if (!asset || !asset.scene) {
            console.warn('[SpawningSystem] Seasoning asset not loaded');
            return null;
        }

        const obj = asset.scene.clone(true);

        // Apply config
        const scale = asset.config?.scale || 0.5;
        obj.scale.set(scale, scale, scale);

        obj.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return obj;
    }

    /**
     * Create cabbage object
     */
    createCabbageObject() {
        const asset = this.assetLoader.get('ingredients', 'cabbage');
        if (!asset || !asset.scene) {
            console.warn('[SpawningSystem] Cabbage asset not loaded');
            return null;
        }

        const obj = asset.scene.clone(true);

        // Apply config
        const scale = asset.config?.scale || 1.0;
        obj.scale.set(scale, scale, scale);

        // Find the cabbage mesh for material switching
        const cabbageMesh = obj.getObjectByName('Napa_Cabbage');
        if (cabbageMesh && asset.materials) {
            obj.userData.cabbageMesh = cabbageMesh;
            obj.userData.rawMaterial = asset.materials['Cabbage_Raw'];
            obj.userData.seasonedMaterial = asset.materials['Cabbage_Seasoned'];
        }

        obj.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return obj;
    }

    /**
     * Update spawning system (called every frame)
     */
    update(deltaTime) {
        if (!this.isActive) return;

        const chefPos = this.scene.getChefPosition();

        // Update all active objects
        for (let i = this.allObjects.length - 1; i >= 0; i--) {
            const obj = this.allObjects[i];

            if (!obj.userData.isActive) continue;

            // Check if behind chef (despawn)
            if (obj.position.z > chefPos.z + Math.abs(this.despawnDistance)) {
                this.despawnObject(obj, i);
                continue;
            }

            // Keep objects stationary relative to world; no bob/rotate for strict alignment
        }
    }

    /**
     * Despawn an object
     */
    despawnObject(obj, index) {
        obj.userData.isActive = false;
        obj.visible = false;
        this.scene.removeFromScene(obj);

        // Remove from active list
        this.allObjects.splice(index, 1);

        const arrayIndex = obj.userData.type === 'seasoning'
            ? this.seasoningObjects.indexOf(obj)
            : this.cabbageObjects.indexOf(obj);

        if (arrayIndex > -1) {
            if (obj.userData.type === 'seasoning') {
                this.seasoningObjects.splice(arrayIndex, 1);
                this.seasoningPool.push(obj);
            } else {
                this.cabbageObjects.splice(arrayIndex, 1);
                this.cabbagePool.push(obj);
            }
        }

        this.totalDespawned++;

        console.log(`[SpawningSystem] Despawned ${obj.userData.type}`);
    }

    /**
     * Apply seasoning to cabbage (change material)
     */
    applySeasoning(cabbageObj) {
        if (!cabbageObj || cabbageObj.userData.type !== 'cabbage') return;

        if (cabbageObj.userData.isRaw && cabbageObj.userData.cabbageMesh) {
            const mesh = cabbageObj.userData.cabbageMesh;
            const seasonedMat = cabbageObj.userData.seasonedMaterial;

            if (seasonedMat) {
                mesh.material = seasonedMat;
                cabbageObj.userData.isRaw = false;

                console.log('[SpawningSystem] Seasoning applied to cabbage');
                return true;
            }
        }

        return false;
    }

    /**
     * Find nearest object to position
     */
    findNearestObject(position, type = null, maxDistance = 5) {
        let nearest = null;
        let nearestDist = maxDistance;

        const objects = type === 'seasoning' ? this.seasoningObjects :
                       type === 'cabbage' ? this.cabbageObjects :
                       this.allObjects;

        for (const obj of objects) {
            if (!obj.userData.isActive) continue;

            const dist = obj.position.distanceTo(position);
            if (dist < nearestDist) {
                nearest = obj;
                nearestDist = dist;
            }
        }

        return { object: nearest, distance: nearestDist };
    }

    /**
     * Get all objects in radius
     */
    getObjectsInRadius(position, radius, type = null) {
        const objects = type === 'seasoning' ? this.seasoningObjects :
                       type === 'cabbage' ? this.cabbageObjects :
                       this.allObjects;

        return objects.filter(obj => {
            return obj.userData.isActive && obj.position.distanceTo(position) <= radius;
        });
    }

    /**
     * Clear all active objects
     */
    clearAllObjects() {
        // Move all to pools
        [...this.allObjects].forEach((obj, i) => {
            this.despawnObject(obj, i);
        });

        this.seasoningObjects = [];
        this.cabbageObjects = [];
        this.allObjects = [];
    }

    /**
     * Reset spawning system
     */
    reset() {
        this.clearAllObjects();
        this.nextSpawnBeat = 0;
        this.spawnSeasoning = true; // Start with seasoning
        this.totalSpawned = 0;
        this.totalDespawned = 0;
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            isActive: this.isActive,
            seasoningCount: this.seasoningObjects.length,
            cabbageCount: this.cabbageObjects.length,
            totalActive: this.allObjects.length,
            totalSpawned: this.totalSpawned,
            totalDespawned: this.totalDespawned,
            poolSizes: {
                seasoning: this.seasoningPool.length,
                cabbage: this.cabbagePool.length
            },
            nextSpawns: {
                seasoning: this.nextSeasoningBeat,
                cabbage: this.nextCabbageBeat
            }
        };
    }

    /**
     * Destroy spawning system
     */
    destroy() {
        this.stop();
        this.clearAllObjects();

        // Clear pools
        this.seasoningPool = [];
        this.cabbagePool = [];

        console.log('[SpawningSystem] Destroyed');
    }
}



