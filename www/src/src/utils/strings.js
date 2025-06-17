// UI Labels and Text
export const UI_TEXT = {
    APP_TITLE: '🍅 AnotherDoro',
    SESSION_TYPES: {
        WORK: 'Focus Time',
        SHORT_BREAK: 'Short Break',
        LONG_BREAK: 'Long Break'
    },
    BUTTONS: {
        START: 'Start',
        PAUSE: 'Pause',
        RESUME: 'Resume',
        RESET: 'Reset',
        SKIP: 'Skip',
        SAVE: 'Save',
        CANCEL: 'Cancel',
        SETTINGS: 'Settings',
        ADD_GOAL: '+ Add Goal',
        TEST_SOUND: 'Test Sound',
        CHECK_UPDATES: 'Check for Updates',
        DOWNLOAD_UPDATE: 'Download Update',
        INSTALL_NOW: 'Install Now',
        INSTALL_RESTART: 'Install & Restart',
        RESTORE_DEFAULTS: 'Restore Defaults',
        CLEAR_ALL_SESSIONS: 'Clear All Sessions',
        NOT_NOW: 'Not Now',
        LATER: 'Later',
        INSTALL: 'Install'
    },
    PLACEHOLDERS: {
        GOAL_INPUT: 'Enter your goal...',
        HOTKEY_CLICK: 'Click to set hotkey',
        HOTKEY_PRESS: 'Press key combination...'
    }
};

// Notification Messages
export const NOTIFICATIONS = {
    WORK_COMPLETE: {
        title: 'Work Session Complete!',
        getBody: (breakType) => `Time for a ${breakType}! ${breakType === 'long break' ? '🌟' : '☕'}`
    },
    BREAK_COMPLETE: {
        title: 'Break Complete!',
        body: 'Time to focus! 🎯'
    },
    LONG_BREAK_COMPLETE: {
        title: 'Long Break Complete!',
        body: 'Ready to start fresh! 🚀'
    },
    SESSION_RESET: {
        title: 'Session Reset',
        body: 'Pomodoro session has been reset to the beginning! 🔄'
    },
    WORK_SKIPPED: {
        title: 'Work Session Skipped',
        getBody: (breakType) => `Moving to ${breakType}! ${breakType === 'long break' ? '🌟' : '☕'}`
    },
    BREAK_SKIPPED: {
        title: 'Break Skipped',
        body: 'Back to work! Time to focus! 🎯'
    },
    SETTINGS_SAVED: {
        title: 'Settings Saved',
        body: 'Your preferences have been updated! ⚙️'
    },
    SETTINGS_RESET: {
        title: 'Settings Reset',
        body: 'All settings have been reset to defaults! 🔄'
    },
    SESSIONS_CLEARED: {
        title: 'Sessions Cleared',
        body: 'All session data has been reset. Ready for a fresh start! 🌟'
    },
    UPDATE_AVAILABLE: {
        title: '🚀 Update Available',
        body: 'A new version is ready to install'
    }
};

// Settings Section Headers
export const SETTINGS_SECTIONS = {
    TIMER_CONFIG: 'Timer Configuration',
    BREAK_BEHAVIOR: 'Break Behavior',
    APPEARANCE: 'Appearance',
    DATA_PRIVACY: 'Data & Privacy',
    APP_VERSION: 'App Version',
    AUDIO_SETTINGS: 'Audio Settings',
    TIMER_CONTROLS: 'Timer Controls',
    APPLICATION: 'Application'
};

// Settings Labels
export const SETTINGS_LABELS = {
    WORK_DURATION: 'Work Session (minutes)',
    SHORT_BREAK_DURATION: 'Short Break (minutes)',
    LONG_BREAK_DURATION: 'Long Break (minutes)',
    BREAK_TYPE_SHORT: 'Always use short breaks',
    BREAK_TYPE_LONG: 'Always use long breaks',
    BREAK_TYPE_ALTERNATE: 'Alternate (long break every 4th session)',
    AUTO_START_BREAKS: 'Auto-start breaks',
    AUTO_START_WORK: 'Auto-start work after breaks',
    THEME: 'Theme',
    ENABLE_SOUNDS: 'Enable Timer Sounds',
    VOLUME: 'Volume',
    NOTIFICATION_SOUND: 'Notification Sound',
    START_PAUSE_HOTKEY: 'Start/Pause Timer',
    RESET_HOTKEY: 'Reset Timer',
    SETTINGS_HOTKEY: 'Open Settings',
    ADD_GOAL_HOTKEY: 'Add Goal',
    AUTO_UPDATE_CHECK: 'Auto-check for updates',
    UPDATE_INTERVAL: 'Check interval',
    CURRENT_VERSION: 'Current Version'
};

// Theme Names
export const THEME_NAMES = {
    neon: 'Neon Vibes',
    classic: 'Classic Red',
    forest: 'Forest Green',
    sunset: 'Sunset Orange',
    ocean: 'Ocean Blue'
};

// Sound Names
export const SOUND_NAMES = {
    'timer-finish.wav': 'Classic Timer',
    'doro-sound.mp3': 'Doro Bell'
};

// Update Intervals
export const UPDATE_INTERVALS = {
    1: 'Every hour',
    6: 'Every 6 hours',
    12: 'Every 12 hours',
    24: 'Daily',
    168: 'Weekly'
};

// Tab Names
export const TAB_NAMES = {
    general: 'General',
    sound: 'Sound',
    hotkeys: 'Hotkeys'
};

// Stats Labels
export const STATS_LABELS = {
    COMPLETED: 'Completed',
    TOTAL_TIME: 'Total Time'
};

// Goals Section
export const GOALS_TEXT = {
    HEADER: 'Session Goals',
    NO_GOALS: 'Add goals to focus on during your Pomodoro sessions',
    INPUT_MAX_LENGTH: 100
};

// Confirmation Messages
export const CONFIRMATIONS = {
    CLEAR_SESSIONS: `Are you sure you want to clear all session data?

This will reset:
• Completed sessions count
• Total time spent  
• Session counter

This action cannot be undone.`,

    RESET_SETTINGS: `Reset all settings to default values?

This will reset:
• Theme to Neon Vibes
• Work duration to 25 minutes
• Short break to 5 minutes
• Long break to 15 minutes
• Auto-break settings to off

This action cannot be undone.`,

    CLEAR_SESSIONS_MOBILE: `Clear all session data?

This will reset:
• Completed sessions count
• Total time spent
• Session counter

This action cannot be undone.`
};

// Update Status Messages
export const UPDATE_STATUS = {
    CHECKING: 'Checking for updates...',
    AVAILABLE: (version) => `Update available: v${version}`,
    NOT_AVAILABLE: 'You have the latest version',
    DOWNLOADING: (percent) => `Downloading... ${Math.round(percent)}%`,
    READY: 'Update ready to install',
    INSTALLING: 'Installing update...',
    RESTARTING: 'Restarting app...'
};

// Loading Text
export const LOADING_TEXT = {
    PREPARING: 'Preparing your AnotherDoro...',
    DOWNLOADING: 'Downloading...',
    CHECKING: 'Checking...',
    INSTALLING: 'Installing...'
};

// Hotkey Instructions
export const HOTKEY_INSTRUCTIONS = {
    TOP: 'Click on any hotkey field and press your desired key combination. Supports Ctrl, Alt, Shift, Cmd modifiers.'
};

// Copyright
export const COPYRIGHT = '© 2025 AnotherByte. All rights reserved.';

// Key Mappings for Display
export const KEY_DISPLAY_MAP = {
    'Space': 'Space',
    'Enter': 'Enter',
    'Escape': 'Esc',
    'Backspace': 'Backspace',
    'Tab': 'Tab',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Comma': 'Comma'
}; 