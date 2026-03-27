# Google Drive Integration Setup

## 📋 Fitur yang Akan Dibuat

### **Upload Gambar Izin Siswa**
- Siswa upload foto/bukti izin
- Otomatis tersimpan ke Google Drive
- Generate shareable link
- Integrasi dengan sistem absensi

## 🔧 Setup Google Drive API

### 1. **Google Cloud Console**
1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Buat project baru atau pilih existing
3. Enable Google Drive API:
   - Google Drive API
   - Google Picker API
4. Buat credentials:
   - OAuth 2.0 Client ID
   - Download JSON file

### 2. **Environment Variables**
```bash
GOOGLE_DRIVE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### 3. **OAuth Setup**
```typescript
// Google OAuth configuration
const googleConfig = {
  clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_DRIVE_REDIRECT_URI,
  scope: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.appfolder'
  ]
};
```

## 📁 Folder Structure di Google Drive

```
Absensi App/
├── Izin Siswa/
│   ├── 2024/
│   │   ├── Januari/
│   │   ├── Februari/
│   │   └── ...
│   └── 2025/
├── Bukti Absensi/
└── Laporan/
```

## 🔄 Flow Integration

### **Upload Process:**
1. **Siswa Upload** foto/bukti izin
2. **System compress** gambar
3. **Upload ke Google Drive** folder spesifik
4. **Generate shareable link**
5. **Simpan link** di database
6. **Admin bisa view** semua gambar

### **API Endpoints:**
```typescript
// Upload izin photo
POST /api/excuses/upload-photo
{
  "file": "base64_image_data",
  "studentId": 123,
  "reason": "sakit",
  "date": "2024-01-15"
}

// Get photo links
GET /api/excuses/photos/:studentId
Response: [
  {
    "id": "drive_file_id",
    "webViewLink": "https://drive.google.com/file/d/ID/view",
    "uploadDate": "2024-01-15T10:00:00Z"
  }
]
```

## 🛠️ Implementation Steps

### 1. **Update googleDrive.ts**
```typescript
import { google } from 'googleapis';

// OAuth2 client setup
const auth = new google.auth.OAuth2Client({
  clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_DRIVE_REDIRECT_URI,
});

// Drive service setup
const drive = google.drive({ version: 'v3', auth });

export async function uploadExcusePhoto(
  fileBuffer: Buffer,
  fileName: string,
  studentId: number,
  reason: string
): Promise<{ fileId: string; webViewLink: string } | null> {
  try {
    // Create folder structure if not exists
    const folderId = await createStudentFolder(studentId);
    
    // Upload file
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType: 'image/jpeg',
        body: fileBuffer,
      },
    });

    // Make file publicly viewable
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return {
      fileId: response.data.id!,
      webViewLink: response.data.webViewLink!,
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return null;
  }
}
```

### 2. **Database Schema Update**
```typescript
// Add to excuses table
{
  photoFileId: string | null,
  photoUrl: string | null,
  uploadDate: timestamp | null
}
```

### 3. **Frontend Integration**
```typescript
// Upload component
const handlePhotoUpload = async (file: File) => {
  const base64 = await fileToBase64(file);
  
  const response = await fetch('/api/excuses/upload-photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: base64,
      studentId: student.id,
      reason: excuseData.reason
    })
  });
  
  if (response.ok) {
    const data = await response.json();
    setPhotoUrl(data.webViewLink);
  }
};
```

## 🔐 Security & Privacy

### **Access Control:**
- Siswa hanya upload foto sendiri
- Admin bisa view semua foto
- Wali kelas bisa view foto kelasnya
- Auto-expire links setelah 30 hari

### **Data Protection:**
- GDPR compliance
- Encrypted upload
- Access logging
- Backup otomatis

## 🚀 Deployment Notes

### **Environment Variables:**
```bash
# Production
GOOGLE_DRIVE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_DRIVE_REDIRECT_URI=https://your-domain.com/auth/google/callback

# Development
GOOGLE_DRIVE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

## ✅ Status: READY TO IMPLEMENT

🔥 **Google Drive API ready**  
🔥 **Upload flow designed**  
🔥 **Security planned**  
🔥 **Integration points clear**  

**Sistem siap untuk implementasi upload gambar izin siswa!** 🎉
