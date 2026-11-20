const inPlugin = [...(location.ancestorOrigins || [])].some((origin) => origin.startsWith('chrome-extension://'));

if (inPlugin && !location.href.includes('login_success')) {
  chrome.storage.local.get('pluginReturn', (saved) => {
    const url = saved.pluginReturn || '';
    if (!url.includes('login_success')) return;
    chrome.storage.local.remove('pluginReturn');
    location.replace(url);
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.pluginReturn || location.href.includes('login_success')) return;
    const url = changes.pluginReturn.newValue || '';
    if (!url.includes('login_success')) return;
    chrome.storage.local.remove('pluginReturn');
    location.replace(url);
  });
}

if (inPlugin) {
  let sent = false;
  const ask = () => {
    if (sent) return;
    sent = true;
    chrome.runtime.sendMessage({ type: 'linkedin-login' });
  };
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data && event.data.source === 'profilereel-plugin' && event.data.type === 'linkedin') ask();
  });
  document.addEventListener('click', (event) => {
    const control = event.target.closest('button, a');
    if (!control || !/continue with linkedin/i.test(control.textContent || '')) return;
    event.preventDefault();
    event.stopPropagation();
    ask();
  }, true);
}
