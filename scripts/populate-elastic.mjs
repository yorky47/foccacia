import crypto from 'node:crypto';

const ELASTIC_URL = process.env.ELASTIC_URL ?? 'http://localhost:9200';

const USERS_INDEX = 'users';
const GROUPS_INDEX = 'groups';

/**
 * Seeds the ElasticSearch indices used by the application with minimal demo data.
 *
 * This script is intended to be run locally after bringing ElasticSearch up (e.g., via Docker).
 * It creates indices (if missing) and inserts demo users/groups only when they don't already exist.
 *
 * @returns {Promise<void>} Resolves when the seed process finishes.
 */
async function main() {
  console.log(`[populate] Seeding ElasticSearch at ${ELASTIC_URL}...`);
  await waitForElastic();

  await ensureIndex(USERS_INDEX, usersMappings());
  await ensureIndex(GROUPS_INDEX, groupsMappings());

  const alice = await ensureUser({
    username: 'alice',
    password: '123456',
    token: '11111111-1111-1111-1111-111111111111'
  });

  await ensureUser({
    username: 'bob',
    password: '123456',
    token: '22222222-2222-2222-2222-222222222222'
  });

  await ensureGroup({
    name: 'Demo Best XI',
    description: 'Seed group created by populate script',
    competition: 'PL',
    year: 2023,
    players: [],
    userToken: alice.token
  });

  console.log('[populate] Done. Seeded users: alice/123456, bob/123456');
}

/**
 * Waits until ElasticSearch is reachable or a timeout is hit.
 *
 * @returns {Promise<void>} Resolves when ElasticSearch responds with a successful status.
 * @throws {Error} If ElasticSearch is not reachable within the timeout.
 */
async function waitForElastic() {
  const url = `${ELASTIC_URL}`;
  const startedAt = Date.now();
  const timeoutMs = 30_000;

  // Simple retry loop to make "< 5 min" setup robust.
  while (true) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        await res.json().catch(() => ({}));
        return;
      }
    } catch {
      // ignore
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`[populate] ElasticSearch not reachable at ${ELASTIC_URL} after ${timeoutMs}ms`);
    }

    await sleep(750);
  }
}

/**
 * Builds the index mappings/settings for the users index.
 *
 * @returns {object} ElasticSearch index creation body.
 */
function usersMappings() {
  return {
    mappings: {
      dynamic: true,
      properties: {
        username: { type: 'text', fields: { keyword: { type: 'keyword', ignore_above: 256 } } },
        password: { type: 'text', fields: { keyword: { type: 'keyword', ignore_above: 256 } } },
        token: { type: 'text', fields: { keyword: { type: 'keyword', ignore_above: 256 } } }
      }
    }
  };
}

/**
 * Builds the index mappings/settings for the groups index.
 *
 * @returns {object} ElasticSearch index creation body.
 */
function groupsMappings() {
  return {
    mappings: {
      dynamic: true,
      properties: {
        name: { type: 'text', fields: { keyword: { type: 'keyword', ignore_above: 256 } } },
        description: { type: 'text' },
        competition: { type: 'text', fields: { keyword: { type: 'keyword', ignore_above: 256 } } },
        year: { type: 'integer' },
        userToken: { type: 'text', fields: { keyword: { type: 'keyword', ignore_above: 256 } } },
        players: {
          type: 'nested',
          properties: {
            id: { type: 'integer' },
            name: { type: 'text' },
            position: { type: 'keyword' },
            nationality: { type: 'keyword' },
            age: { type: 'integer' },
            teamId: { type: 'integer' },
            teamCode: { type: 'keyword' },
            teamName: { type: 'text' }
          }
        }
      }
    }
  };
}

/**
 * Ensures an index exists; creates it if missing.
 *
 * @param {string} indexName ElasticSearch index name.
 * @param {object} body Index creation body (mappings/settings).
 * @returns {Promise<void>} Resolves when the index exists.
 */
async function ensureIndex(indexName, body) {
  let headResponse;
  try {
    headResponse = await fetch(`${ELASTIC_URL}/${indexName}`, { method: 'HEAD' });
  } catch (err) {
    throw new Error(`[populate] Failed to check index '${indexName}' existence`, { cause: err });
  }

  if (headResponse.ok) return;

  let res;
  try {
    res = await fetch(`${ELASTIC_URL}/${indexName}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
    throw new Error(`[populate] Failed to create index '${indexName}' (request failed)`, { cause: err });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[populate] Failed to create index '${indexName}': ${res.status} ${text}`);
  }
}

/**
 * Ensures a demo user exists; creates it if missing.
 *
 * @param {{ username: string, password: string, token?: string }} params User seed data.
 * @returns {Promise<{ username: string, password: string, token: string, id?: string }>} The existing or created user.
 */
async function ensureUser({ username, password, token }) {
  const existing = await searchOne(USERS_INDEX, { term: { 'username.keyword': username } });
  if (existing) {
    return { id: existing._id, ...existing._source };
  }

  const doc = {
    username,
    password,
    token: token ?? crypto.randomUUID()
  };

  let res;
  try {
    res = await fetch(`${ELASTIC_URL}/${USERS_INDEX}/_doc?refresh=wait_for`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    });
  } catch (err) {
    throw new Error(`[populate] Failed to create user '${username}' (request failed)`, { cause: err });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[populate] Failed to create user '${username}': ${res.status} ${text}`);
  }

  return { ...doc };
}

/**
 * Ensures a demo group exists; creates it if missing.
 *
 * @param {{ name: string, description: string, competition: string, year: number, players: Array<object>, userToken: string }} groupDoc Group seed data.
 * @returns {Promise<object>} The existing or created group.
 */
async function ensureGroup(groupDoc) {
  // Only seed if the same (name,userToken) pair does not exist
  const existing = await searchOne(GROUPS_INDEX, {
    bool: {
      must: [
        { term: { 'userToken.keyword': groupDoc.userToken } },
        { term: { 'name.keyword': groupDoc.name } }
      ]
    }
  });

  if (existing) {
    return { id: existing._id, ...existing._source };
  }

  let res;
  try {
    res = await fetch(`${ELASTIC_URL}/${GROUPS_INDEX}/_doc?refresh=wait_for`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groupDoc)
    });
  } catch (err) {
    throw new Error(`[populate] Failed to create group '${groupDoc.name}' (request failed)`, { cause: err });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[populate] Failed to create group '${groupDoc.name}': ${res.status} ${text}`);
  }

  const body = await res.json();
  return { id: body._id, ...groupDoc };
}

/**
 * Searches for a single document matching a query.
 *
 * @param {string} indexName ElasticSearch index name.
 * @param {object} query ElasticSearch query DSL.
 * @returns {Promise<object|null>} The first hit object (raw hit) or null when no hits / index missing.
 */
async function searchOne(indexName, query) {
  let res;
  try {
    res = await fetch(`${ELASTIC_URL}/${indexName}/_search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, size: 1 })
    });
  } catch (err) {
    throw new Error(`[populate] Search request failed on '${indexName}'`, { cause: err });
  }

  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[populate] Search failed on '${indexName}': ${res.status} ${text}`);
  }

  const body = await res.json();
  return body?.hits?.hits?.[0] ?? null;
}

/**
 * Async sleep helper.
 *
 * @param {number} ms Time to wait in milliseconds.
 * @returns {Promise<void>} Resolves after the given delay.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
