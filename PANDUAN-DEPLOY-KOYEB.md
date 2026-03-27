# Panduan Deploy ke Koyeb

## Persiapan
1. Pastikan kode sudah di-push ke GitHub
2. Siapkan environment variables:
   - `FONNTE_TOKEN` (jika menggunakan WhatsApp)
   - `DATABASE_URL` (PostgreSQL)

## Langkah Deploy

### 1. Buat Service di Koyeb
- Login ke dashboard Koyeb
- Klik "Create Service"
- Pilih "Docker"
- Connect repository GitHub

### 2. Konfigurasi Docker
- Dockerfile path: `Dockerfile`
- Context: `/`
- Port: `5000`

### 3. Environment Variables
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:port/db
SESSION_SECRET=<auto-generate>
FONNTE_TOKEN=<token-anda>
```

### 4. Deploy
- Klik "Deploy"
- Tunggu build selesai

## Database
Koyeb menyediakan PostgreSQL gratis:
- Buat database service
- Copy connection string
- Set sebagai `DATABASE_URL`

## Custom Domain (Opsional)
- Tambahkan custom domain di Koyeb
- Update DNS records

## Monitoring
- Cek logs di dashboard Koyeb
- Health check otomatis di `/`
