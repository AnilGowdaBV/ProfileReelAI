const text = [...document.scripts].map((script) => script.textContent || '').join('\n');
const marker = 'window.location.href = "';
const start = text.indexOf(marker);
if (start >= 0) {
  const from = start + marker.length;
  const url = text.slice(from, text.indexOf('"', from));
  if (url.includes('login_success')) chrome.runtime.sendMessage({ type: 'plugin-return', url });
}
