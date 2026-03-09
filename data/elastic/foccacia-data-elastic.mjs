/**
 * Creates an ElasticSearch-backed groups data access module.
 *
 * @param {string} [elasticUrl='http://localhost:9200'] ElasticSearch base URL.
 * @param {typeof fetch} fetch Fetch implementation to use for HTTP requests.
 * @returns {{
 *   getAllGroups: (userToken: string) => Promise<Array<object>>,
 *   createGroup: (groupInfo: object, userToken: string) => Promise<object>,
 *   getGroupById: (groupId: string|number, userToken: string) => Promise<object | null>,
 *   updateGroup: (groupId: string|number, payload: object, userToken: string) => Promise<object>,
 *   deleteGroup: (groupId: string|number, userToken: string) => Promise<boolean>,
 *   addPlayerToGroup: (groupId: string|number, player: object, userToken: string) => Promise<object>,
 *   removePlayerFromGroup: (groupId: string|number, playerId: string|number, userToken: string) => Promise<boolean>
 * }} Data access API.
 */
export default function init(elasticUrl = 'http://localhost:9200', fetch) {
    const INDEX_NAME = 'groups';
    const ELASTIC_GROUPS_URL = `${elasticUrl}/${INDEX_NAME}`;

    return {
        getAllGroups,
        createGroup,
        getGroupById,
        updateGroup,
        deleteGroup,
        addPlayerToGroup,
        removePlayerFromGroup,
    };

    /**
     * Parses ElasticSearch responses and throws on errors.
     *
     * @param {Response} res Fetch response.
     * @returns {Promise<any>} Parsed JSON body.
     */
    async function checkError(res) {
        if (!res.ok) {
            if (res.status === 404) return null;
            const err = await res.json();
            throw new Error(err.error?.reason || 'ElasticSearch Error');
        }
        return res.json();
    }

    function mapHitToGroup(hit) {
        return {
            id: hit._id,
            ...hit._source
        };
    }

    /**
     * Lists all groups owned by a user.
     *
     * @param {string} userToken User token.
     * @returns {Promise<Array<object>>} List of groups.
     */
    async function getAllGroups(userToken) {

        const query = {
            query: {
                term: { "userToken.keyword": userToken }
            }
        };

        const response = await fetch(`${ELASTIC_GROUPS_URL}/_search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });

        if (response.status === 404) return [];   
        const body = await checkError(response);
        return body.hits.hits.map(mapHitToGroup);
    }

    /**
     * Creates a new group.
     *
     * @param {{name: string, description?: string, competition: string, year: number}} groupInfo Group payload.
     * @param {string} userToken User token.
     * @returns {Promise<object>} Created group.
     */
    async function createGroup(groupInfo, userToken) {
        const newGroup = {
            name: groupInfo.name,
            description: groupInfo.description || '',
            competition: groupInfo.competition,
            year: groupInfo.year,
            players: [],
            userToken: userToken,
        };

        const response = await fetch(`${ELASTIC_GROUPS_URL}/_doc?refresh=wait_for`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newGroup)
        });

        const body = await checkError(response);

        return {
            id: body._id,
            ...newGroup
        };
    }

    /**
     * Retrieves a group by id and validates ownership.
     *
     * @param {string|number} groupId Group id.
     * @param {string} userToken User token.
     * @returns {Promise<object | null>} Group or `null` if it does not exist.
     * @throws {Error & {status?: number}} When the group exists but belongs to another user.
     */
    async function getGroupById(groupId, userToken) {
        const response = await fetch(`${ELASTIC_GROUPS_URL}/_doc/${groupId}`);
        
        if (response.status === 404) {
             return null;
        }

        const body = await checkError(response);
        const group = mapHitToGroup(body);


        if (group.userToken !== userToken) {
            const error = new Error(`Unauthorized access to group ${groupId}`);
            error.status = 403;
            throw error;
        }

        return group;
    }

    /**
     * Updates a group fields (name/description/year).
     *
     * @param {string|number} groupId Group id.
     * @param {{name?: string, description?: string, year?: number}} payload Partial update payload.
     * @param {string} userToken User token.
     * @returns {Promise<object>} Updated group.
     */
    async function updateGroup(groupId, payload, userToken) {

        const group = await getGroupById(groupId, userToken);

        if (payload?.name !== undefined) group.name = payload.name;
        if (payload?.description !== undefined) group.description = payload.description;
        if (payload?.year !== undefined) group.year = payload.year;


        const { id, ...groupData } = group;

        await fetch(`${ELASTIC_GROUPS_URL}/_doc/${groupId}?refresh=wait_for`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(groupData)
        });

        return group;
    }

    /**
     * Deletes a group.
     *
     * @param {string|number} groupId Group id.
     * @param {string} userToken User token.
     * @returns {Promise<boolean>} `true` when deleted.
     */
    async function deleteGroup(groupId, userToken) {
        await getGroupById(groupId, userToken);

        const response = await fetch(`${ELASTIC_GROUPS_URL}/_doc/${groupId}?refresh=wait_for`, {
            method: 'DELETE'
        });

        await checkError(response);
        return true;
    }

    /**
     * Adds a player to a group.
     *
     * @param {string|number} groupId Group id.
     * @param {object} player Player payload.
     * @param {string} userToken User token.
     * @returns {Promise<object>} Updated group.
     */
    async function addPlayerToGroup(groupId, player, userToken) {
        const group = await getGroupById(groupId, userToken);

        if (!group.players) group.players = [];
        group.players.push(player);

        const { id, ...groupData } = group;

        await fetch(`${ELASTIC_GROUPS_URL}/_doc/${groupId}?refresh=wait_for`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(groupData)
        });

        return group;
    }

    /**
     * Removes a player from a group.
     *
     * @param {string|number} groupId Group id.
     * @param {string|number} playerId Player id.
     * @param {string} userToken User token.
     * @returns {Promise<boolean>} `true`.
     */
    async function removePlayerFromGroup(groupId, playerId, userToken) {
        const group = await getGroupById(groupId, userToken);

        if (group.players) {
            const idx = group.players.findIndex((p) => String(p.id) === String(playerId));
            if (idx >= 0) {
                group.players.splice(idx, 1);
            }
        }
        const { id, ...groupData } = group;

        await fetch(`${ELASTIC_GROUPS_URL}/_doc/${groupId}?refresh=wait_for`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(groupData)
        });

        return true;
    }

}
