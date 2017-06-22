import { execSync } from 'child_process';

execSync('git push', { stdio: [0, 1, 2] });
execSync('npm publish', { stdio: [0, 1, 2] });
