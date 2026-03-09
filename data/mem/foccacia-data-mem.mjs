// Very simple in-memory data store for groups (teacher-style mock)
// No business rules here (max 11, duplicates, etc.) — those belong in services.

/**
 * Creates an in-memory groups data access module.
 *
 * @returns {{
 *   getAllGroups: (userToken: string) => Promise<Array<object>>,
 *   createGroup: (groupInfo: object, userToken: string) => Promise<object>,
 *   getGroupById: (groupId: string|number, userToken: string) => Promise<object>,
 *   updateGroup: (groupId: string|number, payload: object, userToken: string) => Promise<object>,
 *   deleteGroup: (groupId: string|number, userToken: string) => Promise<boolean>,
 *   addPlayerToGroup: (groupId: string|number, player: object, userToken: string) => Promise<object>,
 *   removePlayerFromGroup: (groupId: string|number, playerId: string|number, userToken: string) => Promise<boolean>
 * }} Data access API.
 */
export default function init() {
	const groups = [];
	let nextId = 1;

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
	 * Lists all groups owned by a specific user.
	 *
	 * @param {string} userToken User token.
	 * @returns {Promise<Array<object>>} List of groups.
	 */
	async function getAllGroups(userToken) {
		return groups.filter((g) => g.userToken === userToken);
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
			id: nextId++,
			name: groupInfo.name,
			description: groupInfo.description || '',
			competition: groupInfo.competition,
			year: groupInfo.year,
			players: [],
			userToken,
		};
		groups.push(newGroup);
		return newGroup;
	}

	/**
	 * Retrieves a group by id.
	 *
	 * @param {string|number} groupId Group id.
	 * @param {string} userToken User token.
	 * @returns {Promise<object>} Group.
	 * @throws {Error} When the group does not exist for the given user.
	 */
	async function getGroupById(groupId, userToken) {
		const id = parseInt(groupId, 10);
		const group = groups.find((g) => g.id === id && g.userToken === userToken);
		if (!group) throw new Error(`Group ${groupId} not found`);
		return group;
	}

	/**
	 * Updates a group name/description.
	 *
	 * @param {string|number} groupId Group id.
	 * @param {{name?: string, description?: string}} payload Partial update payload.
	 * @param {string} userToken User token.
	 * @returns {Promise<object>} Updated group.
	 */
	async function updateGroup(groupId, payload, userToken) {
		const g = await getGroupById(groupId, userToken);
		if (payload?.name !== undefined) g.name = payload.name;
		if (payload?.description !== undefined) g.description = payload.description;
		return g;
	}

	/**
	 * Deletes a group.
	 *
	 * @param {string|number} groupId Group id.
	 * @param {string} userToken User token.
	 * @returns {Promise<boolean>} `true` when deleted.
	 */
	async function deleteGroup(groupId, userToken) {
		const id = parseInt(groupId, 10);
		const idx = groups.findIndex((g) => g.id === id && g.userToken === userToken);
		if (idx < 0) throw new Error(`Group ${groupId} not found`);
		groups.splice(idx, 1);
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
		const g = await getGroupById(groupId, userToken);
		g.players.push(player);
		return g;
	}

	/**
	 * Removes a player from a group.
	 *
	 * @param {string|number} groupId Group id.
	 * @param {string|number} playerId Player id.
	 * @param {string} userToken User token.
	 * @returns {Promise<boolean>} `true` (even if player was not present).
	 */
	async function removePlayerFromGroup(groupId, playerId, userToken) {
		const g = await getGroupById(groupId, userToken);
		const idx = g.players.findIndex((p) => String(p.id) === String(playerId));
		if (idx >= 0) g.players.splice(idx, 1);
		return true;
	}
}

