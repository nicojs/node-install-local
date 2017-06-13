import * as fs from 'mz/fs';
import * as path from 'path';
import { Dependencies, InstallTarget, Package } from './index';

export function saveIfNeeded(options: string[]): (targets: InstallTarget[]) => Promise<void> {
    return targets => {
        if (options.indexOf('-S') >= 0 || options.indexOf('--save') >= 0) {
            return Promise.all(targets.map(save)).then(() => undefined);
        } else {
            return Promise.resolve();
        }
    };
}

function save(target: InstallTarget) {
    const dependencies = target.packageJson.localDependencies || (target.packageJson.localDependencies = {});
    const dependenciesBefore = Object.assign({}, dependencies);
    target.sources.sort((a, b) => a.directory.localeCompare(b.directory))
        .forEach(source => dependencies[source.packageJson.name] = path.relative(target.directory, source.directory).replace(/\\/g, '/'));
    if (equals(dependencies, dependenciesBefore)) {
        return Promise.resolve();
    } else {
        return savePackageJson(target);
    }
}

function savePackageJson(target: Package) {
    return fs.writeFile(path.resolve(target.directory, 'package.json'), JSON.stringify(target.packageJson, undefined, 2), { encoding: 'utf8' });
}

function equals(a: Dependencies, b: Dependencies) {
    const aNames = sortedNames(a);
    const bNames = sortedNames(b);
    if (aNames.length === bNames.length) {
        while (aNames.length) {
            if (!equalDependency(aNames.pop(), bNames.pop(), a, b)) {
                return false;
            }
        }
        return true;
    }
    return false;
}

function equalDependency(aKey: string | undefined, bKey: string | undefined, aDeps: Dependencies, bDeps: Dependencies) {
    return aKey === bKey && aKey && bKey && aDeps[aKey] === bDeps[bKey];
}

function sortedNames(subject: Dependencies) {
    return Object.keys(subject).sort();
}
