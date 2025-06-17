#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🍅 AnotherDoro Linux Versioned Build Script');
console.log('============================================\n');

// Get current version from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

console.log(`📦 Building Linux version: ${version}\n`);

try {
    // Create version directory
    const versionDir = path.join('dist', `v${version}`);
    if (!fs.existsSync(versionDir)) {
        fs.mkdirSync(versionDir, { recursive: true });
        console.log(`📁 Created version directory: ${versionDir}\n`);
    }

    // Build Linux
    console.log('🐧 Building Linux...');
    execSync('electron-builder --linux', { stdio: 'inherit' });

    // Move Linux files to version directory (only current version files)
    const distFiles = fs.readdirSync('dist');
    const linuxFiles = distFiles.filter(file =>
        (file.includes('.AppImage') ||
            file.includes('.deb') ||
            file.includes('.rpm') ||
            file.includes('.tar.gz') ||
            file.includes('latest-linux.yml')) &&
        (file.includes(version) || file === 'latest-linux.yml')
    );

    linuxFiles.forEach(file => {
        const sourcePath = path.join('dist', file);
        const destPath = path.join(versionDir, file);
        if (fs.existsSync(sourcePath)) {
            fs.renameSync(sourcePath, destPath);
            console.log(`   ✅ Moved ${file} to version directory`);
        }
    });

    console.log('🐧 Linux build completed\n');

    // Show final summary
    console.log('🎉 Linux build completed successfully!');
    console.log(`📁 Files organized in: ${versionDir}`);

    // List files in version directory
    const versionFiles = fs.readdirSync(versionDir);
    console.log('\n📋 Built files:');
    versionFiles.forEach(file => {
        const filePath = path.join(versionDir, file);
        const stats = fs.statSync(filePath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(1);
        console.log(`   📦 ${file} (${sizeInMB} MB)`);
    });

} catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
} 