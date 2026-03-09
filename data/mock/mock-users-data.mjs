import crypto from 'node:crypto';

// Mock users data (async) used mainly for tests and local development.

const USERS = [
  {
    id: 1,
    token: '23922509-7be5-4f4c-b42a-fe0ec2f8dba3',
    name: 'user1'
  },
  {
    id: 2,
    token: '219b19f5-3f73-4ff9-abbe-878d1b7de9bd',
    name: 'user2'
  },
];
let currentId = USERS.length + 1;

/**
 * Creates a mock users data access module.
 *
 * @returns {{
 *   addUser: (username: string) => Promise<{id: number, token: string, name: string}>,
 *   getUserId: (token: string) => Promise<number | undefined>,
 *   getUserIdByName: (username: string) => Promise<number | undefined>
 * }} Data access API.
 */
export default function init() {
  return {
    addUser,
    getUserId,
    getUserIdByName,
  };

  /**
   * Generates the next in-memory id.
   *
   * @returns {number} Next id.
   */
  function nextId() {
    return currentId++;
  }

  /**
   * Creates a new user.
   *
   * @param {string} username Username.
   * @returns {Promise<{id: number, token: string, name: string}>} Created user.
   */
  function addUser(username) {
    return new Promise((resolve) => {
      const user = {
        id: nextId(),
        token: crypto.randomUUID(),
        name: username,
      };
      USERS.push(user);
      resolve(user);
    });
  }

  /**
   * Finds a user id by token.
   *
   * @param {string} token User token.
   * @returns {Promise<number | undefined>} User id or `undefined`.
   */
  function getUserId(token) {
    return new Promise((resolve) => {
      const user = USERS.find((candidate) => candidate.token == token);
      resolve(user?.id);
    });
  }

  /**
   * Finds a user id by username.
   *
   * @param {string} username Username.
   * @returns {Promise<number | undefined>} User id or `undefined`.
   */
  function getUserIdByName(username) {
    return new Promise((resolve) => {
      const user = USERS.find((candidate) => candidate.name == username);
      resolve(user?.id);
    });
  }
}
