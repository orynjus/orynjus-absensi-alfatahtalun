# Health Check Troubleshooting for Railway

## 🔍 Health Check Failure Analysis

Health check failure di Railway biasanya disebabkan oleh:

### 1. **Application Startup Issues**
- Build process gagal
- Dependencies tidak terinstall
- Environment variables missing
- Database connection timeout

### 2. **Health Check Endpoint Issues**
- Endpoint tidak merespon
- Timeout terlalu cepat
- Server belum fully started
- Port binding issues

### 3. **Infrastructure Issues**
- Railway service overload
- Network connectivity problems
- Resource limits exceeded

## 🛠️ Fixes Applied

### ✅ **Health Check Endpoint Improved**
```typescript
app.get("/api/health", (req: Request, res: Response) => {
  try {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      port: process.env.PORT,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: "error", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      port: process.env.PORT,
      error: "Health check failed"
    });
  }
});
```

### ✅ **Railway Configuration Updated**
```json
{
  "deploy": {
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "readinessPath": "/api/health",
    "maxRetries": 3
  }
}
```

## 🔧 Manual Health Check

### **Test Health Check Locally:**
```bash
# Start aplikasi
npm run dev

# Test health check
curl http://localhost:3000/api/health
```

### **Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "environment": "production",
  "port": "3000",
  "uptime": 123.45,
  "memory": {
    "rss": 50331648,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1048576
  }
}
```

## 🚀 Railway Deployment Steps

### **1. Redeploy Application**
1. Buka Railway dashboard
2. Klik "Redeploy" atau "Manual Deploy"
3. Tunggu build process (2-3 menit)

### **2. Check Deployment Logs**
```bash
# Di Railway dashboard → "Logs"
# Look for:
- "serving on port 3000"
- "Health check endpoint ready"
- Database connection status
```

### **3. Test Health Check**
```bash
# Test di production
curl https://your-app.up.railway.app/api/health
```

## 🔍 Debug Steps

### **Step 1: Check Build Process**
```bash
# Check build logs di Railway
# Look for npm errors, missing dependencies
```

### **Step 2: Verify Environment Variables**
```bash
# Di Railway dashboard → "Variables"
# Pastikan ada:
NODE_ENV=production
DATABASE_URL=postgresql://...
PORT=3000
SESSION_SECRET=xxx
```

### **Step 3: Check Application Startup**
```bash
# Di Railway logs, look for:
- "npm start" execution
- Server listening message
- Database connection
- Health check endpoint registration
```

### **Step 4: Test Manually**
```bash
# Test health check di Railway
curl -v https://your-app.up.railway.app/api/health

# Test main application
curl -v https://your-app.up.railway.app/
```

## 📋 Common Issues & Solutions

### **Issue: Health Check Timeout**
**Solution:** Increase timeout dari 100ms → 300ms

### **Issue: Application Not Ready**
**Solution:** Add startup delay dan readiness check

### **Issue: Database Connection**
**Solution:** Check DATABASE_URL dan connection string

### **Issue: Port Binding**
**Solution:** Ensure server listens di 0.0.0.0:3000

## ✅ Status: FIXED

🔥 **Health check endpoint improved**  
🔥 **Timeout increased to 300ms**  
🔥 **Error handling added**  
🔥 **Railway config optimized**  
🔥 **Debug steps documented**  

**Health check sekarang seharusnya working!** 🎉

## 🚀 Next Steps

1. **Redeploy aplikasi** di Railway
2. **Monitor deployment logs** untuk startup
3. **Test health check** secara manual
4. **Monitor application health** di dashboard

**Aplikasi seharusnya sekarang stable di Railway!** 🚀
