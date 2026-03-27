// Integration: Google Sheets (Apps Script Web App)
import { db } from './db';
import { scannerSettings } from '@shared/schema';

async function getGoogleSheetsUrl(): Promise<string> {
  try {
    const [settings] = await db.select({ googleSheetId: scannerSettings.googleSheetId }).from(scannerSettings).limit(1);
    if (settings?.googleSheetId) return settings.googleSheetId;
  } catch {}
  // Fallback ke URL yang Anda berikan
  return 'https://script.google.com/macros/s/AKfycbxvf2IXArzFnDNG0L1aIjzI_HqtdOlKtrDfs0NAL-cmd81BDBGutbR_Usp3EBheKvLd/exec';
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
