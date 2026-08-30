// Register the offline worker after load and expose its waiting lifecycle with
// a small, accessible refresh action. First installs remain silent.

if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        type: "module",
        updateViaCache: "none",
      });

      let refreshRequested = false;
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshRequested || refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      const showUpdate = (worker) => {
        if (!worker || document.querySelector(".site-update")) return;

        const notice = document.createElement("aside");
        notice.className = "site-update";
        notice.setAttribute("role", "status");
        notice.setAttribute("aria-live", "polite");
        notice.innerHTML = `
          <p><strong>New version available</strong><span>Refresh to use the latest portfolio.</span></p>
          <div>
            <button class="btn btn-primary" type="button" data-site-update>Refresh</button>
            <button class="site-update__dismiss" type="button" data-site-update-dismiss aria-label="Dismiss update notice">Later</button>
          </div>
        `;

        notice.querySelector("[data-site-update]").addEventListener("click", () => {
          refreshRequested = true;
          worker.postMessage({ type: "PORTFOLIO_ACTIVATE" });
        });
        notice.querySelector("[data-site-update-dismiss]").addEventListener("click", () => {
          notice.remove();
        });
        document.body.append(notice);
      };

      if (registration.waiting && navigator.serviceWorker.controller) {
        showUpdate(registration.waiting);
      }

      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            showUpdate(worker);
          }
        });
      });
    } catch (error) {
      console.warn("Site cache could not be enabled.", error);
    }
  }, { once: true });
}
