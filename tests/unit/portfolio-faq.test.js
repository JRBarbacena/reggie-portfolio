import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { answerPortfolioFaq, getPortfolioFaqResponse } from "../../react-app/src/lib/portfolio-faq.js";
import { PORTFOLIO_KNOWLEDGE } from "../../react-app/src/lib/portfolio-knowledge.js";

describe("Zenith FAQ", () => {
  it("routes known questions to portfolio content", () => {
    expect(answerPortfolioFaq("Where is your tech stack?")).toContain("Tech page");
    expect(answerPortfolioFaq("Can I see travel journals?")).toContain("Travel page");
    expect(answerPortfolioFaq("Can I see travel journals?")).toContain("under construction");
    expect(answerPortfolioFaq("What is on the life page?")).toContain("under construction");
    expect(answerPortfolioFaq("What kind of work does he build?")).toContain("development journey");
  });

  it("offers a useful bounded fallback", () => {
    expect(answerPortfolioFaq("flibbertigibbet xyz")).toContain("I didn’t understand");
  });

  it("always offers a path to a personal answer", () => {
    expect(answerPortfolioFaq("certificates")).toContain("talk to Reggie");
    expect(answerPortfolioFaq("something unknown")).toContain("talk to Reggie");
  });

  it("offers the human handoff only after the visitor asks for it", () => {
    expect(getPortfolioFaqResponse("Hello").offerHandoff).toBe(false);
    expect(getPortfolioFaqResponse("I want to talk to Reggie")).toMatchObject({ intent: "handoff", offerHandoff: true });
  });

  it("understands compact phrases and small spelling mistakes", () => {
    expect(getPortfolioFaqResponse("hellozennith")).toMatchObject({ intent: "greeting", offerHandoff: false });
    expect(getPortfolioFaqResponse("talktoregie")).toMatchObject({ intent: "handoff", offerHandoff: true });
    expect(getPortfolioFaqResponse("where are your certficates").intent).toBe("certificates");
    expect(getPortfolioFaqResponse("show me the teck stack").intent).toBe("stack");
    expect(getPortfolioFaqResponse("show me the teckstack").intent).toBe("stack");
  });

  it("answers detailed questions about the portfolio system", () => {
    expect(answerPortfolioFaq("How does the preloader work?")).toContain("Braille-style");
    expect(answerPortfolioFaq("What does the ballpit do?")).toContain("57");
    expect(PORTFOLIO_KNOWLEDGE.home.interactions).toContain("57-sphere Three.js Ballpit with cursor interaction and no cursor-following sphere");
    expect(answerPortfolioFaq("What tools are in the tech stack?")).toContain("TypeScript");
    expect(answerPortfolioFaq("Is live chat private?")).toContain("one hour");
  });

  it("answers detailed public facts without inventing them", () => {
    expect(answerPortfolioFaq("What is Reggie's full name?")).toContain("John Reggie M. Barbacena");
    expect(answerPortfolioFaq("Who issued the certificates?")).toContain("Certiport");
    expect(answerPortfolioFaq("What sustainability certificates does he have?")).toContain("Driving Sustainability at Your Organization");
    expect(answerPortfolioFaq("Tell me about the DevDays album")).toContain("11 photos");
    expect(answerPortfolioFaq("What are the home interest icons?")).toContain("MacBook M5");
    expect(answerPortfolioFaq("What social media can I follow?")).toContain("@jjstr.rgg");
    expect(answerPortfolioFaq("How was this website built?")).toContain("React 19");
    expect(answerPortfolioFaq("Does he know Java?")).toContain("Java");
    expect(answerPortfolioFaq("What can Zenith access?")).toContain("public portfolio content");
    expect(answerPortfolioFaq("What is his phone number?")).toContain("not published");
  });

  it("uses the official AI Fluency title across certificate content", async () => {
    const officialTitle = "AI Fluency: Framework & Foundations";
    const incorrectTitle = "AI Fluency: Frameworks & Foundations";
    const faqAnswer = answerPortfolioFaq("What AI Fluency certificate does he have?");
    const knowledgeTitles = PORTFOLIO_KNOWLEDGE.tech.certificates.map(({ title }) => title);
    const techPageSource = await readFile(new URL("../../react-app/src/pages/TechPage.jsx", import.meta.url), "utf8");

    expect(faqAnswer).toContain(officialTitle);
    expect(knowledgeTitles).toContain(officialTitle);
    expect(techPageSource).toContain(officialTitle);
    expect([faqAnswer, ...knowledgeTitles, techPageSource].join("\n")).not.toContain(incorrectTitle);
  });

  it("asks visitors to stop using profanity before matching other intents", () => {
    expect(getPortfolioFaqResponse("This is fucking bad")).toMatchObject({ intent: "profanity", offerHandoff: false });
    expect(answerPortfolioFaq("putang ina")).toContain("stop swearing");
  });
});
