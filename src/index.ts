export { LocalInstaller } from './LocalInstaller';
export { progress } from './progress';
export { saveIfNeeded } from './save';
export { readLocalDependencies } from './readLocalDependencies';
export { execute } from './cli';

export interface Package {
    directory: string;
    packageJson: PackageJson;
}

export interface InstallTarget extends Package {
    sources: Package[];
}

export interface PackageJson {
    name: string;
    version: string;
    localDependencies?: Dependencies;
}

export interface Dependencies {
    [name: string]: string;
}
