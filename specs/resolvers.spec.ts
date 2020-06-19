/**
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE file for details.
 * -------------------------------------------------------------------------
 *
 * @summary   Tests on individual resolvers
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2020 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

import { resolver } from '#resolvers';

import type { Resolved } from '#ast';
import type { DataType } from '#io';

interface Context {
  /** the control statement to be resolved */
  node: Resolved;

  /**
   * the expected result
   * any: the expected result object (except an error)
   * Error: the error expected to be thrown
   */
  expected: any | Error;

  /** partially resolved template */
  self?: DataType;
}

/**
 * create a test for an expected equality or error
 * @param description - description text
 * @param context - setting for the test
 */
function should(description: string, context: Context): void {
  const { node, expected } = context;

  it(description, async () => {
    // const [node] = ast(input).nodes;

    const fn = async () =>
      resolver[node.type]?.(node, {
        cwd: __dirname,
        self: context.self ?? {
          type: 'json',
          data: {
            nested: {
              key: 'value',
              ref: '${para:ref}',
            },
          },
        },
        parameter: parameter,
      });
    if (expected instanceof Error) {
      await expect(fn).rejects.toThrow(expected.message);
    } else {
      expect(await fn()).toEqual(expected);
    }
  });
}

/** the mocked environment */
const env = {
  ENV: 'env',
};

/** the mocked variables */
const parameter = {
  key: 'value',
  ref: 'key',
  file: 'plain',
};

//
// TEST
//

beforeAll(() => {
  // set up environment variables
  process.env = env;
});

describe('base64encode', () => {
  should('encode a content', {
    node: {
      type: 'base64encode',
      segment: '${base64encode(value)}',
      arguments: ['value'],
      path: undefined,
    },
    expected: 'dmFsdWU=',
  });
});

describe('base64decode', () => {
  should('decode a content', {
    node: {
      type: 'base64decode',
      segment: '${base64decode(dmFsdWU=)}',
      arguments: ['dmFsdWU='],
      path: undefined,
    },
    expected: parameter.key,
  });

  const base64EncodedVariable = Buffer.from(JSON.stringify(parameter)).toString(
    'base64',
  );
  should('extract from a decoded content', {
    node: {
      type: 'base64decode',
      segment: `base64decode(${base64EncodedVariable}):key}`,
      arguments: [base64EncodedVariable],
      path: 'key',
    },
    expected: parameter.key,
  });
});

describe('env', () => {
  should('substitute an environment variable', {
    node: {
      type: 'env',
      segment: '${env:ENV}',
      arguments: undefined,
      path: 'ENV',
    },
    expected: env.ENV,
  });
});

describe('file', () => {
  should('warn about a missing file', {
    node: {
      type: 'file',
      segment: '${file(missing.yaml)}',
      arguments: ['missing.yaml'],
      path: undefined,
    },
    expected: new Error('file not found'),
  });

  should('reference a plain text from a plain text file', {
    node: {
      type: 'file',
      segment: '${file(supporting/reference.txt)}',
      arguments: ['supporting/reference.txt'],
      path: undefined,
    },
    expected: 'simple and plain',
  });

  should('warn about referencing a path in a plain text file', {
    node: {
      type: 'file',
      segment: '${file(supporting/reference.txt):path}',
      arguments: ['supporting/reference.txt'],
      path: 'path',
    },
    expected: new Error('cannot resolve a path'),
  });

  should('reference a plain text from a json file', {
    node: {
      type: 'file',
      segment: '${file(supporting/plain.json):a.b.2}',
      arguments: ['supporting/plain.json'],
      path: 'a.b.2',
    },
    expected: 'true',
  });

  should('reference an object from a json file', {
    node: {
      type: 'file',
      segment: '${file(supporting/plain.json):a.b}',
      arguments: ['supporting/plain.json'],
      path: 'a.b',
    },
    expected: '["c",0,true,false,null]',
  });

  should('reference a plain text from a yaml file', {
    node: {
      type: 'file',
      segment: '${file(supporting/plain.yaml):a.b.2}',
      arguments: ['supporting/plain.yaml'],
      path: 'a.b.2',
    },
    expected: 'true',
  });

  should('reference an object from a yaml file', {
    node: {
      type: 'file',
      segment: '${file(supporting/plain.yaml):a.b}',
      arguments: ['supporting/plain.yaml'],
      path: 'a.b',
    },
    expected: '["c",0,true,false,null]',
  });
});

describe('para', () => {
  should('substitute a parameter', {
    node: {
      type: 'para',
      segment: '${para:key}',
      arguments: undefined,
      path: 'key',
    },
    expected: parameter.key,
  });
});

describe('self', () => {
  should('referencing in a JSON template', {
    node: {
      type: 'self',
      segment: '${self:nested.key}',
      arguments: undefined,
      path: 'nested.key',
    },
    expected: 'value',
  });

  should('referencing an unresolved part in a JSON template', {
    node: {
      type: 'self',
      segment: '${self:nested.ref}',
      arguments: undefined,
      path: 'nested.ref',
    },
    expected: null,
  });

  should('referencing an unresolvable part in a JSON template', {
    node: {
      type: 'self',
      segment: '${self:missing}',
      arguments: undefined,
      path: 'missing',
    },
    expected: null,
  });

  should('referencing in a plain text template', {
    node: {
      type: 'self',
      segment: '${self:nested}',
      arguments: undefined,
      path: 'nested',
    },
    expected: new Error('cannot self reference to a text based template'),
    self: {
      type: 'text',
      data: 'text',
    },
  });
});
