# Panduan Deploy ke Render.com

Aplikasi akan bisa diakses di internet:
**`https://absensi-alfatah.onrender.com`**

> **Catatan:** Free tier Render memerlukan verifikasi kartu kredit/debit (bisa pakai kartu virtual dari Jenius, LINE Bank, Blu, atau SeaBank — tidak ditagih).

---

## Yang Sudah Siap

- ✅ Database Neon sudah dibuat dan terisi data awal
- ✅ Kode sudah di GitHub: `github.com/orynjus/absensi-alfatahtalun`
- ✅ File `render.yaml` sudah ada di repo

---

## Langkah 1 — Daftar Render

1. Buka [https://render.com](https://render.com)
2. Klik **Get Started for Free**
3. Pilih **Sign up with GitHub** → login dengan akun GitHub `orynjus`
4. Izinkan Render mengakses GitHub

---

## Langkah 2 — Buat Web Service

1. Di dashboard Render, klik **New +** → **Web Service**
2. Pilih **Build and deploy from a Git repository**
3. Klik **Connect** di sebelah repo **`absensi-alfatahtalun`**

---

## Langkah 3 — Konfigurasi

Isi pengaturan berikut:

| Pengaturan | Nilai |
|---|---|
| **Name** | `absensi-alfatah` |
| **Region** | Singapore |
| **Branch** | `main` |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

---

## Langkah 4 — Environment Variables

Scroll ke bawah ke bagian **Environment Variables**.
Klik **Add Environment Variable** untuk setiap baris:

| Key | Value |
|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_8Pb2uGKMnEXT@ep-quiet-water-a18n9pwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `SESSION_SECRET` | `alfatah-rahasia-2024-absensi` |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `FONNTE_TOKEN` | *(token Fonnte, kosongkan jika tidak pakai)* |

---

## Langkah 5 — Deploy

1. Klik **Create Web Service**
2. Tunggu proses build selesai (~5 menit)
3. Status berubah dari **Building** → **Live** ✅

---

## Selesai!

Buka browser, akses:
**`https://absensi-alfatah.onrender.com`**

Login pertama:
- Username: `admin`
- Password: `admin123`

> Segera ganti password di **Setelan → Ganti Password**

---

## Catatan Free Tier Render

- Aplikasi "tidur" otomatis jika tidak ada akses selama **15 menit**
- Saat pertama dibuka setelah tidur, butuh **~30 detik** untuk bangun
- Untuk mencegah tidur, daftar gratis di [uptimerobot.com](https://uptimerobot.com) dan atur ping ke `https://absensi-alfatah.onrender.com/api/branding` setiap 5 menit

---

## Jika Ada Update Kode

Setiap ada perubahan di Replit, push ke GitHub:
```
git add .
git commit -m "update"
git push
```
Render otomatis deploy ulang setiap ada push ke branch `main`.
