/*
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE file for details.
 * -------------------------------------------------------------------------
 *
 * @summary   Collection of resolver functions
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2020 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

import { defaults, get } from 'lodash';
import { dirname, resolve } from 'path';

import { ast } from '#ast';
import { ImplementationError } from '#error';
import { parse, readTextFile, validateInput } from '#io';
import { Template } from '#template';

import type { Misc } from 'ts-toolbelt';
import type { Resolved } from '#ast';
import type { DataType } from '#io';

/** shared context */
export interface Context {
  /** current working directory */
  cwd: string;
  /** supplied parameters */
  parameter: Record<string, string>;
  /** the whole object for self referencing */
  self: DataType;
}

/** collection of resolvers */
export const resolver: Partial<Record<
  string,
  (node: Resolved, context: Context) => Promise<string | null>
>> = {
  base64decode,
  base64encode,
  env,
  file,
  self,
  para,
};

/**
 * try to extract part of the supplied content
 * @param content content to be extracted
 * @param path path to the particular part of the content
 * @returns extracted content
 */
function extractFromRaw(content: string, path: string): string | null {
  if (path) {
    const parsedContent = parse(content);

    if (parsedContent.type === 'text') {
      throw new ImplementationError(
        `cannot resolve a path for a non-json/yaml content`,
      );
    }

    return extractFromJSON(parsedContent.data, path);
  }

  return content;
}

/**
 * get a variable node from a JSON object
 * @param json JSON data
 * @param path path to the data in the JSON
 * @returns data containing in the path as a string, or null for not found
 */
function extractFromJSON(
  json: Partial<Misc.JSON.Object> | Misc.JSON.Array,
  path: string,
): string | null {
  const data = get(json, path) as Misc.JSON.Value;

  switch (typeof data) {
    case 'boolean':
    case 'number':
      return data.toString();
    case 'string':
      return data;
    case 'object':
      return JSON.stringify(data);
    default:
      return null;
  }
}

/**
 * normalise a resolved node for destructing
 * @param node a resolved node with potentially undefined arguments and path
 * @returns a normalised node that has defaults filled in
 */
function normalise(node: Resolved): Required<Resolved> {
  return defaults(node, {
    arguments: [],
    path: '',
  });
}

/**
 * base64 decode a content
 * @param node node with resolved args and path
 * @returns decoded content
 */
async function base64decode(node: Resolved): Promise<string | null> {
  validateInput(node, { args: 1 });

  const {
    arguments: [encoded],
    path,
  } = normalise(node);

  const content = Buffer.from(encoded, 'base64').toString('utf8');

  return extractFromRaw(content, path);
}

/**
 * base64 encode a content
 * @param node node with resolved args and path
 * @returns encoded content
 */
async function base64encode(node: Resolved): Promise<string | null> {
  validateInput(node, { args: 1, path: false });

  const {
    arguments: [content],
  } = normalise(node);

  return Buffer.from(content).toString('base64');
}

/**
 * resolve an environmental variable
 * @param node node with resolved args and path
 * @returns resolved parameter
 */
async function env(node: Resolved): Promise<string | null> {
  validateInput(node, { args: 0, path: true });

  const { path } = normalise(node);

  return extractFromJSON(process.env, path);
}

/**
 * resolve content recursively from a file
 * @param node node with resolved args and path
 * @param context resolution context
 * @returns extracted content
 */
async function file(node: Resolved, context: Context): Promise<string | null> {
  validateInput(node, { args: 1 });

  const {
    arguments: [relativePath],
    path,
  } = normalise(node);
  const { cwd, parameter } = context;

  const filePath = resolve(cwd, relativePath);
  const content = await readTextFile(filePath);
  const template = new Template(content, {
    cwd: dirname(filePath),
  });
  const resolved = await template.resolve(parameter);

  return extractFromRaw(resolved, path);
}

/**
 * resolve a parameter
 * @param node node with resolved args and path
 * @param context resolution context
 * @returns resolved parameter
 */
async function para(node: Resolved, context: Context): Promise<string | null> {
  validateInput(node, { args: 0, path: true });

  const { path } = normalise(node);
  const { parameter } = context;

  return extractFromJSON(parameter, path);
}

/**
 * resolve a self reference function
 * @param self current resolved self
 * @param path path to the data in the JSON
 * @returns data containing in the path as a string, or null for unresolvable
 */

/**
 * resolve to content within its own
 * @param node node with resolved args and path
 * @param context resolution context
 * @returns extracted content
 */
async function self(node: Resolved, context: Context): Promise<string | null> {
  validateInput(node, { args: 0, path: true });

  const { path } = normalise(node);
  const { self } = context;

  if (self.type === 'text') {
    throw new Error('cannot self reference to a text based template');
  }

  const resolved = extractFromJSON(self.data, path);

  // test if the resolved content has been completely resolved
  if (resolved) {
    const nodes = ast(resolved).nodes;

    // anything more than 1 literal node means further resolution is needed
    if (!(nodes.length === 1 && nodes[0].type === 'literal')) {
      return null;
    }
  }

  return resolved;
}
