# 🚀 Hướng Dẫn Deploy Lên GitHub Pages (Hoàn Chỉnh)

## ✅ Giải Pháp: GitHub Pages + GitHub Actions + Firebase

### Kiến Trúc Hệ Thống

```
┌─────────────────────┐
│   GitHub Pages      │ ← Frontend (HTML/CSS/JS)
│   (Static Site)     │
└──────────┬──────────┘
           │
           ↓ Đăng nhập
┌─────────────────────┐
│  Firebase Auth      │ ← Authentication
└──────────┬──────────┘
           │
           ↓ Lấy kết quả
┌─────────────────────┐
│  Firebase Database  │ ← Exam Results
└─────────────────────┘
           ↑
           │ Sync tự động
┌─────────────────────┐
│  GitHub Actions     │ ← Auto Sync Script
│  (Runs every 30min) │
└──────────┬──────────┘
           │
           ↓ Đọc users
┌─────────────────────┐
│     MongoDB         │ ← User Database
│  (160.250.130.69)   │
└─────────────────────┘
```

---

## 📋 BƯỚC 1: Chuẩn Bị Firebase

### 1.1. Download Firebase Admin Key

1. Vào: https://console.firebase.google.com
2. Chọn project: **ttkt-aeck-edu-vn**
3. ⚙️ Settings → **Service Accounts**
4. Click **"Generate new private key"**
5. Lưu file JSON (sẽ dùng cho GitHub Secrets)

### 1.2. Enable Email/Password Authentication

1. Firebase Console → **Authentication**
2. **Sign-in method** tab
3. Enable **Email/Password**
4. Save

### 1.3. Tạo User Đầu Tiên (Test)

1. Authentication → **Users** → **Add user**
2. Email: `test@aeck.edu.vn`
3. Password: `Test123456`
4. Click **Add user**

---

## 📋 BƯỚC 2: Cấu Hình GitHub Repository

### 2.1. Add Secrets

1. Vào repository: https://github.com/aeck-dev/H--th-ng-tra-c-u-v----ng-k--kh-o-th--T---t-a
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

**Thêm 2 secrets:**

#### Secret 1: FIREBASE_ADMIN_KEY
```
Name: FIREBASE_ADMIN_KEY
Value: [Paste toàn bộ nội dung file firebase-admin-key.json]
```

**Ví dụ format:**
```json
{
  "type": "service_account",
  "project_id": "ttkt-aeck-edu-vn",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxx@ttkt-aeck-edu-vn.iam.gserviceaccount.com",
  ...
}
```

#### Secret 2: MONGODB_URI
```
Name: MONGODB_URI
Value: mongodb://160.250.130.69:27017
```

### 2.2. Enable GitHub Actions

1. Repository → **Actions** tab
2. Nếu bị disable, click **"I understand my workflows, go ahead and enable them"**
3. Workflow `sync-users.yml` sẽ tự động chạy

---

## 📋 BƯỚC 3: Sync Users Lần Đầu

### Option A: Chạy Qua GitHub Actions (Khuyến nghị)

1. Vào **Actions** tab
2. Click workflow **"Auto Sync MongoDB to Firebase"**
3. Click **"Run workflow"** → **Run workflow**
4. Đợi ~1-2 phút
5. Check logs xem users đã sync chưa

### Option B: Chạy Local Rồi Push

```powershell
# 1. Install dependencies
npm install

# 2. Tạo file firebase-admin-key.json (download từ Firebase)

# 3. Copy và chỉnh .env
copy .env.example .env

# 4. Sync tất cả users
npm run sync:all

# 5. Commit và push
git add .
git commit -m "Enable auto-sync and Firebase auth"
git push origin main
```

---

## 📋 BƯỚC 4: Enable GitHub Pages

1. Repository → **Settings** → **Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `main` / `/ (root)`
4. Click **Save**

**Website sẽ có tại:**
```
https://aeck-dev.github.io/H--th-ng-tra-c-u-v----ng-k--kh-o-th--T---t-a/
```

⏰ Đợi 2-3 phút để GitHub deploy.

---

## 📋 BƯỚC 5: Kiểm Tra Hoạt Động

### 5.1. Test Website

1. Mở: https://aeck-dev.github.io/H--th-ng-tra-c-u-v----ng-k--kh-o-th--T---t-a/
2. Nhập email và password của user đã tạo
3. Click **Đăng nhập**
4. Xem kết quả thi hiển thị

### 5.2. Kiểm Tra GitHub Actions

1. **Actions** tab
2. Xem workflow runs
3. Nếu có lỗi → Click vào → Xem logs

### 5.3. Verify Firebase

1. Firebase Console → **Authentication** → **Users**
2. Check xem có users từ MongoDB chưa

---

## 🔄 Cách Thức Hoạt Động

### Quy Trình Tự Động:

```
1. User thêm vào MongoDB
   ↓
2. GitHub Actions chạy mỗi 30 phút
   ↓
3. Script sync-users.js kiểm tra users mới
   ↓
4. Tạo user trong Firebase Authentication
   ↓
5. User có thể đăng nhập trên GitHub Pages
   ↓
6. Frontend load exam results từ Firebase Database
```

### Sync Schedule:

- ⏰ **Tự động:** Mỗi 30 phút
- 🖱️ **Thủ công:** Actions → Run workflow
- 🔄 **On Push:** Khi update sync-users.js

---

## 🛠️ Tùy Chỉnh

### Thay Đổi Tần Suất Sync

Sửa file `.github/workflows/sync-users.yml`:

```yaml
schedule:
  # Mỗi 10 phút
  - cron: '*/10 * * * *'
  
  # Mỗi 1 giờ
  - cron: '0 * * * *'
  
  # Mỗi 6 giờ
  - cron: '0 */6 * * *'
```

### Thêm Notification Khi Sync

Thêm vào workflow:

```yaml
- name: Send notification
  if: success()
  run: |
    echo "✅ Sync completed successfully!"
    # Thêm webhook/email notification nếu muốn
```

---

## 🐛 Troubleshooting

### ❌ Lỗi: "FIREBASE_ADMIN_KEY not found"

**Giải pháp:**
1. Kiểm tra Secret đã add chưa
2. Secret name phải chính xác: `FIREBASE_ADMIN_KEY`
3. Value phải là JSON hợp lệ

### ❌ Lỗi: "Cannot connect to MongoDB"

**Giải pháp:**
1. Kiểm tra MongoDB có public access không
2. Firewall có block GitHub IPs không
3. Connection string đúng chưa

### ❌ Lỗi: "auth/email-already-exists"

**Không phải lỗi!** User đã tồn tại trong Firebase, script sẽ skip.

### ❌ GitHub Pages không hiển thị

**Giải pháp:**
1. Đợi 2-3 phút
2. Hard refresh (Ctrl + Shift + R)
3. Check Settings → Pages có enable chưa
4. Check index.html ở root folder

### ❌ Không đăng nhập được

**Kiểm tra:**
1. Firebase Auth đã enable Email/Password chưa
2. User có tồn tại trong Firebase Auth chưa
3. Console browser có lỗi không (F12)
4. Network tab có call Firebase API không

---

## 📊 Monitor & Logs

### GitHub Actions Logs

```
Actions → Workflow runs → Click vào run → View logs
```

### Firebase Logs

```
Firebase Console → Authentication → Usage
```

### Check Sync Status

Thêm vào cuối sync-users.js để log:

```javascript
console.log(`
✅ Sync Summary:
   Total: ${result.total}
   Success: ${result.success}
   Failed: ${result.failed}
`);
```

---

## 💰 Chi Phí

### GitHub

- ✅ **GitHub Pages:** Miễn phí
- ✅ **GitHub Actions:** 2,000 phút/tháng miễn phí
- 📊 Ước tính: ~15 giây/sync × 48 runs/ngày = **12 phút/ngày** → **360 phút/tháng**

### Firebase

- ✅ **Authentication:** 50,000 users miễn phí
- ✅ **Realtime Database:** 1GB storage, 10GB transfer miễn phí
- ✅ **Hosting:** 10GB/tháng miễn phí

**→ Hoàn toàn miễn phí cho project này!**

---

## 🎯 Checklist Hoàn Thành

- [ ] Firebase Admin Key đã download
- [ ] GitHub Secrets đã add (FIREBASE_ADMIN_KEY, MONGODB_URI)
- [ ] Firebase Auth đã enable Email/Password
- [ ] Đã sync users lần đầu (manual hoặc Actions)
- [ ] GitHub Pages đã enable
- [ ] Website đã test và hoạt động
- [ ] GitHub Actions workflow đang chạy

---

## 🚀 Next Steps

### Sau Khi Deploy Thành Công:

1. **Custom Domain** (Optional)
   - Settings → Pages → Custom domain
   - Add CNAME record: `ttkt.aeck.edu.vn`

2. **SSL Certificate**
   - GitHub Pages tự động enable HTTPS

3. **Performance**
   - Enable Firebase caching
   - Minify CSS/JS

4. **Monitoring**
   - Google Analytics
   - Firebase Analytics

---

## 📞 Support

Nếu gặp vấn đề:

1. Check GitHub Actions logs
2. Check browser console (F12)
3. Verify Firebase Console
4. Test locally trước

---

## 🎉 Kết Luận

Với setup này, bạn có:

✅ **Static site** trên GitHub Pages (miễn phí)  
✅ **Auto-sync** users từ MongoDB (GitHub Actions)  
✅ **Authentication** qua Firebase  
✅ **Real-time** exam results  
✅ **Không cần backend server**  
✅ **Scaling tự động**  
✅ **100% miễn phí**

Hệ thống sẽ tự động sync users mỗi 30 phút, users mới trong MongoDB sẽ có thể đăng nhập sau tối đa 30 phút! 🚀
