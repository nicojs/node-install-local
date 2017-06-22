export { ListByPackage, LocalInstaller } from './LocalInstaller';
export { progress } from './progress';
export { saveIfNeeded } from './save';
export { currentDirectoryInstall } from './currentDirectoryInstall';
export { siblingInstall } from './siblingInstall';
export { execute } from './executor';
export { cli } from './cli';
export { Options } from './Options';

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
