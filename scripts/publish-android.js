const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');
const { ReleaseConfig } = require('./release-config');

async function publishAndroidAPK() {
    // Check for GitHub token
    const token = process.env.GH_TOKEN;
    if (!token) {
        console.error('❌ GH_TOKEN environment variable is required');
        process.exit(1);
    }

    // Initialize Octokit and Release Config
    const octokit = new Octokit({
        auth: token,
    });

    const releaseConfig = new ReleaseConfig();
    const { owner, repo, version, tagName } = releaseConfig.getReleaseData();

    try {
        console.log(`📱 Publishing Android APK for version ${version}...`);

        // Find the APK file - first check version directory, then fallback to build directory
        const versionDir = path.join(__dirname, '..', 'dist', `v${version}`);
        const versionApkPath = path.join(versionDir, `AnotherDoro-${version}-release.apk`);
        const apkPath = path.join(__dirname, '../android/app/build/outputs/apk/release/app-release.apk');
        const apkPathUnsigned = path.join(__dirname, '../android/app/build/outputs/apk/release/app-release-unsigned.apk');

        let finalApkPath;
        if (fs.existsSync(versionApkPath)) {
            finalApkPath = versionApkPath;
            console.log('📦 Using APK from version directory');
        } else if (fs.existsSync(apkPath)) {
            finalApkPath = apkPath;
            console.log('📦 Using APK from build directory');
        } else if (fs.existsSync(apkPathUnsigned)) {
            finalApkPath = apkPathUnsigned;
            console.log('📦 Using unsigned APK from build directory');
        } else {
            console.error('❌ APK file not found. Make sure to run "npm run build:all" or "npm run build:android-release" first');
            console.error(`   Checked paths:`);
            console.error(`   - ${versionApkPath}`);
            console.error(`   - ${apkPath}`);
            console.error(`   - ${apkPathUnsigned}`);
            process.exit(1);
        }

        console.log(`📦 Found APK: ${finalApkPath}`);

        // Get or create release using centralized config
        const release = await releaseConfig.getOrCreateRelease(octokit);

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