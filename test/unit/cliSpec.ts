import { expect } from 'chai';
import sinon from 'sinon';
import { cli } from '../../src/cli';
import * as siblingInstallModule from '../../src/siblingInstall';
import * as optionsModule from '../../src/Options';
import * as currentDirectoryInstallModule from '../../src/currentDirectoryInstall';

describe('cli', () => {
  let optionsMock: {
    dependencies: string[];
    save: boolean;
    targetSiblings: boolean;
    validate: sinon.SinonStub;
  };
  let currentDirectoryInstallStub: sinon.SinonStub<
    [optionsModule.Options],
    Promise<void>
  >;
  let siblingInstallStub: sinon.SinonStub<[], Promise<void>>;

  beforeEach(() => {
    optionsMock = {
      dependencies: [],
      save: false,
      targetSiblings: false,
      validate: sinon.stub(),
    };
    sinon.stub(optionsModule, 'Options').returns(optionsMock);
    currentDirectoryInstallStub = sinon.stub(
      currentDirectoryInstallModule,
      'currentDirectoryInstall',
    );
    siblingInstallStub = sinon.stub(siblingInstallModule, 'siblingInstall');
  });

  describe('given a valid config', () => {
    beforeEach(() => {
      optionsMock.validate.resolves();
    });

    it('should install into current directory if targetSiblings = false', async () => {
      optionsMock.targetSiblings = false;
      await cli([]);
      expect(currentDirectoryInstallStub).to.have.been.called;
      expect(siblingInstallStub).to.not.have.been.called;
    });

    it('should target siblings if targetSiblings = true', async () => {
      optionsMock.targetSiblings = true;
      await cli([]);
      expect(currentDirectoryInstallStub).to.not.have.been.called;
      expect(siblingInstallStub).to.have.been.called;
    });
  });

  describe('with an invalid config', () => {
    it('should reject', () => {
      optionsMock.validate.rejects(new Error('something is wrong'));
      return expect(cli([])).to.be.rejectedWith('something is wrong');
    });
  });
});
