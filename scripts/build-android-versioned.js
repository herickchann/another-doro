#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🍅 AnotherDoro Android Versioned Build Script');
console.log('==============================================\n');

// Get current version from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

// Check if we're building release or debug
const isRelease = process.argv.includes('--release');
const buildType = isRelease ? 'release' : 'debug';

console.log(`📱 Building Android ${buildType} version: ${version}\n`);

try {
    // Step 1: Sync web assets to www directory
    console.log('📋 Step 1: Syncing web assets...');
    execSync('node scripts/sync-www.js', { stdio: 'inherit' });

    // Step 2: Sync Capacitor
    console.log('📋 Step 2: Syncing Capacitor...');
    execSync('npx cap sync android', { stdio: 'inherit' });
    console.log('   ✅ Capacitor synced\n');

    // Step 3: Build Android APK
    console.log('📋 Step 3: Building Android APK...');

    const gradleCommand = isRelease
        ? './gradlew assembleRelease'
        : './gradlew assembleDebug';

    // Change to android directory and build
    process.chdir('android');
    execSync(gradleCommand, { stdio: 'inherit' });
    process.chdir('..');

    console.log('   ✅ Android APK built\n');

    // Step 4: Find and copy APK to dist folder
    console.log('📋 Step 4: Locating and moving APK to version folder...');

    // Ensure version-specific dist directory exists
    const versionDir = path.join('dist', `v${version}`);
    if (!fs.existsSync(versionDir)) {
        fs.mkdirSync(versionDir, { recursive: true });
        console.log(`   📁 Created version directory: ${versionDir}`);
    }

    const apkDir = isRelease
        ? 'android/app/build/outputs/apk/release'
        : 'android/app/build/outputs/apk/debug';

    const apkPattern = isRelease
        ? 'app-release*.apk'
        : 'app-debug*.apk';

    if (fs.existsSync(apkDir)) {
        const files = fs.readdirSync(apkDir);
        const apkFile = files.find(file => file.match(apkPattern.replace('*', '.*')));

        if (apkFile) {
            const sourcePath = path.join(apkDir, apkFile);
            const destPath = path.join(versionDir, `AnotherDoro-${version}-${buildType}.apk`);

            // Copy APK to version-specific directory
            fs.copyFileSync(sourcePath, destPath);

            // Get file size
            const stats = fs.statSync(destPath);
            const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(1);

            console.log(`   ✅ APK moved to: ${destPath}`);
            console.log(`   📦 Size: ${fileSizeInMB} MB\n`);

            console.log('🎉 Android build completed successfully!');
            console.log(`📱 APK ready in version folder: ${destPath}`);

            if (isRelease) {
                console.log('\n⚠️  Note: Release APK needs to be signed for distribution');
                console.log('   Use Android Studio or apksigner tool to sign the APK');
            }

        } else {
            throw new Error(`APK file not found in ${apkDir}`);
        }
    } else {
        throw new Error(`APK directory not found: ${apkDir}`);
    }

} catch (error) {
    console.error('\n❌ Build failed:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('   1. Make sure Android SDK is installed and ANDROID_HOME is set');
    console.error('   2. Run: npm install @capacitor/android @capacitor/cli @capacitor/core');
    console.error('   3. Check that android/local.properties has correct SDK path');
    console.error('   4. Try: npx cap doctor');
    process.exit(1);
} 