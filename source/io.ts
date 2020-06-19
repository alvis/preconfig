/*
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE file for details.
 * -------------------------------------------------------------------------
 *
 * @summary   Collections of helpers for input and output
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2020 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

import { pathExists, readFile } from 'fs-extra';
import { dump, safeLoad, safeLoadAll } from 'js-yaml';

import { ImplementationError } from '#error';

import type { Misc } from 'ts-toolbelt';

import type { Resolved } from '#ast';

/** JSON data type */
interface JSON {
  type: 'json' | 'yaml';
  data: Misc.JSON.Object | Misc.JSON.Array;
}

/** multiple document data type */
interface Multi {
  type: 'multi';
  data: Misc.JSON.Array;
}

/** text data type */
interface Text {
  type: 'text';
  data: string;
}

/** all supported data type */
export type DataType = JSON | Multi | Text;

/**
 * ensure that the input is either a JSON array or object
 * @param json data to be tested
 */
function assertJSONArrayObject(
  json: any,
): asserts json is Misc.JSON.Array | Misc.JSON.Object {
  if (typeof json !== 'object' || json === null) {
    throw new TypeError('primitive value is unsupported for json loading');
  }
}

/**
 * format content to the specified format
 * @param content content to be formatted
 * @param to expected output format
 * @returns formatted content
 */
export function format(content: string, to: string): string {
  const INDENT = 2;

  const self = parse(content);

  switch (to) {
    case 'json':
      return JSON.stringify(self.data, null, INDENT);
    case 'yaml':
      return self.type === 'multi'
        ? self.data.map((data) => dump(data)).join('---\n')
        : dump(self.data);
    case 'text':
      return content;

    /* istanbul ignore next */
    default:
      throw new ImplementationError(`format unsupported: ${to}`);
  }
}

/**
 * try to parse the content as an JSON object
 * @param content current content to be parsed
 * @returns parsed content as an JSON object or undefined if the content format is unrecognisable
 */
export function parse(content: string): DataType {
  const [result] = [json, yaml, multiyaml, text]
    .map((fn) => {
      try {
        return fn(content);
      } catch {
        return null;
      }
    })
    .filter((data): data is DataType => data !== null);

  return result;
}

/**
 * get content from a file
 * @param filePath absolute path to the file
 * @returns file content
 */
export async function readTextFile(filePath: string): Promise<string> {
  // check the existence of the file
  if (!(await pathExists(filePath))) {
    throw new ReferenceError(`file not found: ${filePath}`);
  }

  return (await readFile(filePath)).toString();
}

/**
 * try to parse the content as a JSON string
 * @param content content to be parsed
 * @returns parsed content
 */
function json(content: string): JSON {
  const data = JSON.parse(content) as Misc.JSON.Value;
  assertJSONArrayObject(data);

  return {
    type: 'json',
    data,
  };
}

/**
 * try to parse the content as a YAML string
 * @param content content to be parsed
 * @returns parsed content
 */
function yaml(content: string): JSON {
  const data = safeLoad(content) as Misc.JSON.Value;
  assertJSONArrayObject(data);

  return {
    type: 'yaml',
    data,
  };
}

/**
 * try to parse the content as a multi-document YAML string
 * @param content content to be parsed
 * @returns parsed content
 */
function multiyaml(content: string): Multi {
  const data = safeLoadAll(content) as Misc.JSON.Array;
  assertJSONArrayObject(data);

  return {
    type: 'multi',
    data,
  };
}

/**
 * parse the content as a string
 * @param content content to be parsed
 * @returns parsed content
 */
function text(content: string): Text {
  return {
    type: 'text',
    data: content,
  };
}

/**
 * validate the number of arguments
 * @param node node with resolved args and path
 * @param expected expected number of arguments
 */
function validateArguments(node: Resolved, expected: number): void {
  const { type, segment, arguments: args } = node;

  if ((args?.length ?? 0) !== expected || (expected === 0 && args)) {
    throw new SyntaxError(
      `${type} requires ${expected} arguments in ${segment}`,
    );
  }
}

/**
 * validate the supplied path
 * @param node node with resolved args and path
 * @param expected indicate a path must be given, with undefined as optional
 */
function validatePath(node: Resolved, expected?: boolean): void {
  const { type, segment, path } = node;

  if (expected === true && !path) {
    throw new SyntaxError(`${type} requires a path in ${segment}`);
  }

  if (expected === false && path) {
    throw new SyntaxError(`${type} needs no path in ${segment}`);
  }
}

/**
 * validate inputs in the resolved node
 * @param node node with resolved args and path
 * @param criteria requirement of args and path
 * @param criteria.args expected number of arguments
 * @param criteria.path should path exists
 */
export function validateInput(
  node: Resolved,
  criteria: {
    /** expected number of arguments */
    args: number;
    /** should path exists */
    path?: boolean;
  },
): void {
  validateArguments(node, criteria.args);
  validatePath(node, criteria.path);
}
