#!/usr/bin/env node

const fs = require('fs');

console.log('🧹 Cleaning www directory...');

try {
    if (fs.existsSync('www')) {
        fs.rmSync('www', { recursive: true, force: true });
        console.log('✅ www directory removed successfully');
    } else {
        console.log('ℹ️  www directory does not exist');
    }
} catch (error) {
    console.error('❌ Failed to clean www directory:', error.message);
    process.exit(1);
} 