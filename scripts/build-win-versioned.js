#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🍅 AnotherDoro Windows Versioned Build Script');
console.log('==============================================\n');

// Get current version from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

console.log(`📦 Building Windows version: ${version}\n`);

try {
    // Create version directory
    const versionDir = path.join('dist', `v${version}`);
    if (!fs.existsSync(versionDir)) {
        fs.mkdirSync(versionDir, { recursive: true });
        console.log(`📁 Created version directory: ${versionDir}\n`);
    }

    // Build Windows
    console.log('🪟 Building Windows...');
    execSync('electron-builder --win', { stdio: 'inherit' });

    // Move Windows files to version directory (only current version files)
    const distFiles = fs.readdirSync('dist');
    const winFiles = distFiles.filter(file =>
        (file.includes('.exe') ||
            file.includes('.blockmap') ||
            file.includes('latest.yml')) &&
        (file.includes(version) || file === 'latest.yml')
    );

    winFiles.forEach(file => {
        const sourcePath = path.join('dist', file);
        const destPath = path.join(versionDir, file);
        if (fs.existsSync(sourcePath)) {
            fs.renameSync(sourcePath, destPath);
            console.log(`   ✅ Moved ${file} to version directory`);
        }
    });

    console.log('🪟 Windows build completed\n');

    // Show final summary
    console.log('🎉 Windows build completed successfully!');
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