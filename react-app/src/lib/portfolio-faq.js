const DIRECT_CHAT_HINT = "If you want Reggie himself, just say “talk to Reggie.”";
const FALLBACK = `I’m sorry, I didn’t understand that. Try asking about Reggie’s work, tech stack, certificates, travel, interests, or portfolio. ${DIRECT_CHAT_HINT}`;
const PROFANITY_TERMS = [
  " fuck ", " fucking ", " fucked ", " shit ", " bullshit ", " bitch ", " asshole ", " bastard ",
  " gago ", " tanga ", " ulol ", " puta ", " putang ina ", " tangina ", " tarantado ",
];
const PROFANITY_RESPONSE = "Please stop swearing and keep the conversation respectful. I’m happy to help when we speak kindly.";

const FAQ_RULES = [
  {
    intent: "handoff",
    terms: ["talk to reggie", "chat with reggie", "speak to reggie", "reggie directly", "real person", "human", "contact", "message reggie", "reach reggie"],
    answer: "Of course. I can connect you to Reggie in a temporary private chat. You can share your name before the conversation starts.",
    offerHandoff: true,
  },
  { intent: "greeting", terms: [" hello ", " hi ", " hey ", "good morning", "good afternoon", "good evening"], answer: `Hello! I’m Zenith. You can ask me about Reggie’s work, tech stack, travel, or interests. ${DIRECT_CHAT_HINT}` },
  { intent: "wellbeing", terms: ["how are you", "how is it going", "whats up", "what is up"], answer: `I’m ready to help. What would you like to know about Reggie? ${DIRECT_CHAT_HINT}` },
  { intent: "thanks", terms: ["thank you", "thanks", "helpful", "got it"], answer: `You’re welcome! Ask me anything else about the portfolio. ${DIRECT_CHAT_HINT}` },
  { intent: "goodbye", terms: ["goodbye", " bye ", "see you", "later"], answer: "See you around! I’ll be here whenever you want to explore more." },
  { intent: "capabilities", terms: ["what can you do", "help me", "your purpose", "how can you help"], answer: `I can guide you through Reggie’s work, stack, certificates, albums, travel, and interests. ${DIRECT_CHAT_HINT}` },
  { intent: "navigation", terms: ["where should", "where do i start", "best place", " start ", "navigate", "navigation"], answer: `Start with Tech for Reggie’s developer journey, Travel for journals, or Life for the person beyond the work. ${DIRECT_CHAT_HINT}` },
  { intent: "stack", terms: ["tech stack", " stack ", "technology", " tools ", "framework", "language", "build with"], answer: `The Tech page shows Reggie’s tools in an interactive drift wall. ${DIRECT_CHAT_HINT}` },
  { intent: "certificates", terms: ["certificate", "certification", "credential", " course "], answer: `His certificates are on the Tech page. Select one from the shelf for the full view. ${DIRECT_CHAT_HINT}` },
  { intent: "work", terms: ["experience", "education", "background", "developer", "software", " skill", " work ", "project", " build ", "job", "resume", "cv"], answer: `The Tech page covers Reggie’s development journey, education, stack, certificates, and project-related albums. ${DIRECT_CHAT_HINT}` },
  { intent: "travel", terms: ["travel", "journey", "destination", "passport", "international", "local trip"], answer: `The Travel page contains local and international journals. Select a cover to read the full story. ${DIRECT_CHAT_HINT}` },
  { intent: "life", terms: [" life ", "volleyball", "coffee", "motorcycle", "vespa", "nmax", " ride", "hobby", "interest"], answer: `The Life page collects Reggie’s interests outside software, including volleyball, coffee, and rides. ${DIRECT_CHAT_HINT}` },
  { intent: "albums", terms: ["album", "photo", "picture", "gallery", " event"], answer: `Published albums appear in their matching Tech, Travel, or Life section. ${DIRECT_CHAT_HINT}` },
  { intent: "about", terms: ["who is reggie", "about reggie", "john reggie", "tell me about him", "portfolio"], answer: `John Reggie Barbacena is the developer behind this portfolio—a space for his technical journey, travels, and life beyond code. ${DIRECT_CHAT_HINT}` },
  { intent: "zenith", terms: ["who are you", "your name", "zenith", "chatbot", " bot "], answer: `I’m Zenith, Reggie’s portfolio guide. I use prepared answers and keyword matching, so no paid AI service is required. ${DIRECT_CHAT_HINT}` },
];

function normalizeQuestion(question) {
  return ` ${String(question ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ")} `;
}

export function getPortfolioFaqResponse(question) {
  const normalized = normalizeQuestion(question);
  if (PROFANITY_TERMS.some((term) => normalized.includes(term))) {
    return { answer: PROFANITY_RESPONSE, intent: "profanity", offerHandoff: false };
  }
  let best = null;
  let bestScore = 0;
  for (const rule of FAQ_RULES) {
    const score = rule.terms.reduce((total, term) => total + (normalized.includes(term) ? term.length : 0), 0);
    if (score > bestScore) { best = rule; bestScore = score; }
  }
  return {
    answer: best?.answer ?? FALLBACK,
    intent: best?.intent ?? "fallback",
    offerHandoff: best?.offerHandoff === true,
  };
}

export function answerPortfolioFaq(question) {
  return getPortfolioFaqResponse(question).answer;
}
