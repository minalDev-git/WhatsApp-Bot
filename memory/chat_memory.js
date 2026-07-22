import { prepare } from "./db";

// Saves a user or assistant message to the chat history.
function saveMessage(userId, role, message) {
  const stmt = prepare(`
        INSERT INTO chat_history(user_id, role, message)
        VALUES (?, ?, ?)
    `);

  stmt.run(userId, role, message);
}

// Retrieves the most recent chat messages for a specific user.
function getChatHistory(userId, limit = 10) {
  const stmt = prepare(`
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
function deleteOldMsgs(userId, limit = 20) {
  const stmt = prepare(`
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

export default {
  saveMessage,
  getChatHistory,
  deleteOldMsgs,
};
