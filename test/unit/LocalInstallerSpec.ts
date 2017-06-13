import { expect } from 'chai';
import * as child_process from 'mz/child_process';
import * as fs from 'mz/fs';
import * as os from 'os';
import { basename, resolve as r } from 'path';
import * as sinon from 'sinon';
import { LocalInstaller } from './../../src/LocalInstaller';

describe('LocalInstaller install', () => {
    let sut: LocalInstaller;
    let sandbox: sinon.SinonSandbox;
    let readFileStub: sinon.SinonStub;
    let execStub: sinon.SinonStub;
    let unlinkStub: sinon.SinonStub;

    beforeEach(() => {
        sut = new LocalInstaller({ '/a': ['b', 'c'], 'd': ['/e'] });
        sandbox = sinon.sandbox.create();
        execStub = sandbox.stub(child_process, 'exec');
        unlinkStub = sandbox.stub(fs, 'unlink');
        readFileStub = sandbox.stub(fs, 'readFile');
    });

    afterEach(() => sandbox.restore());

    describe('happy flow', () => {

        beforeEach(() => {
            stubPackageJson('/a', 'b', 'c', 'd', '/e');
            execStub.resolves();
            unlinkStub.resolves();
        });

        it('should pack correct packages', async () => {
            await sut.install();
            expect(execStub).calledWith(`npm pack ${r('b')}`, { cwd: os.tmpdir() });
            expect(execStub).calledWith(`npm pack ${r('c')}`, { cwd: os.tmpdir() });
            expect(execStub).calledWith(`npm pack ${r('/e')}`, { cwd: os.tmpdir() });
        });

        it('should install correct packages', async () => {
            await sut.install();
            expect(execStub).calledWith(`npm i --no-save ${r(os.tmpdir(), 'b-0.0.1.tgz')} ${r(os.tmpdir(), 'c-0.0.2.tgz')}`,
                { cwd: r('/a') });
            expect(execStub).calledWith(`npm i --no-save ${r(os.tmpdir(), 'e-0.0.4.tgz')}`,
                { cwd: r('d') });
        });

        it('should emit all events', async () => {
            const installTargetsIdentified = sinon.spy();
            const installStart = sinon.spy();
            const installed = sinon.spy();
            const packingStart = sinon.spy();
            const packed = sinon.spy();
            const installEnd = sinon.spy();
            const packingEnd = sinon.spy();
            sut.on('install_targets_identified', installTargetsIdentified);
            sut.on('install_start', installStart);
            sut.on('installed', installed);
            sut.on('packing_start', packingStart);
            sut.on('packed', packed);
            sut.on('packing_end', packingEnd);
            sut.on('install_end', installEnd);
            await sut.install();
            expect(installTargetsIdentified).callCount(1);
            expect(installStart).callCount(1);
            expect(installed).callCount(2);
            expect(packingStart).callCount(1);
            expect(packed).callCount(3);
            expect(installEnd).callCount(1);
            expect(packingEnd).callCount(1);
        });
    });

    describe('when readFile errors', () => {
        it('should propagate the error', () => {
            readFileStub.rejects(new Error('file error'));
            return expect(sut.install()).to.eventually.rejectedWith('file error');
        });
    });

    describe('when packing errors', () => {

        beforeEach(() => {
            stubPackageJson('/a', 'b', 'c', 'd', '/e');
        });

        it('should propagate the error', () => {
            execStub.rejects(new Error('error'));
            return expect(sut.install()).to.eventually.rejectedWith('error');
        });
    });

    describe('when installing errors', () => {
        beforeEach(() => {
            stubPackageJson('/a', 'b', 'c', 'd', '/e');
            stubPack('b', 'c', '/e');
        });

        it('should propagate the error', () => {
            execStub.rejects(new Error('install err'));
            return expect(sut.install()).to.eventually.rejectedWith('install err');
        });
    });

    const stubPackageJson = (...directories: string[]) => {
        directories.forEach((directory, i) => {
            readFileStub.withArgs(r(directory, 'package.json')).resolves(JSON.stringify({
                name: basename(directory),
                version: `0.0.${i}`
            }));
        });
    };

    const stubPack = (...directories: string[]) => {
        directories.forEach(directory => {
            execStub.withArgs(`npm pack ${r(directory)}`).resolves();
        });
    };
});
