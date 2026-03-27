import { db } from './db';
import { scannerSettings } from '@shared/schema';

async function getWebhookUrl(): Promise<string | null> {
  try {
    const [settings] = await db.select({ sheetsWebhookUrl: scannerSettings.sheetsWebhookUrl }).from(scannerSettings).limit(1);
    return settings?.sheetsWebhookUrl || null;
  } catch {
    return null;
  }
}

async function postToWebhook(payload: object): Promise<void> {
  const url = await getWebhookUrl();
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Apps Script webhook error:', err);
  }
}

export async function sheetAppendAttendance(data: {
  date: string;
  name: string;
  identifier: string;
  className: string;
  checkInTime: string;
  checkOutTime: string;
  status: string;
  role: string;
}): Promise<void> {
  await postToWebhook({
    action: 'append',
    tanggal: data.date,
    nama: data.name,
    nisnNip: data.identifier,
    kelas: data.className || '-',
    jamDatang: data.checkInTime || '-',
    jamPulang: data.checkOutTime || '-',
    status: data.status,
    role: data.role,
  });
}

export async function sheetUpdateAttendance(date: string, identifier: string, checkOutTime: string, status: string, extra?: { nama?: string; kelas?: string; role?: string }): Promise<void> {
  await postToWebhook({
    action: 'update',
    tanggal: date,
    nisnNip: identifier,
    jamPulang: checkOutTime,
    status,
    nama: extra?.nama || '-',
    kelas: extra?.kelas || '-',
    role: extra?.role || '-',
  });
}

export async function sheetInitHeaders(): Promise<void> {
  await postToWebhook({ action: 'init_headers' });
}

export async function sheetClearAttendance(): Promise<void> {
  await postToWebhook({ action: 'clear' });
}

export async function testWebhook(): Promise<{ ok: boolean; message: string }> {
  const url = await getWebhookUrl();
  if (!url) return { ok: false, message: 'URL webhook belum dikonfigurasi' };
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ping' }),
    });
    const text = await resp.text();
    if (resp.ok) return { ok: true, message: 'Webhook berfungsi dengan baik' };
    return { ok: false, message: `HTTP ${resp.status}: ${text.slice(0, 100)}` };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

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
        const rowId = String(values[i][2]).trim().replace(/\\.0+$/, "");
        const targetId = String(data.nisnNip).trim().replace(/\\.0+$/, "");
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
