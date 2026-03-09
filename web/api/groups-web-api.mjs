import { errors } from '../../commons/errors/internal-errors.mjs';
import { processRequest } from './process-request.mjs';

/**
 * Creates the Groups Web API handlers.
 *
 * This module adapts HTTP requests to the groups service layer.
 *
 * @param {object} groupsServices Groups service dependency.
 * @returns {{
 *  getAll: (req: any, res: any) => void,
 *  create: (req: any, res: any) => void,
 *  getById: (req: any, res: any) => void,
 *  update: (req: any, res: any) => void,
 *  remove: (req: any, res: any) => void,
 *  addPlayer: (req: any, res: any) => void,
 *  removePlayer: (req: any, res: any) => void
 * }} Object with route handlers.
 */
export default function init(groupsServices) {
    if (!groupsServices) throw errors.INVALID_ARGUMENT('groupsServices');
    return { getAll, create, getById, update, remove, addPlayer, removePlayer };

    /**
     * Lists all groups for the authenticated user (if any).
     *
     * @param {any} req Express request.
     * @param {any} res Express response.
     * @returns {void}
     */
    function getAll(req, res) {
        const token = getBearer(req.get('Authorization'));
        processRequest(() => groupsServices.getAll(token), res);
    }

    /**
     * Creates a new group.
     *
     * @param {any} req Express request.
     * @param {any} res Express response.
     * @returns {void}
     */
    function create(req, res) {
        const token = getBearer(req.get('Authorization'));
        processRequest(() => groupsServices.create(req.body, token), res);
    }

    /**
     * Fetches a group details by id.
     *
     * @param {any} req Express request.
     * @param {any} res Express response.
     * @returns {void}
     */
    function getById(req, res) {
        const token = getBearer(req.get('Authorization'));
        processRequest(() => groupsServices.getById(req.params.groupId, token), res);
    }

    /**
     * Updates a group by id.
     *
     * @param {any} req Express request.
     * @param {any} res Express response.
     * @returns {void}
     */
    function update(req, res) {
        const token = getBearer(req.get('Authorization'));
        processRequest(() => groupsServices.update(req.params.groupId, req.body, token), res);
    }

    /**
     * Removes a group by id.
     *
     * @param {any} req Express request.
     * @param {any} res Express response.
     * @returns {void}
     */
    function remove(req, res) {
        const token = getBearer(req.get('Authorization'));
        processRequest(() => groupsServices.remove(req.params.groupId, token), res);
    }

    /**
     * Adds a player to a group.
     *
     * Uses `Authorization: Bearer <token>` and `X-Auth-Token` (external API key).
     *
     * @param {any} req Express request.
     * @param {any} res Express response.
     * @returns {void}
     */
    function addPlayer(req, res) {
        const token = getBearer(req.get('Authorization'));
        const apiKey = req.get('X-Auth-Token');
        processRequest(() => groupsServices.addPlayer(req.params.groupId, req.body, token, apiKey), res);
    }

    /**
     * Removes a player from a group.
     *
     * @param {any} req Express request.
     * @param {any} res Express response.
     * @returns {void}
     */
    function removePlayer(req, res) {
        const token = getBearer(req.get('Authorization'));
        processRequest(() => groupsServices.removePlayer(req.params.groupId, req.params.playerId, token), res);
    }
}

/**
 * Extracts a Bearer token from an Authorization header.
 *
 * @param {string | undefined | null} authHeader Raw Authorization header.
 * @returns {string | null} Bearer token if present; otherwise null.
 */
function getBearer(authHeader) {
    if (!authHeader) return null;
    const trimmedHeader = authHeader.trim();
    const prefix = 'Bearer ';
    return trimmedHeader.startsWith(prefix)
        ? trimmedHeader.substring(prefix.length).trim()
        : null;
}