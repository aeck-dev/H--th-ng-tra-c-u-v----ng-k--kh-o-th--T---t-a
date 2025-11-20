# 🚀 Backend API Deployment Guide

## 📋 Tổng quan

Backend server này xử lý authentication với MongoDB bcrypt password và sync user metadata sang Firebase Realtime Database.

**Architecture:**
```
User (GitHub Pages) 
  → Backend API (Heroku/Railway) 
    → MongoDB (bcrypt verify) 
    → Firebase Realtime DB (user metadata)
```

## 🔧 Yêu cầu

- Node.js 18+
- MongoDB database (đã có: 160.250.130.69:27017)
- Firebase Admin SDK credentials
- Hosting service: Heroku / Railway / Render / VPS

---

## 🌐 Option 1: Deploy lên Railway (Khuyến nghị - Miễn phí + Dễ dùng)

### Bước 1: Tạo tài khoản Railway

1. Truy cập: https://railway.app/
2. Sign up với GitHub account
3. Verify email

### Bước 2: Deploy từ GitHub

1. Click **"New Project"**
2. Chọn **"Deploy from GitHub repo"**
3. Authorize Railway truy cập GitHub
4. Chọn repository: `aeck-dev/H--th-ng-tra-c-u-v----ng-k--kh-o-th--T---t-a`
5. Railway tự động detect Node.js và deploy

### Bước 3: Configure Environment Variables

Vào **Variables** tab và thêm:

```env
MONGODB_URI=mongodb://aeckTu13102006:1x31SfRU8dU2l@160.250.130.69:27017/aeckdb?authSource=admin
JWT_SECRET=AECK_JWT_SECRET_2024_TTKT_SECURE_KEY_XYZ123
ADMIN_KEY=AECK_ADMIN_KEY_2024_SYNC_SECURE_XYZ789
FIREBASE_DATABASE_URL=https://ttkt-aeck-edu-vn-default-rtdb.asia-southeast1.firebasedatabase.app
FIREBASE_ADMIN_KEY=<paste Firebase Admin SDK JSON here>
PORT=3000
NODE_ENV=production
```

### Bước 4: Set Start Command

Vào **Settings** → **Deploy** → **Start Command**:
```bash
node backend-auth-server.js
```

### Bước 5: Generate Domain

1. Vào **Settings** → **Networking**
2. Click **Generate Domain**
3. Copy URL (ví dụ: `https://your-app.railway.app`)

### Bước 6: Update Frontend

Mở `index.html`, tìm dòng:
```javascript
const BACKEND_API = 'https://your-backend-api.herokuapp.com';
```

Thay thành:
```javascript
const BACKEND_API = 'https://your-app.railway.app';
```

---

## 🔵 Option 2: Deploy lên Render.com (Miễn phí, Auto-deploy)

### Bước 1: Tạo tài khoản

1. Truy cập: https://render.com/
2. Sign up với GitHub
3. Verify email

### Bước 2: Create Web Service

1. Dashboard → **New** → **Web Service**
2. Connect GitHub repository
3. Configure:
   - **Name**: `ttkt-aeck-backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node backend-auth-server.js`
   - **Plan**: Free

### Bước 3: Environment Variables

Add từng biến:
- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_KEY`
- `FIREBASE_DATABASE_URL`
- `FIREBASE_ADMIN_KEY`
- `NODE_ENV=production`

### Bước 4: Deploy

1. Click **Create Web Service**
2. Đợi deploy (~5 phút)
3. Copy URL: `https://ttkt-aeck-backend.onrender.com`

---

## 🟣 Option 3: Deploy lên Heroku (Trả phí nhưng stable)

### Bước 1: Install Heroku CLI

```powershell
# Windows
winget install Heroku.HerokuCLI
```

### Bước 2: Login và Create App

```powershell
heroku login
heroku create ttkt-aeck-backend
```

### Bước 3: Set Environment Variables

```powershell
heroku config:set MONGODB_URI="mongodb://aeckTu13102006:1x31SfRU8dU2l@160.250.130.69:27017/aeckdb?authSource=admin"
heroku config:set JWT_SECRET="AECK_JWT_SECRET_2024"
heroku config:set ADMIN_KEY="AECK_ADMIN_KEY_2024"
heroku config:set FIREBASE_DATABASE_URL="https://ttkt-aeck-edu-vn-default-rtdb.asia-southeast1.firebasedatabase.app"
heroku config:set FIREBASE_ADMIN_KEY='{"type":"service_account",...}'
heroku config:set NODE_ENV=production
```

### Bước 4: Deploy

```powershell
git push heroku main
```

### Bước 5: Check Logs

```powershell
heroku logs --tail
```

---

## 🟢 Option 4: Deploy lên VPS (Ubuntu 22.04)

### Bước 1: SSH vào VPS

```bash
ssh root@your-vps-ip
```

### Bước 2: Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # Verify
```

### Bước 3: Clone Repository

```bash
cd /var/www
git clone https://github.com/aeck-dev/H--th-ng-tra-c-u-v----ng-k--kh-o-th--T---t-a.git backend
cd backend
```

### Bước 4: Install Dependencies

```bash
npm install
```

### Bước 5: Configure Environment

```bash
nano .env
```

Paste nội dung từ `.env.example` và sửa values

### Bước 6: Install PM2 (Process Manager)

```bash
npm install -g pm2
pm2 start backend-auth-server.js --name ttkt-backend
pm2 startup
pm2 save
```

### Bước 7: Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/backend
```

```nginx
server {
    listen 80;
    server_name api.ttkt.aeck.edu.vn;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Bước 8: SSL với Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.ttkt.aeck.edu.vn
```

---

## 🧪 Testing Backend API

### Health Check

```powershell
curl https://your-backend-api.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-11-20T10:30:00.000Z",
  "mongodb": "connected",
  "firebase": "initialized"
}
```

### Test Login

```powershell
curl -X POST https://your-backend-api.com/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"phamtuanh1505@gmail.com\",\"password\":\"Cuong123\"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "phamtuanh1505@gmail.com",
    "identifier": "AECK413158",
    "fullName": "Phạm Tuấn Anh",
    "role": "student",
    "premium": false
  }
}
```

### Verify Token

```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl -X POST https://your-backend-api.com/auth/verify-token `
  -H "Authorization: Bearer $token"
```

### Sync All Users (Admin)

```powershell
curl -X POST https://your-backend-api.com/admin/sync-users `
  -H "Content-Type: application/json" `
  -d '{\"adminKey\":\"AECK_ADMIN_KEY_2024\"}'
```

---

## 📊 Monitoring & Logs

### Railway
- Dashboard → Your Service → Logs tab
- Real-time log streaming

### Render
- Dashboard → Your Service → Logs
- Events tab for deploy history

### Heroku
```powershell
heroku logs --tail
```

### VPS (PM2)
```bash
pm2 logs ttkt-backend
pm2 monit
```

---

## 🔒 Security Checklist

- ✅ Change `JWT_SECRET` to random secure string
- ✅ Change `ADMIN_KEY` to random secure string
- ✅ Enable HTTPS (SSL certificate)
- ✅ Configure CORS properly (only allow your domain)
- ✅ Never commit `.env` file to git
- ✅ Use environment variables for all secrets
- ✅ Rate limiting (optional but recommended)

---

## 🛠️ Troubleshooting

### MongoDB Connection Failed
```
Error: Command find requires authentication
```
**Fix:** Check `MONGODB_URI` has correct username/password and `?authSource=admin`

### Firebase Admin SDK Error
```
Error: Invalid FIREBASE_ADMIN_KEY
```
**Fix:** Ensure JSON is properly escaped, no line breaks, valid JSON format

### CORS Error
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```
**Fix:** Add your GitHub Pages domain to CORS origins in `backend-auth-server.js`:
```javascript
origin: [
  'https://aeck-dev.github.io',
  'https://ttkt.aeck.edu.vn'
]
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Fix:** Change `PORT` environment variable or kill process:
```powershell
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 📚 API Endpoints Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/auth/login` | No | Login with email/password |
| POST | `/auth/verify-token` | Yes (Bearer) | Verify JWT token |
| GET | `/auth/me` | Yes (Bearer) | Get current user info |
| POST | `/admin/sync-users` | Yes (Admin Key) | Sync all users to Firebase |

---

## ✅ Next Steps

1. **Deploy backend** lên Railway/Render (khuyến nghị Railway - free + dễ)
2. **Copy backend URL** (ví dụ: `https://ttkt-backend.railway.app`)
3. **Update `index.html`** thay `BACKEND_API` URL
4. **Test login** với email + password từ MongoDB
5. **Commit & push** changes lên GitHub
6. **GitHub Pages** tự động deploy frontend
7. **Test end-to-end** flow: Login → Load results

---

## 💡 Tips

- **Railway**: Free tier 500 giờ/tháng, auto-sleep sau 1 tiếng không dùng
- **Render**: Free tier always on nhưng cold start ~30s
- **Heroku**: Không còn free tier, $5/tháng
- **VPS**: Full control nhưng phải tự maintain

**Khuyến nghị cho project này:** Railway (dễ setup, auto-deploy, đủ free tier)
