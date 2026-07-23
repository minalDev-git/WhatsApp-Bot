import db from "../db/db.js";

// Updates an existing row if a specified unique key already exists, or inserts a new row if it does not.
export function upsertMemory(userId, key, value) {
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
export function getUserMemory(userId) {
  const stmt = db.prepare(`
        SELECT key, value
        FROM user_memory
        WHERE user_id = ?
    `);

  // return Personal memory
  return stmt.all(userId);
}

// Saves multiple extracted user facts (key-value pairs) into the user_memory table.
export function saveFacts(userId, facts) {
  for (const [key, value] of Object.entries(facts)) {
    upsertMemory(userId, key, JSON.stringify(value));
  }
}

// Retrieves all stored user facts and returns them as a single JavaScript object.
export function getMemoryObject(userId) {
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
