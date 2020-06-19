/*
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE file for details.
 * -------------------------------------------------------------------------
 *
 * @summary   Helpers for handling error
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2020 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

/* istanbul ignore file */

import createCallsiteRecord from 'callsite-record';
import chalk from 'chalk';

import { SyntaxError, ValidationError } from '../error';

/**
 * print error nicely on console
 * @param error the error to be reported
 */
export async function handleError(error: Error): Promise<void> {
  try {
    // print the error message
    const type = chalk.red.bold(`[${error.name}]`);
    const message = chalk.white.bold(error.message);
    process.stderr.write(`${type} ${message}\n`);

    // print the callsite record if the error is not an user error
    if (
      !(
        error instanceof ReferenceError ||
        error instanceof SyntaxError ||
        error instanceof ValidationError
      )
    ) {
      const record = createCallsiteRecord({ forError: error });

      if (record) {
        process.stderr.write(`\n${await record.render({})}`);
      }
    }
  } catch {
    // do nothing
  }
}
