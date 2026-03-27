# Build Process untuk Railway

## 🔧 Build Configuration

### **Package.json Scripts:**
```json
{
  "scripts": {
    "build": "tsx script/build.ts",
    "start": "NODE_ENV=production node dist/index.cjs"
  }
}
```

### **Build Process (script/build.ts):**
1. **Clean dist folder** (`rm dist`)
2. **Build client** dengan Vite
3. **Build server** dengan esbuild
4. **Bundle dependencies** untuk cold start optimization
5. **Output:** `dist/index.cjs`

## 🚀 Railway Build Settings

### **Di Railway Dashboard:**
```
Build Command: npm run build
Start Command: npm start
```

### **Environment Variables:**
```
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:npg_x9bFvPBOco3I@ep-little-firefly-a10aet33-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
PORT=3000
SESSION_SECRET=absensi_secret_key_2024
```

## 📋 Build Process Steps

### **1. Install Dependencies**
```bash
npm ci
```

### **2. Build Client (Vite)**
```bash
# Build React frontend
vite build()
# Output: client/dist/
```

### **3. Build Server (esbuild)**
```bash
# Bundle Node.js backend
esbuild({
  entryPoints: ["server/index.ts"],
  platform: "node",
  bundle: true,
  format: "cjs",
  outfile: "dist/index.cjs"
})
```

### **4. Production Ready**
- ✅ Frontend optimized
- ✅ Backend bundled
- ✅ Dependencies managed
- ✅ Cold start optimized

## 🔍 Build Output

### **Folder Structure:**
```
dist/
├── index.cjs          # Bundled server
└── client/            # Built frontend
    ├── assets/
    ├── index.html
    └── ...
```

## ✅ Build Status: READY

🔥 **Build script complete**  
🔥 **Railway configuration updated**  
🔥 **Dependencies optimized**  
🔥 **Production ready**  

**Build process siap untuk Railway deployment!** 🚀
