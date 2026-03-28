# 📝 Apps Script - NO NEW ROW for Check-Out

## Rule
**Check-out HARUS update row yang sama, JANGAN buat row baru!**

## Final Code

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
      // Check existing row first
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
          // UPDATE existing row
          sheet.getRange(i + 1, 5).setValue(data.jamDatang);
          sheet.getRange(i + 1, 6).setValue(data.jamPulang);
          sheet.getRange(i + 1, 7).setValue(data.status);
          sheet.getRange(i + 1, 8).setValue(data.role);
          return ok("updated existing row");
        }
      }
      
      // Only append if NOT found
      sheet.appendRow([
        data.tanggal, data.nama, data.nisnNip, data.kelas,
        data.jamDatang, data.jamPulang, data.status, data.role
      ]);
      return ok("appended new row");
    }

    if (data.action === "update") {
      const values = sheet.getDataRange().getValues();
      const tz = Session.getScriptTimeZone();
      
      console.log("UPDATE request:", data);
      console.log("Sheet rows:", values.length);
      
      for (let i = values.length - 1; i >= 1; i--) {
        const cellDate = values[i][0];
        const rowDate = cellDate instanceof Date
          ? Utilities.formatDate(cellDate, tz, "yyyy-MM-dd")
          : String(cellDate).trim();
        const rowId = String(values[i][2]).trim().replace(/\.0+$/, "");
        const targetId = String(data.nisnNip).trim().replace(/\.0+$/, "");
        
        console.log(`Row ${i}: date="${rowDate}" vs "${data.tanggal}", id="${rowId}" vs "${targetId}"`);
        
        if (rowDate === String(data.tanggal).trim() && rowId === targetId) {
          // UPDATE JAM PULANG only - JANGAN buat row baru
          sheet.getRange(i + 1, 6).setValue(data.jamPulang);
          if (data.status) sheet.getRange(i + 1, 7).setValue(data.status);
          
          console.log(`SUCCESS: Updated row ${i + 1} jam pulang = ${data.jamPulang}`);
          return ok(`updated row ${i + 1} with jam pulang`);
        }
      }
      
      // JANGAN buat row baru jika tidak ditemukan
      console.log("ERROR: Row not found for update");
      return ok("row not found - update failed");
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

## Key Rules
1. **Check-in** → Cek existing row, jika ada update, jika tidak append
2. **Check-out** → WAJIB update existing row, JANGAN append
3. **No fallback** → Jika row tidak ditemukan, return error

## Expected Behavior
```
Check-in: 07:30
Tanggal    | Nama  | NISN  | Kelas | Jam Datang | Jam Pulang | Status | Role
2024-03-27 | Ahmad | 12345 | X-A   | 07:30      | -          | hadir   | siswa

Check-out: 15:30
Tanggal    | Nama  | NISN  | Kelas | Jam Datang | Jam Pulang | Status | Role
2024-03-27 | Ahmad | 12345 | X-A   | 07:30      | 15:30     | hadir   | siswa  ← UPDATE row yang sama
```

## Deploy Instructions
1. Copy code di atas
2. Paste di Google Apps Script
3. Save → Deploy → New deployment
4. Test check-in dan check-out
