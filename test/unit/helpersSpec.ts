import { expect } from 'chai';
import { promises as fs} from 'fs';
import path from 'path';
import sinon from 'sinon';
import { readPackageJson } from '../../src/helpers';

describe('Helpers', () => {
    let readFileStub: sinon.SinonStub<any, Promise<string>>;

    beforeEach(() => {
        // @ts-expect-error picks the wrong overload
        readFileStub = sinon.stub(fs, 'readFile');
        readFileStub.resolves('{}');
    });

    it('should call fs.readFile with the path and utf8 as arguments when readPackageJson is called', async () => {
        const pathToProject = '/test/path/to/project';

        await readPackageJson(pathToProject);

        expect(readFileStub).calledWith(path.join(pathToProject, 'package.json'), 'utf8');
    });

    it('should convert the content read to a javascript \'PackageJson\' object', async () => {
        readFileStub.resolves('{ "key": "value" }');

        const result = await readPackageJson('/test/path/to/project');

        expect(result).to.deep.equal({ key: 'value' });
    });
});
