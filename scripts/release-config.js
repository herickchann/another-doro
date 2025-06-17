#!/usr/bin/env node

/**
 * Centralized Release Configuration
 * This file contains all release metadata to avoid duplication across publish scripts
 */

const packageJson = require('../package.json');
const fs = require('fs');
const path = require('path');

class ReleaseConfig {
    constructor() {
        this.owner = 'herickchann';
        this.repo = 'another-doro';
        this.version = packageJson.version;
        this.tagName = `v${this.version}`;
    }

    /**
     * Generate release name
     */
    getReleaseName() {
        return `AnotherDoro v${this.version}`;
    }

    /**
     * Read custom release notes from RELEASE_NOTES.md
     */
    getCustomReleaseNotes() {
        try {
            const releaseNotesPath = path.join(__dirname, '..', 'RELEASE_NOTES.md');
            if (fs.existsSync(releaseNotesPath)) {
                const content = fs.readFileSync(releaseNotesPath, 'utf8');
                // Remove the instructions section
                return content.split('---')[0].trim();
            }
        } catch (error) {
            console.warn('⚠️ Could not read RELEASE_NOTES.md, using default notes');
        }

        // Fallback to default notes
        return `## ✨ What's New
- 🚀 Auto-update functionality for seamless updates
- 🔄 Cross-platform synchronization
- 🎨 Enhanced user interface
- 🐛 Bug fixes and performance improvements
- 📊 Better session tracking and statistics`;
    }

    /**
     * Generate release body with dynamic content
     */
    getReleaseBody() {
        const customNotes = this.getCustomReleaseNotes();

        return `## 🍅 AnotherDoro v${this.version}

### 📱 Multi-Platform Release
This release includes builds for both desktop and mobile platforms:

- **🖥️ Desktop (macOS):** Download the \`.dmg\` file below
- **📱 Android:** Download the \`.apk\` file below

${customNotes}

### 🔧 Installation Instructions

**For macOS:**
1. Download the \`.dmg\` file
2. Open it and drag AnotherDoro to Applications
3. Launch the app from Applications

**For Android:**
1. Download the \`.apk\` file
2. Enable "Install from Unknown Sources" in Android settings
3. Install the APK file
4. Launch AnotherDoro from your app drawer

### 🔄 Auto-Updates
Desktop versions now support automatic updates! The app will notify you when new versions are available.`;
    }

    /**
     * Check if this is a prerelease version
     */
    isPrerelease() {
        return this.version.includes('beta') ||
            this.version.includes('alpha') ||
            this.version.includes('rc');
    }

    /**
     * Get all release data
     */
    getReleaseData() {
        return {
            owner: this.owner,
            repo: this.repo,
            version: this.version,
            tagName: this.tagName,
            name: this.getReleaseName(),
            body: this.getReleaseBody(),
            prerelease: this.isPrerelease()
        };
    }

    /**
     * Create a new release using GitHub API
     */
    async createRelease(octokit) {
        const releaseData = this.getReleaseData();

        console.log(`📝 Creating new release: ${releaseData.name}`);

        const { data } = await octokit.rest.repos.createRelease({
            owner: releaseData.owner,
            repo: releaseData.repo,
            tag_name: releaseData.tagName,
            name: releaseData.name,
            body: releaseData.body,
            draft: false,
            prerelease: releaseData.prerelease,
        });

        console.log(`✅ Created release: ${data.name}`);
        return data;
    }

    /**
     * Get or create a release
     */
    async getOrCreateRelease(octokit) {
        const releaseData = this.getReleaseData();

        try {
            // Try to get existing release
            const { data } = await octokit.rest.repos.getReleaseByTag({
                owner: releaseData.owner,
                repo: releaseData.repo,
                tag: releaseData.tagName,
            });

            console.log(`✅ Found existing release: ${data.name}`);
            return data;

        } catch (error) {
            if (error.status === 404) {
                // Create new release if it doesn't exist
                return await this.createRelease(octokit);
            } else {
                throw error;
            }
        }
    }
}

module.exports = { ReleaseConfig }; 