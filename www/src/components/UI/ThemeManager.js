import { Storage } from '../../utils/storage.js';
import { THEMES } from '../../utils/constants.js';

export class ThemeManager {
    constructor() {
        this.currentTheme = THEMES.NEON;
        this.observers = [];
    }

    initialize(theme = THEMES.NEON) {
        this.currentTheme = theme;
        this.applyTheme(theme);
    }

    applyTheme(themeName) {
        // Validate theme name
        if (!Object.values(THEMES).includes(themeName)) {
            console.warn(`Invalid theme: ${themeName}, falling back to ${THEMES.NEON}`);
            themeName = THEMES.NEON;
        }

        // Apply theme to document
        document.documentElement.setAttribute('data-theme', themeName);
        this.currentTheme = themeName;

        // Save to storage
        Storage.saveTheme(themeName);

        // Notify observers
        this.notifyObservers(themeName);

        // Update progress ring colors after theme change
        setTimeout(() => {
            this.updateProgressRingColors();
        }, 100);
    }

    updateProgressRingColors() {
        // Trigger progress ring color update if display component is available
        if (window.app && window.app.display && window.app.timer) {
            window.app.display.updateProgress(
                window.app.timer.state.progress,
                window.app.timer.state.sessionType
            );
        }
    }

    switchTheme(themeName) {
        if (themeName !== this.currentTheme) {
            this.applyTheme(themeName);
            return true;
        }
        return false;
    }

    toggleTheme() {
        const themes = Object.values(THEMES);
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.applyTheme(themes[nextIndex]);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getAvailableThemes() {
        return Object.entries(THEMES).map(([key, value]) => ({
            key,
            value,
            name: this.getThemeDisplayName(value),
            current: value === this.currentTheme
        }));
    }

    getThemeDisplayName(themeValue) {
        const themeNames = {
            [THEMES.NEON]: 'Neon Vibes',
            [THEMES.CLASSIC]: 'Classic Red',
            [THEMES.FOREST]: 'Forest Green',
            [THEMES.SUNSET]: 'Sunset Orange',
            [THEMES.OCEAN]: 'Ocean Blue'
        };
        return themeNames[themeValue] || themeValue;
    }

    // Observer pattern for theme changes
    addObserver(callback) {
        if (typeof callback === 'function') {
            this.observers.push(callback);
        }
    }

    removeObserver(callback) {
        this.observers = this.observers.filter(obs => obs !== callback);
    }

    notifyObservers(theme) {
        this.observers.forEach(callback => {
            try {
                callback(theme);
            } catch (error) {
                console.warn('Theme observer error:', error);
            }
        });
    }

    // CSS Custom Properties helpers
    getThemeColor(property) {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(`--color-${property}`)
            .trim();
    }

    setThemeColor(property, value) {
        document.documentElement.style.setProperty(`--color-${property}`, value);
    }

    // Theme persistence
    saveToStorage() {
        Storage.saveTheme(this.currentTheme);
    }

    loadFromStorage() {
        const savedTheme = Storage.loadTheme();
        if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
            this.applyTheme(savedTheme);
        }
    }

    // Theme preview (for settings)
    previewTheme(themeName, duration = 2000) {
        const originalTheme = this.currentTheme;
        this.applyTheme(themeName);

        // Revert after duration
        setTimeout(() => {
            this.applyTheme(originalTheme);
        }, duration);
    }

    // System theme detection
    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return THEMES.NEON; // Dark theme preference
        }
        return THEMES.CLASSIC; // Light theme preference
    }

    enableSystemThemeDetection() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            const handleSystemThemeChange = (e) => {
                const systemTheme = e.matches ? THEMES.NEON : THEMES.CLASSIC;
                this.applyTheme(systemTheme);
            };

            mediaQuery.addListener(handleSystemThemeChange);

            // Apply initial system theme
            handleSystemThemeChange(mediaQuery);

            return () => mediaQuery.removeListener(handleSystemThemeChange);
        }
        return null;
    }

    // Theme export/import
    exportThemeSettings() {
        return {
            currentTheme: this.currentTheme,
            availableThemes: this.getAvailableThemes(),
            exportDate: new Date().toISOString()
        };
    }

    importThemeSettings(themeData) {
        if (themeData && themeData.currentTheme) {
            this.applyTheme(themeData.currentTheme);
            return true;
        }
        return false;
    }

    // Accessibility helpers
    getContrastRatio() {
        // Simple contrast calculation for accessibility
        const bgColor = this.getThemeColor('background');
        const textColor = this.getThemeColor('text');

        // This would need proper color parsing and contrast calculation
        // For now, return a placeholder
        return 'Good'; // Placeholder
    }

    isHighContrastMode() {
        return window.matchMedia &&
            window.matchMedia('(prefers-contrast: high)').matches;
    }

    destroy() {
        // Clear observers
        this.observers = [];

        // Reset to default theme if needed
        if (this.currentTheme !== THEMES.NEON) {
            this.applyTheme(THEMES.NEON);
        }
    }
} 