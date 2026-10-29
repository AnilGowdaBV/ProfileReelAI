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
 * TO FIX ALL EXISTING ROWS (Rows 2 to 7):
 * In Apps Script, choose "fixExistingResumeLinks" in the toolbar function dropdown
 * and click the "▶ Run" button. All existing rows will instantly turn into clickable links!
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = {};
    
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // Auto-create headers if sheet is empty or row 1 is blank
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
        "Status"
      ]);
      // Format header row
      sheet.getRange(1, 1, 1, 12).setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    var nowFormatted = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
    var fileName = data.resumeFileName || "Resume.pdf";
    var nextRow = sheet.getLastRow() + 1;

    // Append new candidate application row
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

    // If resumeUrl was uploaded to Supabase, turn Column K into a clickable Hyperlink
    if (data.resumeUrl && data.resumeUrl.toString().trim().length > 0) {
      var resumeCell = sheet.getRange(nextRow, 11);
      resumeCell.setFormula('=HYPERLINK("' + data.resumeUrl + '", "📄 Open ' + fileName + '")');
      resumeCell.setFontColor("#1d4ed8").setFontLine("underline");
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Application recorded with clickable resume link!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

/**
 * Run this function once in Apps Script to convert the existing rows (2 to 7)
 * to clickable Supabase resume links!
 */
function fixExistingResumeLinks() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  
  // The verified Supabase resume link:
  var defaultResumeUrl = "https://zbckbsckvtghbnqhqgat.supabase.co/storage/v1/object/public/profile_rell.ai%20RESUMES/resumes/1793275454174_Anil_BV.pdf";
  
  for (var r = 2; r <= lastRow; r++) {
    var cell = sheet.getRange(r, 11);
    var val = cell.getValue();
    var valStr = val ? val.toString().trim() : "";
    
    // Only update if not already a formula
    if (!valStr.startsWith("=")) {
      var label = valStr.length > 0 ? valStr : "Anil_BV.pdf";
      cell.setFormula('=HYPERLINK("' + defaultResumeUrl + '", "📄 Open ' + label + '")');
      cell.setFontColor("#1d4ed8").setFontLine("underline");
    }
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    service: "ProfileReel AI Google Sheet Webhook Active",
    sheetId: "1C2FtH1twdFlf8vO-bP0TRzcKSUGtnhxNlkm4A_L-BOY"
  })).setMimeType(ContentService.MimeType.JSON);
}
