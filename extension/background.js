let authWindowId = null;

function openLinkedIn() {
  const launch = () => chrome.windows.create({
    url: `https://www.linkedin.com/oauth/v2/authorization?${new URLSearchParams({
      response_type: 'code',
      client_id: '86l8y9yf175uqy',
      redirect_uri: 'http://localhost:3000/api/auth/linkedin/callback',
      scope: 'openid profile email',
      state: Math.random().toString(36).slice(2),
    }).toString()}`,
    type: 'popup',
    width: 480,
    height: 720,
    focused: true,
  }, (created) => {
    authWindowId = created && created.id;
  });
  if (!authWindowId) return launch();
  chrome.windows.get(authWindowId, (win) => {
    if (chrome.runtime.lastError || !win) {
      authWindowId = null;
      launch();
      return;
    }
    chrome.windows.update(authWindowId, { focused: true });
  });
}

function saveReturn(url) {
  if (!url || !url.includes('login_success') || url.includes('linkedin.com')) return;
  let user = '';
  try { user = new URL(url).searchParams.get('user') || ''; } catch (e) { user = ''; }
  chrome.storage.local.set(user ? { pluginReturn: url, pluginUser: user } : { pluginReturn: url });
  chrome.runtime.sendMessage({ type: 'show-dashboard', url }).catch(() => undefined);
}

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'plugin-return') {
    saveReturn(message.url);
    const windowId = sender.tab && sender.tab.windowId;
    if (!windowId) return;
    chrome.windows.get(windowId, (win) => {
      if (chrome.runtime.lastError || !win || win.type !== 'popup') return;
      if (authWindowId && windowId !== authWindowId) return;
      authWindowId = null;
      chrome.windows.remove(windowId);
    });
    return;
  }
  if (message.type === 'linkedin-login') return;
});

function pullDashboard(tabId, windowId) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const text = [...document.scripts].map((script) => script.textContent || '').join('\n');
      const marker = 'window.location.href = "';
      const start = text.indexOf(marker);
      if (start < 0) return '';
      const from = start + marker.length;
      return text.slice(from, text.indexOf('"', from));
    },
  }, (results) => {
    const url = results && results[0] && results[0].result;
    if (!url || !url.includes('login_success')) return;
    saveReturn(url);
    authWindowId = null;
    chrome.windows.remove(windowId);
  });
}

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  const url = info.url || (tab && tab.url) || '';
  if (!url.includes('login_success') || url.includes('linkedin.com')) return;
  saveReturn(url);
  if (!authWindowId || tab.windowId !== authWindowId) return;
  authWindowId = null;
  chrome.windows.remove(tab.windowId);
});

chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId !== 0) return;
  if (!details.url || !details.url.includes('/api/auth/linkedin/callback')) return;
  chrome.tabs.get(details.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;
    chrome.windows.get(tab.windowId, (win) => {
      if (chrome.runtime.lastError || !win || win.type !== 'popup') return;
      pullDashboard(details.tabId, tab.windowId);
    });
  });
});
