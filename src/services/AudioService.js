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

        try {
            // Play the notification with looping
            return await this._playWithLoops();
        } catch (error) {
            console.error('Failed to play audio:', error);
            return false;
        }
    }

    async _playWithLoops() {
        const loops = AUDIO_DEFAULTS.NOTIFICATION_LOOPS;
        let success = false;

        for (let i = 0; i < loops; i++) {
            try {
                if (this.audioElement) {
                    success = await this._playAudioElement();
                } else if (this.audioContext) {
                    success = await this._playTestBeep();
                } else {
                    console.log('🔔 Timer finished! (Audio not available)');
                    return false;
                }

                // Add delay between loops (except for the last one)
                if (i < loops - 1 && success) {
                    await this._delay(AUDIO_DEFAULTS.LOOP_DELAY);
                }
            } catch (error) {
                console.error(`Failed to play audio loop ${i + 1}:`, error);
            }
        }

        return success;
    }

    async _playAudioElement() {
        try {
            // Reset audio to beginning
            this.audioElement.currentTime = 0;
            this.audioElement.volume = this.volume;

            // Attempt to play and wait for it to finish
            await this.audioElement.play();

            // Wait for the audio to finish playing
            return new Promise((resolve) => {
                const onEnded = () => {
                    this.audioElement.removeEventListener('ended', onEnded);
                    resolve(true);
                };

                const onError = () => {
                    this.audioElement.removeEventListener('error', onError);
                    this.audioElement.removeEventListener('ended', onEnded);
                    resolve(false);
                };

                this.audioElement.addEventListener('ended', onEnded, { once: true });
                this.audioElement.addEventListener('error', onError, { once: true });
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

    async _playTestBeep() {
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

            // Boost the test beep volume even more
            gainNode.gain.setValueAtTime(this.volume * 0.8, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + AUDIO_DEFAULTS.TEST_BEEP_DURATION);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + AUDIO_DEFAULTS.TEST_BEEP_DURATION);

            // Wait for the beep to finish
            await this._delay(AUDIO_DEFAULTS.TEST_BEEP_DURATION * 1000);

            return true;
        } catch (error) {
            console.error('Test beep play error:', error);
            return false;
        }
    }

    // Helper method to create delays
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async testSound(soundName = null) {
        // Use specified sound or current sound for testing
        const testSoundName = soundName || this.currentSound;

        // Temporarily switch to the test sound if different
        const originalSound = this.currentSound;
        if (testSoundName !== this.currentSound) {
            await this.changeSound(testSoundName);
        }

        // Play the test sound once without looping
        const result = await this._playSingle();

        // Restore original sound if we changed it
        if (testSoundName !== originalSound) {
            await this.changeSound(originalSound);
        }

        return result;
    }

    async testCurrentSound() {
        // Test the currently selected sound
        return await this.testSound(this.currentSound);
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