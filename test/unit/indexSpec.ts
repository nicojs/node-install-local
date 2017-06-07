import { expect } from 'chai';
import * as path from 'path';
import { mapToPackagesBySource } from '../../src/index';

describe('mapToPackagesBySource', () => {

    it('should map { "../..": "..", "__dirname": ".."} to one and the same', () => {
        const input = {
            [__dirname + '/./']: ['..'],
            [__dirname]: ['..']
        };
        const result = mapToPackagesBySource(input);
        expect(result).to.deep.eq({ [path.resolve('..')]: [path.resolve(__dirname)] });
    });

    it('should map { ".": ["./stryker", "./stryker-api"], "../sibling": ["./stryker", "./stryker-api"] } to 2 records', () => {
        const input = {
            '.': ['./stryker', './stryker-api'],
            '../sibling': ['./stryker', './stryker-api']
        };
        const result = mapToPackagesBySource(input);
        expect(result).to.deep.eq({
            [path.resolve('./stryker')]: [path.resolve('.'), path.resolve('../sibling')],
            [path.resolve('./stryker-api')]: [path.resolve('.'), path.resolve('../sibling')]
        });
    });
});
