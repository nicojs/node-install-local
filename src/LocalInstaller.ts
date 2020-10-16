import flatMap from 'lodash.flatmap';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import { readPackageJson } from './helpers';
import { InstallTarget, PackageJson } from './index';
import { exec, del, getRandomTmpDir } from './utils';
import type { Options as ExecaOptions } from 'execa';

interface PackageByDirectory {
  [directory: string]: PackageJson;
}

export interface Env {
  [name: string]: string;
}

export interface Options {
  npmEnv?: Env;
}

export interface ListByPackage {
  [key: string]: string[];
}

const TEN_MEGA_BYTE = 1024 * 1024 * 10;

interface EventMap {
  install_targets_identified: [InstallTarget[]];
  install_start: [ListByPackage];
  installed: [pkg: string, stdout: string, stderr: string];
  packing_start: [allSources: string[]];
  packed: [location: string];
  packing_end: [];
  install_end: [];
}

export class LocalInstaller extends EventEmitter {
  private sourcesByTarget: ListByPackage;
  private options: Options;
  private uniqueDir: string;

  constructor(sourcesByTarget: ListByPackage, options?: Options) {
    super();

    this.sourcesByTarget = resolve(sourcesByTarget);
    this.options = Object.assign({}, options);
    this.uniqueDir = getRandomTmpDir('node-local-install-');
  }

  public on<TEventName extends keyof EventMap>(
    event: TEventName,
    listener: (...args: EventMap[TEventName]) => void,
  ): this {
    // @ts-expect-error the 'listener' here is reduced to `never`
    return super.on(event, listener);
  }

  public emit<TEventName extends keyof EventMap>(
    event: TEventName,
    ...args: EventMap[TEventName]
  ): boolean {
    return super.emit(event, ...args);
  }

  public async install(): Promise<InstallTarget[]> {
    await this.createTmpDirectory(this.uniqueDir);

    const packages = await this.resolvePackages();
    const installTargets = this.identifyInstallTargets(packages);

    await this.packAll();
    await this.installAll(installTargets);
    await this.removeTmpDirectory();

    return installTargets;
  }

  public async createTmpDirectory(tmpDir: string): Promise<void> {
    return fs.mkdir(tmpDir);
  }

  private async installAll(installTargets: InstallTarget[]): Promise<void> {
    this.emit('install_start', this.sourcesByTarget);
    await Promise.all(installTargets.map((target) => this.installOne(target)));
    this.emit('install_end');
  }

  private async installOne(target: InstallTarget): Promise<void> {
    const toInstall = target.sources.map((source) =>
      resolvePackFile(this.uniqueDir, source.packageJson),
    );
    const options: ExecaOptions<string> = {
      cwd: target.directory,
      maxBuffer: TEN_MEGA_BYTE,
      env: this.options.npmEnv,
    };
    const { stdout, stderr } = await exec(
      'npm',
      ['i', '--no-save', '--no-package-lock', ...toInstall],
      options,
    );
    this.emit(
      'installed',
      target.packageJson.name,
      stdout.toString(),
      stderr.toString(),
    );
  }

  private async resolvePackages(): Promise<PackageByDirectory> {
    const uniqueDirectories = new Set(
      Object.keys(this.sourcesByTarget).concat(
        flatMap(
          Object.keys(this.sourcesByTarget),
          (target) => this.sourcesByTarget[target],
        ),
      ),
    );
    const allPackages = Promise.all(
      Array.from(uniqueDirectories).map((directory) =>
        readPackageJson(directory).then((packageJson) => ({
          directory,
          packageJson,
        })),
      ),
    );
    const packages = await allPackages;
    const packageByDirectory: PackageByDirectory = {};
    packages.forEach(
      (pkg) => (packageByDirectory[pkg.directory] = pkg.packageJson),
    );
    return packageByDirectory;
  }

  private identifyInstallTargets(
    packages: PackageByDirectory,
  ): InstallTarget[] {
    const installTargets = Object.keys(this.sourcesByTarget).map((target) => ({
      directory: target,
      packageJson: packages[target],
      sources: this.sourcesByTarget[target].map((source) => ({
        directory: source,
        packageJson: packages[source],
      })),
    }));
    this.emit('install_targets_identified', installTargets);
    return installTargets;
  }

  private async packAll(): Promise<void> {
    const allSources = Array.from(
      new Set(
        flatMap(
          Object.keys(this.sourcesByTarget),
          (target) => this.sourcesByTarget[target],
        ),
      ),
    );
    this.emit('packing_start', allSources);
    await Promise.all(allSources.map((source) => this.packOne(source)));
    this.emit('packing_end');
  }

  private async packOne(directory: string): Promise<void> {
    await exec('npm', ['pack', directory], {
      cwd: this.uniqueDir,
      maxBuffer: TEN_MEGA_BYTE,
    });
    this.emit('packed', directory);
  }

  private removeTmpDirectory(): Promise<void> {
    return del(this.uniqueDir);
  }
}

function resolvePackFile(dir: string, pkg: PackageJson) {
  // Don't forget about scoped packages
  const scopeIndex = pkg.name.indexOf('@');
  const slashIndex = pkg.name.indexOf('/');
  if (scopeIndex === 0 && slashIndex > 0) {
    // @s/b -> s-b-x.x.x.tgz
    return path.resolve(
      dir,
      `${pkg.name.substr(1, slashIndex - 1)}-${pkg.name.substr(
        slashIndex + 1,
      )}-${pkg.version}.tgz`,
    );
  } else {
    // b -> b-x.x.x.tgz
    return path.resolve(dir, `${pkg.name}-${pkg.version}.tgz`);
  }
}

export function resolve(packagesByTarget: ListByPackage): ListByPackage {
  const resolvedPackages: ListByPackage = {};
  Object.keys(packagesByTarget).forEach((localTarget) => {
    resolvedPackages[path.resolve(localTarget)] = Array.from(
      new Set(packagesByTarget[localTarget].map((pkg) => path.resolve(pkg))),
    );
  });
  return resolvedPackages;
}
