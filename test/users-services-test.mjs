
import assert from 'node:assert';
import usersServicesInit from '../services/users-services.mjs';
import mockUsersDataInit from '../data/mock/mock-users-data.mjs';
import { errors } from '../commons/errors/internal-errors.mjs';

describe("Users Services Tests", () => {
    let usersServices;

    beforeEach(() => {
        const mockData = mockUsersDataInit();
        usersServices = usersServicesInit(mockData);
    });

    it("Success: Should create a new user", async () => {
        const username = "newUser";
        const result = await usersServices.addUser(username, '123456');
        
        assert.strictEqual(result.name, username);
        assert.ok(result.token);
    });

    it("Error: Should reject creation if username is missing", async () => {
        const result = await usersServices.addUser("", '123456');
        assert.deepStrictEqual(result, errors.INVALID_BODY('username required'));
    });

    it("Error: Should reject creation if user already exists", async () => {
        const username = "user1"; // Pre-defined in mock-users-data
        const result = await usersServices.addUser(username, '123456');
        assert.deepStrictEqual(result, errors.USER_ALREADY_EXISTS(username));
    });
});
