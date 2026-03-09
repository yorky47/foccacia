import crypto from 'node:crypto';

// In-memory users store
// Seed a default dev user so the web site can run without login.
// Matches the hardcoded token used by `web/site/foccacia-web-site.mjs`.
const USERS = [
    {
        id: 1,
        token: '23922509-7be5-4f4c-b42a-fe0ec2f8dba3',
        name: 'user1'
    }
];
let currentId = USERS.length + 1;

function nextId() {
    return currentId++;
}

/**
 * Creates a new in-memory user.
 *
 * @param {string} username Username.
 * @returns {Promise<{id: number, token: string, name: string}>} The created user.
 */
export async function addUser(username) {
    const user = {
        id: nextId(),
        token: crypto.randomUUID(),
        name: username
    };
    USERS.push(user);
    return user;
}

/**
 * Finds a user id by its token.
 *
 * @param {string} token User token.
 * @returns {Promise<number | undefined>} User id or `undefined`.
 */
export async function getUserId(token) {
    const user = USERS.find(user => user.token == token);
    return user?.id; // user id or undefined
}

/**
 * Finds a user id by its username.
 *
 * @param {string} username Username.
 * @returns {Promise<number | undefined>} User id or `undefined`.
 */
export async function getUserIdByName(username) {
    const user = USERS.find(user => user.name == username);
    return user?.id; // user id or undefined
}