import { promises as fs } from 'fs';
import path from 'path';
import {
  type Dependencies,
  type InstallTarget,
  Options,
  type Package,
} from './index.ts';

export const storage = { saveIfNeeded };

async function saveIfNeeded(
  targets: InstallTarget[],
  options: Options,
): Promise<void> {
  if (options.save) {
    await Promise.all(targets.map(save));
  }
}

async function save(target: InstallTarget) {
  const dependencies =
    target.packageJson.localDependencies ||
    (target.packageJson.localDependencies = {});
  const dependenciesBefore = Object.assign({}, dependencies);

  const from = await fs.realpath(target.directory);
  const sources = await Promise.all(
    target.sources.map(async (source) => {
      return {
        ...source,
        directory: await fs.realpath(source.directory),
      };
    }),
  );

  sources
    .sort((a, b) => a.directory.localeCompare(b.directory))
    .forEach(
      (source) =>
        (dependencies[source.packageJson.name] = path
          .relative(from, source.directory)
          .replace(/\\/g, '/')),
    );
  if (!equals(dependencies, dependenciesBefore)) {
    await savePackageJson(target);
  }
}

async function savePackageJson(target: Package) {
  await fs.writeFile(
    path.resolve(target.directory, 'package.json'),
    JSON.stringify(target.packageJson, undefined, 2),
    { encoding: 'utf8' },
  );
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

function equalDependency(
  aKey: string | undefined,
  bKey: string | undefined,
  aDeps: Dependencies,
  bDeps: Dependencies,
) {
  return aKey === bKey && aKey && bKey && aDeps[aKey] === bDeps[bKey];
}

function sortedNames(subject: Dependencies) {
  return Object.keys(subject).sort();
}
