#!/usr/bin/env node

/**
 * Release Notes Editor
 * Simple script to help edit release notes for the next release
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📝 AnotherDoro Release Notes Editor');
console.log('===================================\n');

const releaseNotesPath = path.join(__dirname, '..', 'RELEASE_NOTES.md');

// Check if RELEASE_NOTES.md exists
if (!fs.existsSync(releaseNotesPath)) {
    console.log('❌ RELEASE_NOTES.md not found!');
    console.log('Creating a new release notes file...\n');

    const defaultContent = `# Release Notes Template

## ✨ What's New
- 🚀 Auto-update functionality for seamless updates
- 🔄 Cross-platform synchronization  
- 🎨 Enhanced user interface
- 🐛 Bug fixes and performance improvements
- 📊 Better session tracking and statistics

## 🔧 Technical Improvements
- Improved startup performance
- Enhanced error handling
- Better memory management
- Optimized build process

## 🐛 Bug Fixes
- Fixed timer accuracy issues
- Resolved notification problems
- Fixed window state persistence
- Corrected audio playback issues

## 🎯 Known Issues
- None at this time

---

**Instructions for editing:**
1. Edit this file before each release
2. The release scripts will automatically read from this file
3. Use markdown formatting for best results
4. Keep the structure consistent for professional releases`;

    fs.writeFileSync(releaseNotesPath, defaultContent);
    console.log('✅ Created RELEASE_NOTES.md with default template');
}

// Show current content
console.log('📋 Current release notes content:');
console.log('==================================');
const currentContent = fs.readFileSync(releaseNotesPath, 'utf8');
const previewContent = currentContent.split('---')[0].trim();
console.log(previewContent);
console.log('\n==================================\n');

// Get current version
const packageJson = require('../package.json');
console.log(`📦 Current version: ${packageJson.version}`);
console.log(`🔗 These notes will be used for: AnotherDoro v${packageJson.version}\n`);

// Options
console.log('🔧 Available actions:');
console.log('1. Edit release notes in your default editor');
console.log('2. Preview how the release will look');
console.log('3. Exit');

const args = process.argv.slice(2);

if (args.includes('--edit') || args.includes('-e')) {
    editReleaseNotes();
} else if (args.includes('--preview') || args.includes('-p')) {
    previewRelease();
} else {
    console.log('\n💡 Usage:');
    console.log('  npm run edit-release-notes --edit     # Edit in default editor');
    console.log('  npm run edit-release-notes --preview  # Preview release');
    console.log('  node scripts/edit-release-notes.js -e # Edit directly');
    console.log('  node scripts/edit-release-notes.js -p # Preview directly');
}

function editReleaseNotes() {
    console.log('🖊️  Opening release notes in your default editor...');

    try {
        // Try to open in VS Code first, then fall back to system default
        try {
            execSync(`code "${releaseNotesPath}"`, { stdio: 'ignore' });
            console.log('✅ Opened in VS Code');
        } catch {
            // Fall back to system default editor
            const command = process.platform === 'darwin' ? 'open' :
                process.platform === 'win32' ? 'start' : 'xdg-open';
            execSync(`${command} "${releaseNotesPath}"`, { stdio: 'ignore' });
            console.log('✅ Opened in default editor');
        }

        console.log('\n💡 Tip: After editing, run with --preview to see how it will look');

    } catch (error) {
        console.error('❌ Could not open editor automatically');
        console.log(`📁 Please manually edit: ${releaseNotesPath}`);
    }
}

function previewRelease() {
    console.log('👀 Preview of release body:');
    console.log('===========================\n');

    const { ReleaseConfig } = require('./release-config');
    const releaseConfig = new ReleaseConfig();
    const releaseBody = releaseConfig.getReleaseBody();

    console.log(releaseBody);
    console.log('\n===========================');
    console.log('✅ This is how your release will appear on GitHub');
} 