import "dotenv/config";
import { getVectorStore } from "./vectorstore.js";
import { load_doc, saveInVectorDB } from "./ingest.js";

const FILE_PATH = "data/knowledge_base.txt";
const RETRIEVER_K = 3;

let vectorstore = await getVectorStore();

export async function getRelevantDocs(query) {
  if (!vectorstore) {
    const chunks = await load_doc(FILE_PATH);
    vectorstore = await saveInVectorDB(chunks);
  }
  try {
    const retriever = vectorstore.asRetriever({
      search_kwargs: { k: RETRIEVER_K },
    });
    const relevantDocuments = await retriever.invoke(query);
    const retrievedContext = relevantDocuments
      .map((doc) => doc.pageContent)
      .join("\n");

    return retrievedContext;
  } catch (error) {
    console.error(error);
    return "";
  }
}
