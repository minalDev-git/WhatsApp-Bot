import extractionPrompt from "../prompts/extraction_prompt.js";
import "dotenv/config";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import { JsonOutputParser } from "@langchain/core/output_parsers";

/**
 * Extracts personal facts from a user's message.
 * @param {string} message - The user's latest message.
 * @returns {Promise<Object>} Extracted personal facts as a JavaScript object.
 */

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: process.env.MODEL,
  temperature: 0.7,
  responseFormat: { type: "json_object" },
});

export async function extractFacts(message) {
  try {
    const prompt = ChatPromptTemplate.fromTemplate(extractionPrompt, {
      templateFormat: "mustache",
    });
    // Parse the JSON returned by the model
    const chain = prompt.pipe(model).pipe(new JsonOutputParser()); // JsonOutputParser returns a parsed JS object

    const facts = await chain.invoke({ input: message });
    console.log("Extracted Facts: ", facts);
    return facts;
  } catch (error) {
    console.error("Error extracting personal facts:", error);

    // Return an empty object if parsing fails or no facts are found
    return {};
  }
}
