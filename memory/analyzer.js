import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import analysisPrompt from "../prompts/analysis_prompt.js";

const analyzerModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "groq/compound-mini",
  temperature: 0,
});

const prompt = ChatPromptTemplate.fromTemplate(analysisPrompt, {
  templateFormat: "mustache",
});

const analyzerChain = prompt.pipe(analyzerModel).pipe(new StringOutputParser());

export async function analyzeMessage(message) {
  try {
    const result = await analyzerChain.invoke({
      message,
    });

    console.log(result);

    const analysis = JSON.parse(result.trim());

    return {
      needs_rag: Boolean(analysis.needs_rag),
      needs_memory: Boolean(analysis.needs_memory),
      facts: analysis.facts || {},
      memory_query: analysis.memory_query ?? null,
    };
  } catch (error) {
    console.error("Message analysis error:", error);

    return {
      needs_rag: false,
      needs_memory: false,
      facts: {},
      memory_query: null,
    };
  }
}
