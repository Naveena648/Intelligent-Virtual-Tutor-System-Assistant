export const knowledgeChunks = [
  {
    id: "edu-1",
    domain: "Education",
    title: "Spaced repetition improves retention",
    content:
      "Spaced repetition works because review sessions are timed before forgetting becomes complete. It is especially effective for definitions, formulas, and foreign vocabulary.",
    keywords: ["study", "memory", "retention", "exam", "revision"],
  },
  {
    id: "edu-2",
    domain: "Education",
    title: "Active recall beats passive rereading",
    content:
      "Active recall means retrieving an answer from memory without looking at the source first. It reveals knowledge gaps earlier than rereading notes.",
    keywords: ["active recall", "flashcards", "memory", "practice"],
  },
  {
    id: "edu-3",
    domain: "Education",
    title: "Good explanations use structure",
    content:
      "A clear explanation usually has a definition, a concrete example, and a short summary of why the concept matters. This helps learners connect new information to prior knowledge.",
    keywords: ["explanation", "example", "summary", "learning"],
  },
  {
    id: "prog-1",
    domain: "Programming",
    title: "Async functions return promises",
    content:
      "In JavaScript, an async function always returns a promise. Await pauses the function until the promise settles, which makes asynchronous code easier to read.",
    keywords: ["javascript", "async", "await", "promise"],
  },
  {
    id: "prog-2",
    domain: "Programming",
    title: "Data structures affect performance",
    content:
      "Choosing the right data structure changes time and memory complexity. Arrays are simple to index, while maps and sets are often better for fast lookups.",
    keywords: ["array", "map", "set", "performance", "complexity"],
  },
  {
    id: "prog-3",
    domain: "Programming",
    title: "APIs should validate input at the edge",
    content:
      "Validating request payloads early keeps the rest of the application simpler and safer. It also gives users clearer error messages when something is malformed.",
    keywords: ["api", "validation", "request", "payload", "error"],
  },
  {
    id: "health-1",
    domain: "Healthcare",
    title: "Lifestyle patterns often affect symptoms",
    content:
      "Many common symptoms are influenced by sleep, diet, hydration, and stress. A tutoring system should avoid diagnosis and instead encourage professional care for medical concerns.",
    keywords: ["health", "symptom", "sleep", "diet", "medical"],
  },
  {
    id: "health-2",
    domain: "Healthcare",
    title: "Medical guidance needs caution",
    content:
      "Good health information distinguishes between general education and individualized medical advice. The safest response is to give broad context and recommend a clinician for personal decisions.",
    keywords: ["medical advice", "clinician", "general guidance"],
  },
  {
    id: "health-3",
    domain: "Healthcare",
    title: "Prevention is more reliable than correction",
    content:
      "Preventive habits such as sleep consistency, exercise, and routine checkups often reduce the chance of later problems. That does not replace diagnosis or treatment.",
    keywords: ["prevention", "sleep", "exercise", "checkup"],
  },
  {
    id: "law-1",
    domain: "Law",
    title: "Civil and criminal law solve different problems",
    content:
      "Civil law usually resolves disputes between people or organizations, while criminal law addresses conduct that violates public statutes and can lead to government prosecution.",
    keywords: ["civil", "criminal", "law", "court"],
  },
  {
    id: "law-2",
    domain: "Law",
    title: "Jurisdiction determines which court can hear a case",
    content:
      "Jurisdiction depends on the subject matter, geography, and authority of the court. A legal answer should avoid pretending to be legal advice.",
    keywords: ["jurisdiction", "court", "case", "legal"],
  },
  {
    id: "law-3",
    domain: "Law",
    title: "Contracts depend on offer, acceptance, and consideration",
    content:
      "A basic contract analysis starts with offer, acceptance, and consideration, then checks for capacity and legality. Missing one element can change the outcome.",
    keywords: ["contract", "offer", "acceptance", "consideration"],
  },
  {
    id: "finance-1",
    domain: "Finance",
    title: "Compound interest grows on principal and prior interest",
    content:
      "Compound interest accumulates because interest is added to the principal, and future interest is calculated on the larger balance. Time has a strong effect on the final amount.",
    keywords: ["compound interest", "principal", "interest", "growth"],
  },
  {
    id: "finance-2",
    domain: "Finance",
    title: "Risk and return usually move together",
    content:
      "Higher expected returns usually come with higher uncertainty. A good answer explains the tradeoff without promising guaranteed profits.",
    keywords: ["risk", "return", "portfolio", "investment"],
  },
  {
    id: "finance-3",
    domain: "Finance",
    title: "Budgeting starts with cash flow awareness",
    content:
      "Budgeting works best when income, fixed expenses, and variable spending are visible. Tracking cash flow makes it easier to set realistic saving goals.",
    keywords: ["budget", "cash flow", "savings", "expenses"],
  },
  {
    id: "personal-1",
    domain: "Personal Development",
    title: "Small habits compound over time",
    content:
      "Behavior change is more reliable when the habit is tiny, obvious, and repeated often. Consistency usually matters more than intensity.",
    keywords: ["habit", "consistency", "growth", "routine"],
  },
  {
    id: "personal-2",
    domain: "Personal Development",
    title: "Reflection improves self-correction",
    content:
      "Writing down what worked and what failed helps make the next attempt better. Reflection turns experience into a repeatable process.",
    keywords: ["reflection", "self-improvement", "goal", "feedback"],
  },
];

export const supportedDomains = [
  "Education",
  "Programming",
  "Healthcare",
  "Law",
  "Finance",
  "Personal Development",
];