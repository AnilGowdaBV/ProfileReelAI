const gate = document.getElementById('gate');
const site = document.getElementById('site');
const loginForm = document.getElementById('login-form');
const createForm = document.getElementById('create-form');

function openDashboard(user) {
  const payload = typeof user === 'string' ? user : JSON.stringify(user);
  gate.style.display = 'none';
  site.src = 'http://localhost:5174/dashboard?login_success=true&user=' + encodeURIComponent(payload);
}

function showCard() {
  gate.style.display = 'flex';
  createForm.hidden = true;
  loginForm.hidden = false;
}

window.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'PROFILEREEL_PLUGIN_SIGNIN') return;
  showCard();
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
  createForm.hidden = false;
});
document.getElementById('show-login').addEventListener('click', () => {
  createForm.hidden = true;
  loginForm.hidden = false;
});

async function post(path, body) {
  const response = await fetch('http://localhost:3000' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Could not sign in');
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
