# 📝 Final Apps Script Fix

## Problem
Check-out membuat row baru bukan update row yang sama.

## Solution
Update Apps Script dengan logic yang lebih smart:

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
      // Check if row already exists
      const values = sheet.getDataRange().getValues();
      const tz = Session.getScriptTimeZone();
      
      for (let i = values.length - 1; i >= 1; i--) {
        const cellDate = values[i][0];
        const rowDate = cellDate instanceof Date
          ? Utilities.formatDate(cellDate, tz, "yyyy-MM-dd")
          : String(cellDate).trim();
        const rowId = String(values[i][2]).trim().replace(/\.0+$/, "");
        const targetId = String(data.nisnNip).trim().replace(/\.0+$/, "");
        
        if (rowDate === String(data.tanggal).trim() && rowId === targetId) {
          // Update existing row
          sheet.getRange(i + 1, 5).setValue(data.jamDatang);
          sheet.getRange(i + 1, 6).setValue(data.jamPulang);
          sheet.getRange(i + 1, 7).setValue(data.status);
          sheet.getRange(i + 1, 8).setValue(data.role);
          return ok("updated existing row");
        }
      }
      
      // Append new row if not found
      sheet.appendRow([
        data.tanggal, data.nama, data.nisnNip, data.kelas,
        data.jamDatang, data.jamPulang, data.status, data.role
      ]);
      return ok("appended new row");
    }

    if (data.action === "update") {
      const values = sheet.getDataRange().getValues();
      const tz = Session.getScriptTimeZone();
      
      console.log("Update request:", data);
      
      for (let i = values.length - 1; i >= 1; i--) {
        const cellDate = values[i][0];
        const rowDate = cellDate instanceof Date
          ? Utilities.formatDate(cellDate, tz, "yyyy-MM-dd")
          : String(cellDate).trim();
        const rowId = String(values[i][2]).trim().replace(/\.0+$/, "");
        const targetId = String(data.nisnNip).trim().replace(/\.0+$/, "");
        
        console.log(`Checking row ${i}: date="${rowDate}" vs "${data.tanggal}", id="${rowId}" vs "${targetId}"`);
        
        if (rowDate === String(data.tanggal).trim() && rowId === targetId) {
          // Update jam pulang only
          sheet.getRange(i + 1, 6).setValue(data.jamPulang);
          if (data.status) sheet.getRange(i + 1, 7).setValue(data.status);
          console.log(`Updated row ${i + 1} with jam pulang: ${data.jamPulang}`);
          return ok(`updated row ${i + 1} with jam pulang`);
        }
      }
      
      // Fallback: append new row
      console.log("Row not found, appending new row");
      sheet.appendRow([
        data.tanggal, data.nama || "-", data.nisnNip, data.kelas || "-",
        data.jamDatang || "-", data.jamPulang, data.status || "-", data.role || "-"
      ]);
      return ok("row not found, appended new row");
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

## Key Improvements
1. **Smart append** - Check existing row before append
2. **Better logging** - Console.log untuk debugging
3. **Flexible matching** - Handle date dan ID format
4. **Clear fallback** - Append new row jika tidak ditemukan

## Testing
1. Update Apps Script dengan code di atas
2. Test check-in → harusnya update existing row
3. Test check-out → harusnya update jam pulang
4. Check console logs di Apps Script dashboard
