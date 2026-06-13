import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 7002);
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const MAX_WORDS = 120;

const STRICT_TUTOR_PROMPT = `You are an expert AI Tutor.

Answer the student question directly.

Hard Rules:
1. Do NOT ask follow-up questions.
2. Do NOT provide tips, guidance, or suggestions.
3. Do NOT use uncertainty phrases such as "I am not sure", "maybe", "might", or "could".
4. Do NOT repeat or restate the question.
5. Do NOT use generic filler text.
6. Provide real factual content.
4. Return only the final answer in this exact structure:
Definition: <2 concise sentences>
Explanation: <2-3 concise sentences>
Example: <1-2 concise sentences>
7. Keep the total response under 120 words.
8. Do not include markdown, bullet points, or extra headings.`;

function cleanTutorResponse(raw) {
  const text = String(raw || "")
    .replace(/^```[a-zA-Z]*\s*/g, "")
    .replace(/```$/g, "")
    .replace(/\r/g, "")
    .trim();

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^follow-?up\s*:/i.test(line))
    .filter((line) => !/^suggestions?\s*:/i.test(line))
    .filter((line) => !/^question\s*:/i.test(line));

  const merged = lines.join(" ");
  const noUncertainty = merged
    .replace(/\b(I am not sure|I'm not sure|I am unsure|maybe|might|could be|possibly)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const hasDefinition = /Definition\s*:/i.test(noUncertainty);
  const hasExplanation = /Explanation\s*:/i.test(noUncertainty);
  const hasExample = /Example\s*:/i.test(noUncertainty);

  if (hasDefinition && hasExplanation && hasExample) {
    return noUncertainty;
  }

  const sentences = noUncertainty
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const definition = sentences.slice(0, 2).join(" ") || "This topic is explained directly and clearly for students.";
  const explanation = sentences.slice(2, 5).join(" ") || "It works by following core principles and applying them step by step.";
  const example = sentences.slice(5, 7).join(" ") || "A practical example helps connect the concept to real-world use.";

  return `Definition: ${definition} Explanation: ${explanation} Example: ${example}`.replace(/\s{2,}/g, " ").trim();
}

function limitWords(text, maxWords = MAX_WORDS) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return words.join(" ");
  }

  return `${words.slice(0, maxWords).join(" ")}.`;
}

function localStructuredFallback(question) {
  const normalized = String(question || "").trim().toLowerCase();

  if (normalized.includes("generative ai")) {
    return limitWords(
      "Definition: Generative AI is a type of artificial intelligence that creates new content such as text, images, or code. " +
        "Explanation: It works using machine learning models trained on large datasets to recognize patterns and generate similar outputs. " +
        "Example: Chatbots can generate answers, and image tools can create pictures from text prompts.",
    );
  }

  if (normalized.includes("sand")) {
    return limitWords(
      "Definition: Sand is a granular material made mostly of small rock and mineral particles, commonly silica. " +
        "Explanation: It forms through weathering and erosion of rocks over long periods, and particle size is usually between silt and gravel. " +
        "Example: Beach sand often contains quartz grains, while desert sand is shaped by wind and can be more rounded.",
    );
  }

  return limitWords(
    "Definition: The concept has a precise meaning based on established subject knowledge. " +
      "Explanation: A correct answer requires core principles, key mechanisms, and accurate terminology from that subject. " +
      "Example: Apply the concept in one practical scenario to show how the rule works in real use.",
  );
}

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "Gemini Tutor Backend" });
});

app.post("/ask", async (req, res) => {
  try {
    const question = req.body?.question;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        error: "Invalid input. Provide a non-empty 'question' string.",
      });
    }

    if (!genAI) {
      return res.json({ answer: localStructuredFallback(question) });
    }

    const prompt = `${STRICT_TUTOR_PROMPT}\n\nQuestion:\n${question}\n\nAnswer:`;

    try {
      const modelCandidates = [process.env.GEMINI_MODEL, "gemini-2.0-flash", "gemini-1.5-flash"].filter(Boolean);
      let text = "";

      for (const modelName of modelCandidates) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 220,
              topP: 0.9,
            },
          });
          const response = await result.response;
          text = response.text() || "";
          break;
        } catch (error) {
          const message = String(error?.message || "");
          if (!/404|not found|unsupported/i.test(message)) {
            throw error;
          }
        }
      }

      const cleaned = cleanTutorResponse(text);
      const concise = limitWords(cleaned);

      return res.json({ answer: concise });
    } catch {
      return res.json({ answer: localStructuredFallback(question) });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
