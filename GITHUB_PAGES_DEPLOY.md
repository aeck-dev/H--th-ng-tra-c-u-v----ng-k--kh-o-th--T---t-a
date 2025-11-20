# Hướng Dẫn Deploy Lên GitHub Pages

## ✅ Hệ Thống Đã Cập Nhật

Hệ thống đã được chuyển đổi để sử dụng **Firebase Authentication** thay vì MongoDB backend. Giờ đây có thể deploy lên GitHub Pages!

## 🔧 Cấu Trúc Mới

```
Frontend (GitHub Pages)
    ↓
Firebase Authentication (Login)
    ↓
Firebase Realtime Database (Exam Results)
```

## 📋 Các Bước Deploy

### Bước 1: Tạo Tài Khoản User Trong Firebase

Bạn cần tạo user accounts trong Firebase Authentication Console:

1. Truy cập: https://console.firebase.google.com
2. Chọn project: `ttkt-aeck-edu-vn`
3. Vào **Authentication** → **Users** → **Add User**
4. Thêm email và password cho từng user

**Ví dụ:**
```
Email: tuanpham31798@gmail.com
Password: ********
```

### Bước 2: Enable Email/Password Authentication

1. Trong Firebase Console → **Authentication** → **Sign-in method**
2. Click **Email/Password** 
3. Enable cả hai options:
   - ✅ Email/Password
   - ✅ Email link (passwordless sign-in) - Optional
4. Save

### Bước 3: Push Code Lên GitHub

```bash
cd "d:\CODE\Web\ttkt.aeck.edu.vn\H--th-ng-tra-c-u-v----ng-k--kh-o-th--T---t-a"

git add .
git commit -m "Update to Firebase Authentication for GitHub Pages compatibility"
git push origin main
```

### Bước 4: Enable GitHub Pages

1. Vào repository: https://github.com/aeck-dev/H--th-ng-tra-c-u-v----ng-k--kh-o-th--T---t-a
2. Settings → Pages
3. Source: Deploy from a branch
4. Branch: `main` / `(root)`
5. Save

Website sẽ có tại: `https://aeck-dev.github.io/H--th-ng-tra-c-u-v----ng-k--kh-o-th--T---t-a/`

### Bước 5: Cấu Hình Firebase Security Rules

Vào Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "sessions": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "results": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## 🔐 Migrate Dữ Liệu User từ MongoDB sang Firebase

Nếu bạn muốn migrate users từ MongoDB sang Firebase:

### Option 1: Manual (Cho số lượng ít)
Vào Firebase Console và thêm từng user thủ công

### Option 2: Firebase Admin SDK (Cho số lượng lớn)

Tạo file `migrate-users.js`:

```javascript
const admin = require('firebase-admin');
const { MongoClient } = require('mongodb');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// MongoDB connection
const MONGODB_URI = 'mongodb://160.250.130.69:27017';
const DB_NAME = 'aeckdb';

async function migrateUsers() {
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(DB_NAME);
  const users = await db.collection('users').find({}).toArray();

  for (const user of users) {
    try {
      // Create user in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email: user.email,
        password: user.password, // Plain text password
        displayName: user.fullName,
        uid: user.identifier // Use AECK ID as UID if you want
      });

      console.log('✅ Created user:', userRecord.email);

      // Optionally store additional user data in Realtime Database
      await admin.database().ref(`users/${userRecord.uid}`).set({
        identifier: user.identifier,
        fullName: user.fullName,
        role: user.role,
        premium: user.premium
      });

    } catch (error) {
      console.error('❌ Error creating user:', user.email, error);
    }
  }

  console.log('Migration complete!');
  process.exit(0);
}

migrateUsers();
```

Chạy migration:
```bash
npm install firebase-admin
node migrate-users.js
```

## 🧪 Test Local Trước Khi Deploy

1. Mở `index.html` trong browser
2. Đảm bảo console không có lỗi
3. Test đăng nhập với tài khoản Firebase đã tạo
4. Kiểm tra load được kết quả thi

## 🚀 Deploy Checklist

- [ ] Firebase Authentication đã enable Email/Password
- [ ] Đã tạo user accounts trong Firebase Auth
- [ ] Code đã commit và push lên GitHub
- [ ] GitHub Pages đã được enable
- [ ] Firebase Security Rules đã được cấu hình
- [ ] Test trên GitHub Pages URL

## 🔒 Bảo Mật

### Firebase Security Rules Nâng Cao

```json
{
  "rules": {
    "sessions": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    "results": {
      "$sessionCode": {
        ".read": "auth != null",
        ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
      }
    },
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    }
  }
}
```

## 📊 So Sánh: MongoDB vs Firebase

| Feature | MongoDB Backend | Firebase |
|---------|----------------|----------|
| GitHub Pages | ❌ Không tương thích | ✅ Tương thích 100% |
| Backend Server | ✅ Cần Node.js server | ❌ Không cần |
| Real-time Sync | ❌ Cần polling | ✅ Built-in |
| Authentication | Tự code | ✅ Built-in |
| Cost | Server hosting | Free tier hào phóng |
| Setup | Phức tạp | Đơn giản |

## 🎯 Kết Luận

**Firebase Authentication + GitHub Pages** là giải pháp tối ưu cho dự án này vì:

✅ **Hoàn toàn miễn phí** (trong giới hạn free tier)  
✅ **Không cần backend server**  
✅ **Deploy đơn giản chỉ với git push**  
✅ **Bảo mật cao với Firebase Security Rules**  
✅ **Real-time updates tự động**  

## ⚠️ Lưu Ý

- Giữ lại MongoDB nếu bạn cần lưu dữ liệu user phức tạp
- Có thể sync MongoDB → Firebase định kỳ bằng script
- Firebase có giới hạn 50,000 reads/day ở free tier
