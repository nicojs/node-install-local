import execa, { ExecaReturnValue } from 'execa';
import os from 'os';
import path from 'path';
import rimraf from 'rimraf';
import uniqid from 'uniqid';

export function del(filename: string) {
    return new Promise((resolve, reject) => rimraf(filename, (err) => {
        if (err) {
            reject(err);
        } else {
            resolve();
        }
    }));
}

export function getRandomTmpDir(prefix: string) {
    return path.resolve(os.tmpdir(), uniqid(prefix));
}

export function exec(file: string, args?: readonly string[] | undefined, options?: execa.Options<string> | undefined): Promise<ExecaReturnValue<string>> {
    return execa(file, args, options);
}