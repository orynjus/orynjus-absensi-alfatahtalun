# Panduan Jalankan Aplikasi di Komputer Sekolah

Aplikasi dijalankan langsung di komputer sekolah dan bisa diakses dari HP/komputer lain
lewat jaringan WiFi sekolah — **gratis total, tidak perlu internet**.

---

## Yang Dibutuhkan

- Komputer/laptop dengan **Windows 10/11**
- RAM minimal **2 GB** (disarankan 4 GB)
- Komputer **nyala terus** selama jam sekolah
- Semua perangkat (HP siswa, HP guru) harus terhubung ke **WiFi yang sama**

---

## Langkah 1 — Install Node.js

1. Buka [https://nodejs.org](https://nodejs.org)
2. Download versi **LTS** (misal: 20.x.x LTS)
3. Install dengan klik Next → Next → Finish
4. Verifikasi: buka **Command Prompt**, ketik:
   ```
   node --version
   ```
   Harus muncul angka versi, misal `v20.19.0`

---

## Langkah 2 — Install PostgreSQL

1. Buka [https://www.postgresql.org/download/windows](https://www.postgresql.org/download/windows)
2. Klik **Download the installer** → pilih versi terbaru
3. Install:
   - Port: `5432` (default)
   - Password untuk superuser: ingat baik-baik! misal `postgres123`
   - Locale: biarkan default
4. Di akhir instalasi, **jangan centang** Stack Builder → klik Finish

---

## Langkah 3 — Buat Database

1. Buka **pgAdmin** (terinstall bersama PostgreSQL)
2. Klik **Servers → PostgreSQL → Databases**
3. Klik kanan **Databases** → **Create → Database**
4. Name: `absensi`
5. Klik **Save**

---

## Langkah 4 — Download Kode Aplikasi

1. Buka [https://github.com/orynjus/absensi-alfatahtalun](https://github.com/orynjus/absensi-alfatahtalun)
2. Klik tombol hijau **Code** → **Download ZIP**
3. Ekstrak ke folder, misal: `C:\absensi`

---

## Langkah 5 — Konfigurasi

1. Di folder `C:\absensi`, buat file baru bernama **`.env`**
2. Isi dengan:
   ```
   DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/absensi
   SESSION_SECRET=alfatah-rahasia-2024
   NODE_ENV=production
   PORT=5000
   ```
   > Ganti `postgres123` dengan password PostgreSQL yang Anda buat tadi

---

## Langkah 6 — Install & Setup Aplikasi

Buka **Command Prompt**, masuk ke folder aplikasi:
```
cd C:\absensi
```

Install dependencies:
```
npm install
```

Buat tabel database:
```
npm run db:push
```

Build aplikasi:
```
npm run build
```

---

## Langkah 7 — Jalankan Aplikasi

```
npm start
```

Jika berhasil, akan muncul:
```
Server running on port 5000
```

---

## Langkah 8 — Akses Aplikasi

**Di komputer server:**
Buka browser → `http://localhost:5000`

**Di HP/komputer lain (dalam 1 WiFi):**
1. Di komputer server, cari IP address — buka Command Prompt, ketik:
   ```
   ipconfig
   ```
   Cari **IPv4 Address**, misal: `192.168.1.100`

2. Di HP/komputer lain, buka browser:
   ```
   http://192.168.1.100:5000
   ```

**Login admin:**
- Username: `admin`
- Password: `admin123`

---

## Agar Otomatis Berjalan Saat Komputer Dinyalakan

1. Buka **Task Scheduler** (cari di Start Menu)
2. Klik **Create Basic Task**
3. Name: `Absensi Server`
4. Trigger: **When the computer starts**
5. Action: **Start a program**
6. Program: `cmd.exe`
7. Arguments: `/c "cd /d C:\absensi && npm start"`
8. Finish

---

## Backup Data

Data tersimpan di PostgreSQL lokal. Untuk backup rutin:

1. Buka **Command Prompt**
2. Jalankan:
   ```
   pg_dump -U postgres absensi > C:\backup-absensi.sql
   ```

Untuk restore:
```
psql -U postgres absensi < C:\backup-absensi.sql
```

---

## Catatan Penting

| Hal | Penjelasan |
|-----|-----------|
| **Notifikasi WA** | Memerlukan internet (Fonnte) |
| **Google Sheets** | Memerlukan internet |
| **QR Scan & Absensi** | Bisa offline total |
| **Akses dari luar sekolah** | Tidak bisa (hanya 1 jaringan) |
| **Jika ingin akses dari luar** | Perlu setting router/modem sekolah |
