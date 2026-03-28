// Integration: Google Sheets (Apps Script Web App)
import { db } from './db';
import { scannerSettings } from '@shared/schema';

async function getGoogleSheetsUrl(): Promise<string> {
  // Force use working Apps Script Web App URL
  return 'https://script.google.com/macros/s/AKfycbxvf2IXArzFnDNG0L1aIjzI_HqtdOlKtrDfs0NAL-cmd81BDBGutbR_Usp3EBheKvLd/exec';
  
  // Old code with database issue - commented out
  /*
  try {
    const [settings] = await db.select({ googleSheetId: scannerSettings.googleSheetId }).from(scannerSettings).limit(1);
    if (settings?.googleSheetId) return settings.googleSheetId;
  } catch {}
  return 'https://script.google.com/macros/s/AKfycbxvf2IXArzFnDNG0L1aIjzI_HqtdOlKtrDfs0NAL-cmd81BDBGutbR_Usp3EBheKvLd/exec';
  */
}

export async function appendAttendanceRow(data: {
  tanggal: string;
  nama: string;
  nisnNip: string;
  kelas: string;
  jamDatang: string;
  jamPulang: string;
  status: string;
  role: string;
}) {
  try {
    const googleSheetsUrl = await getGoogleSheetsUrl();
    
    const response = await fetch(googleSheetsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'append',
        tanggal: data.tanggal,
        nama: data.nama,
        nisnNip: data.nisnNip,
        kelas: data.kelas,
        jamDatang: data.jamDatang,
        jamPulang: data.jamPulang,
        status: data.status,
        role: data.role
      })
    });

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Google Sheets append result:', result);
    return result;
  } catch (error: any) {
    console.error('Failed to append to Google Sheets:', error);
    // Don't throw error to avoid breaking attendance flow
    return null;
  }
}

export async function updateAttendanceRow(data: {
  tanggal: string;
  nama: string;
  nisnNip: string;
  kelas: string;
  jamDatang: string;
  jamPulang: string;
  status: string;
  role: string;
}) {
  try {
    const googleSheetsUrl = await getGoogleSheetsUrl();
    
    const response = await fetch(googleSheetsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'update',
        tanggal: data.tanggal,
        nama: data.nama,
        nisnNip: data.nisnNip,
        kelas: data.kelas,
        jamDatang: data.jamDatang,
        jamPulang: data.jamPulang,
        status: data.status,
        role: data.role
      })
    });

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Google Sheets update result:', result);
    return result;
  } catch (error: any) {
    console.error('Failed to update Google Sheets:', error);
    // Don't throw error to avoid breaking attendance flow
    return null;
  }
}

export async function clearAttendanceSheet() {
  try {
    const googleSheetsUrl = await getGoogleSheetsUrl();
    
    const response = await fetch(googleSheetsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'clear'
      })
    });

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Google Sheets clear result:', result);
    return result;
  } catch (error: any) {
    console.error('Failed to clear Google Sheets:', error);
    // Don't throw error to avoid breaking attendance flow
    return null;
  }
}

export async function testGoogleSheetsConnection() {
  try {
    const googleSheetsUrl = await getGoogleSheetsUrl();
    
    const response = await fetch(googleSheetsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'ping'
      })
    });

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Google Sheets ping result:', result);
    return { success: true, message: result.message };
  } catch (error: any) {
    console.error('Failed to ping Google Sheets:', error);
    return { success: false, error: error.message };
  }
}

// Legacy function untuk compatibility
export async function sheetAppendAttendance(data: {
  date: string;
  name: string;
  identifier: string;
  className: string;
  checkInTime: string;
  checkOutTime: string;
  status: string;
  role: string;
}) {
  return appendAttendanceRow({
    tanggal: data.date,
    nama: data.name,
    nisnNip: data.identifier,
    kelas: data.className || '-',
    jamDatang: data.checkInTime || '-',
    jamPulang: data.checkOutTime || '-',
    status: data.status,
    role: data.role
  });
}

export async function sheetUpdateAttendance(date: string, identifier: string, checkOutTime: string, status: string) {
  return updateAttendanceRow({
    tanggal: date,
    nama: '',
    nisnNip: identifier,
    kelas: '',
    jamDatang: '',
    jamPulang: checkOutTime,
    status: status,
    role: ''
  });
}

export async function sheetClearAttendance() {
  return clearAttendanceSheet();
}

export async function testWebhook() {
  return testGoogleSheetsConnection();
}

// Additional exports for compatibility
export async function readUsersFromSheet(tab: string): Promise<string[][]> {
  try {
    const googleSheetsUrl = await getGoogleSheetsUrl();
    
    const response = await fetch(googleSheetsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'read',
        tab: tab
      })
    });

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error: any) {
    console.error('Failed to read from Google Sheets:', error);
    return [];
  }
}

export async function getSheetTabs(): Promise<string[]> {
  try {
    const googleSheetsUrl = await getGoogleSheetsUrl();
    
    const response = await fetch(googleSheetsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'tabs'
      })
    });

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.tabs || [];
  } catch (error: any) {
    console.error('Failed to get sheet tabs:', error);
    return ['Sheet1'];
  }
}

// Additional functions for compatibility
export async function sheetInitHeaders() {
  try {
    const googleSheetsUrl = await getGoogleSheetsUrl();
    
    const response = await fetch(googleSheetsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'init_headers'
      })
    });

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Google Sheets headers initialized:', result);
    return result;
  } catch (error: any) {
    console.error('Failed to init sheet headers:', error);
    return null;
  }
}

// Apps Script code constant
export const APPS_SCRIPT_CODE = `// Paste script ini di Google Sheets: Extensions → Apps Script → Code.gs
// Lalu klik Deploy → New deployment → Web App → Anyone can access → Deploy
// Salin URL deployment dan paste di pengaturan aplikasi

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
      for (let i = values.length - 1; i >= 1; i--) {
        const cellDate = values[i][0];
        const rowDate = cellDate instanceof Date
          ? Utilities.formatDate(cellDate, tz, "yyyy-MM-dd")
          : String(cellDate).trim();
        const rowId = String(values[i][2]).trim().replace(/\.0+$/, "");
        const targetId = String(data.nisnNip).trim().replace(/\.0+$/, "");
        if (rowDate === String(data.tanggal).trim() && rowId === targetId) {
          sheet.getRange(i + 1, 6).setValue(data.jamPulang);
          if (data.status) sheet.getRange(i + 1, 7).setValue(data.status);
          return ok("updated row " + (i + 1));
        }
      }
      // Fallback: row not found, append a new row so checkout is never lost
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
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function ok(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}`;
