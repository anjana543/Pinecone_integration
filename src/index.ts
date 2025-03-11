// Import necessary modules.
// Do not modify the imports.
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings, AzureOpenAIEmbeddings } from "@langchain/openai";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { Document } from "@langchain/core/documents";
import "dotenv/config";

// Define constants.
const EMBEDDING_MODEL = "text-embedding-ada-002"; // or text-embedding-ada-002 if you are using the DIAL key.
const DEFAULT_FILE_PATH = "src/client.txt";

// Initialize Pinecone client and index.
// Ensure that the API key and index name are set as environment variables.
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY as string, // Access Pinecone API key from .env.
});

const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME as string); // Replace with your index name.

// TODO: Function to load documents from a file.
// Hint: Use the `TextLoader` class to read text from the file and return an array of `Document` objects.
export const loadDocuments = async (filePath: string): Promise<Document[]> => {
  const loader = new TextLoader(filePath);
  return await loader.load();
};

// TODO: Function to create an OpenAI embedding model.
// Hint: Use the `OpenAIEmbeddings` class and pass the required model and API key.
export const createEmbeddings = ():
  | OpenAIEmbeddings
  | AzureOpenAIEmbeddings => {
  return new AzureOpenAIEmbeddings({
    model: EMBEDDING_MODEL,
    azureOpenAIApiKey: process.env.DIAL_API_KEY,
    azureOpenAIBasePath: "https://ai-proxy.lab.epam.com",
    azureOpenAIApiDeploymentName: "openai/deployments/text-embedding-ada-002",
    azureOpenAIApiVersion: "2023-12-01-preview",
  });
};

// TODO: Function to store documents in Pinecone.
// Hint: Use `PineconeStore.fromDocuments` to store documents in Pinecone.
export const storeDocumentsInPinecone = async (
  filePath = DEFAULT_FILE_PATH
): Promise<{ success: boolean; error?: unknown }> => {
  try {
    const docs = await loadDocuments(filePath);
    const embeddings = createEmbeddings();
    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex,
      maxConcurrency: 5, // Maximum number of batch requests to allow at once. Each batch is 1000 vectors.
    });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

// If this script is the main module, run the process.
if (require.main === module) {
  storeDocumentsInPinecone().then((result) => {
    if (!result.success) {
      console.error("Error storing embeddings.", result.error);
    } else {
      console.log("Embeddings stored successfully!");
    }
  });
}