# Panduan Deploy ke Hugging Face Spaces (Gratis, Tanpa Kartu Kredit)

Aplikasi akan bisa diakses di internet dengan alamat seperti:
**`https://orynjus-absensi-alfatah.hf.space`**

> Gratis selamanya, tidak perlu kartu kredit, dan bisa dijaga tetap aktif 24/7
> dengan bantuan UptimeRobot (layanan ping gratis).

---

## Langkah 1 — Daftar Hugging Face

1. Buka [https://huggingface.co/join](https://huggingface.co/join)
2. Daftar dengan email (tidak perlu kartu kredit)
3. Verifikasi email
4. Username yang disarankan: `orynjus` (atau sesuaikan)

---

## Langkah 2 — Buat Space Baru

1. Setelah login, klik foto profil → **New Space**
2. Isi:
   - **Space name:** `absensi-alfatah`
   - **License:** MIT
   - **Space SDK:** pilih **Docker**
   - **Visibility:** Public
3. Klik **Create Space**

Space kosong akan dibuat dengan URL:
`https://huggingface.co/spaces/orynjus/absensi-alfatah`

---

## Langkah 3 — Upload Kode ke Space

Space di Hugging Face menggunakan Git. Ada 2 cara:

### Cara A — Lewat GitHub (Lebih Mudah)

1. Di halaman Space, klik tab **Files**
2. Klik **...** → **Link a GitHub repository**
3. Sambungkan ke repo `orynjus/absensi-alfatahtalun`
4. Klik **Sync**

### Cara B — Upload Manual via Git

Di komputer lokal (setelah download kode dari Replit):
```bash
git clone https://huggingface.co/spaces/orynjus/absensi-alfatah
cd absensi-alfatah

# Salin semua file aplikasi ke folder ini
# lalu:
git add .
git commit -m "Deploy aplikasi absensi"
git push
```

---

## Langkah 4 — Tambahkan README untuk Space

Di tab **Files** Space, buka file `README.md` dan ganti isinya dengan:

```
---
title: Absensi Al Fatah Talun
emoji: 📋
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# Sistem Absensi Digital - MTs Al Fatah Talun
```

> File ini sudah tersedia di `deploy/huggingface/README.md` di kode aplikasi.

---

## Langkah 5 — Set Environment Variables (Secrets)

1. Di halaman Space, klik tab **Settings**
2. Scroll ke bagian **Repository secrets**
3. Klik **New secret** untuk setiap baris:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_8Pb2uGKMnEXT@ep-quiet-water-a18n9pwc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `SESSION_SECRET` | `alfatah-rahasia-2024-absensi` |
| `NODE_ENV` | `production` |
| `PORT` | `7860` |
| `FONNTE_TOKEN` | *(token Fonnte, atau kosongkan)* |

---

## Langkah 6 — Tunggu Build

Setelah kode dan secrets diisi:
- Hugging Face otomatis build Docker image (~5-10 menit)
- Status berubah dari **Building** → **Running**
- Aplikasi siap diakses di `https://orynjus-absensi-alfatah.hf.space`

---

## Langkah 7 — Jaga Tetap Aktif (UptimeRobot)

Hugging Face free tier bisa tidur jika tidak ada akses lama.
Gunakan UptimeRobot untuk ping otomatis setiap 5 menit:

1. Daftar gratis di [https://uptimerobot.com](https://uptimerobot.com)
2. Klik **Add New Monitor**
3. Monitor type: **HTTP(s)**
4. Friendly name: `Absensi Alfatah`
5. URL: `https://orynjus-absensi-alfatah.hf.space/api/branding`
6. Monitoring interval: **5 minutes**
7. Klik **Create Monitor**

Sekarang aplikasi akan selalu aktif 24/7!

---

## Selesai!

Buka: **`https://orynjus-absensi-alfatah.hf.space`**

Login:
- Username: `admin`
- Password: `admin123`

> Segera ganti password di **Setelan → Ganti Password**

---

## Update Aplikasi

Setiap kali ada perubahan kode, push ke GitHub:
```bash
git add .
git commit -m "update"
git push
```
Jika Space sudah terhubung ke GitHub, otomatis sync. Jika tidak, upload ulang manual.

---

## Ringkasan Biaya

| Komponen | Layanan | Biaya |
|----------|---------|-------|
| Hosting app | Hugging Face Spaces | **Gratis** |
| Database | Neon PostgreSQL | **Gratis** |
| Jaga aktif | UptimeRobot | **Gratis** |
| Notifikasi WA | Fonnte | Berbayar (opsional) |
| **Total** | | **Rp 0** |
