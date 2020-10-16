import { expect } from 'chai';
import type { ExecaReturnValue } from 'execa';
import { promises as fs } from 'fs';
import os from 'os';
import { resolve } from 'path';
import sinon from 'sinon';
import * as utils from '../../src/utils';
import { LocalInstaller } from './../../src/LocalInstaller';
const TEN_MEGA_BYTE = 1024 * 1024 * 10;

describe('LocalInstaller install', () => {
  class TestHelper {
    public execStub = sinon.stub(utils, 'exec');
    public mkdirStub = sinon.stub(fs, 'mkdir');
    public readFileStub = sinon.stub(fs, 'readFile');
    public rimrafStub = sinon.stub(utils, 'del');
    public getRandomTmpDirStub = sinon
      .stub(utils, 'getRandomTmpDir')
      .returns(tmpDir);
  }

  let sut: LocalInstaller;
  let helper: TestHelper;
  const tmpDir = resolve(os.tmpdir(), 'node-local-install-5a6s4df65asdas');

  function createExecaResult(
    overrides?: Partial<ExecaReturnValue<string>>,
  ): ExecaReturnValue<string> {
    return {
      command: '',
      exitCode: 0,
      isCanceled: false,
      failed: false,
      killed: false,
      stderr: '',
      stdout: '',
      timedOut: false,
      ...overrides,
    };
  }

  beforeEach(() => {
    helper = new TestHelper();

    // Call callback
    helper.mkdirStub.resolves();
  });

  describe('with some normal packages', () => {
    beforeEach(() => {
      sut = new LocalInstaller({ '/a': ['b', 'c'], d: ['/e'] });
      stubPackageJson({ '/a': 'a', b: 'b', c: 'c', d: 'd', '/e': 'e' });
      helper.execStub.resolves(
        createExecaResult({ stdout: 'stdout', stderr: 'stderr' }),
      );
      helper.rimrafStub.resolves();
    });

    it('should create a temporary directory', async () => {
      await sut.install();

      expect(helper.getRandomTmpDirStub).calledWith('node-local-install-');
      expect(helper.mkdirStub).calledWith(tmpDir);
    });

    it('should pack correct packages', async () => {
      await sut.install();
      expect(helper.execStub).calledWith('npm', ['pack', resolve('b')], {
        cwd: tmpDir,
        maxBuffer: TEN_MEGA_BYTE,
      });
      expect(helper.execStub).calledWith('npm', ['pack', resolve('c')], {
        cwd: tmpDir,
        maxBuffer: TEN_MEGA_BYTE,
      });
      expect(helper.execStub).calledWith('npm', ['pack', resolve('/e')], {
        cwd: tmpDir,
        maxBuffer: TEN_MEGA_BYTE,
      });
    });

    it('should install correct packages', async () => {
      await sut.install();
      expect(helper.execStub).calledWith(
        'npm',
        [
          'i',
          '--no-save',
          '--no-package-lock',
          tmp('b-0.0.1.tgz'),
          tmp('c-0.0.2.tgz'),
        ],
        { cwd: resolve('/a'), env: undefined, maxBuffer: TEN_MEGA_BYTE },
      );
      expect(helper.execStub).calledWith(
        'npm',
        ['i', '--no-save', '--no-package-lock', tmp('e-0.0.4.tgz')],
        { cwd: resolve('d'), env: undefined, maxBuffer: TEN_MEGA_BYTE },
      );
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

      expect(helper.rimrafStub).calledWith(tmpDir);
    });
  });

  describe('with scoped packages', () => {
    beforeEach(() => {
      sut = new LocalInstaller({ '/a': ['b'] });
      stubPackageJson({ '/a': 'a', b: '@s/b' });
      helper.execStub.resolves(
        createExecaResult({ stdout: 'stdout', stderr: 'stderr' }),
      );
      helper.rimrafStub.resolves();
    });

    it('should install scoped packages', async () => {
      await sut.install();
      expect(helper.execStub).calledWith('npm', [
        'i',
        '--no-save',
        '--no-package-lock',
        tmp('s-b-0.0.1.tgz'),
      ]);
    });
  });

  describe('with npmEnv', () => {
    const npmEnv = { test: 'test', dummy: 'dummy' };
    beforeEach(() => {
      sut = new LocalInstaller({ '/a': ['b'] }, { npmEnv });
      stubPackageJson({ '/a': 'a', b: 'b' });
      helper.execStub.resolves(
        createExecaResult({ stdout: 'stdout', stderr: 'stderr' }),
      );
      helper.rimrafStub.resolves();
    });

    it('should call npm with correct env vars', async () => {
      await sut.install();
      expect(helper.execStub).calledWith(
        'npm',
        ['i', '--no-save', '--no-package-lock', tmp('b-0.0.1.tgz')],
        { env: npmEnv, cwd: resolve('/a'), maxBuffer: TEN_MEGA_BYTE },
      );
    });
  });

  describe('when readFile errors', () => {
    it('should propagate the error', () => {
      helper.readFileStub.rejects(new Error('file error'));
      return expect(sut.install()).to.eventually.rejectedWith('file error');
    });
  });

  describe('when packing errors', () => {
    beforeEach(() => {
      sut = new LocalInstaller({ '/a': ['b'] }, {});
      stubPackageJson({ '/a': 'a', b: 'b' });
    });

    it('should propagate the error', () => {
      helper.execStub.rejects(new Error('error'));
      return expect(sut.install()).to.eventually.rejectedWith('error');
    });
  });

  describe('when installing errors', () => {
    beforeEach(() => {
      sut = new LocalInstaller({ '/a': ['b'] }, {});
      stubPackageJson({ '/a': 'a', b: 'b' });
      stubPack('b');
    });

    it('should propagate the error', () => {
      helper.execStub.rejects(new Error('install err'));
      return expect(sut.install()).to.eventually.rejectedWith('install err');
    });
  });

  const tmp = (file: string) => resolve(tmpDir, file);

  const stubPackageJson = (recipe: { [directory: string]: string }) => {
    Object.keys(recipe).forEach((directory, i) => {
      helper.readFileStub
        .withArgs(resolve(directory, 'package.json'), sinon.match.any)
        .resolves(
          JSON.stringify({
            name: recipe[directory],
            version: `0.0.${i}`,
          }),
        );
    });
  };

  const stubPack = (...directories: string[]) => {
    directories.forEach((directory) => {
      helper.execStub.withArgs(`npm pack ${resolve(directory)}`).resolves();
    });
  };
});
