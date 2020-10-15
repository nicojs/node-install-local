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

    public on(event: 'install_targets_identified', listener: (installTargets: InstallTarget[]) => void): void;
    public on(event: 'install_start', listener: (toInstall: ListByPackage) => void): this;
    public on(event: 'installed', listener: (pkg: string, stdout: string, stderr: string) => void): this;
    public on(event: 'packing_start', listener: (allSources: string[]) => void): this;
    public on(event: 'packed', listener: (location: string) => void): this;
    public on(event: 'packing_end' | 'install_end', listener: () => void): this;
    public on(event: string, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    public emit(event: 'install_targets_identified', installTargets: InstallTarget[]): boolean;
    public emit(event: 'install_start', toInstall: ListByPackage): boolean;
    public emit(event: 'installed', pkg: string, stdout: string, stderr: string): boolean;
    public emit(event: 'packing_start', allSources: string[]): boolean;
    public emit(event: 'packed', location: string): boolean;
    public emit(event: 'packing_end' | 'install_end'): boolean;
    public emit(event: string, ...args: any[]): boolean {
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

    public async createTmpDirectory(tmpDir: string) {
        return fs.mkdir(tmpDir);
    }

    private async installAll(installTargets: InstallTarget[]): Promise<void> {
        this.emit('install_start', this.sourcesByTarget);
        await Promise.all(installTargets.map(target => this.installOne(target)));
        this.emit('install_end');
    }

    private async installOne(target: InstallTarget): Promise<void> {
        const toInstall = target.sources
            .map(source => resolvePackFile(this.uniqueDir, source.packageJson));
        const options: ExecaOptions<string> = {
            cwd: target.directory,
            maxBuffer: TEN_MEGA_BYTE,
            env: this.options.npmEnv
        };
        const { stdout, stderr } = await exec('npm', ['i', '--no-save', ...toInstall], options);
        this.emit('installed', target.packageJson.name, stdout.toString(), stderr.toString());
    }

    private async resolvePackages(): Promise<PackageByDirectory> {
        const uniqueDirectories = new Set(Object.keys(this.sourcesByTarget).concat(flatMap(Object.keys(this.sourcesByTarget), target => this.sourcesByTarget[target])));
        const allPackages = Promise.all(Array.from(uniqueDirectories).map(directory => readPackageJson(directory).then(packageJson => ({ directory, packageJson }))));
        const packages = await allPackages;
        const packageByDirectory: PackageByDirectory = {};
        packages.forEach(pkg => packageByDirectory[pkg.directory] = pkg.packageJson);
        return packageByDirectory;
    }

    private identifyInstallTargets(packages: PackageByDirectory): InstallTarget[] {
        const installTargets = Object.keys(this.sourcesByTarget).map(target => ({
            directory: target,
            packageJson: packages[target],
            sources: this.sourcesByTarget[target].map(source => ({
                directory: source,
                packageJson: packages[source]
            }))
        }));
        this.emit('install_targets_identified', installTargets);
        return installTargets;
    }

    private async packAll(): Promise<void> {
        const allSources = Array.from(new Set(flatMap(Object.keys(this.sourcesByTarget), target => this.sourcesByTarget[target])));
        this.emit('packing_start', allSources);
        await Promise.all(allSources.map(source => this.packOne(source)));
        this.emit('packing_end');
    }

    private async packOne(directory: string): Promise<void> {
        await exec('npm', ['pack', directory], { cwd: this.uniqueDir, maxBuffer: TEN_MEGA_BYTE });
        this.emit('packed', directory);
    }

    private removeTmpDirectory(): void {
        del(this.uniqueDir);
    }
}

function resolvePackFile(dir: string, pkg: PackageJson) {
    // Don't forget about scoped packages
    const scopeIndex = pkg.name.indexOf('@');
    const slashIndex = pkg.name.indexOf('/');
    if (scopeIndex === 0 && slashIndex > 0) {
        // @s/b -> s-b-x.x.x.tgz
        return path.resolve(dir, `${pkg.name.substr(1, slashIndex - 1)}-${pkg.name.substr(slashIndex + 1)}-${pkg.version}.tgz`);
    } else {
        // b -> b-x.x.x.tgz
        return path.resolve(dir, `${pkg.name}-${pkg.version}.tgz`);
    }
}

export function resolve(packagesByTarget: ListByPackage) {
    const resolvedPackages: ListByPackage = {};
    Object.keys(packagesByTarget).forEach(localTarget => {
        resolvedPackages[path.resolve(localTarget)] = Array.from(new Set(packagesByTarget[localTarget].map(pkg => path.resolve(pkg))));
    });
    return resolvedPackages;
}
