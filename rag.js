import dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { loadPdfDocuments } from "./pdfLoader.js";
import { splitDocuments, ingestIntoVectorStore, similaritySearch } from "./vectorStore.js";

dotenv.config();

const CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
let localChunkCache = null;
const stopwords = new Set([
  "what",
  "is",
  "are",
  "the",
  "a",
  "an",
  "of",
  "to",
  "for",
  "in",
  "on",
  "and",
  "or",
  "explain",
  "define",
  "tell",
  "me",
]);

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return normalize(text)
    .split(" ")
    .filter((token) => token.length > 2);
}

function coreTokens(text) {
  return tokenize(text).filter((token) => !stopwords.has(token));
}

async function getLocalChunks() {
  if (localChunkCache) {
    return localChunkCache;
  }

  const docs = await loadPdfDocuments(process.env.PDF_DIR || "./data/pdfs");
  if (docs.length === 0) {
    localChunkCache = [];
    return localChunkCache;
  }

  localChunkCache = await splitDocuments(docs, { chunkSize: 700, chunkOverlap: 100 });
  return localChunkCache;
}

function scoreChunk(questionTokens, chunkText) {
  const normalizedChunk = normalize(chunkText);
  const chunkTokens = new Set(tokenize(chunkText));
  let score = 0;
  for (const token of questionTokens) {
    if (chunkTokens.has(token)) {
      score += 2;
    }

    if (normalizedChunk.includes(token)) {
      score += 1;
    }
  }

  return score;
}

async function retrieveLocal(question, topK) {
  const chunks = await getLocalChunks();
  const questionTokens = coreTokens(question);

  return chunks
    .map((chunk) => ({
      ...chunk,
      localScore: scoreChunk(questionTokens, chunk.pageContent),
    }))
    .filter((chunk) => chunk.localScore > 0)
    .sort((a, b) => b.localScore - a.localScore)
    .slice(0, topK);
}

function clampTopK(topK) {
  const k = Number(topK || 4);
  if (Number.isNaN(k)) return 4;
  return Math.max(3, Math.min(5, k));
}

function formatRetrievedContext(docs) {
  return docs
    .map((doc, idx) => {
      const source = doc.metadata?.fileName || doc.metadata?.source || "unknown-source";
      return `Chunk ${idx + 1} (${source})\nSubject: ${doc.metadata?.subject || "GENERAL"}\nType: ${doc.metadata?.type || "notes"}\nRating: ${doc.metadata?.rating ?? "N/A"}\nPrice: ${doc.metadata?.price ?? "N/A"}\n${doc.pageContent}`;
    })
    .join("\n\n");
}

function toText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((item) => (typeof item === "string" ? item : item?.text || "")).join("\n");
  }
  return String(content ?? "");
}

function generateFallbackAnswer(_question, docs) {
  if (docs.length === 0) {
    return "No data available";
  }

  const democracyChunk = docs.find((doc) => normalize(doc.pageContent).includes("democracy"));
  if (democracyChunk) {
    const source = democracyChunk.metadata?.fileName || democracyChunk.metadata?.source || "unknown-source";
    const preview = democracyChunk.pageContent.replace(/\s+/g, " ").slice(0, 260);
    return [
      "Found in dataset:",
      `1. ${source}: ${preview}`,
    ].join("\n");
  }

  const lines = docs.slice(0, 3).map((doc, idx) => {
    const source = doc.metadata?.fileName || doc.metadata?.source || "unknown-source";
    const preview = doc.pageContent.replace(/\s+/g, " ").slice(0, 220);
    return `${idx + 1}. ${source}: ${preview}`;
  });

  return ["Found in dataset:", ...lines].join("\n");
}

function buildStrictPrompt(retrievedChunks, userQuestion) {
  return [
    "You are an AI tutor assistant.",
    "",
    "Use ONLY the provided context to answer the question.",
    "",
    "Context:",
    retrievedChunks,
    "",
    "Question:",
    userQuestion,
    "",
    "Rules:",
    "1. Answer ONLY from the context",
    "2. Do NOT add extra knowledge",
    "3. If answer is not found, say: \"Not available in dataset\"",
    "4. Keep answer clear and structured",
    "5. If multiple results (like tutors), list them with details (rating, price)",
    "",
    "Answer:",
  ].join("\n");
}

function logRetrievedChunks(question, docs, retrievalMode) {
  console.log(`[RAG] question="${question}" mode=${retrievalMode} chunks=${docs.length}`);
  docs.forEach((doc, index) => {
    const snippet = doc.pageContent.replace(/\s+/g, " ").slice(0, 180);
    console.log(
      `[RAG] chunk#${index + 1} source=${doc.metadata?.fileName || doc.metadata?.source || "unknown"} subject=${doc.metadata?.subject || "GENERAL"} type=${doc.metadata?.type || "notes"} rating=${doc.metadata?.rating ?? "N/A"} price=${doc.metadata?.price ?? "N/A"} snippet="${snippet}"`,
    );
  });
}

/**
 * One-time ingestion pipeline:
 * Load PDFs -> split chunks -> embed -> store in Chroma.
 */
export async function ingestPdfs() {
  const docs = await loadPdfDocuments(process.env.PDF_DIR || "./data/pdfs");

  if (docs.length === 0) {
    return {
      files: 0,
      chunks: 0,
      message: "No PDF files found. Add PDFs to /data/pdfs first.",
    };
  }

  const chunks = await splitDocuments(docs, { chunkSize: 700, chunkOverlap: 100 });
  const vectorResult = await ingestIntoVectorStore(chunks);

  return {
    files: docs.length,
    chunks: chunks.length,
    collectionName: vectorResult.collectionName,
    message: "PDF ingestion finished successfully.",
  };
}

/**
 * Query pipeline:
 * Retrieve top chunks -> pass context + question to OpenAI -> return answer.
 */
export async function askRag(question, topK = 4) {
  if (!question || !question.trim()) {
    throw new Error("Question is required.");
  }

  let retrievedDocs = [];
  let retrievalMode = "chroma";
  const k = clampTopK(topK);

  try {
    retrievedDocs = await similaritySearch(question, k);
    if (retrievedDocs.length === 0) {
      retrievedDocs = await retrieveLocal(question, k);
      retrievalMode = "local";
    }
  } catch {
    retrievedDocs = await retrieveLocal(question, k);
    retrievalMode = "local";
  }

  if (retrievedDocs.length === 0) {
    return {
      answer: "No data available",
      sources: [],
      context: "",
      retrievalMode,
      llmUsed: false,
    };
  }

  logRetrievedChunks(question, retrievedDocs, retrievalMode);

  const context = formatRetrievedContext(retrievedDocs);
  const strictPrompt = buildStrictPrompt(context, question);

  if (!process.env.OPENAI_API_KEY) {
    return {
      answer: generateFallbackAnswer(question, retrievedDocs),
      sources: retrievedDocs.map((doc) => doc.metadata),
      context,
      retrievalMode,
      llmUsed: false,
    };
  }

  const llm = new ChatOpenAI({
    model: CHAT_MODEL,
    temperature: 0.2,
  });

  const response = await llm.invoke([
    {
      role: "system",
      content: "Follow user rules exactly. Never use knowledge outside context.",
    },
    {
      role: "user",
      content: strictPrompt,
    },
  ]);

  return {
    answer: toText(response.content),
    sources: retrievedDocs.map((doc) => doc.metadata),
    context,
    retrievalMode,
    llmUsed: true,
  };
}

/**
 * CLI mode:
 * - node rag.js ingest
 * - node rag.js "your question"
 */
async function runCli() {
  const args = process.argv.slice(2);
  const mode = args[0];

  try {
    if (mode === "ingest") {
      const result = await ingestPdfs();
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    const question = args.join(" ").trim();
    if (!question) {
      console.log("Usage:\n  node rag.js ingest\n  node rag.js \"What is DBMS normalization?\"");
      return;
    }

    const result = await askRag(question);
    console.log("Answer:\n", result.answer);
    console.log("\nSources:\n", JSON.stringify(result.sources, null, 2));
  } catch (error) {
    console.error("RAG error:", error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && process.argv[1].endsWith("rag.js")) {
  runCli();
}
