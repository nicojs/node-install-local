import { validPackageManagers, type PackageManager } from './prober.ts';

export class Options {
  public readonly dependencies: string[];
  public readonly options: string[];

  constructor(argv: string[]) {
    const [, , ...args] = argv;
    this.dependencies = args.filter((arg) => arg.substring(0, 1) !== '-');
    this.options = args.filter((arg) => arg.substring(0, 1) === '-');
  }

  public validate(): Promise<void> {
    if (this.dependencies.length > 0 && this.targetSiblings) {
      return Promise.reject(
        new Error(
          `Invalid use of option --target-siblings. Cannot be used together with a dependency list`,
        ),
      );
    } else if (this.targetSiblings && this.save) {
      return Promise.reject(
        new Error(
          `Invalid use of option --target-siblings. Cannot be used together with --save`,
        ),
      );
    } else if (
      this.packageManager &&
      !validPackageManagers.includes(this.packageManager)
    ) {
      return Promise.reject(
        new Error(
          `Invalid package manager <${this.packageManager}> specified. Please use either 'npm' or 'pnpm'.`,
        ),
      );
    } else {
      return Promise.resolve();
    }
  }

  public get help(): boolean {
    return this.flag('-h', '--help');
  }

  public get targetSiblings(): boolean {
    return this.flag('-T', '--target-siblings');
  }

  public get packageManager(): PackageManager | undefined {
    const pkgOption = this.options.find((opt) => opt.startsWith('--pkg='));
    if (pkgOption) {
      const [, value] = pkgOption.split('=');
      return value as PackageManager;
    }
    return undefined;
  }

  public get save(): boolean {
    return this.flag('-S', '--save');
  }

  private flag(...options: string[]) {
    return options.some((_) => this.options.indexOf(_) >= 0);
  }
}
