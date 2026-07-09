#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Syncing web assets to www directory...');

try {
    // Remove existing www directory to ensure clean state
    if (fs.existsSync('www')) {
        console.log('   🗑️  Removing existing www directory...');
        fs.rmSync('www', { recursive: true, force: true });
    }

    // Create fresh www directory
    fs.mkdirSync('www');
    console.log('   📁 Created fresh www directory');

    // Files and directories to copy from root to www
    const itemsToCopy = [
        'index.html',
        'styles.css',
        'renderer.js',
        'sw.js',
        'src',
        'assets'
    ];

    // Copy each item
    itemsToCopy.forEach(item => {
        if (fs.existsSync(item)) {
            const isDirectory = fs.statSync(item).isDirectory();

            if (isDirectory) {
                // Copy directory recursively
                execSync(`cp -r ${item} www/`, { stdio: 'pipe' });
                console.log(`   ✅ Copied directory: ${item}`);
            } else {
                // Copy file
                execSync(`cp ${item} www/`, { stdio: 'pipe' });
                console.log(`   ✅ Copied file: ${item}`);
            }
        } else {
            console.log(`   ⚠️  Skipped missing item: ${item}`);
        }
    });

    console.log('✅ Web assets synced successfully to www/\n');

} catch (error) {
    console.error('❌ Failed to sync web assets:', error.message);
    process.exit(1);
} 