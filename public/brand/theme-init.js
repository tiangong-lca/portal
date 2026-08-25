(() => {
  const storageKey = "tiangong.portal.theme.v1";
  const root = document.documentElement;
  let preference = "system";

  try {
    const stored = localStorage.getItem(storageKey);

    if (stored === "light" || stored === "dark" || stored === "system") {
      preference = stored;
    }
  } catch {
    preference = "system";
  }

  const dark =
    preference === "dark" ||
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  root.classList.toggle("dark", dark);
  root.dataset.theme = preference;
})();
