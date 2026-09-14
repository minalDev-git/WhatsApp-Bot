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

  const docs = await splitter.createDocuments([text]);
  console.log("Loaded document with", docs.length, "chunks");
  return docs;
}

export async function saveInVectorDB(docs) {
  const vectorStore = await initializeVectorstore(docs);
  console.log("Saved", docs.length, "chunks to vector store");
  return vectorStore;
}
