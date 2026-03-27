# Integrasi Gambar Google Drive untuk Izin Siswa

## Overview
Sistem sekarang secara otomatis menyisipkan gambar default dari Google Drive ketika siswa mengajukan izin tanpa mengunggah foto bukti.

## Konfigurasi
- **Default Folder ID**: `11vJgEVtglUa50h9P1hZcVf0ceqeVq5tJ`
- **Default Image URL**: `https://drive.google.com/file/d/11vJgEVtglUa50h9P1hZcVf0ceqeVq5tJ/view`

## Fitur yang Ditambahkan

### 1. Server-side (routes.ts)
- Otomatis menggunakan gambar default jika siswa tidak mengunggah foto
- Menyimpan `driveFileId` dan `photoUrl` ke database

### 2. Student Dashboard (student-dashboard.tsx)
- Menampilkan gambar bukti izin di riwayat izin
- Gambar dapat diklik untuk membuka di tab baru
- Responsive design dengan ukuran maksimal 48px tinggi

### 3. Homeroom Dashboard (homeroom-dashboard.tsx)
- Menampilkan thumbnail gambar untuk izin yang pending
- Support desktop dan mobile view
- Preview gambar dalam modal
- Link untuk membuka gambar di Google Drive

## Cara Kerja

1. **Siswa mengajukan izin**:
   - Jika upload foto → Upload ke Google Drive folder yang dikonfigurasi
   - Jika tidak upload foto → Gunakan gambar default dari folder ID

2. **Wali kelas melihat izin**:
   - Thumbnail gambar otomatis muncul
   - Klik untuk preview atau buka di Drive

3. **Siswa melihat riwayat**:
   - Gambar bukti ditampilkan di riwayat izin
   - Klik untuk membuka di tab baru

## Customization
Untuk mengganti gambar default:
1. Upload gambar baru ke Google Drive
2. Copy file ID dari URL
3. Update `DEFAULT_FOLDER_ID` di `server/googleDrive.ts`
4. Update URL di `server/routes.ts`

## Requirements
- Google Drive API sudah dikonfigurasi
- Folder Google Drive sudah di-share dengan akses yang tepat
- Replit Connectors sudah ter-setup dengan benar
