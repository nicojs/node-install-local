import { execSync } from 'child_process';

const execStreaming = (cmd: string) => {
    console.log(`[release] ${cmd}`);
    return execSync(cmd, { stdio: [0, 1, 2] });
};

execStreaming('git push');
execStreaming('git push --tags');
execStreaming('npm publish');
