/**
 * @typedef {object} InternalError
 * @property {number} internalError Internal numeric error code.
 * @property {string} description Human-readable error description.
 */

/**
 * Internal error codes used across the application.
 *
 * These codes are consumed by the services layer and mapped to HTTP responses by
 * [commons/errors/errors-to-http-responses.mjs](commons/errors/errors-to-http-responses.mjs).
 *
 * @type {{
 *   INVALID_BODY: number,
 *   INVALID_QUERY: number,
 *   INVALID_PARAMETER: number,
 *   NOT_FOUND: number,
 *   USER_ALREADY_EXISTS: number,
 *   MISSING_TOKEN: number,
 *   NOT_AUTHORIZED: number,
 *   MISSING_PARAMETER: number,
 *   GROUP_FULL: number,
 *   PLAYER_ALREADY_EXISTS: number,
 *   SERVER_ERROR: number
 * }}
 */
export const INTERNAL_ERROR_CODES = {
  INVALID_BODY: 1,
  INVALID_QUERY: 2,
  INVALID_PARAMETER: 3,
  NOT_FOUND: 4,
  USER_ALREADY_EXISTS: 5,
  MISSING_TOKEN: 6,
  NOT_AUTHORIZED: 7,
  MISSING_PARAMETER: 8,
  GROUP_FULL: 9,
  PLAYER_ALREADY_EXISTS: 10,
  SERVER_ERROR: 99
};

/**
 * Factory functions for commonly used internal errors.
 *
 * @type {{
 *   INVALID_ARGUMENT: (name: string) => InternalError,
 *   INVALID_BODY: (why?: string) => InternalError,
 *   INVALID_PARAMETER: (parameterName: string) => InternalError,
 *   NOT_FOUND: (what?: string) => InternalError,
 *   USER_ALREADY_EXISTS: (userName: string) => InternalError,
 *   MISSING_TOKEN: () => InternalError,
 *   NOT_AUTHORIZED: () => InternalError,
 *   MISSING_PARAMETER: (parameterName: string) => InternalError,
 *   GROUP_FULL: () => InternalError,
 *   PLAYER_ALREADY_EXISTS: (playerId: string|number) => InternalError
 * }}
 */
export const errors = {
  INVALID_ARGUMENT: (name) => ({
    internalError: INTERNAL_ERROR_CODES.INVALID_PARAMETER,
    description: `Invalid argument: ${name}`
  }),
  INVALID_BODY: (why) => ({
    internalError: INTERNAL_ERROR_CODES.INVALID_BODY,
    description: `Invalid body${why ? ': ' + why : ''}`
  }),
  INVALID_PARAMETER: (parameterName) => ({
    internalError: INTERNAL_ERROR_CODES.INVALID_PARAMETER,
    description: `Invalid parameter: ${parameterName}`
  }),
  NOT_FOUND: (what) => ({
    internalError: INTERNAL_ERROR_CODES.NOT_FOUND,
    description: `${what ?? 'Resource'} not found`
  }),
  USER_ALREADY_EXISTS: (userName) => ({
    internalError: INTERNAL_ERROR_CODES.USER_ALREADY_EXISTS,
    description: `User '${userName}' already exists`
  }),
  MISSING_TOKEN: () => ({ internalError: INTERNAL_ERROR_CODES.MISSING_TOKEN, description: 'Missing Token' }),
  NOT_AUTHORIZED: () => ({ internalError: INTERNAL_ERROR_CODES.NOT_AUTHORIZED, description: 'Not authorized' }),
  MISSING_PARAMETER: (parameterName) => ({
    internalError: INTERNAL_ERROR_CODES.MISSING_PARAMETER,
    description: `Missing parameter: ${parameterName}`
  }),
  GROUP_FULL: () => ({ internalError: INTERNAL_ERROR_CODES.GROUP_FULL, description: 'Group already has 11 players' }),
  PLAYER_ALREADY_EXISTS: (playerId) => ({
    internalError: INTERNAL_ERROR_CODES.PLAYER_ALREADY_EXISTS,
    description: `Player '${playerId}' already exists in group`
  })
};