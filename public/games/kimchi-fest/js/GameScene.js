/**
 * GameScene.js
 *
 * Manages the 3D scene, chef movement on rail, camera, and environment.
 *
 * Features:
 * - Chef moves along predefined path/rail
 * - Camera follows chef with smooth tracking
 * - Environment setup (hanok, ground, props)
 * - Path system with configurable curves
 * - Animation system integration
 */

import * as THREE from 'three';

export class GameScene {
    constructor(assetLoader, config = {}) {
        this.assetLoader = assetLoader;
        this.config = config;

        // Three.js core
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;

        // Game objects
        this.chef = null;
        this.chefMixer = null; // Animation mixer
        this.chefAnimations = {};

        this.currentTool = null;
        this.environment = {};

        // Rail/Path system
        this.railPath = null;
        this.railCurve = null;
        this.railProgress = 0; // 0 to 1
        this.chefSpeed = config.chefSpeed || 5; // units per second

        // Camera
        this.cameraOffset = new THREE.Vector3(0, 4, 8); // Closer framing so chef stays visible
        this.cameraLookAhead = 5;
        this.cameraTarget = new THREE.Vector3();
        this.cameraLerpFactor = 0.05;

        // Lighting
        this.lights = {};

        // State
        this.isReady = false;
    }

    /**
     * Initialize the scene
     */
    async initialize(container) {
        // Get gameplay config
        this.gameplay = this.assetLoader.getGameplayConfig();

        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        container.appendChild(this.renderer.domElement);

        // Setup camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.copy(this.cameraOffset);

        // Setup scene
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
        this.scene.fog = new THREE.Fog(0x87ceeb, 30, 80);

        // Setup lights
        this.setupLights();

        // Create rail path
        this.createRailPath();

        // Load environment
        await this.loadEnvironment();

        // Load chef
        await this.loadChef();

        // Set initial camera look at chef so assets are in view immediately
        if (this.chef) {
            this.cameraTarget.copy(this.chef.position);
            this.camera.position.copy(this.chef.position.clone().add(this.cameraOffset));
            this.camera.lookAt(this.cameraTarget);
        }

        // Window resize handler
        window.addEventListener('resize', () => this.handleResize());

        this.isReady = true;
        console.log('[GameScene] Initialized');
    }

    /**
     * Setup lighting
     */
    setupLights() {
        // Ambient light
        this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.lights.ambient);

        // Key light (main directional)
        this.lights.key = new THREE.DirectionalLight(0xfff5e6, 1.2);
        this.lights.key.position.set(5, 8, 5);
        this.lights.key.castShadow = true;
        this.lights.key.shadow.mapSize.width = 2048;
        this.lights.key.shadow.mapSize.height = 2048;
        this.lights.key.shadow.camera.left = -20;
        this.lights.key.shadow.camera.right = 20;
        this.lights.key.shadow.camera.top = 20;
        this.lights.key.shadow.camera.bottom = -20;
        this.lights.key.shadow.camera.near = 0.1;
        this.lights.key.shadow.camera.far = 50;
        this.scene.add(this.lights.key);

        // Fill light
        this.lights.fill = new THREE.DirectionalLight(0xb3d9ff, 0.3);
        this.lights.fill.position.set(-3, 5, -3);
        this.scene.add(this.lights.fill);

        // Rim light
        this.lights.rim = new THREE.DirectionalLight(0xffe4b3, 0.6);
        this.lights.rim.position.set(-4, 3, -6);
        this.scene.add(this.lights.rim);

        console.log('[GameScene] Lights setup complete');
    }

    /**
     * Create rail path for chef movement
     */
    createRailPath() {
        const gameplay = this.assetLoader.getGameplayConfig();
        const pathLength = gameplay.rail?.pathLength || 50;

        // Create a simple straight path with slight curves
        // This can be customized to create more interesting paths
        const points = [];
        const segments = 50;

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const z = -t * pathLength; // Move forward along -Z axis

            // Add slight S-curve variation
            const x = Math.sin(t * Math.PI * 2) * 2;
            const y = 0; // Keep on ground level

            points.push(new THREE.Vector3(x, y, z));
        }

        this.railCurve = new THREE.CatmullRomCurve3(points);
        this.railCurve.closed = false;

        // Visualize rail path (debug)
        if (this.config.debug) {
            const geometry = new THREE.BufferGeometry().setFromPoints(
                this.railCurve.getPoints(100)
            );
            const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
            const line = new THREE.Line(geometry, material);
            this.scene.add(line);
        }

        console.log('[GameScene] Rail path created');
    }

    /**
     * Load environment assets
     */
    async loadEnvironment() {
        const assets = this.assetLoader.assets;

        // Load ground (tiled along the path)
        if (assets.environment?.ground) {
            const pathLength = this.gameplay?.rail?.pathLength || 50;
            const groundConfig = this.assetLoader.manifest?.assets?.environment?.ground || {};
            const baseScale = groundConfig.scale || 1;
            const defaultTileLength = 20;
            const tileLength = defaultTileLength * baseScale;
            const tiles = Math.ceil(pathLength / tileLength) + 2; // add buffer tiles

            for (let i = 0; i < tiles; i++) {
                const ground = this.assetLoader.clone('environment', 'ground');
                if (!ground) continue;

                // Apply optional extra widening so we see full floor
                ground.scale.multiplyScalar(Math.max(1, baseScale));
                ground.position.set(0, 0, -i * tileLength);

                ground.traverse((child) => {
                    if (child.isMesh) {
                        child.receiveShadow = true;
                    }
                });
                this.scene.add(ground);

                if (i === 0) {
                    this.environment.ground = ground;
                }
            }
        }

        // Load hanok
        if (assets.environment?.hanok) {
            const hanok = this.assetLoader.clone('environment', 'hanok');
            if (hanok) {
                hanok.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                this.scene.add(hanok);
                this.environment.hanok = hanok;
            }
        }

        // Load props
        if (assets.environment?.props) {
            this.loadProps();
        }

        console.log('[GameScene] Environment loaded');
    }

    /**
     * Load and place props
     */
    loadProps() {
        const propsAsset = this.assetLoader.get('environment', 'props');
        if (!propsAsset || !propsAsset.scene) return;

        // Place crates
        const crate1 = propsAsset.scene.getObjectByName('Prop_WoodenCrate')?.clone();
        const crate2 = propsAsset.scene.getObjectByName('Prop_WoodenCrate')?.clone();

        if (crate1) {
            crate1.position.set(-5, 0, -10);
            crate1.castShadow = true;
            crate1.receiveShadow = true;
            this.scene.add(crate1);
        }

        if (crate2) {
            crate2.position.set(5, 0, -15);
            crate2.castShadow = true;
            crate2.receiveShadow = true;
            this.scene.add(crate2);
        }

        // Place lanterns
        const lantern1 = propsAsset.scene.getObjectByName('Prop_Lantern')?.clone();
        const lantern2 = propsAsset.scene.getObjectByName('Prop_Lantern')?.clone();

        if (lantern1) {
            lantern1.position.set(-6, 1.5, -20);
            lantern1.castShadow = true;

            // Add point light for glow
            const light = new THREE.PointLight(0xffe4b3, 0.8, 5);
            light.position.copy(lantern1.position);
            this.scene.add(light);

            this.scene.add(lantern1);
        }

        if (lantern2) {
            lantern2.position.set(6, 1.5, -20);
            lantern2.castShadow = true;

            // Add point light for glow
            const light = new THREE.PointLight(0xffe4b3, 0.8, 5);
            light.position.copy(lantern2.position);
            this.scene.add(light);

            this.scene.add(lantern2);
        }

        console.log('[GameScene] Props placed');
    }

    /**
     * Compute bounding box size of an object
     */
    getObjectSize(object) {
        const box = new THREE.Box3().setFromObject(object);
        const size = new THREE.Vector3();
        box.getSize(size);
        return size;
    }

    /**
     * Load chef character
     */
    async loadChef() {
        const chefAsset = this.assetLoader.get('character', 'idle');
        if (!chefAsset || !chefAsset.scene) {
            console.error('[GameScene] Chef asset not found');
            return;
        }

        this.chef = chefAsset.scene.clone(true);

        // Apply config scale (larger for visibility)
        const scale = Math.max(3.0, chefAsset.config?.scale || 3.0);
        this.chef.scale.set(scale, scale, scale);

        // Enable shadows
        this.chef.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // Setup animations
        if (chefAsset.animations && chefAsset.animations.length > 0) {
            this.chefMixer = new THREE.AnimationMixer(this.chef);

            chefAsset.animations.forEach(clip => {
                this.chefAnimations[clip.name] = this.chefMixer.clipAction(clip);
            });

            // Play idle animation if available
            const idleAnim = this.chefAnimations['idle'] || this.chefAnimations['action_idle'];
            if (idleAnim) {
                idleAnim.play();
            }
        }

        // Load swing animation
        const swingAsset = this.assetLoader.get('character', 'swing');
        if (swingAsset && swingAsset.animations) {
            swingAsset.animations.forEach(clip => {
                const action = this.chefMixer.clipAction(clip, this.chef);
                this.chefAnimations[clip.name] = action;
            });
        }

        // Position chef at start of rail
        this.updateChefPosition(0);

        this.scene.add(this.chef);

        console.log('[GameScene] Chef loaded with animations:', Object.keys(this.chefAnimations));
    }

    /**
     * Update chef position on rail
     */
    updateChefPosition(progress) {
        if (!this.chef || !this.railCurve) return;

        this.railProgress = Math.max(0, Math.min(1, progress));

        const point = this.railCurve.getPointAt(this.railProgress);
        this.chef.position.copy(point);

        // Get tangent for rotation
        const tangent = this.railCurve.getTangentAt(this.railProgress);
        const angle = Math.atan2(tangent.x, tangent.z);
        this.chef.rotation.y = angle;
    }

    /**
     * Move chef forward on rail
     */
    moveChef(deltaTime) {
        if (!this.chef || !this.railCurve) return;

        const pathLength = this.railCurve.getLength();
        const distance = this.chefSpeed * deltaTime;
        const progressDelta = distance / pathLength;

        this.updateChefPosition(this.railProgress + progressDelta);

        return this.railProgress;
    }

    /**
     * Play chef animation
     */
    playAnimation(name, options = {}) {
        if (!this.chefMixer || !this.chefAnimations[name]) {
            console.warn(`[GameScene] Animation not found: ${name}`);
            return;
        }

        const action = this.chefAnimations[name];

        // Stop current animations if requested
        if (options.exclusive) {
            Object.values(this.chefAnimations).forEach(a => {
                if (a !== action) a.stop();
            });
        }

        // Configure action
        if (options.loop !== undefined) {
            action.loop = options.loop ? THREE.LoopRepeat : THREE.LoopOnce;
        }

        if (options.clampWhenFinished) {
            action.clampWhenFinished = true;
        }

        if (options.fadeIn) {
            action.reset().fadeIn(options.fadeIn).play();
        } else {
            action.play();
        }

        console.log(`[GameScene] Playing animation: ${name}`);
    }

    /**
     * Update camera to follow chef
     */
    updateCamera() {
        if (!this.chef || !this.camera) return;

        // Calculate target position (chef position + look ahead)
        const lookAheadPoint = this.railCurve.getPointAt(
            Math.min(1, this.railProgress + 0.1)
        );

        this.cameraTarget.lerp(lookAheadPoint, this.cameraLerpFactor);

        // Position camera relative to chef
        const cameraPos = this.chef.position.clone().add(this.cameraOffset);
        this.camera.position.lerp(cameraPos, this.cameraLerpFactor);

        // Look at target
        this.camera.lookAt(this.cameraTarget);
    }

    /**
     * Update scene (called every frame)
     */
    update(deltaTime) {
        // Update animations
        if (this.chefMixer) {
            this.chefMixer.update(deltaTime);
        }

        // Update camera
        this.updateCamera();
    }

    /**
     * Render the scene
     */
    render() {
        if (!this.renderer || !this.scene || !this.camera) return;
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (!this.camera || !this.renderer) return;

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Reset chef to start position
     */
    resetChef() {
        this.updateChefPosition(0);
    }

    /**
     * Get chef position
     */
    getChefPosition() {
        return this.chef?.position.clone() || new THREE.Vector3();
    }

    /**
     * Get chef forward direction
     */
    getChefForward() {
        if (!this.chef) return new THREE.Vector3(0, 0, -1);

        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.chef.quaternion);
        return forward;
    }

    /**
     * Add object to scene
     */
    addToScene(object) {
        this.scene.add(object);
    }

    /**
     * Remove object from scene
     */
    removeFromScene(object) {
        this.scene.remove(object);
    }

    /**
     * Get scene statistics
     */
    getStats() {
        return {
            isReady: this.isReady,
            railProgress: this.railProgress,
            chefPosition: this.getChefPosition(),
            chefSpeed: this.chefSpeed,
            animations: Object.keys(this.chefAnimations),
            objectCount: this.scene.children.length
        };
    }

    /**
     * Destroy scene
     */
    destroy() {
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }

        // Dispose geometries and materials
        this.scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => m.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });

        console.log('[GameScene] Destroyed');
    }
}
