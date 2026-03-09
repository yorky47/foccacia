import { INTERNAL_ERROR_CODES, errors } from '../commons/errors/internal-errors.mjs';

/**
 * Initializes the Competitions Services module.
 *
 * This service wraps the Football Data API data layer and normalizes common
 * error conditions into the project's internal error format.
 *
 * @param {object} fapiTeamsData Data-layer dependency that fetches competitions and teams.
 * @returns {{
 *   getCompetitions: (apiKey: string) => Promise<any>,
 *   getAll: (apiKey: string) => Promise<any>,
 *   getTeamsAndPlayers: (code: string, season: number|string, apiKey: string) => Promise<any>,
 *   getTeamsByCompetition: (code: string, season: number|string, apiKey: string) => Promise<any>
 * }} Public API for competitions-related operations.
 */
export default function init(fapiTeamsData) {
    if (!fapiTeamsData) throw errors.INVALID_ARGUMENT('fapiTeamsData');

    return {
        getCompetitions,
        getAll: getCompetitions,
        getTeamsAndPlayers,
        getTeamsByCompetition: getTeamsAndPlayers,
    };

    /**
     * Fetches the list of competitions available for the given Football API key.
     *
     * @param {string} apiKey Football Data API key from the `X-Auth-Token` header.
     * @returns {Promise<any>} A list of competitions or an internal error object.
     */
    async function getCompetitions(apiKey) {
        if (!apiKey) return errors.MISSING_PARAMETER('X-Auth-Token');
        try {
            const result = await fapiTeamsData.fetchCompetitions(apiKey);
            if (result?.error) return mapFootballApiError(result);
            return result;
        } catch {
            return { internalError: INTERNAL_ERROR_CODES.SERVER_ERROR, description: 'Failed to fetch competitions' };
        }
    }

    /**
     * Fetches teams (and their players) for a competition code and season.
     *
     * @param {string} code Competition code (e.g., "PL").
     * @param {number|string} season Season year (e.g., 2024).
     * @param {string} apiKey Football Data API key from the `X-Auth-Token` header.
     * @returns {Promise<any>} Competition + teams payload or an internal error object.
     */
    async function getTeamsAndPlayers(code, season, apiKey) {
        if (!apiKey) return errors.MISSING_PARAMETER('X-Auth-Token');
        if (!code) return errors.MISSING_PARAMETER('code');
        if (!season) return errors.MISSING_PARAMETER('season');
        try {
            const result = await fapiTeamsData.fetchTeamsAndPlayers(code, season, apiKey);
            if (result?.error) return mapFootballApiError(result, code);
            return result;
        } catch {
            return { internalError: INTERNAL_ERROR_CODES.SERVER_ERROR, description: 'Failed to fetch teams and players' };
        }
    }
}

/**
 * Maps Football Data API error payloads to the project's internal error format.
 *
 * @param {{status?: number}} apiErr Error payload returned by the data layer.
 * @param {string} [resource] Optional resource identifier for 404 errors.
 * @returns {{internalError: number, description: string}} Internal error object.
 */
function mapFootballApiError(apiErr, resource) {
    switch (apiErr.status) {
        case 401:
        case 403:
            return { internalError: INTERNAL_ERROR_CODES.NOT_AUTHORIZED, description: 'Football API key unauthorized' };
        case 404:
            return errors.NOT_FOUND(resource || 'Resource');
        case 429:
            return { internalError: INTERNAL_ERROR_CODES.INVALID_QUERY, description: 'Rate limit exceeded. Please try later.' };
        default:
            return { internalError: INTERNAL_ERROR_CODES.SERVER_ERROR, description: `Football API error (${apiErr.status})` };
    }
}