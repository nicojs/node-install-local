import type { WriteStream } from 'tty';
import { expect } from 'chai';
import sinon from 'sinon';
import { currentDirectoryInstall } from '../../src/currentDirectoryInstall';
import * as helpers from '../../src/helpers';
import * as localInstallerModule from '../../src/LocalInstaller';
import * as progressModule from '../../src/progress';
import * as saveModule from '../../src/save';
import { options, packageJson } from '../helpers/producers';
import { InstallTarget, Options, PackageJson } from '../../src';

describe('currentDirectoryInstall', () => {
  let localInstallerStub: { install: sinon.SinonStub };
  let progressStub: sinon.SinonStub<
    [localInstallerModule.LocalInstaller, WriteStream?],
    void
  >;
  let saveIfNeededStub: sinon.SinonStub<
    [InstallTarget[], Options],
    Promise<void>
  >;
  let readPackageJsonStub: sinon.SinonStub<[string], Promise<PackageJson>>;

  beforeEach(() => {
    localInstallerStub = { install: sinon.stub() };
    sinon
      .stub(localInstallerModule, 'LocalInstaller')
      .returns(localInstallerStub);
    saveIfNeededStub = sinon.stub(saveModule, 'saveIfNeeded');
    progressStub = sinon.stub(progressModule, 'progress');
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
    localInstallerStub.install.resolves(expectedTargets);
    await currentDirectoryInstall(expectedOptions);
    expect(localInstallerModule.LocalInstaller).calledWith({
      '.': ['../a', '../b'],
    });
    expect(localInstallerModule.LocalInstaller).calledWithNew;
    expect(localInstallerStub.install).called;
    expect(progressStub).to.have.been.calledWith(localInstallerStub);
    expect(readPackageJsonStub).to.have.been.calledWith('.');
    expect(saveIfNeededStub).to.have.been.calledWith(
      expectedTargets,
      expectedOptions,
    );
  });

  it('should install given dependencies', async () => {
    localInstallerStub.install.resolves();
    await currentDirectoryInstall(options({ dependencies: ['a', 'b'] }));
    expect(readPackageJsonStub).not.called;
    expect(localInstallerModule.LocalInstaller).calledWith({ '.': ['a', 'b'] });
    expect(localInstallerStub.install).called;
  });

  it('should reject if install rejects', () => {
    readPackageJsonStub.resolves(packageJson());
    localInstallerStub.install.rejects(new Error('some error'));
    expect(currentDirectoryInstall(options())).to.rejectedWith('some error');
  });

  it('should not install anything when no arguments nor local dependencies are provided', async () => {
    localInstallerStub.install.resolves([]);
    readPackageJsonStub.resolves(packageJson({}));
    const expectedOptions = options({ dependencies: [] });
    await currentDirectoryInstall(expectedOptions);
    expect(localInstallerModule.LocalInstaller).calledWith({ '.': [] });
    expect(localInstallerModule.LocalInstaller).calledWithNew;
    expect(localInstallerStub.install).called;
    expect(progressStub).to.have.been.calledWith(localInstallerStub);
    expect(readPackageJsonStub).to.have.been.calledWith('.');
    expect(saveIfNeededStub).to.have.been.calledWith([], expectedOptions);
  });
});
