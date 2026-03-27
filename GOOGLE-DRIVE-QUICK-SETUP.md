# 🚀 Quick Setup Google Drive OAuth2

## 📋 Langkah 1: Google Cloud Console

1. **Buka Google Cloud Console**
   - https://console.cloud.google.com/
   - Pilih project atau buat baru

2. **Enable Google Drive API**
   - APIs & Services → Library
   - Cari "Google Drive API"
   - Klik "Enable"

3. **Create OAuth2 Credentials**
   - APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Application type: **Web application**
   - Authorized redirect URIs:
     ```
     http://localhost:3000/auth/google/callback
     https://yourdomain.com/auth/google/callback
     ```
   - Klik "Create"

## 📋 Langkah 2: Configure Environment

Edit file `.env` di root project:

```bash
# Ganti dengan credentials dari Google Cloud Console
GOOGLE_DRIVE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=GOCSPX-abc123def456
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Database dan port (sudah ada)
DATABASE_URL=postgresql://...
PORT=3000
```

## 📋 Langkah 3: Connect di Admin Dashboard

1. **Start server**
   ```bash
   npm start
   # atau
   npm run dev
   ```

2. **Buka aplikasi**
   - http://localhost:3000
   - Login sebagai admin

3. **Setup Google Drive**
   - Menu Settings → Google
   - Klik "Hubungkan Google Drive"
   - Login dengan Google account
   - Allow permissions

## 🧪 Testing

1. **Test Upload Gambar**
   - Login sebagai siswa
   - Ajukan izin (sakit/izin)
   - Upload foto bukti
   - Cek di Google Drive folder

2. **Cek Folder Structure**
   ```
   Absensi App/
   └── Siswa_[studentId]/
       ├── sakit_2024-03-27_photo1.jpg
       └── izin_2024-03-27_photo2.jpg
   ```

## 🔧 Troubleshooting

### Error: "Authorization Error"
**Penyebab**: Environment variables belum diset
**Solusi**: 
1. Check file `.env`
2. Restart server
3. Verify Google Cloud Console credentials

### Error: "Access denied"
**Penyebab**: OAuth scope tidak sesuai
**Solusi**:
1. Re-create OAuth credentials
2. Ensure redirect URI matches
3. Check Google Drive API enabled

### Error: "Upload failed"
**Penyebab**: Token expired
**Solusi**:
1. Re-authenticate di admin dashboard
2. Check `google-credentials.json` file
3. Verify Google account permissions

## 📱 Mobile Testing

Untuk testing di mobile:
1. Buka http://[your-ip]:3000
2. Login dan test upload
3. Cek responsive UI

## 🚀 Deployment

Untuk production:
1. Update redirect URI di Google Cloud Console
2. Set environment variables di hosting
3. Test OAuth flow di production domain

---

**Need Help?** Check server logs untuk detailed error messages.
