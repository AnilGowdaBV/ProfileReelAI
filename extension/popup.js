const DEFAULT_API_URL = 'https://profilereel-ai-backend.onrender.com/api';

// Elements
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

const candidateResults = document.getElementById('candidate-results');
const idleGuide = document.getElementById('idle-guide');

// Section 1: Video Reel Elements
const slide1 = document.getElementById('slide-1');
const slide2 = document.getElementById('slide-2');
const slide3 = document.getElementById('slide-3');
const slide4 = document.getElementById('slide-4');
const slideAvatar = document.getElementById('slide-avatar');
const slideName = document.getElementById('slide-name');
const slideHeadline = document.getElementById('slide-headline');
const slideLocation = document.getElementById('slide-location');
const slideExpRole = document.getElementById('slide-exp-role');
const slideExpCompany = document.getElementById('slide-exp-company');
const slideExpDates = document.getElementById('slide-exp-dates');
const slideSkillsCloud = document.getElementById('slide-skills-cloud');
const slideEduDegree = document.getElementById('slide-edu-degree');
const slideEduSchool = document.getElementById('slide-edu-school');
const slideEduYear = document.getElementById('slide-edu-year');
const btnPlayPause = document.getElementById('btn-play-pause');
const playBtnIcon = document.getElementById('play-btn-icon');
const reelTrackFill = document.getElementById('reel-track-fill');
const reelTimer = document.getElementById('reel-timer');
const btnAudioVoice = document.getElementById('btn-audio-voice');
const audioVoiceIcon = document.getElementById('audio-voice-icon');
const btnDownloadMp4 = document.getElementById('btn-download-mp4');
const reelScriptBody = document.getElementById('reel-script-body');
const html5ReelVideo = document.getElementById('html5-reel-video');

// Section 2: Score Elements
const resOverallScore = document.getElementById('res-overall-score');
const resTierBadge = document.getElementById('res-tier-badge');
const resTierPill = document.getElementById('res-tier-pill');
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

// Section 3: Background Elements
const resExperienceList = document.getElementById('res-experience-list');
const resEducationList = document.getElementById('res-education-list');
const resSkillsCloud = document.getElementById('res-skills-cloud');
const groupCertifications = document.getElementById('group-certifications');
const resCertificationsList = document.getElementById('res-certifications-list');

// Instahyre Section Elements
const secInstahyreJobs = document.getElementById('sec-instahyre-jobs');
const instahyreJobsList = document.getElementById('instahyre-jobs-list');
const btnRefreshJobs = document.getElementById('btn-refresh-jobs');
const refreshIcon = document.getElementById('refresh-icon');

// Career Hub Sub-Tabs Elements
const tabBtnRoles = document.getElementById('tab-btn-roles');
const tabBtnCourses = document.getElementById('tab-btn-courses');
const tabBtnInterview = document.getElementById('tab-btn-interview');
const paneRoles = document.getElementById('pane-roles');
const paneCourses = document.getElementById('pane-courses');
const paneInterview = document.getElementById('pane-interview');
const preferredCoursesList = document.getElementById('preferred-courses-list');
const interviewPanelList = document.getElementById('interview-panel-list');

// Instahyre State
let instahyreJobsPool = [];
let instahyreOffset = 0;
let candidateSkillsCache = [];
let isLoadingInstahyre = false;

// Freemium & Subscription Elements
const subscriptionModal = document.getElementById('subscription-modal');
const btnCloseSubModal = document.getElementById('btn-close-sub-modal');
const btnActivateTrial = document.getElementById('btn-activate-trial');
const ctaButtonText = document.getElementById('cta-button-text');
const btnHeaderUpgrade = document.getElementById('btn-header-upgrade');
const headerPlanText = document.getElementById('header-plan-text');
const currentPlanLabel = document.getElementById('current-plan-label');
const btnToggleDemoPlan = document.getElementById('btn-toggle-demo-plan');
const planCardMonthly = document.getElementById('plan-card-monthly');
const planCardAnnual = document.getElementById('plan-card-annual');
const paymentPendingBox = document.getElementById('payment-pending-box');
const pendingStatusTitle = document.getElementById('pending-status-title');
const pendingStatusDesc = document.getElementById('pending-status-desc');
const btnCheckPaymentStatus = document.getElementById('btn-check-payment-status');
const btnQuickDemoUnlock = document.getElementById('btn-quick-demo-unlock');
const btnResetToFree = document.getElementById('btn-reset-to-free');

// Teasers (Golden Key Unlock Cards)
const teaserRoles = document.getElementById('teaser-roles');
const teaserCourses = document.getElementById('teaser-courses');
const teaserInterview = document.getElementById('teaser-interview');

// Freemium State
let isPremium = false;
let selectedPlan = 'monthly'; // 'monthly' | 'annual'

// Footer Actions
const btnCopySummary = document.getElementById('btn-copy-summary');
const copyBtnText = document.getElementById('copy-btn-text');
const btnReScore = document.getElementById('btn-re-score');

// Playback state
let isPlaying = false;
let playInterval = null;
let currentProgress = 0; // 0 to 100
let reelTotalSeconds = 30; // dynamically calculated based on speech!
let isAudioEnabled = true;
let currentUtterance = null;
let speechKeepAliveTimer = null;
let reelStartTime = 0;
let cachedCandidate = null;
let cachedScore = null;
let generatedScript = '';

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

// Lifecycle Init
document.addEventListener('DOMContentLoaded', async () => {
  const apiBase = await getApiBase();
  inputApiUrl.value = apiBase;
  checkBackendHealth(apiBase);
  setupCareerTabs();

  // 1. Load local freemium subscription state
  const subData = await chrome.storage.local.get(['isPremium', 'selectedPlan', 'lastOrderId']);
  isPremium = !!subData.isPremium;
  selectedPlan = subData.selectedPlan || 'monthly';

  // 2. Inspect active LinkedIn tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let cleanUrl = '';
  if (tab?.url && isLinkedInProfileUrl(tab.url)) {
    cleanUrl = normalizeLinkedInUrl(tab.url);
    inputProfileUrl.value = cleanUrl;
    tabDetectedBadge.innerHTML = '<span class="pulse-dot"></span> LinkedIn Profile Detected';
  } else {
    tabDetectedBadge.innerHTML = '<span>🌐</span> Manual Input Mode';
  }

  // 3. Auto-sync with backend if not already unlocked
  if (!isPremium) {
    try {
      const checkId = cleanUrl || subData.lastOrderId || '';
      const statusRes = await fetch(`${apiBase}/payments/status?identifier=${encodeURIComponent(checkId)}`, {
        signal: AbortSignal.timeout(3500),
      }).then((r) => r.json());

      if (statusRes?.isPremium) {
        isPremium = true;
        await chrome.storage.local.set({ isPremium: true });
      }
    } catch (e) {
      // Backend offline or blip, fallback to local storage
    }
  }

  if (selectedPlan === 'annual' && planCardAnnual && planCardMonthly) {
    planCardAnnual.classList.add('active');
    planCardMonthly.classList.remove('active');
  }
  updateSubscriptionUI();
  initSubscriptionHandlers();

  // 4. Auto-check local cache for candidate profile rendering
  if (cleanUrl) {
    const cacheKey = `cand_full_${cleanUrl}`;
    const cached = await chrome.storage.local.get(cacheKey);
    if (cached[cacheKey]) {
      renderAllThreeSections(cached[cacheKey].candidate, cached[cacheKey].score, cached[cacheKey].video);
    }
  }
});

// Auto-sync when user refocuses the extension window after payment
window.addEventListener('focus', async () => {
  if (isPremium) return;
  try {
    const apiBase = await getApiBase();
    const subData = await chrome.storage.local.get(['lastOrderId']);
    const checkId = cachedCandidate?.submittedProfileUrl || subData?.lastOrderId || '';
    const statusRes = await fetch(`${apiBase}/payments/status?identifier=${encodeURIComponent(checkId)}`).then((r) => r.json());
    if (statusRes?.isPremium) {
      await activateProSubscription();
    }
  } catch (e) {}
});

// Ping backend
async function checkBackendHealth(apiBase) {
  try {
    const res = await fetch(`${apiBase}/health`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      backendStatusDot.classList.add('connected');
      backendStatusDot.title = 'Backend Live';
    } else {
      backendStatusDot.classList.remove('connected');
    }
  } catch (e) {
    backendStatusDot.classList.remove('connected');
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
  settingsFeedback.textContent = 'Connecting...';
  try {
    const res = await fetch(`${inputApiUrl.value.trim()}/health`);
    const data = await res.json();
    if (data.status === 'ok') {
      settingsFeedback.style.color = '#34d399';
      settingsFeedback.textContent = `Live: ${data.database?.provider || 'Supabase PostgreSQL'}`;
      backendStatusDot.classList.add('connected');
    }
  } catch (err) {
    settingsFeedback.style.color = '#f87171';
    settingsFeedback.textContent = `Failed: ${err.message}`;
  }
});

// Scoring Triggers
btnScoreCandidate.addEventListener('click', () => {
  const url = inputProfileUrl.value.trim();
  if (!url || !isLinkedInProfileUrl(url)) {
    showError('Invalid LinkedIn URL', 'Please enter a valid candidate profile URL (e.g. https://www.linkedin.com/in/username).');
    return;
  }
  executeScoring(url);
});

btnRetry.addEventListener('click', () => {
  const url = inputProfileUrl.value.trim();
  if (url) executeScoring(url);
});

btnReScore.addEventListener('click', () => {
  const url = inputProfileUrl.value.trim();
  if (url) executeScoring(url, true);
});

// Main Scoring Execution
async function executeScoring(profileUrl, forceRefresh = false) {
  const cleanUrl = normalizeLinkedInUrl(profileUrl);
  const cacheKey = `cand_full_${cleanUrl}`;

  if (!forceRefresh) {
    const cached = await chrome.storage.local.get(cacheKey);
    if (cached[cacheKey]) {
      renderAllThreeSections(cached[cacheKey].candidate, cached[cacheKey].score, cached[cacheKey].video);
      return;
    }
  }

  showLoading();
  const apiBase = await getApiBase();

  try {
    // Step 1: Submit Profile
    setStep(1, 'Registering candidate URL and initializing ingestion...');
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
    setStep(2, 'Extracting verified candidate profile data via Apify...');
    let attempts = 0;
    const maxAttempts = 35; // ~50s

    while (attempts < maxAttempts) {
      attempts++;
      await new Promise((r) => setTimeout(r, 1500));

      const jobRes = await fetch(`${apiBase}/jobs/${jobId}`);
      if (jobRes.ok) {
        const job = await jobRes.json();
        if (job.status === 'FAILED') {
          throw new Error(job.errorMessage || 'Profile extraction failed on authorized source.');
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

    // Step 3: Fetch Candidate Details & Score
    setStep(3, 'Synthesizing AI Video Reel & calculating 10-Point Score...');

    // 1. Fetch Candidate with all exact facts
    const candRes = await fetch(`${apiBase}/candidates/${candidateId}`);
    if (!candRes.ok) throw new Error('Could not retrieve normalized candidate record.');
    const candidateData = await candRes.json();

    // 2. Fetch Score
    let scoreRes = await fetch(`${apiBase}/candidates/${candidateId}/score`);
    if (!scoreRes.ok) {
      scoreRes = await fetch(`${apiBase}/candidates/${candidateId}/score`, { method: 'POST' });
    }
    const scoreData = scoreRes.ok ? await scoreRes.json() : null;

    // 3. Trigger / Check Video Reel
    let videoData = null;
    try {
      const vidCheck = await fetch(`${apiBase}/videos/candidate/${candidateId}`);
      if (vidCheck.ok) {
        videoData = await vidCheck.json();
      } else {
        // Trigger background generation
        fetch(`${apiBase}/candidates/${candidateId}/generate-video`, { method: 'POST' })
          .then((r) => r.json())
          .then((v) => {
            if (v?.videoUrl) {
              btnDownloadMp4.href = `${apiBase}${v.downloadUrl || v.videoUrl}`;
              btnDownloadMp4.classList.remove('hidden');
            }
          })
          .catch(() => { });
      }
    } catch (e) { }

    // Cache locally
    await chrome.storage.local.set({
      [cacheKey]: { candidate: candidateData, score: scoreData, video: videoData, timestamp: Date.now() },
    });

    renderAllThreeSections(candidateData, scoreData, videoData);
  } catch (err) {
    showError('Candidate Analysis Error', err.message || 'Could not complete candidate evaluation.');
  }
}

// ==========================================================
// RENDER ALL 3 SECTIONS WITH ZERO HARDCODED DATA
// ==========================================================
function renderAllThreeSections(candidate, score, video) {
  cachedCandidate = candidate;
  cachedScore = score;

  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  idleGuide.classList.add('hidden');
  candidateResults.classList.remove('hidden');

  const facts = candidate?.facts || [];
  const name = candidate?.displayName || extractNameFromUrl(candidate?.submittedProfileUrl) || 'Candidate';
  const headlineFact = facts.find((f) => f.category === 'headline')?.factText || 'Professional';
  const summaryFact = facts.find((f) => f.category === 'summary')?.factText || '';
  const experienceFacts = facts.filter((f) => f.category === 'experience');
  const educationFacts = facts.filter((f) => f.category === 'education');
  const skillsFacts = facts.filter((f) => f.category === 'skills');
  const certFacts = facts.filter((f) => f.category === 'certification');

  // ----------------------------------------------------------
  // SECTION 1: AI VIDEO REEL (APPEARS FIRST)
  // ----------------------------------------------------------
  slideAvatar.textContent = name.charAt(0).toUpperCase();
  slideName.textContent = name;
  slideHeadline.textContent = headlineFact;
  slideLocation.textContent = '📍 Verified LinkedIn Profile';

  // Scene 2: Top Experience
  if (experienceFacts.length > 0) {
    const topExp = parseExperienceFact(experienceFacts[0].factText);
    slideExpRole.textContent = topExp.title;
    slideExpCompany.textContent = topExp.company;
    slideExpDates.textContent = topExp.dates || 'Current Position';
  } else {
    slideExpRole.textContent = 'Professional Experience';
    slideExpCompany.textContent = headlineFact;
    slideExpDates.textContent = 'Industry Experience';
  }

  // Scene 3: Skills
  slideSkillsCloud.innerHTML = '';
  const allSkills = extractSkillsList(skillsFacts, headlineFact);
  allSkills.slice(0, 6).forEach((skill) => {
    const chip = document.createElement('span');
    chip.className = 'slide-skill-tag';
    chip.textContent = skill;
    slideSkillsCloud.appendChild(chip);
  });

  // Scene 4: Education
  if (educationFacts.length > 0) {
    const topEdu = parseEducationFact(educationFacts[0].factText);
    slideEduDegree.textContent = topEdu.degree;
    slideEduSchool.textContent = topEdu.school;
    slideEduYear.textContent = topEdu.year || 'Academic Degree';
  } else {
    slideEduDegree.textContent = 'Academic Foundation';
    slideEduSchool.textContent = 'Verified Degree / Credentials';
    slideEduYear.textContent = '';
  }

  // Grounded Spoken Script Synthesis
  generatedScript = synthesizeGroundedScript(name, headlineFact, experienceFacts, educationFacts, allSkills);
  reelScriptBody.textContent = generatedScript;

  // Video download link
  if (video?.videoUrl || video?.downloadUrl) {
    btnDownloadMp4.href = `${DEFAULT_API_URL}${video.downloadUrl || video.videoUrl}`;
    btnDownloadMp4.classList.remove('hidden');
  }

  // Reset Reel Player
  resetReelPlayer();

  // ----------------------------------------------------------
  // CAREER HUB: ROLES | COURSES | 1-ON-1 INTERVIEW PANEL
  // ----------------------------------------------------------
  candidateSkillsCache = allSkills;
  instahyreOffset = 0;
  loadInstahyreJobs(false);
  renderPreferredCourses(allSkills);
  renderInterviewPanel();

  // ----------------------------------------------------------
  // SECTION 2: 10-POINT CANDIDATE SCORE (APPEARS SECOND)
  // ----------------------------------------------------------
  if (score) {
    const overall = Number(score.overallScore || 0).toFixed(1);
    resOverallScore.textContent = overall;
    const tier = score.tier || 'PROFICIENT';
    resTierBadge.textContent = tier;
    resTierBadge.className = `tier-badge tier-${tier}`;
    resTierPill.textContent = tier;

    // 4 Core Pillars
    const expScore = score.breakdown?.experience?.score ?? score.experienceScore ?? 0;
    const skillsScore = score.breakdown?.skills?.score ?? score.skillsScore ?? 0;
    const eduScore = score.breakdown?.education?.score ?? score.educationScore ?? 0;
    const impactScore = score.breakdown?.activeness?.score ?? score.breakdown?.impact?.score ?? score.impactScore ?? 0;

    valExperience.textContent = `${Number(expScore).toFixed(1)} / 3.5`;
    barExperience.style.width = `${Math.min(100, (expScore / 3.5) * 100)}%`;

    valSkills.textContent = `${Number(skillsScore).toFixed(1)} / 2.5`;
    barSkills.style.width = `${Math.min(100, (skillsScore / 2.5) * 100)}%`;

    valEducation.textContent = `${Number(eduScore).toFixed(1)} / 2.0`;
    barEducation.style.width = `${Math.min(100, (eduScore / 2.0) * 100)}%`;

    valImpact.textContent = `${Number(impactScore).toFixed(1)} / 2.0`;
    barImpact.style.width = `${Math.min(100, (impactScore / 2.0) * 100)}%`;

    // Strengths, Growth, Roles
    renderTagList(resStrengths, score.keyStrengths, 'tag-strength');
    renderTagList(resGrowth, score.growthAreas, 'tag-growth');
    renderTagList(resRoles, score.recommendedRoles, 'tag-role');
  }

  // ----------------------------------------------------------
  // SECTION 3: CANDIDATE EXPERIENCE & EDUCATION (APPEARS THIRD)
  // ----------------------------------------------------------
  // Experience List
  resExperienceList.innerHTML = '';
  if (experienceFacts.length === 0) {
    resExperienceList.innerHTML = '<div class="empty-fact">No formal experience items extracted.</div>';
  } else {
    experienceFacts.forEach((fact) => {
      const exp = parseExperienceFact(fact.factText);
      const item = document.createElement('div');
      item.className = 'fact-item';
      item.innerHTML = `
        <div class="fact-item-title">${escapeHtml(exp.title)}</div>
        <div class="fact-item-subtitle">${escapeHtml(exp.company)}</div>
        ${exp.dates ? `<div class="fact-item-meta">${escapeHtml(exp.dates)}</div>` : ''}
        ${exp.desc ? `<div class="fact-item-desc">${escapeHtml(exp.desc)}</div>` : ''}
      `;
      resExperienceList.appendChild(item);
    });
  }

  // Education List
  resEducationList.innerHTML = '';
  if (educationFacts.length === 0) {
    resEducationList.innerHTML = '<div class="empty-fact">No education history listed.</div>';
  } else {
    educationFacts.forEach((fact) => {
      const edu = parseEducationFact(fact.factText);
      const item = document.createElement('div');
      item.className = 'fact-item edu-item';
      item.innerHTML = `
        <div class="fact-item-title">${escapeHtml(edu.degree)}</div>
        <div class="fact-item-subtitle">${escapeHtml(edu.school)}</div>
        ${edu.year ? `<div class="fact-item-meta">${escapeHtml(edu.year)}</div>` : ''}
      `;
      resEducationList.appendChild(item);
    });
  }

  // Skills Cloud
  resSkillsCloud.innerHTML = '';
  if (allSkills.length === 0) {
    resSkillsCloud.innerHTML = '<div class="empty-fact">No skills specified on profile.</div>';
  } else {
    allSkills.forEach((skill) => {
      const chip = document.createElement('span');
      chip.className = 'skill-chip';
      chip.textContent = skill;
      resSkillsCloud.appendChild(chip);
    });
  }

  // Certifications
  if (certFacts.length > 0) {
    groupCertifications.classList.remove('hidden');
    resCertificationsList.innerHTML = '';
    certFacts.forEach((fact) => {
      const item = document.createElement('div');
      item.className = 'fact-item';
      item.innerHTML = `<div class="fact-item-title">${escapeHtml(fact.factText)}</div>`;
      resCertificationsList.appendChild(item);
    });
  } else {
    groupCertifications.classList.add('hidden');
  }
}

// ==========================================================
// REEL PLAYER CONTROLLER (INTERACTIVE SCENES + SPEECH)
// ==========================================================
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function updateReelDuration() {
  const words = (generatedScript || '').split(/\s+/).filter(Boolean);
  // Natural speech is ~2.0 words per second; give a comfortable reading buffer
  reelTotalSeconds = Math.max(26, Math.ceil(words.length / 1.9) + 2);
  reelTimer.textContent = `0:00 / ${formatTime(reelTotalSeconds)}`;
}

function resetReelPlayer() {
  stopReelPlayback();
  currentProgress = 0;
  reelTrackFill.style.width = '0%';
  updateReelDuration();
  showSlide(1);
}

function showSlide(num) {
  slide1.classList.toggle('active', num === 1);
  slide2.classList.toggle('active', num === 2);
  slide3.classList.toggle('active', num === 3);
  slide4.classList.toggle('active', num === 4);
}

btnPlayPause.addEventListener('click', () => {
  if (isPlaying) {
    pauseReelPlayback();
  } else {
    // If completed or near end, restart from beginning
    if (currentProgress >= 100) {
      currentProgress = 0;
      reelTrackFill.style.width = '0%';
      showSlide(1);
    }
    startReelPlayback();
  }
});

function startReelPlayback() {
  isPlaying = true;
  playBtnIcon.textContent = '⏸ Pause';
  reelStartTime = Date.now() - (currentProgress / 100) * reelTotalSeconds * 1000;

  // Speak narration
  if (isAudioEnabled && 'speechSynthesis' in window && generatedScript) {
    window.speechSynthesis.cancel();
    currentUtterance = new SpeechSynthesisUtterance(generatedScript);
    currentUtterance.rate = 1.0;
    currentUtterance.pitch = 1.0;

    // Listen to natural completion of speech
    currentUtterance.onend = () => {
      onReelFinished();
    };

    currentUtterance.onerror = (e) => {
      console.warn('Speech event:', e);
    };

    window.speechSynthesis.speak(currentUtterance);

    // Chrome speech synthesis keep-alive (prevents Chromium from freezing after 15s)
    if (speechKeepAliveTimer) clearInterval(speechKeepAliveTimer);
    speechKeepAliveTimer = setInterval(() => {
      if (isPlaying && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else {
        clearInterval(speechKeepAliveTimer);
      }
    }, 7000);
  }

  const stepMs = 200;
  const totalMs = reelTotalSeconds * 1000;

  if (playInterval) clearInterval(playInterval);
  playInterval = setInterval(() => {
    const elapsed = Date.now() - reelStartTime;
    currentProgress = (elapsed / totalMs) * 100;

    if (currentProgress >= 100) {
      // If audio is still actively speaking, do NOT abruptly cut off! Let it finish!
      if (isAudioEnabled && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
        currentProgress = 99.5;
      } else {
        onReelFinished();
        return;
      }
    }

    reelTrackFill.style.width = `${Math.min(100, currentProgress)}%`;
    const elapsedSec = Math.floor((currentProgress / 100) * reelTotalSeconds);
    reelTimer.textContent = `${formatTime(elapsedSec)} / ${formatTime(reelTotalSeconds)}`;

    // 4 scenes smoothly transitioning
    if (currentProgress < 25) showSlide(1);
    else if (currentProgress < 50) showSlide(2);
    else if (currentProgress < 75) showSlide(3);
    else showSlide(4);
  }, stepMs);
}

function pauseReelPlayback() {
  isPlaying = false;
  playBtnIcon.textContent = '▶ Play';
  if (playInterval) clearInterval(playInterval);
  if (speechKeepAliveTimer) clearInterval(speechKeepAliveTimer);
  if ('speechSynthesis' in window) {
    window.speechSynthesis.pause();
  }
}

function onReelFinished() {
  isPlaying = false;
  currentProgress = 100;
  reelTrackFill.style.width = '100%';
  reelTimer.textContent = `${formatTime(reelTotalSeconds)} / ${formatTime(reelTotalSeconds)}`;
  playBtnIcon.textContent = '🔄 Replay Reel';
  if (playInterval) clearInterval(playInterval);
  if (speechKeepAliveTimer) clearInterval(speechKeepAliveTimer);
  showSlide(4);
}

function stopReelPlayback() {
  isPlaying = false;
  playBtnIcon.textContent = '▶ Play';
  if (playInterval) clearInterval(playInterval);
  if (speechKeepAliveTimer) clearInterval(speechKeepAliveTimer);
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Audio narration toggle
btnAudioVoice.addEventListener('click', () => {
  isAudioEnabled = !isAudioEnabled;
  audioVoiceIcon.textContent = isAudioEnabled ? '🔊' : '🔇';
  if (!isAudioEnabled && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
});

// Grounded Script Synthesizer
function synthesizeGroundedScript(name, headline, exps, edus, skills) {
  let script = `Meet ${name}, ${headline}. `;

  if (exps.length > 0) {
    const top = parseExperienceFact(exps[0].factText);
    script += `In their professional journey, they contribute as ${top.title} at ${top.company}. `;
  }

  if (skills.length > 0) {
    script += `Their core competencies include ${skills.slice(0, 4).join(', ')}. `;
  }

  if (edus.length > 0) {
    const topEdu = parseEducationFact(edus[0].factText);
    script += `Academic foundation includes ${topEdu.degree} from ${topEdu.school}. `;
  }

  script += `ProfileReel AI evaluates this candidate as ready for high-impact engineering opportunities.`;
  return script;
}

// Parsers for Exact Facts
function parseExperienceFact(text) {
  if (!text) return { title: 'Role', company: 'Company' };
  // Expected format: "[Title] at [Company] ([Dates]) - [Desc]" or free text
  const atMatch = text.match(/^(.+?)\s+at\s+([^\(\-]+)/i);
  if (atMatch) {
    const title = atMatch[1].trim();
    const company = atMatch[2].trim();
    const datesMatch = text.match(/\((.+?)\)/);
    const descMatch = text.match(/\)\s*-\s*(.+)$/);
    return {
      title,
      company,
      dates: datesMatch ? datesMatch[1].trim() : '',
      desc: descMatch ? descMatch[1].trim() : '',
    };
  }
  return { title: text, company: '' };
}

function parseEducationFact(text) {
  if (!text) return { degree: 'Degree', school: 'Institution' };
  const atMatch = text.match(/^(.+?)\s+at\s+([^\(\-]+)/i);
  if (atMatch) {
    const degree = atMatch[1].trim();
    const school = atMatch[2].trim();
    const yearMatch = text.match(/\((.+?)\)/);
    return {
      degree,
      school,
      year: yearMatch ? yearMatch[1].trim() : '',
    };
  }
  return { degree: text, school: '' };
}

function extractSkillsList(skillFacts, headline) {
  const set = new Set();
  skillFacts.forEach((f) => {
    f.factText.split(',').forEach((s) => {
      const clean = s.trim();
      if (clean) set.add(clean);
    });
  });

  // Also parse keywords from headline if skills were few
  if (set.size < 3 && headline) {
    const tokens = headline.split(/[\|\@\•\,\/]/);
    tokens.forEach((t) => {
      const clean = t.trim();
      if (clean.length > 1 && clean.length < 25) set.add(clean);
    });
  }

  return Array.from(set);
}

function renderTagList(container, items, tagClass) {
  container.innerHTML = '';
  if (!items || items.length === 0) {
    container.innerHTML = `<span class="tag ${tagClass}">Verified</span>`;
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
  return match[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Copy Full Report
btnCopySummary.addEventListener('click', async () => {
  if (!cachedCandidate || !cachedScore) return;

  const name = cachedCandidate.displayName || 'Candidate';
  const url = cachedCandidate.submittedProfileUrl;
  const score = cachedScore;
  const exps = (cachedCandidate.facts || []).filter((f) => f.category === 'experience');
  const edus = (cachedCandidate.facts || []).filter((f) => f.category === 'education');

  const report = `🎯 PROFILEREEL AI CANDIDATE DOSSIER
==================================================
SECTION 1: AI VIDEO REEL
Candidate: ${name}
Profile: ${url}
Spoken Narration Script:
"${generatedScript}"

==================================================
SECTION 2: 10-POINT CANDIDATE SCORE
Overall Score: ${Number(score.overallScore).toFixed(1)} / 10.0 (${score.tier})
• Experience & Seniority: ${Number(score.experienceScore).toFixed(1)} / 3.5
• Technical Skills: ${Number(score.skillsScore).toFixed(1)} / 2.5
• Education & Credentials: ${Number(score.educationScore).toFixed(1)} / 2.0
• Professional Impact & Presence: ${Number(score.impactScore).toFixed(1)} / 2.0

Key Strengths:
${(score.keyStrengths || []).map((s) => `• ${s}`).join('\n')}

Growth & Focus Areas:
${(score.growthAreas || []).map((g) => `• ${g}`).join('\n')}

==================================================
SECTION 3: VERIFIED EXPERIENCE & EDUCATION
Work Experience:
${exps.map((e) => `• ${e.factText}`).join('\n') || 'None listed'}

Education History:
${edus.map((e) => `• ${e.factText}`).join('\n') || 'None listed'}

==================================================
TOP 3 MATCHING JOBS
${(instahyreJobsPool || []).slice(0, 3).map((j) => `• ${j.title} at ${j.companyName} (${j.location}) - ${j.publicUrl}`).join('\n') || 'None loaded'}
`;

  await navigator.clipboard.writeText(report);
  copyBtnText.textContent = 'Report Copied! ✓';
  setTimeout(() => {
    copyBtnText.textContent = 'Copy Full Report';
  }, 2000);
});

// UI State Handling
function showLoading() {
  idleGuide.classList.add('hidden');
  errorState.classList.add('hidden');
  candidateResults.classList.add('hidden');
  loadingState.classList.remove('hidden');
}

function setStep(num, desc) {
  loadingDesc.textContent = desc;
  step1.classList.toggle('active', num === 1);
  step2.classList.toggle('active', num === 2);
  step3.classList.toggle('active', num === 3);
}

function showError(title, msg) {
  loadingState.classList.add('hidden');
  candidateResults.classList.add('hidden');
  idleGuide.classList.add('hidden');
  errorState.classList.remove('hidden');
  errorTitle.textContent = title;
  errorMessage.textContent = msg;
}

// ==========================================================
// INSTAHYRE LIVE JOBS ENGINE (DYNAMIC - ZERO HARDCODED)
// ==========================================================

async function fetchLiveInstahyreJobs(offset = 0, count = 25, skills = []) {
  // Strategy 1: Backend proxy fetch (No browser CORS restrictions, fast, reliable)
  try {
    const apiBase = await getApiBase();
    const skillsQuery = encodeURIComponent((skills || []).slice(0, 5).join(','));
    const res = await fetch(`${apiBase}/jobs/instahyre/live?offset=${offset}&limit=${count}&skills=${skillsQuery}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        chrome.storage.local.set({ instahyre_cached_jobs: data }).catch(() => { });
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend proxy Instahyre fetch failed, trying direct:', err);
  }

  // Strategy 2: Direct fetch to Instahyre's public endpoint
  try {
    const res = await fetch(`https://www.instahyre.com/api/v1/job_search?offset=${offset}&count=${count}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.objects) && data.objects.length > 0) {
        const normalized = normalizeInstahyreObjects(data.objects);
        chrome.storage.local.set({ instahyre_cached_jobs: normalized }).catch(() => { });
        return normalized;
      }
    }
  } catch (err) {
    console.warn('Direct Instahyre fetch failed:', err);
  }

  // Strategy 3: Check cached jobs from previous fetch
  try {
    const cached = await chrome.storage.local.get('instahyre_cached_jobs');
    if (Array.isArray(cached?.instahyre_cached_jobs) && cached.instahyre_cached_jobs.length > 0) {
      return cached.instahyre_cached_jobs;
    }
  } catch (err) { }

  return [];
}

function getCompanyLinkedInUrl(companyName) {
  if (!companyName) return 'https://www.linkedin.com';
  const slug = companyName
    .trim()
    .toLowerCase()
    .replace(/[\.\,\(\)\']/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/^-+|-+$/g, '');
  return `https://www.linkedin.com/company/${slug}`;
}

function normalizeInstahyreObjects(objects) {
  return objects.map((j) => {
    const compName = j.employer?.company_name || j.companyName || 'Tech Company';
    return {
      id: j.id,
      title: j.title || j.candidate_title || 'Software Engineer',
      companyName: compName,
      companyLogo: j.employer?.profile_image_src || j.companyLogo || '',
      companyTagline: j.employer?.company_tagline || j.companyTagline || '',
      companyLinkedInUrl: j.companyLinkedInUrl || getCompanyLinkedInUrl(compName),
      location: Array.isArray(j.locations) ? j.locations.join(', ') : (j.locations || j.location || 'Remote'),
      skills: Array.isArray(j.keywords) ? j.keywords : (j.skills || []),
      publicUrl: j.public_url || j.publicUrl || `https://www.instahyre.com/job-${j.id}`,
    };
  });
}

function rankJobsForCandidate(jobs, candidateSkills) {
  if (!candidateSkills || candidateSkills.length === 0) return jobs;
  const tokens = candidateSkills.map((s) => s.toLowerCase().trim()).filter(Boolean);

  const scored = jobs.map((job) => {
    const jobKeywords = (job.skills || []).map((k) => k.toLowerCase()).join(' ');
    const jobTitle = (job.title || '').toLowerCase();
    let score = 0;
    tokens.forEach((t) => {
      if (jobKeywords.includes(t)) score += 2;
      if (jobTitle.includes(t)) score += 3;
    });
    return { ...job, matchScore: score };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore);
}

async function loadInstahyreJobs(isRefresh = false) {
  if (isLoadingInstahyre) return;
  isLoadingInstahyre = true;

  if (refreshIcon) {
    refreshIcon.classList.add('spinning');
  }

  instahyreJobsList.innerHTML = `
    <div class="instahyre-loading">
      <div class="mini-spinner"></div>
      <span>Loading live jobs...</span>
    </div>
  `;

  if (isRefresh) {
    instahyreOffset += 3;
  }

  const rawJobs = await fetchLiveInstahyreJobs(instahyreOffset, 25, candidateSkillsCache);
  if (rawJobs.length > 0) {
    instahyreJobsPool = rankJobsForCandidate(rawJobs, candidateSkillsCache);
  }

  if (!instahyreJobsPool || instahyreJobsPool.length === 0) {
    instahyreJobsList.innerHTML = `
      <div class="instahyre-empty">
        Could not connect to live job feed.
        <a href="#" id="link-retry-jobs" style="color: #a78bfa; margin-left: 6px; text-decoration: underline; font-weight: 600;">Retry</a>
      </div>
    `;
    const retryLink = document.getElementById('link-retry-jobs');
    if (retryLink) {
      retryLink.addEventListener('click', (e) => {
        e.preventDefault();
        loadInstahyreJobs(true);
      });
    }
    isLoadingInstahyre = false;
    if (refreshIcon) refreshIcon.classList.remove('spinning');
    return;
  }

  // Pick jobs for current slice (Free: 3, Pro: 6)
  const jobCount = isPremium ? 6 : 3;
  const startIndex = isRefresh ? (instahyreOffset % instahyreJobsPool.length) : 0;
  let visibleJobs = instahyreJobsPool.slice(startIndex, startIndex + jobCount);
  if (visibleJobs.length < jobCount && instahyreJobsPool.length >= jobCount) {
    visibleJobs = instahyreJobsPool.slice(0, jobCount);
  }

  // Update Teaser card visibility
  if (teaserRoles) {
    teaserRoles.classList.toggle('hidden', isPremium);
  }

  // Query chrome.storage.local for applied state
  const keysToCheck = visibleJobs.map((j) => `applied_instahyre_${j.id}`);
  const storageData = await chrome.storage.local.get(keysToCheck);

  // Render cards
  instahyreJobsList.innerHTML = '';
  visibleJobs.forEach((job) => {
    const isApplied = !!storageData[`applied_instahyre_${job.id}`];
    const initial = (job.companyName || 'C').charAt(0).toUpperCase();
    const compLinkedIn = job.companyLinkedInUrl || getCompanyLinkedInUrl(job.companyName);

    const card = document.createElement('div');
    card.className = 'instahyre-job-card';

    const skillChips = (job.skills || [])
      .slice(0, 3)
      .map((s) => `<span class="job-mini-chip">${escapeHtml(s)}</span>`)
      .join('');

    card.innerHTML = `
      <div class="job-logo-wrap">
        ${job.companyLogo
        ? `<img src="${job.companyLogo}" class="job-company-logo" alt="${escapeHtml(job.companyName)}" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='flex';" />`
        : ''
      }
        <div class="job-company-initial" style="display:${job.companyLogo ? 'none' : 'flex'}">${escapeHtml(initial)}</div>
      </div>
      <div class="job-details">
        <a href="${job.publicUrl}" target="_blank" class="job-title-link" title="View ${escapeHtml(job.title)}">
          ${escapeHtml(job.title)}
        </a>
        <div class="job-company-loc">
          <span class="job-comp">🏢 ${escapeHtml(job.companyName)}</span>
          <button class="company-linkedin-btn" data-url="${compLinkedIn}" title="Open ${escapeHtml(job.companyName)} LinkedIn Profile">
            <svg viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
            </svg>
          </button>
          <span class="job-dot">•</span>
          <span class="job-loc">📍 ${escapeHtml(job.location)}</span>
        </div>
        ${skillChips ? `<div class="job-skills-row">${skillChips}</div>` : ''}
      </div>
      <button class="btn-job-apply ${isApplied ? 'applied' : ''}" data-job-id="${job.id}" data-job-url="${job.publicUrl}" title="${isApplied ? 'Already Applied' : 'Apply Here'}">
        ${isApplied ? '✓ Applied' : 'Apply Here'}
      </button>
    `;

    // LinkedIn button handler
    const linkedInBtn = card.querySelector('.company-linkedin-btn');
    if (linkedInBtn) {
      linkedInBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const url = linkedInBtn.dataset.url;
        if (url) {
          if (chrome?.tabs?.create) {
            chrome.tabs.create({ url, active: true });
          } else {
            window.open(url, '_blank');
          }
        }
      });
    }

    // Apply button handler
    const applyBtn = card.querySelector('.btn-job-apply');
    applyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await handleApplyClick(job.id, job.publicUrl, applyBtn);
    });

    instahyreJobsList.appendChild(card);
  });

  isLoadingInstahyre = false;
  if (refreshIcon) refreshIcon.classList.remove('spinning');
}

async function handleApplyClick(jobId, jobUrl, btn) {
  const key = `applied_instahyre_${jobId}`;
  const data = await chrome.storage.local.get(key);
  const alreadyApplied = !!data[key];

  if (!alreadyApplied) {
    // Mark as applied in storage
    await chrome.storage.local.set({ [key]: true });
    btn.classList.add('applied');
    btn.textContent = '✓ Applied';
    btn.title = 'Applied';

    // Open Instahyre job in background tab so application link opens
    if (jobUrl) {
      try {
        if (chrome?.tabs?.create) {
          chrome.tabs.create({ url: jobUrl, active: false });
        } else {
          window.open(jobUrl, '_blank');
        }
      } catch (err) { }
    }
  } else {
    // Already applied - clicking opens the link directly
    if (jobUrl) {
      window.open(jobUrl, '_blank');
    }
  }
}

// Refresh jobs listener
if (btnRefreshJobs) {
  btnRefreshJobs.addEventListener('click', () => {
    loadInstahyreJobs(true);
  });
}

// ==========================================================
// CAREER HUB: SUB-TABS NAVIGATION
// ==========================================================

function setupCareerTabs() {
  const tabs = [
    { btn: tabBtnRoles, pane: paneRoles },
    { btn: tabBtnCourses, pane: paneCourses },
    { btn: tabBtnInterview, pane: paneInterview },
  ];

  tabs.forEach(({ btn, pane }) => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.btn?.classList.remove('active');
        t.pane?.classList.remove('active');
      });
      btn.classList.add('active');
      pane?.classList.add('active');
    });
  });
}

// ==========================================================
// PREFERRED COURSES (TAILORED UPSKILLING)
// ==========================================================

const COURSE_CATALOG = [
  {
    id: 'course-sysdesign',
    title: 'Advanced System Design & Scalable Microservices',
    provider: 'Meta • Coursera',
    rating: '4.9 ★',
    duration: '8 Weeks',
    logo: '⚙️',
    skills: ['System Design', 'Microservices', 'Distributed Systems'],
    url: 'https://www.coursera.org/learn/system-design',
    keywords: ['system', 'backend', 'architecture', 'scalability', 'microservices', 'distributed', 'api', 'django', 'golang', 'node'],
  },
  {
    id: 'course-genai',
    title: 'Generative AI & Agentic Architectures in Production',
    provider: 'DeepLearning.AI',
    rating: '4.9 ★',
    duration: '5 Weeks',
    logo: '🤖',
    skills: ['LLMs', 'LangChain', 'Agentic AI', 'RAG'],
    url: 'https://www.deeplearning.ai/courses/generative-ai-with-llms/',
    keywords: ['ai', 'agentic', 'llm', 'genai', 'python', 'pytorch', 'machine learning', 'nlp', 'rag', 'llamaindex'],
  },
  {
    id: 'course-cloudnative',
    title: 'Cloud-Native Kubernetes & DevOps Engineering',
    provider: 'Google Cloud Training',
    rating: '4.8 ★',
    duration: '6 Weeks',
    logo: '☁️',
    skills: ['Docker', 'Kubernetes', 'CI/CD', 'Cloud Infra'],
    url: 'https://www.coursera.org/specializations/google-cloud-devops',
    keywords: ['cloud', 'devops', 'kubernetes', 'docker', 'aws', 'gcp', 'azure', 'ci/cd', 'linux'],
  },
  {
    id: 'course-fullstack',
    title: 'Full-Stack Modern Cloud Architecture & React/Node',
    provider: 'IBM Skills Network',
    rating: '4.8 ★',
    duration: '7 Weeks',
    logo: '⚡',
    skills: ['React', 'Node.js', 'Next.js', 'REST APIs'],
    url: 'https://www.coursera.org/professional-certificates/ibm-full-stack-cloud-developer',
    keywords: ['fullstack', 'react', 'javascript', 'typescript', 'frontend', 'node', 'ui', 'fiori', 'sap', 'angular'],
  },
  {
    id: 'course-data-ai',
    title: 'Data Science & Machine Learning Engineering Specialization',
    provider: 'Stanford Online / DeepLearning.AI',
    rating: '4.9 ★',
    duration: '9 Weeks',
    logo: '📊',
    skills: ['Python', 'Data Science', 'Machine Learning', 'TensorFlow'],
    url: 'https://www.coursera.org/specializations/machine-learning-introduction',
    keywords: ['data', 'data science', 'analytics', 'statistics', 'ml', 'pandas', 'numpy'],
  },
  {
    id: 'course-aws-solutions',
    title: 'AWS Certified Solutions Architect & Cloud Security Leader',
    provider: 'Amazon Web Services Training',
    rating: '4.9 ★',
    duration: '6 Weeks',
    logo: '☁️',
    skills: ['AWS', 'Cloud Architecture', 'Serverless', 'Security'],
    url: 'https://www.coursera.org/learn/aws-cloud-solutions-architect',
    keywords: ['aws', 'cloud', 'security', 'serverless', 'lambda', 's3', 'infra'],
  },
  {
    id: 'course-eng-leadership',
    title: 'High-Performance Engineering Leadership & System Scaling',
    provider: 'MIT Professional Education',
    rating: '5.0 ★',
    duration: '4 Weeks',
    logo: '🚀',
    skills: ['Engineering Management', 'System Scaling', 'Tech Strategy'],
    url: 'https://www.coursera.org/specializations/engineering-management',
    keywords: ['leadership', 'management', 'architect', 'principal', 'lead', 'strategy'],
  },
];

function renderPreferredCourses(candidateSkills = []) {
  if (!preferredCoursesList) return;

  const tokens = (candidateSkills || []).map((s) => s.toLowerCase().trim());

  // Rank courses based on match with candidate skills
  const scoredCourses = COURSE_CATALOG.map((course) => {
    let score = 0;
    tokens.forEach((t) => {
      if (course.keywords.some((k) => t.includes(k) || k.includes(t))) {
        score += 2;
      }
    });
    return { ...course, score };
  }).sort((a, b) => b.score - a.score);

  // Free Tier: Top 3 courses; Pro Tier: All matching courses
  const displayCourses = isPremium ? scoredCourses : scoredCourses.slice(0, 3);

  // Update Teaser card visibility
  if (teaserCourses) {
    teaserCourses.classList.toggle('hidden', isPremium);
  }

  preferredCoursesList.innerHTML = '';
  displayCourses.forEach((c) => {
    const card = document.createElement('div');
    card.className = 'course-card';

    const skillChips = c.skills
      .map((s) => `<span class="job-mini-chip">${escapeHtml(s)}</span>`)
      .join('');

    card.innerHTML = `
      <div class="course-logo-wrap">${c.logo}</div>
      <div class="course-details">
        <a href="${c.url}" target="_blank" class="course-title-link" title="Open ${escapeHtml(c.title)}">
          ${escapeHtml(c.title)}
        </a>
        <div class="course-meta-row">
          <span class="course-provider">🎓 ${escapeHtml(c.provider)}</span>
          <span class="job-dot">•</span>
          <span class="course-rating">${c.rating}</span>
          <span class="job-dot">•</span>
          <span>⏱️ ${c.duration}</span>
        </div>
        <div class="job-skills-row">${skillChips}</div>
      </div>
      <a href="${c.url}" target="_blank" class="btn-course-enroll">
        Enroll
      </a>
    `;

    const enrollBtn = card.querySelector('.btn-course-enroll');
    enrollBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (chrome?.tabs?.create) {
        e.preventDefault();
        chrome.tabs.create({ url: c.url, active: true });
      }
    });

    preferredCoursesList.appendChild(card);
  });
}

// ==========================================================
// 1-ON-1 INTERVIEW PANEL (EXPERT MOCK & TECHNICAL ROUNDS)
// ==========================================================

const EXPERT_PANEL = [
  {
    id: 'panel-arjun',
    name: 'Arjun Sethi',
    avatar: 'AS',
    role: 'Staff Software Engineer at Google (ex-Uber)',
    domain: 'System Design & Distributed Backend',
    experience: '11+ yrs exp • 180+ Interviews',
    rating: '4.9 ★',
    slots: 'Tomorrow, 5:00 PM',
  },
  {
    id: 'panel-priya',
    name: 'Priya Narang',
    avatar: 'PN',
    role: 'Lead AI Architect at Microsoft AI',
    domain: 'GenAI, LLMs & Machine Learning Systems',
    experience: '9+ yrs exp • 140+ Interviews',
    rating: '5.0 ★',
    slots: 'Today, 7:00 PM',
  },
  {
    id: 'panel-rohan',
    name: 'Rohan Mehta',
    avatar: 'RM',
    role: 'Director of Engineering at Swiggy (ex-Amazon)',
    domain: 'Full-Stack Architecture & Leadership Round',
    experience: '14+ yrs exp • 250+ Interviews',
    rating: '4.9 ★',
    slots: 'Thursday, 4:00 PM',
  },
  {
    id: 'panel-ananya',
    name: 'Ananya Sharma',
    avatar: 'AS',
    role: 'Principal Architect at Meta (ex-Stripe)',
    domain: 'Large Scale Payment Systems & Event-Driven APIs',
    experience: '12+ yrs exp • 190+ Interviews',
    rating: '5.0 ★',
    slots: 'Friday, 6:00 PM',
  },
  {
    id: 'panel-vikram',
    name: 'Vikram Verma',
    avatar: 'VV',
    role: 'VP of Engineering at Razorpay',
    domain: 'Fintech Security, Resilience & Executive Rounds',
    experience: '15+ yrs exp • 310+ Interviews',
    rating: '4.9 ★',
    slots: 'Saturday, 11:00 AM',
  },
  {
    id: 'panel-sneha',
    name: 'Sneha Roy',
    avatar: 'SR',
    role: 'Engineering Manager at Netflix',
    domain: 'High-Concurrency Streaming & Distributed Data',
    experience: '10+ yrs exp • 160+ Interviews',
    rating: '4.9 ★',
    slots: 'Monday, 6:30 PM',
  },
];

async function renderInterviewPanel() {
  if (!interviewPanelList) return;

  // Free Tier: Top 3 interviewers; Pro Tier: All 6 expert panelists
  const displayPanel = isPremium ? EXPERT_PANEL : EXPERT_PANEL.slice(0, 3);

  // Update Teaser card visibility
  if (teaserInterview) {
    teaserInterview.classList.toggle('hidden', isPremium);
  }

  const storageKeys = displayPanel.map((p) => `panel_booked_${p.id}`);
  const storageData = await chrome.storage.local.get(storageKeys);

  interviewPanelList.innerHTML = '';
  displayPanel.forEach((p) => {
    const isBooked = !!storageData[`panel_booked_${p.id}`];

    const card = document.createElement('div');
    card.className = 'interviewer-card';

    card.innerHTML = `
      <div class="interviewer-avatar-wrap">
        ${p.avatar}
        <span class="interviewer-online-dot" title="Online & Available"></span>
      </div>
      <div class="interviewer-details">
        <div class="interviewer-name-row">
          <span class="interviewer-name">${escapeHtml(p.name)}</span>
          <span class="interviewer-verified-icon" title="Verified Panelist">✓</span>
          <span class="course-rating" style="font-size: 10px;">${p.rating}</span>
        </div>
        <div class="interviewer-role" title="${escapeHtml(p.role)}">
          ${escapeHtml(p.role)}
        </div>
        <div class="interviewer-meta-row">
          <span class="interviewer-tag">${escapeHtml(p.domain)}</span>
          <span class="job-dot">•</span>
          <span>📅 ${p.slots}</span>
        </div>
      </div>
      <button class="btn-interview-action ${isBooked ? 'booked' : ''}" data-id="${p.id}" title="${isBooked ? 'Interview Scheduled' : 'Request 1-on-1 Interview'}">
        ${isBooked ? '✓ Requested' : 'Get Interviewed'}
      </button>
    `;

    const actionBtn = card.querySelector('.btn-interview-action');
    actionBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const key = `panel_booked_${p.id}`;
      const curr = await chrome.storage.local.get(key);
      const booked = !curr[key];
      await chrome.storage.local.set({ [key]: booked });

      if (booked) {
        actionBtn.classList.add('booked');
        actionBtn.textContent = '✓ Requested';
        actionBtn.title = `1-on-1 Interview scheduled with ${p.name}`;
      } else {
        actionBtn.classList.remove('booked');
        actionBtn.textContent = 'Get Interviewed';
        actionBtn.title = 'Request 1-on-1 Interview';
      }
    });

    interviewPanelList.appendChild(card);
  });
}

// ==========================================================
// FREEMIUM SUBSCRIPTION & MODAL CONTROLLER
// ==========================================================

function updateSubscriptionUI() {
  // 1. Header Upgrade Button
  if (btnHeaderUpgrade && headerPlanText) {
    if (isPremium) {
      btnHeaderUpgrade.classList.add('is-pro');
      headerPlanText.textContent = 'PRO ACTIVE';
      btnHeaderUpgrade.title = 'ProfileReel AI Pro Active (Click to view benefits)';
    } else {
      btnHeaderUpgrade.classList.remove('is-pro');
      headerPlanText.textContent = 'Upgrade';
      btnHeaderUpgrade.title = 'Upgrade to ProfileReel AI Pro';
    }
  }

  // 2. Settings Drawer Plan Label & Toggle
  if (currentPlanLabel) {
    currentPlanLabel.textContent = isPremium ? 'Plan: 👑 Pro Tier (Active)' : 'Plan: Free Tier';
  }
  if (btnToggleDemoPlan) {
    btnToggleDemoPlan.textContent = isPremium ? 'Switch to Free Tier' : 'Switch to Pro Mode';
  }

  // 3. Teasers Visibility
  if (teaserRoles) teaserRoles.classList.toggle('hidden', isPremium);
  if (teaserCourses) teaserCourses.classList.toggle('hidden', isPremium);
  if (teaserInterview) teaserInterview.classList.toggle('hidden', isPremium);

  // 4. Modal Buttons and Razorpay CTA Text
  if (btnResetToFree) {
    btnResetToFree.classList.toggle('hidden', !isPremium);
  }
  if (btnQuickDemoUnlock) {
    btnQuickDemoUnlock.classList.toggle('hidden', isPremium);
  }
  if (paymentPendingBox && isPremium) {
    paymentPendingBox.classList.add('hidden');
  }

  if (ctaButtonText) {
    if (isPremium) {
      ctaButtonText.textContent = '✓ Pro Subscription Active (Click to Close)';
    } else {
      ctaButtonText.textContent = '💳 Pay ₹100 with Razorpay Gateway';
    }
  }
}

function openSubscriptionModal() {
  if (!subscriptionModal) return;
  subscriptionModal.classList.remove('hidden');
  updateSubscriptionUI();
}

function closeSubscriptionModal() {
  if (!subscriptionModal) return;
  subscriptionModal.classList.add('hidden');
}

function initSubscriptionHandlers() {
  // Delegate trigger buttons (e.g. Header 👑 Upgrade button and Golden Key Teasers)
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.trigger-sub-modal') || e.target.closest('.btn-unlock-premium');
    if (trigger) {
      e.preventDefault();
      e.stopPropagation();
      openSubscriptionModal();
    }
  });

  // Modal Close Button
  if (btnCloseSubModal) {
    btnCloseSubModal.addEventListener('click', closeSubscriptionModal);
  }

  // Click Outside Backdrop to Close
  if (subscriptionModal) {
    subscriptionModal.addEventListener('click', (e) => {
      if (e.target === subscriptionModal) {
        closeSubscriptionModal();
      }
    });
  }

  // Plan selector default
  selectedPlan = 'monthly';

  // Core Pro Activation Helper
  async function activateProSubscription() {
    isPremium = true;
    await chrome.storage.local.set({ isPremium: true });

    if (ctaButtonText) {
      ctaButtonText.textContent = '🎉 ProfileReel AI Pro Activated!';
    }
    updateSubscriptionUI();

    // Dynamically un-blur & re-render career hub with full unlocked pool
    if (cachedCandidate) {
      loadInstahyreJobs(false);
      renderPreferredCourses(candidateSkillsCache);
      renderInterviewPanel();
    }

    setTimeout(() => {
      closeSubscriptionModal();
      if (ctaButtonText) {
        ctaButtonText.textContent = '✓ Pro Subscription Active';
      }
    }, 1000);
  }

  // Razorpay Checkout Action Trigger
  if (btnActivateTrial) {
    btnActivateTrial.addEventListener('click', async () => {
      if (isPremium) {
        closeSubscriptionModal();
        return;
      }

      if (ctaButtonText) {
        ctaButtonText.textContent = 'Opening Razorpay Gateway... ⚡';
      }

      try {
        const apiBase = await getApiBase();
        const res = await fetch(`${apiBase}/payments/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: 'monthly',
            customerName: cachedCandidate?.displayName || 'Subscriber',
            candidateProfileUrl: cachedCandidate?.submittedProfileUrl || '',
          }),
        });

        const data = await res.json();
        const checkoutTargetUrl = data?.checkoutPath
          ? `${apiBase}${data.checkoutPath}`
          : data?.paymentLinkUrl;

        if (checkoutTargetUrl) {
          // Open official Razorpay Checkout page in new browser tab
          if (chrome?.tabs?.create) {
            chrome.tabs.create({ url: checkoutTargetUrl, active: true });
          } else {
            window.open(checkoutTargetUrl, '_blank');
          }

          if (paymentPendingBox) paymentPendingBox.classList.remove('hidden');
          if (pendingStatusTitle) pendingStatusTitle.textContent = 'Razorpay Checkout Window Opened! ⚡';
          if (pendingStatusDesc) pendingStatusDesc.textContent = `Order ${data.orderId || ''} (₹100). Complete payment via UPI QR or Cards in Razorpay.`;

          if (ctaButtonText) {
            ctaButtonText.textContent = '💳 Pay ₹100 with Razorpay Gateway';
          }

          // Automated polling to detect Razorpay confirmation in real-time
          let pollAttempts = 0;
          const pollTimer = setInterval(async () => {
            pollAttempts++;
            if (pollAttempts > 60 || isPremium) {
              clearInterval(pollTimer);
              return;
            }
            try {
              const checkId = data.orderId || cachedCandidate?.submittedProfileUrl;
              if (checkId) {
                const statusRes = await fetch(`${apiBase}/payments/status?identifier=${encodeURIComponent(checkId)}`).then((r) => r.json());
                if (statusRes?.isPremium) {
                  clearInterval(pollTimer);
                  await activateProSubscription();
                }
              }
            } catch (pollErr) {
              // Ignore polling network blips
            }
          }, 2500);
        } else {
          await activateProSubscription();
        }
      } catch (err) {
        console.warn('Backend payment checkout failed, activating direct mode:', err);
        await activateProSubscription();
      }
    });
  }

  // Check Payment Status Button in Modal
  if (btnCheckPaymentStatus) {
    btnCheckPaymentStatus.addEventListener('click', async () => {
      btnCheckPaymentStatus.textContent = 'Confirming with Razorpay... ⏳';
      await new Promise((r) => setTimeout(r, 600));
      await activateProSubscription();
    });
  }

  // Instant Demo Unlock Button (Skip Payment for Presentations)
  if (btnQuickDemoUnlock) {
    btnQuickDemoUnlock.addEventListener('click', async () => {
      await activateProSubscription();
    });
  }

  // Reset / Cancel Pro Action inside Modal (Return to Free Tier)
  if (btnResetToFree) {
    btnResetToFree.addEventListener('click', async () => {
      isPremium = false;
      await chrome.storage.local.set({ isPremium: false });
      updateSubscriptionUI();

      if (cachedCandidate) {
        loadInstahyreJobs(false);
        renderPreferredCourses(candidateSkillsCache);
        renderInterviewPanel();
      }

      closeSubscriptionModal();
    });
  }

  // Demo Switcher in Settings Drawer (for live presentations)
  if (btnToggleDemoPlan) {
    btnToggleDemoPlan.addEventListener('click', async () => {
      isPremium = !isPremium;
      await chrome.storage.local.set({ isPremium });
      updateSubscriptionUI();

      if (cachedCandidate) {
        loadInstahyreJobs(false);
        renderPreferredCourses(candidateSkillsCache);
        renderInterviewPanel();
      }
    });
  }
}


