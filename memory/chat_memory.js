import db from "../db/db.js";

// Saves a user or assistant message to the chat history.
export function saveMessage(userId, role, message) {
  const stmt = db.prepare(`
        INSERT INTO chat_history(user_id, role, message)
        VALUES (?, ?, ?)
    `);

  stmt.run(userId, role, message);
}

// Retrieves the most recent chat messages for a specific user.
export function getChatHistory(userId, limit = 10) {
  const stmt = db.prepare(`
        SELECT role, message
        FROM chat_history
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ?
    `);

  const rows = stmt.all(userId, limit);

  // Reverse so oldest comes first
  return rows.reverse();
}

// Deletes older chat messages while keeping only the most recent ones.
export function deleteOldMsgs(userId, limit = 20) {
  const stmt = db.prepare(`
        DELETE FROM chat_history
        WHERE user_id = ?
        AND id NOT IN (
            SELECT id
            FROM chat_history
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT ?
        )`);

  stmt.run(userId, userId, limit);
}
