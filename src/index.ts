import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

interface PackageJson {
    name: string;
    version: string;
}

export function installLocal(from: string, ...to: string[]) {
    return Promise.all([
        readPackageJson(from).then(pck => path.resolve(`${pck.name}-${pck.version}.tgz`)),
        exec('', `npm pack ${from}`)
    ])
        .then(([packFile, _]) => {
            return Promise.all(to.map(targetPackage => exec(targetPackage, `npm i --no-save ${packFile}`)))
                .then(() => del(packFile));
        });
}

export function exec(cwd: string, command: string) {
    return new Promise<string>((res, rej) => {
        childProcess.exec(command, { cwd }, (err, stdout, stderr) => {
            if (err) {
                rej(err);
            } else {
                res(`${stdout}${stderr ? `${os.EOL}stderr: ${stderr}` : ''}`);
            }
        });
    });
}

function readPackageJson(from: string) {
    return new Promise<PackageJson>((res, rej) => {
        fs.readFile(path.join(from, 'package.json'), 'utf8', (err, content) => {
            if (err) {
                rej(err);
            } else {
                res(JSON.parse(content) as PackageJson);
            }
        });
    });
}

function del(file: string) {
    return new Promise<undefined>((res, rej) => fs.unlink(file, err => {
        if (err) {
            rej(err);
        } else {
            res(undefined);
        }
    }));
}
