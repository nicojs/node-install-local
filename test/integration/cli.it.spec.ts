import { expect } from 'chai';
import { execaCommand } from 'execa';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { rimraf } from 'rimraf';
import type { Package } from '../../src/index.ts';
import type { PackageJson } from './../../src/index.ts';
const installLocal = path.resolve('bin', 'install-local');
const tmpDir = path.resolve(os.tmpdir(), 'local-installer-it');
const tmpFolder = (name: string) => path.resolve(tmpDir, name);

describe('install-local cli', () => {
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
    await rimraf(tmpDir);
    await fs.mkdir(tmpDir);
    await Promise.all([
      packages.one.writePackage(),
      packages.two.writePackage(),
      packages.three.writePackage(),
    ]);
  });
  it('should install 2 packages without changing the package.json', async () => {
    const cmd = `node ${installLocal} ${packages.two.directory} ${packages.three.directory}`;
    await execaCommand(cmd, { cwd: packages.one.directory });
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
    await execaCommand(cmd, { cwd: packages.one.directory });
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
    await execaCommand(`node ${installLocal}`, {
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
    await execaCommand(`node ${installLocal} --target-siblings`, {
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
    await execaCommand(`node ${installLocal}`, {
      cwd: packages.one.directory,
    });
  });
  it('should support pnpm', async () => {
    // Arrange
    packages.one.packageJson.localDependencies = {
      two: '../two',
    };
    packages.two.packageJson.version = '1.0.0';
    packages.one.pnpmLock = emptyPnpmLockFile;
    await Promise.all([
      packages.one.writePackage(),
      packages.two.writePackage(),
    ]);
    await execaCommand('pnpm add -E typed-inject@5.0.0', {
      cwd: packages.one.directory,
    });
    const expectedLink = await fs.readlink(
      path.resolve(packages.one.directory, 'node_modules', 'typed-inject'),
    );
    expect(expectedLink).to.contain(
      path.join('.pnpm', 'typed-inject@5.0.0', 'node_modules', 'typed-inject'),
    ); // verify arrange
    const expectedPnpmLock = await packages.one.readFile('pnpm-lock.yaml');

    // Act
    await execaCommand(`node ${installLocal}`, {
      cwd: packages.one.directory,
    });

    // Assert
    const installed = await packages.one.readdir('node_modules');
    expect(installed).to.deep.eq(['two', 'typed-inject']);
    const actualLink = await fs.readlink(
      path.resolve(packages.one.directory, 'node_modules', 'typed-inject'),
    );
    expect(actualLink).to.eq(expectedLink); // verify arrange
    expect(await packages.one.readFile('pnpm-lock.yaml')).to.eq(
      expectedPnpmLock,
    );
    const actualPackageOne = JSON.parse(
      await packages.one.readFile('package.json'),
    ) as PackageJson;
    expect(actualPackageOne.dependencies).deep.eq({
      'typed-inject': '5.0.0',
    });
    expect(actualPackageOne.devDependencies).to.be.undefined;
    expect(actualPackageOne.localDependencies).to.deep.eq({
      two: '../two',
    });
  });
});

class PackageHelper implements Package {
  private name;
  public directory: string;
  public packageJson: PackageJson;
  public packageLock: Record<string, unknown> | undefined;
  public pnpmLock: string | undefined;
  constructor(name: string) {
    this.name = name;
    this.directory = tmpFolder(name);
    this.packageJson = {
      name,
      version: '0.0.0',
    };
  }
  public async readdir(dir: string) {
    const files = await fs.readdir(path.resolve(this.directory, dir));
    return files.filter((f) => !f.startsWith('.'));
  }
  public readFile(file: string) {
    return fs.readFile(path.resolve(this.directory, file), 'utf8');
  }
  public async writePackage() {
    await rimraf(this.directory);
    await fs.mkdir(this.directory);
    return await Promise.all([
      fs.writeFile(
        path.resolve(this.directory, 'package.json'),
        JSON.stringify(this.packageJson, null, 2),
        'utf8',
      ),
      fs.writeFile(path.resolve(this.directory, this.name), '', 'utf8'),
      this.packageLock
        ? fs.writeFile(
            path.resolve(this.directory, 'package-lock.json'),
            JSON.stringify(this.packageLock, null, 2),
            'utf-8',
          )
        : Promise.resolve(),
      this.pnpmLock
        ? fs.writeFile(
            path.resolve(this.directory, 'pnpm-lock.yaml'),
            this.pnpmLock,
            'utf-8',
          )
        : Promise.resolve(),
    ]);
  }
}

const emptyPnpmLockFile = `lockfileVersion: '9.0'

settings:
  autoInstallPeers: true
  excludeLinksFromLockfile: false

importers:

  .: {}
`;
