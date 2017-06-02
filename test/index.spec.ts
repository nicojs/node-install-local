import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import { exec, installLocal } from '../src/index';

const readdirInSample = (dirName: string) => new Promise<string[]>((res, rej) => {
    fs.readdir(path.resolve(__dirname, '..', 'sample', dirName), (err, dirs) => {
        if (err) {
            rej(err);
        } else {
            res(dirs.sort());
        }
    });
});

describe('installLocal in sample project', () => {

    beforeEach(() => exec(path.resolve(__dirname, '..'), 'rimraf sample/node_modules'));

    it('should install local as an actual node package (not link)', () => {
        return installLocal('.', 'sample').then(() => Promise.all([
            readdirInSample('node_modules').then(dirs => expect(dirs).to.deep.equal(['install-local'])),
            readdirInSample('node_modules/install-local')
                .then(dirs => expect(dirs).to.deep.equal(['bin', 'package.json', 'src']))
        ]));
    });
});
