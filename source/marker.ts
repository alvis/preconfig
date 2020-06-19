/*
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE file for details.
 * -------------------------------------------------------------------------
 *
 * @summary   An algorithm for locating pairs of ${}
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2020 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

/* The Logic
 * 1. locate the position of `${` and `}`
 * 2. starting from the last `${`, look for the closest `}` and match it
 *    - warn if the `}` is missing
 * 3. remove the matched `}` and repeat the process for the `${` on the left
 * 4. check if all `}` have been matched
 *    - warn if it's not the case
 * 5. return the matches as a Map
 */

export type Marker = [number, number];

/**
 * locate the positions of a pattern in a string
 * @param content content to be scanned
 * @param regex pattern to be found
 * @returns positions of the start of the pattern being looked for
 */
function locate(content: string, regex: RegExp): number[] {
  // a temporary variable for storing results from the regexp match
  let match: RegExpExecArray | null;
  const locations: number[] = [];

  while ((match = regex.exec(content))) {
    const [_whole, escape] = match;

    // exclude any escaped markers
    const ESCAPE_PAIR = 2;
    if (escape.length % ESCAPE_PAIR === 0) {
      locations.push(match.index + escape.length);
    }
  }

  return locations.sort((a, b) => a - b);
}

/**
 * remove the get first number larger than after in a number list
 * @param after starting position to be searched
 * @param candidates list of positions to be marched
 * @returns the first number larger than after
 */
function popFirstAfter(after: number, candidates: number[]): number | void {
  // look for the paired marker
  for (const [index, candidate] of candidates.sort((a, b) => a - b).entries()) {
    if (candidate > after) {
      // remove the candidate from the candidate list
      candidates.splice(index, 1);

      // first number in the candidate list larger than after
      return candidate;
    }
  }
}

/** options for locateMarkers */
export interface Options {
  /** pattern of an opening bracket */
  opening: string;
  /** pattern of a closing bracket */
  closing: string;
}

/**
 * locate the positions of bracket pairs
 * @param content content to be scanned
 * @param options additional options
 * @returns starting and ending positions of each bracket pairs
 */
export function locateMarkers(
  content: string,
  options?: Partial<Options>,
): Marker[] {
  const { opening, closing }: Options = {
    opening: '\\${',
    closing: '}',
    ...options,
  };

  // regular expression of the opening and closing markers, including escape characters
  const openings = locate(content, new RegExp(`([\\\\]*)${opening}`, 'g')); // /([\\]*)\${/g,
  const closings = locate(content, new RegExp(`([\\\\]*)${closing}`, 'g')); // /([\\]*)}/g

  // pair up the brackets starting from the end
  // NOTE assuming map is a single thread process
  const markers: Marker[] = openings.reverse().map((opening) => {
    // the first end marker after the beginning is the other in the pair
    const matchedLocation = popFirstAfter(opening, closings);

    if (!matchedLocation) {
      throw new SyntaxError(`missing closing for the opening at ${opening}`);
    }

    return [opening, matchedLocation];
  });

  // check if there's any unpaired ending brackets left
  // if (closings.length) {
  //   throw new SyntaxError(
  //     `missing openings for closings ending at ${closings.join(', ')}`,
  //   );
  // }

  // return the locations with the keys sorted
  return markers.sort(
    (m1, m2) => m1[0] - m2[0],
    // m1[0] === m2[0] ? Math.sign(m2[1] - m1[1]) : Math.sign(m1[0] - m2[0]),
  );
}

export default locateMarkers;
