const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CurrentVersionPublisher {
    constructor() {
        this.packagePath = path.join(process.cwd(), 'package.json');
    }

    executeCommand(command, description) {
        console.log(`🔄 ${description}...`);
        try {
            const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
            if (output.trim()) {
                console.log(output.trim());
            }
            return true;
        } catch (error) {
            console.error(`❌ Failed: ${error.message}`);
            return false;
        }
    }

    getCurrentVersion() {
        try {
            const packageJson = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
            return packageJson.version;
        } catch (error) {
            console.error('❌ Failed to read current version from package.json');
            process.exit(1);
        }
    }

    checkGitStatus() {
        try {
            const status = execSync('git status --porcelain', { encoding: 'utf8' });
            if (status.trim()) {
                console.log('⚠️ Git working directory is not clean:');
                console.log(status);
                console.log('⚠️ Publishing current version with uncommitted changes...');
            }
        } catch (error) {
            console.log('⚠️ Git not available or not a git repository');
        }
    }

    async pushChanges() {
        console.log('\n⬆️ Pushing any pending changes to remote...');
        const success = this.executeCommand('git push origin main --tags', 'Pushing commits and tags');
        if (success) {
            console.log('✅ Successfully pushed changes');
        }
        return success;
    }

    async publishCurrent(options = {}) {
        const {
            skipGitCheck = false,
            skipPush = false,
            skipBuild = false
        } = options;

        const currentVersion = this.getCurrentVersion();
        console.log(`\n🚀 Publishing current version: ${currentVersion}\n`);

        // Check git status
        if (!skipGitCheck) {
            this.checkGitStatus();
        }

        // Build and publish
        if (!skipBuild) {
            console.log('🔨 Building and publishing current version...');

            // Build all platforms
            const buildSuccess = this.executeCommand('npm run build:all', 'Building all platforms');
            if (!buildSuccess) {
                console.error('❌ Build failed, aborting publish');
                process.exit(1);
            }

            // Publish desktop version
            console.log('\n🔄 Publishing desktop version...');
            const publishDesktopSuccess = this.executeCommand('npm run publish:mac', 'Publishing desktop version');
            if (!publishDesktopSuccess) {
                console.error('❌ Desktop publish failed');
            }

            // Publish Android version
            console.log('\n🔄 Publishing Android version...');
            const publishAndroidSuccess = this.executeCommand('npm run publish:android', 'Publishing Android version');
            if (!publishAndroidSuccess) {
                console.error('❌ Android publish failed');
            }

            if (publishDesktopSuccess && publishAndroidSuccess) {
                console.log('\n✅ Successfully published both platforms!');
            } else if (publishDesktopSuccess) {
                console.log('\n✅ Successfully published desktop version!');
                console.log('❌ Android publish failed');
            } else if (publishAndroidSuccess) {
                console.log('\n✅ Successfully published Android version!');
                console.log('❌ Desktop publish failed');
            } else {
                console.log('\n❌ Both platform publishes failed');
                process.exit(1);
            }
        }

        // Push any pending changes to remote
        if (!skipPush) {
            await this.pushChanges();
        }

        console.log(`\n🎉 Publish process completed for current version ${currentVersion}!`);
        console.log(`🔗 Check your release at: https://github.com/herickchann/another-doro/releases/tag/v${currentVersion}`);
    }
}

// CLI Interface
async function main() {
    const publisher = new CurrentVersionPublisher();
    const args = process.argv.slice(2);

    const options = {
        skipGitCheck: args.includes('--skip-git-check'),
        skipPush: args.includes('--skip-push'),
        skipBuild: args.includes('--skip-build')
    };

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🚀 Current Version Publisher Usage:

This script publishes the current version without bumping it.

Options:
  --skip-git-check    Skip git status check
  --skip-push         Skip pushing to remote
  --skip-build        Skip building (for testing)
  --help, -h          Show this help message

Examples:
  npm run publish:now                    # Publish current version
  node scripts/publish-current.js       # Same as above
  npm run publish:now --skip-git-check  # Skip git status check
        `);
        return;
    }

    await publisher.publishCurrent(options);
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Publish failed:', error);
        process.exit(1);
    });
}

module.exports = { CurrentVersionPublisher }; 