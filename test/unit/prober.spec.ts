import { promises as fs } from 'fs';
import sinon from 'sinon';
import { prober } from '../../src/prober.ts';
import { expect } from 'chai';

describe('prober', () => {
  let accessStub: sinon.SinonStubbedMember<typeof fs.access>;

  beforeEach(() => {
    accessStub = sinon.stub(fs, 'access');
  });

  it('should detect npm as package manager', async () => {
    accessStub.rejects(new Error('File does not exist'));
    const pkgManager = await prober.probePackageManager();
    expect(pkgManager).to.equal('npm');
    sinon.assert.calledOnceWithExactly(accessStub, 'pnpm-lock.yaml');
  });
  it('should detect pnpm as package manager', async () => {
    accessStub.resolves();
    const pkgManager = await prober.probePackageManager();
    expect(pkgManager).to.equal('pnpm');
    sinon.assert.calledOnceWithExactly(accessStub, 'pnpm-lock.yaml');
  });
});
