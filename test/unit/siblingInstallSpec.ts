import { expect } from 'chai';
import * as fs from 'mz/fs';
import * as path from 'path';
import * as sinon from 'sinon';
import * as helpers from '../../src/helpers';
import * as index from '../../src/index';
import { siblingInstall } from '../../src/siblingInstall';

describe('siblingInstall', () => {

    let sandbox: sinon.SinonSandbox;
    let readdirStub: sinon.SinonStub;
    let readPackageJson: sinon.SinonStub;
    let localInstallStub: { install: sinon.SinonStub };

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        localInstallStub = { install: sandbox.stub() };
        readdirStub = sandbox.stub(fs, 'readdir');
        readPackageJson = sandbox.stub(helpers, 'readPackageJson');
        sandbox.stub(index, 'progress');
        sandbox.stub(index, 'LocalInstaller').returns(localInstallStub);
    });

    afterEach(() => sandbox.restore());

    it('should install packages from sibling dirs if they exist', async () => {
        // Arrange
        const currentDirName = path.basename(process.cwd());
        readdirStub.resolves(['a', 'b', 'c', 'd']);
        const siblings = {
            a: path.resolve('..', 'a'),
            b: path.resolve('..', 'b'),
            c: path.resolve('..', 'c'),
            d: path.resolve('..', 'd')
        };
        readPackageJson
            .withArgs(siblings.a).resolves({ localDependencies: { someName: `../${currentDirName}` } })
            .withArgs(siblings.b).rejects()
            .withArgs(siblings.c).resolves({ localDependencies: { someOtherName: process.cwd() } })
            .withArgs(siblings.d).resolves({ localDependencies: { someOtherName: 'some/other/localDep' } });
        localInstallStub.install.resolves();

        // Act
        await siblingInstall();

        // Assert
        expect(index.LocalInstaller).calledWith({ [siblings.a]: ['.'], [siblings.c]: ['.'] });
        expect(index.LocalInstaller).calledWithNew;
        expect(localInstallStub.install).called;
        expect(index.progress).calledWith(localInstallStub);
    });

    it('should reject when install rejects', () => {
        // Arrange
        readdirStub.resolves(['a']);
        readPackageJson.resolves({ localDependencies: { b: process.cwd() } });
        localInstallStub.install.rejects(new Error('some error'));
        return expect(siblingInstall()).rejectedWith('some error');
    });
});
