import { expect } from 'chai';
import fs from 'mz/fs';
import path from 'path';
import sinon from 'sinon';
import * as helpers from '../../src/helpers';
import * as index from '../../src/index';
import { siblingInstall } from '../../src/siblingInstall';

describe('siblingInstall', () => {

    let readdirStub: sinon.SinonStub<[string | Buffer], Promise<string[]>>;
    let readPackageJson: sinon.SinonStub<[string], Promise<index.PackageJson>>;
    let localInstallStub: { install: sinon.SinonStub };

    beforeEach(() => {
        localInstallStub = { install: sinon.stub() };
        readdirStub = sinon.stub(fs, 'readdir');
        readPackageJson = sinon.stub(helpers, 'readPackageJson');
        sinon.stub(index, 'progress');
        sinon.stub(index, 'LocalInstaller').returns(localInstallStub);
    });

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
            .withArgs(siblings.a).resolves(createPackageJson({ localDependencies: { someName: `../${currentDirName}` } }))
            .withArgs(siblings.b).rejects()
            .withArgs(siblings.c).resolves(createPackageJson({ localDependencies: { someOtherName: process.cwd() } }))
            .withArgs(siblings.d).resolves(createPackageJson({ localDependencies: { someOtherName: 'some/other/localDep' } }));
        localInstallStub.install.resolves();

        // Act
        await siblingInstall();

        // Assert
        expect(readdirStub).calledWith('..');
        expect(index.LocalInstaller).calledWith({ [siblings.a]: ['.'], [siblings.c]: ['.'] });
        expect(index.LocalInstaller).calledWithNew;
        expect(localInstallStub.install).called;
        expect(index.progress).calledWith(localInstallStub);
    });

    it('should reject when install rejects', () => {
        // Arrange
        readdirStub.resolves(['a']);
        readPackageJson.resolves(createPackageJson({ localDependencies: { b: process.cwd() } }));
        localInstallStub.install.rejects(new Error('some error'));
        return expect(siblingInstall()).rejectedWith('some error');
    });

    function createPackageJson(overrides?: Partial<index.PackageJson>): index.PackageJson {
        return {
            name: 'a',
            version: '1.2.0',
            localDependencies: {},
            ...overrides
        };
    }
});
