import { HuggingFaceEmbeddings } from "@langchain/community/embeddings/huggingface";
import { FAISS } from "@langchain/community/vectorstores/faiss";

// 3. Define your target project directory
const output_dir = "./vectorstore";

const embeddings = new HuggingFaceEmbeddings({
  model: "sentence-transformers/all-MiniLM-L6-v2",
});

export async function initializeVectorstore(chunks) {
  // Create the vectorstore from documents
  const vectorStore = await FAISS.fromDocuments(chunks, embeddings);
  await vectorStore.save(output_dir);
  console.log("Vectorstore initialized with", chunks.length, "chunks");
  return vectorStore;
}

export async function getVectorStore() {
  const vectorStore = await FAISS.load(output_dir, embeddings);
  if (!vectorStore) {
    console.log("Vectorstore not initialized");
    return null;
  }
  return vectorStore;
}
