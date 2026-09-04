import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "../../css/main.css";
import "./styles.css";

// Prevent below-the-fold home content from flashing before the entry overlay
// has mounted during a hard refresh.
if (window.location.pathname === "/") {
  document.documentElement.classList.add("home-entry-pending");
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
