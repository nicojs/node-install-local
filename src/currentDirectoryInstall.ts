import { helpers } from './helpers.ts';
import { LocalInstaller } from './LocalInstaller.ts';
import { Options } from './Options.ts';
import { progressReporter } from './progress.ts';
import { storage } from './save.ts';

export const currentDirectoryInstaller = {
  install: async (options: Options): Promise<void> => {
    const localDependencies = await readLocalDependencies(options.dependencies);
    const installer = new LocalInstaller(
      {
        [process.cwd()]: localDependencies,
      },
      { packageManager: options.packageManager },
    );
    progressReporter.report(installer);
    const targets = await installer.install();
    await storage.saveIfNeeded(targets, options);
  },
};

async function readLocalDependencies(
  dependenciesFromArguments: string[],
): Promise<string[]> {
  if (dependenciesFromArguments.length) {
    return dependenciesFromArguments;
  } else {
    const pkg = await helpers.readPackageJson('.');
    if (pkg.localDependencies) {
      return Object.values(pkg.localDependencies);
    } else {
      return [];
    }
  }
}
