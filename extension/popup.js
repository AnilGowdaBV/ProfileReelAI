const DEFAULT_API_URL = 'https://profilereel-ai-backend.onrender.com/api';

// DOM Elements
const inputProfileUrl = document.getElementById('input-profile-url');
const btnScoreCandidate = document.getElementById('btn-score-candidate');
const tabDetectedBadge = document.getElementById('tab-detected-badge');
const btnToggleSettings = document.getElementById('btn-toggle-settings');
const settingsPanel = document.getElementById('settings-panel');
const inputApiUrl = document.getElementById('input-api-url');
const btnSaveSettings = document.getElementById('btn-save-settings');
const btnTestConnection = document.getElementById('btn-test-connection');
const settingsFeedback = document.getElementById('settings-feedback');
const backendStatusDot = document.getElementById('backend-status-dot');

const loadingState = document.getElementById('loading-state');
const loadingTitle = document.getElementById('loading-title');
const loadingDesc = document.getElementById('loading-desc');
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const step3 = document.getElementById('step-3');

const errorState = document.getElementById('error-state');
const errorTitle = document.getElementById('error-title');
const errorMessage = document.getElementById('error-message');
const btnRetry = document.getElementById('btn-retry');

const resultsCard = document.getElementById('results-card');
const resAvatar = document.getElementById('res-avatar');
const resName = document.getElementById('res-name');
const resHeadline = document.getElementById('res-headline');
const resOverallScore = document.getElementById('res-overall-score');
const resTierBadge = document.getElementById('res-tier-badge');
const valExperience = document.getElementById('val-experience');
const barExperience = document.getElementById('bar-experience');
const valSkills = document.getElementById('val-skills');
const barSkills = document.getElementById('bar-skills');
const valEducation = document.getElementById('val-education');
const barEducation = document.getElementById('bar-education');
const valImpact = document.getElementById('val-impact');
const barImpact = document.getElementById('bar-impact');
const resStrengths = document.getElementById('res-strengths');
const resGrowth = document.getElementById('res-growth');
const resRoles = document.getElementById('res-roles');
const btnCopySummary = document.getElementById('btn-copy-summary');
const copyBtnText = document.getElementById('copy-btn-text');
const btnRefreshScore = document.getElementById('btn-refresh-score');
const idleGuide = document.getElementById('idle-guide');

let currentCandidateData = null;
let currentScoreData = null;

// Helpers
async function getApiBase() {
  const { apiUrl } = await chrome.storage.local.get('apiUrl');
  return (apiUrl || DEFAULT_API_URL).replace(/\/$/, '');
}

function normalizeLinkedInUrl(url) {
  if (!url) return '';
  return url.split('?')[0].split('#')[0].trim();
}

function isLinkedInProfileUrl(url) {
  return /https?:\/\/(www\.)?linkedin\.com\/in\/[\w\-\_]+/i.test(url);
}

// Initialize on popup open
document.addEventListener('DOMContentLoaded', async () => {
  const apiBase = await getApiBase();
  inputApiUrl.value = apiBase;

  // Check backend health
  checkBackendHealth(apiBase);

  // Detect active tab URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url && isLinkedInProfileUrl(tab.url)) {
    const cleanUrl = normalizeLinkedInUrl(tab.url);
    inputProfileUrl.value = cleanUrl;
    tabDetectedBadge.innerHTML = '<span class="pulse-dot"></span> LinkedIn Profile Detected';
    tabDetectedBadge.classList.remove('hidden');

    // Check if score is cached in local storage
    const cacheKey = `score_${cleanUrl}`;
    const cached = await chrome.storage.local.get(cacheKey);
    if (cached[cacheKey]) {
      displayResults(cached[cacheKey].candidate, cached[cacheKey].score);
    }
  } else {
    tabDetectedBadge.innerHTML = '<span>🌐</span> Manual Input Mode';
  }
});

// Check backend health
async function checkBackendHealth(apiBase) {
  try {
    const res = await fetch(`${apiBase}/health`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      backendStatusDot.classList.add('connected');
      backendStatusDot.title = 'Backend Connected';
    } else {
      backendStatusDot.classList.remove('connected');
      backendStatusDot.title = 'Backend Unreachable';
    }
  } catch (e) {
    backendStatusDot.classList.remove('connected');
    backendStatusDot.title = 'Backend Offline';
  }
}

// Toggle Settings
btnToggleSettings.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});

// Save Settings
btnSaveSettings.addEventListener('click', async () => {
  const newUrl = inputApiUrl.value.trim() || DEFAULT_API_URL;
  await chrome.storage.local.set({ apiUrl: newUrl });
  settingsFeedback.style.color = '#34d399';
  settingsFeedback.textContent = 'Saved!';
  checkBackendHealth(newUrl);
  setTimeout(() => {
    settingsFeedback.textContent = '';
    settingsPanel.classList.add('hidden');
  }, 1000);
});

// Test Connection
btnTestConnection.addEventListener('click', async () => {
  settingsFeedback.style.color = '#38bdf8';
  settingsFeedback.textContent = 'Testing connection...';
  try {
    const res = await fetch(`${inputApiUrl.value.trim()}/health`);
    const data = await res.json();
    if (data.status === 'ok') {
      settingsFeedback.style.color = '#34d399';
      settingsFeedback.textContent = `Connected! Provider: ${data.database?.provider || 'PostgreSQL'}`;
      backendStatusDot.classList.add('connected');
    } else {
      settingsFeedback.style.color = '#f87171';
      settingsFeedback.textContent = 'Server responded with error.';
    }
  } catch (err) {
    settingsFeedback.style.color = '#f87171';
    settingsFeedback.textContent = `Failed: ${err.message}`;
  }
});

// Score Candidate Button Click
btnScoreCandidate.addEventListener('click', () => {
  const url = inputProfileUrl.value.trim();
  if (!url) {
    showError('Missing URL', 'Please enter a LinkedIn profile URL.');
    return;
  }
  if (!isLinkedInProfileUrl(url)) {
    showError('Invalid URL', 'Please enter a valid LinkedIn profile URL (e.g. https://www.linkedin.com/in/username).');
    return;
  }
  scoreCandidate(url);
});

btnRetry.addEventListener('click', () => {
  const url = inputProfileUrl.value.trim();
  if (url) scoreCandidate(url);
});

btnRefreshScore.addEventListener('click', () => {
  const url = inputProfileUrl.value.trim();
  if (url) scoreCandidate(url, true);
});

// Main Scoring Flow
async function scoreCandidate(profileUrl, forceRefresh = false) {
  const cleanUrl = normalizeLinkedInUrl(profileUrl);
  const cacheKey = `score_${cleanUrl}`;

  if (!forceRefresh) {
    const cached = await chrome.storage.local.get(cacheKey);
    if (cached[cacheKey]) {
      displayResults(cached[cacheKey].candidate, cached[cacheKey].score);
      return;
    }
  }

  showLoading();
  const apiBase = await getApiBase();

  try {
    // Step 1: Submit Profile
    setStep(1, 'Submitting profile for verification & ingestion...');
    const submitRes = await fetch(`${apiBase}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileUrl: cleanUrl }),
    });

    if (!submitRes.ok) {
      const err = await submitRes.json().catch(() => ({}));
      throw new Error(err.message || `Submission failed (HTTP ${submitRes.status})`);
    }

    const { candidateId, jobId } = await submitRes.json();

    // Step 2: Poll Scraper Job
    setStep(2, 'Scraping verified profile data via Apify...');
    let candidateData = null;
    let attempts = 0;
    const maxAttempts = 35; // ~50 seconds max

    while (attempts < maxAttempts) {
      attempts++;
      await new Promise((r) => setTimeout(r, 1500));

      const jobRes = await fetch(`${apiBase}/jobs/${jobId}`);
      if (jobRes.ok) {
        const job = await jobRes.json();
        if (job.status === 'FAILED') {
          throw new Error(job.errorMessage || 'Profile retrieval failed.');
        }
        if (
          job.status === 'COMPLETED' ||
          job.currentStage === 'FACT_NORMALIZATION' ||
          job.currentStage === 'READY_FOR_SCRIPT' ||
          job.currentStage === 'SCRIPT_GENERATION'
        ) {
          break;
        }
      }
    }

    // Step 3: Fetch Score
    setStep(3, 'Computing 10-point multi-vector score breakdown...');
    
    // Fetch Candidate Details
    const candRes = await fetch(`${apiBase}/candidates/${candidateId}`);
    candidateData = candRes.ok ? await candRes.json() : { id: candidateId, submittedProfileUrl: cleanUrl };

    // Fetch Score
    let scoreRes = await fetch(`${apiBase}/candidates/${candidateId}/score`);
    if (!scoreRes.ok) {
      // Trigger calculation
      scoreRes = await fetch(`${apiBase}/candidates/${candidateId}/score`, { method: 'POST' });
    }

    if (!scoreRes.ok) {
      throw new Error('Failed to generate candidate score.');
    }

    const scoreData = await scoreRes.json();

    // Cache locally
    await chrome.storage.local.set({
      [cacheKey]: { candidate: candidateData, score: scoreData, timestamp: Date.now() },
    });

    displayResults(candidateData, scoreData);
  } catch (err) {
    showError('Scoring Error', err.message || 'An unexpected error occurred while scoring the profile.');
  }
}

// UI State Management
function showLoading() {
  idleGuide.classList.add('hidden');
  errorState.classList.add('hidden');
  resultsCard.classList.add('hidden');
  loadingState.classList.remove('hidden');
}

function setStep(stepNum, desc) {
  loadingDesc.textContent = desc;
  step1.classList.toggle('active', stepNum === 1);
  step2.classList.toggle('active', stepNum === 2);
  step3.classList.toggle('active', stepNum === 3);
}

function showError(title, msg) {
  loadingState.classList.add('hidden');
  resultsCard.classList.add('hidden');
  idleGuide.classList.add('hidden');
  errorState.classList.remove('hidden');
  errorTitle.textContent = title;
  errorMessage.textContent = msg;
}

function displayResults(candidate, score) {
  currentCandidateData = candidate;
  currentScoreData = score;

  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  idleGuide.classList.add('hidden');
  resultsCard.classList.remove('hidden');

  // Candidate info
  const name = candidate?.displayName || extractNameFromUrl(candidate?.submittedProfileUrl) || 'Candidate';
  resName.textContent = name;
  resAvatar.textContent = name.charAt(0).toUpperCase();

  // Headline or summary
  const headlineFact = candidate?.facts?.find((f) => f.category === 'headline')?.factText;
  resHeadline.textContent = headlineFact || 'Verified LinkedIn Candidate Profile';

  // Overall Score & Tier
  const overall = Number(score.overallScore || 0).toFixed(1);
  resOverallScore.textContent = overall;
  resTierBadge.textContent = score.tier || 'PROFICIENT';
  resTierBadge.className = `tier-badge tier-${score.tier || 'PROFICIENT'}`;

  // Breakdown Pillars
  valExperience.textContent = `${Number(score.experienceScore || 0).toFixed(1)} / 3.5`;
  barExperience.style.width = `${Math.min(100, ((score.experienceScore || 0) / 3.5) * 100)}%`;

  valSkills.textContent = `${Number(score.skillsScore || 0).toFixed(1)} / 2.5`;
  barSkills.style.width = `${Math.min(100, ((score.skillsScore || 0) / 2.5) * 100)}%`;

  valEducation.textContent = `${Number(score.educationScore || 0).toFixed(1)} / 2.0`;
  barEducation.style.width = `${Math.min(100, ((score.educationScore || 0) / 2.0) * 100)}%`;

  valImpact.textContent = `${Number(score.impactScore || 0).toFixed(1)} / 2.0`;
  barImpact.style.width = `${Math.min(100, ((score.impactScore || 0) / 2.0) * 100)}%`;

  // Strengths
  renderTags(resStrengths, score.keyStrengths, 'tag-strength');
  // Growth
  renderTags(resGrowth, score.growthAreas, 'tag-growth');
  // Roles
  renderTags(resRoles, score.recommendedRoles, 'tag-role');
}

function renderTags(container, items, tagClass) {
  container.innerHTML = '';
  if (!items || items.length === 0) {
    container.innerHTML = `<span class="tag ${tagClass}">Evaluation Pending</span>`;
    return;
  }
  items.forEach((item) => {
    const span = document.createElement('span');
    span.className = `tag ${tagClass}`;
    span.textContent = item;
    container.appendChild(span);
  });
}

function extractNameFromUrl(url) {
  if (!url) return '';
  const match = url.match(/\/in\/([^\/\?#]+)/);
  if (!match) return '';
  return match[1]
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Copy Summary to Clipboard
btnCopySummary.addEventListener('click', async () => {
  if (!currentScoreData || !currentCandidateData) return;

  const name = resName.textContent;
  const url = currentCandidateData.submittedProfileUrl;
  const score = currentScoreData;

  const summary = `🎯 ProfileReel AI Candidate Evaluation
Candidate: ${name}
Profile: ${url}
Overall Score: ${Number(score.overallScore).toFixed(1)} / 10.0 (${score.tier})

📊 Pillar Breakdown:
• Experience & Seniority: ${Number(score.experienceScore).toFixed(1)} / 3.5
• Technical Skills: ${Number(score.skillsScore).toFixed(1)} / 2.5
• Education & Credentials: ${Number(score.educationScore).toFixed(1)} / 2.0
• Professional Impact & Presence: ${Number(score.impactScore).toFixed(1)} / 2.0

⭐ Key Strengths:
${(score.keyStrengths || []).map((s) => `• ${s}`).join('\n')}

🌱 Focus & Growth Areas:
${(score.growthAreas || []).map((g) => `• ${g}`).join('\n')}

💼 Recommended Roles:
${(score.recommendedRoles || []).join(', ')}
`;

  await navigator.clipboard.writeText(summary);
  copyBtnText.textContent = 'Copied to Clipboard! ✓';
  setTimeout(() => {
    copyBtnText.textContent = 'Copy Summary';
  }, 2000);
});
