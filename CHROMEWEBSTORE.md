# ProfileReel AI — Chrome Web Store Listing & Documentation

**Last Updated:** October 27, 2026  
**Extension Version:** 1.0.0  
**Manifest Version:** 3  

---

## 1. Store Listing Details

### Extension Name
`ProfileReel AI - LinkedIn Candidate Scorer`

### Summary (Max 132 characters)
`Instant 10-point AI candidate scoring, skills breakdown, and talent assessment directly on any LinkedIn profile.`

### Category
`Productivity` / `Workflow & Planning`

### Detailed Description
```text
Evaluate LinkedIn candidate profiles in seconds with AI-driven talent scoring.

ProfileReel AI automatically analyzes public LinkedIn candidate profiles across four foundational dimensions to produce a definitive 10-point evaluation scorecard:

⭐ 10-POINT MULTI-DIMENSIONAL ASSESSMENT:
• Experience & Seniority (Max 3.5 pts): Analyzes career progression, tenure, and leadership scope.
• Technical Skills & Competencies (Max 2.5 pts): Validates modern tech stacks and core domain expertise.
• Education & Credentials (Max 2.0 pts): Evaluates degrees, academic rigor, and professional certifications.
• Professional Impact & Presence (Max 2.0 pts): Measures published projects, professional accomplishments, and public presence.

🚀 KEY FEATURES:
• One-Click Analysis: Navigate to any candidate's LinkedIn profile and click the extension for instant evaluation.
• Objective Tiering: Automatic categorization into Exceptional (9.0-10.0), Strong (7.5-8.9), Proficient (6.0-7.4), or Developing (<6.0).
• Actionable Strengths & Growth Areas: Clear talent insights highlighting top capabilities and areas for further interview inquiry.
• One-Click Clipboard Export: Copy clean recruiting briefing notes directly into Slack, email, or your ATS.
• Smart Local Caching: Candidate scores are cached locally on your device for instant re-opening.
```

---

## 2. Permissions Justification (For Chrome Reviewers)

| Permission | Plain-English Justification |
|---|---|
| `activeTab` | Required to read the URL of the active browser tab when the user clicks the extension popup, enabling automatic detection of the candidate's LinkedIn profile. |
| `tabs` | Required to query the active window's tab URL and identify if a LinkedIn profile page is currently open. |
| `storage` | Used exclusively to cache scored candidate profiles locally on the user's browser, preventing duplicate API requests and providing instant repeat access. |
| `https://profilereel-ai-backend.onrender.com/*` | The production backend API endpoint where profile URLs are submitted to generate the 10-point candidate score and fact breakdown. |
| `https://*.linkedin.com/*` | Required to identify and validate target LinkedIn profile pages. |
| `https://*.instahyre.com/*` | Required to fetch real-time matching job recommendations from Instahyre for the scored candidate. |

---

## 3. Privacy & Data Disclosures

- **Personally Identifiable Information**: The extension processes public LinkedIn profile URLs submitted explicitly by the user for candidate assessment.
- **Data Sharing**: Data is transmitted via HTTPS solely to the user's configured backend server (`https://profilereel-ai-backend.onrender.com`). No profile data is sold or shared with third-party advertisers.
- **Local Storage**: Evaluation results are stored in `chrome.storage.local` on the user's local machine and can be cleared at any time.

---

## 4. How to Test Unpacked Extension Locally

1. Open Google Chrome and enter `chrome://extensions/` into the URL bar.
2. Turn **ON** the **Developer mode** toggle in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the `extension` folder located inside this project (`c:\Users\ThinkifyLabs\OneDrive\Desktop\ProfileReel AI\extension`).
5. The extension icon will appear in your Chrome toolbar. Pin it!
6. Navigate to any LinkedIn candidate profile (e.g., `https://www.linkedin.com/in/anil-bv-2704a8351`) and click the icon to view the 10-point score!
