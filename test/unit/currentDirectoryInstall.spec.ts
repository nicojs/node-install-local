import { expect } from 'chai';
import sinon from 'sinon';
import { currentDirectoryInstaller } from '../../src/currentDirectoryInstall.ts';
import { helpers } from '../../src/helpers.ts';
import { LocalInstaller } from '../../src/LocalInstaller.ts';
import { progressReporter } from '../../src/progress.ts';
import { storage } from '../../src/save.ts';
import { options, packageJson } from '../helpers/producers.ts';
import { type InstallTarget, Options } from '../../src/index.ts';

describe('currentDirectoryInstall', () => {
  let localInstallerStub: sinon.SinonStubbedMember<
    typeof LocalInstaller.prototype.install
  >;
  let progressStub: sinon.SinonStubbedMember<typeof progressReporter.report>;
  let saveIfNeededStub: sinon.SinonStub<
    [InstallTarget[], Options],
    Promise<void>
  >;
  let readPackageJsonStub: sinon.SinonStubbedMember<
    typeof helpers.readPackageJson
  >;

  beforeEach(() => {
    localInstallerStub = sinon.stub(LocalInstaller.prototype, 'install');
    saveIfNeededStub = sinon.stub(storage, 'saveIfNeeded');
    progressStub = sinon.stub(progressReporter, 'report');
    readPackageJsonStub = sinon.stub(helpers, 'readPackageJson');
  });

  it('should install the local dependencies if none were provided', async () => {
    readPackageJsonStub.resolves(
      packageJson({ localDependencies: { a: '../a', b: '../b' } }),
    );
    const expectedOptions = options({ dependencies: [] });
    const expectedTargets: InstallTarget[] = [
      { directory: '../a', packageJson: packageJson(), sources: [] },
    ];
    localInstallerStub.resolves(expectedTargets);
    await currentDirectoryInstaller.install(expectedOptions);

    sinon.assert.calledWithExactly(localInstallerStub);
    sinon.assert.called(progressStub);
    sinon.assert.calledWithExactly(readPackageJsonStub, '.');
    sinon.assert.calledWithExactly(
      saveIfNeededStub,
      expectedTargets,
      expectedOptions,
    );
  });

  it('should install given dependencies', async () => {
    localInstallerStub.resolves();
    await currentDirectoryInstaller.install(
      options({ dependencies: ['a', 'b'] }),
    );
    sinon.assert.notCalled(readPackageJsonStub);
    sinon.assert.called(localInstallerStub);
  });

  it('should reject if install rejects', () => {
    readPackageJsonStub.resolves(packageJson());
    localInstallerStub.rejects(new Error('some error'));
    expect(currentDirectoryInstaller.install(options())).to.rejectedWith(
      'some error',
    );
  });

  it('should not install anything when no arguments nor local dependencies are provided', async () => {
    localInstallerStub.resolves([]);
    readPackageJsonStub.resolves(packageJson({}));
    const expectedOptions = options({ dependencies: [] });
    await currentDirectoryInstaller.install(expectedOptions);
    sinon.assert.called(localInstallerStub);
    sinon.assert.called(progressStub);
    sinon.assert.calledWithExactly(readPackageJsonStub, '.');
    sinon.assert.calledWithExactly(saveIfNeededStub, [], expectedOptions);
  });
});
