import { execSync } from 'child_process';
import * as fs from 'fs';

const conventionalChangelog = require('conventional-changelog');
const changelogStream = fs.createWriteStream('CHANGELOG.md', { autoClose: false });
conventionalChangelog({
    preset: 'angular',
    releaseCount: 0
})
    .pipe(changelogStream) // or any writable stream
    .on('finish', () => {
        setTimeout(() => {
            console.log('[release] git add CHANGELOG.md');
            execSync('git add CHANGELOG.md');
        }, 2000);
    });
