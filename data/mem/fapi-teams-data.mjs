const URL = 'https://api.football-data.org/v4';

/**
 * Creates a data access module for the external Football-Data API.
 *
 * @returns {{
 *   fetchCompetitions: (apiKey: string) => Promise<Array<{code: string, name: string, area: string, year: number | null}> | {error: true, status: number, message: string}>,
 *   fetchTeamsAndPlayers: (code: string, season: string|number, apiKey: string) => Promise<{competition: object, teams: Array<object>} | {error: true, status: number, message: string}>
 * }} API client.
 */
export default function init() {
	return {
		fetchCompetitions,
		fetchTeamsAndPlayers
	};
}

/**
 * Fetches available competitions.
 *
 * @param {string} apiKey Football-Data API key.
 * @returns {Promise<Array<{code: string, name: string, area: string, year: number | null}> | {error: true, status: number, message: string}>}
 * Competitions list or an error object.
 */
async function fetchCompetitions(apiKey) {
	try {
		const response = await fetch(`${URL}/competitions?plan=TIER_ONE`, {
			headers: getHeaders(apiKey)
		});

		const data = await handleApiResponse(response);

		return data.competitions.map(mapCompetition);

	} catch (error) {
		return {
			error: true,
			status: error.status || 500,
			message: error.message || 'Network Error'
		};
	}
}

/**
 * Fetches teams and their players for a competition season.
 *
 * @param {string} code Competition code (e.g., "PL").
 * @param {string|number} season Season year.
 * @param {string} apiKey Football-Data API key.
 * @returns {Promise<{competition: object, teams: Array<object>} | {error: true, status: number, message: string}>}
 * Payload with competition + teams, or an error object.
 */
async function fetchTeamsAndPlayers(code, season, apiKey) {
	try {
		const response = await fetch(`${URL}/competitions/${code}/teams?season=${season}`, {
			headers: getHeaders(apiKey)
		});

		const data = await handleApiResponse(response);

		return {
			competition: mapCompetition(data.competition),
			teams: data.teams.map(mapTeam)
		};

	} catch (error) {
		return {
			error: true,
			status: error.status || 500,
			message: error.message || 'Network Error'
		};
	}
}

/**
 * Builds request headers for the external API.
 *
 * @param {string} apiKey Football-Data API key.
 * @returns {{"X-Auth-Token": string}} Headers.
 */
function getHeaders(apiKey) {
	return {
		"X-Auth-Token": apiKey
	};
}

/**
 * Handles non-2xx API responses and throws a normalized error.
 *
 * @param {Response} response Fetch response.
 * @returns {Promise<any>} Parsed JSON body when successful.
 * @throws {{status: number, message: string}} Normalized error object.
 */
async function handleApiResponse(response) {
	if (response.ok) {
		return await response.json();
	}

	if (response.status === 429) {
		const retryAfter = response.headers.get("Retry-After");
		const msg = retryAfter
			? `Too many requests. Please wait ${retryAfter} seconds.`
			: "Request limit exceeded. Try again later.";
		throw { status: 429, message: msg };
	}

	if (response.status === 404) {
		throw { status: 404, message: "Resource not found in external API" };
	}

	if (response.status === 401) {
		throw { status: 401, message: "Invalid or missing API Key" };
	}

	throw { status: response.status, message: response.statusText };
}

/**
 * Maps a raw API competition into the app DTO.
 *
 * @param {any} c Raw competition.
 * @returns {{code: string, name: string, area: string, year: number | null}} Mapped competition.
 */
function mapCompetition(c) {
	return {
		code: c.code,
		name: c.name,
		area: c.area ? c.area.name : "Unknown",
		year: c.currentSeason ? new Date(c.currentSeason.startDate).getFullYear() : null
	};
}

/**
 * Maps a raw API team into the app DTO.
 *
 * @param {any} t Raw team.
 * @returns {{teamId: number, name: string, code: string | null, country: string, players: Array<object>}} Mapped team.
 */
function mapTeam(t) {
	return {
		teamId: t.id,
		name: t.name,
		code: t.tla || null,
		country: t.area ? t.area.name : "Unknown",
		players: t.squad ? t.squad.map(mapPlayer) : []
	};
}

/**
 * Maps a raw API player into the app DTO.
 *
 * @param {any} p Raw player.
 * @returns {{playerId: number, playerName: string, position: string, nationality: string, dateOfBirth: string}} Mapped player.
 */
function mapPlayer(p) {
	return {
		playerId: p.id,
		playerName: p.name,
		position: p.position,
		nationality: p.nationality,
		dateOfBirth: p.dateOfBirth
	};
}
