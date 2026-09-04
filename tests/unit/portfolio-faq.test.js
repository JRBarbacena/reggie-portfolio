import { describe, expect, it } from "vitest";
import { answerPortfolioFaq } from "../../react-app/src/lib/portfolio-faq.js";

describe("Zenith FAQ", () => {
  it("routes known questions to portfolio content", () => {
    expect(answerPortfolioFaq("Where is your tech stack?")).toContain("Tech page");
    expect(answerPortfolioFaq("Can I see travel journals?")).toContain("Travel page");
  });

  it("offers a useful bounded fallback", () => {
    expect(answerPortfolioFaq("Tell me something unknown")).toContain("Tech, Travel, and Life");
  });
});
