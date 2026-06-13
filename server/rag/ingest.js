import { ingestPdfDirectory } from "./pipeline.js";

async function main() {
  try {
    const result = await ingestPdfDirectory();
    console.log("RAG Ingestion Complete");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("RAG ingestion failed:", error.message);
    process.exitCode = 1;
  }
}

main();
