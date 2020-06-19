/*
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE file for details.
 * -------------------------------------------------------------------------
 *
 * @summary   Entry point for the command line interface (CLI)
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2020 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

import { readFile } from 'fs-extra';
import stdin from 'get-stdin';
import { dirname } from 'path';
import yargs from 'yargs';

import { ValidationError } from '#error';
import { format } from '#io';
import { Template } from '#template';

import type { Arguments, Argv } from 'yargs';

const CONSOLE_WIDTH = 120;

interface Options {
  format: 'text' | 'json' | 'yaml';
  parameters: string[];
}

/**
 * entry point for the CLI
 */
export async function entry(): Promise<void> {
  const contentFromStdin = await stdin();

  const [_node, _executable, ...args] = process.argv;

  await yargs
    .wrap(Math.min(CONSOLE_WIDTH, yargs.terminalWidth()))
    .usage('preconfig: a language agnostic config preparation tool')
    .showHelpOnFail(true)
    .command({
      command: '*',
      describe: 'run a template script',
      builder: generateBuilder(!!contentFromStdin),
      handler: generateHandler(contentFromStdin),
    })
    .demandCommand()
    .parse(args)._promise;
}

/**
 * turn key=value pairs into an object
 * @param kvs list of key value pairs
 * @returns key value object: {[key]: value}
 */
function parseParameterPairs(kvs: string[]): Record<string, string> {
  return Object.fromEntries(
    kvs.map((kv): [string, string] => {
      const [key, value] = kv.split('=');

      if (key && value) {
        return [key, value];
      } else {
        throw new ValidationError(`${kv} is not a key=value pair`);
      }
    }),
  );
}

/**
 * attach examples to a yarg CLI instance
 * @param argv a yarg CLI instance
 * @returns example loaded yarg CLI instance
 */
function attachExamples<T>(argv: Argv<T>): Argv<T> {
  const examples: Array<Record<'usage' | 'description', string>> = [
    {
      usage: 'cat template.json | $0',
      description:
        'Take the input from stdin and print the resolved template on stdout',
    },
    {
      usage: '$0 template.yml',
      description:
        'Take the input from a file and print the resolved template on stdout',
    },
    {
      usage: `$0 template.yml -f json`,
      description: `Resolve the template and convert it into a json string`,
    },
    {
      usage: `$0 template.yml -p env=dev host=domain`,
      description: `Resolve the template with variables {env: 'dev', host: 'domain'}`,
    },
  ];

  return examples.reduce(
    (cli, { usage, description }) => cli.example(usage, description),
    argv,
  );
}

/**
 * attach options to a yargs instance
 * @param yargs a yargs instance
 * @returns a yargs instance with options attached
 */
function attachOptions(
  yargs: Argv,
): Argv<{ format: 'text' | 'json' | 'yaml'; parameters: string[] }> {
  return yargs
    .options('format', {
      alias: 'f',
      choices: ['text', 'json', 'yaml'],
      description: 'Output format',
      default: 'text' as 'text' | 'json' | 'yaml',
    })
    .options('parameters', {
      array: true,
      type: 'string',
      alias: 'p',
      description: 'list of parameters in key=value, delimited by a space',
      default: [],
    });
}

/**
 * generate a CLI builder
 * @param hasInput indicate whether there's any data from stdin
 * @returns a yargs CLI instance
 */
function generateBuilder(hasInput: boolean): (yargs: Argv) => Argv<Options> {
  return (yargs: Argv) => {
    const cli = attachExamples(attachOptions(yargs));

    return hasInput
      ? cli.usage('$0 [-p parameters] [-f format]')
      : cli.usage('$0 <file> [-p parameters] [-f format]').positional('file', {
          type: 'string',
          description: 'path to the input file',
        });
  };
}

/**
 * generate a handler
 * @param contentFromStdin input from stdin
 * @returns a yargs handler
 */
function generateHandler(
  contentFromStdin: string,
): (argv: Arguments<Options>) => void {
  return (argv) => {
    argv._promise = (async () => {
      // get the file path parameter
      const [path] = argv._;

      // gather essential information
      const input = contentFromStdin || (await readFile(path)).toString();
      const parameter = parseParameterPairs(argv.parameters);
      const cwd = path ? dirname(path) : process.cwd();

      // create a template instance
      const template = new Template(input, { cwd });

      // resolve the template as plain text
      const output = await template.resolve(parameter);

      // format and  write the result into the console
      process.stdout.write(format(output, argv.format));
    })();
  };
}
