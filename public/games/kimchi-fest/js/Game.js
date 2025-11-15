/**
 * Game.js
 *
 * Main game controller - orchestrates all systems and gameplay loop.
 *
 * Features:
 * - Rhythm-based gameplay loop
 * - Scoring and combo system
 * - State management
 * - System coordination
 * - Event handling
 */

import { RhythmEngine } from './RhythmEngine.js';
import { AssetLoader } from './AssetLoader.js';
import { InputAdapter } from './InputAdapter.js';
import { GameScene } from './GameScene.js';
import { SpawningSystem } from './SpawningSystem.js';

export class Game {
    constructor(container, config = {}) {
        this.container = container;
        this.config = config;

        // Core systems
        this.assetLoader = null;
        this.rhythmEngine = null;
        this.inputAdapter = null;
        this.scene = null;
        this.spawningSystem = null;

        // Game state
        this.state = {
            isPlaying: false,
            isPaused: false,
            score: 0,
            combo: 0,
            maxCombo: 0,
            hits: { perfect: 0, good: 0, miss: 0 },
            totalNotes: 0
        };

        // Gameplay config
        this.gameplay = null;

        // Callbacks
        this.callbacks = {
            onScoreChange: [],
            onComboChange: [],
            onHit: [],
            onMiss: [],
            onGameOver: []
        };

        // Animation frame
        this.animationFrameId = null;
        this.lastFrameTime = 0;

        // Interaction range
        this.interactionRange = 3;
    }

    /**
     * Initialize the game
     */
    async initialize() {
        console.log('[Game] Initializing...');

        try {
            // 1. Load assets
            console.log('[Game] Loading assets...');
            this.assetLoader = new AssetLoader();

            this.assetLoader.onProgress((loaded, total, percent) => {
                console.log(`[Game] Loading: ${loaded}/${total} (${percent.toFixed(0)}%)`);
                this.triggerCallback('onLoadProgress', { loaded, total, percent });
            });

            await this.assetLoader.loadAll();

            this.gameplay = this.assetLoader.getGameplayConfig();
            console.log('[Game] Gameplay config:', this.gameplay);

            // 2. Initialize rhythm engine
            console.log('[Game] Initializing rhythm engine...');
            this.rhythmEngine = new RhythmEngine(this.gameplay.rhythm);

            // 3. Initialize scene
            console.log('[Game] Initializing scene...');
            this.scene = new GameScene(this.assetLoader, {
                ...this.gameplay.rail,
                debug: this.config.debug
            });
            await this.scene.initialize(this.container);

            // 4. Initialize spawning system
            console.log('[Game] Initializing spawning system...');
            this.spawningSystem = new SpawningSystem(
                this.scene,
                this.assetLoader,
                this.rhythmEngine,
                this.gameplay.spawning
            );

            // 5. Initialize input
            console.log('[Game] Initializing input...');
            this.inputAdapter = new InputAdapter({
                debug: this.config.debug,
                ...this.gameplay.input
            });

            // Setup input handlers
            this.setupInputHandlers();

            // 6. Setup beat indicators
            this.setupBeatIndicators();

            console.log('[Game] Initialization complete!');
            this.triggerCallback('onReady');

        } catch (error) {
            console.error('[Game] Initialization failed:', error);
            this.triggerCallback('onError', { type: 'init', error });
            throw error;
        }
    }

    /**
     * Setup input handlers
     */
    setupInputHandlers() {
        // Swing action (apply seasoning)
        this.inputAdapter.on('swing', (data) => {
            this.handleSwingAction(data);
        });

        // Season action (alternative)
        this.inputAdapter.on('season', (data) => {
            this.handleSwingAction(data);
        });

        console.log('[Game] Input handlers setup');
    }

    /**
     * Handle swing action (apply seasoning to cabbage)
     */
    handleSwingAction(inputData) {
        if (!this.state.isPlaying) return;

        const currentTime = this.rhythmEngine.getCurrentTimeSec();
        const chefPos = this.scene.getChefPosition();

        // Find nearest cabbage
        const { object: nearestCabbage, distance: cabbageDist } =
            this.spawningSystem.findNearestObject(chefPos, 'cabbage', this.interactionRange);

        if (!nearestCabbage) {
            console.log('[Game] No cabbage in range');
            this.handleMiss();
            return;
        }

        // Find nearest seasoning
        const { object: nearestSeasoning, distance: seasoningDist } =
            this.spawningSystem.findNearestObject(chefPos, 'seasoning', this.interactionRange);

        if (!nearestSeasoning) {
            console.log('[Game] No seasoning in range');
            this.handleMiss();
            return;
        }

        // Judge timing
        const nextNote = this.rhythmEngine.getNextNote();
        let judgment = 'good'; // Default if no note queued

        if (nextNote) {
            const result = this.rhythmEngine.judgeAction(currentTime);
            judgment = result.judgment || 'miss';
        }

        // Apply seasoning to cabbage
        const applied = this.spawningSystem.applySeasoning(nearestCabbage);

        if (applied) {
            // Play swing animation
            this.scene.playAnimation('swing', {
                loop: false,
                clampWhenFinished: true,
                fadeIn: 0.1
            });

            // Return to idle after animation
            setTimeout(() => {
                this.scene.playAnimation('idle', { loop: true, fadeIn: 0.2 });
            }, 500);

            // Handle hit
            this.handleHit(judgment);

            // Visual feedback
            this.triggerCallback('onAction', {
                type: 'season',
                judgment,
                position: nearestCabbage.position.clone()
            });

        } else {
            this.handleMiss();
        }
    }

    /**
     * Handle successful hit
     */
    handleHit(judgment) {
        // Update stats
        this.state.totalNotes++;

        if (judgment === 'perfect' || judgment === 'good') {
            this.state.hits[judgment]++;

            // Increase combo
            this.state.combo++;
            if (this.state.combo > this.state.maxCombo) {
                this.state.maxCombo = this.state.combo;
            }

            // Calculate score
            const baseScore = this.gameplay.scoring[judgment] || 0;
            const comboMultiplier = Math.pow(
                this.gameplay.scoring.comboMultiplier || 1.1,
                Math.min(this.state.combo, 10) - 1
            );
            const score = Math.floor(baseScore * comboMultiplier);

            this.state.score += score;

            console.log(`[Game] Hit! ${judgment.toUpperCase()} +${score} (combo: ${this.state.combo})`);

            this.triggerCallback('onHit', { judgment, score, combo: this.state.combo });
            this.triggerCallback('onScoreChange', this.state.score);
            this.triggerCallback('onComboChange', this.state.combo);

        } else {
            this.handleMiss();
        }
    }

    /**
     * Handle miss
     */
    handleMiss() {
        this.state.hits.miss++;
        this.state.totalNotes++;

        // Reset combo
        if (this.state.combo > 0) {
            console.log(`[Game] Combo broken! (was ${this.state.combo})`);
        }
        this.state.combo = 0;

        this.triggerCallback('onMiss');
        this.triggerCallback('onComboChange', 0);
    }

    /**
     * Setup beat indicators
     */
    setupBeatIndicators() {
        this.rhythmEngine.onBeat((beat, time) => {
            this.triggerCallback('onBeat', { beat, time });
        });

        this.rhythmEngine.onMeasure((measure, time) => {
            this.triggerCallback('onMeasure', { measure, time });
        });
    }

    /**
     * Start the game
     */
    start() {
        if (this.state.isPlaying) return;

        console.log('[Game] Starting game...');

        this.state.isPlaying = true;
        this.state.isPaused = false;

        // Reset state
        this.state.score = 0;
        this.state.combo = 0;
        this.state.maxCombo = 0;
        this.state.hits = { perfect: 0, good: 0, miss: 0 };
        this.state.totalNotes = 0;

        // Reset systems
        this.scene.resetChef();
        this.spawningSystem.reset();

        // Start systems
        this.rhythmEngine.start();
        this.spawningSystem.start();

        // Start game loop
        this.lastFrameTime = performance.now();
        this.gameLoop();

        this.triggerCallback('onGameStart');
        console.log('[Game] Game started!');
    }

    /**
     * Pause the game
     */
    pause() {
        if (!this.state.isPlaying || this.state.isPaused) return;

        this.state.isPaused = true;
        this.rhythmEngine.pause();

        console.log('[Game] Game paused');
        this.triggerCallback('onPause');
    }

    /**
     * Resume the game
     */
    resume() {
        if (!this.state.isPlaying || !this.state.isPaused) return;

        this.state.isPaused = false;
        this.rhythmEngine.resume();
        this.lastFrameTime = performance.now();

        console.log('[Game] Game resumed');
        this.triggerCallback('onResume');
    }

    /**
     * Stop the game
     */
    stop() {
        if (!this.state.isPlaying) return;

        this.state.isPlaying = false;
        this.state.isPaused = false;

        // Stop systems
        this.rhythmEngine.stop();
        this.spawningSystem.stop();

        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        console.log('[Game] Game stopped');
        this.triggerCallback('onGameStop', this.getResults());
    }

    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.state.isPlaying) return;

        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());

        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000; // Convert to seconds
        this.lastFrameTime = now;

        if (this.state.isPaused) {
            // Still render when paused
            this.scene.render();
            return;
        }

        // Update systems
        this.rhythmEngine.update();
        this.scene.moveChef(deltaTime);
        this.scene.update(deltaTime);
        this.spawningSystem.update(deltaTime);

        // Check game over condition (chef reached end of rail)
        if (this.scene.railProgress >= 0.95) {
            this.gameOver();
            return;
        }

        // Render
        this.scene.render();
    }

    /**
     * Game over
     */
    gameOver() {
        console.log('[Game] Game Over!');
        this.stop();
        this.triggerCallback('onGameOver', this.getResults());
    }

    /**
     * Get game results
     */
    getResults() {
        const total = this.state.totalNotes || 1;
        const accuracy = ((this.state.hits.perfect + this.state.hits.good) / total) * 100;

        return {
            score: this.state.score,
            maxCombo: this.state.maxCombo,
            hits: this.state.hits,
            totalNotes: this.state.totalNotes,
            accuracy: accuracy.toFixed(1),
            grade: this.calculateGrade(accuracy)
        };
    }

    /**
     * Calculate grade based on accuracy
     */
    calculateGrade(accuracy) {
        if (accuracy >= 95) return 'S';
        if (accuracy >= 90) return 'A';
        if (accuracy >= 80) return 'B';
        if (accuracy >= 70) return 'C';
        if (accuracy >= 60) return 'D';
        return 'F';
    }

    /**
     * Register callback
     */
    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }

        this.callbacks[event].push(callback);

        return () => {
            const index = this.callbacks[event].indexOf(callback);
            if (index > -1) {
                this.callbacks[event].splice(index, 1);
            }
        };
    }

    /**
     * Trigger callback
     */
    triggerCallback(event, data) {
        const callbacks = this.callbacks[event];
        if (!callbacks) return;

        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (e) {
                console.error(`[Game] Callback error (${event}):`, e);
            }
        });
    }

    /**
     * Get game statistics
     */
    getStats() {
        return {
            state: this.state,
            rhythm: this.rhythmEngine?.getStats(),
            scene: this.scene?.getStats(),
            spawning: this.spawningSystem?.getStats(),
            input: this.inputAdapter?.getStats()
        };
    }

    /**
     * Destroy game
     */
    destroy() {
        this.stop();

        if (this.scene) this.scene.destroy();
        if (this.spawningSystem) this.spawningSystem.destroy();
        if (this.inputAdapter) this.inputAdapter.destroy();

        console.log('[Game] Destroyed');
    }
}
