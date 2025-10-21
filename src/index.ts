import { siblingInstaller } from './siblingInstall.ts';
import { currentDirectoryInstaller } from './currentDirectoryInstall.ts';
import { progressReporter } from './progress.ts';
import { storage } from './save.ts';

export { type ListByPackage, LocalInstaller } from './LocalInstaller.ts';
export { execute } from './executor.ts';
export { cli } from './cli.ts';
export { Options } from './Options.ts';
export const saveIfNeeded = storage.saveIfNeeded;
export const siblingInstall = siblingInstaller.install;
export const progress = progressReporter.report;
export const currentDirectoryInstall = currentDirectoryInstaller.install;

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
  devDependencies?: Dependencies;
  dependencies?: Dependencies;
}

export interface Dependencies {
  [name: string]: string;
}
