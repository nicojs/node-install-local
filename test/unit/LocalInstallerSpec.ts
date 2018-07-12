import { expect } from 'chai';
import * as child_process from 'mz/child_process';
import * as fs from 'mz/fs';
import * as os from 'os';
import { resolve } from 'path';
import * as sinon from 'sinon';
import * as utils from '../../src/utils';
import { LocalInstaller } from './../../src/LocalInstaller';
const TEN_MEGA_BYTE = 1024 * 1024 * 10;
describe('LocalInstaller install', () => {
    let sut: LocalInstaller;
    let sandbox: sinon.SinonSandbox;
    let readFileStub: sinon.SinonStub;
    let execStub: sinon.SinonStub;
    let mkdirStub: sinon.SinonStub;
    let rimrafStub: sinon.SinonStub;
    let getRandomTmpDirStub: sinon.SinonStub;

    const tmpDir = resolve(os.tmpdir(), 'node-local-install-5a6s4df65asdas');

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        execStub = sandbox.stub(child_process, 'exec');
        mkdirStub = sandbox.stub(fs, 'mkdir');
        readFileStub = sandbox.stub(fs, 'readFile');
        rimrafStub = sandbox.stub(utils, 'del');
        getRandomTmpDirStub = sandbox.stub(utils, 'getRandomTmpDir').returns(tmpDir);

        // Call callback
        mkdirStub.resolves();
    });

    afterEach(() => sandbox.restore());

    describe('with some normal packages', () => {

        beforeEach(() => {
            sut = new LocalInstaller({ '/a': ['b', 'c'], 'd': ['/e'] });
            stubPackageJson({ '/a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', '/e': 'e' });
            execStub.resolves(['stdout', 'stderr']);
            rimrafStub.resolves();
        });

        it('should create a temporary directory', async () => {
            await sut.install();

            expect(getRandomTmpDirStub).calledWith('node-local-install-');
            expect(mkdirStub).calledWith(tmpDir);
        });

        it('should pack correct packages', async () => {
            await sut.install();
            expect(execStub).calledWith(`npm pack ${resolve('b')}`, { cwd: tmpDir, maxBuffer: TEN_MEGA_BYTE });
            expect(execStub).calledWith(`npm pack ${resolve('c')}`, { cwd: tmpDir, maxBuffer: TEN_MEGA_BYTE });
            expect(execStub).calledWith(`npm pack ${resolve('/e')}`, { cwd: tmpDir, maxBuffer: TEN_MEGA_BYTE });
        });

        it('should install correct packages', async () => {
            await sut.install();
            expect(execStub).calledWith(`npm i --no-save ${tmp('b-0.0.1.tgz')} ${tmp('c-0.0.2.tgz')}`,
                { cwd: resolve('/a'), maxBuffer: TEN_MEGA_BYTE });
            expect(execStub).calledWith(`npm i --no-save ${tmp('e-0.0.4.tgz')}`,
                { cwd: resolve('d'), maxBuffer: TEN_MEGA_BYTE });
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

        it('should remove the temporary directory', async () => {
            await sut.install();

            expect(rimrafStub).calledWith(tmpDir);
        });
    });

    describe('with scoped packages', () => {
        beforeEach(() => {
            sut = new LocalInstaller({ '/a': ['b'] });
            stubPackageJson({ '/a': 'a', 'b': '@s/b' });
            execStub.resolves(['stdout', 'stderr']);
            rimrafStub.resolves();
        });

        it('should install scoped packages', async () => {
            await sut.install();
            expect(execStub).calledWith(`npm i --no-save ${tmp('s-b-0.0.1.tgz')}`);
        });
    });

    describe('with npmEnv', () => {
        const npmEnv = { test: 'test', dummy: 'dummy' };
        beforeEach(() => {
            sut = new LocalInstaller({ '/a': ['b'] }, { npmEnv });
            stubPackageJson({ '/a': 'a', 'b': 'b' });
            execStub.resolves(['stdout', 'stderr']);
            rimrafStub.resolves();
        });

        it('should call npm with correct env vars', async () => {
            await sut.install();
            expect(execStub).calledWith(`npm i --no-save ${tmp('b-0.0.1.tgz')}`, { env: npmEnv, cwd: resolve('/a'), maxBuffer: TEN_MEGA_BYTE });
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
            sut = new LocalInstaller({ '/a': ['b'] }, {});
            stubPackageJson({ '/a': 'a', 'b': 'b' });
        });

        it('should propagate the error', () => {
            execStub.rejects(new Error('error'));
            return expect(sut.install()).to.eventually.rejectedWith('error');
        });
    });

    describe('when installing errors', () => {
        beforeEach(() => {
            sut = new LocalInstaller({ '/a': ['b'] }, {});
            stubPackageJson({ '/a': 'a', 'b': 'b' });
            stubPack('b');
        });

        it('should propagate the error', () => {
            execStub.rejects(new Error('install err'));
            return expect(sut.install()).to.eventually.rejectedWith('install err');
        });
    });

    const tmp = (file: string) => resolve(tmpDir, file);

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
