// Inline script string — runs synchronously in <head> before first paint.
// Reads localStorage theme preference, defaults to 'dark', applies .dark class.
export const themeScript = `
(function() {
  var theme = localStorage.getItem('theme') || 'dark';
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
})();
`;
