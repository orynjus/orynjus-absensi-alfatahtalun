import { db } from './db';
import { scannerSettings } from '@shared/schema';

const FONNTE_API_URL = 'https://api.fonnte.com/send';

const BULAN_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

export function formatTanggalIndonesia(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
}

export function normalizePhoneNumber(phone: string): string {
  let p = phone.replace(/[\s\-().+]/g, '');
  if (p.startsWith('0')) {
    p = '62' + p.slice(1);
  } else if (p.startsWith('8')) {
    p = '62' + p;
  }
  return p;
}

async function getFonnteToken(): Promise<string | null> {
  try {
    const [settings] = await db.select({ fonnteToken: scannerSettings.fonnteToken }).from(scannerSettings).limit(1);
    if (settings?.fonnteToken) return settings.fonnteToken;
  } catch {}
  return process.env.FONNTE_TOKEN || null;
}

async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  const token = await getFonnteToken();
  if (!token) {
    console.warn('Fonnte: token tidak dikonfigurasi, skip notifikasi WA.');
    return false;
  }

  const normalizedPhone = normalizePhoneNumber(phone);

  try {
    const response = await fetch(FONNTE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: normalizedPhone,
        message: message,
      }),
    });

    const data = await response.json();
    if (data.status === true) {
      console.log(`Fonnte WA terkirim ke ${normalizedPhone}`);
    } else {
      console.warn(`Fonnte gagal ke ${normalizedPhone}:`, JSON.stringify(data));
    }
    return data.status === true;
  } catch (error) {
    console.error('Gagal kirim WA:', error);
    return false;
  }
}

export async function sendCheckInNotification(
  parentPhone: string,
  studentName: string,
  time: string
): Promise<boolean> {
  const message = `Assalamualaikum,\n\nDiberitahukan bahwa ananda *${studentName}* telah hadir di sekolah pada pukul *${time}*.\n\nTerima kasih.\n\n_Sistem Absensi Digital_`;
  return sendWhatsApp(parentPhone, message);
}

export async function sendLateNotification(
  parentPhone: string,
  studentName: string,
  time: string
): Promise<boolean> {
  const message = `Assalamualaikum,\n\nDiberitahukan bahwa ananda *${studentName}* hadir di sekolah pada pukul *${time}* dan tercatat *TERLAMBAT*.\n\nMohon agar ananda dapat hadir tepat waktu.\n\nTerima kasih.\n\n_Sistem Absensi Digital_`;
  return sendWhatsApp(parentPhone, message);
}

export async function sendCheckOutNotification(
  parentPhone: string,
  studentName: string,
  time: string
): Promise<boolean> {
  const message = `Assalamualaikum,\n\nDiberitahukan bahwa ananda *${studentName}* telah pulang dari sekolah pada pukul *${time}*.\n\nTerima kasih.\n\n_Sistem Absensi Digital_`;
  return sendWhatsApp(parentPhone, message);
}

export async function sendExcuseNotificationToHomeroom(
  homeroomPhone: string,
  homeroomName: string,
  studentName: string,
  studentClass: string,
  type: string,
  date: string,
  description: string,
  driveLink?: string
): Promise<boolean> {
  const typeLabel = type === "sakit" ? "Sakit" : "Izin";
  const tgl = formatTanggalIndonesia(date);
  let message = `Assalamualaikum Bapak/Ibu *${homeroomName}*,\n\nDiberitahukan bahwa siswa kelas *${studentClass}*:\n\nNama: *${studentName}*\nJenis: *${typeLabel}*\nTanggal: *${tgl}*\nKeterangan: ${description}`;
  if (driveLink) {
    message += `\nBukti Foto: ${driveLink}`;
  }
  message += `\n\nSilakan cek dashboard wali kelas untuk menyetujui atau menolak izin ini.\n\nTerima kasih.\n\n_Sistem Absensi Digital_`;
  return sendWhatsApp(homeroomPhone, message);
}

export async function sendAlphaNotification(
  parentPhone: string,
  studentName: string,
  date: string
): Promise<boolean> {
  const tgl = formatTanggalIndonesia(date);
  const message = `Assalamualaikum,\n\nDiberitahukan bahwa ananda *${studentName}* tercatat *TIDAK HADIR (Alpha)* di sekolah pada tanggal *${tgl}* tanpa keterangan.\n\nMohon konfirmasi kepada pihak sekolah jika ada informasi terkait ketidakhadiran ananda.\n\nTerima kasih.\n\n_Sistem Absensi Digital MTs Al Fatah Talun_`;
  return sendWhatsApp(parentPhone, message);
}

export async function sendManualAttendanceNotification(
  parentPhone: string,
  studentName: string,
  type: string,
  date: string,
  time?: string
): Promise<boolean> {
  const statusLabels: Record<string, string> = {
    checkin: "hadir (datang)",
    checkout: "pulang",
    izin: "izin",
    sakit: "sakit",
    alpha: "alpha (tidak hadir)",
    telat: "terlambat",
  };
  const label = statusLabels[type] || type;
  const timeInfo = time ? ` pukul *${time}*` : "";
  const tgl = formatTanggalIndonesia(date);
  const message = `Assalamualaikum,\n\nDiberitahukan bahwa ananda *${studentName}* tercatat *${label}*${timeInfo} pada tanggal *${tgl}* (dicatat manual oleh admin).\n\nTerima kasih.\n\n_Sistem Absensi Digital_`;
  return sendWhatsApp(parentPhone, message);
}

export async function sendTestNotification(phone: string): Promise<{ success: boolean; message: string; normalizedPhone: string }> {
  const normalizedPhone = normalizePhoneNumber(phone);
  const token = await getFonnteToken();
  if (!token) {
    return { success: false, message: 'Token Fonnte belum dikonfigurasi.', normalizedPhone };
  }
  try {
    const response = await fetch(FONNTE_API_URL, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: normalizedPhone,
        message: `✅ *Tes Notifikasi WA*\n\nSistem Absensi Digital MTs Al Fatah Talun berhasil terhubung ke Fonnte.\n\nPesan ini adalah tes otomatis. Abaikan jika tidak diharapkan.\n\n_${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}_`,
      }),
    });
    const data = await response.json();
    if (data.status === true) {
      return { success: true, message: `WA tes berhasil dikirim ke ${normalizedPhone}`, normalizedPhone };
    } else {
      return { success: false, message: `Fonnte error: ${JSON.stringify(data)}`, normalizedPhone };
    }
  } catch (err: any) {
    return { success: false, message: `Koneksi gagal: ${err.message}`, normalizedPhone };
  }
}
