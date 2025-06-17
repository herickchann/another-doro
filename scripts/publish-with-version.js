const { execSync } = require('child_process');
const { VersionManager } = require('./increment-version');

class PublishManager {
    constructor() {
        this.versionManager = new VersionManager();
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

    checkGitStatus() {
        try {
            const status = execSync('git status --porcelain', { encoding: 'utf8' });
            if (status.trim()) {
                console.log('⚠️ Git working directory is not clean:');
                console.log(status);

                const answer = process.env.CI ? 'y' : this.promptUser('Continue anyway? (y/N): ');
                if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
                    console.log('❌ Aborted. Please commit or stash your changes first.');
                    process.exit(1);
                }
            }
        } catch (error) {
            console.log('⚠️ Git not available or not a git repository');
        }
    }

    promptUser(question) {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer);
            });
        });
    }

    async commitVersionChanges(newVersion) {
        console.log('\n📝 Committing version changes...');

        // Add changed files
        this.executeCommand('git add package.json', 'Adding package.json');
        this.executeCommand('git add android/app/build.gradle', 'Adding Android build.gradle');

        // Commit changes
        const commitMessage = `chore: bump version to ${newVersion}`;
        const success = this.executeCommand(`git commit -m "${commitMessage}"`, 'Committing version bump');

        if (success) {
            console.log(`✅ Committed version bump: ${newVersion}`);
        }

        return success;
    }

    async tagVersion(version) {
        const tagName = `v${version}`;
        console.log(`\n🏷️ Creating git tag: ${tagName}`);

        const success = this.executeCommand(`git tag -a ${tagName} -m "Release ${tagName}"`, 'Creating git tag');

        if (success) {
            console.log(`✅ Created tag: ${tagName}`);
        }

        return success;
    }

    async pushChanges(version) {
        console.log('\n⬆️ Pushing changes to remote...');

        // Push commits and tags together
        const success = this.executeCommand('git push origin main --tags', 'Pushing commits and tags');

        if (success) {
            console.log('✅ Successfully pushed changes and tags');
        }

        return success;
    }

    async publishWithVersionBump(versionType = 'patch', options = {}) {
        const {
            skipGitCheck = false,
            skipCommit = false,
            skipPush = false,
            skipBuild = false
        } = options;

        console.log(`\n🚀 Starting publish process with ${versionType} version bump...\n`);

        // Check git status
        if (!skipGitCheck) {
            this.checkGitStatus();
        }

        // Show current versions
        this.versionManager.showCurrentVersions();

        // Increment version
        const newVersion = this.versionManager.incrementAndUpdate(versionType);

        // Commit version changes
        if (!skipCommit) {
            const commitSuccess = await this.commitVersionChanges(newVersion);
            if (!commitSuccess) {
                console.log('⚠️ Failed to commit version changes, continuing anyway...');
            }
        }

        // Create git tag
        if (!skipCommit) {
            await this.tagVersion(newVersion);
        }

        // Build and publish
        if (!skipBuild) {
            console.log('\n🔨 Building and publishing...');

            // Build all platforms
            const buildSuccess = this.executeCommand('npm run build:all', 'Building all platforms');
            if (!buildSuccess) {
                console.error('❌ Build failed, aborting publish');
                process.exit(1);
            }

            // Publish desktop version
            const publishDesktopSuccess = this.executeCommand('npm run publish:mac', 'Publishing desktop version');
            if (!publishDesktopSuccess) {
                console.error('❌ Desktop publish failed');
            }

            // Publish Android version
            const publishAndroidSuccess = this.executeCommand('npm run publish:android', 'Publishing Android version');
            if (!publishAndroidSuccess) {
                console.error('❌ Android publish failed');
            }

            if (publishDesktopSuccess && publishAndroidSuccess) {
                console.log('\n✅ Successfully published both platforms!');
            }
        }

        // Push changes to remote
        if (!skipPush && !skipCommit) {
            await this.pushChanges(newVersion);
        }

        console.log(`\n🎉 Publish process completed for version ${newVersion}!`);
        console.log(`🔗 Check your release at: https://github.com/herickchann/another-doro/releases/tag/v${newVersion}`);
    }
}

// CLI Interface
async function main() {
    const publishManager = new PublishManager();
    const args = process.argv.slice(2);
    const versionType = args[0] || 'patch';

    const options = {
        skipGitCheck: args.includes('--skip-git-check'),
        skipCommit: args.includes('--skip-commit'),
        skipPush: args.includes('--skip-push'),
        skipBuild: args.includes('--skip-build')
    };

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🚀 Publish Manager Usage:

Commands:
  patch           Increment patch version and publish (1.0.0 → 1.0.1) [default]
  minor           Increment minor version and publish (1.0.0 → 1.1.0)
  major           Increment major version and publish (1.0.0 → 2.0.0)

Options:
  --skip-git-check    Skip git status check
  --skip-commit       Skip git commit and tagging
  --skip-push         Skip pushing to remote
  --skip-build        Skip building (for testing)
  --help, -h          Show this help message

Examples:
  node scripts/publish-with-version.js patch
  node scripts/publish-with-version.js minor --skip-push
  node scripts/publish-with-version.js major --skip-git-check
        `);
        return;
    }

    if (!['patch', 'minor', 'major'].includes(versionType)) {
        console.error(`❌ Invalid version type: ${versionType}`);
        console.log('Valid types: patch, minor, major');
        process.exit(1);
    }

    try {
        await publishManager.publishWithVersionBump(versionType, options);
    } catch (error) {
        console.error(`❌ Publish failed: ${error.message}`);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { PublishManager }; 