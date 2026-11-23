const gate = document.getElementById('gate');
const site = document.getElementById('site');
const loginForm = document.getElementById('login-form');
const createForm = document.getElementById('create-form');
const forgotForm = document.getElementById('forgot-form');
const websiteForm = document.getElementById('website-form');

function openDashboard(user) {
  const payload = typeof user === 'string' ? user : JSON.stringify(user);
  gate.style.display = 'none';
  site.src = 'http://localhost:5174/dashboard?login_success=true&user=' + encodeURIComponent(payload);
}

function showCard() {
  gate.style.display = 'flex';
  createForm.hidden = true;
  forgotForm.hidden = true;
  loginForm.hidden = false;
}

function showWebsite(url, purpose) {
  const meeting = purpose === 'meeting';
  const wait = document.getElementById('website-wait');
  gate.style.display = 'flex';
  loginForm.hidden = true;
  createForm.hidden = true;
  forgotForm.hidden = true;
  websiteForm.hidden = false;
  wait.hidden = true;
  document.getElementById('website-title').textContent = meeting ? 'Join the meeting on our website' : 'Take the test on our website';
  document.getElementById('website-copy').textContent = 'Continue with our website.';
  document.getElementById('website-link').textContent = url;
  window.setTimeout(() => {
    wait.hidden = false;
    window.setTimeout(() => chrome.tabs.create({ url }), 900);
  }, 1200);
}

window.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'PROFILEREEL_PLUGIN_WEBSITE') {
    showWebsite(event.data.url || 'http://localhost:5174/dashboard', event.data.purpose);
    return;
  }
  if (event.data.type !== 'PROFILEREEL_PLUGIN_SIGNIN') return;
  showCard();
});

document.getElementById('website-back').addEventListener('click', () => {
  websiteForm.hidden = true;
  gate.style.display = 'none';
});

chrome.cookies.get({ url: 'http://localhost:5174/', name: 'profilereel_plugin' }, (cookie) => {
  if (!cookie || !cookie.value) return;
  try {
    const user = JSON.parse(decodeURIComponent(cookie.value));
    site.src = 'http://localhost:5174/?login_success=true&user=' + encodeURIComponent(JSON.stringify(user));
  } catch (e) { /* landing stays */ }
});

document.getElementById('show-create').addEventListener('click', () => {
  loginForm.hidden = true;
  forgotForm.hidden = true;
  createForm.hidden = false;
});
document.getElementById('show-login').addEventListener('click', () => {
  createForm.hidden = true;
  forgotForm.hidden = true;
  loginForm.hidden = false;
});
document.getElementById('show-forgot').addEventListener('click', () => {
  loginForm.hidden = true;
  createForm.hidden = true;
  forgotForm.hidden = false;
  document.getElementById('forgot-email').value = document.getElementById('email').value;
});
document.getElementById('forgot-back').addEventListener('click', () => {
  forgotForm.hidden = true;
  loginForm.hidden = false;
});

async function post(path, body) {
  const response = await fetch('http://localhost:3000' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
  if (!response.ok) throw new Error(message || 'Could not sign in');
  return data;
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const error = document.getElementById('error');
  error.textContent = '';
  try {
    const data = await post('/api/auth/login', {
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
    });
    openDashboard(data.user);
  } catch (err) {
    error.textContent = err.message;
  }
});

forgotForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const error = document.getElementById('forgot-error');
  const ok = document.getElementById('forgot-ok');
  error.textContent = '';
  ok.textContent = '';
  try {
    await post('/api/auth/forgot-password', {
      email: document.getElementById('forgot-email').value.trim(),
    });
    ok.textContent = 'Reset link sent. Check your email.';
  } catch (err) {
    error.textContent = err.message;
  }
});

createForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const error = document.getElementById('create-error');
  error.textContent = '';
  try {
    const data = await post('/api/auth/plugin-account', {
      email: document.getElementById('create-email').value.trim(),
      password: document.getElementById('create-password').value,
      linkedinUrl: document.getElementById('linkedin').value.trim(),
    });
    openDashboard(data.user);
  } catch (err) {
    error.textContent = err.message;
  }
});
