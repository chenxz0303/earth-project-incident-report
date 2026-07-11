(() => {
  const storageKey = "earth-project-theme";
  const root = document.documentElement;
  const saved = localStorage.getItem(storageKey);
  const preferredDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = saved || (preferredDark ? "dark" : "light");

  const updateButtons = () => {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const dark = root.dataset.theme === "dark";
      button.textContent = dark ? "日间" : "夜间";
      button.setAttribute("aria-pressed", String(dark));
    });
  };

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme-toggle]");
    if (!button) return;
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(storageKey, root.dataset.theme);
    updateButtons();
  });

  updateButtons();
})();
