import { expect } from 'chai';
import type { Options, Result, ResultPromise } from 'execa';
import { promises as fs } from 'fs';
import os from 'os';
import { resolve } from 'path';
import sinon from 'sinon';
import { utils } from '../../src/utils.ts';
import { LocalInstaller } from './../../src/LocalInstaller.ts';
import { prober } from '../../src/prober.ts';
const TEN_MEGA_BYTE = 1024 * 1024 * 10;

describe('LocalInstaller install', () => {
  class TestHelper {
    public execStub = sinon.stub(utils, 'exec');
    public mkdirStub = sinon.stub(fs, 'mkdir');
    public readFileStub = sinon.stub(fs, 'readFile');
    public rmStub = sinon.stub(fs, 'rm');
    public getRandomTmpDirStub = sinon
      .stub(utils, 'getRandomTmpDir')
      .returns(tmpDir);
    public probePackageManagerStub = sinon.stub(prober, 'probePackageManager');
  }

  let sut: LocalInstaller;
  let helper: TestHelper;
  const tmpDir = resolve(os.tmpdir(), 'node-local-install-5a6s4df65asdas');

  function createExecaResult(
    overrides?: Partial<Awaited<ResultPromise>>,
  ): Awaited<ResultPromise> {
    return {
      command: '',
      exitCode: 0,
      isCanceled: false,
      failed: false,
      stderr: '',
      stdout: '',
      timedOut: false,
      all: '',
      ...overrides,
    } as Awaited<ResultPromise>;
  }

  beforeEach(() => {
    helper = new TestHelper();

    // Call callback
    helper.mkdirStub.resolves();
  });

  describe('pkg=npm', () => {
    beforeEach(() => {
      sut = new LocalInstaller(
        { '/a': ['b', 'c'], d: ['/e'] },
        { packageManager: 'npm' },
      );
      stubPackageJson({ '/a': 'a', b: 'b', c: 'c', d: 'd', '/e': 'e' });
      helper.execStub.resolves(
        createExecaResult({ stdout: 'stdout', stderr: 'stderr' }),
      );
      helper.rmStub.resolves();
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
        {
          cwd: resolve('/a'),
          maxBuffer: TEN_MEGA_BYTE,
          env: {
            npm_config_save: 'false',
            npm_config_lockfile: 'false',
          },
        },
      );
      expect(helper.execStub).calledWith(
        'npm',
        ['i', '--no-save', '--no-package-lock', tmp('e-0.0.4.tgz')],
        {
          cwd: resolve('d'),
          maxBuffer: TEN_MEGA_BYTE,
          env: {
            npm_config_save: 'false',
            npm_config_lockfile: 'false',
          },
        },
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

      sinon.assert.calledWithExactly(helper.rmStub, tmpDir, {
        recursive: true,
        force: true,
      });
    });
  });

  describe('pkg=pnpm', () => {
    beforeEach(() => {
      sut = new LocalInstaller(
        { '/a': ['b', 'c'], d: ['/e'] },
        { packageManager: 'pnpm' },
      );
      stubPackageJson({ '/a': 'a', b: 'b', c: 'c', d: 'd', '/e': 'e' });
      helper.execStub.resolves(
        createExecaResult({ stdout: 'stdout', stderr: 'stderr' }),
      );
      helper.rmStub.resolves();
    });

    it('should install correct packages', async () => {
      await sut.install();
      expect(helper.execStub).calledWith(
        'pnpm',
        ['add', tmp('b-0.0.1.tgz'), tmp('c-0.0.2.tgz')],
        {
          cwd: resolve('/a'),
          maxBuffer: TEN_MEGA_BYTE,
          env: {
            npm_config_save: 'false',
            npm_config_lockfile: 'false',
          },
        },
      );
      expect(helper.execStub).calledWith('pnpm', ['add', tmp('e-0.0.4.tgz')], {
        cwd: resolve('d'),
        maxBuffer: TEN_MEGA_BYTE,
        env: {
          npm_config_save: 'false',
          npm_config_lockfile: 'false',
        },
      });
    });
  });

  describe('probing package manager', () => {
    beforeEach(() => {
      sut = new LocalInstaller({ '/a': ['b'] });
      stubPackageJson({ '/a': 'a', b: 'b' });
      helper.execStub.resolves(
        createExecaResult({ stdout: 'stdout', stderr: 'stderr' }),
      );
      helper.rmStub.resolves();
    });
    it('should use npm when probe package manager provides npm', async () => {
      helper.probePackageManagerStub.resolves('npm');
      await sut.install();
      expect(helper.execStub).calledWith('npm');
      expect(helper.probePackageManagerStub).calledOnce;
    });
    it('should use pnpm when probe package manager provides pnpm', async () => {
      helper.probePackageManagerStub.resolves('pnpm');
      await sut.install();
      expect(helper.execStub).calledWith('pnpm');
      expect(helper.probePackageManagerStub).calledOnce;
    });
  });

  describe('with scoped packages', () => {
    beforeEach(() => {
      sut = new LocalInstaller({ '/a': ['b'] }, { packageManager: 'npm' });
      stubPackageJson({ '/a': 'a', b: '@s/b' });
      helper.execStub.resolves(
        createExecaResult({ stdout: 'stdout', stderr: 'stderr' }),
      );
      helper.rmStub.resolves();
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
      sut = new LocalInstaller(
        { '/a': ['b'] },
        { npmEnv, packageManager: 'npm' },
      );
      stubPackageJson({ '/a': 'a', b: 'b' });
      helper.execStub.resolves(
        createExecaResult({ stdout: 'stdout', stderr: 'stderr' }),
      );
      helper.rmStub.resolves();
    });

    it('should call npm with correct env vars', async () => {
      await sut.install();
      expect(helper.execStub).calledWith(
        'npm',
        ['i', '--no-save', '--no-package-lock', tmp('b-0.0.1.tgz')],
        {
          env: {
            ...npmEnv,
            npm_config_save: 'false',
            npm_config_lockfile: 'false',
          },
          cwd: resolve('/a'),
          maxBuffer: TEN_MEGA_BYTE,
        },
      );
    });
  });

  describe('with concurrent', () => {
    beforeEach(() => {
      sut = new LocalInstaller(
        { '/a': ['c'], '/b': ['c'] },
        { packageManager: 'npm', concurrent: 1 },
      );
      stubPackageJson({
        '/a': 'a',
        '/b': 'b',
        c: 'c',
      });
      helper.rmStub.resolves();
    });

    it('should install with the specified concurrency', async () => {
      const calls: ((res: Result<Options>) => void)[] = [];
      helper.execStub.callsFake((file, args) => {
        if (file === 'npm' && args?.includes('pack')) {
          return Promise.resolve(createExecaResult()) as ResultPromise;
        }
        return new Promise((res) => {
          calls.push(res);
        }) as ResultPromise;
      });

      const onGoingInstall = sut.install();
      await tick();
      await tick();
      expect(calls).to.have.lengthOf(1);
      calls[0](createExecaResult());
      await tick();
      await tick();
      expect(calls).to.have.lengthOf(2);
      calls[1](createExecaResult());
      await onGoingInstall;
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
      sut = new LocalInstaller({ '/a': ['b'] }, { packageManager: 'npm' });
      stubPackageJson({ '/a': 'a', b: 'b' });
    });

    it('should propagate the error', () => {
      helper.execStub.rejects(new Error('error'));
      return expect(sut.install()).to.eventually.rejectedWith('error');
    });
  });

  describe('when installing errors', () => {
    beforeEach(() => {
      sut = new LocalInstaller({ '/a': ['b'] }, { packageManager: 'npm' });
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

function tick(): Promise<void> {
  return new Promise((res) => process.nextTick(res));
}
