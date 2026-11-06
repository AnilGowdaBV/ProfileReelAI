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
 * FIRST RUN AFTER PASTING:
 * In Apps Script, choose "setupSheets" in the toolbar function dropdown and click ▶ Run.
 * That creates Sheet2 and Sheet3 if they are missing, and moves old Express Interest
 * rows off Sheet1 onto Sheet2.
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

    var tabs = ensureAllTabs();
    var kind = classifyPayload(data);
    var sheet = kind === "mock" ? tabs.sheet3 : kind === "interest" ? tabs.sheet2 : tabs.sheet1;
    if (kind === "mock") {
      writeMockTestRows(sheet, data);
      return jsonOut({ success: true, message: "Mock test recorded on Sheet3", sheet: sheet.getName() });
    }

    writeApplicationRow(sheet, data);
    return jsonOut({
      success: true,
      message: kind === "interest" ? "Express interest recorded on Sheet2" : "Application recorded on Sheet1",
      sheet: sheet.getName(),
      kind: kind
    });
  } catch (error) {
    return jsonOut({ success: false, error: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function classifyPayload(data) {
  var action = String(data.action || data.applicationType || data.status || "").toUpperCase();
  var sheetName = String(data.sheetName || data.sheet || data.targetSheet || data.tab || "").toUpperCase().replace(/\s+/g, "");
  if (action.indexOf("MOCK") >= 0 || sheetName === "SHEET3" || Number(data.sheetIndex) === 3 || (data.answers && data.answers.length)) {
    return "mock";
  }
  if (action.indexOf("INTEREST") >= 0 || sheetName === "SHEET2" || Number(data.sheetIndex) === 2) {
    return "interest";
  }
  return "apply";
}

function namedSheet(ss, names, createAs) {
  for (var i = 0; i < names.length; i++) {
    var found = ss.getSheetByName(names[i]);
    if (found) return found;
  }
  return ss.insertSheet(createAs);
}

function ensureAllTabs() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet1 = namedSheet(ss, ["Sheet1", "Sheet 1"], "Sheet1");
  var sheet2 = namedSheet(ss, ["Sheet2", "Sheet 2", "sheet 2"], "Sheet2");
  var sheet3 = namedSheet(ss, ["Sheet3", "Sheet 3", "sheet 3"], "Sheet3");
  ensureApplicationHeaders(sheet1, "#1e293b");
  ensureApplicationHeaders(sheet2, "#1d4ed8");
  ensureMockTestHeaders(sheet3);
  try { sheet1.setTabColor("#1e293b"); } catch (e1) {}
  try { sheet2.setTabColor("#1d4ed8"); } catch (e2) {}
  try { sheet3.setTabColor("#065f46"); } catch (e3) {}
  return { sheet1: sheet1, sheet2: sheet2, sheet3: sheet3 };
}

/** Run this once in Apps Script after pasting: creates Sheet2 + Sheet3 and moves old Express Interest rows. */
function setupSheets() {
  var tabs = ensureAllTabs();
  var moved = moveExpressInterestToSheet2();
  return {
    sheet1: tabs.sheet1.getName(),
    sheet2: tabs.sheet2.getName(),
    sheet3: tabs.sheet3.getName(),
    movedExpressInterestRows: moved
  };
}

function applicationHeaders() {
  return [
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
  ];
}

function ensureApplicationHeaders(sheet, color) {
  var headers = applicationHeaders();
  if (sheet.getLastRow() === 0 || !String(sheet.getRange(1, 1).getValue() || "").trim()) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground(color || "#1e293b").setFontColor("#ffffff").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  ensureInterviewingAtColumn(sheet);
}

function mockTestHeaders() {
  return [
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
}

function ensureMockTestHeaders(sheet) {
  var headers = mockTestHeaders();
  if (sheet.getLastRow() === 0 || !String(sheet.getRange(1, 1).getValue() || "").trim()) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#065f46").setFontColor("#ffffff").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
}

function moveExpressInterestToSheet2() {
  var tabs = ensureAllTabs();
  var source = tabs.sheet1;
  var dest = tabs.sheet2;
  var lastRow = source.getLastRow();
  if (lastRow < 2) return 0;
  var lastCol = Math.max(source.getLastColumn(), 13);
  var values = source.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var formulas = source.getRange(2, 1, lastRow - 1, lastCol).getFormulas();
  var moved = 0;
  for (var i = values.length - 1; i >= 0; i--) {
    var status = String(values[i][11] || "").toUpperCase();
    var title = String(values[i][1] || "").toUpperCase();
    if (status.indexOf("INTEREST") === -1 && title.indexOf("INTEREST") === -1) continue;
    dest.appendRow(values[i]);
    var destRow = dest.getLastRow();
    for (var c = 0; c < formulas[i].length; c++) {
      if (formulas[i][c]) dest.getRange(destRow, c + 1).setFormula(formulas[i][c]);
    }
    source.deleteRow(i + 2);
    moved++;
  }
  return moved;
}

function writeApplicationRow(sheet, data) {
  ensureApplicationHeaders(sheet, sheet.getName().replace(/\s+/g, "") === "Sheet2" ? "#1d4ed8" : "#1e293b");

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
  ensureMockTestHeaders(sheet);

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
