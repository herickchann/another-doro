#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🍅 AnotherDoro Android Build Script');
console.log('=====================================\n');

// Check if we're building release or debug
const isRelease = process.argv.includes('--release');
const buildType = isRelease ? 'release' : 'debug';

console.log(`📱 Building ${buildType} APK...\n`);

try {
    // Step 1: Sync web assets to www directory
    console.log('📋 Step 1: Syncing web assets...');

    // Ensure www directory exists
    if (!fs.existsSync('www')) {
        fs.mkdirSync('www');
    }

    // Copy main files to www
    const filesToCopy = [
        'index.html',
        'styles.css',
        'assets'
    ];

    filesToCopy.forEach(file => {
        if (fs.existsSync(file)) {
            if (fs.statSync(file).isDirectory()) {
                // Copy directory recursively
                execSync(`cp -r ${file} www/`, { stdio: 'inherit' });
            } else {
                // Copy file
                execSync(`cp ${file} www/`, { stdio: 'inherit' });
            }
            console.log(`   ✅ Copied ${file}`);
        }
    });

    console.log('   ✅ Web assets synced\n');

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

    // Step 4: Find and copy APK
    console.log('📋 Step 4: Locating APK...');

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
            const destPath = `AnotherDoro-1.0.0-${buildType}.apk`;

            // Copy APK to root directory
            fs.copyFileSync(sourcePath, destPath);

            // Get file size
            const stats = fs.statSync(destPath);
            const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(1);

            console.log(`   ✅ APK copied to: ${destPath}`);
            console.log(`   📦 Size: ${fileSizeInMB} MB\n`);

            console.log('🎉 Android build completed successfully!');
            console.log(`📱 APK ready: ${destPath}`);

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