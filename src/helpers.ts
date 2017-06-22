import * as fs from 'mz/fs';
import * as path from 'path';
import { PackageJson } from './index';

export function readPackageJson(from: string): Promise<PackageJson> {
    return fs.readFile(path.join(from, 'package.json'), 'utf8').then(content => JSON.parse(content) as PackageJson);
}
