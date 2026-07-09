// App Metadata
export const APP_VERSION = '1.0.12';

// Timer Configuration
export const TIMER_DEFAULTS = {
    WORK_DURATION: 25, // minutes
    SHORT_BREAK_DURATION: 5, // minutes  
    LONG_BREAK_DURATION: 15, // minutes
    POMODORO_CYCLE_LENGTH: 4, // sessions before long break
    AUTO_START_DELAY: 2000, // milliseconds
    TICK_INTERVAL: 1000, // milliseconds
};

export const DURATION_LIMITS = {
    work: { min: 1, max: 60 },
    shortBreak: { min: 1, max: 30 },
    longBreak: { min: 1, max: 60 }
};

export const DURATION_ADJUST = {
    STEP_MINUTES: 1,
    STEP_MINUTES_LARGE: 5
};

// Session Types
export const SESSION_TYPES = {
    WORK: 'work',
    SHORT_BREAK: 'shortBreak',
    LONG_BREAK: 'longBreak'
};

// Break Types
export const BREAK_TYPES = {
    NORMAL: 'normal',
    SHORT: 'short',
    LONG: 'long'
};

// Themes
export const THEMES = {
    NEON: 'neon',
    CLASSIC: 'classic',
    FOREST: 'forest',
    SUNSET: 'sunset',
    OCEAN: 'ocean'
};

import { getDefaultHotkeys } from './platformHotkeys.js';

// Default Hotkeys (platform-aware: Cmd on Mac, Ctrl on Windows/Linux)
export const DEFAULT_HOTKEYS = getDefaultHotkeys();

// Audio Settings
export const AUDIO_DEFAULTS = {
    ENABLED: true,
    VOLUME: 1.0, // Boosted to maximum (100%) for loudest notifications
    DEFAULT_SOUND: 'timer-finish.wav',
    TEST_BEEP_FREQUENCY: 800,
    TEST_BEEP_DURATION: 0.5,
    NOTIFICATION_LOOPS: 2, // Play notification twice
    LOOP_DELAY: 500 // 500ms delay between loops
};

// Auto-update Settings
export const UPDATE_DEFAULTS = {
    AUTO_CHECK: true,
    CHECK_INTERVAL_HOURS: 24,
    PERIODIC_CHECK_INTERVAL_HOURS: 4,
    STARTUP_CHECK_DELAY: 10000, // 10 seconds
    MANUAL_CHECK_TIMEOUT: 15000, // 15 seconds
    DOWNLOAD_TIMEOUT: 300000 // 5 minutes
};

// Storage Keys
export const STORAGE_KEYS = {
    SETTINGS: 'pomodoroSettings',
    STATS: 'pomodoroStats',
    GOALS: 'pomodoroGoals',
    THEME: 'pomodoroTheme',
    SESSION_HISTORY: 'pomodoroSessionHistory',
    WINDOW_STATE: 'manual-window-state.json'
};

export const SESSION_HISTORY_LIMIT = 200;

// Window Configuration
export const WINDOW_CONFIG = {
    DEFAULT_WIDTH: 440,
    DEFAULT_HEIGHT: 680,
    MIN_WIDTH: 380,
    MIN_HEIGHT: 480,
    BACKGROUND_COLOR: '#0f0f0f'
};

// Progress Ring Configuration
export const PROGRESS_RING = {
    WIDTH: 250,
    HEIGHT: 250,
    RADIUS: 117,
    STROKE_WIDTH: 8
};

// UI Timeouts and Delays
export const UI_TIMING = {
    LOADING_SCREEN_DURATION: 1500,
    LOADING_SCREEN_FADE_DELAY: 800,
    ANIMATION_DURATION: 300,
    SCROLLBAR_HIDE_DELAY: 1500,
    MOUSE_LEAVE_SCROLLBAR_DELAY: 500,
    SAVE_DEBOUNCE_DELAY: 500,
    HOTKEY_RECORDING_TIMEOUT: 10000,
    MODAL_REFLOW_DELAY: 10
};

// File Paths
export const ASSETS = {
    ICON: 'assets/icon.png',
    TRAY_ICON: 'assets/tray-icon.png',
    SOUNDS: {
        CLASSIC_TIMER: 'assets/timer-finish.wav',
        DORO_BELL: 'assets/doro-sound.mp3'
    }
};

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK_FAILED: 'Network connection failed - please check your internet connection',
    GITHUB_UNAVAILABLE: 'GitHub servers are temporarily unavailable - please try again later',
    REQUEST_TIMEOUT: 'Request timed out - please try again',
    UPDATE_CHECK_FAILED: 'Unable to check for updates - please try again later',
    DOWNLOAD_FAILED: 'Download failed - please try again later',
    INSTALL_FAILED: 'Installation failed - please try downloading the update again',
    AUDIO_PLAY_FAILED: 'Audio play failed (user interaction required)',
    AUDIO_LOAD_FAILED: 'Failed to load audio',
    DEVTOOLS_FAILED: 'Failed to toggle DevTools',
    UPDATE_NOT_SUPPORTED: 'Updates not available in this environment'
};

// Environment Types
export const ENVIRONMENTS = {
    ELECTRON: 'electron',
    WEB: 'web',
    MOBILE: 'mobile',
    DEVELOPMENT: 'development'
}; 