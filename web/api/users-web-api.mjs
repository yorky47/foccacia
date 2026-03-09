import { errors } from '../../commons/errors/internal-errors.mjs';
import { processRequest } from './process-request.mjs';

/**
 * Creates the Users Web API handlers.
 *
 * This module adapts HTTP requests to the users service layer.
 *
 * @param {object} usersServices Users service dependency.
 * @returns {{ addUser: (req: any, res: any) => void }} Object with route handlers.
 */
export default function init(usersServices) {
  if (!usersServices) throw errors.INVALID_ARGUMENT('usersServices');
  return { addUser };

  /**
   * Handles user registration/login creation and returns a token.
   *
   * Expects `req.body.username` and `req.body.password`.
   * Returns HTTP 201 with `{ token, username }` on success.
   *
   * @param {any} req Express request.
   * @param {any} res Express response.
   * @returns {void}
   */
  function addUser(req, res) {
    processRequest(() => usersServices.addUser(req.body?.username, req.body?.password), {
      status: (code) => ({ json: (body) => res.status(code).json(body) }),
      json: (out) => res.status(201).json({ token: out.token, username: out.name })
    });
  }
}