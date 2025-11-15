/**
 * RhythmEngine.js
 *
 * Core rhythm system for beat-based gameplay.
 * Handles BPM scheduling, beat queues, timing judgment, and note spawning.
 *
 * Features:
 * - High-precision timing using performance.now()
 * - Configurable timing windows (Perfect/Good/Miss)
 * - Beat callbacks for synchronized gameplay events
 * - Offset compensation for audio latency
 */

export class RhythmEngine {
    constructor(config = {}) {
        this.bpm = config.bpm || 120;
        this.beatsPerMeasure = config.beatsPerMeasure || 4;
        this.offset = config.offset || 0; // ms offset for audio sync

        // Timing windows (in seconds)
        this.timingWindows = config.timingWindows || {
            perfect: 0.05,  // ±50ms
            good: 0.15,     // ±150ms
            miss: 0.3       // ±300ms
        };

        // State
        this.isPlaying = false;
        this.startTime = 0;
        this.currentBeat = 0;
        this.currentMeasure = 0;

        // Beat callbacks
        this.beatCallbacks = [];
        this.measureCallbacks = [];

        // Scheduled notes/events
        this.noteQueue = [];
        this.nextNoteId = 0;

        // Performance tracking
        this.lastFrameTime = 0;
        this.deltaTime = 0;

        // Audio context for precise timing (optional)
        this.audioContext = null;
        this.audioStartTime = 0;
    }

    /**
     * Calculate beat duration in milliseconds
     */
    get beatDuration() {
        return (60 / this.bpm) * 1000;
    }

    /**
     * Calculate beat duration in seconds
     */
    get beatDurationSec() {
        return 60 / this.bpm;
    }

    /**
     * Get current time in milliseconds (with offset)
     */
    getCurrentTime() {
        if (this.audioContext && this.audioContext.state === 'running') {
            return (this.audioContext.currentTime - this.audioStartTime) * 1000 + this.offset;
        }
        return performance.now() - this.startTime + this.offset;
    }

    /**
     * Get current time in seconds
     */
    getCurrentTimeSec() {
        return this.getCurrentTime() / 1000;
    }

    /**
     * Start the rhythm engine
     */
    start() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.startTime = performance.now();
        this.currentBeat = 0;
        this.currentMeasure = 0;
        this.lastFrameTime = this.startTime;

        // Initialize audio context if available
        if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
            try {
                this.audioContext = new (AudioContext || webkitAudioContext)();
                this.audioStartTime = this.audioContext.currentTime;
            } catch (e) {
                console.warn('[RhythmEngine] AudioContext not available, using performance.now()');
            }
        }

        console.log(`[RhythmEngine] Started at BPM ${this.bpm}, offset ${this.offset}ms`);
    }

    /**
     * Stop the rhythm engine
     */
    stop() {
        this.isPlaying = false;
        this.noteQueue = [];
        console.log('[RhythmEngine] Stopped');
    }

    /**
     * Pause the rhythm engine
     */
    pause() {
        this.isPlaying = false;
    }

    /**
     * Resume the rhythm engine
     */
    resume() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.startTime = performance.now() - (this.currentBeat * this.beatDuration);
    }

    /**
     * Update the rhythm engine (call every frame)
     */
    update() {
        if (!this.isPlaying) return;

        const now = performance.now();
        this.deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        const currentTime = this.getCurrentTime();
        const currentTimeSec = currentTime / 1000;

        // Calculate current beat
        const newBeat = Math.floor(currentTime / this.beatDuration);
        const newMeasure = Math.floor(newBeat / this.beatsPerMeasure);

        // Trigger beat callbacks
        if (newBeat > this.currentBeat) {
            for (let beat = this.currentBeat + 1; beat <= newBeat; beat++) {
                this.triggerBeatCallbacks(beat, currentTimeSec);
            }
        }

        // Trigger measure callbacks
        if (newMeasure > this.currentMeasure) {
            for (let measure = this.currentMeasure + 1; measure <= newMeasure; measure++) {
                this.triggerMeasureCallbacks(measure, currentTimeSec);
            }
        }

        this.currentBeat = newBeat;
        this.currentMeasure = newMeasure;

        // Update note queue
        this.updateNoteQueue(currentTimeSec);
    }

    /**
     * Trigger beat callbacks
     */
    triggerBeatCallbacks(beat, time) {
        this.beatCallbacks.forEach(callback => {
            try {
                callback(beat, time);
            } catch (e) {
                console.error('[RhythmEngine] Beat callback error:', e);
            }
        });
    }

    /**
     * Trigger measure callbacks
     */
    triggerMeasureCallbacks(measure, time) {
        this.measureCallbacks.forEach(callback => {
            try {
                callback(measure, time);
            } catch (e) {
                console.error('[RhythmEngine] Measure callback error:', e);
            }
        });
    }

    /**
     * Register a callback for every beat
     */
    onBeat(callback) {
        this.beatCallbacks.push(callback);
        return () => {
            const index = this.beatCallbacks.indexOf(callback);
            if (index > -1) this.beatCallbacks.splice(index, 1);
        };
    }

    /**
     * Register a callback for every measure
     */
    onMeasure(callback) {
        this.measureCallbacks.push(callback);
        return () => {
            const index = this.measureCallbacks.indexOf(callback);
            if (index > -1) this.measureCallbacks.splice(index, 1);
        };
    }

    /**
     * Schedule a note/event at a specific beat
     */
    scheduleNote(beat, data = {}) {
        const noteTime = (beat * this.beatDuration) / 1000; // in seconds
        const note = {
            id: this.nextNoteId++,
            beat,
            time: noteTime,
            data,
            triggered: false,
            missed: false
        };

        this.noteQueue.push(note);
        this.noteQueue.sort((a, b) => a.time - b.time);

        return note.id;
    }

    /**
     * Schedule a note at a specific time (seconds)
     */
    scheduleNoteAtTime(time, data = {}) {
        const beat = Math.round((time * 1000) / this.beatDuration);
        return this.scheduleNote(beat, data);
    }

    /**
     * Update note queue (check for triggered/missed notes)
     */
    updateNoteQueue(currentTime) {
        this.noteQueue = this.noteQueue.filter(note => {
            if (note.triggered || note.missed) {
                return false; // Remove from queue
            }

            // Check if note should be auto-triggered (e.g., for spawning)
            if (note.data.autoTrigger && currentTime >= note.time) {
                note.triggered = true;
                if (note.data.onTrigger) {
                    note.data.onTrigger(note);
                }
                return false;
            }

            // Check if note is missed (past the miss window)
            if (currentTime > note.time + this.timingWindows.miss) {
                note.missed = true;
                if (note.data.onMiss) {
                    note.data.onMiss(note);
                }
                return false;
            }

            return true; // Keep in queue
        });
    }

    /**
     * Judge timing of a player action
     * @param {number} actionTime - Time when player pressed/acted (seconds)
     * @param {number} targetTime - Target beat time (seconds)
     * @returns {string} 'perfect', 'good', 'miss', or null
     */
    judgeTimingAtTime(actionTime, targetTime) {
        const diff = Math.abs(actionTime - targetTime);

        if (diff <= this.timingWindows.perfect) {
            return 'perfect';
        } else if (diff <= this.timingWindows.good) {
            return 'good';
        } else if (diff <= this.timingWindows.miss) {
            return 'miss';
        }

        return null; // Too far from any beat
    }

    /**
     * Judge timing of a player action against the closest note
     * @param {number} actionTime - Time when player acted (seconds)
     * @returns {object} { judgment: 'perfect'|'good'|'miss', note, timeDiff }
     */
    judgeAction(actionTime) {
        if (this.noteQueue.length === 0) {
            return { judgment: null, note: null, timeDiff: Infinity };
        }

        // Find closest note
        let closestNote = null;
        let closestDiff = Infinity;

        for (const note of this.noteQueue) {
            if (note.triggered || note.missed) continue;

            const diff = Math.abs(actionTime - note.time);
            if (diff < closestDiff) {
                closestDiff = diff;
                closestNote = note;
            }
        }

        if (!closestNote) {
            return { judgment: null, note: null, timeDiff: Infinity };
        }

        const judgment = this.judgeTimingAtTime(actionTime, closestNote.time);

        if (judgment && judgment !== 'miss') {
            closestNote.triggered = true;
            if (closestNote.data.onHit) {
                closestNote.data.onHit(closestNote, judgment);
            }
        }

        return {
            judgment,
            note: closestNote,
            timeDiff: closestDiff
        };
    }

    /**
     * Get the next upcoming note
     */
    getNextNote() {
        return this.noteQueue.find(note => !note.triggered && !note.missed);
    }

    /**
     * Get all active notes within a time range
     */
    getNotesInRange(startTime, endTime) {
        return this.noteQueue.filter(note => {
            return !note.triggered && !note.missed && note.time >= startTime && note.time <= endTime;
        });
    }

    /**
     * Clear all scheduled notes
     */
    clearNotes() {
        this.noteQueue = [];
    }

    /**
     * Remove a specific note by ID
     */
    removeNote(noteId) {
        this.noteQueue = this.noteQueue.filter(note => note.id !== noteId);
    }

    /**
     * Change BPM dynamically
     */
    setBPM(newBPM) {
        console.log(`[RhythmEngine] BPM changed: ${this.bpm} → ${newBPM}`);
        this.bpm = newBPM;
    }

    /**
     * Adjust offset for audio sync
     */
    setOffset(offsetMs) {
        console.log(`[RhythmEngine] Offset changed: ${this.offset}ms → ${offsetMs}ms`);
        this.offset = offsetMs;
    }

    /**
     * Get timing statistics for debugging
     */
    getStats() {
        return {
            bpm: this.bpm,
            currentBeat: this.currentBeat,
            currentMeasure: this.currentMeasure,
            currentTime: this.getCurrentTimeSec(),
            noteQueueSize: this.noteQueue.length,
            nextNote: this.getNextNote(),
            beatDuration: this.beatDurationSec,
            isPlaying: this.isPlaying
        };
    }
}
