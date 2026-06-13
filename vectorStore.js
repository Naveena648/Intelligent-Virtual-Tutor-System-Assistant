import dotenv from "dotenv";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";

dotenv.config();

const DEFAULT_CHUNK_SIZE = Number(process.env.RAG_CHUNK_SIZE || 600);
const DEFAULT_CHUNK_OVERLAP = Number(process.env.RAG_CHUNK_OVERLAP || 100);
const CHROMA_URL = process.env.CHROMA_URL || "http://127.0.0.1:8000";
const CHROMA_COLLECTION = process.env.CHROMA_COLLECTION || "ai-tutor-pdf-knowledge";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

function normalize(text) {
  return String(text || "").toLowerCase();
}

function inferSubject(fileName, content) {
  const text = `${normalize(fileName)} ${normalize(content)}`;

  if (text.includes("dbms") || text.includes("database") || text.includes("normalization")) return "DBMS";
  if (text.includes("artificial intelligence") || text.includes("machine learning") || text.includes("neural")) return "AI";
  if (text.includes("operating system") || text.includes("process scheduling")) return "OS";
  if (text.includes("social") || text.includes("civics") || text.includes("history")) return "SOCIAL_SCIENCE";
  return "GENERAL";
}

function inferType(content) {
  const text = normalize(content);
  if (/\b(price|pricing|fee|fees|inr|rs\.?|usd|\$)\b/i.test(text)) return "pricing";
  if (text.includes("tutor") || text.includes("teacher")) return "tutor";
  if (text.includes("note") || text.includes("chapter") || text.includes("summary")) return "notes";
  return "notes";
}

function parseRating(content) {
  const match = String(content).match(/(\d(?:\.\d)?)\s*\/\s*5/i);
  return match ? Number(match[1]) : null;
}

function parsePrice(content) {
  const match = String(content).match(/(?:rs\.?|inr|\$)\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
  return match ? Number(match[1]) : null;
}

function clampTopK(topK) {
  const k = Number(topK || 4);
  if (Number.isNaN(k)) return 4;
  return Math.max(3, Math.min(5, k));
}

function ensureApiKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing. Add it to your .env file.");
  }
}

function createEmbeddings() {
  ensureApiKey();
  return new OpenAIEmbeddings({ model: EMBEDDING_MODEL });
}

function createChromaStore(embeddings) {
  return new Chroma(embeddings, {
    collectionName: CHROMA_COLLECTION,
    url: CHROMA_URL,
  });
}

export async function splitDocuments(
  docs,
  options = { chunkSize: DEFAULT_CHUNK_SIZE, chunkOverlap: DEFAULT_CHUNK_OVERLAP },
) {
  const chunkSize = Math.max(500, Math.min(700, Number(options.chunkSize || DEFAULT_CHUNK_SIZE)));
  const chunkOverlap = Number(options.chunkOverlap || DEFAULT_CHUNK_OVERLAP);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  const rawChunks = await splitter.createDocuments(
    docs.map((d) => d.pageContent),
    docs.map((d) => d.metadata),
  );

  const chunks = rawChunks.map((chunk) => {
    const fileName = chunk.metadata?.fileName || chunk.metadata?.source || "unknown";
    const subject = inferSubject(fileName, chunk.pageContent);
    const type = inferType(chunk.pageContent);
    const rating = parseRating(chunk.pageContent);
    const price = parsePrice(chunk.pageContent);

    return {
      ...chunk,
      metadata: {
        ...chunk.metadata,
        subject,
        type,
        rating,
        price,
      },
    };
  });

  return chunks;
}

/**
 * Create embeddings and upsert chunks into Chroma.
 */
export async function ingestIntoVectorStore(chunks) {
  try {
    const embeddings = createEmbeddings();
    const vectorStore = createChromaStore(embeddings);
    await vectorStore.addDocuments(chunks);

    return {
      collectionName: CHROMA_COLLECTION,
      chunkCount: chunks.length,
    };
  } catch (error) {
    throw new Error(`Failed to store embeddings in Chroma: ${error.message}`);
  }
}

/**
 * Build retriever from existing Chroma collection.
 */
export async function createRetriever(topK = 4) {
  try {
    const embeddings = createEmbeddings();
    const vectorStore = createChromaStore(embeddings);
    return vectorStore.asRetriever(clampTopK(topK));
  } catch (error) {
    throw new Error(`Failed to create retriever: ${error.message}`);
  }
}

/**
 * Retrieve top relevant chunks with similarity search.
 */
export async function similaritySearch(question, topK = 4) {
  try {
    const embeddings = createEmbeddings();
    const vectorStore = createChromaStore(embeddings);
    const k = clampTopK(topK);
    const docs = await vectorStore.similaritySearch(question, k);
    return docs;
  } catch (error) {
    throw new Error(`Failed to run similarity search: ${error.message}`);
  }
}
