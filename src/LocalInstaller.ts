import { EventEmitter } from 'events';
import * as _ from 'lodash';
import { exec, ExecOptions } from 'mz/child_process';
import * as fs from 'mz/fs';
import * as os from 'os';
import * as path from 'path';
import { readPackageJson } from './helpers';
import { InstallTarget, PackageJson } from './index';

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

export class LocalInstaller extends EventEmitter {

    private sourcesByTarget: ListByPackage;
    private options: Options;

    constructor(sourcesByTarget: ListByPackage, options?: Options) {
        super();
        this.sourcesByTarget = resolve(sourcesByTarget);
        if (options) {
            this.options = Object.assign({}, options);
        } else {
            this.options = {};
        }
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
        const packages = await this.resolvePackages();
        const installTargets = this.identifyInstallTargets(packages);
        const packedSources = await this.packAll();
        await this.installAll(installTargets);
        await this.removeAllPackedTarballs(packedSources, packages);
        return installTargets;
    }

    private installAll(installTargets: InstallTarget[]): Promise<void> {
        this.emit('install_start', this.sourcesByTarget);
        return Promise.all(installTargets.map(target => this.installOne(target)))
            .then(() => void this.emit('install_end'));
    }

    private installOne(target: InstallTarget): Promise<void> {
        const toInstall = target.sources.map(source => resolvePackFile(source.packageJson)).join(' ');
        const options: ExecOptions = { cwd: target.directory };
        if (this.options.npmEnv) {
            options.env = this.options.npmEnv;
        }
        return exec(`npm i --no-save ${toInstall}`, options).then(([stdout, stderr]) =>
            void this.emit('installed', target.packageJson.name, stdout.toString(), stderr.toString()));
    }

    private resolvePackages(): Promise<PackageByDirectory> {
        const uniqueDirectories = _.uniq(Object.keys(this.sourcesByTarget)
            .concat(_.flatMap(Object.keys(this.sourcesByTarget), target => this.sourcesByTarget[target])));
        const allPackages = Promise.all(uniqueDirectories.map(directory => readPackageJson(directory).then(packageJson => ({ directory, packageJson }))));
        return allPackages.then(packages => {
            const packageByDirectory: PackageByDirectory = {};
            packages.forEach(pkg => packageByDirectory[pkg.directory] = pkg.packageJson);
            return packageByDirectory;
        });
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

    private packAll() {
        const allSources = _.uniq(_.flatMap(Object.keys(this.sourcesByTarget), target => this.sourcesByTarget[target]));
        this.emit('packing_start', allSources);
        return Promise.all(allSources.map(source => this.packOne(source)))
            .then(() => this.emit('packing_end'))
            .then(() => allSources);
    }

    private packOne(directory: string): Promise<void> {
        return exec(`npm pack ${directory}`, { cwd: os.tmpdir() })
            .then(() => void this.emit('packed', directory));
    }

    private removeAllPackedTarballs(allSources: string[], packages: PackageByDirectory): Promise<void[]> {
        const allSourcePackages = allSources
            .map(source => path.resolve(resolvePackFile(packages[source])));
        return Promise.all(allSourcePackages.map(del));
    }
}

function resolvePackFile(pkg: PackageJson) {
    // Don't forget about scoped packages
    const scopeIndex = pkg.name.indexOf('@');
    const slashIndex = pkg.name.indexOf('/');
    if (scopeIndex === 0 && slashIndex > 0) {
        // @s/b -> s-b-x.x.x.tgz
        return path.resolve(os.tmpdir(), `${pkg.name.substr(1, slashIndex - 1)}-${pkg.name.substr(slashIndex + 1)}-${pkg.version}.tgz`);
    } else {
        // b -> b-x.x.x.tgz
        return path.resolve(os.tmpdir(), `${pkg.name}-${pkg.version}.tgz`);
    }
}

export function resolve(packagesByTarget: ListByPackage) {
    const resolvedPackages: ListByPackage = {};
    Object.keys(packagesByTarget).forEach(localTarget => {
        resolvedPackages[path.resolve(localTarget)] = _.uniq(packagesByTarget[localTarget].map(pkg => path.resolve(pkg)));
    });
    return resolvedPackages;
}

function del(file: string): Promise<void> {
    return fs.unlink(file);
}
