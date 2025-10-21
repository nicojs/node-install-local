import { execa, type Options, type ResultPromise } from 'execa';
import os from 'os';
import path from 'path';
import uniqid from 'uniqid';

export const utils = {
  getRandomTmpDir,
  exec,
};

function getRandomTmpDir(prefix: string): string {
  return path.resolve(os.tmpdir(), uniqid(prefix));
}

function exec(
  file: string,
  args?: readonly string[],
  options?: Options,
): ResultPromise<Options> {
  return execa(file, args, options);
}
