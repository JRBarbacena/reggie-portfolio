const FALLBACK = "I can guide you through Reggie's Tech, Travel, and Life pages, explain the portfolio, or help you start a temporary live chat with Reggie.";

const FAQ_RULES = [
  { terms: ["tech stack", "stack", "technology", "tools", "build with"], answer: "Open the Tech page to see the tools Reggie builds with, presented in the interactive drift wall." },
  { terms: ["certificate", "certification", "credential"], answer: "Reggie's certificates are on the Tech page. Select a certificate on the shelf to open its full modal view." },
  { terms: ["experience", "education", "background", "developer"], answer: "The Tech page brings together Reggie's development journey, education, stack, certificates, and technology-related albums." },
  { terms: ["travel", "journey", "destination", "passport"], answer: "The Travel page contains local and international journals. Select a cover to read its full travel story." },
  { terms: ["life", "volleyball", "coffee", "motorcycle", "ride"], answer: "The Life page collects Reggie's interests and moments outside software, including sport, coffee, and rides." },
  { terms: ["contact", "message", "email", "hire", "collaborate", "available"], answer: "Choose “Chat with Reggie” for a temporary live conversation, or “Send Reggie a message” for a contact inquiry he can answer by email." },
  { terms: ["album", "photo", "gallery"], answer: "Published albums appear in their matching Tech, Travel, or Life section. Reggie manages their visibility from his private dashboard." },
  { terms: ["who are you", "your name", "zenith"], answer: "I'm Zenith, the portfolio guide. I can answer common questions and connect you with Reggie without using a paid AI service." },
];

export function answerPortfolioFaq(question) {
  const normalized = String(question ?? "").trim().toLowerCase();
  if (!normalized) return FALLBACK;
  return FAQ_RULES.find((rule) => rule.terms.some((term) => normalized.includes(term)))?.answer ?? FALLBACK;
}
