import { Environment } from '../utils/environment.js';
import { AUDIO_DEFAULTS, ASSETS, ERROR_MESSAGES } from '../utils/constants.js';

class AudioServiceClass {
    constructor() {
        this.audioElement = null;
        this.audioContext = null;
        this.enabled = AUDIO_DEFAULTS.ENABLED;
        this.volume = AUDIO_DEFAULTS.VOLUME;
        this.currentSound = AUDIO_DEFAULTS.DEFAULT_SOUND;
        this.isInitialized = false;
        this.isPlaying = false;
        this.isTestPlaying = false;
        this._playAbortController = null;
        this._testAbortController = null;
        this._activeOscillator = null;
        this._testOscillator = null;
        this.testAudioElement = null;
        this._stopListeners = new Set();
    }

    async initialize(settings = {}) {
        this.enabled = settings.soundEnabled ?? AUDIO_DEFAULTS.ENABLED;
        this.volume = settings.volume ?? AUDIO_DEFAULTS.VOLUME;
        this.currentSound = settings.currentSound ?? AUDIO_DEFAULTS.DEFAULT_SOUND;

        if (this.enabled && Environment.canPlayAudio()) {
            await this._initializeAudio();
        }

        this.isInitialized = true;
    }

    async _initializeAudio() {
        // Try to load audio element first (more reliable)
        if (Environment.capabilities.hasAudioElement) {
            try {
                await this._initializeAudioElement();
                return;
            } catch (error) {
                console.warn('Failed to initialize audio element:', error);
            }
        }

        // Fallback to Web Audio API
        if (Environment.capabilities.hasAudioContext) {
            try {
                this._initializeAudioContext();
            } catch (error) {
                console.warn('Failed to initialize audio context:', error);
            }
        }
    }

    async _initializeAudioElement() {
        try {
            this.audioElement = new Audio(this._getAudioPath(this.currentSound));
            this.audioElement.preload = 'auto';
            this.audioElement.volume = this.volume;

            // Test if audio can be loaded
            return new Promise((resolve, reject) => {
                this.audioElement.addEventListener('canplaythrough', resolve, { once: true });
                this.audioElement.addEventListener('error', reject, { once: true });

                // Timeout after 5 seconds
                setTimeout(() => reject(new Error('Audio load timeout')), 5000);
            });
        } catch (error) {
            console.error('Failed to initialize audio element:', error);
            throw error;
        }
    }

    _initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
            throw error;
        }
    }

    _getAudioPath(soundName) {
        return `${ASSETS.SOUNDS.CLASSIC_TIMER}`.replace('timer-finish.wav', soundName);
    }

    async play() {
        if (!this.enabled || !this.isInitialized) {
            return false;
        }

        this._playAbortController = new AbortController();
        this.isPlaying = true;

        try {
            return await this._playWithLoops(this._playAbortController.signal);
        } catch (error) {
            console.error('Failed to play audio:', error);
            return false;
        } finally {
            this.isPlaying = false;
            this._playAbortController = null;
        }
    }

    stop() {
        if (this._playAbortController) {
            this._playAbortController.abort();
        }

        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
        }

        if (this._activeOscillator) {
            try {
                this._activeOscillator.stop();
            } catch {
                // Oscillator may already be stopped
            }
            this._activeOscillator = null;
        }

        this.isPlaying = false;
        this._notifyStopListeners();
    }

    onStop(callback) {
        this._stopListeners.add(callback);
        return () => this._stopListeners.delete(callback);
    }

    _notifyStopListeners() {
        this._stopListeners.forEach((callback) => {
            try {
                callback();
            } catch (error) {
                console.error('Audio stop listener failed:', error);
            }
        });
    }

    async _playWithLoops(signal) {
        const loops = AUDIO_DEFAULTS.NOTIFICATION_LOOPS;
        let success = false;

        for (let i = 0; i < loops; i++) {
            if (signal?.aborted) {
                break;
            }

            try {
                if (this.audioElement) {
                    success = await this._playAudioElement(signal);
                } else if (this.audioContext) {
                    success = await this._playTestBeep(signal);
                } else {
                    console.log('🔔 Timer finished! (Audio not available)');
                    return false;
                }

                if (signal?.aborted) {
                    break;
                }

                if (i < loops - 1 && success) {
                    await this._delay(AUDIO_DEFAULTS.LOOP_DELAY, signal);
                }
            } catch (error) {
                console.error(`Failed to play audio loop ${i + 1}:`, error);
            }
        }

        return success;
    }

    async _playAudioElement(signal) {
        try {
            this.audioElement.currentTime = 0;
            this.audioElement.volume = this.volume;

            await this.audioElement.play();

            return new Promise((resolve) => {
                const cleanup = () => {
                    this.audioElement.removeEventListener('ended', onEnded);
                    this.audioElement.removeEventListener('error', onError);
                    signal?.removeEventListener('abort', onAbort);
                };

                const onEnded = () => {
                    cleanup();
                    resolve(true);
                };

                const onError = () => {
                    cleanup();
                    resolve(false);
                };

                const onAbort = () => {
                    this.audioElement.pause();
                    this.audioElement.currentTime = 0;
                    cleanup();
                    resolve(false);
                };

                this.audioElement.addEventListener('ended', onEnded, { once: true });
                this.audioElement.addEventListener('error', onError, { once: true });
                signal?.addEventListener('abort', onAbort, { once: true });
            });
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                console.log(ERROR_MESSAGES.AUDIO_PLAY_FAILED);
            } else {
                console.error('Audio element play error:', error);
            }
            return false;
        }
    }

    async _playTestBeep(signal) {
        try {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            this._activeOscillator = oscillator;

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = AUDIO_DEFAULTS.TEST_BEEP_FREQUENCY;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(this.volume * 0.8, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + AUDIO_DEFAULTS.TEST_BEEP_DURATION);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + AUDIO_DEFAULTS.TEST_BEEP_DURATION);

            await this._delay(AUDIO_DEFAULTS.TEST_BEEP_DURATION * 1000, signal);
            this._activeOscillator = null;

            return !signal?.aborted;
        } catch (error) {
            console.error('Test beep play error:', error);
            this._activeOscillator = null;
            return false;
        }
    }

    _delay(ms, signal) {
        return new Promise((resolve) => {
            if (signal?.aborted) {
                resolve();
                return;
            }

            const timeout = setTimeout(resolve, ms);
            signal?.addEventListener('abort', () => {
                clearTimeout(timeout);
                resolve();
            }, { once: true });
        });
    }

    async testSound(soundName = null) {
        return await this.playTestSound(soundName || this.currentSound);
    }

    async testCurrentSound() {
        return await this.playTestSound(this.currentSound);
    }

    async playTestSound(soundName) {
        if (!Environment.canPlayAudio()) {
            return false;
        }

        this.stopTestSound();

        this._testAbortController = new AbortController();
        this.isTestPlaying = true;
        const signal = this._testAbortController.signal;

        try {
            if (Environment.capabilities.hasAudioElement) {
                return await this._playTestAudioElement(soundName, signal);
            }

            if (Environment.capabilities.hasAudioContext) {
                if (!this.audioContext) {
                    this._initializeAudioContext();
                }
                return await this._playTestBeepPreview(signal);
            }

            console.log('🔔 Test sound! (Audio not available)');
            return false;
        } catch (error) {
            console.error('Failed to play test sound:', error);
            return false;
        } finally {
            this.isTestPlaying = false;
            this._testAbortController = null;
        }
    }

    stopTestSound() {
        if (this._testAbortController) {
            this._testAbortController.abort();
        }

        if (this.testAudioElement) {
            this.testAudioElement.pause();
            this.testAudioElement.currentTime = 0;
        }

        if (this._testOscillator) {
            try {
                this._testOscillator.stop();
            } catch {
                // Oscillator may already be stopped
            }
            this._testOscillator = null;
        }

        this.isTestPlaying = false;
    }

    async _playTestAudioElement(soundName, signal) {
        if (!this.testAudioElement) {
            this.testAudioElement = new Audio();
        }

        this.testAudioElement.volume = this.volume;
        this.testAudioElement.src = this._getAudioPath(soundName);
        this.testAudioElement.currentTime = 0;

        await this.testAudioElement.play();

        return new Promise((resolve) => {
            const cleanup = () => {
                this.testAudioElement.removeEventListener('ended', onEnded);
                this.testAudioElement.removeEventListener('error', onError);
                signal.removeEventListener('abort', onAbort);
            };

            const onEnded = () => {
                cleanup();
                resolve(true);
            };

            const onError = () => {
                cleanup();
                resolve(false);
            };

            const onAbort = () => {
                this.testAudioElement.pause();
                this.testAudioElement.currentTime = 0;
                cleanup();
                resolve(false);
            };

            this.testAudioElement.addEventListener('ended', onEnded, { once: true });
            this.testAudioElement.addEventListener('error', onError, { once: true });
            signal.addEventListener('abort', onAbort, { once: true });
        });
    }

    async _playTestBeepPreview(signal) {
        try {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            this._testOscillator = oscillator;

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = AUDIO_DEFAULTS.TEST_BEEP_FREQUENCY;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(this.volume * 0.8, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                this.audioContext.currentTime + AUDIO_DEFAULTS.TEST_BEEP_DURATION
            );

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + AUDIO_DEFAULTS.TEST_BEEP_DURATION);

            await this._delay(AUDIO_DEFAULTS.TEST_BEEP_DURATION * 1000, signal);
            this._testOscillator = null;

            return !signal.aborted;
        } catch (error) {
            console.error('Test beep preview error:', error);
            this._testOscillator = null;
            return false;
        }
    }

    async _playSingle() {
        if (!this.enabled || !this.isInitialized) {
            return false;
        }

        try {
            if (this.audioElement) {
                return await this._playAudioElementSingle();
            } else if (this.audioContext) {
                return await this._playTestBeepSingle();
            } else {
                console.log('🔔 Test sound! (Audio not available)');
                return false;
            }
        } catch (error) {
            console.error('Failed to play test sound:', error);
            return false;
        }
    }

    async _playAudioElementSingle() {
        try {
            // Reset audio to beginning
            this.audioElement.currentTime = 0;
            this.audioElement.volume = this.volume;

            // Attempt to play (no waiting for end)
            await this.audioElement.play();
            return true;
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                console.log(ERROR_MESSAGES.AUDIO_PLAY_FAILED);
            } else {
                console.error('Audio element play error:', error);
            }
            return false;
        }
    }

    async _playTestBeepSingle() {
        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = AUDIO_DEFAULTS.TEST_BEEP_FREQUENCY;
            oscillator.type = 'sine';

            // Boost the test beep volume
            gainNode.gain.setValueAtTime(this.volume * 0.8, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + AUDIO_DEFAULTS.TEST_BEEP_DURATION);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + AUDIO_DEFAULTS.TEST_BEEP_DURATION);

            return true;
        } catch (error) {
            console.error('Test beep play error:', error);
            return false;
        }
    }

    async updateSettings(settings) {
        const oldEnabled = this.enabled;
        const oldSound = this.currentSound;

        this.enabled = settings.soundEnabled ?? this.enabled;
        this.volume = settings.volume ?? this.volume;
        this.currentSound = settings.currentSound ?? this.currentSound;

        // Reinitialize if settings changed significantly
        if ((this.enabled && !oldEnabled) || (this.currentSound !== oldSound)) {
            await this._initializeAudio();
        }

        // Update existing audio element volume
        if (this.audioElement) {
            this.audioElement.volume = this.volume;
        }
    }

    async changeSound(soundName) {
        this.currentSound = soundName;
        if (this.enabled && Environment.capabilities.hasAudioElement) {
            await this._initializeAudioElement();
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.audioElement) {
            this.audioElement.volume = this.volume;
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled && this.audioElement) {
            this.audioElement.pause();
        }
    }

    // Cleanup method
    destroy() {
        this.stopTestSound();

        if (this.testAudioElement) {
            this.testAudioElement.pause();
            this.testAudioElement = null;
        }

        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.isInitialized = false;
    }

    // Status methods
    isSupported() {
        return Environment.canPlayAudio();
    }

    getStatus() {
        return {
            supported: this.isSupported(),
            initialized: this.isInitialized,
            enabled: this.enabled,
            volume: this.volume,
            currentSound: this.currentSound,
            hasAudioElement: !!this.audioElement,
            hasAudioContext: !!this.audioContext,
            audioContextState: this.audioContext?.state || 'none'
        };
    }

    getAvailableSounds() {
        return [
            { value: 'timer-finish.wav', label: 'Classic Timer' },
            { value: 'doro-sound.mp3', label: 'Doro Bell' }
        ];
    }
}

// Create singleton instance
export const AudioService = new AudioServiceClass(); 