/**
 * AssetLoader.js
 *
 * Manages asset loading from manifest (assets/config.json).
 * Supports hot-reload, validation, and user asset replacement.
 *
 * Features:
 * - Manifest-based asset management
 * - GLTFLoader integration
 * - Asset validation (+Y up, scale, naming)
 * - Hot-reload support
 * - Progress tracking
 * - Error handling and fallbacks
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class AssetLoader {
    constructor(manifestUrl = './assets/config.json') {
        this.manifestUrl = manifestUrl;
        this.manifest = null;
        this.assets = {};
        this.loader = new GLTFLoader();

        // Loading state
        this.isLoading = false;
        this.loadProgress = 0;
        this.loadTotal = 0;
        this.loadedCount = 0;

        // Callbacks
        this.onProgressCallbacks = [];
        this.onCompleteCallbacks = [];
        this.onErrorCallbacks = [];

        // Cache
        this.cache = new Map();
    }

    /**
     * Load the asset manifest
     */
    async loadManifest() {
        try {
            const response = await fetch(this.manifestUrl + '?t=' + Date.now());
            if (!response.ok) {
                throw new Error(`Failed to load manifest: ${response.statusText}`);
            }

            this.manifest = await response.json();
            console.log('[AssetLoader] Manifest loaded:', this.manifest.version);
            return this.manifest;
        } catch (error) {
            console.error('[AssetLoader] Manifest load failed:', error);
            this.triggerError('manifest', error);
            throw error;
        }
    }

    /**
     * Load all assets from manifest
     */
    async loadAll() {
        if (!this.manifest) {
            await this.loadManifest();
        }

        this.isLoading = true;
        this.loadedCount = 0;
        this.loadTotal = this.countAssets();

        console.log(`[AssetLoader] Loading ${this.loadTotal} assets...`);

        try {
            // Load in parallel with Promise.all
            await Promise.all([
                this.loadCategory('character'),
                this.loadCategory('tools'),
                this.loadCategory('ingredients'),
                this.loadCategory('environment')
            ]);

            this.isLoading = false;
            console.log('[AssetLoader] All assets loaded successfully');
            this.triggerComplete();
            return this.assets;
        } catch (error) {
            this.isLoading = false;
            console.error('[AssetLoader] Asset loading failed:', error);
            this.triggerError('loading', error);
            throw error;
        }
    }

    /**
     * Count total assets in manifest
     */
    countAssets() {
        let count = 0;
        const categories = ['character', 'tools', 'ingredients', 'environment'];

        for (const category of categories) {
            const items = this.manifest.assets[category];
            if (!items) continue;

            for (const key in items) {
                if (items[key].url) count++;
            }
        }

        return count;
    }

    /**
     * Load a category of assets
     */
    async loadCategory(category) {
        const items = this.manifest.assets[category];
        if (!items) return;

        this.assets[category] = {};

        const promises = [];
        for (const [key, config] of Object.entries(items)) {
            if (config.url) {
                promises.push(
                    this.loadAsset(config.url, key).then(asset => {
                        this.assets[category][key] = {
                            ...asset,
                            config
                        };
                        this.loadedCount++;
                        this.updateProgress();
                    })
                );
            }
        }

        await Promise.all(promises);
    }

    /**
     * Load a single asset (GLB/GLTF)
     */
    async loadAsset(url, name) {
        // Check cache
        if (this.cache.has(url)) {
            console.log(`[AssetLoader] Loading from cache: ${name}`);
            return this.cache.get(url);
        }

        return new Promise((resolve, reject) => {
            this.loader.load(
                url,
                (gltf) => {
                    console.log(`[AssetLoader] Loaded: ${name} (${url})`);

                    // Validate asset
                    const validation = this.validateAsset(gltf, name);
                    if (!validation.valid) {
                        console.warn(`[AssetLoader] Validation warnings for ${name}:`, validation.warnings);
                    }

                    // Cache the asset
                    this.cache.set(url, gltf);

                    resolve(gltf);
                },
                (progress) => {
                    // Progress callback
                    if (progress.lengthComputable) {
                        const percent = (progress.loaded / progress.total) * 100;
                        // console.log(`[AssetLoader] ${name}: ${percent.toFixed(0)}%`);
                    }
                },
                (error) => {
                    console.error(`[AssetLoader] Failed to load ${name} (${url}):`, error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Validate asset conventions
     */
    validateAsset(gltf, name) {
        const warnings = [];
        const conventions = this.manifest.userAssetConventions;

        // Check scene exists
        if (!gltf.scene) {
            warnings.push('No scene in GLTF');
            return { valid: false, warnings };
        }

        // Check orientation (approximate check via bounding box)
        const bbox = new THREE.Box3().setFromObject(gltf.scene);
        const size = new THREE.Vector3();
        bbox.getSize(size);

        // For +Y up, height (Y) should typically be larger than width/depth
        if (size.y < Math.max(size.x, size.z) * 0.5) {
            warnings.push('Asset may not be +Y Up oriented');
        }

        // Check animations
        if (gltf.animations && gltf.animations.length > 0) {
            console.log(`[AssetLoader] ${name} has ${gltf.animations.length} animations:`,
                gltf.animations.map(a => a.name));
        }

        // Check materials
        const materials = [];
        gltf.scene.traverse((child) => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    materials.push(...child.material);
                } else {
                    materials.push(child.material);
                }
            }
        });

        console.log(`[AssetLoader] ${name} has ${materials.length} materials`);

        return {
            valid: warnings.length === 0,
            warnings,
            stats: {
                meshCount: this.countMeshes(gltf.scene),
                materialCount: materials.length,
                animationCount: gltf.animations?.length || 0,
                size
            }
        };
    }

    /**
     * Count meshes in a scene
     */
    countMeshes(object) {
        let count = 0;
        object.traverse((child) => {
            if (child.isMesh) count++;
        });
        return count;
    }

    /**
     * Get a loaded asset by category and key
     */
    get(category, key) {
        return this.assets[category]?.[key];
    }

    /**
     * Get GLTF object from loaded asset
     */
    getGLTF(category, key) {
        const asset = this.get(category, key);
        return asset?.scene || asset?.gltf || asset;
    }

    /**
     * Clone a GLTF scene for instancing
     */
    clone(category, key) {
        const asset = this.get(category, key);
        if (!asset || !asset.scene) return null;

        const cloned = asset.scene.clone(true);

        // Apply config transforms if available
        if (asset.config) {
            if (asset.config.scale) {
                const s = asset.config.scale;
                cloned.scale.set(
                    Array.isArray(s) ? s[0] : s,
                    Array.isArray(s) ? s[1] : s,
                    Array.isArray(s) ? s[2] : s
                );
            }
            if (asset.config.position) {
                cloned.position.fromArray(asset.config.position);
            }
            if (asset.config.rotation) {
                cloned.rotation.fromArray(asset.config.rotation);
            }
        }

        return cloned;
    }

    /**
     * Reload a specific asset
     */
    async reloadAsset(category, key) {
        const config = this.manifest.assets[category]?.[key];
        if (!config || !config.url) {
            throw new Error(`Asset not found: ${category}.${key}`);
        }

        // Clear cache
        this.cache.delete(config.url);

        // Reload
        const asset = await this.loadAsset(config.url, key);
        this.assets[category][key] = {
            ...asset,
            config
        };

        console.log(`[AssetLoader] Reloaded: ${category}.${key}`);
        return asset;
    }

    /**
     * Reload entire manifest and all assets
     */
    async reload() {
        console.log('[AssetLoader] Reloading all assets...');
        this.cache.clear();
        this.assets = {};
        await this.loadManifest();
        await this.loadAll();
        console.log('[AssetLoader] Reload complete');
    }

    /**
     * Update progress
     */
    updateProgress() {
        this.loadProgress = this.loadTotal > 0
            ? (this.loadedCount / this.loadTotal) * 100
            : 0;

        this.triggerProgress(this.loadedCount, this.loadTotal, this.loadProgress);
    }

    /**
     * Register progress callback
     */
    onProgress(callback) {
        this.onProgressCallbacks.push(callback);
        return () => {
            const index = this.onProgressCallbacks.indexOf(callback);
            if (index > -1) this.onProgressCallbacks.splice(index, 1);
        };
    }

    /**
     * Register complete callback
     */
    onComplete(callback) {
        this.onCompleteCallbacks.push(callback);
        return () => {
            const index = this.onCompleteCallbacks.indexOf(callback);
            if (index > -1) this.onCompleteCallbacks.splice(index, 1);
        };
    }

    /**
     * Register error callback
     */
    onError(callback) {
        this.onErrorCallbacks.push(callback);
        return () => {
            const index = this.onErrorCallbacks.indexOf(callback);
            if (index > -1) this.onErrorCallbacks.splice(index, 1);
        };
    }

    /**
     * Trigger progress callbacks
     */
    triggerProgress(loaded, total, percent) {
        this.onProgressCallbacks.forEach(callback => {
            try {
                callback(loaded, total, percent);
            } catch (e) {
                console.error('[AssetLoader] Progress callback error:', e);
            }
        });
    }

    /**
     * Trigger complete callbacks
     */
    triggerComplete() {
        this.onCompleteCallbacks.forEach(callback => {
            try {
                callback(this.assets);
            } catch (e) {
                console.error('[AssetLoader] Complete callback error:', e);
            }
        });
    }

    /**
     * Trigger error callbacks
     */
    triggerError(type, error) {
        this.onErrorCallbacks.forEach(callback => {
            try {
                callback(type, error);
            } catch (e) {
                console.error('[AssetLoader] Error callback error:', e);
            }
        });
    }

    /**
     * Get manifest config
     */
    getManifest() {
        return this.manifest;
    }

    /**
     * Get gameplay config from manifest
     */
    getGameplayConfig() {
        return this.manifest?.gameplay || {};
    }

    /**
     * Get loading statistics
     */
    getStats() {
        return {
            isLoading: this.isLoading,
            loadProgress: this.loadProgress,
            loadedCount: this.loadedCount,
            loadTotal: this.loadTotal,
            cacheSize: this.cache.size
        };
    }
}
