import db from "../db/db.js";

// Updates an existing row if a specified unique key already exists, or inserts a new row if it does not.
function upsertMemory(userId, key, value) {
  const stmt = db.prepare(`
        INSERT INTO user_memory(user_id,key,value)
        VALUES(?,?,?)

        ON CONFLICT(user_id,key)
        DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP;
    `);

  stmt.run(userId, key, value);
}

// Get recent conversation
function getUserMemory(userId) {
  const stmt = db.prepare(`
        SELECT key, value
        FROM user_memory
        WHERE user_id = ?
    `);

  // return Personal memory
  return stmt.all(userId);
}

function getMemoryValue(userId, key) {
  const stmt = db.prepare(`
    SELECT value
    FROM user_memory
    WHERE user_id = ? AND key = ?
    LIMIT 1
  `);

  const row = stmt.get(userId, key);

  return row ? row.value : null;
}

// Retrieves all stored user facts and returns them as a single JavaScript object.
async function getMemoryObject(userId) {
  const rows = getUserMemory(userId);

  const memory = {};

  for (const row of rows) {
    try {
      memory[row.key] = JSON.parse(row.value);
    } catch {
      memory[row.key] = row.value;
    }
  }

  return memory;
}

// Saves multiple extracted user facts (key-value pairs) into the user_memory table.
export async function saveFacts(userId, facts) {
  for (const [key, value] of Object.entries(facts)) {
    upsertMemory(userId, key, JSON.stringify(value));
  }
}

export function getMemoryByQuery(userId, memoryQuery) {
  // Retrieve all personal facts.
  if (memoryQuery === "ALL") {
    return getMemoryObject(userId);
  }

  // Retrieve one specific personal fact.
  if (typeof memoryQuery === "string") {
    const value = getMemoryValue(userId, memoryQuery);

    return value !== null ? { [memoryQuery]: value } : {};
  }

  // Retrieve multiple specific personal facts.
  if (Array.isArray(memoryQuery)) {
    const memory = {};

    for (const key of memoryQuery) {
      const value = getMemoryValue(userId, key);

      if (value !== null) {
        memory[key] = value;
      }
    }

    return memory;
  }

  return {};
}
