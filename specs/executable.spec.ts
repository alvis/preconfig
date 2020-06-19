/**
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE file for details.
 * -------------------------------------------------------------------------
 *
 * @summary   Tests on the command line interface
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2020 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

// import getStdin from "get-stdin";

import { entry } from '#executable/entry';

// mock stdout.write
process.stdout.write = jest.fn();
process.cwd = jest.fn(() => __dirname);

jest.mock('fs-extra', () => ({
  __esModule: true,
  readFile: jest.fn(async (path) => {
    switch (path) {
      case 'plain.txt':
        return Buffer.from('text');
      default:
        throw new Error(`missing mocked file at ${path}`);
    }
  }),
}));

let mockstdin: string;
jest.mock('get-stdin', () => ({
  __esModule: true,
  default: jest.fn(() => mockstdin),
}));

describe('fn:executable/entry', () => {
  beforeEach(jest.clearAllMocks);

  it('parse a plain text file', async () => {
    mockstdin = '';
    process.argv = ['node', 'cli', 'plain.txt'];
    await entry();

    expect(process.stdout.write).toBeCalledWith('text');
  });

  it('take input from stdin', async () => {
    mockstdin = 'stdin';
    process.argv = ['node', 'cli'];
    await entry();

    expect(process.stdout.write).toBeCalledWith('stdin');
  });

  it('take parameters', async () => {
    mockstdin = '${para:arg1} ${para:arg2}';
    process.argv = ['node', 'cli', '-p', 'arg1=hello', 'arg2=world'];
    await entry();

    expect(process.stdout.write).toBeCalledWith('hello world');
  });
});
