/**
 * WhatsApp Bot — Baileys + LangChain + Groq
 * ============================================
 * Same LangChain pieces from Session 6 (ChatGroq, ChatPromptTemplate, the
 * pipe chain, StrOutputParser) — now answering real WhatsApp messages
 * instead of printing to a terminal.
 *
 * Baileys links this script to WhatsApp as a second device (same as
 * WhatsApp Web). First run: scan the QR code with your phone. After that,
 * the login is saved in auth_info_baileys/ so you don't scan again.
 */

import pino from "pino"; // logging library used by Baileys
import QRCode from "qrcode"; // generates a terminal QR code for WhatsApp pairing

import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
  DisconnectReason,
} from "baileys";
// ---------- Baileys connection ----------
export async function startBot() {
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
