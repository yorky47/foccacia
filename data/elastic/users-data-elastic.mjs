import crypto from 'node:crypto';

/**
 * Creates an ElasticSearch-backed users data access module.
 *
 * @param {string} [elasticUrl='http://localhost:9200'] ElasticSearch base URL.
 * @param {typeof fetch} fetch Fetch implementation to use for HTTP requests.
 * @returns {{
 *   addUser: (username: string, password: string) => Promise<{id: string, username: string, password: string, token: string}>,
 *   getUserId: (token: string) => Promise<string | undefined>,
 *   getUserIdByName: (username: string) => Promise<string | undefined>,
 *   getUserByUsername: (username: string) => Promise<{id: string, username: string, password: string, token: string} | null>,
 *   getUserByToken: (token: string) => Promise<{id: string, username: string, password: string, token: string} | null>
 * }} Data access API.
 */
export default function init(elasticUrl = 'http://localhost:9200', fetch) {
    const INDEX_NAME = 'users';
    const ELASTIC_USERS_URL = `${elasticUrl}/${INDEX_NAME}`;

    return {
        addUser,
        getUserId,
        getUserIdByName,
        getUserByUsername,
        getUserByToken,
    };

    /**
     * Retrieves a user by its authentication token.
     *
     * @param {string} token User token.
     * @returns {Promise<{id: string, username: string, password: string, token: string} | null>} The user or `null`.
     */
    async function getUserByToken(token) {
        if (!token) return null;

        const query = {
            query: { term: { 'token.keyword': token } },
        };

        const response = await fetch(`${ELASTIC_USERS_URL}/_search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query),
        });

        const body = await response.json();
        if (body.hits && body.hits.total.value > 0) {
            const hit = body.hits.hits[0];
            return { id: hit._id, ...hit._source };
        }
        return null;
    }

    /**
     * Creates a new user and stores it in ElasticSearch.
     *
     * @param {string} username Username.
     * @param {string} password Password (stored as provided).
     * @returns {Promise<{id: string, username: string, password: string, token: string}>} The created user.
     */
    async function addUser(username, password) {
        const newUser = {
            username,
            password,
            token: crypto.randomUUID(),
        };

        const response = await fetch(`${ELASTIC_USERS_URL}/_doc?refresh=wait_for`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser),
        });

        if (!response.ok) throw new Error('Error creating user in ElasticSearch');

        const body = await response.json();
        return { id: body._id, ...newUser };
    }

    /**
     * Retrieves a user by username.
     *
     * @param {string} username Username.
     * @returns {Promise<{id: string, username: string, password: string, token: string} | null>} The user or `null`.
     */
    async function getUserByUsername(username) {
        const url = `${ELASTIC_USERS_URL}/_search?q=username.keyword:${username}`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                console.error(`[DATA] Elastic error (${response.status}): ${response.statusText}`);
                return null;
            }

            const body = await response.json();

            const totalHits = typeof body.hits.total === 'object' ? body.hits.total.value : body.hits.total;
            if (totalHits === 0) return null;

            return mapHitToUser(body.hits.hits[0]);
        } catch (error) {
            console.error('[DATA] Critical error connecting to ElasticSearch:', error.message);
            return null;
        }
    }

    /**
     * Maps an ElasticSearch hit to a user domain object.
     *
     * @param {{_id: string, _source: {username: string, password: string, token: string}}} hit ElasticSearch hit.
     * @returns {{id: string, username: string, password: string, token: string}} Mapped user.
     */
    function mapHitToUser(hit) {
        return {
            id: hit._id,
            username: hit._source.username,
            password: hit._source.password,
            token: hit._source.token,
        };
    }

    /**
     * Retrieves the ElasticSearch document id for a given token.
     *
     * @param {string} token User token.
     * @returns {Promise<string | undefined>} Document id or `undefined` when not found / on error.
     */
    async function getUserId(token) {
        const url = `${ELASTIC_USERS_URL}/_search?q=token:${token}`;

        try {
            const response = await fetch(url);
            const body = await response.json();
            return body.hits.hits[0]?._id;
        } catch (_error) {
            return undefined;
        }
    }

    /**
     * Retrieves the ElasticSearch document id for a given username.
     *
     * @param {string} username Username.
     * @returns {Promise<string | undefined>} Document id or `undefined` when not found / on error.
     */
    async function getUserIdByName(username) {
        const url = `${ELASTIC_USERS_URL}/_search?q=username.keyword:${username}`;

        try {
            const response = await fetch(url);
            const body = await response.json();
            return body.hits.hits[0]?._id;
        } catch (_error) {
            return undefined;
        }
    }
}