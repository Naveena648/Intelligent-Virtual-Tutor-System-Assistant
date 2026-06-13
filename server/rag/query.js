import { answerWithRag } from "./pipeline.js";

async function main() {
  const query = process.argv.slice(2).join(" ").trim();

  if (!query) {
    console.error("Usage: npm run rag:query -- \"your question here\"");
    process.exit(1);
  }

  try {
    const result = await answerWithRag(query, { topK: 4 });
    console.log("RAG Answer");
    console.log(result.answer);
    console.log("\nSources");
    console.log(JSON.stringify(result.sources, null, 2));
  } catch (error) {
    console.error("RAG query failed:", error.message);
    process.exitCode = 1;
  }
}

main();
