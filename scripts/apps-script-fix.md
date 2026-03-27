# 📝 Apps Script Web App Fix

## Problem
Web app muncul JSON response, bukan halaman web.

## Solution

### Option 1: Add doGet function
Tambahkan ini di Apps Script:

```javascript
function doGet(e) {
  return HtmlService.createHtmlOutput(`
    <html>
      <body>
        <h1>Absensi Web App</h1>
        <p>Web app is running!</p>
        <p>URL: ${ScriptApp.getService().getUrl()}</p>
      </body>
    </html>
  `);
}

function doPost(e) {
  // ... existing code
}
```

### Option 2: Redeploy Web App
1. Deploy → Manage deployments
2. Hapus deployment lama
3. Deploy → New deployment
4. Type: Web app
5. Execute as: Me
6. Who has access: Anyone
7. Deploy

### Option 3: Test with POST
Test dengan curl:

```bash
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"ping"}'
```

## Expected Response
```json
{"success": true, "message": "pong"}
```
