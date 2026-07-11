(function () {
  const root = document.documentElement;
  const VISITED_KEY = "reggie-portfolio-visited";
  root.classList.add("preloader-pending");

  function navigationType() {
    const entry = performance.getEntriesByType("navigation")[0];
    if (entry) return entry.type;
    return performance.navigation && performance.navigation.type === 1 ? "reload" : "navigate";
  }

  function hasVisited() {
    try {
      return sessionStorage.getItem(VISITED_KEY) === "true";
    } catch {
      return false;
    }
  }

  function markVisited() {
    try {
      sessionStorage.setItem(VISITED_KEY, "true");
    } catch {
      // The preloader still works if storage is blocked.
    }
  }

  function revealPage() {
    root.classList.remove("preloader-pending");
    root.classList.add("preloader-complete");
    document.dispatchEvent(new CustomEvent("portfolio:entered"));
  }

  function mountGate() {
    const gate = document.createElement("div");
    gate.className = "site-preloader";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "preloader-title");
    gate.innerHTML = `
      <div class="site-preloader__panel">
        <div class="site-preloader__mark" aria-hidden="true">reggie<span>.</span></div>
        <h1 id="preloader-title">Welcome.</h1>
        <button class="site-preloader__enter" type="button">
          <span>Enter portfolio</span>
        </button>
      </div>
    `;
    document.body.append(gate);
    const enter = gate.querySelector(".site-preloader__enter");
    enter.focus();
    enter.addEventListener("click", () => {
      enter.disabled = true;
      markVisited();
      gate.classList.add("is-leaving");
      window.setTimeout(() => {
        gate.remove();
        revealPage();
      }, 520);
    });
  }

  function start() {
    const showGate = navigationType() === "reload" || !hasVisited();
    if (showGate) mountGate();
    else revealPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
