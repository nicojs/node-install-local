import { expect } from 'chai';
import { exec } from 'mz/child_process';
import * as fs from 'mz/fs';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { Package } from '../../src/index';
import { PackageJson } from './../../src/index';

const installLocal = path.resolve('bin', 'install-local');

describe('install-local cli given 3 packages', () => {

    let packages: {
        one: PackageHelper;
        two: PackageHelper;
        three: PackageHelper;
    };

    beforeEach(async () => {
        packages = {
            one: new PackageHelper('one'),
            two: new PackageHelper('two'),
            three: new PackageHelper('three')
        };
        await rm(tmpDir);
        await fs.mkdir(tmpDir);
        await Promise.all([
            packages.one.writePackage(),
            packages.two.writePackage(),
            packages.three.writePackage()]);
    });

    it('should install 2 packages without changing the package.json', async () => {
        const cmd = `node ${installLocal} ${packages.two.directory} ${packages.three.directory}`;
        await exec(cmd, { cwd: packages.one.directory });
        const installed = await packages.one.readdir('node_modules');
        const packageJson = await packages.one.readFile('package.json');
        expect(installed.sort()).to.deep.eq(['three', 'two']);
        expect(JSON.parse(packageJson)).to.deep.eq(packages.one.packageJson);
    });

    it('should install 2 packages and update the package.json if -S is provided', async () => {
        const cmd = `node ${installLocal} -S ${packages.two.directory} ${packages.three.directory}`;
        const expectedPackageJson = Object.assign({ localDependencies: { three: '../three', two: '../two' } }, packages.one.packageJson);
        await exec(cmd, { cwd: packages.one.directory });
        const installed = await packages.one.readdir('node_modules');
        const packageJson = await packages.one.readFile('package.json');
        expect(installed.sort()).to.deep.eq(['three', 'two']);
        expect(JSON.parse(packageJson)).to.deep.eq(expectedPackageJson);
    });

    it('should install a package if it is in the "localDependencies" and no arguments are provided', async () => {
        packages.one.packageJson.localDependencies = {
            two: '../two'
        };
        await packages.one.writePackage();
        await exec(`node ${installLocal}`, { cwd: packages.one.directory });
        const installed = await packages.one.readdir('node_modules');
        expect(installed).to.deep.eq(['two']);
    });
});

const rm = (directory: string) => new Promise((res, rej) => rimraf(directory, err => {
    if (err) {
        rej(err);
    } else {
        res();
    }
}));

const tmpDir = path.resolve(os.tmpdir(), 'local-installer-it');
const tmpFolder = (name: string) => path.resolve(tmpDir, name);

class PackageHelper implements Package {
    public directory: string;
    public packageJson: PackageJson;
    constructor(private name: string) {
        this.directory = tmpFolder(name);
        this.packageJson = {
            name,
            version: '0.0.0'
        };
    }

    public readdir(dir: string) {
        return fs.readdir(path.resolve(this.directory, dir));
    }

    public readFile(file: string) {
        return fs.readFile(path.resolve(this.directory, file), 'utf8');
    }

    public writePackage() {
        return rm(this.directory)
            .then(() => fs.mkdir(this.directory))
            .then(() => Promise.all([
                fs.writeFile(path.resolve(this.directory, 'package.json'), JSON.stringify(this.packageJson, null, 2), 'utf8'),
                fs.writeFile(path.resolve(this.directory, this.name), 'utf8', '')
            ]));
    }
}
