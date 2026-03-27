# Panduan Setup OAuth2 Google Drive untuk Upload Izin Siswa

## Overview
Sistem sekarang menggunakan OAuth2 Google API untuk upload gambar izin siswa ke Google Drive dengan authentication yang aman dan persisten.

## 🚀 Langkah Setup

### 1. Google Cloud Console Setup

1. **Buat Project Google Cloud**
   - Buka [Google Cloud Console](https://console.cloud.google.com/)
   - Klik "Create Project"
   - Beri nama project (misal: "Absensi App")

2. **Enable Google Drive API**
   - Di dashboard project, buka "APIs & Services" → "Library"
   - Cari "Google Drive API"
   - Klik "Enable"

3. **Buat OAuth2 Credentials**
   - Buka "APIs & Services" → "Credentials"
   - Klik "Create Credentials" → "OAuth client ID"
   - Pilih "Web application"
   - Tambahkan redirect URI:
     ```
     http://localhost:5000/auth/google/callback
     https://yourdomain.com/auth/google/callback
     ```
   - Klik "Create"
   - **Copy Client ID dan Client Secret**

### 2. Environment Variables

Tambahkan ke file `.env`:
```bash
# Google Drive OAuth2
GOOGLE_DRIVE_CLIENT_ID=your_client_id_here
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret_here
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:5000/auth/google/callback
```

### 3. Installation Dependencies

Install package yang dibutuhkan:
```bash
npm install googleapis@^140.0.0
```

### 4. Authentication Flow

#### Step 1: Admin Connect Google Drive
Admin perlu menghubungkan Google Drive melalui dashboard:

1. **Get Auth URL**
   ```javascript
   GET /api/google-drive/auth-url
   ```

2. **Redirect ke Google OAuth**
   - Buka URL yang didapat
   - Login dengan Google account
   - Grant permission untuk Google Drive

3. **Callback Handling**
   ```javascript
   POST /api/google-drive/callback
   Body: { code: "authorization_code" }
   ```

4. **Check Status**
   ```javascript
   GET /api/google-drive/status
   Response: { connected: true/false }
   ```

### 5. Cara Kerja Upload

#### Server-side Process:
1. **Siswa upload foto** → `POST /api/excuses`
2. **System authenticate** → Check stored credentials
3. **Create folder structure**:
   ```
   Absensi App/
   └── Siswa_[studentId]/
       ├── sakit_2024-03-27_photo1.jpg
       ├── izin_2024-03-27_photo2.jpg
       └── ...
   ```
4. **Upload file** → Google Drive API
5. **Set permissions** → Public view
6. **Save metadata** → Database (fileId, webViewLink)

#### Client-side Display:
- **Student Dashboard**: Riwayat izin dengan gambar
- **Homeroom Dashboard**: Thumbnail gambar untuk approval
- **Mobile responsive**: Optimized untuk semua device

## 🔧 Fitur yang Tersedia

### Authentication Features:
- ✅ **Auto-refresh token** - Refresh otomatis saat expired
- ✅ **Persistent storage** - Credentials tersimpan di file
- ✅ **Secure handling** - Refresh token protection
- ✅ **Status checking** - Cek koneksi status

### Upload Features:
- ✅ **Organized folders** - Per student folder structure
- ✅ **Unique filenames** - Timestamp-based naming
- ✅ **Public permissions** - Otomatis set view access
- ✅ **Error handling** - Graceful failure handling
- ✅ **Default fallback** - Gambar default jika upload gagal

### Display Features:
- ✅ **Thumbnail generation** - Google Drive thumbnail API
- ✅ **Mobile responsive** - Optimized untuk mobile
- ✅ **Preview modal** - Full-size preview
- ✅ **Click to open** - Buka di Google Drive

## 🛠 Troubleshooting

### Common Issues:

1. **"Google Drive authentication failed"**
   - Check environment variables
   - Verify OAuth credentials
   - Ensure redirect URI matches

2. **"Upload failed: No file ID returned"**
   - Check Google Drive API enabled
   - Verify folder permissions
   - Check file size limits (5MB max)

3. **"Refresh token expired"**
   - Re-authenticate through admin dashboard
   - Check stored credentials file

4. **"Permission denied"**
   - Verify OAuth scopes include drive.file
   - Check user has Drive access

### Debug Commands:

```bash
# Check credentials file
cat google-credentials.json

# Test API connection
curl http://localhost:5000/api/google-drive/status

# Check logs
npm run dev
```

## 📁 File Structure

```
server/
├── googleDrive.ts          # OAuth2 & upload logic
├── routes.ts              # API endpoints
└── google-credentials.json # Stored tokens (auto-generated)

client/src/pages/
├── student-dashboard.tsx  # Student view
└── homeroom-dashboard.tsx # Admin view
```

## 🔐 Security Notes

- **Refresh tokens** stored securely in server file
- **OAuth scopes** limited to drive.file only
- **No credentials** exposed to client-side
- **Auto-refresh** prevents token expiration
- **Admin-only** authentication setup

## 📱 Mobile Optimization

- **Responsive thumbnails** untuk mobile view
- **Touch-friendly** image preview
- **Optimized loading** dengan Google Drive CDN
- **Fallback handling** untuk koneksi lambat

## 🚀 Next Steps

1. **Setup OAuth credentials** di Google Cloud Console
2. **Configure environment variables**
3. **Test authentication flow** di admin dashboard
4. **Upload test images** untuk verifikasi
5. **Deploy dengan credentials** yang aman

---

**Support**: Jika ada masalah, cek logs server atau hubungi admin untuk re-authentication.
