# 🚀 Koyeb Deployment Setup

## Environment Variables for Koyeb

Copy dan paste environment variables berikut di Koyeb dashboard:

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-little-firefly-a10aet33-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Server
PORT=5000
NODE_ENV=production

# Google Drive OAuth2
GOOGLE_DRIVE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_DRIVE_REDIRECT_URI=https://absensi-alfatahtalun-username.koyeb.app/auth/google/callback

# Optional
FONNTE_TOKEN=your_fonnte_token_here
```

## Important Notes:

1. **Ganti `username`** dengan Koyeb username Anda
2. **Simpan credentials** dengan aman
3. **Update Google Cloud Console** dengan redirect URI baru

## Google Cloud Console Update:

1. Buka: https://console.cloud.google.com/
2. APIs & Services → Credentials
3. Edit OAuth 2.0 Client ID
4. Add redirect URI: `https://absensi-alfatahtalun-username.koyeb.app/auth/google/callback`
5. Save
