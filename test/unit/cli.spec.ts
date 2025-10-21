import { expect } from 'chai';
import sinon from 'sinon';
import { cli } from '../../src/cli.ts';
import { siblingInstaller } from '../../src/siblingInstall.ts';
import { currentDirectoryInstaller } from '../../src/currentDirectoryInstall.ts';
import { Options } from '../../src/Options.ts';

describe('cli', () => {
  let currentDirectoryInstallStub: sinon.SinonStubbedMember<
    typeof currentDirectoryInstaller.install
  >;
  let siblingInstallStub: sinon.SinonStubbedMember<
    typeof siblingInstaller.install
  >;

  beforeEach(() => {
    currentDirectoryInstallStub = sinon.stub(
      currentDirectoryInstaller,
      'install',
    );
    siblingInstallStub = sinon.stub(siblingInstaller, 'install');
  });

  describe('given a valid config', () => {
    it('should install into current directory if targetSiblings = false', async () => {
      await cli([]);
      sinon.assert.calledOnce(currentDirectoryInstallStub);
      sinon.assert.notCalled(siblingInstallStub);
    });

    it('should target siblings if targetSiblings = true', async () => {
      await cli(['node', 'install-local', '--target-siblings']);
      sinon.assert.notCalled(currentDirectoryInstallStub);
      sinon.assert.calledOnceWithExactly(
        siblingInstallStub,
        new Options(['node', 'install-local', '--target-siblings']),
      );
    });

    it('should validate the package manager option', async () => {
      await cli(['node', 'install-local', '--pkg=pnpm']);
      sinon.assert.calledOnceWithExactly(
        currentDirectoryInstallStub,
        new Options(['node', 'install-local', '--pkg=pnpm']),
      );
    });
  });

  describe('with an invalid config', () => {
    it('should reject when --target-siblings and dependencies are provided', () => {
      return expect(
        cli(['node', 'install-local', '--target-siblings', 'some-dependency']),
      ).to.be.rejectedWith('Invalid use of option --target-siblings');
    });
    it('should reject when --pkg is provided without a valid package manager', () => {
      return expect(
        cli(['node', 'install-local', '--pkg=invalid-pkg']),
      ).to.be.rejectedWith(
        "Invalid package manager <invalid-pkg> specified. Please use either 'npm' or 'pnpm'.",
      );
    });
  });
});
