/**
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE file for details.
 * -------------------------------------------------------------------------
 *
 * @summary   Tests on input and output helpers
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2020 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

import { resolve } from 'path';

import { format, parse, readTextFile, validateInput } from '#io';

describe('fn:format', () => {
  it('convert a text to text', () => {
    expect(format('text', 'text')).toEqual('text');
  });

  it('convert a text to JSON', () => {
    expect(format('text', 'json')).toEqual('"text"');
  });

  it('convert a text to YAML', () => {
    expect(format('text', 'yaml')).toEqual('text\n');
  });

  it('format to JSON', () => {
    expect(format('{"key": "value"}', 'json')).toEqual(
      '{\n  "key": "value"\n}',
    );
  });

  it('format a single document YAML', () => {
    expect(format('{"key": "value"}', 'yaml')).toEqual('key: value\n');
  });

  it('format a multi document YAML', () => {
    expect(format('name: doc1\n---\nname: doc2', 'yaml')).toEqual(
      'name: doc1\n---\nname: doc2\n',
    );
  });
});

describe('fn:parse', () => {
  it('parse a text', () => {
    expect(parse('text')).toEqual({ type: 'text', data: 'text' });
  });

  it('parse a json string', () => {
    expect(parse('{"key": "value"}')).toEqual({
      type: 'json',
      data: { key: 'value' },
    });
  });

  it('parse a single-document yaml', () => {
    expect(parse('key: value')).toEqual({
      type: 'yaml',
      data: { key: 'value' },
    });
  });

  it('parse a multi-document yaml', () => {
    expect(parse('---\nname: doc1\n---\nname: doc2')).toEqual({
      type: 'multi',
      data: [{ name: 'doc1' }, { name: 'doc2' }],
    });
  });
});

describe('fn:readTextFile', () => {
  it('warn for a missing file', async () => {
    await expect(async () => readTextFile('missing.txt')).rejects.toThrow(
      'missing',
    );
  });

  it('extract the content from a text file', async () => {
    expect(
      await readTextFile(resolve(__dirname, 'supporting', 'simple.txt')),
    ).toEqual('simple');
  });
});

describe('fn:validateInput', () => {
  it('warn an unexpected number of arguments', () => {
    expect(() =>
      validateInput(
        {
          type: 'fn',
          segment: '${fn(arg1)}',
          arguments: ['arg1'],
        },
        {
          args: 0,
        },
      ),
    ).toThrow('fn requires 0 arguments in ${fn(arg1)}');
  });

  it('warn an unexpected bracket', () => {
    expect(() =>
      validateInput(
        {
          type: 'fn',
          segment: '${fn()}',
          arguments: [],
        },
        {
          args: 0,
        },
      ),
    ).toThrow('fn requires 0 arguments in ${fn()}');
  });

  it('pass with the correct number of arguments', () => {
    expect(
      validateInput(
        {
          type: 'fn',
          segment: '${fn}',
          arguments: undefined,
        },
        {
          args: 0,
        },
      ),
    ).toEqual(undefined);
  });

  it('warn an unexpected path', () => {
    expect(() =>
      validateInput(
        {
          type: 'fn',
          segment: '${fn:path}',
          path: 'path',
        },
        {
          args: 0,
          path: false,
        },
      ),
    ).toThrow('fn needs no path in ${fn:path}');
  });

  it('warn a missing path', () => {
    expect(() =>
      validateInput(
        {
          type: 'fn',
          segment: '${fn}',
          path: undefined,
        },
        {
          args: 0,
          path: true,
        },
      ),
    ).toThrow('fn requires a path in ${fn}');
  });

  it('pass with an optional path', () => {
    expect(
      validateInput(
        {
          type: 'fn',
          segment: '${fn:path}',
          path: 'path',
        },
        {
          args: 0,
        },
      ),
    ).toEqual(undefined);
  });
});
