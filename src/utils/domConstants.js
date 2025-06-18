// DOM Element ID Constants
// This file centralizes all DOM element IDs to prevent typos and improve maintainability

export const DOM_IDS = {
    // Timer Elements
    TIMER_DISPLAY: 'timerDisplay',
    TIMER_TIME: 'timerTime',
    SESSION_TYPE: 'sessionType',
    SESSION_NUMBER: 'sessionNumber',
    PROGRESS_CIRCLE: 'progressCircle',
    PROGRESS_CIRCLE_BG: 'progressCircleBg',

    // Control Buttons
    START_PAUSE_BTN: 'startPauseBtn',
    RESET_BTN: 'resetBtn',
    SETTINGS_BTN: 'settingsBtn',

    // Settings Modal
    SETTINGS_MODAL: 'settingsModal',
    CLOSE_SETTINGS_BTN: 'closeSettings',
    SAVE_SETTINGS_BTN: 'saveSettings',
    RESTORE_DEFAULTS_BTN: 'restoreDefaults',

    // Settings Inputs
    WORK_DURATION_INPUT: 'workDurationInput',
    SHORT_BREAK_DURATION_INPUT: 'shortBreakDurationInput',
    LONG_BREAK_DURATION_INPUT: 'longBreakDurationInput',
    AUTO_BREAK: 'autoBreak',
    AUTO_WORK: 'autoWork',
    THEME_SELECTOR: 'themeSelector',

    // Audio Settings
    SOUND_ENABLED: 'soundEnabled',
    VOLUME_SLIDER: 'volumeSlider',
    VOLUME_VALUE: 'volumeValue',
    SOUND_SELECTOR: 'soundSelector',
    TEST_SOUND_BTN: 'testSoundBtn',

    // Update Settings
    AUTO_UPDATE_CHECK: 'autoUpdateCheck',
    UPDATE_CHECK_INTERVAL: 'updateCheckInterval',
    CHECK_UPDATES_BTN: 'checkUpdatesBtn',
    CURRENT_VERSION: 'currentVersion',

    // Hotkey Settings
    HOTKEY_START_PAUSE: 'hotkeyStartPause',
    HOTKEY_RESET: 'hotkeyReset',
    HOTKEY_SETTINGS: 'hotkeySettings',
    HOTKEY_ADD_GOAL: 'hotkeyAddGoal',
    CLEAR_START_PAUSE: 'clearStartPause',
    CLEAR_RESET: 'clearReset',
    CLEAR_SETTINGS: 'clearSettings',
    CLEAR_ADD_GOAL: 'clearAddGoal',

    // Goals Section
    GOALS_SECTION: 'goalsSection',
    GOALS_LIST: 'goalsList',
    NO_GOALS_MESSAGE: 'noGoalsMessage',
    ADD_GOAL_BTN: 'addGoalBtn',
    ADD_GOAL_FORM: 'addGoalForm',
    GOAL_INPUT: 'goalInput',
    SAVE_GOAL_BTN: 'saveGoalBtn',
    CANCEL_GOAL_BTN: 'cancelGoalBtn',
    CLEAR_COMPLETED_GOALS_BTN: 'clearCompletedGoalsBtn',
    CLEAR_ALL_GOALS_BTN: 'clearAllGoalsBtn',

    // Stats Section
    STATS_SECTION: 'statsSection',
    SESSIONS_TODAY: 'sessionsToday',
    TOTAL_SESSIONS: 'totalSessions',
    PRODUCTIVITY_SCORE: 'productivityScore',
    SHOW_EXTENDED_STATS: 'showExtendedStats',
    EXTENDED_STATS: 'extendedStats',

    // Loading Screen
    LOADING_SCREEN: 'loadingScreen',
    LOADING_TEXT: 'loadingText',
    LOADING_PROGRESS: 'loadingProgress',

    // Settings Tabs
    TAB_TIMER: 'tabTimer',
    TAB_AUDIO: 'tabAudio',
    TAB_HOTKEYS: 'tabHotkeys',
    TAB_UPDATES: 'tabUpdates',
    TAB_CONTENT_TIMER: 'tabContentTimer',
    TAB_CONTENT_AUDIO: 'tabContentAudio',
    TAB_CONTENT_HOTKEYS: 'tabContentHotkeys',
    TAB_CONTENT_UPDATES: 'tabContentUpdates',

    // Other Buttons
    CLEAR_ALL_SESSIONS: 'clearAllSessions',
    DEVTOOLS_TOGGLE: 'devtoolsToggle'
};

// CSS Class Constants
export const CSS_CLASSES = {
    // Goal Item Classes
    GOAL_ITEM: 'goal-item',
    GOAL_CHECKBOX: 'goal-checkbox',
    GOAL_TEXT: 'goal-text',
    GOAL_DELETE: 'goal-delete',
    COMPLETED: 'completed',

    // Button Classes
    BTN: 'btn',
    BTN_PRIMARY: 'btn-primary',
    BTN_SECONDARY: 'btn-secondary',
    BTN_DANGER: 'btn-danger',
    BTN_SMALL: 'btn-small',

    // Modal Classes
    MODAL_OVERLAY: 'modal-overlay',
    MODAL: 'modal',
    SHOW: 'show',

    // Tab Classes
    TAB_BUTTON: 'tab-button',
    TAB_CONTENT: 'tab-content',
    ACTIVE: 'active',

    // Loading Classes
    LOADING_SCREEN: 'loading-screen',
    FADE_OUT: 'fade-out',

    // Recording Class
    RECORDING: 'recording'
};

// Helper function to safely get element by ID
export function getElementById(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with ID '${id}' not found`);
    }
    return element;
}

// Helper function to safely get element by ID with error throwing
export function getRequiredElementById(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Required element with ID '${id}' not found`);
    }
    return element;
} 