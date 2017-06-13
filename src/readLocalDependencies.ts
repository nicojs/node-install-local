import * as _ from 'lodash';
import * as fs from 'mz/fs';
import { PackageJson } from './index';

export function readLocalDependencies(dependenciesFromArguments: string[]): Promise<string[]> {
    if (dependenciesFromArguments.length) {
        return Promise.resolve(dependenciesFromArguments);
    } else {
        return fs.readFile('package.json', 'utf8').then(JSON.parse).then((pkg: PackageJson) => {
            if (pkg.localDependencies) {
                return _.values(pkg.localDependencies);
            } else {
                return [];
            }
        });
    }
}
