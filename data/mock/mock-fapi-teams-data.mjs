// data/mock/mock-fapi-teams-data.mjs

/**
 * Creates a mock data module that simulates the external Football API.
 *
 * @returns {{
 *   fetchCompetitions: (apiKey: string) => Promise<Array<{code: string, name: string, area: string}>>,
 *   fetchTeamsAndPlayers: (code: string, season: string|number, apiKey: string) => Promise<{competition: object, teams: Array<object>}>
 * }} Mock API.
 */
export default function init() {
    return {
        fetchCompetitions,
        fetchTeamsAndPlayers
    };

    /**
     * Returns a fixed list of competitions.
     *
     * @param {string} apiKey Unused (kept for interface compatibility).
     * @returns {Promise<Array<{code: string, name: string, area: string}>>} Competitions list.
     */
    function fetchCompetitions(apiKey) {
        return new Promise((resolve) => {
            // Simulate unauthorized API key.
            if (apiKey === 'invalid-key') {
                resolve({ error: true, status: 401 });
                return;
            }

            // Keep the list stable for tests.
            resolve([
                { code: 'PL', name: 'Premier League', area: 'England' },
                { code: 'LL', name: 'La Liga', area: 'Spain' },
            ]);
        });
    }

    /**
     * Returns deterministic teams/players data for any competition/season.
     *
     * @param {string} code Competition code.
     * @param {string|number} season Season year.
     * @param {string} apiKey Unused (kept for interface compatibility).
     * @returns {Promise<{competition: object, teams: Array<object>}>} Mocked payload.
     */
    function fetchTeamsAndPlayers(code, season, apiKey) {
        return new Promise((resolve) => {
            // Simulate unauthorized API key.
            if (apiKey === 'invalid-key') {
                resolve({ error: true, status: 401 });
                return;
            }

            // Simulate rate limit when tests use code "429".
            if (code === '429') {
                resolve({ error: true, status: 429 });
                return;
            }

            // Simulate not found for unknown competition codes.
            if (code === 'XYZ') {
                resolve({ error: true, status: 404 });
                return;
            }

            const seasonYear = Number(season);
            const playersPL = [
                // Used by addPlayer tests (must exist in PL 2024/2025).
                {
                    playerId: 4832,
                    playerName: 'David Raya',
                    position: 'Goalkeeper',
                    nationality: 'ES',
                    dateOfBirth: '1995-09-15',
                },
                {
                    playerId: 500,
                    playerName: 'Valid Player',
                    position: 'Midfielder',
                    nationality: 'PT',
                    dateOfBirth: '2000-01-01',
                },
                {
                    playerId: 999,
                    playerName: 'Existing Player',
                    position: 'Forward',
                    nationality: 'BR',
                    dateOfBirth: '1999-06-20',
                },
                // Keep a few generic players for realism.
                { playerId: 101, playerName: 'João Teste', position: 'Forward', nationality: 'PT' },
                { playerId: 102, playerName: 'Maria Mock', position: 'Defender', nationality: 'BR' },
                { playerId: 201, playerName: 'Node Silva', position: 'Goalkeeper', nationality: 'US' },
            ];

            resolve({
                competition: { code, name: `Competition ${code}`, year: seasonYear },
                teams: [
                    {
                        teamId: 10,
                        code: 'MUN',
                        name: 'Mock United (Teste)',
                        players: code === 'PL' ? playersPL : playersPL.slice(3),
                    },
                    {
                        teamId: 20,
                        code: 'FFC',
                        name: 'Foccacia FC (Teste)',
                        players: code === 'PL' ? playersPL.slice(0, 3) : playersPL.slice(5),
                    },
                ],
            });
        });
    }
}