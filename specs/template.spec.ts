/**
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE file for details.
 * -------------------------------------------------------------------------
 *
 * @summary   The following script provides a unit test for the package.
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2020 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

import { Template } from '#template';

import type { TemplateOptions } from '#template';

/** the mocked environment */
const env = {
  ENV: 'env',
};

/** the mocked parameters */
const parameter = {
  key: 'value',
  ref: 'key',
  file: 'plain',
};

interface Context {
  /**
   * the control statement to be resolved
   */
  input: string;

  /**
   * the expected result
   * any: the expected result object (except an error)
   * Error: the error expected to be thrown
   */
  expected: any | Error;

  /** options passed to the Template instance */
  options?: Partial<TemplateOptions>;
}

/**
 * create a test for an expected equality or error
 * @param description - description text
 * @param context - setting for the test
 */
function should(description: string, context: Context): void {
  const { input, expected, options } = context;

  it(description, async () => {
    const template = new Template(input, {
      cwd: __dirname,
      ...options,
    });

    const fn = async () => template.resolve(parameter);
    if (expected instanceof Error) {
      await expect(fn).rejects.toThrow(expected.message);
    } else {
      expect(await fn()).toEqual(expected);
    }
  });
}

//
// TEST
//

describe('Class:Template', () => {
  beforeAll(() => {
    // set up environment parameters
    process.env = env;
  });

  describe('basic template parsing', () => {
    should('parse a template without any controls', {
      input: 'abc',
      expected: 'abc',
    });

    should('warn about a missing parameter', {
      input: '${para:missing}',
      expected: new Error('unresolvable reference'),
    });

    should('warn about an unrecognised control statement', {
      input: '${invalid:path}',
      expected: new Error('unresolvable reference'),
    });
  });

  describe('nesting', () => {
    should('substitute a nested supplied parameter', {
      input: '${para:${para:ref}}',
      expected: parameter.key,
    });

    should('substitute a nested self', {
      input: '{"nested":{"key":"nested"},"ref":"${self:nested.${para:ref}}"}',
      expected: '{"nested":{"key":"nested"},"ref":"nested"}',
    });

    should('substitute a nested parameter', {
      input: '{"ref":"${para:ref}","value":"${para:${self:ref}}"}',
      expected: '{"ref":"key","value":"value"}',
    });

    should('warn about mixed parameter types in the path', {
      input: '{"nested":{"key":"value"},"ref":"${para:${self:nested}}"}',
      expected: new Error('unresolvable reference'),
    });
  });
});
