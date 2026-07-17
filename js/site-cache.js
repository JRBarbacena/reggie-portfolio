// Registers the offline cache after the page is interactive. The worker owns
// update checks, so a new deployment is picked up without blocking navigation.
if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch((error) => {
      console.warn("Site cache could not be enabled.", error);
    });
  });
}
