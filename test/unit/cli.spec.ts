import { expect } from 'chai';
import sinon from 'sinon';
import { cli } from '../../src/cli.ts';
import { siblingInstaller } from '../../src/siblingInstall.ts';
import { currentDirectoryInstaller } from '../../src/currentDirectoryInstall.ts';

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
      sinon.assert.calledOnce(siblingInstallStub);
    });
  });

  describe('with an invalid config', () => {
    it('should reject', () => {
      return expect(
        cli(['node', 'install-local', '--target-siblings', 'some-dependency']),
      ).to.be.rejectedWith('Invalid use of option --target-siblings');
    });
  });
});
