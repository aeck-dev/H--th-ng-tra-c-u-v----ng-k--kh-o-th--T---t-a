# Hướng Dẫn Tự Động Sync Users MongoDB → Firebase

## 🎯 Mục Đích

Tự động đồng bộ users từ MongoDB sang Firebase Authentication khi có user mới được tạo.

## 📋 Yêu Cầu

1. **Firebase Admin SDK Key**
   - Vào Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Lưu file JSON với tên `firebase-admin-key.json`
   - Đặt file này vào thư mục gốc project

2. **Dependencies**
   ```bash
   npm install firebase-admin mongodb dotenv node-cron
   ```

## 🚀 Cách Sử Dụng

### Option 1: Sync Thủ Công (On-Demand)

#### Sync tất cả users (overwrite)
```bash
node sync-users.js all
```

#### Sync chỉ users mới
```bash
node sync-users.js new
```

#### Sync một lần rồi thoát
```bash
node sync-users.js once
```

### Option 2: Real-time Sync (MongoDB Change Streams)

**Tự động sync ngay khi có thay đổi trong MongoDB:**

```bash
node sync-users.js watch
```

Chế độ này sẽ:
- ✅ Tự động tạo user mới trong Firebase khi insert vào MongoDB
- ✅ Tự động cập nhật thông tin khi update trong MongoDB
- ✅ Chạy liên tục, không thoát
- ⚠️ Yêu cầu MongoDB Replica Set (MongoDB 4.0+)

### Option 3: Scheduled Sync (Chạy Định Kỳ)

**Tự động sync mỗi 5 phút:**

```bash
node scheduler.js
```

Hoặc tùy chỉnh interval trong `.env`:
```env
SYNC_INTERVAL_MINUTES=10
```

## ⚙️ Cấu Hình

### 1. Tạo file `.env`

```bash
cp .env.example .env
```

Chỉnh sửa `.env`:
```env
MONGODB_URI=mongodb://160.250.130.69:27017
DB_NAME=aeckdb
SYNC_INTERVAL_MINUTES=5
```

### 2. Chuẩn bị Firebase Admin Key

Download từ Firebase Console và đặt tại:
```
firebase-admin-key.json
```

## 🔄 Deployment Options

### Option A: Chạy Local với Task Scheduler (Windows)

1. **Tạo batch file** `run-sync.bat`:
```batch
@echo off
cd "d:\CODE\Web\ttkt.aeck.edu.vn\H--th-ng-tra-c-u-v----ng-k--kh-o-th--T---t-a"
node sync-users.js new >> sync-log.txt 2>&1
```

2. **Tạo scheduled task:**
   - Mở Task Scheduler
   - Create Basic Task → "Sync Firebase Users"
   - Trigger: Daily, every 1 hour (hoặc tùy chọn)
   - Action: Start a program → `run-sync.bat`

### Option B: Deploy lên Server với PM2

1. **Install PM2:**
```bash
npm install -g pm2
```

2. **Chạy với PM2:**

**Real-time sync:**
```bash
pm2 start sync-users.js --name "firebase-sync" -- watch
pm2 save
pm2 startup
```

**Scheduled sync:**
```bash
pm2 start scheduler.js --name "firebase-scheduler"
pm2 save
pm2 startup
```

3. **Monitor:**
```bash
pm2 logs firebase-sync
pm2 monit
```

### Option C: Deploy lên Cloud (Heroku/Railway)

1. **Tạo `Procfile`:**
```
worker: node sync-users.js watch
```

2. **Push lên Heroku:**
```bash
heroku create aeck-firebase-sync
heroku config:set MONGODB_URI=mongodb://160.250.130.69:27017
heroku config:set DB_NAME=aeckdb
git push heroku main
heroku ps:scale worker=1
```

### Option D: GitHub Actions (Scheduled)

Tạo `.github/workflows/sync-users.yml`:

```yaml
name: Sync MongoDB to Firebase

on:
  schedule:
    # Runs every 30 minutes
    - cron: '*/30 * * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Create Firebase Admin Key
        run: echo '${{ secrets.FIREBASE_ADMIN_KEY }}' > firebase-admin-key.json
      
      - name: Sync Users
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          DB_NAME: aeckdb
        run: node sync-users.js new
```

**Setup secrets trong GitHub:**
- `FIREBASE_ADMIN_KEY` = nội dung file firebase-admin-key.json
- `MONGODB_URI` = connection string

## 📊 Logs & Monitoring

### View Logs
```bash
# PM2
pm2 logs firebase-sync

# Or manual log file
tail -f sync-log.txt
```

### Log Format
```
✅ Created new user in Firebase: user@example.com (UID: abc123)
ℹ️  User existing@example.com already exists in Firebase
❌ Error syncing user error@example.com: Invalid email
```

## 🔒 Security Best Practices

1. **Không commit `firebase-admin-key.json`**
   ```bash
   # Đã có trong .gitignore
   firebase-admin-key.json
   .env
   ```

2. **Sử dụng environment variables**
   - Không hardcode credentials
   - Dùng `.env` cho local
   - Dùng secrets cho production

3. **Firewall Rules**
   - Chỉ cho phép IP của sync server truy cập MongoDB
   - Sử dụng MongoDB authentication

4. **Password Handling**
   - Script sẽ dùng password từ MongoDB nếu có
   - Nếu không có, tạo temporary password: `tempAECK{identifier}`
   - Nên yêu cầu users đổi password lần đầu login

## 🧪 Testing

### Test sync một user
```bash
# Modify sync-users.js to add test function
node sync-users.js test user@example.com
```

### Verify user created
```bash
# Check Firebase Console
# Or use Firebase Admin SDK
```

## 📈 Performance

- **Rate Limit:** 100ms delay giữa mỗi user để tránh rate limiting
- **Batch Size:** Process all users trong một run
- **Memory:** ~50MB cho 10,000 users

## ❓ FAQ

**Q: MongoDB không hỗ trợ Change Streams?**  
A: Sử dụng Option 3 (Scheduled Sync) thay vì watch mode.

**Q: Sync có ghi đè users hiện có không?**  
A: 
- `sync new` - Chỉ tạo users mới
- `sync all` - Update tất cả (không đổi password)

**Q: Password từ MongoDB có được sync không?**  
A: Có, nếu password là plain text. Nếu đã hash bằng bcrypt, cần decrypt trước.

**Q: Làm sao để user đổi password?**  
A: Sử dụng Firebase Auth Password Reset Email hoặc custom UI.

## 🎯 Khuyến Nghị

**Cho Development:**
- Dùng `node sync-users.js new` thủ công khi cần

**Cho Production:**
- **Best:** GitHub Actions (scheduled) - Free, reliable
- **Alternative:** PM2 on VPS với `watch` mode
- **Simple:** Windows Task Scheduler cho small scale

## 📞 Support

Issues? Check:
1. Firebase Admin Key đúng chưa
2. MongoDB connection string
3. Network/Firewall
4. Firebase Auth đã enable Email/Password chưa
