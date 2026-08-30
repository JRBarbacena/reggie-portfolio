// Accessible Home-entry gate. It appears on the first direct Home visit in a
// tab and on a real reload, then exits only when the visitor chooses Enter.

export const ENTRY_STATUS_KEY = "reggie-portfolio-home-entry-seen";
export const PRELOADER_EXIT_MS = 300;

function dispatchPortfolioEntered(win, doc) {
  let event;
  if (typeof win.CustomEvent === "function") {
    event = new win.CustomEvent("portfolio:entered");
  } else {
    event = doc.createEvent("Event");
    event.initEvent("portfolio:entered", false, false);
  }
  doc.dispatchEvent(event);
}

export function navigationType(performanceApi) {
  try {
    const type = performanceApi?.getEntriesByType?.("navigation")?.[0]?.type;
    if (type) return type;
    const legacyType = performanceApi?.navigation?.type;
    if (legacyType === 0) return "navigate";
    if (legacyType === 1) return "reload";
    if (legacyType === 2) return "back_forward";
  } catch {
    // Unknown lifecycle values fail closed below.
  }
  return "unknown";
}

export function isInternalReferrer(referrer, origin) {
  if (!referrer) return false;
  try {
    return new URL(referrer).origin === origin;
  } catch {
    return true;
  }
}

export function claimDirectHomeEntry({
  pathname,
  type,
  referrer,
  origin,
  reducedMotion,
  saveData,
  storage,
}) {
  if (pathname !== "/" && pathname !== "/index.html") return false;
  if (reducedMotion || saveData) return false;
  if (type === "reload") return true;
  if (type !== "navigate" || isInternalReferrer(referrer, origin)) return false;

  try {
    if (storage.getItem(ENTRY_STATUS_KEY) !== null) return false;
    storage.setItem(ENTRY_STATUS_KEY, "true");
    return true;
  } catch {
    return false;
  }
}

export function startEntryStatus(win = window, doc = document) {
  let media;
  let connection;
  let storage;
  try {
    media = win.matchMedia("(prefers-reduced-motion: reduce)");
    connection = win.navigator?.connection;
    storage = win.sessionStorage;
  } catch {
    return null;
  }

  const eligible = claimDirectHomeEntry({
    pathname: win.location.pathname,
    type: navigationType(win.performance),
    referrer: doc.referrer,
    origin: win.location.origin,
    reducedMotion: media.matches,
    saveData: connection?.saveData === true,
    storage,
  });
  if (!eligible || !doc.body) return null;

  const gate = doc.createElement("div");
  gate.className = "site-preloader";
  gate.setAttribute("role", "dialog");
  gate.setAttribute("aria-modal", "true");
  gate.setAttribute("aria-labelledby", "preloader-title");
  gate.innerHTML = `
    <div class="site-preloader__panel">
      <div class="site-preloader__mark" aria-hidden="true">
        <img src="/assets/images/brand/rb-monogram.png" alt="" width="80" height="80">
      </div>
      <p class="site-preloader__title" id="preloader-title">Welcome</p>
      <button class="site-preloader__enter" type="button">Enter portfolio</button>
    </div>
  `;

  const background = [...doc.body.children];
  const enter = gate.querySelector(".site-preloader__enter");
  let exitTimer = 0;
  let finished = false;
  let leaving = false;

  const setBackgroundInert = (inert) => {
    for (const element of background) element.toggleAttribute("inert", inert);
  };

  const onPageShow = (event) => {
    if (event.persisted) finish();
  };
  const onPreferenceChange = () => {
    if (media.matches || connection?.saveData === true) finish();
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    win.clearTimeout(exitTimer);
    gate.remove();
    setBackgroundInert(false);
    doc.documentElement.classList.add("portfolio-entered");
    dispatchPortfolioEntered(win, doc);
    win.removeEventListener("pagehide", finish);
    win.removeEventListener("pageshow", onPageShow);
    media.removeEventListener?.("change", onPreferenceChange);
    connection?.removeEventListener?.("change", onPreferenceChange);
    const main = doc.querySelector("main");
    if (main) {
      const hadTabIndex = main.hasAttribute("tabindex");
      if (!hadTabIndex) main.setAttribute("tabindex", "-1");
      main.focus?.({ preventScroll: true });
      if (!hadTabIndex) {
        main.addEventListener("blur", () => main.removeAttribute("tabindex"), { once: true });
      }
    }
  };
  const enterPortfolio = () => {
    if (leaving || finished) return;
    leaving = true;
    enter.disabled = true;
    gate.classList.add("is-leaving");
    exitTimer = win.setTimeout(finish, PRELOADER_EXIT_MS);
  };

  enter.addEventListener("click", enterPortfolio);
  gate.addEventListener("transitionend", (event) => {
    if (leaving && event.target === gate && event.propertyName === "opacity") finish();
  });
  win.addEventListener("pagehide", finish, { once: true });
  win.addEventListener("pageshow", onPageShow);
  media.addEventListener?.("change", onPreferenceChange);
  connection?.addEventListener?.("change", onPreferenceChange);

  try {
    setBackgroundInert(true);
    doc.body.append(gate);
    win.requestAnimationFrame?.(() => enter.focus());
  } catch {
    finish();
    return null;
  }

  return { element: gate, enter: enterPortfolio, finish };
}

export function bootEntryStatus(win = window, doc = document) {
  let controller = null;
  const start = () => {
    if (controller) return;
    controller = startEntryStatus(win, doc);
    if (!controller) {
      doc.documentElement.classList.add("portfolio-entered");
      dispatchPortfolioEntered(win, doc);
    }
  };
  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
  return () => controller?.finish();
}

if (typeof document !== "undefined" && document.querySelector("script[data-entry-status]")) {
  bootEntryStatus();
}
