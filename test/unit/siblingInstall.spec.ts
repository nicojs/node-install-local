import { expect } from 'chai';
import { type PathLike, promises as fs } from 'fs';
import path from 'path';
import sinon from 'sinon';
import { helpers } from '../../src/helpers.ts';
import { siblingInstaller } from '../../src/siblingInstall.ts';
import { progressReporter } from '../../src/progress.ts';
import { LocalInstaller } from '../../src/LocalInstaller.ts';
import { Options, type PackageJson } from '../../src/index.ts';

describe('siblingInstall', () => {
  let readdirStub: sinon.SinonStub<[PathLike], Promise<string[]>>;
  let readPackageJson: sinon.SinonStub<[string], Promise<PackageJson>>;
  let localInstallStub: sinon.SinonStubbedMember<
    typeof LocalInstaller.prototype.install
  >;
  let progressStub: sinon.SinonStubbedMember<typeof progressReporter.report>;
  const npmOptions = new Options(['node', 'install-local', '--pkg=npm']);

  beforeEach(() => {
    localInstallStub = sinon.stub(LocalInstaller.prototype, 'install');
    // @ts-expect-error picks the wrong overload
    readdirStub = sinon.stub(fs, 'readdir');
    readPackageJson = sinon.stub(helpers, 'readPackageJson');
    progressStub = sinon.stub(progressReporter, 'report');
  });

  it('should install packages from sibling dirs if they exist', async () => {
    // Arrange
    const currentDirName = path.basename(process.cwd());
    readdirStub.resolves(['a', 'b', 'c', 'd']);
    const siblings = {
      a: path.resolve('..', 'a'),
      b: path.resolve('..', 'b'),
      c: path.resolve('..', 'c'),
      d: path.resolve('..', 'd'),
    };
    readPackageJson
      .withArgs(siblings.a)
      .resolves(
        createPackageJson({
          localDependencies: { someName: `../${currentDirName}` },
        }),
      )
      .withArgs(siblings.b)
      .rejects()
      .withArgs(siblings.c)
      .resolves(
        createPackageJson({
          localDependencies: { someOtherName: process.cwd() },
        }),
      )
      .withArgs(siblings.d)
      .resolves(
        createPackageJson({
          localDependencies: { someOtherName: 'some/other/localDep' },
        }),
      );
    localInstallStub.resolves();

    // Act
    await siblingInstaller.install(npmOptions);

    // Assert
    sinon.assert.calledWithExactly(readdirStub, '..');
    sinon.assert.calledWithExactly(localInstallStub);
    sinon.assert.called(progressStub);
  });

  it('should reject when install rejects', () => {
    // Arrange
    readdirStub.resolves(['a']);
    readPackageJson.resolves(
      createPackageJson({ localDependencies: { b: process.cwd() } }),
    );
    localInstallStub.rejects(new Error('some error'));
    return expect(siblingInstaller.install(npmOptions)).rejectedWith(
      'some error',
    );
  });

  function createPackageJson(overrides?: Partial<PackageJson>): PackageJson {
    return {
      name: 'a',
      version: '1.2.0',
      localDependencies: {},
      ...overrides,
    };
  }
});
