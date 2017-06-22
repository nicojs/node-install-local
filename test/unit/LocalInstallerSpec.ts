import { expect } from 'chai';
import * as child_process from 'mz/child_process';
import * as fs from 'mz/fs';
import * as os from 'os';
import { resolve } from 'path';
import * as sinon from 'sinon';
import { LocalInstaller } from './../../src/LocalInstaller';

describe('LocalInstaller install', () => {
    let sut: LocalInstaller;
    let sandbox: sinon.SinonSandbox;
    let readFileStub: sinon.SinonStub;
    let execStub: sinon.SinonStub;
    let unlinkStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        execStub = sandbox.stub(child_process, 'exec');
        unlinkStub = sandbox.stub(fs, 'unlink');
        readFileStub = sandbox.stub(fs, 'readFile');
    });

    afterEach(() => sandbox.restore());

    describe('with some normal packages', () => {

        beforeEach(() => {
            sut = new LocalInstaller({ '/a': ['b', 'c'], 'd': ['/e'] });
            stubPackageJson({ '/a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', '/e': 'e' });
            execStub.resolves(['stdout', 'stderr']);
            unlinkStub.resolves();
        });

        it('should pack correct packages', async () => {
            await sut.install();
            expect(execStub).calledWith(`npm pack ${resolve('b')}`, { cwd: os.tmpdir() });
            expect(execStub).calledWith(`npm pack ${resolve('c')}`, { cwd: os.tmpdir() });
            expect(execStub).calledWith(`npm pack ${resolve('/e')}`, { cwd: os.tmpdir() });
        });

        it('should install correct packages', async () => {
            await sut.install();
            expect(execStub).calledWith(`npm i --no-save ${tmp('b-0.0.1.tgz')} ${tmp('c-0.0.2.tgz')}`,
                { cwd: resolve('/a') });
            expect(execStub).calledWith(`npm i --no-save ${tmp('e-0.0.4.tgz')}`,
                { cwd: resolve('d') });
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

    describe('with scoped packages', () => {
        beforeEach(() => {
            sut = new LocalInstaller({ '/a': ['b'] });
            stubPackageJson({ '/a': 'a', 'b': '@s/b' });
            execStub.resolves(['stdout', 'stderr']);
            unlinkStub.resolves();
        });

        it('should install scoped packages', async () => {
            await sut.install();
            expect(execStub).calledWith(`npm i --no-save ${tmp('s-b-0.0.1.tgz')}`);
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
            sut = new LocalInstaller({ '/a': ['b'] });
            stubPackageJson({ '/a': 'a', 'b': 'b' });
        });

        it('should propagate the error', () => {
            execStub.rejects(new Error('error'));
            return expect(sut.install()).to.eventually.rejectedWith('error');
        });
    });

    describe('when installing errors', () => {
        beforeEach(() => {
            sut = new LocalInstaller({ '/a': ['b'] });
            stubPackageJson({ '/a': 'a', 'b': 'b' });
            stubPack('b');
        });

        it('should propagate the error', () => {
            execStub.rejects(new Error('install err'));
            return expect(sut.install()).to.eventually.rejectedWith('install err');
        });
    });

    const tmp = (file: string) => resolve(os.tmpdir(), file);

    const stubPackageJson = (recipe: { [directory: string]: string }) => {
        Object.keys(recipe).forEach((directory, i) => {
            readFileStub.withArgs(resolve(directory, 'package.json')).resolves(JSON.stringify({
                name: recipe[directory],
                version: `0.0.${i}`
            }));
        });
    };

    const stubPack = (...directories: string[]) => {
        directories.forEach(directory => {
            execStub.withArgs(`npm pack ${resolve(directory)}`).resolves();
        });
    };
});
