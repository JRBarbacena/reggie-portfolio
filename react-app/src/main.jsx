import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "../../css/main.css";
import "./styles.css";

const STALE_DEPLOYMENT_RELOAD_KEY = "reggie-portfolio-stale-deployment-reload";

function recoverFromStaleDeployment() {
  try {
    const previousAttempt = Number(sessionStorage.getItem(STALE_DEPLOYMENT_RELOAD_KEY));
    if (Date.now() - previousAttempt < 15_000) return;
    sessionStorage.setItem(STALE_DEPLOYMENT_RELOAD_KEY, String(Date.now()));
    window.location.reload();
  } catch {
    // The normal browser reload path remains available if storage is blocked.
  }
}

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  recoverFromStaleDeployment();
});

window.addEventListener("unhandledrejection", (event) => {
  const message = String(event.reason?.message ?? event.reason ?? "");
  if (/dynamically imported module|importing a module script|chunk load/i.test(message)) {
    recoverFromStaleDeployment();
  }
});

// Prevent below-the-fold home content from flashing before the entry overlay
// has mounted during a hard refresh.
if (window.location.pathname === "/") {
  document.documentElement.classList.add("home-entry-pending");
  window.setTimeout(() => document.documentElement.classList.remove("home-entry-pending"), 8_000);
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const register = () => navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // The portfolio remains fully usable when registration is unavailable.
      });
    if ("requestIdleCallback" in window) window.requestIdleCallback(register, { timeout: 3000 });
    else window.setTimeout(register, 1200);
  });
}
