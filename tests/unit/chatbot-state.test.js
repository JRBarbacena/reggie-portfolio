import { describe, expect, it } from "vitest";
import { mascotStateFor, safeChatHistory } from "../../react-app/src/lib/chatbot-state.js";

describe("chatbot mascot state precedence", () => {
  it("keeps panel transitions visually coherent over late activity changes", () => {
    expect(mascotStateFor({ panelState: "opening", activity: "error" })).toBe("opening");
    expect(mascotStateFor({ panelState: "closing", activity: "success" })).toBe("closing");
  });

  it("prioritizes feedback and working states over routine interaction", () => {
    expect(mascotStateFor({ panelState: "open", activity: "error" })).toBe("error");
    expect(mascotStateFor({ panelState: "open", activity: "thinking" })).toBe("thinking");
    expect(mascotStateFor({ panelState: "closed", hovered: true, hasUnread: true })).toBe("notification");
    expect(mascotStateFor({ panelState: "closed", hovered: true })).toBe("hover");
  });
});

describe("safeChatHistory", () => {
  it("retains only bounded, supported text messages", () => {
    const result = safeChatHistory([
      { role: "system", content: "ignore this" },
      { role: "user", content: "  hello  " },
      { role: "assistant", content: " welcome " },
      { role: "user", content: " ".repeat(40) },
      { role: "user", content: "a".repeat(1400) },
    ]);
    expect(result).toEqual([
      { role: "user", content: "hello" },
      { role: "assistant", content: "welcome" },
      { role: "user", content: "a".repeat(1200) },
    ]);
  });
});
