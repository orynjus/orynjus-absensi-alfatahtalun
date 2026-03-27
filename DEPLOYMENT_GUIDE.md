# Panduan Deployment Aplikasi Absensi di Server Sekolah

## 📋 Persyaratan Sistem

### Minimum Hardware Requirements
- **CPU**: 2 cores atau lebih
- **RAM**: 4 GB minimum (8 GB recommended)
- **Storage**: 20 GB free space
- **Network**: Koneksi internet stabil

### Software Requirements
- **OS**: Windows Server 2019+, Ubuntu 20.04+, atau CentOS 8+
- **Node.js**: v18.x atau lebih tinggi
- **PostgreSQL**: v13+ atau Neon Cloud Database
- **PM2**: Process Manager untuk production
- **Nginx**: Reverse proxy (recommended)

## 🗄️ Opsi Database

### Opsi 1: Neon Cloud (Recommended)
```bash
# Gunakan existing connection string
DATABASE_URL=postgresql://neondb_owner:xxx@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### Opsi 2: Local PostgreSQL
```bash
# Install PostgreSQL di server
sudo apt update
sudo apt install postgresql postgresql-contrib

# Buat database
sudo -u postgres createdb absensi_db
sudo -u postgres createuser absensi_user
sudo -u postgres psql -c "ALTER USER absensi_user PASSWORD 'password_strong';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE absensi_db TO absensi_user;"
```

## 🚀 Langkah-Langkah Deployment

### 1. Persiapan Server

#### Untuk Ubuntu/Debian:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install PostgreSQL (jika local)
sudo apt install postgresql postgresql-contrib -y
```

#### Untuk Windows Server:
```powershell
# Download dan install Node.js dari https://nodejs.org
# Install PM2 globally
npm install -g pm2

# Install PostgreSQL dari https://www.postgresql.org/download/windows/
```

### 2. Setup Aplikasi

```bash
# Clone repository
git clone https://github.com/username/absensi-alfatahtalun.git
cd absensi-alfatahtalun

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
nano .env
```

### 3. Konfigurasi Environment Variables

```bash
# .env file
DATABASE_URL=postgresql://username:password@localhost:5432/absensi_db
PORT=3000
NODE_ENV=production
SESSION_SECRET=your_super_secret_session_key_here

# Google Sheets Integration (opsional)
GOOGLE_SHEETS_CLIENT_ID=your_google_client_id
GOOGLE_SHEETS_CLIENT_SECRET=your_google_client_secret
GOOGLE_SHEETS_REDIRECT_URI=http://your-domain.com/auth/google/callback

# WhatsApp Integration (opsional)
FONNTE_TOKEN=your_fonnte_token

# Google Drive Integration (opsional)
GOOGLE_DRIVE_CLIENT_ID=your_drive_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_drive_client_secret
```

### 4. Build & Database Setup

```bash
# Build aplikasi
npm run build

# Generate migrations
npx drizzle-kit generate

# Push schema ke database
npm run db:push

# (Opsional) Seed initial data
npm run seed
```

### 5. Konfigurasi PM2

Buat file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'absensi-app',
    script: 'dist/index.cjs',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

Start aplikasi dengan PM2:

```bash
# Buat logs directory
mkdir logs

# Start aplikasi
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### 6. Konfigurasi Nginx Reverse Proxy

Buat file `/etc/nginx/sites-available/absensi`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect ke HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL certificates
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Proxy ke Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/absensi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔐 Konfigurasi SSL dengan Let's Encrypt (Gratis)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d your-domain.com

# Setup auto-renewal
sudo crontab -e
# Tambahkan: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Monitoring & Maintenance

### Commands PM2 yang berguna:

```bash
# Check status
pm2 status

# View logs
pm2 logs absensi-app

# Restart aplikasi
pm2 restart absensi-app

# Stop aplikasi
pm2 stop absensi-app

# Monitor resource usage
pm2 monit
```

### Backup Database (untuk PostgreSQL local):

```bash
# Buat backup script
nano backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/absensi"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="absensi_db"
DB_USER="absensi_user"

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

```bash
# Make executable
chmod +x backup.sh

# Setup cron job untuk backup harian jam 2 pagi
sudo crontab -e
# Tambahkan: 0 2 * * * /path/to/backup.sh
```

## 📱 Konfigurasi Network

### Port yang perlu dibuka:
- **Port 80**: HTTP traffic
- **Port 443**: HTTPS traffic
- **Port 3000**: Internal (hanya untuk Nginx)

### Firewall setup (Ubuntu UFW):

```bash
# Allow SSH
sudo ufw allow ssh

# Allow web traffic
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable
```

## 🚨 Troubleshooting Common Issues

### 1. Aplikasi tidak start
```bash
# Check logs
pm2 logs absensi-app

# Check port usage
sudo netstat -tlnp | grep :3000
```

### 2. Database connection failed
```bash
# Test connection
psql -U username -h localhost -d database_name

# Check PostgreSQL status
sudo systemctl status postgresql
```

### 3. Nginx 502 Bad Gateway
```bash
# Check if Node.js app is running
pm2 status

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log
```

## 📊 Performance Optimization

### 1. Database Optimization
```sql
-- Create indexes untuk performance
CREATE INDEX idx_users_identifier ON users(identifier);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX idx_excuses_user_date ON excuses(user_id, date);
```

### 2. Nginx Optimization
```nginx
# Tambahkan di nginx config
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

## 🔄 Update Process

```bash
# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Update database
npm run db:push

# Restart aplikasi
pm2 restart absensi-app
```

## 📞 Support & Maintenance

### Monitoring setup:
- Gunakan **Uptime Robot** untuk monitoring website
- Setup **email alerts** untuk system errors
- Monitor **disk space** dan **memory usage**

### Security best practices:
- Regular security updates: `sudo apt update && sudo apt upgrade`
- Change default passwords
- Use strong passwords
- Regular backups
- Monitor access logs

---

## 📞 Kontak Support

Jika mengalami masalah selama deployment:
1. Check logs aplikasi dan system
2. Pastikan semua requirements terpenuhi
3. Ikuti troubleshooting guide di atas
4. Backup data sebelum melakukan perubahan besar

**Selamat! Aplikasi absensi sekolah Anda siap digunakan! 🎉**
