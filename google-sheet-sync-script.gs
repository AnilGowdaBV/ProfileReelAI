/**
 * ProfileReel AI - Google Sheet Job Applications Sync & Resume Hyperlink
 *
 * HOW TO UPDATE IN GOOGLE APPS SCRIPT:
 * 1. Open your spreadsheet: https://docs.google.com/spreadsheets/d/1C2FtH1twdFlf8vO-bP0TRzcKSUGtnhxNlkm4A_L-BOY/edit
 * 2. In the top menu, click "Extensions" > "Apps Script".
 * 3. Select all code in Code.gs, delete it, and paste this entire code.
 * 4. Click the Save icon (💾).
 * 5. CRITICAL STEP TO ACTIVATE:
 *    - Click the blue "Deploy" button (top right) > "Manage deployments".
 *    - Click the pencil icon (Edit ✏️) next to your active deployment.
 *    - Under "Version", click the dropdown and choose "New version".
 *    - Click the blue "Deploy" button.
 *
 * Tabs:
 *   Sheet1  = job applications
 *   Sheet2  = express interest
 *   Sheet3  = mock test submitted links + snapshots
 *
 * TO FIX ALL EXISTING ROWS (Rows 2 to 7):
 * In Apps Script, choose "fixExistingResumeLinks" in the toolbar function dropdown
 * and click the "▶ Run" button. All existing rows will instantly turn into clickable links!
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var sheet = resolveTargetSheet(data);
    if (isMockTestPayload(data)) {
      writeMockTestRows(sheet, data);
      return jsonOut({ success: true, message: "Mock test recorded on Sheet3", sheet: sheet.getName() });
    }

    writeApplicationRow(sheet, data);
    return jsonOut({
      success: true,
      message: "Application recorded with clickable resume link!",
      sheet: sheet.getName()
    });
  } catch (error) {
    return jsonOut({ success: false, error: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function isMockTestPayload(data) {
  var action = String(data.action || data.applicationType || "").toUpperCase();
  var sheetName = String(data.sheetName || data.sheet || data.targetSheet || data.tab || "").toUpperCase().replace(/\s+/g, "");
  return action.indexOf("MOCK") >= 0 || sheetName === "SHEET3" || Number(data.sheetIndex) === 3 || (data.answers && data.answers.length);
}

function resolveTargetSheet(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = String(data.action || data.applicationType || "").toUpperCase();
  var requested = String(data.sheetName || data.sheet || data.targetSheet || data.tab || "").trim();
  var name = requested;

  if (!name) {
    if (action.indexOf("MOCK") >= 0 || Number(data.sheetIndex) === 3) name = "Sheet3";
    else if (action.indexOf("INTEREST") >= 0 || Number(data.sheetIndex) === 2) name = "Sheet2";
    else name = "Sheet1";
  }

  var compact = name.replace(/\s+/g, "");
  var candidates = [name, compact];
  if (/sheet3/i.test(compact)) candidates.push("Sheet3", "Sheet 3", "sheet 3");
  if (/sheet2/i.test(compact)) candidates.push("Sheet2", "Sheet 2");
  if (/sheet1/i.test(compact)) candidates.push("Sheet1", "Sheet 1");

  for (var i = 0; i < candidates.length; i++) {
    var found = ss.getSheetByName(candidates[i]);
    if (found) return found;
  }

  return ss.insertSheet(compact || name || "Sheet3");
}

function writeApplicationRow(sheet, data) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Applied Timestamp",
      "Job Title",
      "Company Name",
      "Candidate Name",
      "Email Address",
      "Phone Number",
      "LinkedIn URL",
      "Current Salary",
      "Expected Salary",
      "Location",
      "Resume (Click to Open)",
      "Status",
      "Where are you interviewing at"
    ]);
    sheet.getRange(1, 1, 1, 13).setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  var nowFormatted = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
  var fileName = data.resumeFileName || "Resume.pdf";
  var interviewCol = ensureInterviewingAtColumn(sheet);
  var nextRow = sheet.getLastRow() + 1;

  sheet.appendRow([
    nowFormatted,
    data.jobTitle || "Software Engineer",
    data.companyName || "Tech Company",
    data.fullName || "Candidate",
    data.email || "",
    data.phone || "",
    data.linkedinUrl || "",
    data.currentSalary || "",
    data.expectedSalary || "",
    data.location || "",
    fileName,
    data.status || "Applied"
  ]);

  sheet.getRange(nextRow, interviewCol).setValue(data.interviewingAt || "");

  if (data.resumeUrl && data.resumeUrl.toString().trim().length > 0) {
    var resumeCell = sheet.getRange(nextRow, 11);
    resumeCell.setFormula('=HYPERLINK("' + safeUrl(data.resumeUrl) + '", "📄 Open ' + cleanLabel(fileName) + '")');
    resumeCell.setFontColor("#1d4ed8").setFontLine("underline");
  }
}

function writeMockTestRows(sheet, data) {
  var headers = [
    "Submitted Timestamp",
    "Candidate Name",
    "Email Address",
    "LinkedIn URL",
    "Test ID",
    "Question No",
    "Difficulty",
    "Question Title",
    "Pattern",
    "LeetCode Problem",
    "Submitted Answer Link",
    "Snapshot",
    "Status"
  ];

  if (sheet.getLastRow() === 0 || !String(sheet.getRange(1, 1).getValue() || "").trim()) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#065f46").setFontColor("#ffffff").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  var nowFormatted = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
  var answers = data.answers || [];
  if (!answers.length) {
    answers = [{
      questionNo: 1,
      title: data.title || "",
      difficulty: data.difficulty || "",
      pattern: data.pattern || "",
      leetcodeUrl: data.leetcodeUrl || "",
      submissionUrl: data.submissionUrl || "",
      snapshotUrl: data.snapshotUrl || ""
    }];
  }

  for (var i = 0; i < answers.length; i++) {
    var answer = answers[i] || {};
    var nextRow = sheet.getLastRow() + 1;
    sheet.appendRow([
      nowFormatted,
      data.fullName || "Candidate",
      data.email || "",
      data.linkedinUrl || "",
      data.testId || "",
      answer.questionNo || (i + 1),
      answer.difficulty || "",
      answer.title || "",
      answer.pattern || "",
      answer.leetcodeUrl || "",
      answer.submissionUrl || "",
      "Snapshot",
      "Submitted"
    ]);

    setLink(sheet, nextRow, 10, answer.leetcodeUrl, "Open problem");
    setLink(sheet, nextRow, 11, answer.submissionUrl, "Open submitted answer");
    setLink(sheet, nextRow, 12, answer.snapshotUrl, "Open snapshot");
  }
}

function setLink(sheet, row, col, url, label) {
  var href = safeUrl(url);
  if (!href) return;
  var cell = sheet.getRange(row, col);
  cell.setFormula('=HYPERLINK("' + href + '", "' + cleanLabel(label) + '")');
  cell.setFontColor("#1d4ed8").setFontLine("underline");
}

function safeUrl(raw) {
  var s = String(raw || "").trim();
  if (!/^https?:\/\//i.test(s)) return "";
  return s.replace(/"/g, "%22");
}

function cleanLabel(raw) {
  return String(raw || "Open").replace(/"/g, "'");
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function fixExistingResumeLinks() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1") || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var defaultResumeUrl = "https://zbckbsckvtghbnqhqgat.supabase.co/storage/v1/object/public/profile_rell.ai%20RESUMES/resumes/1793275454174_Anil_BV.pdf";

  for (var r = 2; r <= lastRow; r++) {
    var cell = sheet.getRange(r, 11);
    var val = cell.getValue();
    var valStr = val ? val.toString().trim() : "";
    if (!valStr.startsWith("=")) {
      var label = valStr.length > 0 ? valStr : "Anil_BV.pdf";
      cell.setFormula('=HYPERLINK("' + defaultResumeUrl + '", "📄 Open ' + cleanLabel(label) + '")');
      cell.setFontColor("#1d4ed8").setFontLine("underline");
    }
  }
}

function ensureInterviewingAtColumn(sheet) {
  var header = "Where are you interviewing at";
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim() === header) return i + 1;
  }
  var col = lastCol + 1;
  var cell = sheet.getRange(1, col);
  cell.setValue(header);
  cell.setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold");
  return col;
}

function doGet(e) {
  return jsonOut({
    status: "ok",
    service: "ProfileReel AI Google Sheet Webhook Active",
    sheetId: "1C2FtH1twdFlf8vO-bP0TRzcKSUGtnhxNlkm4A_L-BOY"
  });
}
