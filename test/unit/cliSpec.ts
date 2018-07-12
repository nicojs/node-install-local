import { expect } from 'chai';
import * as sinon from 'sinon';
import { cli } from '../../src/cli';
import * as index from '../../src/index';

describe('cli', () => {

    let sandbox: sinon.SinonSandbox;
    let optionsMock: {
        dependencies: string[];
        save: boolean;
        targetSiblings: boolean;
        validate: sinon.SinonStub;
    };
    let currentDirectoryInstallStub: sinon.SinonStub;
    let siblingInstallStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        optionsMock = { dependencies: [], save: false, targetSiblings: false, validate: sandbox.stub() };
        sandbox.stub(index, 'Options').returns(optionsMock);
        currentDirectoryInstallStub = sandbox.stub(index, 'currentDirectoryInstall');
        siblingInstallStub = sandbox.stub(index, 'siblingInstall');
    });

    afterEach(() => sandbox.restore());

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
