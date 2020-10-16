import { expect } from 'chai';
import execa from 'execa';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import rimraf from 'rimraf';
import { Package } from '../../src/index';
import { PackageJson } from './../../src/index';

const installLocal = path.resolve('bin', 'install-local');

const tmpDir = path.resolve(os.tmpdir(), 'local-installer-it');
const tmpFolder = (name: string) => path.resolve(tmpDir, name);

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
      three: new PackageHelper('three'),
    };
    await rm(tmpDir);
    await fs.mkdir(tmpDir);
    await Promise.all([
      packages.one.writePackage(),
      packages.two.writePackage(),
      packages.three.writePackage(),
    ]);
  });

  it('should install 2 packages without changing the package.json', async () => {
    const cmd = `node ${installLocal} ${packages.two.directory} ${packages.three.directory}`;
    await execa.command(cmd, { cwd: packages.one.directory });
    const installed = await packages.one.readdir('node_modules');
    const packageJson = await packages.one.readFile('package.json');
    expect(installed.sort()).to.deep.eq(['three', 'two']);
    expect(JSON.parse(packageJson)).to.deep.eq(packages.one.packageJson);
  });

  it('should install 2 packages and update the package.json if -S is provided', async () => {
    const cmd = `node ${installLocal} -S ${packages.two.directory} ${packages.three.directory}`;
    const expectedPackageJson = Object.assign(
      { localDependencies: { three: '../three', two: '../two' } },
      packages.one.packageJson,
    );
    await execa.command(cmd, { cwd: packages.one.directory });
    const installed = await packages.one.readdir('node_modules');
    const packageJson = await packages.one.readFile('package.json');
    expect(installed.sort()).to.deep.eq(['three', 'two']);
    expect(JSON.parse(packageJson)).to.deep.eq(expectedPackageJson);
  });

  it('should install a package if it is in the "localDependencies" and no arguments are provided', async () => {
    packages.one.packageJson.localDependencies = {
      two: '../two',
    };
    await packages.one.writePackage();
    await execa.command(`node ${installLocal}`, {
      cwd: packages.one.directory,
    });
    const installed = await packages.one.readdir('node_modules');
    expect(installed).to.deep.eq(['two']);
  });

  it('should install into siblings if --target-siblings is given', async () => {
    packages.one.packageJson.localDependencies = {
      two: '../two',
    };
    await packages.one.writePackage();
    await execa.command(`node ${installLocal} --target-siblings`, {
      cwd: packages.two.directory,
    });
    const installed = await packages.one.readdir('node_modules');
    expect(installed).to.deep.eq(['two']);
  });

  it('should also work for scoped packages (https://github.com/nicojs/node-install-local/issues/1)', async () => {
    packages.one.packageJson.localDependencies = {
      two: '../two',
    };
    packages.two.packageJson.name = '@scoped/two';
    await Promise.all([
      packages.one.writePackage(),
      packages.two.writePackage(),
    ]);
    await execa.command(`node ${installLocal}`, {
      cwd: packages.one.directory,
    });
  });
});

const rm = (directory: string) =>
  new Promise((res, rej) =>
    rimraf(directory, (err) => {
      if (err) {
        rej(err);
      } else {
        res();
      }
    }),
  );

class PackageHelper implements Package {
  public directory: string;
  public packageJson: PackageJson;
  constructor(private name: string) {
    this.directory = tmpFolder(name);
    this.packageJson = {
      name,
      version: '0.0.0',
    };
  }

  public readdir(dir: string) {
    return fs.readdir(path.resolve(this.directory, dir));
  }

  public readFile(file: string) {
    return fs.readFile(path.resolve(this.directory, file), 'utf8');
  }

  public async writePackage() {
    await rm(this.directory);
    await fs.mkdir(this.directory);
    return await Promise.all([
      fs.writeFile(
        path.resolve(this.directory, 'package.json'),
        JSON.stringify(this.packageJson, null, 2),
        'utf8',
      ),
      fs.writeFile(path.resolve(this.directory, this.name), '', 'utf8'),
    ]);
  }
}
