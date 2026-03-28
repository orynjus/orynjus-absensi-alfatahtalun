# 📝 Apps Script Fix untuk Check-Out Issue

## Problem
Check-out data tidak terupdate di Google Sheets karena logic pencarian row tidak menemukan data.

## Root Cause
```javascript
// Logic lama - terlalu strict
if (rowDate === String(data.tanggal).trim() && rowId === targetId) {
  // Update
}
```

## Solution
Update Apps Script dengan logic yang lebih flexible:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Sheet1") || ss.getSheets()[0];

    if (data.action === "ping") {
      return ok("pong");
    }

    if (data.action === "init_headers") {
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Tanggal","Nama","NISN/NIP","Kelas","Jam Datang","Jam Pulang","Status","Role"]);
      }
      return ok("headers initialized");
    }

    if (data.action === "append") {
      sheet.appendRow([
        data.tanggal, data.nama, data.nisnNip, data.kelas,
        data.jamDatang, data.jamPulang, data.status, data.role
      ]);
      return ok("appended");
    }

    if (data.action === "update") {
      const values = sheet.getDataRange().getValues();
      const tz = Session.getScriptTimeZone();
      
      // Debug: Log all data
      console.log("Update data:", data);
      console.log("Sheet values:", values);
      
      for (let i = values.length - 1; i >= 1; i--) {
        const cellDate = values[i][0];
        const rowDate = cellDate instanceof Date
          ? Utilities.formatDate(cellDate, tz, "yyyy-MM-dd")
          : String(cellDate).trim();
        const rowId = String(values[i][2]).trim().replace(/\.0+$/, "");
        const targetId = String(data.nisnNip).trim().replace(/\.0+$/, "");
        
        console.log(`Comparing: rowDate="${rowDate}" vs data.tanggal="${data.tanggal}"`);
        console.log(`Comparing: rowId="${rowId}" vs targetId="${targetId}"`);
        
        if (rowDate === String(data.tanggal).trim() && rowId === targetId) {
          sheet.getRange(i + 1, 6).setValue(data.jamPulang);
          if (data.status) sheet.getRange(i + 1, 7).setValue(data.status);
          return ok("updated row " + (i + 1));
        }
      }
      
      // Fallback: append new row if not found
      console.log("Row not found, appending new row");
      sheet.appendRow([
        data.tanggal, data.nama || "-", data.nisnNip, data.kelas || "-",
        data.jamDatang || "-", data.jamPulang, data.status || "-", data.role || "-"
      ]);
      return ok("row not found, appended new");
    }

    if (data.action === "clear") {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      return ok("cleared");
    }

    return ok("unknown action");
  } catch (err) {
    console.error("Error:", err);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function ok(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Testing
1. Update Apps Script dengan code di atas
2. Test append data
3. Test update data
4. Check logs di Google Apps Script dashboard
