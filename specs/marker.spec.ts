/**
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE file for details.
 * -------------------------------------------------------------------------
 *
 * @summary   The code below provides a test for the marker locator.
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2020 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

// tslint:disable: no-invalid-template-strings

import { locateMarkers } from '#marker';

interface Context {
  /** the statement to be parsed */
  input: string;
  /** the locations of the markers as [begin, end] */
  expected: Array<[number, number]> | Error;
}

/**
 * create a test for an expected equality or error
 * @param description - description text
 * @param context - setting for the test
 */
function should(description: string, context: Context): void {
  it(description, () => {
    if (context.expected instanceof Error) {
      expect(() => locateMarkers(context.input)).toThrow(
        context.expected.message,
      );
    } else {
      const output = locateMarkers(context.input);
      expect(output).toEqual(context.expected);
    }
  });
}

//
// TEST
//

describe('fn:locateMarkers', () => {
  should('input without any marker', { input: 'abc.def', expected: [] });

  should('input with escape characters', {
    input: '\\${a\\}',
    expected: [],
  });

  should('input with escape characters', {
    input: '\\${a${b}\\}',
    expected: [[4, 7]],
  });

  should('input with simple markers', {
    input: '${a}b${c}',
    expected: [
      [0, 3],
      [5, 8],
    ],
  });

  should('input with a simple marker', {
    input: 'a${b}c',
    expected: [[1, 4]],
  });

  should('input with multiple simple markers', {
    input: 'a${b}c${d}e',
    expected: [
      [1, 4],
      [6, 9],
    ],
  });

  should('input with a nested marker', {
    input: 'a${${}}b',
    expected: [
      [1, 6],
      [3, 5],
    ],
  });

  should('input with a nested marker', {
    input: 'a${b${}c}d',
    expected: [
      [1, 8],
      [4, 6],
    ],
  });

  should('input with a nested marker', {
    input: 'a${${b}}c',
    expected: [
      [1, 7],
      [3, 6],
    ],
  });

  should('input with multiple nested markers', {
    input: 'a${${b}c${d${e}}f}g',
    expected: [
      [1, 17],
      [3, 6],
      [8, 15],
      [11, 14],
    ],
  });

  should('input with multiple nested markers', {
    input: '${${}${${}}}${${${}}${}}',
    expected: [
      [0, 11],
      [2, 4],
      [5, 10],
      [7, 9],
      [12, 23],
      [14, 19],
      [16, 18],
      [20, 22],
    ],
  });

  should('input with a missing bracket on the right', {
    input: 'a${b',
    expected: new Error('missing closing for the opening at 1'),
  });

  should('input with multiple missing brackets on the right', {
    input: '${a${b',
    // report one error only for a missing }
    expected: new Error('missing closing for the opening at 3'),
  });

  should('complex input with a missing bracket on the right', {
    input: 'a${${b}c${${d${e}}f}g',
    expected: new Error('missing closing for the opening at 1'),
  });

  should('input with a missing bracket on the left', {
    input: 'a}b',
    expected: [],
  });

  should('input with multiple missing brackets on the left', {
    input: 'a}b}',
    expected: [],
  });

  should('complex input with a missing bracket on the left', {
    input: 'a${${b}c}${d${e}}f}g',
    expected: [
      [1, 8],
      [3, 6],
      [9, 16],
      [12, 15],
    ],
  });
});
