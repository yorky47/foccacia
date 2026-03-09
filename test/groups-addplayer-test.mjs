
import assert from 'node:assert';
import groupsServicesInit from '../services/groups-services.mjs';
import competitionsServicesInit from '../services/competitions-services.mjs';
import mockGroupsDataInit from '../data/mock/mock-groups-data.mjs';
import mockFapiInit from '../data/mock/mock-fapi-teams-data.mjs';
import { errors } from '../commons/errors/internal-errors.mjs';

// Mock Users Service
const mockUsersService = {
    validateToken: (token) => Promise.resolve(token === "valid-token")
};

describe("Groups Services - addPlayer Tests", () => {
    let groupsServices;
    let competitionsServices;
    let mockData;
    let mockFapi;

    beforeEach(() => {
        mockData = mockGroupsDataInit();
        mockFapi = mockFapiInit();
        competitionsServices = competitionsServicesInit(mockFapi);
        groupsServices = groupsServicesInit(mockData, mockUsersService, competitionsServices);
    });

    const VALID_TOKEN = "valid-token";
    const API_KEY = "dummy-api-key";

    it("Success: Should add a valid player to a group with space (PL 2025 - David Raya)", async () => {
        const groupId = 1;
        const newPlayer = {
            playerId: 4832,
            playerName: "David Raya"
        };

        const result = await groupsServices.addPlayer(groupId, newPlayer, VALID_TOKEN, API_KEY);

        assert.ok(result);
        assert.strictEqual(result.id, groupId);
        assert.strictEqual(result.players.length, 1);
        assert.strictEqual(result.players[0].id, 4832);
        assert.strictEqual(result.players[0].name, "David Raya");
    });

    it("Error: Should reject adding a player when group is full (11 players)", async () => {
        const groupId = 2;
        const newPlayer = {
            playerId: 500,
            playerName: "Valid Player"
        };

        const result = await groupsServices.addPlayer(groupId, newPlayer, VALID_TOKEN, API_KEY);

        assert.deepStrictEqual(result, errors.GROUP_FULL());
    });

    it("Error: Should reject adding a duplicate player", async () => {
        const groupId = 3;
        const duplicatePlayer = {
            playerId: 999,
            playerName: "Existing Player"
        };

        const result = await groupsServices.addPlayer(groupId, duplicatePlayer, VALID_TOKEN, API_KEY);

        assert.deepStrictEqual(result, errors.PLAYER_ALREADY_EXISTS(999));
    });

    it("Error: Should reject player not belonging to the competition (External API Validation)", async () => {
        const groupId = 1;
        const invalidPlayer = {
            playerId: 99999,
            playerName: "Invalid Player"
        };

        const result = await groupsServices.addPlayer(groupId, invalidPlayer, VALID_TOKEN, API_KEY);

        const expectedError = errors.INVALID_BODY(`Player ${invalidPlayer.playerId} not found in PL 2025`);
        assert.deepStrictEqual(result, expectedError);
    });
    it('adds player with age and teamCode', async () => {
        const groupBefore = await groupsServices.getById(1, VALID_TOKEN);
        const res = await groupsServices.addPlayer(1, { playerId: 500 }, VALID_TOKEN, API_KEY);
        if (res.internalError) assert.fail('Unexpected error: ' + res.description);

        const added = res.players.find(p => String(p.id) === '500');
        assert.ok(added, 'Player should be present');
        assert.ok(added.age === null || added.age > 10, 'Age should be realistic or null');
        assert.ok('teamCode' in added, 'teamCode should exist');
    });
});
