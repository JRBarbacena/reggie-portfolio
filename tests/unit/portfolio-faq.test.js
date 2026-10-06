import { describe, expect, it } from "vitest";
import { answerPortfolioFaq, getPortfolioFaqResponse } from "../../react-app/src/lib/portfolio-faq.js";

describe("Zenith FAQ", () => {
  it("routes known questions to portfolio content", () => {
    expect(answerPortfolioFaq("Where is your tech stack?")).toContain("Tech page");
    expect(answerPortfolioFaq("Can I see travel journals?")).toContain("Travel page");
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
    expect(answerPortfolioFaq("What does the ballpit do?")).toContain("65");
    expect(answerPortfolioFaq("What tools are in the tech stack?")).toContain("TypeScript");
    expect(answerPortfolioFaq("Is live chat private?")).toContain("one hour");
  });

  it("answers detailed public facts without inventing them", () => {
    expect(answerPortfolioFaq("What is Reggie's full name?")).toContain("John Reggie M. Barbacena");
    expect(answerPortfolioFaq("Who issued the certificates?")).toContain("Certiport");
    expect(answerPortfolioFaq("Tell me about the DevDays album")).toContain("11 photos");
    expect(answerPortfolioFaq("What are the home interest icons?")).toContain("Macbook M4");
    expect(answerPortfolioFaq("What social media can I follow?")).toContain("@jjstr.rgg");
    expect(answerPortfolioFaq("How was this website built?")).toContain("React 19");
    expect(answerPortfolioFaq("Does he know Java?")).toContain("Java");
    expect(answerPortfolioFaq("What can Zenith access?")).toContain("public portfolio content");
    expect(answerPortfolioFaq("What is his phone number?")).toContain("not published");
  });

  it("asks visitors to stop using profanity before matching other intents", () => {
    expect(getPortfolioFaqResponse("This is fucking bad")).toMatchObject({ intent: "profanity", offerHandoff: false });
    expect(answerPortfolioFaq("putang ina")).toContain("stop swearing");
  });
});
