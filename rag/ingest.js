import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { readFileSync } from "fs";
import { initializeVectorstore } from "./vectorstore.js";

const CHUNK_SIZE = 500;
const OVERLAP = 100;

export async function load_doc(docPath) {
  const text = readFileSync(docPath, "utf8");
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: OVERLAP,
    separators: ["\n\n", "\n", ".", ""],
  });

  const chunks = await splitter.splitText(text);
  console.log("Loaded document with", chunks.length, "chunks");
  return chunks;
}

export async function saveInVectorDB(chunks) {
  const vectorStore = await initializeVectorstore(chunks);
  console.log("Saved", chunks.length, "chunks to vector store");
  return vectorStore;
}
