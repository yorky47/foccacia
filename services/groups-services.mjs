import { INTERNAL_ERROR_CODES, errors } from '../commons/errors/internal-errors.mjs';

/**
 * Initializes the Groups Services module.
 *
 * This service enforces authorization (via users service) and performs
 * additional validation/normalization before delegating to the data layer.
 *
 * @param {object} foccaciaData Groups data module (CRUD + player operations).
 * @param {object} usersServices Users service dependency (token validation).
 * @param {object} competitionsServices Competitions service dependency (Football API access).
 * @returns {{
 *   getAll: (userToken: string) => Promise<any>,
 *   create: (groupInfo: object, userToken: string) => Promise<any>,
 *   getById: (groupId: string, userToken: string) => Promise<any>,
 *   update: (groupId: string, payload: object, userToken: string) => Promise<any>,
 *   remove: (groupId: string, userToken: string) => Promise<any>,
 *   addPlayer: (groupId: string, playerFromBody: object, userToken: string, apiKey: string) => Promise<any>,
 *   removePlayer: (groupId: string, playerId: string, userToken: string) => Promise<any>
 * }} Public API for group management.
 */
export default function init(foccaciaData, usersServices, competitionsServices) {
    if (!foccaciaData) throw errors.INVALID_ARGUMENT('foccaciaData');
    const data = foccaciaData;
    if (!usersServices) return errors.INVALID_ARGUMENT('usersServices');

    return {
        getAll,
        create,
        getById,
        update,
        remove,
        addPlayer,
        removePlayer,
    };

    function serverError(description) {
        return { internalError: INTERNAL_ERROR_CODES.SERVER_ERROR, description };
    }

    /**
     * Validates a user token.
     *
     * @param {string} token Bearer token.
     * @returns {Promise<null|{internalError:number, description:string}>} Null if authorized, otherwise an error object.
     */
    async function ensureAuth(token) {
        if (!token) return errors.MISSING_TOKEN();
        try {
            const ok = await usersServices.validateToken(token);
            if (!ok) return errors.NOT_AUTHORIZED();
        } catch {
            return errors.NOT_AUTHORIZED();
        }
        return null;
    }

    /**
     * Lists all groups owned by the authenticated user.
     *
     * @param {string} userToken Bearer token.
     * @returns {Promise<any>} Array of groups or an error object.
     */
    async function getAll(userToken) {
        const authErr = await ensureAuth(userToken);
        if (authErr) return authErr;
        try {
            const groups = await data.getAllGroups?.(userToken);
            return groups ?? [];
        } catch {
            return serverError('Failed to list groups');
        }
    }

    /**
     * Creates a new group after validating and normalizing the request payload.
     *
     * @param {{name: string, competition: string, year: number, description?: string}} groupInfo Group payload.
     * @param {string} userToken Bearer token.
     * @returns {Promise<any>} Created group or an error object.
     */
    async function create(groupInfo, userToken) {
        const authErr = await ensureAuth(userToken);
        if (authErr) return authErr;
        if (!groupInfo) return errors.INVALID_BODY('missing body');

        // Extra validation in the service layer
        if (typeof groupInfo.name !== 'string' || groupInfo.name.trim().length < 3) {
            return errors.INVALID_BODY('name must be a non-empty string (min 3)');
        }
        if (typeof groupInfo.competition !== 'string' || groupInfo.competition.trim().length === 0) {
            return errors.INVALID_BODY('competition required');
        }
        if (groupInfo.year === undefined || groupInfo.year === null) {
            return errors.INVALID_BODY('year required');
        }
        if (typeof groupInfo.year !== 'number' || !Number.isInteger(groupInfo.year)) {
            return errors.INVALID_BODY('year must be an integer');
        }
        if (groupInfo.year < 1900 || groupInfo.year > 2100) {
            return errors.INVALID_BODY('year out of range');
        }
        if (groupInfo.description !== undefined && typeof groupInfo.description !== 'string') {
            return errors.INVALID_BODY('description must be string if provided');
        }

        // Normalization
        const payload = {
            ...groupInfo,
            name: groupInfo.name.trim(),
            description: typeof groupInfo.description === 'string' ? groupInfo.description.trim() : groupInfo.description,
            competition: groupInfo.competition.trim(),
        };

        try {
            const created = await data.createGroup?.(payload, userToken);
            return created;
        } catch (e) {
            return errors.INVALID_BODY(e?.message);
        }
    }

    /**
     * Retrieves a group by id (only if it belongs to the authenticated user).
     *
     * @param {string} groupId Group identifier.
     * @param {string} userToken Bearer token.
     * @returns {Promise<any>} Group payload or an error object.
     */
    async function getById(groupId, userToken) {
        const authErr = await ensureAuth(userToken);
        if (authErr) return authErr;
        if (!groupId) return errors.MISSING_PARAMETER('groupId');
        try {
            const group = await data.getGroupById?.(groupId, userToken);
            return group ?? errors.NOT_FOUND('Group');
        } catch {
            return errors.NOT_FOUND('Group');
        }
    }

    /**
     * Updates a group's name and/or description.
     *
     * @param {string} groupId Group identifier.
     * @param {{name?: string, description?: string}} payload Update payload.
     * @param {string} userToken Bearer token.
     * @returns {Promise<any>} `{ ok: true }` on success or an error object.
     */
    async function update(groupId, payload, userToken) {
        const authErr = await ensureAuth(userToken);
        if (authErr) return authErr;
        if (!groupId) return errors.MISSING_PARAMETER('groupId');
        if (!payload) return errors.INVALID_BODY('missing body');
        if (!payload.name && !payload.description) return errors.INVALID_BODY('nothing to update');

        if (payload.name !== undefined) {
            if (typeof payload.name !== 'string' || payload.name.trim().length < 3) {
                return errors.INVALID_BODY('name must be a non-empty string (min 3)');
            }
        }
        if (payload.description !== undefined && typeof payload.description !== 'string') {
            return errors.INVALID_BODY('description must be string if provided');
        }

        try {
            const updated = await data.updateGroup?.(groupId, {
                ...payload,
                name: typeof payload.name === 'string' ? payload.name.trim() : payload.name,
                description: typeof payload.description === 'string' ? payload.description.trim() : payload.description,
            }, userToken);
            if (updated?.internalError) return updated;
            if (!updated) return errors.NOT_FOUND('Group');
            return { ok: true };
        } catch {
            return errors.NOT_FOUND('Group');
        }
    }

    /**
     * Deletes a group.
     *
     * @param {string} groupId Group identifier.
     * @param {string} userToken Bearer token.
     * @returns {Promise<any>} `{ ok: true }` on success or an error object.
     */
    async function remove(groupId, userToken) {
        const authErr = await ensureAuth(userToken);
        if (authErr) return authErr;
        if (!groupId) return errors.MISSING_PARAMETER('groupId');
        try {
            const ok = await data.deleteGroup?.(groupId, userToken);
            if (!ok) return errors.NOT_FOUND('Group');
            return { ok: true }; // web layer will respond 204
        } catch {
            return errors.NOT_FOUND('Group');
        }
    }

    /**
     * Adds a player to a group.
     *
     * Validates group ownership, checks the player exists in the official competition data,
     * ensures the group does not exceed 11 players, and prevents duplicates.
     *
     * @param {string} groupId Group identifier.
     * @param {{playerId: string|number}} playerFromBody Player payload coming from the web layer.
     * @param {string} userToken Bearer token.
     * @param {string} apiKey Football Data API key.
     * @returns {Promise<any>} Updated group or an error object.
     */
    async function addPlayer(groupId, playerFromBody, userToken, apiKey) {
        const authErr = await ensureAuth(userToken);
        if (authErr) return authErr;
        if (!groupId) return errors.MISSING_PARAMETER('groupId');
        if (!playerFromBody) return errors.INVALID_BODY('player required');
        if (!playerFromBody.playerId) return errors.INVALID_BODY('playerId required');

        try {
            const group = await data.getGroupById(groupId, userToken);
            if (!group) return errors.NOT_FOUND('Group');

            const competitionData = await competitionsServices.getTeamsAndPlayers(
                group.competition,
                group.year,
                apiKey,
            );
            if (competitionData?.error || competitionData?.internalError) return competitionData;

            const teams = competitionData.teams;
            const teamFound = teams.find((team) =>
                team.players.some((player) => String(player.playerId) === String(playerFromBody.playerId)),
            );

            if (!teamFound) {
                return errors.INVALID_BODY(
                    `Player ${playerFromBody.playerId} not found in ${group.competition} ${group.year}`,
                );
            }

            const officialPlayer = teamFound.players.find(
                (player) => String(player.playerId) === String(playerFromBody.playerId),
            );

            if (group.players.length >= 11) return errors.GROUP_FULL();

            const isDuplicate = group.players.some(
                (player) => String(player.id) === String(officialPlayer.playerId),
            );
            if (isDuplicate) return errors.PLAYER_ALREADY_EXISTS(officialPlayer.playerId);

            const newPlayer = {
                id: officialPlayer.playerId,
                name: officialPlayer.playerName,
                position: officialPlayer.position,
                nationality: officialPlayer.nationality,
                age: calculateAge(officialPlayer.dateOfBirth),
                teamId: teamFound.teamId,
                teamCode: teamFound.code || null,
                teamName: teamFound.name,
            };

            await data.addPlayerToGroup(groupId, newPlayer, userToken);

            const updated = await data.getGroupById(groupId, userToken);
            return updated;
        } catch (e) {
            return errors.NOT_FOUND('Group');
        }
    }

    /**
     * Removes a player from a group.
     *
     * @param {string} groupId Group identifier.
     * @param {string|number} playerId Player identifier.
     * @param {string} userToken Bearer token.
     * @returns {Promise<any>} `{ ok: true }` on success or an error object.
     */
    async function removePlayer(groupId, playerId, userToken) {
        const authErr = await ensureAuth(userToken);
        if (authErr) return authErr;
        if (!groupId) return errors.MISSING_PARAMETER('groupId');
        if (!playerId) return errors.MISSING_PARAMETER('playerId');
        try {
            const group = await data.getGroupById?.(groupId, userToken);
            if (!group) return errors.NOT_FOUND('Group');
            await data.removePlayerFromGroup?.(groupId, playerId, userToken);
            return { ok: true }; // web layer -> 204
        } catch {
            return errors.NOT_FOUND('Group');
        }
    }

    /**
     * Computes a player's age based on a date of birth.
     *
     * @param {string} dob ISO date string.
     * @returns {number|null} Age in years (rounded down) or null if unavailable/invalid.
     */
    function calculateAge(dob) {
        if (!dob) return null;
        const timestamp = Date.parse(dob);
        if (isNaN(timestamp)) return null;
        const diff = Date.now() - timestamp;
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }
}
