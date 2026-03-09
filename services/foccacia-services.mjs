const competitions = [
    { code: 'PL', name: 'Premier League', area: 'England' },
    { code: 'LL', name: 'La Liga', area: 'Spain' },
    { code: 'SA', name: 'Serie A', area: 'Italy' },
];

const teamsByCompetition = {
    PL: [{ name: 'Arsenal', players: ['Player A', 'Player B'] }],
    LL: [{ name: 'Real Madrid', players: ['Player C', 'Player D'] }],
    SA: [{ name: 'Juventus', players: ['Player E', 'Player F'] }],
};

/**
 * Returns the static list of competitions (mock/in-memory implementation).
 *
 * @returns {Promise<Array<{code: string, name: string, area: string}>>} List of competitions.
 */
export async function getAllCompetitions() {
    return competitions;
}

/**
 * Returns a competition and its teams/players (mock/in-memory implementation).
 *
 * @param {string} competitionCode Competition code (case-insensitive).
 * @returns {Promise<{competition: {code: string, name: string, area: string}, teams: Array<{name: string, players: string[]}>} | null>} Payload or null if not found.
 */
export async function getTeamsAndPlayers(competitionCode) {
    const competition = competitions.find(
        (c) => c.code.toLowerCase() === competitionCode.toLowerCase(),
    );
    if (!competition) return null;
    return { competition, teams: teamsByCompetition[competition.code] || [] };
}
