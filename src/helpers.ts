import { promises as fs } from 'fs';
import path from 'path';
import type { PackageJson } from './index.ts';

export const helpers = {
  readPackageJson: async (from: string): Promise<PackageJson> => {
    const content = await fs.readFile(path.join(from, 'package.json'), 'utf8');
    return JSON.parse(content) as PackageJson;
  },
};
