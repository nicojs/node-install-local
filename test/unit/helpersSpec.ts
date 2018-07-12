import { expect } from 'chai';
import * as fs from 'mz/fs';
import * as path from 'path';
import * as sinon from 'sinon';
import { readPackageJson } from '../../src/helpers';

describe('Helpers', () => {
    let sandbox: sinon.SinonSandbox;
    let readFileStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        readFileStub = sandbox.stub(fs, 'readFile');
        readFileStub.resolves('{}');
    });

    afterEach(() => {
        sandbox.restore();
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
