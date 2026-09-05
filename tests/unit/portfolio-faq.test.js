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

  it("asks visitors to stop using profanity before matching other intents", () => {
    expect(getPortfolioFaqResponse("This is fucking bad")).toMatchObject({ intent: "profanity", offerHandoff: false });
    expect(answerPortfolioFaq("putang ina")).toContain("stop swearing");
  });
});
