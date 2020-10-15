import * as _ from 'lodash';
import { promises as fs} from 'fs';
import path from 'path';
import { readPackageJson } from './helpers';
import { ListByPackage, LocalInstaller, Package, progress } from './index';

function filterTruthy(values: Array<(Package | null)>): Package[] {
    return values.filter(v => v) as Package[];
}

function readSiblingTargets() {
    const currentDirectoryName = path.basename(process.cwd());
    return fs.readdir('..')
        .then(dirs => dirs.filter(dir => dir !== currentDirectoryName))
        .then(dirs => dirs.map(dir => path.resolve('..', dir)))
        .then(dirs => Promise.all(
            dirs.map(directory => readPackageJson(directory)
                .then(packageJson => ({ directory, packageJson }))
                .catch(() => null))
        ))
        .then(filterTruthy);
}

function siblingTargetsCurrent(siblingPackage: Package): boolean {
    const currentDirectory = path.resolve('.');
    return _.values(siblingPackage.packageJson.localDependencies)
        .some(localDependencyPath => path.resolve(localDependencyPath) === currentDirectory);
}

export function siblingInstall(): Promise<void> {
    return readSiblingTargets()
        .then(siblings => siblings.filter(siblingTargetsCurrent))
        .then(targets => {
            const sourceByTarget: ListByPackage = {};
            targets.forEach(target => sourceByTarget[target.directory] = ['.']);
            const installer = new LocalInstaller(sourceByTarget);
            progress(installer);
            return installer.install();
        }).then(() => void 0);
}
