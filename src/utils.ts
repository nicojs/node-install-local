import { execa, type Options, type ResultPromise } from 'execa';
import os from 'os';
import path from 'path';
import { rimraf } from 'rimraf';
import uniqid from 'uniqid';

export const utils = {
  del,
  getRandomTmpDir,
  exec,
};

async function del(filename: string): Promise<void> {
  await rimraf(filename);
}

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
