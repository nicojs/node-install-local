import { expect } from 'chai';
import os from 'os';
import sinon from 'sinon';
import { WriteStream } from 'tty';
import { progress } from '../../src/progress';
import { LocalInstaller } from './../../src/LocalInstaller';

describe('progress', () => {
  let eventEmitter: LocalInstaller;
  let streamStub: WriteStream;

  beforeEach(() => {
    streamStub = stubStdOut();
    eventEmitter = new LocalInstaller({});
    progress(eventEmitter, streamStub);
  });

  describe('on "install_targets_identified" with 2 install targets', () => {
    beforeEach(() => {
      const packageB = createPackage('b');
      const packageC = createPackage('c');
      const packageF = createPackage('f');
      eventEmitter.emit('install_targets_identified', [
        {
          directory: 'a',
          packageJson: { name: 'a', version: '0.0.1' },
          sources: [packageB, packageC],
        },
        {
          directory: 'e',
          packageJson: { name: 'e', version: 'c' },
          sources: [packageB, packageF],
        },
      ]);
    });
    it('should tick on "packing_start"', () => {
      eventEmitter.emit('packing_start', ['a', 'b']);
      expect(streamStub.write).to.have.been.calledWith(
        '[install-local] packing - 0/2',
      );
    });

    it('should tick on "packed"', () => {
      eventEmitter.emit('packing_start', ['a', 'b']);
      eventEmitter.emit('packed', 'a');
      expect(streamStub.clearLine).to.have.been.called;
      expect(streamStub.cursorTo).to.have.been.calledWith(0);
      expect(streamStub.write).to.have.been.calledWith(
        '[install-local] packing - 1/2',
      );
      expect(streamStub.write).to.have.been.calledWith(' (a)');
    });

    it('should not clear line when not a TTY on "packed"', () => {
      streamStub.isTTY = false;
      eventEmitter.emit('packing_start', ['a', 'b']);
      eventEmitter.emit('packed', 'a');
      expect(streamStub.clearLine).to.not.have.been.called;
      expect(streamStub.cursorTo).to.not.have.been.called;
      expect(streamStub.write).to.have.been.calledWith(os.EOL);
    });

    it('should not tick on "packing_end"', () => {
      eventEmitter.emit('packing_start', ['a', 'b']);
      eventEmitter.emit('packing_end');
      expect(streamStub.clearLine).to.have.been.called;
      expect(streamStub.cursorTo).to.have.been.calledWith(0);
    });

    it('should tick on "install_start"', () => {
      eventEmitter.emit('install_start', { a: ['b'], c: ['d'] });
      expect(streamStub.write).to.have.been.calledWith(
        `[install-local] installing into a, c${os.EOL}`,
      );
    });

    it('should print that there is nothing todo on "install_start" without targets', () => {
      eventEmitter.emit('install_start', {});
      expect(streamStub.write).to.have.been.calledWith(
        `[install-local] nothing to install${os.EOL}`,
      );
    });

    it('should tick on "installed"', () => {
      eventEmitter.emit('installed', 'a', 'stdout', 'stderr');
      expect(streamStub.write).to.have.been.calledWith(
        `[install-local] a installed${os.EOL}`,
      );
      expect(streamStub.write).to.have.been.calledWith('stdout');
      expect(streamStub.write).to.have.been.calledWith('stderr');
    });

    it('should terminate on "install_end"', () => {
      eventEmitter.emit('install_end');
      expect(streamStub.write).to.have.been.calledWith(
        `[install-local] Done${os.EOL}`,
      );
    });
  });
});

const createPackage = (name: string) => ({
  directory: name,
  packageJson: { name, version: '0' },
});

const stubStdOut = (): WriteStream => ({
  columns: 1000,
  // @ts-expect-error sinon limitation with overloads
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
  // @ts-expect-error sinon limitation with overloads
  write: sinon.stub(),
  // @ts-expect-error sinon limitation with overloads
  end: sinon.stub(),
  read: sinon.stub(),
  setEncoding: sinon.stub(),
  pause: sinon.stub(),
  resume: sinon.stub(),
  isPaused: sinon.stub(),
  pipe: sinon.stub(),
  unpipe: sinon.stub(),
  unshift: sinon.stub(),
  wrap: sinon.stub(),
});
