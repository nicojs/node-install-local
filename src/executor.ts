import { currentDirectoryInstaller } from './currentDirectoryInstall.ts';
import { Options } from './index.ts';
import { siblingInstaller } from './siblingInstall.ts';

export function execute(options: Options): Promise<void> {
  if (options.targetSiblings) {
    return siblingInstaller.install();
  } else {
    return currentDirectoryInstaller.install(options);
  }
}
