import { expect } from 'chai';
import * as sinon from 'sinon';
import { progressBar } from '../../src/progressBar';
import { LocalInstaller } from './../../src/LocalInstaller';

describe('progressBar', () => {

    let eventEmitter: LocalInstaller;
    let sandbox: sinon.SinonSandbox;
    let streamStub: NodeJS.Socket;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        sandbox.useFakeTimers();
        streamStub = stubStream();
        eventEmitter = new LocalInstaller({});
        progressBar(eventEmitter, streamStub);
    });

    describe('on "install_targets_identified" with 2 install targets', () => {

        beforeEach(() => {
            const packageB = createPackage('b');
            const packageC = createPackage('c');
            const packageF = createPackage('f');
            eventEmitter.emit('install_targets_identified', [{
                directory: 'a',
                packageJson: { name: 'a', version: '0.0.1' },
                sources: [
                    packageB,
                    packageC
                ]
            }, {
                directory: 'e',
                packageJson: { name: 'e', version: 'c' },
                sources: [packageB, packageF]
            }]);
        });
        it('should tick on "packing_start"', () => {
            eventEmitter.emit('packing_start', []);
            fastForward();
            expect(streamStub.write).to.have.been.calledWith('install-local: [=--------] packing');
        });

        it('should tick on "packed"', () => {
            eventEmitter.emit('packed', 'asd');
            fastForward();
            expect(streamStub.write).to.have.been.calledWith('install-local: [=--------] packing(asd)');
        });

        it('should not tick on "packing_end"', () => {
            eventEmitter.emit('packing_end');
            fastForward();
            expect(streamStub.write).to.not.have.been.called;
        });

        it('should tick on "install_start"', () => {
            eventEmitter.emit('install_start', {});
            fastForward();
            expect(streamStub.write).to.have.been.calledWith('install-local: [=--------] installing');
        });

        it('should tick on "installed"', () => {
            eventEmitter.emit('installed', {
                directory: 'a', packageJson: { name: 'a', version: 'a' }, sources: [
                    createPackage('b'),
                    createPackage('c')
                ]
            });
            fastForward();
            expect(streamStub.write).to.have.been.calledWith('install-local: [==-------] installing(a)');
        });

        it('should terminate on "install_end"', () => {
            eventEmitter.emit('install_end');
            fastForward();
            expect(streamStub.write).to.have.been.calledWith('\n');
        });
    });
    const fastForward = () => sandbox.clock.tick(50);
});

const createPackage = (name: string) => ({
    directory: name,
    packageJson: { name, version: '0' }
});

const stubStream = (): NodeJS.Socket => ({
    columns: 1000,
    cursorTo: sinon.stub(),
    clearLine: sinon.stub(),
    eventNames: sinon.stub(),
    prependOnceListener: sinon.stub(),
    prependListener: sinon.stub(),
    listenerCount: sinon.stub(),
    emit: sinon.stub(),
    listeners: sinon.stub(),
    getMaxListeners: sinon.stub(),
    setMaxListeners: sinon.stub(),
    removeAllListeners: sinon.stub(),
    removeListener: sinon.stub(),
    once: sinon.stub(),
    on: sinon.stub(),
    addListener: sinon.stub(),
    isTTY: true,
    readable: false,
    writable: true,
    write: sinon.stub(),
    end: sinon.stub(),
    read: sinon.stub(),
    setEncoding: sinon.stub(),
    pause: sinon.stub(),
    resume: sinon.stub(),
    isPaused: sinon.stub(),
    pipe: sinon.stub(),
    unpipe: sinon.stub(),
    unshift: sinon.stub(),
    wrap: sinon.stub()
} as any);
