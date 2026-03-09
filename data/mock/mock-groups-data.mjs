/**
 * Creates a mock groups data access module with an initial dataset.
 *
 * @returns {{
 *   getAllGroups: (userToken: string) => Promise<Array<object>>,
 *   createGroup: (groupInfo: object, userToken: string) => Promise<object>,
 *   getGroupById: (groupId: string|number, userToken: string) => Promise<object | null>,
 *   updateGroup: (groupId: string|number, payload: object, userToken: string) => Promise<object | null>,
 *   deleteGroup: (groupId: string|number, userToken: string) => Promise<boolean>,
 *   addPlayerToGroup: (groupId: string|number, player: object, userToken: string) => Promise<object | null>,
 *   removePlayerFromGroup: (groupId: string|number, playerId: string|number, userToken: string) => Promise<boolean>
 * }} Data access API.
 */
export default function init() {
    // Initial state for tests
    // Group 1: Empty group (0 players) - PL 2025
    // Group 2: Full group (11 players) - PL 2024
    // Group 3: Group with 1 player (for duplicate test) - PL 2024
    const GROUPS = [
        {
            id: 1,
            name: "Melhores de 2025",
            description: "My Best XI for 2025 season",
            competition: "PL",
            year: 2025,
            players: [],
            userToken: "valid-token"
        },
        {
            id: 2,
            name: "Full Group",
            description: "Test Group 2",
            competition: "PL",
            year: 2024,
            players: Array.from({ length: 11 }, (_, i) => ({ id: 100 + i, playerName: `Player ${100 + i}` })),
            userToken: "valid-token"
        },
        {
            id: 3,
            name: "Group with Player",
            description: "Test Group 3",
            competition: "PL",
            year: 2024,
            players: [{ id: 999, playerName: "Existing Player" }],
            userToken: "valid-token"
        }
    ];

    let nextId = 4; // Start after initial groups

    return {
        getAllGroups,
        createGroup,
        getGroupById,
        updateGroup,
        deleteGroup,
        addPlayerToGroup,
        removePlayerFromGroup
    };

    /**
     * Lists all groups owned by a user.
     *
     * @param {string} userToken User token.
     * @returns {Promise<Array<object>>} Groups.
     */
    function getAllGroups(userToken) {
        return Promise.resolve(GROUPS.filter(g => g.userToken === userToken));
    }

    /**
     * Creates a new group.
     *
     * @param {{name: string, description?: string, competition: string, year: number}} groupInfo Group payload.
     * @param {string} userToken User token.
     * @returns {Promise<object>} Created group.
     */
    function createGroup(groupInfo, userToken) {
        return new Promise((resolve) => {
            const newGroup = {
                id: nextId++,
                name: groupInfo.name,
                description: groupInfo.description || "",
                competition: groupInfo.competition,
                year: groupInfo.year,
                players: [],
                userToken: userToken
            };
            GROUPS.push(newGroup);
            resolve(newGroup);
        });
    }

    /**
     * Retrieves a group by id.
     *
     * @param {string|number} groupId Group id.
     * @param {string} userToken User token.
     * @returns {Promise<object | null>} Group or `null`.
     */
    function getGroupById(groupId, userToken) {
        return new Promise((resolve) => {
            const group = GROUPS.find(g => g.id === Number(groupId) && g.userToken === userToken);
            // Return direct reference (not a copy) so mutations persist for addPlayer
            resolve(group || null);
        });
    }

    /**
     * Updates group name/description.
     *
     * @param {string|number} groupId Group id.
     * @param {{name?: string, description?: string}} payload Partial update payload.
     * @param {string} userToken User token.
     * @returns {Promise<object | null>} Updated group or `null` if not found.
     */
    function updateGroup(groupId, payload, userToken) {
        return new Promise((resolve) => {
            const group = GROUPS.find(g => g.id === Number(groupId) && g.userToken === userToken);
            if (!group) {
                resolve(null);
                return;
            }
            if (payload.name) group.name = payload.name;
            if (payload.description) group.description = payload.description;
            resolve(group);
        });
    }

    /**
     * Deletes a group.
     *
     * @param {string|number} groupId Group id.
     * @param {string} userToken User token.
     * @returns {Promise<boolean>} `true` when deleted.
     */
    function deleteGroup(groupId, userToken) {
        return new Promise((resolve) => {
            const index = GROUPS.findIndex(g => g.id === Number(groupId) && g.userToken === userToken);
            if (index === -1) {
                resolve(false);
                return;
            }
            GROUPS.splice(index, 1);
            resolve(true);
        });
    }

    /**
     * Adds a player to a group.
     *
     * @param {string|number} groupId Group id.
     * @param {object} player Player payload.
     * @param {string} userToken User token.
     * @returns {Promise<object | null>} Updated group or `null` if not found.
     */
    function addPlayerToGroup(groupId, player, userToken) {
        return new Promise((resolve) => {
            const group = GROUPS.find(g => g.id === Number(groupId) && g.userToken === userToken);
            if (!group) {
                resolve(null);
                return;
            }
            group.players.push(player);
            resolve(group);
        });
    }

    /**
     * Removes a player from a group.
     *
     * @param {string|number} groupId Group id.
     * @param {string|number} playerId Player id.
     * @param {string} userToken User token.
     * @returns {Promise<boolean>} `true` when removed.
     */
    function removePlayerFromGroup(groupId, playerId, userToken) {
        return new Promise((resolve) => {
            const group = GROUPS.find(g => g.id === Number(groupId) && g.userToken === userToken);
            if (!group) {
                resolve(false);
                return;
            }
            const index = group.players.findIndex(p => String(p.playerId) === String(playerId));
            if (index === -1) {
                resolve(false);
                return;
            }
            group.players.splice(index, 1);
            resolve(true);
        });
    }
}
