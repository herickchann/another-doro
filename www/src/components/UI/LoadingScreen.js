import { UI_TIMING } from '../../utils/constants.js';

export class LoadingScreen {
    constructor() {
        this.loadingElement = null;
        this.isVisible = true;
        this.hideTimeout = null;
        this.fallbackTimeout = null;
        this.initialize();
    }

    initialize() {
        this.loadingElement = document.getElementById('loadingScreen');
        this.setupFallbackTimeout();
    }

    setupFallbackTimeout() {
        // Fallback: Force hide loading screen after 10 seconds
        this.fallbackTimeout = setTimeout(() => {
            if (this.isVisible) {
                console.warn('Loading screen timeout - forcing hide');
                this.forceHide();
            }
        }, 10000);
    }

    hide(delay = UI_TIMING.LOADING_SCREEN_DURATION) {
        if (!this.isVisible || !this.loadingElement) return;

        this.hideTimeout = setTimeout(() => {
            this.startFadeOut();
        }, delay);
    }

    startFadeOut() {
        if (!this.loadingElement) return;

        this.loadingElement.classList.add('fade-out');

        setTimeout(() => {
            this.completeHide();
        }, UI_TIMING.LOADING_SCREEN_FADE_DELAY);
    }

    completeHide() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
        this.isVisible = false;
        this.clearTimeouts();
    }

    forceHide() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
        this.isVisible = false;
        this.clearTimeouts();
    }

    show() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'flex';
            this.loadingElement.classList.remove('fade-out');
        }
        this.isVisible = true;
    }

    updateText(text) {
        if (this.loadingElement) {
            const loadingText = this.loadingElement.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = text;
            }
        }
    }

    showError(errorMessage) {
        this.updateText(errorMessage);

        if (this.loadingElement) {
            const loadingText = this.loadingElement.querySelector('.loading-text');
            if (loadingText) {
                loadingText.style.color = '#ff6b6b';
            }
        }
    }

    showSuccess(successMessage = 'Ready!') {
        this.updateText(successMessage);

        if (this.loadingElement) {
            const loadingText = this.loadingElement.querySelector('.loading-text');
            if (loadingText) {
                loadingText.style.color = '#4ecdc4';
            }
        }

        // Auto-hide after success
        setTimeout(() => {
            this.hide(500);
        }, 1000);
    }

    setProgress(percentage) {
        // If there's a progress bar in the loading screen
        const progressBar = this.loadingElement?.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }
    }

    // Loading states
    showInitializing() {
        this.updateText('Initializing AnotherDoro...');
    }

    showLoadingServices() {
        this.updateText('Loading services...');
    }

    showLoadingData() {
        this.updateText('Loading your data...');
    }

    showLoadingComponents() {
        this.updateText('Setting up components...');
    }

    showApplyingTheme() {
        this.updateText('Applying theme...');
    }

    showReady() {
        this.showSuccess('Ready to focus!');
    }

    // Animation controls
    pauseAnimation() {
        if (this.loadingElement) {
            const animations = this.loadingElement.querySelectorAll('.loading-dots span');
            animations.forEach(dot => {
                dot.style.animationPlayState = 'paused';
            });
        }
    }

    resumeAnimation() {
        if (this.loadingElement) {
            const animations = this.loadingElement.querySelectorAll('.loading-dots span');
            animations.forEach(dot => {
                dot.style.animationPlayState = 'running';
            });
        }
    }

    // Utility methods
    isLoadingVisible() {
        return this.isVisible;
    }

    getLoadingElement() {
        return this.loadingElement;
    }

    // Custom loading messages
    setCustomMessage(message, color = null) {
        this.updateText(message);

        if (color && this.loadingElement) {
            const loadingText = this.loadingElement.querySelector('.loading-text');
            if (loadingText) {
                loadingText.style.color = color;
            }
        }
    }

    // Sequential loading steps
    async showLoadingSequence(steps, stepDuration = 800) {
        for (let i = 0; i < steps.length; i++) {
            this.updateText(steps[i]);
            this.setProgress((i + 1) / steps.length * 100);

            if (i < steps.length - 1) {
                await new Promise(resolve => setTimeout(resolve, stepDuration));
            }
        }
    }

    // Cleanup
    clearTimeouts() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        if (this.fallbackTimeout) {
            clearTimeout(this.fallbackTimeout);
            this.fallbackTimeout = null;
        }
    }

    destroy() {
        this.clearTimeouts();
        this.forceHide();
        this.loadingElement = null;
    }

    // Static factory methods for common loading scenarios
    static createWithSteps(steps) {
        const loader = new LoadingScreen();
        loader.showLoadingSequence(steps);
        return loader;
    }

    static createWithCustomMessage(message, color = null) {
        const loader = new LoadingScreen();
        loader.setCustomMessage(message, color);
        return loader;
    }

    // Integration helpers
    bindToApp(app) {
        // Bind common app loading states
        if (app) {
            app.on?.('loading:services', () => this.showLoadingServices());
            app.on?.('loading:data', () => this.showLoadingData());
            app.on?.('loading:components', () => this.showLoadingComponents());
            app.on?.('loading:theme', () => this.showApplyingTheme());
            app.on?.('loading:complete', () => this.showReady());
            app.on?.('loading:error', (error) => this.showError(`Error: ${error.message}`));
        }
    }

    // Debug helpers
    debugInfo() {
        return {
            isVisible: this.isVisible,
            hasElement: !!this.loadingElement,
            hasHideTimeout: !!this.hideTimeout,
            hasFallbackTimeout: !!this.fallbackTimeout
        };
    }
} 