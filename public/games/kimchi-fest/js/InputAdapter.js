/**
 * InputAdapter.js
 *
 * Unified input system for rhythm game actions.
 * Handles SessionSDK sensor data and keyboard/mouse fallback.
 *
 * Features:
 * - SessionSDK sensor integration (tilt, shake, orientation)
 * - Keyboard/mouse fallback for desktop testing
 * - Configurable input thresholds
 * - Action mapping (swing, season, etc.)
 * - Input buffering and debouncing
 */

export class InputAdapter {
    constructor(config = {}) {
        this.config = {
            // Sensor thresholds
            shakeThreshold: config.shakeThreshold || 15,
            tiltThreshold: config.tiltThreshold || 30,

            // Input debouncing (ms)
            debounceTime: config.debounceTime || 100,

            // Debug mode
            debug: config.debug || false,

            ...config
        };

        // SessionSDK instance
        this.sdk = null;
        this.session = null;
        this.sensorData = new Map(); // sensorId -> latest data

        // Input state
        this.lastActionTime = 0;
        this.inputQueue = [];

        // Action callbacks
        this.actionCallbacks = {
            swing: [],
            season: [],
            tilt: [],
            shake: []
        };

        // Keyboard/mouse state
        this.keys = new Set();
        this.mouseDown = false;

        // Setup keyboard/mouse listeners
        this.setupFallbackInput();
    }

    /**
     * Initialize SessionSDK
     */
    async initializeSDK(sdkInstance) {
        this.sdk = sdkInstance;

        if (!this.sdk) {
            console.warn('[InputAdapter] SessionSDK not available, using fallback input only');
            return;
        }

        // Register SDK event listeners
        this.sdk.on('sensor-data', (event) => this.handleSensorData(event));
        this.sdk.on('sensor-connected', (event) => this.handleSensorConnected(event));
        this.sdk.on('sensor-disconnected', (event) => this.handleSensorDisconnected(event));

        console.log('[InputAdapter] SessionSDK initialized');
    }

    /**
     * Handle sensor data from SessionSDK
     */
    handleSensorData(event) {
        const detail = event?.detail || event;
        if (!detail || !detail.sensorId) return;

        const { sensorId, data } = detail;

        // Store latest sensor data
        this.sensorData.set(sensorId, data);

        // Process sensor input
        this.processSensorInput(sensorId, data);

        if (this.config.debug) {
            console.log('[InputAdapter] Sensor data:', sensorId, data);
        }
    }

    /**
     * Process sensor input and trigger actions
     */
    processSensorInput(sensorId, data) {
        const now = performance.now();

        // Debounce check
        if (now - this.lastActionTime < this.config.debounceTime) {
            return;
        }

        // Check for shake
        if (data.acceleration) {
            const accel = data.acceleration;
            const magnitude = Math.sqrt(
                accel.x * accel.x +
                accel.y * accel.y +
                accel.z * accel.z
            );

            if (magnitude > this.config.shakeThreshold) {
                this.triggerAction('shake', { sensorId, magnitude, time: now });
                this.triggerAction('swing', { sensorId, magnitude, time: now }); // Map shake to swing
                this.lastActionTime = now;
                return;
            }
        }

        // Check for tilt
        if (data.orientation) {
            const { beta, gamma } = data.orientation;

            // Forward tilt (beta) or side tilt (gamma)
            if (Math.abs(beta) > this.config.tiltThreshold ||
                Math.abs(gamma) > this.config.tiltThreshold) {
                this.triggerAction('tilt', { sensorId, beta, gamma, time: now });
            }
        }
    }

    /**
     * Handle sensor connected
     */
    handleSensorConnected(event) {
        const detail = event?.detail || event;
        console.log('[InputAdapter] Sensor connected:', detail?.sensorId);
    }

    /**
     * Handle sensor disconnected
     */
    handleSensorDisconnected(event) {
        const detail = event?.detail || event;
        const sensorId = detail?.sensorId;
        if (sensorId) {
            this.sensorData.delete(sensorId);
            console.log('[InputAdapter] Sensor disconnected:', sensorId);
        }
    }

    /**
     * Setup keyboard/mouse fallback input
     */
    setupFallbackInput() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (this.keys.has(e.code)) return; // Already pressed
            this.keys.add(e.code);

            const now = performance.now();

            // Map keys to actions
            switch (e.code) {
                case 'Space':
                case 'KeyZ':
                    this.triggerAction('swing', { source: 'keyboard', key: e.code, time: now });
                    break;
                case 'KeyX':
                case 'Enter':
                    this.triggerAction('season', { source: 'keyboard', key: e.code, time: now });
                    break;
                case 'KeyC':
                    this.triggerAction('shake', { source: 'keyboard', key: e.code, time: now });
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });

        // Mouse
        window.addEventListener('mousedown', (e) => {
            this.mouseDown = true;
            const now = performance.now();
            this.triggerAction('swing', { source: 'mouse', button: e.button, time: now });
        });

        window.addEventListener('mouseup', (e) => {
            this.mouseDown = false;
        });

        // Touch (for mobile fallback)
        window.addEventListener('touchstart', (e) => {
            const now = performance.now();
            this.triggerAction('swing', { source: 'touch', touches: e.touches.length, time: now });
        });

        console.log('[InputAdapter] Fallback input (keyboard/mouse/touch) enabled');
        console.log('[InputAdapter] Controls: Space/Z = Swing, X/Enter = Season, C = Shake, Click = Swing');
    }

    /**
     * Register an action callback
     */
    on(action, callback) {
        if (!this.actionCallbacks[action]) {
            this.actionCallbacks[action] = [];
        }

        this.actionCallbacks[action].push(callback);

        // Return unsubscribe function
        return () => {
            const index = this.actionCallbacks[action].indexOf(callback);
            if (index > -1) {
                this.actionCallbacks[action].splice(index, 1);
            }
        };
    }

    /**
     * Trigger an action callback
     */
    triggerAction(action, data = {}) {
        const callbacks = this.actionCallbacks[action];
        if (!callbacks || callbacks.length === 0) return;

        if (this.config.debug) {
            console.log(`[InputAdapter] Action triggered: ${action}`, data);
        }

        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (e) {
                console.error(`[InputAdapter] Action callback error (${action}):`, e);
            }
        });
    }

    /**
     * Get latest sensor data for a sensor ID
     */
    getSensorData(sensorId) {
        return this.sensorData.get(sensorId);
    }

    /**
     * Get all connected sensors
     */
    getConnectedSensors() {
        return Array.from(this.sensorData.keys());
    }

    /**
     * Check if any sensors are connected
     */
    hasSensors() {
        return this.sensorData.size > 0;
    }

    /**
     * Set input threshold
     */
    setThreshold(type, value) {
        if (type === 'shake') {
            this.config.shakeThreshold = value;
            console.log(`[InputAdapter] Shake threshold: ${value}`);
        } else if (type === 'tilt') {
            this.config.tiltThreshold = value;
            console.log(`[InputAdapter] Tilt threshold: ${value}`);
        }
    }

    /**
     * Set debounce time
     */
    setDebounceTime(ms) {
        this.config.debounceTime = ms;
        console.log(`[InputAdapter] Debounce time: ${ms}ms`);
    }

    /**
     * Clear all sensor data
     */
    clearSensorData() {
        this.sensorData.clear();
    }

    /**
     * Get input statistics
     */
    getStats() {
        return {
            connectedSensors: this.sensorData.size,
            sensorIds: this.getConnectedSensors(),
            shakeThreshold: this.config.shakeThreshold,
            tiltThreshold: this.config.tiltThreshold,
            debounceTime: this.config.debounceTime,
            lastActionTime: this.lastActionTime,
            hasSensors: this.hasSensors()
        };
    }

    /**
     * Destroy input adapter
     */
    destroy() {
        // Remove all listeners
        this.actionCallbacks = {
            swing: [],
            season: [],
            tilt: [],
            shake: []
        };

        this.sensorData.clear();
        this.keys.clear();

        console.log('[InputAdapter] Destroyed');
    }
}
