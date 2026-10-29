/**
 * ProfileReel AI - Google Sheet Job Applications Sync
 *
 * HOW TO INSTALL IN 1 MINUTE:
 * 1. Open your spreadsheet: https://docs.google.com/spreadsheets/d/1C2FtH1twdFlf8vO-bP0TRzcKSUGtnhxNlkm4A_L-BOY/edit
 * 2. In the top menu, click "Extensions" > "Apps Script".
 * 3. Delete any default code in Code.gs, paste this entire file, and click "Save" (disk icon).
 * 4. Click the blue "Deploy" button (top right) > "New deployment".
 * 5. Click the gear icon next to "Select type" > select "Web app".
 * 6. Set:
 *    - Description: "ProfileReel AI Job Applications Receiver"
 *    - Execute as: "Me (your email)"
 *    - Who has access: "Anyone" (important so your backend & extension can post)
 * 7. Click "Deploy", authorize access with your Google account, and COPY the Web App URL (starts with https://script.google.com/macros/s/...).
 * 8. Paste that URL into backend/.env as GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/...
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
        "Resume Name",
        "Status"
      ]);
      // Format header row
      sheet.getRange(1, 1, 1, 12).setBackground("#1e293b").setFontColor("#ffffff").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    // Clickable Resume Link (from Cloudflare R2)
    var resumeCell = data.resumeFileName || "Uploaded";
    if (data.resumeUrl) {
      resumeCell = '=HYPERLINK("' + data.resumeUrl + '", "📄 Open ' + (data.resumeFileName || 'Resume.pdf') + '")';
    }

    // Append new candidate application row
    var nowFormatted = Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss");
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
      resumeCell,
      data.status || "Applied"
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Candidate application appended to Google Sheet successfully!"
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

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    service: "ProfileReel AI Google Sheet Webhook Active",
    sheetId: "1C2FtH1twdFlf8vO-bP0TRzcKSUGtnhxNlkm4A_L-BOY"
  })).setMimeType(ContentService.MimeType.JSON);
}

