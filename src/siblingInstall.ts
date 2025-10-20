import { promises as fs } from 'fs';
import path from 'path';
import { helpers } from './helpers.ts';
import { type ListByPackage, type Package, LocalInstaller } from './index.ts';
import { progressReporter } from './progress.ts';

function filterTruthy(values: Array<Package | null>): Package[] {
  return values.filter((v) => v) as Package[];
}

async function readSiblingTargets() {
  const currentDirectoryName = path.basename(process.cwd());
  const dirs = await fs.readdir('..');
  const siblings = dirs
    .filter((dir) => dir !== currentDirectoryName)
    .map((dir) => path.resolve('..', dir));
  const values = await Promise.all(
    siblings.map((directory) =>
      helpers
        .readPackageJson(directory)
        .then((packageJson) => ({ directory, packageJson }))
        .catch(() => null),
    ),
  );
  return filterTruthy(values);
}

function siblingTargetsCurrent(siblingPackage: Package): boolean {
  const currentDirectory = path.resolve('.');
  return Object.values(siblingPackage.packageJson.localDependencies ?? {}).some(
    (localDependencyPath) =>
      path.resolve(localDependencyPath) === currentDirectory,
  );
}

export const siblingInstaller = {
  async install(): Promise<void> {
    const siblings = await readSiblingTargets();
    const targets = siblings.filter(siblingTargetsCurrent);
    const sourceByTarget: ListByPackage = {};
    targets.forEach((target) => (sourceByTarget[target.directory] = ['.']));
    const installer = new LocalInstaller(sourceByTarget);
    progressReporter.report(installer);
    await installer.install();
  },
};
