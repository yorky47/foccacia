import { errors } from '../../commons/errors/internal-errors.mjs';
import { processRequest } from './process-request.mjs';

/**
 * Creates the Competitions Web API handlers.
 *
 * This module adapts HTTP requests to the competitions service layer.
 *
 * @param {object} competitionsServices Competitions service dependency.
 * @returns {{
 *  getAll: (req: any, res: any) => void,
 *  getTeamsByCompetition: (req: any, res: any) => void
 * }} Object with route handlers.
 */
export default function init(competitionsServices) {
  if (!competitionsServices) throw errors.INVALID_ARGUMENT('competitionsServices');
  return { getAll, getTeamsByCompetition };

  /**
   * Lists competitions from the external football API.
   *
   * Requires `X-Auth-Token` header.
   *
   * @param {any} req Express request.
   * @param {any} res Express response.
   * @returns {void}
   */
  function getAll(req, res) {
    const key = req.get('X-Auth-Token');
    processRequest(() => competitionsServices.getCompetitions(key), res);
  }

  /**
   * Lists teams (and players) for a given competition code and season.
   *
   * Requires `X-Auth-Token` header.
   * Expects `req.params.code` and optional `req.query.season`.
   *
   * @param {any} req Express request.
   * @param {any} res Express response.
   * @returns {void}
   */
  function getTeamsByCompetition(req, res) {
    const key = req.get('X-Auth-Token');
    const { code } = req.params;
    const { season } = req.query;
    processRequest(() => competitionsServices.getTeamsAndPlayers(code, season, key), res);
  }
}