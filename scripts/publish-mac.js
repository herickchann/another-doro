#!/usr/bin/env node

const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');
const packageJson = require('../package.json');

async function publishMacOS() {
    // Check for GitHub token
    const token = process.env.GH_TOKEN;
    if (!token) {
        console.error('❌ GH_TOKEN environment variable is required');
        process.exit(1);
    }

    // Initialize Octokit
    const octokit = new Octokit({
        auth: token,
    });

    const owner = 'herickchann';
    const repo = 'another-doro';
    const version = packageJson.version;
    const tagName = `v${version}`;
    const versionDir = path.join(__dirname, '..', 'dist', `v${version}`);

    try {
        console.log(`🖥️  Publishing macOS builds for version ${version}...`);

        // Find the macOS files in version directory
        const dmgPath = path.join(versionDir, `AnotherDoro-${version}-arm64.dmg`);
        const dmgBlockmapPath = path.join(versionDir, `AnotherDoro-${version}-arm64.dmg.blockmap`);
        const zipPath = path.join(versionDir, `AnotherDoro-${version}-arm64-mac.zip`);
        const zipBlockmapPath = path.join(versionDir, `AnotherDoro-${version}-arm64-mac.zip.blockmap`);
        const ymlPath = path.join(versionDir, 'latest-mac.yml');

        // Check if files exist
        const filesToUpload = [];
        if (fs.existsSync(dmgPath)) {
            filesToUpload.push({ path: dmgPath, name: `AnotherDoro-${version}-arm64.dmg`, contentType: 'application/octet-stream' });
        }
        if (fs.existsSync(dmgBlockmapPath)) {
            filesToUpload.push({ path: dmgBlockmapPath, name: `AnotherDoro-${version}-arm64.dmg.blockmap`, contentType: 'application/octet-stream' });
        }
        if (fs.existsSync(zipPath)) {
            filesToUpload.push({ path: zipPath, name: `AnotherDoro-${version}-arm64-mac.zip`, contentType: 'application/zip' });
        }
        if (fs.existsSync(zipBlockmapPath)) {
            filesToUpload.push({ path: zipBlockmapPath, name: `AnotherDoro-${version}-arm64-mac.zip.blockmap`, contentType: 'application/octet-stream' });
        }
        if (fs.existsSync(ymlPath)) {
            filesToUpload.push({ path: ymlPath, name: 'latest-mac.yml', contentType: 'text/yaml' });
        }

        if (filesToUpload.length === 0) {
            console.error('❌ No macOS build files found. Make sure to run "npm run build:all" first');
            console.error(`   Checked directory: ${versionDir}`);
            process.exit(1);
        }

        console.log(`📦 Found ${filesToUpload.length} macOS files to upload`);

        // Check if release exists
        let release;
        try {
            const { data } = await octokit.rest.repos.getReleaseByTag({
                owner,
                repo,
                tag: tagName,
            });
            release = data;
            console.log(`✅ Found existing release: ${release.name}`);
        } catch (error) {
            if (error.status === 404) {
                console.log('📝 Creating new release...');
                const { data } = await octokit.rest.repos.createRelease({
                    owner,
                    repo,
                    tag_name: tagName,
                    name: `AnotherDoro v${version}`,
                    body: `## 🍅 AnotherDoro v${version}

### 📱 Multi-Platform Release
This release includes builds for both desktop and mobile platforms:

- **🖥️ Desktop (macOS):** Download the \`.dmg\` file below
- **📱 Android:** Download the \`.apk\` file below

### ✨ What's New
- 🚀 Auto-update functionality for seamless updates
- 🔄 Cross-platform synchronization
- 🎨 Enhanced user interface
- 🐛 Bug fixes and performance improvements
- 📊 Better session tracking and statistics

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
Desktop versions now support automatic updates! The app will notify you when new versions are available.`,
                    draft: false,
                    prerelease: version.includes('beta') || version.includes('alpha'),
                });
                release = data;
                console.log(`✅ Created release: ${release.name}`);
            } else {
                throw error;
            }
        }

        // Remove existing macOS assets
        for (const asset of release.assets) {
            if (asset.name.includes('.dmg') || asset.name.includes('-mac.zip') || asset.name.includes('latest-mac.yml') || asset.name.includes('.blockmap')) {
                console.log(`🗑️ Removing existing macOS asset: ${asset.name}`);
                await octokit.rest.repos.deleteReleaseAsset({
                    owner,
                    repo,
                    asset_id: asset.id,
                });
            }
        }

        // Upload each file
        for (const file of filesToUpload) {
            const fileBuffer = fs.readFileSync(file.path);
            const fileStats = fs.statSync(file.path);

            console.log(`⬆️ Uploading ${file.name} (${(fileStats.size / 1024 / 1024).toFixed(2)} MB)...`);

            await octokit.rest.repos.uploadReleaseAsset({
                owner,
                repo,
                release_id: release.id,
                name: file.name,
                data: fileBuffer,
                headers: {
                    'content-type': file.contentType,
                    'content-length': fileStats.size,
                },
            });

            console.log(`   ✅ ${file.name} uploaded successfully`);
        }

        console.log('🎉 macOS builds published successfully!');
        console.log(`🔗 Release URL: ${release.html_url}`);

    } catch (error) {
        console.error('❌ Failed to publish macOS builds:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
        process.exit(1);
    }
}

// Run the function if this script is executed directly
if (require.main === module) {
    publishMacOS();
}

module.exports = { publishMacOS }; 