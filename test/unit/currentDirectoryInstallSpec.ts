import { expect } from 'chai';
import sinon from 'sinon';
import { currentDirectoryInstall } from '../../src/currentDirectoryInstall';
import * as helpers from '../../src/helpers';
import * as index from '../../src/index';
import { options, packageJson } from '../helpers/producers';

describe('currentDirectoryInstall', () => {

    let localInstallerStub: { install: sinon.SinonStub };
    let progressStub: sinon.SinonStub<[index.LocalInstaller, (NodeJS.WriteStream | undefined)?], void>;
    let saveIfNeededStub: sinon.SinonStub<[index.Options], (targets: index.InstallTarget[]) => Promise<void>>;
    let readPackageJsonStub: sinon.SinonStub<[string], Promise<index.PackageJson>>;

    beforeEach(() => {
        localInstallerStub = { install: sinon.stub() };
        sinon.stub(index, 'LocalInstaller').returns(localInstallerStub);
        saveIfNeededStub = sinon.stub(index, 'saveIfNeeded');
        progressStub = sinon.stub(index, 'progress');
        readPackageJsonStub = sinon.stub(helpers, 'readPackageJson');
    });

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

    it('should not install anything when no arguments nor local dependencies are provided', async () => {
        localInstallerStub.install.resolves();
        readPackageJsonStub.resolves(packageJson({}));
        const expectedOptions = options({ dependencies: [] });
        await currentDirectoryInstall(expectedOptions);
        expect(index.LocalInstaller).calledWith({ '.': [] });
        expect(index.LocalInstaller).calledWithNew;
        expect(localInstallerStub.install).called;
        expect(progressStub).to.have.been.calledWith(localInstallerStub);
        expect(readPackageJsonStub).to.have.been.calledWith('.');
        expect(saveIfNeededStub).to.have.been.calledWith(expectedOptions);
    });
});
