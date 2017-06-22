import { expect } from 'chai';
import * as fs from 'mz/fs';
import * as sinon from 'sinon';
import { currentDirectoryInstall } from '../../src/currentDirectoryInstall';
import * as helpers from '../../src/helpers';
import * as index from '../../src/index';
import { options, packageJson } from '../helpers/producers';

describe('currentDirectoryInstall', () => {

    let sandbox: sinon.SinonSandbox;
    let readFileStub: sinon.SinonStub;
    let localInstallerStub: { install: sinon.SinonStub };
    let progressStub: sinon.SinonStub;
    let saveIfNeededStub: sinon.SinonStub;
    let readPackageJsonStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        readFileStub = sandbox.stub(fs, 'readFile');
        localInstallerStub = { install: sandbox.stub() };
        sandbox.stub(index, 'LocalInstaller').returns(localInstallerStub);
        saveIfNeededStub = sandbox.stub(index, 'saveIfNeeded');
        progressStub = sandbox.stub(index, 'progress');
        readPackageJsonStub = sandbox.stub(helpers, 'readPackageJson');
    });

    afterEach(() => sandbox.restore());

    it('should install the local dependencies if none were provided', async () => {
        localInstallerStub.install.resolves();
        readPackageJsonStub.resolves(packageJson({ localDependencies: { a: '../a', b: '../b' } }));
        const expectedOptions = options({ dependencies: [] });
        await currentDirectoryInstall(expectedOptions);
        expect(index.LocalInstaller).calledWith({ '.': ['../a', '../b'] });
        expect(index.LocalInstaller).calledWithNew;
        expect(localInstallerStub.install).called;
        expect(progressStub).to.have.been.calledWith(localInstallerStub);
        expect(readPackageJsonStub).to.have.been.calledWith('.');
        expect(saveIfNeededStub).to.have.been.calledWith(expectedOptions);
    });

    it('should install given dependencies', async () => {
        localInstallerStub.install.resolves();
        await currentDirectoryInstall(options({ dependencies: ['a', 'b'] }));
        expect(readPackageJsonStub).not.called;
        expect(index.LocalInstaller).calledWith({ '.': ['a', 'b'] });
        expect(localInstallerStub.install).called;
    });

    it('should reject if install rejects', () => {
        readPackageJsonStub.resolves(packageJson());
        localInstallerStub.install.rejects(new Error('some error'));
        expect(currentDirectoryInstall(options())).to.rejectedWith('some error');
    });
});
