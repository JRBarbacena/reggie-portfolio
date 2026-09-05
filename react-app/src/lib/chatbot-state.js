export const CHATBOT_PANEL_STATES = Object.freeze(["closed", "opening", "open", "closing"]);
export const CHATBOT_ACTIVITY_STATES = Object.freeze(["idle", "listening", "thinking", "responding", "success", "error"]);

/**
 * Keeps visual precedence in one place. A panel transition should never be
 * visually interrupted by a late network result, and feedback always outranks
 * routine interaction states.
 */
export function mascotStateFor({ panelState = "closed", activity = "idle", hovered = false, hasUnread = false } = {}) {
  if (panelState === "closing") return "closing";
  if (panelState === "opening") return "opening";
  if (activity === "error") return "error";
  if (activity === "success") return "success";
  if (activity === "thinking") return "thinking";
  if (activity === "responding") return "responding";
  if (activity === "listening") return "listening";
  if (panelState === "open") return "open";
  if (hasUnread) return "notification";
  if (hovered) return "hover";
  return "idle";
}

export function safeChatHistory(messages, limit = 8) {
  return (Array.isArray(messages) ? messages : [])
    .filter((message) => ["user", "assistant"].includes(message?.role) && typeof message?.content === "string")
    .slice(-limit)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, 1200),
    }))
    .filter((message) => message.content.length > 0);
}

export function isValidPanelState(state) {
  return CHATBOT_PANEL_STATES.includes(state);
}
