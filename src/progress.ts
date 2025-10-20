import type { WriteStream } from 'tty';
import os from 'os';
import path from 'path';
import { LocalInstaller } from './LocalInstaller.ts';
class ProgressKeeper {
  private stream;
  private pattern;
  private maxTicks;
  private current = -1;

  constructor(stream: NodeJS.WriteStream, pattern: string, maxTicks: number) {
    this.stream = stream;
    this.pattern = pattern;
    this.maxTicks = maxTicks;
    this.tick();
  }

  public tick(description?: string) {
    this.current++;
    this.line();
    this.stream.write(
      this.pattern
        .replace(/:max/g, this.maxTicks.toString())
        .replace(/:count/g, this.current.toString()),
    );
    if (description) {
      this.stream.write(` (${description})`);
    }
  }
  public terminate() {
    this.line();
  }
  private line() {
    if (this.stream.isTTY) {
      this.stream.clearLine(0);
      this.stream.cursorTo(0);
    } else {
      this.stream.write(os.EOL);
    }
  }
}

export const progressReporter = {
  report: (
    installer: LocalInstaller,
    stream: WriteStream = process.stdout,
  ): void => {
    let progressKeeper: ProgressKeeper;
    installer.on(
      'packing_start',
      (_) =>
        (progressKeeper = new ProgressKeeper(
          stream,
          '[install-local] packing - :count/:max',
          _.length,
        )),
    );
    installer.on('packed', (pkg) => progressKeeper.tick(path.basename(pkg)));
    installer.on('packing_end', () => progressKeeper.terminate());
    installer.on('install_start', (toInstall) => {
      const installPhrase = Object.keys(toInstall)
        .map((_) => path.basename(_))
        .join(', ');
      if (installPhrase.length) {
        stream.write(
          `[install-local] installing into ${installPhrase}${os.EOL}`,
        );
      } else {
        stream.write(`[install-local] nothing to install${os.EOL}`);
      }
    });
    installer.on('installed', (pkg, stdout, stderr) => {
      stream.write(`[install-local] ${pkg} installed${os.EOL}`);
      stream.write(stdout);
      stream.write(stderr);
      stream.write(os.EOL);
    });
    installer.on('install_end', () =>
      stream.write(`[install-local] Done${os.EOL}`),
    );
  },
};
