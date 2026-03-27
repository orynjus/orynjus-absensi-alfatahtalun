# Panduan Deploy — Sistem Absensi Digital
## MTs Al Fatah Talun

---

## Persyaratan Sistem

| Komponen | Versi Minimum | Keterangan |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| PostgreSQL | 14+ | https://www.postgresql.org |
| PM2 (opsional) | - | `npm install -g pm2` |
| RAM | 512 MB | Minimal 1 GB disarankan |
| OS | Windows 10 / Ubuntu 20.04+ / Debian 11+ | |

---

## Cara Deploy (Otomatis)

### Linux / macOS
```bash
# 1. Masuk ke folder project
cd /path/ke/folder/project

# 2. Beri izin eksekusi
chmod +x deploy/deploy-local.sh

# 3. Jalankan script (ikuti petunjuk yang muncul)
bash deploy/deploy-local.sh
```

Script akan otomatis:
- Mengecek Node.js dan PostgreSQL
- Membuat file `.env` (interaktif)
- Install dependencies
- Build aplikasi
- Sinkronisasi database
- Menjalankan dengan PM2 (atau langsung jika PM2 tidak ada)

---

## Cara Deploy (Manual, Langkah per Langkah)

### Langkah 1 — Install Node.js

**Ubuntu / Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # pastikan muncul v20.x.x
```

**Windows:**
Download installer dari https://nodejs.org → pilih versi LTS → install

---

### Langkah 2 — Install PostgreSQL

**Ubuntu / Debian:**
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download dari https://www.postgresql.org/download/windows/ → install dengan pgAdmin

---

### Langkah 3 — Buat Database

```bash
# Masuk ke PostgreSQL
sudo -u postgres psql        # Linux
# atau buka pgAdmin di Windows

# Jalankan perintah berikut di dalam psql:
CREATE DATABASE absensi_alfatah;
CREATE USER absensi_user WITH PASSWORD 'password_kuat_anda';
GRANT ALL PRIVILEGES ON DATABASE absensi_alfatah TO absensi_user;
\q
```

---

### Langkah 4 — Konfigurasi Environment

Buat file `.env` di folder root project:

```bash
cp .env.example .env
nano .env    # atau buka dengan text editor
```

Isi file `.env`:

```env
# === DATABASE ===
DATABASE_URL=postgresql://absensi_user:password_kuat_anda@localhost:5432/absensi_alfatah

# === SERVER ===
NODE_ENV=production
PORT=5000

# === SESSION (wajib diganti!) ===
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=ganti_dengan_string_acak_panjang_minimal_32_karakter

# === FONNTE WhatsApp (opsional) ===
# Daftar di https://fonnte.com → salin token perangkat
FONNTE_TOKEN=
```

> **Penting:** Ganti `SESSION_SECRET` dengan string acak. Generate dengan:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

### Langkah 5 — Install Dependencies & Build

```bash
# Install semua package
npm install

# Build aplikasi (frontend + backend)
npm run build

# Sinkronisasi schema database
npm run db:push
```

---

### Langkah 6 — Jalankan Aplikasi

#### Opsi A: Dengan PM2 (Disarankan — berjalan di background & auto-restart)

```bash
# Install PM2 global
npm install -g pm2

# Buat file konfigurasi PM2
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'absensi-alfatah',
    script: './dist/index.cjs',
    instances: 1,
    autorestart: true,
    watch: false,
    env_file: './.env',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
EOF

# Jalankan
pm2 start ecosystem.config.cjs

# Aktifkan auto-start saat server reboot
pm2 startup
pm2 save
```

#### Opsi B: Tanpa PM2 (langsung, akan berhenti saat terminal ditutup)

```bash
node dist/index.cjs
```

---

### Langkah 7 — Akses Aplikasi

Buka browser, akses:
```
http://localhost:5000
```

Jika dari komputer lain di jaringan yang sama:
```
http://[IP-SERVER]:5000
```

Cek IP server:
```bash
hostname -I    # Linux
ipconfig       # Windows
```

---

## Login Default Admin

| Field | Nilai |
|---|---|
| Username | `admin` |
| Password | `admin123` |

> **Segera ganti password** setelah login pertama melalui: Setelan → Password

---

## Perintah Manajemen PM2

```bash
pm2 status                          # Lihat status semua aplikasi
pm2 logs absensi-alfatah            # Lihat log real-time
pm2 logs absensi-alfatah --lines 100  # Log 100 baris terakhir
pm2 restart absensi-alfatah         # Restart aplikasi
pm2 stop absensi-alfatah            # Stop aplikasi
pm2 delete absensi-alfatah          # Hapus dari PM2
```

---

## Update Aplikasi

Jika ada pembaruan kode:

```bash
# Masuk ke folder project
cd /path/ke/folder/project

# Ambil update (jika menggunakan git)
git pull

# atau salin file baru secara manual

# Jalankan script update
bash deploy/update.sh
```

Script `update.sh` akan otomatis: install deps → build → migrasi db → restart PM2.

---

## Konfigurasi Lanjutan (via Admin Dashboard)

Setelah aplikasi berjalan, login sebagai admin lalu buka **Setelan** untuk:

| Tab | Fungsi |
|---|---|
| **Tampilan** | Upload logo sekolah, gambar latar, ubah nama sekolah |
| **Scanner & PIN** | Atur jam masuk/keluar, PIN kunci scanner |
| **Jadwal** | Atur hari aktif sekolah per kelas |
| **Hari Libur** | Tambah/hapus hari libur nasional |
| **Fonnte** | Token WhatsApp untuk notifikasi otomatis |
| **Google** | ID Folder Drive & Sheet untuk sinkronisasi |
| **Password** | Ganti password admin |

---

## Troubleshooting

### Aplikasi tidak bisa diakses
```bash
# Cek apakah sudah berjalan
pm2 status
# atau
netstat -tlnp | grep 5000     # Linux
netstat -ano | findstr 5000   # Windows
```

### Error koneksi database
```bash
# Cek apakah PostgreSQL aktif
sudo systemctl status postgresql   # Linux
# atau buka Services di Windows

# Test koneksi manual
psql "postgresql://user:password@localhost:5432/absensi_alfatah" -c "SELECT 1"
```

### Port 5000 sudah terpakai
Edit file `.env`, ganti `PORT=5000` ke port lain (misal `PORT=3000`), lalu restart.

### Reset password admin (jika lupa)
```bash
# Masuk ke psql
psql "$DATABASE_URL"

# Update password (hash bcrypt dari 'admin123')
UPDATE users SET password = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.' WHERE username = 'admin';
\q
```

### Lihat log error
```bash
pm2 logs absensi-alfatah --err     # Hanya log error
```

---

## Struktur File Penting

```
project/
├── dist/               ← Hasil build (generate dengan npm run build)
│   ├── index.cjs       ← Server backend
│   └── public/         ← Frontend (HTML, JS, CSS)
├── uploads/            ← File upload (logo, background) — jangan dihapus
├── .env                ← Konfigurasi environment (rahasia!)
├── ecosystem.config.cjs ← Konfigurasi PM2
└── deploy/
    ├── deploy-local.sh ← Script setup & deploy awal
    └── update.sh       ← Script update aplikasi
```

---

## Catatan Keamanan

- File `.env` **jangan pernah** dibagikan atau di-upload ke internet
- Ganti `SESSION_SECRET` dengan string acak unik
- Ganti password admin default segera setelah deploy
- Jika server bisa diakses dari internet, pertimbangkan menggunakan HTTPS (Nginx + Let's Encrypt)

---

*Dikembangkan oleh Bangkit Cerdas Mandiri*
