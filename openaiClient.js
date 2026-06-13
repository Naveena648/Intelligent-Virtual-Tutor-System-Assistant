import OpenAI from "openai";

function ensureApiKey() {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY is missing. Add it to your .env file.");
    error.statusCode = 500;
    throw error;
  }
}

function buildMessages(question, googleResults) {
  const contextBlock = googleResults.length
    ? googleResults
        .map(
          (result, index) =>
            `${index + 1}. Title: ${result.title}\nSnippet: ${result.snippet}\nLink: ${result.link}`,
        )
        .join("\n\n")
    : "No input data available.";

  return [
    {
      role: "system",
      content: "You are an intelligent AI tutor assistant.",
    },
    {
      role: "user",
      content: [
        "Your task is to extract relevant information and answer the question.",
        "",
        "Question:",
        question,
        "",
        "Data:",
        contextBlock,
        "",
        "Instructions:",
        "1. Read the data carefully",
        "2. Extract only relevant information related to the question",
        "3. Ignore unrelated content",
        "4. Combine extracted info into a clear answer",
        "5. Do NOT add outside knowledge",
        "6. If no relevant info is found, say: \"No relevant data found\"",
        "7. Keep answer structured and easy to understand",
        "",
        "Answer:",
      ].join("\n"),
    },
  ];
}

export async function generateAnswer(question, googleResults = []) {
  ensureApiKey();

  if (!Array.isArray(googleResults) || googleResults.length === 0) {
    return "No relevant data found";
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    messages: buildMessages(question, googleResults),
  });

  return completion.choices?.[0]?.message?.content?.trim() || "No answer generated.";
}
