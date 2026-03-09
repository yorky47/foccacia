import { INTERNAL_ERROR_CODES, errors } from '../commons/errors/internal-errors.mjs';

/**
 * Initializes the Users Services module.
 *
 * This service contains user creation and basic authentication helpers.
 * It delegates persistence to the injected data layer.
 *
 * @param {object} usersData Users data module.
 * @returns {{
 *   addUser: (username: string, password: string) => Promise<any>,
 *   validateToken: (token: string) => Promise<object|null>,
 *   validateUser: (username: string, password: string) => Promise<object|null>,
 *   getOrCreateUser: (username: string, password: string) => Promise<object|null>,
 *   getUserByUsername: (username: string) => Promise<object|null>
 * }} Public API for user operations.
 */
export default function init(usersData) {
    if (!usersData) throw errors.INVALID_ARGUMENT('usersData');

    return {
        addUser,
        validateToken,
        validateUser,
        getOrCreateUser,
        getUserByUsername,
    };

    /**
     * Creates a new user.
     *
     * @param {string} username Username.
     * @param {string} password Plain-text password (project scope).
     * @returns {Promise<any>} Newly created user or an internal error object.
     */
    async function addUser(username, password) {
        try {
            if (typeof username !== 'string' || username.trim().length === 0) {
                return errors.INVALID_BODY('username required');
            }
            const cleanUsername = username.trim();
            if (cleanUsername.length < 3) {
                return errors.INVALID_BODY('username too short');
            }
            if (!password || typeof password !== 'string' || password.length < 6) {
                return errors.INVALID_BODY('password must be at least 6 characters');
            }

            const existingUserId = await usersData.getUserIdByName(cleanUsername);
            if (existingUserId) return errors.USER_ALREADY_EXISTS(cleanUsername);

            const user = await usersData.addUser(cleanUsername, password);
            return user;
        } catch {
            return { internalError: INTERNAL_ERROR_CODES.SERVER_ERROR, description: 'Failed to create user' };
        }
    }

    /**
     * Validates an authentication token.
     *
     * @param {string} token Authentication token.
     * @returns {Promise<object|null>} User without password if token is valid; otherwise null.
     */
    async function validateToken(token) {
        if (!token) return null;
        try {
            const user = await usersData.getUserByToken(token);
            if (user) {
                const { password: _password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            }
            return null;
        } catch (err) {
            console.error('Error validating token:', err);
            return null;
        }
    }

    /**
     * Validates a username/password pair.
     *
     * @param {string} username Username.
     * @param {string} password Plain-text password.
     * @returns {Promise<object|null>} User without password if credentials match; otherwise null.
     */
    async function validateUser(username, password) {
        try {
            const user = await usersData.getUserByUsername(username);

            if (user && user.password === password) {
                const { password: _password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            }

            return null;
        } catch (err) {
            console.error('Error validating user credentials:', err);
            return null;
        }
    }

    /**
     * Convenience helper used by the website login flow.
     *
     * If the user does not exist, it is created; if it exists, the password is validated.
     *
     * @param {string} username Username.
     * @param {string} password Plain-text password.
     * @returns {Promise<object|null>} User object (may include password depending on data layer) or null if invalid.
     */
    async function getOrCreateUser(username, password) {
        try {
            const user = await usersData.getUserByUsername(username);
            if (!user) {
                return await usersData.addUser(username, password);
            }
            if (user.password !== password) {
                return null;
            }
            return user;
        } catch (err) {
            console.error('Error in getOrCreateUser:', err);
            return null;
        }
    }

    /**
     * Retrieves a user by username.
     *
     * @param {string} username Username.
     * @returns {Promise<object|null>} User object or null if not found.
     */
    async function getUserByUsername(username) {
        try {
            return await usersData.getUserByUsername(username);
        } catch (err) {
            console.error('Error fetching user by username:', err);
            return null;
        }
    }
}
