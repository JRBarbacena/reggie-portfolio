(function () {
  const root = document.documentElement;
  const SESSION_KEY = "reggie-portfolio-session-started";
  const EXIT_DURATION = 780;
  root.classList.add("preloader-pending");

  function navigationType() {
    try {
      return performance.getEntriesByType("navigation")[0]?.type || "navigate";
    } catch {
      return "navigate";
    }
  }

  function shouldShowGate() {
    const isRefresh = navigationType() === "reload";
    try {
      const isFirstPage = sessionStorage.getItem(SESSION_KEY) !== "true";
      sessionStorage.setItem(SESSION_KEY, "true");
      return isRefresh || isFirstPage;
    } catch {
      // A refresh can still be detected when browser storage is blocked.
      return isRefresh;
    }
  }

  function revealPage(enteredThroughGate = false) {
    root.classList.remove("preloader-pending");
    root.classList.add("preloader-complete");
    if (enteredThroughGate) root.classList.add("preloader-entered");
    document.dispatchEvent(new CustomEvent("portfolio:entered"));
  }

  function replayHomeEntrance() {
    if (!document.body || !document.body.classList.contains("home")) return;
    root.classList.remove("preloader-complete");
    window.requestAnimationFrame(() => {
      root.classList.add("preloader-complete");
      document.dispatchEvent(new CustomEvent("portfolio:entered"));
    });
  }

  function mountGate() {
    const gate = document.createElement("div");
    gate.className = "site-preloader";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "preloader-title");
    gate.innerHTML = `
      <div class="site-preloader__panel">
        <div class="site-preloader__mark" aria-hidden="true">
          <img src="/assets/images/brand/rb-monogram.png" alt="" width="80" height="80" />
        </div>
        <h1 id="preloader-title">Welcome</h1>
        <button class="site-preloader__enter" type="button">
          <span>Enter portfolio</span>
        </button>
      </div>
    `;
    document.body.append(gate);
    const enter = gate.querySelector(".site-preloader__enter");
    const enterPortfolio = () => {
      if (!gate.isConnected || enter.disabled) return;
      enter.disabled = true;
      gate.classList.add("is-leaving");
      window.setTimeout(() => {
        gate.remove();
        revealPage(true);
      }, EXIT_DURATION);
    };
    enter.addEventListener("click", enterPortfolio);
  }

  function start() {
    // Show on the first page and every real refresh. Internal links and the
    // back-forward cache keep the current page state without replaying it.
    const showGate = shouldShowGate();
    if (showGate) mountGate();
    else revealPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) replayHomeEntrance();
  });
})();
