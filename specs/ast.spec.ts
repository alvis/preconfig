/**
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE fn for details.
 * -------------------------------------------------------------------------
 *
 * @summary   A test for the abstract syntax tree (ast) builder.
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2020 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

import { ast } from '#ast';

import type { Node } from '#ast';

interface Context {
  /** the statement to be parsed */
  input: string;
  /** the expected result */
  expected: Node[] | Error;
}

/**
 * create a test for an expected equality or error
 * @param description - description text
 * @param context - setting for the test
 */
function should(description: string, context: Context): void {
  it(description, () => {
    if (context.expected instanceof Error) {
      expect(() => ast(context.input)).toThrow(context.expected.message);
    } else {
      const output = ast(context.input);
      expect(output.content).toEqual(context.input);
      expect(output.nodes).toEqual(context.expected);
    }
  });
}

//
// TEST
//

describe('sddsd', () => {
  should('deal with a control statement with arguments', {
    input: '${fn(arg1,arg2)}',
    expected: [
      {
        type: 'fn',
        segment: '${fn(arg1,arg2)}',
        arguments: [
          [
            {
              type: 'literal',
              segment: 'arg1',
              arguments: undefined,
              path: undefined,
            },
          ],
          [
            {
              type: 'literal',
              segment: 'arg2',
              arguments: undefined,
              path: undefined,
            },
          ],
        ],
        path: undefined,
      },
    ],
  });
});

describe('fn:ast', () => {
  should('pass an literal string', {
    input: 'abc',
    expected: [
      {
        type: 'literal',
        segment: 'abc',
        arguments: undefined,
        path: undefined,
      },
    ],
  });

  should('parse a function with a bare bracket', {
    input: '${fn()}',
    expected: [
      {
        type: 'fn',
        segment: '${fn()}',
        arguments: [],
        path: undefined,
      },
    ],
  });

  should('parse a function with a bare path', {
    input: '${fn:}',
    expected: [
      {
        type: 'fn',
        segment: '${fn:}',
        arguments: undefined,
        path: [],
      },
    ],
  });

  should('parse a function with a bare bracket and path', {
    input: '${fn():}',
    expected: [
      {
        type: 'fn',
        segment: '${fn():}',
        arguments: [],
        path: [],
      },
    ],
  });

  should('deal with escape characters', {
    input: 'a\\${fn:b\\}c',
    expected: [
      {
        type: 'literal',
        segment: 'a\\${fn:b\\}c',
        arguments: undefined,
        path: undefined,
      },
    ],
  });

  should('deal with a control statement with arguments', {
    input: '${fn(arg1,arg2)}',
    expected: [
      {
        type: 'fn',
        segment: '${fn(arg1,arg2)}',
        arguments: [
          [
            {
              type: 'literal',
              segment: 'arg1',
              arguments: undefined,
              path: undefined,
            },
          ],
          [
            {
              type: 'literal',
              segment: 'arg2',
              arguments: undefined,
              path: undefined,
            },
          ],
        ],
        path: undefined,
      },
    ],
  });

  should('deal with a control statement with a path', {
    input: '${fn:path}',
    expected: [
      {
        type: 'fn',
        segment: '${fn:path}',
        arguments: undefined,
        path: [
          {
            type: 'literal',
            segment: 'path',
            arguments: undefined,
            path: undefined,
          },
        ],
      },
    ],
  });

  should('deal with a control statement with arguments and a path', {
    input: '${fn(arg1,arg2):path}',
    expected: [
      {
        type: 'fn',
        segment: '${fn(arg1,arg2):path}',
        arguments: [
          [
            {
              type: 'literal',
              segment: 'arg1',
              arguments: undefined,
              path: undefined,
            },
          ],
          [
            {
              type: 'literal',
              segment: 'arg2',
              arguments: undefined,
              path: undefined,
            },
          ],
        ],
        path: [
          {
            type: 'literal',
            segment: 'path',
            arguments: undefined,
            path: undefined,
          },
        ],
      },
    ],
  });

  should('deal with a control statement with spacing', {
    input: '${fn ( arg1 , arg2 ) : path }',
    expected: [
      {
        type: 'fn',
        segment: '${fn ( arg1 , arg2 ) : path }',
        arguments: [
          [
            {
              type: 'literal',
              segment: 'arg1',
              arguments: undefined,
              path: undefined,
            },
          ],
          [
            {
              type: 'literal',
              segment: 'arg2',
              arguments: undefined,
              path: undefined,
            },
          ],
        ],
        path: [
          {
            type: 'literal',
            segment: 'path',
            arguments: undefined,
            path: undefined,
          },
        ],
      },
    ],
  });

  should('warn with a closing missing control statement', {
    input: 'a${fn:b',
    expected: new Error('missing closing'),
  });

  should('continue with a unopened control statement', {
    input: 'a$fn:b}',
    expected: [
      {
        type: 'literal',
        segment: 'a$fn:b}',
        arguments: undefined,
        path: undefined,
      },
    ],
  });

  should('parse a control statement', {
    input: 'a${fn:b}c',
    expected: [
      {
        type: 'literal',
        segment: 'a',
        arguments: undefined,
        path: undefined,
      },
      {
        type: 'fn',
        segment: '${fn:b}',
        arguments: undefined,
        path: [
          {
            type: 'literal',
            segment: 'b',
            arguments: undefined,
            path: undefined,
          },
        ],
      },
      {
        type: 'literal',
        segment: 'c',
        arguments: undefined,
        path: undefined,
      },
    ],
  });

  should('parse a control statement with non-escaping characters', {
    input: 'a\\\\${fn:b}c',
    expected: [
      {
        type: 'literal',
        segment: 'a\\\\',
        arguments: undefined,
        path: undefined,
      },
      {
        type: 'fn',
        segment: '${fn:b}',
        arguments: undefined,
        path: [
          {
            type: 'literal',
            segment: 'b',
            arguments: undefined,
            path: undefined,
          },
        ],
      },
      {
        type: 'literal',
        segment: 'c',
        arguments: undefined,
        path: undefined,
      },
    ],
  });

  should('parse a control statement with escape characters', {
    input: 'a${fn:b\\${var:c\\}}d',
    expected: [
      {
        type: 'literal',
        segment: 'a',
        arguments: undefined,
        path: undefined,
      },
      {
        type: 'fn',
        segment: '${fn:b\\${var:c\\}}',
        arguments: undefined,
        path: [
          {
            type: 'literal',
            segment: 'b\\${var:c\\}',
            arguments: undefined,
            path: undefined,
          },
        ],
      },
      {
        type: 'literal',
        segment: 'd',
        arguments: undefined,
        path: undefined,
      },
    ],
  });

  should('parse multiple control statements', {
    input: 'a${fn:b}.${var:c}d',
    expected: [
      {
        type: 'literal',
        segment: 'a',
        arguments: undefined,
        path: undefined,
      },
      {
        type: 'fn',
        segment: '${fn:b}',
        arguments: undefined,
        path: [
          {
            type: 'literal',
            segment: 'b',
            arguments: undefined,
            path: undefined,
          },
        ],
      },
      {
        type: 'literal',
        segment: '.',
        arguments: undefined,
        path: undefined,
      },
      {
        type: 'var',
        segment: '${var:c}',
        arguments: undefined,
        path: [
          {
            type: 'literal',
            segment: 'c',
            arguments: undefined,
            path: undefined,
          },
        ],
      },
      {
        type: 'literal',
        segment: 'd',
        arguments: undefined,
        path: undefined,
      },
    ],
  });

  should('parse a nested structure', {
    input: 'a${fn:b${var:c}}d',
    expected: [
      {
        type: 'literal',
        segment: 'a',
        arguments: undefined,
        path: undefined,
      },
      {
        type: 'fn',
        segment: '${fn:b${var:c}}',
        arguments: undefined,
        path: [
          {
            type: 'literal',
            segment: 'b',
            arguments: undefined,
            path: undefined,
          },
          {
            type: 'var',
            segment: '${var:c}',
            arguments: undefined,
            path: [
              {
                type: 'literal',
                segment: 'c',
                arguments: undefined,
                path: undefined,
              },
            ],
          },
        ],
      },

      {
        type: 'literal',
        segment: 'd',
        arguments: undefined,
        path: undefined,
      },
    ],
  });

  should('parse a super nested structure', {
    input: 'a${fn:b${var:c${self:d}e}f}g${fn:h${var:i${self:j}k}l}m',
    expected: [
      {
        type: 'literal',
        segment: 'a',
        arguments: undefined,
        path: undefined,
      },
      {
        type: 'fn',
        segment: '${fn:b${var:c${self:d}e}f}',
        arguments: undefined,
        path: [
          {
            type: 'literal',
            segment: 'b',
            arguments: undefined,
            path: undefined,
          },
          {
            type: 'var',
            segment: '${var:c${self:d}e}',
            arguments: undefined,
            path: [
              {
                type: 'literal',
                segment: 'c',
                arguments: undefined,
                path: undefined,
              },
              {
                type: 'self',
                segment: '${self:d}',
                arguments: undefined,
                path: [
                  {
                    type: 'literal',
                    segment: 'd',
                    arguments: undefined,
                    path: undefined,
                  },
                ],
              },
              {
                type: 'literal',
                segment: 'e',
                arguments: undefined,
                path: undefined,
              },
            ],
          },
          {
            type: 'literal',
            segment: 'f',
            arguments: undefined,
            path: undefined,
          },
        ],
      },
      {
        type: 'literal',
        segment: 'g',
        arguments: undefined,
        path: undefined,
      },
      {
        type: 'fn',
        segment: '${fn:h${var:i${self:j}k}l}',
        arguments: undefined,
        path: [
          {
            type: 'literal',
            segment: 'h',
            arguments: undefined,
            path: undefined,
          },
          {
            type: 'var',
            segment: '${var:i${self:j}k}',
            arguments: undefined,
            path: [
              {
                type: 'literal',
                segment: 'i',
                arguments: undefined,
                path: undefined,
              },
              {
                type: 'self',
                segment: '${self:j}',
                arguments: undefined,
                path: [
                  {
                    type: 'literal',
                    segment: 'j',
                    arguments: undefined,
                    path: undefined,
                  },
                ],
              },
              {
                type: 'literal',
                segment: 'k',
                arguments: undefined,
                path: undefined,
              },
            ],
          },
          {
            type: 'literal',
            segment: 'l',
            arguments: undefined,
            path: undefined,
          },
        ],
      },
      {
        type: 'literal',
        segment: 'm',
        arguments: undefined,
        path: undefined,
      },
    ],
  });

  should('parse a function', {
    input: 'a${fn(b):c}d',
    expected: [
      {
        type: 'literal',
        segment: 'a',
        arguments: undefined,
        path: undefined,
      },
      {
        type: 'fn',
        segment: '${fn(b):c}',
        arguments: [
          [
            {
              type: 'literal',
              segment: 'b',
              arguments: undefined,
              path: undefined,
            },
          ],
        ],
        path: [
          {
            type: 'literal',
            segment: 'c',
            arguments: undefined,
            path: undefined,
          },
        ],
      },
      {
        type: 'literal',
        segment: 'd',
        arguments: undefined,
        path: undefined,
      },
    ],
  });

  should('parse a function with a variable in the path', {
    input: 'a${fn(b):${fn:c}}d',
    expected: [
      {
        type: 'literal',
        segment: 'a',
        arguments: undefined,
        path: undefined,
      },
      {
        type: 'fn',
        segment: '${fn(b):${fn:c}}',
        arguments: [
          [
            {
              type: 'literal',
              segment: 'b',
              arguments: undefined,
              path: undefined,
            },
          ],
        ],
        path: [
          {
            type: 'fn',
            segment: '${fn:c}',
            arguments: undefined,
            path: [
              {
                type: 'literal',
                segment: 'c',
                arguments: undefined,
                path: undefined,
              },
            ],
          },
        ],
      },
      {
        type: 'literal',
        segment: 'd',
        arguments: undefined,
        path: undefined,
      },
    ],
  });

  should('parse a function with a variable in the path', {
    input: 'a${fn(b):c${fn:d}e}f',
    expected: [
      {
        type: 'literal',
        segment: 'a',
        arguments: undefined,
        path: undefined,
      },
      {
        type: 'fn',
        segment: '${fn(b):c${fn:d}e}',
        arguments: [
          [
            {
              type: 'literal',
              segment: 'b',
              arguments: undefined,
              path: undefined,
            },
          ],
        ],
        path: [
          {
            type: 'literal',
            segment: 'c',
            arguments: undefined,
            path: undefined,
          },
          {
            type: 'fn',
            segment: '${fn:d}',
            arguments: undefined,
            path: [
              {
                type: 'literal',
                segment: 'd',
                arguments: undefined,
                path: undefined,
              },
            ],
          },
          {
            type: 'literal',
            segment: 'e',
            arguments: undefined,
            path: undefined,
          },
        ],
      },
      {
        type: 'literal',
        segment: 'f',
        arguments: undefined,
        path: undefined,
      },
    ],
  });

  should('deal with a nested function', {
    input: 'a${fn(b${fn:c}d):e}f',
    expected: [
      {
        type: 'literal',
        segment: 'a',
        arguments: undefined,
        path: undefined,
      },
      {
        type: 'fn',
        segment: '${fn(b${fn:c}d):e}',
        arguments: [
          [
            {
              type: 'literal',
              segment: 'b',
              arguments: undefined,
              path: undefined,
            },
            {
              type: 'fn',
              segment: '${fn:c}',
              arguments: undefined,
              path: [
                {
                  type: 'literal',
                  segment: 'c',
                  arguments: undefined,
                  path: undefined,
                },
              ],
            },
            {
              type: 'literal',
              segment: 'd',
              arguments: undefined,
              path: undefined,
            },
          ],
        ],
        path: [
          {
            type: 'literal',
            segment: 'e',
            arguments: undefined,
            path: undefined,
          },
        ],
      },
      {
        type: 'literal',
        segment: 'f',
        arguments: undefined,
        path: undefined,
      },
    ],
  });

  should('deal with multiple functional controls', {
    input: 'a${fn(b):c}${fn(d):e}f',
    expected: [
      {
        type: 'literal',
        segment: 'a',
        arguments: undefined,
        path: undefined,
      },
      {
        type: 'fn',
        segment: '${fn(b):c}',
        arguments: [
          [
            {
              type: 'literal',
              segment: 'b',
              arguments: undefined,
              path: undefined,
            },
          ],
        ],
        path: [
          {
            type: 'literal',
            segment: 'c',
            arguments: undefined,
            path: undefined,
          },
        ],
      },
      {
        type: 'fn',
        segment: '${fn(d):e}',
        arguments: [
          [
            {
              type: 'literal',
              segment: 'd',
              arguments: undefined,
              path: undefined,
            },
          ],
        ],
        path: [
          {
            type: 'literal',
            segment: 'e',
            arguments: undefined,
            path: undefined,
          },
        ],
      },
      {
        type: 'literal',
        segment: 'f',
        arguments: undefined,
        path: undefined,
      },
    ],
  });

  should('parse a function with variables in the path', {
    input: 'a${fn(b${fn:c}d):e${fn:f}g}h',
    expected: [
      {
        type: 'literal',
        segment: 'a',
        arguments: undefined,
        path: undefined,
      },
      {
        type: 'fn',
        segment: '${fn(b${fn:c}d):e${fn:f}g}',
        arguments: [
          [
            {
              type: 'literal',
              segment: 'b',
              arguments: undefined,
              path: undefined,
            },
            {
              type: 'fn',
              segment: '${fn:c}',
              arguments: undefined,
              path: [
                {
                  type: 'literal',
                  segment: 'c',
                  arguments: undefined,
                  path: undefined,
                },
              ],
            },
            {
              type: 'literal',
              segment: 'd',
              arguments: undefined,
              path: undefined,
            },
          ],
        ],
        path: [
          {
            type: 'literal',
            segment: 'e',
            arguments: undefined,
            path: undefined,
          },
          {
            type: 'fn',
            segment: '${fn:f}',
            arguments: undefined,
            path: [
              {
                type: 'literal',
                segment: 'f',
                arguments: undefined,
                path: undefined,
              },
            ],
          },
          {
            type: 'literal',
            segment: 'g',
            arguments: undefined,
            path: undefined,
          },
        ],
      },
      {
        type: 'literal',
        segment: 'h',
        arguments: undefined,
        path: undefined,
      },
    ],
  });

  should('parse a function with another function embedded', {
    input: 'a${fn(b${fn(c${fn(d):e}f):g}h):i${fn(j):k}l}m',
    expected: [
      {
        type: 'literal',
        segment: 'a',
        arguments: undefined,
        path: undefined,
      },
      {
        type: 'fn',
        segment: '${fn(b${fn(c${fn(d):e}f):g}h):i${fn(j):k}l}',
        arguments: [
          [
            {
              type: 'literal',
              segment: 'b',
              arguments: undefined,
              path: undefined,
            },
            {
              type: 'fn',
              segment: '${fn(c${fn(d):e}f):g}',
              arguments: [
                [
                  {
                    type: 'literal',
                    segment: 'c',
                    arguments: undefined,
                    path: undefined,
                  },
                  {
                    type: 'fn',
                    segment: '${fn(d):e}',
                    arguments: [
                      [
                        {
                          type: 'literal',
                          segment: 'd',
                          arguments: undefined,
                          path: undefined,
                        },
                      ],
                    ],
                    path: [
                      {
                        type: 'literal',
                        segment: 'e',
                        arguments: undefined,
                        path: undefined,
                      },
                    ],
                  },
                  {
                    type: 'literal',
                    segment: 'f',
                    arguments: undefined,
                    path: undefined,
                  },
                ],
              ],
              path: [
                {
                  type: 'literal',
                  segment: 'g',
                  arguments: undefined,
                  path: undefined,
                },
              ],
            },
            {
              type: 'literal',
              segment: 'h',
              arguments: undefined,
              path: undefined,
            },
          ],
        ],
        path: [
          {
            type: 'literal',
            segment: 'i',
            arguments: undefined,
            path: undefined,
          },
          {
            type: 'fn',
            segment: '${fn(j):k}',
            arguments: [
              [
                {
                  type: 'literal',
                  segment: 'j',
                  arguments: undefined,
                  path: undefined,
                },
              ],
            ],
            path: [
              {
                type: 'literal',
                segment: 'k',
                arguments: undefined,
                path: undefined,
              },
            ],
          },
          {
            type: 'literal',
            segment: 'l',
            arguments: undefined,
            path: undefined,
          },
        ],
      },
      {
        type: 'literal',
        segment: 'm',
        arguments: undefined,
        path: undefined,
      },
    ],
  });
});
