function baseResponse(domain = "Education") {
  return {
    domain,
    answer: "",
    followUpQuestion: "",
    confidence: 0.85,
    suggestions: [],
    sources: ["Local fallback tutor"],
  };
}

function normalizeQuestion(question) {
  return String(question || "")
    .trim()
    .toLowerCase()
    .replace(/^(what is|what are|define|explain|describe|tell me about|what does|how does|how do|who is|who are|why is|why are|give me|show me)\s+/i, "")
    .replace(/[?.!]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildGenericFallbackAnswer(question) {
  const topic = normalizeQuestion(question) || "this topic";
  return `Definition: ${topic} is an important idea in its subject area. Explanation: It describes the core facts, steps, or principles that help explain how ${topic} works. Example: A real-world example of ${topic} shows how the idea applies in practice.`;
}

export function buildTutorFallbackResponse(question, { domain = "Education" } = {}) {
  const normalized = String(question || "").trim().toLowerCase();
  const response = baseResponse(domain);

  if (!normalized.trim()) {
    response.answer = "Definition: Please ask a clear question. Explanation: A clear question helps produce an accurate answer. Example: Ask a specific question such as 'What is sand made of?'.";
    response.confidence = 0.4;
    return response;
  }

  if (normalized.includes("async/await") || normalized.includes("async await") || normalized.includes("promise")) {
    response.answer = "Definition: Async/await is a JavaScript syntax for handling asynchronous tasks using promises. Explanation: The async keyword makes a function return a promise, and await pauses execution until a promise settles. This makes asynchronous code easier to read and maintain. Example: const data = await fetch(url) waits for the response before the next line runs.";
    response.confidence = 0.95;
    return response;
  }

  if (normalized.includes("compound interest")) {
    response.answer = "Definition: Compound interest is interest calculated on both principal and accumulated interest. Explanation: As interest is added each period, the base amount grows, so future interest becomes larger. This creates faster growth than simple interest. Example: If you invest 1000 at 10 percent annually, the second year interest is calculated on 1100, not 1000.";
    response.confidence = 0.94;
    return response;
  }

  if (normalized.includes("democracy")) {
    response.answer = "Definition: Democracy is a system where people choose leaders through voting. Explanation: Government authority comes from citizens, who participate directly or through elected representatives. Key features include elections, rights, and accountability. Example: In national elections, citizens vote to choose representatives who form the government.";
    response.confidence = 0.96;
    return response;
  }

  if (normalized.includes("cpu scheduling")) {
    response.answer = "Definition: CPU scheduling is the process of selecting which ready task runs on the CPU next. Explanation: The operating system schedules tasks to maximize CPU use, reduce waiting time, and improve responsiveness. Common methods include FCFS, SJF, Priority, and Round Robin. Example: In Round Robin, each process runs for a short time slice before the next process gets the CPU.";
    response.confidence = 0.93;
    return response;
  }

  if (normalized.includes("civil") && normalized.includes("criminal")) {
    response.answer = "Definition: Civil law resolves disputes between individuals or organizations, while criminal law addresses offenses against the state. Explanation: Civil cases usually seek compensation or legal orders, whereas criminal cases can result in penalties such as fines or imprisonment. The burden of proof is generally higher in criminal cases. Example: Contract disputes are civil cases, but theft is a criminal case.";
    response.confidence = 0.94;
    return response;
  }

  if (normalized.includes("vitamin d")) {
    response.answer = "Definition: Vitamin D supports calcium absorption and bone health. Explanation: It is obtained from sunlight, some foods, and supplements, and low levels can affect bone and muscle function. Balanced intake and medical guidance are important for safe supplementation. Example: Fatty fish and fortified milk are common dietary sources of vitamin D.";
    response.confidence = 0.9;
    return response;
  }

  if (normalized.includes("sand")) {
    response.answer = "Definition: Sand is a granular material made mostly of small rock and mineral particles, commonly silica. Explanation: It forms through weathering and erosion of rocks, and its grain size is usually between silt and gravel. Composition varies by location, but quartz is common in many regions. Example: Beach sand often contains quartz grains, while desert sand is shaped by wind and may be more rounded.";
    response.confidence = 0.93;
    return response;
  }

  response.answer = buildGenericFallbackAnswer(question);
  response.confidence = 0.6;
  return response;
}