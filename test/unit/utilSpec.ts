import { expect } from 'chai';
import * as os from 'os';
import * as path from 'path';
import { getRandomTmpDir } from '../../src/utils';

describe('Utils', () => {
    it('should return a random directory inside the OS tmp dir', () => {
        const prefix = 'some-prefix-';
        const expectedPath = path.resolve(os.tmpdir(), prefix);

        // Match expected path followed by an unique id
        expect(getRandomTmpDir(prefix)).to.match(new RegExp(`^${ expectedPath }.*`));
    });
});
