import path from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv();

export const ragConfig = {
  pdfDirectory: process.env.PDF_DIR || path.join(process.cwd(), "data", "pdfs"),
  chunkSize: Number(process.env.RAG_CHUNK_SIZE || 900),
  chunkOverlap: Number(process.env.RAG_CHUNK_OVERLAP || 180),
  collectionName: process.env.CHROMA_COLLECTION || "tutor-pdf-knowledge",
  chromaUrl: process.env.CHROMA_URL || "http://127.0.0.1:8000",
  embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
  chatModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
};

export function assertOpenAiKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing. Add it to your .env file before running RAG commands.");
  }
}
