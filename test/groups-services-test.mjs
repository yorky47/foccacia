
import assert from 'node:assert';
import groupsServicesInit from '../services/groups-services.mjs';
import mockGroupsDataInit from '../data/mock/mock-groups-data.mjs';
import mockFapiInit from '../data/mock/mock-fapi-teams-data.mjs';
import { errors } from '../commons/errors/internal-errors.mjs';

// Mock Users Service (Simple inline mock)
const mockUsersService = {
    validateToken: (token) => Promise.resolve(token === "valid-token")
};

describe("Groups Services - CRUD Tests", () => {
    let groupsServices;

    beforeEach(() => {
        // Re-initialize services and mocks before each test to reset state if needed
        const mockData = mockGroupsDataInit();
        const mockFapi = mockFapiInit();
        // Inject dependencies: Data Layer, Users Service, Competitions Service (Mocked FAPI)
        groupsServices = groupsServicesInit(mockData, mockUsersService, mockFapi);
    });

    const VALID_TOKEN = "valid-token";

    describe("CRUD Operations", () => {
        it("getAll: Should return all groups for user", async () => {
            const groups = await groupsServices.getAll(VALID_TOKEN);
            assert.strictEqual(groups.length, 3); // 3 initial groups in mock
        });

        it("create: Should create a valid group", async () => {
            const newGroup = {
                name: "New Group",
                competition: "PL",
                year: 2024
            };
            const created = await groupsServices.create(newGroup, VALID_TOKEN);
            assert.ok(created.id);
            assert.strictEqual(created.name, newGroup.name);
        });

        it("create: Should fail with invalid body", async () => {
            const invalidGroup = { name: "No Competition" };
            const result = await groupsServices.create(invalidGroup, VALID_TOKEN);
            assert.deepStrictEqual(result, errors.INVALID_BODY('competition required'));
        });

        it("getById: Should return group details", async () => {
            const group = await groupsServices.getById(1, VALID_TOKEN);
            assert.strictEqual(group.id, 1);
        });

        it("getById: Should return NOT_FOUND for non-existent group", async () => {
            const result = await groupsServices.getById(999, VALID_TOKEN);
            assert.deepStrictEqual(result, errors.NOT_FOUND('Group'));
        });

        it("update: Should update group details", async () => {
            // Use a group that won't be deleted later (use group 4 which we'll create)
            const newGroup = {
                name: "Group to Update",
                competition: "PL",
                year: 2024
            };
            const created = await groupsServices.create(newGroup, VALID_TOKEN);
            const groupId = created.id;

            const updateData = { name: "Updated Name" };
            const result = await groupsServices.update(groupId, updateData, VALID_TOKEN);
            assert.ok(result.ok);
            
            const updatedGroup = await groupsServices.getById(groupId, VALID_TOKEN);
            assert.strictEqual(updatedGroup.name, "Updated Name");
        });

        it("remove: Should delete a group", async () => {
            // Use a group that won't be used later (use group 4 created earlier)
            const newGroup = {
                name: "Group to Delete",
                competition: "PL",
                year: 2024
            };
            const created = await groupsServices.create(newGroup, VALID_TOKEN);
            const groupId = created.id;

            const result = await groupsServices.remove(groupId, VALID_TOKEN);
            assert.ok(result.ok);

            const check = await groupsServices.getById(groupId, VALID_TOKEN);
            assert.deepStrictEqual(check, errors.NOT_FOUND('Group'));
        });
    });
});
