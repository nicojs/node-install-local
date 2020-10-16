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

  it('should not install additional (dev) dependencies (https://github.com/nicojs/node-install-local/issues/23)', async () => {
    // Arrange
    packages.one.packageJson.localDependencies = {
      two: '../two',
    };
    packages.one.packageJson.devDependencies = {
      typescript: '4.0.3',
    };
    packages.one.packageJson.dependencies = {
      'typed-inject': '3.0.0',
    };
    packages.one.packageLock = {
      name: 'one',
      version: '0.0.0',
      lockfileVersion: 1,
      requires: true,
      dependencies: {
        'typed-inject': {
          version: '3.0.0',
          resolved:
            'https://registry.npmjs.org/typed-inject/-/typed-inject-3.0.0.tgz',
          integrity:
            'sha512-LDuyPsk6mO1R0qpe/rm/4u/6pPgT2Fob5T+u2D/wDlORxqlwtG9oWxruTaFZ6L61kzwWGzSp80soc3UUScHmaQ==',
        },
        typescript: {
          version: '4.0.3',
          resolved:
            'https://registry.npmjs.org/typescript/-/typescript-4.0.3.tgz',
          integrity:
            'sha512-tEu6DGxGgRJPb/mVPIZ48e69xCn2yRmCgYmDugAVwmJ6o+0u1RI18eO7E7WBTLYLaEVVOhwQmcdhQHweux/WPg==',
          dev: true,
        },
      },
    };
    await packages.one.writePackage();

    // Act
    await execa.command(`node ${installLocal}`, {
      cwd: packages.one.directory,
    });

    // Assert
    const installed = await packages.one.readdir('node_modules');
    expect(installed).not.include('typescript');
    expect(installed).not.include('typed-inject');
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
  public packageLock: Record<string, unknown> | undefined;
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
      this.packageLock
        ? fs.writeFile(
            path.resolve(this.directory, 'package-lock.json'),
            JSON.stringify(this.packageLock, null, 2),
            'utf-8',
          )
        : Promise.resolve(),
    ]);
  }
}
