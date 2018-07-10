import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as uniqid from 'uniqid';

export function del(filename: string) {
    return new Promise((resolve, reject) => rimraf(filename, (err) => {
        if (err) {
            reject(err);
        }

        resolve();
    }));
}

export function getRandomTmpDir(prefix: string) {
    return path.resolve(os.tmpdir(), uniqid(prefix));
}
