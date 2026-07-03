export function isMacPlatform() {
    if (typeof navigator !== 'undefined') {
        return /Mac|iPod|iPhone|iPad/.test(navigator.platform) ||
            navigator.userAgentData?.platform === 'macOS';
    }

    return typeof process !== 'undefined' && process.platform === 'darwin';
}

export const LEGACY_HOTKEYS = {
    startPause: 'Space',
    reset: 'R',
    settings: 'Comma',
    addGoal: 'G'
};

export function getDefaultHotkeys() {
    const isMac = isMacPlatform();
    const mod = isMac ? 'Cmd' : 'Ctrl';

    return {
        startPause: 'Space',
        reset: `${mod}+Shift+R`,
        settings: `${mod}+Comma`,
        addGoal: `${mod}+N`
    };
}

export function migrateHotkeys(savedHotkeys = {}) {
    const defaults = getDefaultHotkeys();
    const migrated = { ...defaults, ...savedHotkeys };

    for (const [action, legacyValue] of Object.entries(LEGACY_HOTKEYS)) {
        if (savedHotkeys[action] === legacyValue && legacyValue !== defaults[action]) {
            migrated[action] = defaults[action];
        }
    }

    return migrated;
}
