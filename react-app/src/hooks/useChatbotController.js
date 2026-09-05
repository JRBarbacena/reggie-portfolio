import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mascotStateFor, safeChatHistory } from "../lib/chatbot-state.js";
import { getPortfolioFaqResponse } from "../lib/portfolio-faq.js";

const WELCOME_MESSAGE = {
  id: "zenith-welcome",
  role: "assistant",
  content: "Hi, I’m Zenith. Say hello to begin.",
};

const CONTACT_TOPICS = new Set(["General inquiry", "Project collaboration", "Coffee chat", "Speaking or event", "Other"]);
const FEEDBACK_TIMEOUTS = { responding: 1400, success: 1800, error: 2000 };

function createMessage(role, content) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  };
}

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() => (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ));

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

async function jsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function contactValidation({ name, email, message, consent }) {
  if (name.length < 2) return "Please enter your name.";
  if (!/^\S+@\S+\.\S+$/.test(email)) return "Please enter a valid email address.";
  if (message.length < 10) return "Please write at least a short message before sending.";
  if (!consent) return "Please confirm that Reggie may use your details to reply.";
  return "";
}

/**
 * The only place that owns the chat lifecycle. UI components can ask this
 * hook to open, send, or close; they never need to decide mascot states.
 */
export default function useChatbotController() {
  const reducedMotion = useReducedMotion();
  const [panelState, setPanelState] = useState("closed");
  const [activity, setActivity] = useState("idle");
  const [hovered, setHovered] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [messages, setMessages] = useState(() => [WELCOME_MESSAGE]);
  const [draft, setDraft] = useState("");
  const [contactMode, setContactMode] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [contactStatus, setContactStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [handoffSuggested, setHandoffSuggested] = useState(false);

  const panelStateRef = useRef(panelState);
  const activityRef = useRef(activity);
  const requestInFlightRef = useRef(false);

  const updatePanelState = useCallback((nextState) => {
    panelStateRef.current = nextState;
    setPanelState(nextState);
  }, []);

  const updateActivity = useCallback((nextActivity) => {
    activityRef.current = nextActivity;
    setActivity(nextActivity);
  }, []);

  useEffect(() => {
    panelStateRef.current = panelState;
  }, [panelState]);

  useEffect(() => {
    activityRef.current = activity;
  }, [activity]);

  useEffect(() => {
    if (!reducedMotion || !["opening", "closing"].includes(panelState)) return undefined;
    const timer = window.setTimeout(() => {
      updatePanelState(panelState === "opening" ? "open" : "closed");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [panelState, reducedMotion, updatePanelState]);

  useEffect(() => {
    if (!FEEDBACK_TIMEOUTS[activity]) return undefined;
    const timer = window.setTimeout(() => {
      if (activityRef.current === activity) updateActivity("idle");
    }, reducedMotion ? 0 : FEEDBACK_TIMEOUTS[activity]);
    return () => window.clearTimeout(timer);
  }, [activity, reducedMotion, updateActivity]);

  const openPanel = useCallback(() => {
    if (["open", "opening"].includes(panelStateRef.current)) return;
    setHovered(false);
    setHasUnread(false);
    setRequestError("");
    updateActivity("idle");
    updatePanelState(reducedMotion ? "open" : "opening");
  }, [reducedMotion, updateActivity, updatePanelState]);

  const closePanel = useCallback(() => {
    if (["closed", "closing"].includes(panelStateRef.current)) return;
    setHovered(false);
    updateActivity("idle");
    updatePanelState(reducedMotion ? "closed" : "closing");
  }, [reducedMotion, updateActivity, updatePanelState]);

  const finishPanelTransition = useCallback(() => {
    if (panelStateRef.current === "opening") updatePanelState("open");
    if (panelStateRef.current === "closing") updatePanelState("closed");
  }, [updatePanelState]);

  const beginListening = useCallback(() => {
    if (!requestInFlightRef.current && panelStateRef.current !== "closed") updateActivity("listening");
  }, [updateActivity]);

  const stopListening = useCallback(() => {
    if (activityRef.current === "listening") updateActivity("idle");
  }, [updateActivity]);

  const sendChat = useCallback(async (message = draft) => {
    const content = String(message ?? "").trim().slice(0, 1200);
    if (!content || requestInFlightRef.current) return false;

    const userMessage = createMessage("user", content);
    requestInFlightRef.current = true;
    setBusy(true);
    setDraft("");
    setRequestError("");
    updateActivity("thinking");
    setMessages((current) => [...current, userMessage]);

    try {
      if (!reducedMotion) await new Promise((resolve) => window.setTimeout(resolve, 420));
      const response = getPortfolioFaqResponse(content);
      setHandoffSuggested(response.offerHandoff);
      setMessages((current) => [...current, createMessage("assistant", response.answer)]);
      if (["closed", "closing"].includes(panelStateRef.current)) {
        setHasUnread(true);
        updateActivity("idle");
      } else {
        updateActivity("responding");
      }
      return true;
    } catch (error) {
      setRequestError(error.message || "Zenith could not answer that question right now.");
      if (["closed", "closing"].includes(panelStateRef.current)) {
        setHasUnread(true);
        updateActivity("idle");
      } else {
        updateActivity("error");
      }
      return false;
    } finally {
      requestInFlightRef.current = false;
      setBusy(false);
    }
  }, [draft, reducedMotion, updateActivity]);

  const showContactForm = useCallback(() => {
    setContactMode(true);
    setRequestError("");
    setContactStatus(null);
    if (activityRef.current === "listening") updateActivity("idle");
  }, [updateActivity]);

  const showChat = useCallback(() => {
    setContactMode(false);
    setContactStatus(null);
  }, []);

  const sendContact = useCallback(async (formValues) => {
    if (requestInFlightRef.current) return false;
    const contact = {
      name: String(formValues.name ?? "").trim().slice(0, 120),
      email: String(formValues.email ?? "").trim().toLowerCase().slice(0, 254),
      topic: CONTACT_TOPICS.has(formValues.topic) ? formValues.topic : "General inquiry",
      message: String(formValues.message ?? "").trim().slice(0, 2000),
      consent: formValues.consent === "on" || formValues.consent === true,
    };
    const validationMessage = contactValidation(contact);
    if (validationMessage) {
      setContactStatus({ type: "error", text: validationMessage });
      updateActivity("error");
      return false;
    }

    requestInFlightRef.current = true;
    setBusy(true);
    setContactStatus(null);
    updateActivity("thinking");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contact,
          transcript: safeChatHistory(messages, 6),
        }),
      });
      const result = await jsonResponse(response);
      if (!response.ok) throw new Error(result.message || "Your message could not be sent right now.");
      setContactStatus({ type: "success", text: "Your message is on its way. Reggie will reply by email." });
      updateActivity("success");
      return true;
    } catch (error) {
      const localPreview = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      setContactStatus({
        type: "error",
        text: localPreview
          ? "The secure inbox runs after deployment. Use the email link below from this local preview."
          : (error.message || "Your message could not be sent right now."),
      });
      updateActivity("error");
      return false;
    } finally {
      requestInFlightRef.current = false;
      setBusy(false);
    }
  }, [messages, updateActivity]);

  const mascotState = useMemo(() => mascotStateFor({ panelState, activity, hovered, hasUnread }), [activity, hasUnread, hovered, panelState]);

  return {
    activity,
    beginListening,
    busy,
    closePanel,
    contactMode,
    contactStatus,
    draft,
    finishPanelTransition,
    hasUnread,
    handoffSuggested,
    mascotState,
    messages,
    openPanel,
    panelState,
    requestError,
    sendChat,
    sendContact,
    setDraft,
    setHovered,
    showChat,
    showContactForm,
    stopListening,
  };
}
