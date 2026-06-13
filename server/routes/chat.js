import { Router } from "express";
import { z } from "zod";
import { readState, updateState } from "../lib/fileStore.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildTutorFallbackResponse } from "../../tutorFallback.js";
import { searchGoogle } from "../../googleSearchClient.js";
import { requireAuth } from "../middleware/auth.js";
import crypto from "crypto";

const router = Router();
const GEMINI_MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-2.0-flash",
  "gemini-1.5-flash",
].filter(Boolean);

const chatSchema = z.object({
  message: z.string().min(2),
  domain: z.string().optional().default("Auto"),
  language: z.string().optional().default("en"),
  userId: z.string().optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional().default([]),
});

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

function looksLikeGenericTemplate(answer) {
  const text = String(answer || "").toLowerCase();
  return (
    text.includes("the concept has a precise meaning") ||
    text.includes("a correct answer should include") ||
    text.includes("one practical real-world scenario") ||
    text.includes("established subject knowledge") ||
    text.includes("core principles, key mechanisms")
  );
}

function limitWords(text, maxWords = 120) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return words.join(" ");
  }

  return `${words.slice(0, maxWords).join(" ")}.`;
}

function formatSourcesForPrompt(sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return "No external web context available.";
  }

  return sources
    .slice(0, 5)
    .map((item, index) => {
      const title = item.title || "Untitled";
      const snippet = item.snippet || "";
      const link = item.link || "";
      return `${index + 1}. Title: ${title}\nSnippet: ${snippet}\nLink: ${link}`;
    })
    .join("\n\n");
}

function extractSentences(text, max = 4) {
  return String(text || "")
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

function buildTopicExample(topic) {
  const normalized = String(topic || "").toLowerCase();

  if (normalized.includes("compound interest")) {
    return "A savings account grows faster when interest is added back into the balance each year.";
  }

  if (normalized.includes("photosynthesis")) {
    return "A plant uses sunlight, water, and carbon dioxide to make glucose and release oxygen.";
  }

  if (normalized.includes("democracy")) {
    return "Citizens vote in an election to choose representatives who govern on their behalf.";
  }

  if (normalized.includes("async/await") || normalized.includes("async await")) {
    return "A fetch request can wait for data before the next line of code runs.";
  }

  if (normalized.includes("civil") && normalized.includes("criminal")) {
    return "A contract dispute is civil, while theft is handled under criminal law.";
  }

  if (normalized.includes("vitamin d")) {
    return "Sunlight, fortified foods, and supplements can help maintain healthy vitamin D levels.";
  }

  return `A practical example of ${topic} is how it appears in a real-world situation.`;
}

function synthesizeFromSources(sources) {
  const corpus = sources
    .map((item) => `${item.title || ""}. ${item.snippet || ""}`.trim())
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const sentences = extractSentences(corpus, 6);
  const definition = sentences[0] || "A clear definition is available from reliable web summaries.";
  const explanation = sentences.slice(1, 4).join(" ") || "The concept can be explained through key facts from trusted web sources.";
  const example = sentences.slice(4, 6).join(" ") || "A practical example can be drawn from one of the referenced sources.";

  return limitWords(`Definition: ${definition} Explanation: ${explanation} Example: ${example}`);
}

function normalizeQuestionForSearch(question) {
  const raw = String(question || "").trim();
  if (!raw) {
    return "";
  }

  return raw
    .replace(/^(explain|define|describe|tell me about|give me|what is|what are|who is|who are|how does|how do)\s+/i, "")
    .replace(/\b(in simple terms|simply|for beginners|in easy words)\b/gi, "")
    .replace(/\?+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function getLastUserMessage(history) {
  for (let index = (history || []).length - 1; index >= 0; index -= 1) {
    const entry = history[index];
    if (entry?.role === "user" && String(entry.content || "").trim()) {
      return String(entry.content).trim();
    }
  }

  return "";
}

function buildConversationContext(history) {
  const recentTurns = (history || [])
    .filter((entry) => entry && (entry.role === "user" || entry.role === "assistant"))
    .slice(-6)
    .map((entry) => `${entry.role === "assistant" ? "Assistant" : "User"}: ${String(entry.content || "").trim()}`)
    .filter(Boolean);

  return recentTurns.join("\n");
}

function resolveQuestionWithHistory(question, history) {
  const currentQuestion = String(question || "").trim();
  const lastUserQuestion = getLastUserMessage(history);

  if (!currentQuestion) {
    return currentQuestion;
  }

  if (!lastUserQuestion) {
    return currentQuestion;
  }

  if (/\b(what did i just ask|what was my last question|what was the question i asked|what did i ask|repeat my question)\b/i.test(currentQuestion)) {
    return `The user previously asked: ${lastUserQuestion}`;
  }

  if (/\b(it|that|this|they|them|those|these)\b/i.test(currentQuestion) || /\b(same thing|again|more detail|more details|example|real-life example)\b/i.test(currentQuestion)) {
    const resolvedTopic = normalizeQuestionForSearch(lastUserQuestion) || lastUserQuestion;

    if (/\b(example|real-life example)\b/i.test(currentQuestion)) {
      return `${resolvedTopic} example`;
    }

    if (/\b(explain|describe|tell me about|what is|what are|how does|how do)\b/i.test(currentQuestion)) {
      return resolvedTopic;
    }

    return resolvedTopic;
  }

  return currentQuestion;
}

function isMetaConversationQuestion(question) {
  return /\b(what did i just ask|what was my last question|what was the question i asked|what did i ask|repeat my question|what did i say)\b/i.test(String(question || ""));
}

function buildConversationMemoryAnswer(question, history) {
  const lastUserQuestion = getLastUserMessage(history);
  const previousTopic = normalizeQuestionForSearch(lastUserQuestion) || lastUserQuestion || "your previous question";

  if (isMetaConversationQuestion(question)) {
    return {
      answer: limitWords(`Definition: Your last question was: ${lastUserQuestion || "your previous question"}. Explanation: I used that message as the current conversation reference. Example: You can now ask me to explain the same topic in more detail.`),
      sourceMode: "conversation-memory",
      confidence: 1,
      sources: [],
      context: "Answered from conversation memory",
    };
  }

  return {
    answer: "",
    sourceMode: "conversation-memory",
    confidence: 0,
    sources: [],
    context: previousTopic,
  };
}

async function fetchWikipediaSummary(question) {
  const rawQuery = String(question || "").trim();
  if (!rawQuery) {
    return null;
  }

  const candidates = [normalizeQuestionForSearch(rawQuery), rawQuery].filter(Boolean);

  let firstTitle = null;
  for (const candidate of candidates) {
    const searchEndpoint = new URL("https://en.wikipedia.org/w/api.php");
    searchEndpoint.searchParams.set("action", "opensearch");
    searchEndpoint.searchParams.set("search", candidate);
    searchEndpoint.searchParams.set("limit", "1");
    searchEndpoint.searchParams.set("namespace", "0");
    searchEndpoint.searchParams.set("format", "json");

    const searchResponse = await fetch(searchEndpoint.toString());
    if (!searchResponse.ok) {
      continue;
    }

    const searchPayload = await searchResponse.json();
    const title = Array.isArray(searchPayload?.[1]) ? searchPayload[1][0] : null;
    if (title) {
      firstTitle = title;
      break;
    }
  }

  if (!firstTitle) {
    return null;
  }

  const summaryEndpoint = new URL(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstTitle)}`);
  const summaryResponse = await fetch(summaryEndpoint.toString());
  if (!summaryResponse.ok) {
    return null;
  }

  const summaryPayload = await summaryResponse.json();
  const extract = summaryPayload?.extract;
  const pageUrl = summaryPayload?.content_urls?.desktop?.page || "";

  if (!extract) {
    return null;
  }

  const sentences = extractSentences(extract, 5);
  const definition = sentences[0] || extract;
  const explanation = sentences.slice(1, 4).join(" ") || extract;
  const example =
    sentences[4] && !/this summary is based on encyclopedic reference content/i.test(sentences[4])
      ? sentences[4]
      : buildTopicExample(firstTitle);

  return {
    answer: limitWords(`Definition: ${definition} Explanation: ${explanation} Example: ${example}`),
    source: {
      title: firstTitle,
      snippet: extract,
      link: pageUrl,
    },
  };
}

router.get("/history", requireAuth, async (req, res, next) => {
  try {
    const state = await readState();
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 50)));

    const conversations = state.conversations
      .filter((entry) => entry.userId === req.user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    res.json({ conversations });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = chatSchema.parse(req.body);
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
    const inferredDomain = payload.domain && payload.domain !== "Auto" ? payload.domain : "Education";
    const conversationContext = buildConversationContext(payload.conversationHistory);
    const resolvedQuestion = resolveQuestionWithHistory(payload.message, payload.conversationHistory);
    let sourceMode = null;
    let answer = "";
    let sources = [];
    let confidence = 0;
    let webSources = [];

    // Handle meta conversation questions first
    if (isMetaConversationQuestion(payload.message)) {
      const memoryAnswer = buildConversationMemoryAnswer(payload.message, payload.conversationHistory);

      const conversationId = crypto.randomUUID();
      await updateState(async (state) => ({
        ...state,
        conversations: [
          {
            id: conversationId,
            userId: payload.userId || null,
            question: payload.message,
            answer: memoryAnswer.answer,
            domain: inferredDomain,
            createdAt: new Date().toISOString(),
          },
          ...state.conversations,
        ],
      }));

      return res.json({
        id: conversationId,
        message: memoryAnswer.answer,
        answer: memoryAnswer.answer,
        classification: {
          domain: inferredDomain,
          confidence: memoryAnswer.confidence,
          source: memoryAnswer.sourceMode,
        },
        sources: memoryAnswer.sources,
        context: memoryAnswer.context,
        followUpQuestion: "",
        suggestions: [],
      });
    }

    // PRIMARY: Try Gemini with Google web context
    if (genAI) {
      try {
        webSources = await searchGoogle(resolvedQuestion, 5);
      } catch {
        webSources = [];
      }

      try {
        const webContext = formatSourcesForPrompt(webSources);
        const historyPrompt = conversationContext
          ? `Conversation history:\n${conversationContext}`
          : "Conversation history: none.";
        const prompt = `${STRICT_TUTOR_PROMPT}\n\n${historyPrompt}\n\nResolved question:\n${resolvedQuestion}\n\nWeb Context (trusted snippets):\n${webContext}\n\nAnswer the resolved question directly using the actual topic. Do not return a generic template response. If the question is a follow-up, use the conversation history to resolve pronouns like it, that, or this, then answer the resolved topic concretely.`;

        let text = "";
        let lastError = null;
        for (const modelName of GEMINI_MODEL_CANDIDATES) {
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
            lastError = null;
            break;
          } catch (error) {
            lastError = error;
            const message = String(error?.message || "");
            if (!/404|not found|unsupported/i.test(message)) {
              throw error;
            }
          }
        }

        if (!text && lastError) {
          throw lastError;
        }

        answer = limitWords(cleanTutorResponse(text));
        if (looksLikeGenericTemplate(answer)) {
          throw new Error("Gemini returned a generic template response");
        }
        sources = webSources;
        sourceMode = webSources.length > 0 ? "gemini+google" : "gemini";
        confidence = webSources.length > 0 ? 0.95 : 0.9;
        console.log("✅ Gemini response received");
      } catch (geminiError) {
        console.error("⚠️ Gemini API failed:", geminiError.message);
        sourceMode = null;
      }
    }

    // FALLBACK 2: Use Google web sources directly
    if (!sourceMode) {
      try {
        webSources = await searchGoogle(resolvedQuestion, 5);
      } catch {
        webSources = [];
      }

      if (webSources.length > 0) {
        answer = synthesizeFromSources(webSources);
        sources = webSources;
        sourceMode = "google-context";
        confidence = 0.9;
        console.log("✅ Google web context synthesized");
      }
    }

    // FALLBACK 3: Try Wikipedia
    if (!sourceMode) {
      try {
        const wiki = await fetchWikipediaSummary(resolvedQuestion);
        if (wiki) {
          answer = wiki.answer;
          sources = [wiki.source];
          sourceMode = "wikipedia-context";
          confidence = 0.88;
          console.log("✅ Wikipedia response received");
        }
      } catch {
        // Continue to local fallback
      }
    }

    // FALLBACK 4: Local hardcoded fallback
    if (!sourceMode) {
      const fallback = buildTutorFallbackResponse(resolvedQuestion, {
        domain: inferredDomain,
        language: payload.language,
      });
      answer = fallback.answer;
      sources = fallback.sources;
      sourceMode = "local-fallback";
      confidence = 0.65;
      console.log("⚠️ Using local fallback response");
    }

    // Save to conversation history
    const conversationId = crypto.randomUUID();
    await updateState(async (state) => ({
      ...state,
      conversations: [
        {
          id: conversationId,
          userId: payload.userId || null,
          question: payload.message,
          answer,
          domain: inferredDomain,
          createdAt: new Date().toISOString(),
        },
        ...state.conversations,
      ],
    }));

    // Return response with proper context message
    const contextMessages = {
      perplexity: "Answered by Perplexity AI with real-time web context",
      "gemini+google": "Answered by Gemini API using Google web context",
      gemini: "Answered by Gemini API",
      "google-context": "Answered using Google web context",
      "wikipedia-context": "Answered using Wikipedia reference context",
      "conversation-memory": "Answered from conversation memory",
      "local-fallback": "Answered by local fallback tutor",
    };

    res.json({
      id: conversationId,
      message: answer,
      answer,
      domain: inferredDomain,
      classification: {
        domain: inferredDomain,
        confidence,
        source: sourceMode,
      },
      sources,
      context: contextMessages[sourceMode] || "Answer generated",
      followUpQuestion: "",
      suggestions: [],
    });
  } catch (error) {
    next(error);
  }
});

export default router;
