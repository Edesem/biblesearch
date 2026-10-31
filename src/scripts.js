// Theme toggle: dark by default, the device setting on first visit,
// then whatever the visitor last chose
(function () {
  const root = document.documentElement;
  const button = document.getElementById('theme-toggle');
  if (!button) return;

  function sync() {
    const next = root.classList.contains('dark') ? 'light' : 'dark';
    button.setAttribute('aria-label', 'Switch to ' + next + ' theme');
  }

  button.addEventListener('click', () => {
    const dark = root.classList.toggle('dark');
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch (e) { /* storage unavailable */ }
    sync();
  });

  sync();
})();
