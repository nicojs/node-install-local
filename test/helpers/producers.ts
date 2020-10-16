import { Options, PackageJson } from './../../src/index';

export function options(overrides?: Partial<Options>): Options {
  const defaults = new Options([]);
  return Object.assign({}, defaults, overrides);
}

export function packageJson(overrides?: Partial<PackageJson>): PackageJson {
  return {
    name: 'name',
    version: '0.0.1',
    ...overrides,
  };
}
