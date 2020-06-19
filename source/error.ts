/*
 *                            *** MIT LICENSE ***
 * -------------------------------------------------------------------------
 * This code may be modified and distributed under the MIT license.
 * See the LICENSE file for details.
 * -------------------------------------------------------------------------
 *
 * @summary   Provide custom errors for better clarity
 *
 * @author    Alvis HT Tang <alvis@hilbert.space>
 * @license   MIT
 * @copyright Copyright (c) 2020 - All Rights Reserved.
 * -------------------------------------------------------------------------
 */

/* eslint-disable max-classes-per-file */

import { ExtendableError } from 'ts-error';

/** any error related to unimplemented mapping */
export class ImplementationError extends ExtendableError {}

/** any error completely unexpected, implying a bug */
export class LogicError extends ExtendableError {}

/** any error related to invalid syntax */
export class SyntaxError extends ExtendableError {}

/** any error related to invalid argument type */
export class ValidationError extends ExtendableError {}

/* eslint-enable max-classes-per-file */
