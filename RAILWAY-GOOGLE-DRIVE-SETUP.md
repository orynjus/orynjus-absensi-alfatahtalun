# 🚀 Railway Google Drive OAuth2 Setup

## 📋 Langkah 1: Google Cloud Console

1. **Buka Google Cloud Console**: https://console.cloud.google.com/
2. **APIs & Services → Credentials**
3. **Klik OAuth 2.0 Client ID** Anda
4. **Authorized redirect URIs → Add URI**:
   ```
   https://clever-generosity-production-b5a4.up.railway.app/auth/google/callback
   ```
5. **Save**

## 📋 Langkah 2: Railway Environment Variables

Di Railway dashboard, tambahkan environment variables:

1. **Buka Railway Project**: https://railway.app/project/your-project
2. **Settings → Variables**
3. **Add Variables**:

```bash
# Google Drive OAuth2
GOOGLE_DRIVE_CLIENT_ID=your_google_client_id_here
GOOGLE_DRIVE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_DRIVE_REDIRECT_URI=https://clever-generosity-production-b5a4.up.railway.app/auth/google/callback

# Database (sudah ada)
DATABASE_URL=postgresql://neondb_owner:npg_x9bFvPBOco3I@ep-little-firefly-a10aet33-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PORT=3000

# Optional
FONNTE_TOKEN=your_fonnte_token_here
```

## 📋 Langkah 3: Deploy & Test

1. **Redeploy** Railway (otomatis setelah push)
2. **Buka aplikasi**: https://clever-generosity-production-b5a4.up.railway.app
3. **Login Admin**: `admin` / `admin123`
4. **Settings → Google**
5. **Klik "Hubungkan Google Drive"**
6. **Login dengan Google account**
7. **Allow permissions**

## 🔧 Troubleshooting

### Error: "redirect_uri_mismatch"
**Solusi**: Pastikan redirect URI di Google Cloud Console sama dengan Railway URL

### Error: "Access denied"
**Solusi**: 
1. Check Google Drive API enabled
2. Verify environment variables di Railway
3. Re-deploy Railway

### Error: "Authorization failed"
**Solusi**:
1. Verify Railway environment variables
2. Check Google Cloud Console setup
3. Restart Railway service

## 🎯 Test Upload Gambar

Setelah Google Drive terhubung:

1. **Login sebagai siswa**
2. **Ajukan izin (sakit/izin)**
3. **Upload foto bukti**
4. **Cek folder Google Drive**:
   ```
   Absensi App/
   └── Siswa_[studentId]/
       ├── sakit_2024-03-27_photo1.jpg
       └── izin_2024-03-27_photo2.jpg
   ```

## 📱 Mobile Testing

- Buka https://clever-generosity-production-b5a4.up.railway.app di mobile
- Test upload gambar izin
- Cek responsive UI

## 🚀 Production Features

✅ **OAuth2 Authentication** - Secure Google Drive access
✅ **Auto Token Refresh** - Persistent connection
✅ **Organized Folders** - Per student structure
✅ **Public Sharing** - Image visibility
✅ **Mobile Responsive** - Cross-device compatible
✅ **Error Handling** - Graceful failures

---

**Aplikasi siap untuk production dengan Google Drive integration!** 🎉
