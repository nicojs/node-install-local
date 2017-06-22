import { expect } from 'chai';
import * as fs from 'mz/fs';
import * as path from 'path';
import * as sinon from 'sinon';
import { saveIfNeeded } from '../../src/save';
import { InstallTarget } from './../../src/index';
import { Options } from './../../src/Options';

describe('saveIfNeeded', () => {

    let sut: (targets: InstallTarget[]) => Promise<void>;
    let sandbox: sinon.SinonSandbox;
    let writeFileStub: sinon.SinonStub;
    let input: InstallTarget[];

    beforeEach(() => {
        input = [{
            sources: [{
                directory: 'a',
                packageJson: {
                    name: 'a',
                    version: '0.0.1'
                }
            }],
            directory: 't',
            packageJson: {
                name: 't',
                version: '0.0.2'
            }
        }];
        sandbox = sinon.sandbox.create();
        writeFileStub = sandbox.stub(fs, 'writeFile');
    });

    afterEach(() => sandbox.restore());

    describe('when no option to save', () => {
        beforeEach(() => {
            sut = saveIfNeeded(new Options([]));
        });

        it('should not do anything', async () => {
            await sut(input);
            expect(writeFileStub).to.not.have.been.called;
        });
    });

    describe('when --save is in the options', () => {

        beforeEach(() => {
            sut = saveIfNeeded(new Options(['node', 'install-local', '--save']));
        });

        it('should write "localDependencies" to package.json', async () => {
            const expectedContent = JSON.stringify({ name: 't', version: '0.0.2', localDependencies: { a: '../a' } }, null, 2);
            await sut(input);
            expect(writeFileStub).to.have.been.calledWith(path.resolve(input[0].directory, 'package.json'), expectedContent, { encoding: 'utf8' });
            expect(writeFileStub).to.have.been.calledOnce;
        });

        it('should override any localDependency with the same name, and leave others be', async () => {
            const expectedContent = JSON.stringify({ name: 't', version: '0.0.2', localDependencies: { a: '../a', b: 'b' } }, null, 2);
            input[0].packageJson.localDependencies = { a: '', b: 'b' };
            await sut(input);
            expect(writeFileStub).to.have.been.calledWith(path.resolve(input[0].directory, 'package.json'), expectedContent, { encoding: 'utf8' });
            expect(writeFileStub).to.have.been.calledOnce;
        });

        it('should not write anything if the desired state is already in "localDependencies"', async () => {
            input[0].packageJson.localDependencies = { a: '../a' };
            await sut(input);
            expect(writeFileStub).to.not.have.been.called;
        });
    });
});
