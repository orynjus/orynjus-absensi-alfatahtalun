# Deploy ke Railway - Quick Guide

## 🚀 Langkah 1: Setup Railway

1. **Sign up** di [railway.app](https://railway.app)
2. **Connect GitHub** account
3. **Click "New Project" → "Deploy from GitHub repo"**
4. **Pilih repository:** `orynjus-absensi-alfatahtalun`

## ⚙️ Langkah 2: Environment Variables

Di Railway dashboard, tambahkan:

```
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:npg_x9bFvPBOco3I@ep-little-firefly-a10aet33-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PORT=3000
SESSION_SECRET=absensi_secret_key_2024
```

## 🔧 Langkah 3: Build Settings

```
Build Command: npm run build
Start Command: npm start
```

## ✅ Langkah 4: Deploy

1. Railway akan auto-detect Node.js
2. Tunggu build process (2-3 menit)
3. Aplikasi akan online di URL Railway

## 🌐 Result

Aplikasi akan accessible di:
`https://your-app-name.up.railway.app`

## 📱 Test Aplikasi

1. Buka URL Railway
2. Login dengan: `admin/admin123`
3. Test fitur absensi
4. Test import Google Sheets

**Selesai!** 🎉
