import * as _ from 'lodash';
import { readPackageJson } from './helpers';
import { LocalInstaller, PackageJson, progress, saveIfNeeded } from './index';
import { Options } from './Options';

export function currentDirectoryInstall(options: Options) {
    return readLocalDependencies(options.dependencies)
        .then(localDependencies => {
            const installer = new LocalInstaller({ '.': localDependencies });
            progress(installer);
            return installer.install()
                .then(saveIfNeeded(options));
        });
}

function readLocalDependencies(dependenciesFromArguments: string[]): Promise<string[]> {
    if (dependenciesFromArguments.length) {
        return Promise.resolve(dependenciesFromArguments);
    } else {
        return readPackageJson('.').then((pkg: PackageJson) => {
            if (pkg.localDependencies) {
                return _.values(pkg.localDependencies);
            } else {
                return [];
            }
        });
    }
}
