import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

// 3. Define your target project directory
const output_dir = "./vectorstore";

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: process.env.HUGGINGFACEHUB_API_TOKEN,
  model: "sentence-transformers/all-MiniLM-L6-v2",
});

export async function initializeVectorstore(chunks) {
  // Create the vectorstore from documents
  const vectorStore = await FaissStore.fromDocuments(chunks, embeddings);
  await vectorStore.save(output_dir);
  console.log("Vectorstore initialized with", chunks.length, "chunks");
  return vectorStore;
}

export async function getVectorStore() {
  try {
    const vectorStore = await FaissStore.load(output_dir, embeddings);
    return vectorStore;
  } catch (error) {
    console.log("Vectorstore not initialized");
    return null;
  }
}
