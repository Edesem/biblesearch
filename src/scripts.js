// Theme toggle: dark by default, light on request, remembered per browser
(function () {
  const root = document.documentElement;
  const button = document.getElementById('theme-toggle');
  if (!button) return;

  function sync() {
    button.setAttribute('aria-pressed', String(root.classList.contains('dark')));
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
