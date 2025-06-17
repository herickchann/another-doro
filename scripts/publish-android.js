const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');
const packageJson = require('../package.json');

async function publishAndroidAPK() {
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

    const owner = 'herickchannn';
    const repo = 'another-doro';
    const version = packageJson.version;
    const tagName = `v${version}`;

    try {
        console.log(`📱 Publishing Android APK for version ${version}...`);

        // Find the APK file
        const apkPath = path.join(__dirname, '../android/app/build/outputs/apk/release/app-release.apk');
        const apkPathUnsigned = path.join(__dirname, '../android/app/build/outputs/apk/release/app-release-unsigned.apk');

        let finalApkPath;
        if (fs.existsSync(apkPath)) {
            finalApkPath = apkPath;
        } else if (fs.existsSync(apkPathUnsigned)) {
            finalApkPath = apkPathUnsigned;
        } else {
            console.error('❌ APK file not found. Make sure to run "npm run build:android-release" first');
            process.exit(1);
        }

        console.log(`📦 Found APK: ${finalApkPath}`);

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

        // Check if APK asset already exists
        const existingAsset = release.assets.find(asset =>
            asset.name.includes('.apk') || asset.name.includes('android')
        );

        if (existingAsset) {
            console.log('🗑️ Removing existing Android asset...');
            await octokit.rest.repos.deleteReleaseAsset({
                owner,
                repo,
                asset_id: existingAsset.id,
            });
        }

        // Read the APK file
        const apkBuffer = fs.readFileSync(finalApkPath);
        const apkStats = fs.statSync(finalApkPath);
        const apkFileName = `AnotherDoro-v${version}-android.apk`;

        console.log(`⬆️ Uploading ${apkFileName} (${(apkStats.size / 1024 / 1024).toFixed(2)} MB)...`);

        // Upload the APK
        await octokit.rest.repos.uploadReleaseAsset({
            owner,
            repo,
            release_id: release.id,
            name: apkFileName,
            data: apkBuffer,
            headers: {
                'content-type': 'application/vnd.android.package-archive',
                'content-length': apkStats.size,
            },
        });

        console.log('✅ Android APK uploaded successfully!');
        console.log(`🔗 Release URL: ${release.html_url}`);

    } catch (error) {
        console.error('❌ Failed to publish Android APK:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
        process.exit(1);
    }
}

// Run the function if this script is executed directly
if (require.main === module) {
    publishAndroidAPK();
}

module.exports = { publishAndroidAPK }; 