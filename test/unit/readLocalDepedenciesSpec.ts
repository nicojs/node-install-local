import { expect } from 'chai';
import * as fs from 'mz/fs';
import * as sinon from 'sinon';
import { readLocalDependencies } from '../../src/readLocalDependencies';

describe('readLocalDependencies', () => {

    let sandbox: sinon.SinonSandbox;
    let readFileStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        readFileStub = sandbox.stub(fs, 'readFile');
    });

    afterEach(() => sandbox.restore());

    it('should resolve input when arguments are given', () => {
        return expect(readLocalDependencies(['any'])).to.eventually.deep.equal(['any']);
    });

    it('should read package.json when no arguments are given', () => {
        readFileStub.resolves(JSON.stringify({ localDependencies: { a: 'b', c: 'd' } }));
        return expect(readLocalDependencies([])).to.eventually.deep.equal(['b', 'd']);
    });

    it('should return empty array when no arguments are given and there are no "localDependencies"', () => {
        readFileStub.resolves('{}');
        return expect(readLocalDependencies([])).to.eventually.have.lengthOf(0);
    });
});
