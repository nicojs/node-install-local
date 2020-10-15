import { expect } from 'chai';
import { promises as fs} from 'fs';
import os from 'os';
import path from 'path';
import * as utils from '../../src/utils';

describe('utils integration', () => {

    it('should be able to delete directories', async () => {
        const dir = path.resolve(os.tmpdir(), 'utils_integration');
        await fs.mkdir(dir);
        await fs.writeFile(path.resolve(dir, 'file.js'), 'console.log("hello world")', 'utf8');
        await utils.del(dir);
        await expect(fs.access(dir)).rejected;
    });

    it('should be able to delete a file', async () => {
        const file = path.resolve(os.tmpdir(), 'file.js');
        await fs.writeFile(file, 'console.log("hello world")', 'utf8');
        await utils.del(file);
        await expect(fs.access(file)).rejected;
    });
});
