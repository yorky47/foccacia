import { INTERNAL_ERROR_CODES } from './internal-errors.mjs';

/**
 * @typedef {object} InternalError
 * @property {number} internalError Internal numeric error code.
 * @property {string} description Human-readable error description.
 */

/**
 * @typedef {object} HttpResponseError
 * @property {number} status HTTP status code.
 * @property {{ code: number, error: string }} body Response payload.
 */

/**
 * Creates a simple HTTP error response object.
 *
 * @param {number} status HTTP status code.
 * @param {InternalError} internalError Domain/internal error representation.
 * @returns {HttpResponseError}
 */
function HttpResponseError(status, internalError) {
  this.status = status;
  this.body = { code: internalError.internalError, error: internalError.description };
}

/**
 * Maps an internal/domain error into an HTTP error response.
 *
 * Used by the web layer to translate service errors into consistent HTTP status codes
 * and response payloads.
 *
 * @param {InternalError} internalError Domain/internal error representation.
 * @returns {HttpResponseError} An object with `status` and `body` ready to be sent.
 */
export function errorToHttp(internalError) {
  switch (internalError.internalError) {
    case INTERNAL_ERROR_CODES.INVALID_BODY:
    case INTERNAL_ERROR_CODES.INVALID_QUERY:
    case INTERNAL_ERROR_CODES.INVALID_PARAMETER:
    case INTERNAL_ERROR_CODES.MISSING_PARAMETER:
    case INTERNAL_ERROR_CODES.USER_ALREADY_EXISTS:
      return new HttpResponseError(400, internalError);
    case INTERNAL_ERROR_CODES.MISSING_TOKEN:
    case INTERNAL_ERROR_CODES.NOT_AUTHORIZED:
      return new HttpResponseError(401, internalError);
    case INTERNAL_ERROR_CODES.NOT_FOUND:
      return new HttpResponseError(404, internalError);
    case INTERNAL_ERROR_CODES.GROUP_FULL:
    case INTERNAL_ERROR_CODES.PLAYER_ALREADY_EXISTS:
      return new HttpResponseError(409, internalError);
    default:
      return new HttpResponseError(
        500,
        { internalError: INTERNAL_ERROR_CODES.SERVER_ERROR, description: 'Internal server error' }
      );
  }
}
