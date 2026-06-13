import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { ragConfig, assertOpenAiKey } from "./config.js";
import { loadPdfDocuments } from "./pdfLoader.js";

function toText(value) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item : item?.text || "")).join("\n");
  }

  return String(value ?? "");
}

function createEmbeddings() {
  return new OpenAIEmbeddings({ model: ragConfig.embeddingModel });
}

function createVectorStore(embeddings) {
  return new Chroma(embeddings, {
    collectionName: ragConfig.collectionName,
    url: ragConfig.chromaUrl,
  });
}

/**
 * Ingest all PDFs from data/pdfs into Chroma.
 */
export async function ingestPdfDirectory() {
  assertOpenAiKey();

  const rawDocs = await loadPdfDocuments(ragConfig.pdfDirectory);
  if (rawDocs.length === 0) {
    return {
      ingestedFiles: 0,
      chunksAdded: 0,
      message: `No PDF files found in ${ragConfig.pdfDirectory}`,
    };
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: ragConfig.chunkSize,
    chunkOverlap: ragConfig.chunkOverlap,
  });

  const chunks = await splitter.createDocuments(
    rawDocs.map((doc) => doc.pageContent),
    rawDocs.map((doc) => doc.metadata),
  );

  const embeddings = createEmbeddings();
  const vectorStore = createVectorStore(embeddings);

  await vectorStore.addDocuments(chunks);

  return {
    ingestedFiles: rawDocs.length,
    chunksAdded: chunks.length,
    message: `Ingested ${rawDocs.length} PDFs and stored ${chunks.length} chunks in Chroma collection "${ragConfig.collectionName}".`,
  };
}

/**
 * Retrieve relevant chunks and answer with an LLM.
 */
export async function answerWithRag(query, options = {}) {
  assertOpenAiKey();

  const topK = Number(options.topK || 4);
  const embeddings = createEmbeddings();
  const vectorStore = createVectorStore(embeddings);
  const relevantDocs = await vectorStore.similaritySearch(query, topK);

  const context = relevantDocs
    .map((doc, index) => {
      const source = doc.metadata?.title || doc.metadata?.source || "unknown-source";
      return `Chunk ${index + 1} (${source}):\n${doc.pageContent}`;
    })
    .join("\n\n");

  const llm = new ChatOpenAI({
    model: ragConfig.chatModel,
    temperature: 0.2,
  });

  const response = await llm.invoke([
    {
      role: "system",
      content:
        "You are an intelligent virtual tutor. Use only the retrieved context when answering. If context is insufficient, clearly say what is missing.",
    },
    {
      role: "user",
      content: `Question:\n${query}\n\nRetrieved Context:\n${context || "No context retrieved."}`,
    },
  ]);

  return {
    answer: toText(response.content),
    context,
    sources: relevantDocs.map((doc) => doc.metadata),
  };
}
