
import assert from 'node:assert';
import competitionsServicesInit from '../services/competitions-services.mjs';
import mockFapiInit from '../data/mock/mock-fapi-teams-data.mjs';
import { errors } from '../commons/errors/internal-errors.mjs';

describe("Competitions Services Tests", () => {
    let competitionsServices;

    beforeEach(() => {
        const mockFapi = mockFapiInit();
        competitionsServices = competitionsServicesInit(mockFapi);
    });

    const VALID_KEY = "valid-key";
    const INVALID_KEY = "invalid-key";

    describe("getCompetitions (getAll)", () => {
        it("Success: Should return list of competitions", async () => {
            const result = await competitionsServices.getAll(VALID_KEY);
            assert.ok(Array.isArray(result));
            assert.strictEqual(result.length, 2);
            assert.strictEqual(result[0].code, "PL");
        });

        it("Error: Should return NOT_AUTHORIZED for invalid API key", async () => {
            const result = await competitionsServices.getAll(INVALID_KEY);
            // Service returns custom description for API auth errors
            assert.strictEqual(result.internalError, 7); // NOT_AUTHORIZED code
            assert.strictEqual(result.description, 'Football API key unauthorized');
        });

        it("Error: Should return MISSING_PARAMETER if no key provided", async () => {
            const result = await competitionsServices.getAll(undefined);
            assert.deepStrictEqual(result, errors.MISSING_PARAMETER('X-Auth-Token'));
        });
    });

    describe("getTeamsAndPlayers (getTeamsByCompetition)", () => {
        it("Success: Should return teams for valid competition/season", async () => {
            const result = await competitionsServices.getTeamsByCompetition("PL", 2024, VALID_KEY);
            assert.ok(result.competition);
            assert.strictEqual(result.competition.code, "PL");
            assert.ok(result.teams.length > 0);
        });

        it("Error: Should return NOT_FOUND for invalid competition", async () => {
            const result = await competitionsServices.getTeamsByCompetition("XYZ", 2024, VALID_KEY);
            assert.deepStrictEqual(result, errors.NOT_FOUND('XYZ'));
        });

        it("Error: Should handle Rate Limit (429)", async () => {
            // Mock is configured to return 429 for code "429"
            const result = await competitionsServices.getTeamsByCompetition("429", 2024, VALID_KEY);
            // Service maps 429 to INVALID_QUERY with specific description, or we check internalError code
            // Let's check the structure returned by mapFootballApiError
            assert.strictEqual(result.internalError, 2); // INVALID_QUERY code
            assert.ok(result.description.includes("Rate limit"));
        });
    });
});
