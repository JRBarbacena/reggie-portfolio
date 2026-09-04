import { useEffect, useRef, useState } from "react";
import useChatbotController from "../hooks/useChatbotController.js";
import ChatbotMascot from "./ChatbotMascot.jsx";
import LiveChatPanel from "./LiveChatPanel.jsx";
import "./ChatbotWidget.css";

const QUICK_PROMPTS = [
  "What kind of work does Reggie build?",
  "Show me the best place to start.",
];

const ACTIVITY_LABELS = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  responding: "Replying",
  success: "Message sent",
  error: "Needs attention",
};

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

function SendIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 4 16 8-16 8 3-8-3-8Zm3 8h8" /></svg>;
}

export default function ChatbotWidget() {
  const launcherRef = useRef(null);
  const inputRef = useRef(null);
  const returnFocusRef = useRef(false);
  const [liveChatMode, setLiveChatMode] = useState(false);
  const {
    activity,
    beginListening,
    busy,
    closePanel,
    contactMode,
    contactStatus,
    draft,
    finishPanelTransition,
    hasUnread,
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
  } = useChatbotController();
  const panelVisible = panelState !== "closed";

  useEffect(() => {
    if (panelState === "open" && !contactMode) inputRef.current?.focus({ preventScroll: true });
    if (panelState === "closed" && returnFocusRef.current) {
      launcherRef.current?.focus({ preventScroll: true });
      returnFocusRef.current = false;
    }
  }, [contactMode, panelState]);

  useEffect(() => {
    if (!panelVisible) return undefined;
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      returnFocusRef.current = true;
      closePanel();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [closePanel, panelVisible]);

  const togglePanel = () => {
    if (panelVisible) {
      returnFocusRef.current = true;
      closePanel();
    } else {
      openPanel();
    }
  };

  const handlePanelAnimationEnd = (event) => {
    if (event.target !== event.currentTarget) return;
    if (["chatbot-panel-enter", "chatbot-panel-exit"].includes(event.animationName)) finishPanelTransition();
  };

  const handleChatSubmit = async (event) => {
    event.preventDefault();
    await sendChat();
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const sent = await sendContact(Object.fromEntries(new FormData(form)));
    if (sent) form.reset();
  };

  return (
    <aside className="chatbot-widget" data-panel-state={panelState} aria-label="Zenith portfolio assistant">
      {panelVisible && (
        <section
          id="portfolio-assistant"
          className="chatbot-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="chatbot-title"
          onAnimationEnd={handlePanelAnimationEnd}
        >
          <header className="chatbot-panel__header">
            <div>
              <p className="chatbot-panel__identity">
                <span>Zenith</span>
                <span className={`chatbot-panel__activity is-${activity}`} role="status">
                  {ACTIVITY_LABELS[activity] ?? "Ready"}
                </span>
              </p>
              <h2 id="chatbot-title">Ask about Reggie&apos;s work</h2>
            </div>
            <button type="button" className="chatbot-panel__close" onClick={() => { returnFocusRef.current = true; closePanel(); }} aria-label="Close portfolio assistant">
              <CloseIcon />
            </button>
          </header>

          {liveChatMode ? <LiveChatPanel onBack={() => setLiveChatMode(false)} /> : contactMode ? (
            <div className="chatbot-panel__contact">
              <div className="chatbot-panel__section-heading">
                <div><strong>Send Reggie a message</strong><span>It goes only to his private admin inbox.</span></div>
                <button type="button" onClick={showChat}>Back to chat</button>
              </div>
              <form className="chatbot-contact-form" onSubmit={handleContactSubmit}>
                <label className="chatbot-contact-form__honeypot" aria-hidden="true">Company website<input name="website" type="text" tabIndex="-1" autoComplete="off" /></label>
                <label>Name<input name="name" type="text" autoComplete="name" maxLength="120" required /></label>
                <label>Email<input name="email" type="email" autoComplete="email" maxLength="254" required /></label>
                <label>Reason<select name="topic" defaultValue="General inquiry"><option>General inquiry</option><option>Project collaboration</option><option>Coffee chat</option><option>Speaking or event</option><option>Other</option></select></label>
                <label>Message<textarea name="message" rows="4" maxLength="2000" minLength="10" required /></label>
                <label className="chatbot-contact-form__consent"><input name="consent" type="checkbox" required /> <span>I&apos;m happy for Reggie to use these details to reply to me.</span></label>
                <button type="submit" className="chatbot-panel__submit" disabled={busy}>{busy ? "Sending…" : "Send securely"}<SendIcon /></button>
              </form>
              {contactStatus && <p className={`chatbot-panel__status is-${contactStatus.type}`} role="status">{contactStatus.text}</p>}
              <a className="chatbot-panel__email" href="mailto:iggybarbacena@gmail.com">Prefer email? Write directly instead.</a>
            </div>
          ) : (
            <>
              <div className="chatbot-panel__messages" aria-live="polite" aria-relevant="additions text">
                {messages.map((message) => <article className={`chatbot-message chatbot-message--${message.role}`} key={message.id}><p>{message.content}</p></article>)}
                {activity === "thinking" && <div className="chatbot-thinking" aria-label="Assistant is thinking"><span /><span /><span /></div>}
              </div>
              <div className="chatbot-panel__composer">
                {requestError && <p className="chatbot-panel__status is-error" role="status">{requestError}</p>}
                <div className="chatbot-panel__quick-actions" aria-label="Suggested questions">
                  {QUICK_PROMPTS.map((prompt) => <button type="button" key={prompt} disabled={busy} onClick={() => sendChat(prompt)}>{prompt}</button>)}
                  <button type="button" onClick={() => setLiveChatMode(true)}>Chat with Reggie</button>
                  <button type="button" onClick={showContactForm}>Send Reggie a message</button>
                </div>
                <form className="chatbot-chat-form" onSubmit={handleChatSubmit}>
                  <label className="sr-only" htmlFor="portfolio-assistant-input">Ask about the portfolio</label>
                  <textarea
                    id="portfolio-assistant-input"
                    ref={inputRef}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value.slice(0, 1200))}
                    onFocus={beginListening}
                    onBlur={stopListening}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    rows="2"
                    maxLength="1200"
                    placeholder="Ask a question…"
                    disabled={busy}
                  />
                  <button type="submit" disabled={busy || !draft.trim()} aria-label="Send message"><SendIcon /></button>
                </form>
                <p className="chatbot-panel__privacy">Enter sends · Shift + Enter adds a line</p>
              </div>
            </>
          )}
        </section>
      )}

      <button
        ref={launcherRef}
        type="button"
        className="chatbot-launcher"
        data-mascot-state={mascotState}
        aria-label={panelVisible ? "Close Zenith" : "Open Zenith"}
        aria-controls="portfolio-assistant"
        aria-expanded={panelVisible}
        onClick={togglePanel}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
      >
        <ChatbotMascot state={mascotState} size={66} />
        {hasUnread && !panelVisible && <span className="chatbot-launcher__notice" aria-label="New assistant response" />}
      </button>
    </aside>
  );
}
