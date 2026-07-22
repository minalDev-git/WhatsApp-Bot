import "dotenv/config";
import { ChatGroq } from "@langchain/groq";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";

// ---------- The same LangChain chain style from Session 6 FILE 02 ----------
// Python used "prompt | llm | parser". JavaScript has no "|" operator
// overloading, so LangChain.js uses .pipe() instead — same Runnable idea.
const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: process.env.MODEL,
  temperature: 0.7,
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a friendly WhatsApp assistant. "],
  new MessagesPlaceholder("history"), // <- past messages for this chat get inserted here
  ["human", "{message}"],
]);

const chain = prompt.pipe(model).pipe(new StringOutputParser());

// ---------- Memory: one chat history per WhatsApp number (Session 6 FILE 04) ----------
const store = {}; // in real apps this would be a database, here a plain dict is enough

function getSessionHistory(sessionId) {
  if (!store[sessionId]) store[sessionId] = new InMemoryChatMessageHistory();
  return store[sessionId];
}

const chatbot = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: getSessionHistory,
  inputMessagesKey: "message",
  historyMessagesKey: "history",
});

// ---------- Turn an incoming WhatsApp message into a reply ----------
async function getReply(text, sessionId) {
  try {
    return await chatbot.invoke(
      { message: text },
      { configurable: { sessionId } },
    );
  } catch (err) {
    console.error("LangChain/Groq error:", err.message);
    return "Sorry, I couldn't think of a reply just now — try again in a moment.";
  }
}
