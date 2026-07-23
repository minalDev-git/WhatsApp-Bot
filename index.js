import pino from "pino"; // logging library used by Baileys
import QRCode from "qrcode"; // generates a terminal QR code for WhatsApp pairing
import "dotenv/config";

import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
  DisconnectReason,
} from "baileys";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

import { getChatHistory, saveMessage } from "./memory/chat_memory.js";
import { getMemoryObject, saveFacts } from "./memory/user_memory.js";
import { extractFacts } from "./memory/extractor.js";
import systemPrompt from "./prompts/system_prompt.js";
import { getRelevantDocs } from "./rag/rag_pipeline.js";

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", systemPrompt],

  new MessagesPlaceholder("history"),

  [
    "human",
    `
Personal Memory:
{memory}

Knowledge Base:
{context}

Question:
{message}
`,
  ],
]);

async function getReply(message, userId) {
  // 1. Save the user's message
  saveMessage(userId, "user", message);

  // 2. Extract and store personal facts
  const facts = await extractFacts(message);

  if (Object.keys(facts).length > 0) {
    await saveFacts(userId, facts);
  }

  // 3. Load recent chat history

  const history = getChatHistory(userId).map((msg) =>
    msg.role === "user"
      ? new HumanMessage(msg.message)
      : new AIMessage(msg.message),
  );

  // 4. Load personal memory
  const memory = getMemoryObject(userId);

  console.log("Query:", message);

  // 5. Retrieve relevant RAG context
  const context = await getRelevantDocs(message);

  // 6. Invoke the LLM
  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  const response = await chain.invoke({
    message,

    history,

    memory: JSON.stringify(memory, null, 2),

    context: context || "",
  });

  // 7. Save the assistant's reply
  saveMessage(userId, "assistant", response);

  return response;
}

// ---------- Baileys connection ----------
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  // NOTE: fetchLatestBaileysVersion() ships a stale protocol version in
  // 7.0.0-rc13 that blocks pairing. fetchLatestWaWebVersion() is the fix.
  const { version } = await fetchLatestWaWebVersion();

  const sock = makeWASocket({
    auth: state,
    version,
    logger: pino({ level: "silent" }), // Baileys' own protocol logs are very noisy — silence them
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(
        "Scan this QR code with WhatsApp (Settings > Linked Devices > Link a Device):",
      );
      console.log(await QRCode.toString(qr, { type: "terminal", small: true }));
    }

    if (connection === "open") {
      console.log("Connected! The bot is now live on WhatsApp.");
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      console.log(
        "Connection closed.",
        loggedOut
          ? "Logged out — delete auth_info_baileys/ and restart to scan a new QR."
          : "Reconnecting...",
      );
      if (!loggedOut) startBot();
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      const jid = msg.key.remoteJid;
      const isGroup = jid?.endsWith("@g.us");
      const isStatus = jid === "status@broadcast";
      if (msg.key.fromMe || isGroup || isStatus) continue; // skip our own messages, groups, and status updates

      // remoteJid is a @lid (WhatsApp's privacy ID) when linked; remoteJidAlt carries the real phone number
      const number = (msg.key.remoteJidAlt || jid)?.split("@")[0];
      console.log(`Message from: ${number}`);

      // if (process.env.ALLOWED_NUMBER && number !== process.env.ALLOWED_NUMBER) {
      //   console.log(`Ignored — ${number} not in ALLOWED_NUMBER.`);
      //   continue;
      // }

      const text =
        msg.message?.conversation || msg.message?.extendedTextMessage?.text;
      if (!text) continue; // skip images/stickers/etc — text only for this demo

      console.log(`[${jid}] ${text}`);
      const reply = await getReply(text, number); // number = session_id, one memory per chat
      await sock.sendMessage(jid, { text: reply });
    }
  });
}

await startBot();
