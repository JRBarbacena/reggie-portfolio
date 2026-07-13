(function () {
  const root = document.documentElement;
  const VISITED_KEY = "reggie-portfolio-visited";
  const AUTO_ENTER_DELAY = 2600;
  root.classList.add("preloader-pending");

  function hasVisited() {
    try {
      return localStorage.getItem(VISITED_KEY) === "true";
    } catch {
      try {
        return sessionStorage.getItem(VISITED_KEY) === "true";
      } catch {
        return false;
      }
    }
  }

  function markVisited() {
    try {
      localStorage.setItem(VISITED_KEY, "true");
    } catch {
      try {
        sessionStorage.setItem(VISITED_KEY, "true");
      } catch {
        // The preloader still works if storage is blocked.
      }
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
      markVisited();
      gate.classList.add("is-leaving");
      window.setTimeout(() => {
        gate.remove();
        revealPage(true);
      }, 520);
    };
    enter.addEventListener("click", enterPortfolio);
    window.setTimeout(enterPortfolio, AUTO_ENTER_DELAY);
  }

  function start() {
    const showGate = !hasVisited();
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
