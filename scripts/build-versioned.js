#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🍅 AnotherDoro Versioned Build Script');
console.log('=====================================\n');

// Get current version from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

console.log(`📦 Building version: ${version}\n`);

try {
    // Build macOS (using versioned script that already handles directory organization)
    console.log('🖥️  Building macOS...');
    execSync('node scripts/build-mac-versioned.js', { stdio: 'inherit' });

    // Build Android (using versioned script that already handles directory organization)
    console.log('📱 Building Android...');
    execSync('node scripts/build-android-versioned.js --release', { stdio: 'inherit' });

    // Show final summary
    console.log('🎉 All builds completed successfully!');

    const versionDir = path.join('dist', `v${version}`);
    console.log(`📁 All files organized in: ${versionDir}`);

    // List files in version directory
    if (fs.existsSync(versionDir)) {
        const versionFiles = fs.readdirSync(versionDir);
        console.log('\n📋 All built files:');
        versionFiles.forEach(file => {
            const filePath = path.join(versionDir, file);
            const stats = fs.statSync(filePath);
            const sizeInMB = (stats.size / (1024 * 1024)).toFixed(1);
            console.log(`   📦 ${file} (${sizeInMB} MB)`);
        });
    }

} catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
} 