import fs from 'mz/fs';
import path from 'path';
import { PackageJson } from './index';

export async function readPackageJson(from: string): Promise<PackageJson> {
    const content = await fs.readFile(path.join(from, 'package.json'), 'utf8');
    return JSON.parse(content) as PackageJson;
}
