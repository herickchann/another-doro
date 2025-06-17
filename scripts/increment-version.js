const fs = require('fs');
const path = require('path');

class VersionManager {
    constructor() {
        this.packageJsonPath = path.join(__dirname, '../package.json');
        this.androidBuildGradlePath = path.join(__dirname, '../android/app/build.gradle');
    }

    getCurrentVersion() {
        const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
        return packageJson.version;
    }

    incrementVersion(versionType = 'patch') {
        const currentVersion = this.getCurrentVersion();
        const versionParts = currentVersion.split('.').map(Number);

        switch (versionType) {
            case 'major':
                versionParts[0]++;
                versionParts[1] = 0;
                versionParts[2] = 0;
                break;
            case 'minor':
                versionParts[1]++;
                versionParts[2] = 0;
                break;
            case 'patch':
            default:
                versionParts[2]++;
                break;
        }

        return versionParts.join('.');
    }

    updatePackageJson(newVersion) {
        const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
        const oldVersion = packageJson.version;

        packageJson.version = newVersion;

        fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

        console.log(`📦 Updated package.json: ${oldVersion} → ${newVersion}`);
        return { oldVersion, newVersion };
    }

    updateAndroidVersion(newVersion) {
        if (!fs.existsSync(this.androidBuildGradlePath)) {
            console.log('⚠️ Android build.gradle not found, skipping Android version update');
            return;
        }

        let buildGradleContent = fs.readFileSync(this.androidBuildGradlePath, 'utf8');

        // Extract current versionCode and increment it
        const versionCodeMatch = buildGradleContent.match(/versionCode\s+(\d+)/);
        const currentVersionCode = versionCodeMatch ? parseInt(versionCodeMatch[1]) : 1;
        const newVersionCode = currentVersionCode + 1;

        // Update versionCode
        buildGradleContent = buildGradleContent.replace(
            /versionCode\s+\d+/,
            `versionCode ${newVersionCode}`
        );

        // Update versionName
        const oldVersionName = buildGradleContent.match(/versionName\s+"([^"]+)"/)?.[1] || 'unknown';
        buildGradleContent = buildGradleContent.replace(
            /versionName\s+"[^"]+"/,
            `versionName "${newVersion}"`
        );

        fs.writeFileSync(this.androidBuildGradlePath, buildGradleContent);

        console.log(`📱 Updated Android build.gradle:`);
        console.log(`   versionName: ${oldVersionName} → ${newVersion}`);
        console.log(`   versionCode: ${currentVersionCode} → ${newVersionCode}`);

        return { oldVersionName, newVersion, oldVersionCode: currentVersionCode, newVersionCode };
    }

    incrementAndUpdate(versionType = 'patch') {
        const currentVersion = this.getCurrentVersion();
        const newVersion = this.incrementVersion(versionType);

        console.log(`\n🚀 Incrementing version: ${currentVersion} → ${newVersion} (${versionType})\n`);

        // Update package.json
        this.updatePackageJson(newVersion);

        // Update Android version
        this.updateAndroidVersion(newVersion);

        console.log(`\n✅ Version updated successfully to ${newVersion}`);
        console.log(`📝 Don't forget to commit these changes before publishing!\n`);

        return newVersion;
    }

    showCurrentVersions() {
        const packageVersion = this.getCurrentVersion();
        console.log(`\n📊 Current Versions:`);
        console.log(`📦 Node.js (package.json): ${packageVersion}`);

        if (fs.existsSync(this.androidBuildGradlePath)) {
            const buildGradleContent = fs.readFileSync(this.androidBuildGradlePath, 'utf8');
            const versionName = buildGradleContent.match(/versionName\s+"([^"]+)"/)?.[1] || 'unknown';
            const versionCode = buildGradleContent.match(/versionCode\s+(\d+)/)?.[1] || 'unknown';
            console.log(`📱 Android (build.gradle): ${versionName} (code: ${versionCode})`);
        } else {
            console.log(`📱 Android: build.gradle not found`);
        }
        console.log('');
    }
}

// CLI Interface
function main() {
    const versionManager = new VersionManager();
    const args = process.argv.slice(2);
    const command = args[0] || 'patch';

    switch (command) {
        case 'major':
        case 'minor':
        case 'patch':
            versionManager.incrementAndUpdate(command);
            break;

        case 'show':
        case 'current':
            versionManager.showCurrentVersions();
            break;

        case 'help':
        case '--help':
        case '-h':
            console.log(`
🔧 Version Manager Usage:

Commands:
  patch           Increment patch version (1.0.0 → 1.0.1) [default]
  minor           Increment minor version (1.0.0 → 1.1.0)
  major           Increment major version (1.0.0 → 2.0.0)
  show|current    Show current versions
  help            Show this help message

Examples:
  node scripts/increment-version.js patch
  node scripts/increment-version.js minor
  node scripts/increment-version.js show
            `);
            break;

        default:
            console.error(`❌ Unknown command: ${command}`);
            console.log('Use "help" to see available commands');
            process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { VersionManager }; 