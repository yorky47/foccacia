import { errorToHttp } from '../../commons/errors/errors-to-http-responses.mjs';
import { INTERNAL_ERROR_CODES } from '../../commons/errors/internal-errors.mjs';

/**
 * Executes a service operation (sync or async) and writes a normalized HTTP response.
 *
 * Converts known internal error payloads into the corresponding HTTP response using
 * {@link errorToHttp}. Any unexpected exception/rejection is treated as an internal server error.
 *
 * @param {() => any | Promise<any>} op Operation to execute.
 * @param {{ status?: (code: number) => any, json: (body: any) => any }} res Response-like object.
 * @returns {void}
 */
export function processRequest(op, res) {
  try {
    const result = op();
    if (result && typeof result.then === 'function') {
      // Promise-like
      result
        .then((out) => send(out, res))
        .catch((err) => {
          console.error('processRequest: unhandled rejection', err);
          send({ internalError: INTERNAL_ERROR_CODES.SERVER_ERROR, description: 'Internal server error' }, res);
        });
    } else {
      send(result, res);
    }
  } catch (err) {
    console.error('processRequest: unhandled exception', err);
    send({ internalError: INTERNAL_ERROR_CODES.SERVER_ERROR, description: 'Internal server error' }, res);
  }
}

function send(out, res) {
  if (out?.internalError) {
    const err = errorToHttp(out);
    res.status(err.status).json(err.body);
    return;
  }
  res.json(out);
}
