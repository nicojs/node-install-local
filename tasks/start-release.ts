import { execSync } from 'child_process';
import * as fs from 'fs';
import * as semver from 'semver';
const conventionalRecommendedBump = require('conventional-recommended-bump');

const exec = (cmd: string) => {
    console.log(`[release] ${cmd}`);
    return execSync(cmd).toString();
};

const execStreaming = (cmd: string) => {
    console.log(`[release] ${cmd}`);
    return execSync(cmd, { stdio: [0, 1, 2] });
};

// exec('git pull');
const status = exec('git status');
if (status.indexOf('nothing to commit, working tree clean') === -1) {
    console.error('[release] Working directory not clean!');
    console.error(status);
    process.exit(1);
}

if (status.indexOf(`Your branch is up-to-date with 'origin/master'`) === -1) {
    console.error('[release] Your not working on the master branch!');
    console.error(status);
    process.exit(1);
}

execStreaming('npm t');

conventionalRecommendedBump({
    preset: 'angular',
    version: '0.23.4'
}, (err: Error, result: { releaseType: string }) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const nextVersion = semver.inc(packageJson.version, result.releaseType);
    console.log(`[release]: New ${result.releaseType} version will be ${nextVersion} (based on semver and your semantic changelog)`);

    execStreaming(`npm version ${nextVersion} -m "chore: release v${nextVersion}"`);
});
