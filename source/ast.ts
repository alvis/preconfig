/*
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE file for details.
 * -------------------------------------------------------------------------
 *
 * @summary   An abstract syntax tree (ast) builder for the input
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2020 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

import { locateMarkers } from './marker';

import type { Marker } from './marker';

export interface AbstractSyntaxTree {
  content: string;
  nodes: Node[];
}

/** hold information regarding a chunk of input content */
export interface Node {
  /** type of the node */
  type: 'literal' | string;
  /** content inside the chunk */
  segment: string;
  /** argument to the function */
  arguments: Node[][] | undefined;
  /** path to the data to be extracted from the functional return */
  path: Node[] | undefined;
}

/** node with arguments and path resolved  */
export interface Resolved {
  /** type of the node */
  type: string;
  /** content inside the chunk */
  segment: string;
  /** argument to the function */
  arguments?: string[];
  /** path to the data to be extracted from the functional return */
  path?: string;
}

/**
 * get a list of markers that are not overlapping with others
 * @param markers list of markers including those overlapped with others
 * @returns a list of independent markers
 */
function get1stDegreeMarkers(markers: Marker[]): Marker[] {
  let currentEnd = 0;

  return markers.filter((marker) => {
    if (marker[1] > currentEnd) {
      currentEnd = marker[1];

      return true;
    } else {
      return false;
    }
  });
}

/**
 * get the positions of literal strings in the content space
 * @param range content range
 * @param functionalMarkers positions of markers in the content space
 * @returns positions of literal strings in the content space
 */
function getLiteralRanges(
  range: [number, number],
  functionalMarkers: Marker[],
): Marker[] {
  const markers: Partial<Marker[]> = functionalMarkers.sort(
    (m1, m2) => m1[0] - m2[0],
  );
  const [start, end] = range;

  const ranges: Array<[number, number]> = [];

  // anything between the gap of two consecutive blocks
  for (let i = 0; i < markers.length + 1; i++) {
    const last = markers[i - 1]?.[1] ?? start - 1;
    const next = markers[i]?.[0] ?? end + 1;
    if (next - last > 1) {
      // add only if the gap is not empty
      ranges.push([last + 1, next - 1]);
    }
  }

  return ranges;
}

/**
 * extract parameters from a control statement
 * @param segment control statement to be parsed
 * @returns parts in the control statement
 */
function extractControl(
  segment: string,
): {
  /** function name */
  fn?: string;
  /** supplied argument */
  args?: string[];
  /** supplied path */
  path?: string;
} {
  const pattern = /^\$\{\s*(([\w]+)\s*(\(\s*(|.*\w)\s*\))?\s*(:\s*([^\s]*))?)\s*\}$/;

  // try to extract arg and path from the regular expression result
  const [, , fn, , args, , path] = pattern.exec(segment) ?? ([] as undefined[]);

  if (args === undefined) {
    return { fn, path };
  } else {
    // regular expression cannot match bracket pairs, so match it with another method
    const [[opening, closing]] = locateMarkers(segment, {
      opening: '\\(',
      closing: '\\)',
    });

    const head = segment.slice(opening + 1, closing).trim();
    const args = head.split(/\s*,\s*/).filter((arg) => !!arg);

    // match the tail again without any bracket to eliminate the noise
    const [, , , , , , path] = pattern.exec(
      `\${fn${segment.slice(closing + 1)}`,
    ) as RegExpExecArray;

    return { fn, args, path };
  }
}

/**
 * convert the given string into an ast
 * @param text content to be parsed
 * @returns an AST representing the content
 */
export function ast(text: string): AbstractSyntaxTree {
  // locate all market positions
  const markers = locateMarkers(text);

  // remove markers that are embedded in other markers
  const functionalMarkers = get1stDegreeMarkers(markers);
  const literalRanges = getLiteralRanges(
    [0, text.length - 1],
    functionalMarkers,
  );

  // extract chunks
  const nodes = [...functionalMarkers, ...literalRanges]
    .sort((r1, r2) => r1[0] - r2[0])
    .map((range) => text.slice(range[0], range[1] + 1))
    .map(
      (content: string): Node => {
        const { fn, args, path } = extractControl(content);

        return {
          type: fn ?? 'literal',
          segment: content,
          arguments: args?.map((arg) => ast(arg).nodes) ?? undefined,
          path: path === undefined ? undefined : ast(path).nodes,
        };
      },
    );

  return {
    content: text,
    nodes,
  };
}
