# Hướng dẫn xóa Firebase Users

## ⚠️ Vấn đề
Các user bị ghi đè vào Firebase Authentication do lúc đầu chưa phát triển chức năng login độc lập.

## 🎯 Giải pháp

### Phương án 1: Xóa thủ công qua Firebase Console (Khuyến nghị - Đơn giản nhất)

1. **Truy cập Firebase Console:**
   ```
   https://console.firebase.google.com/u/0/project/ttkt-aeck-edu-vn/authentication/users
   ```

2. **Xóa từng user:**
   - Click vào user cần xóa
   - Click nút "Delete" (icon thùng rác)
   - Confirm xóa

3. **Xóa hàng loạt:**
   - Chọn nhiều users bằng checkbox
   - Click "Delete selected users"

---

### Phương án 2: Sử dụng Cloud Function (Xóa hàng loạt tự động)

#### Bước 1: Cài đặt Firebase CLI

```powershell
npm install -g firebase-tools
firebase login
```

#### Bước 2: Khởi tạo Firebase Functions

```powershell
cd D:\CODE\Web\ttkt.aeck.edu.vn\H--th-ng-tra-c-u-v----ng-k--kh-o-th--T---t-a
firebase init functions
```

Chọn:
- Existing project: `ttkt-aeck-edu-vn`
- Language: JavaScript
- ESLint: Yes/No (tùy chọn)
- Install dependencies: Yes

#### Bước 3: Copy code Cloud Function

```powershell
# Copy nội dung từ firebase-cloud-function-delete-users.js vào functions/index.js
Copy-Item firebase-cloud-function-delete-users.js functions/index.js -Force
```

#### Bước 4: Cài đặt dependencies

```powershell
cd functions
npm install firebase-admin firebase-functions
```

#### Bước 5: Deploy Cloud Function

```powershell
firebase deploy --only functions
```

#### Bước 6: Sử dụng Cloud Function

**a. List tất cả users:**
```powershell
curl https://us-central1-ttkt-aeck-edu-vn.cloudfunctions.net/listAllUsers
```

**b. Xóa tất cả users:**
```powershell
curl -X POST https://us-central1-ttkt-aeck-edu-vn.cloudfunctions.net/deleteAllUsers `
  -H "Content-Type: application/json" `
  -d '{"confirmDelete": true, "adminKey": "YOUR_SECRET_KEY"}'
```

**c. Xóa user theo email:**
```powershell
curl -X POST https://us-central1-ttkt-aeck-edu-vn.cloudfunctions.net/deleteUserByEmail `
  -H "Content-Type: application/json" `
  -d '{"email": "user@example.com", "adminKey": "YOUR_SECRET_KEY"}'
```

---

### Phương án 3: Sử dụng Firebase Admin SDK trên Node.js

Nếu bạn không muốn deploy Cloud Function, có thể chạy script local:

#### Bước 1: Tạo Service Account Key

1. Truy cập: https://console.firebase.google.com/u/0/project/ttkt-aeck-edu-vn/settings/serviceaccounts/adminsdk
2. Click "Generate new private key"
3. Lưu file JSON vào thư mục project (KHÔNG commit file này lên Git!)

#### Bước 2: Tạo script xóa users

File đã tạo sẵn: `delete-users-local.js`

```javascript
// delete-users-local.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // File vừa download

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://ttkt-aeck-edu-vn-default-rtdb.asia-southeast1.firebasedatabase.app'
});

async function deleteAllUsers() {
  try {
    let deletedCount = 0;
    let nextPageToken;

    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      
      for (const user of listUsersResult.users) {
        try {
          await admin.auth().deleteUser(user.uid);
          console.log(`✅ Deleted: ${user.email || user.uid}`);
          deletedCount++;
        } catch (error) {
          console.error(`❌ Failed to delete ${user.uid}:`, error.message);
        }
      }

      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(`\n🎉 Total deleted: ${deletedCount} users`);
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit();
}

deleteAllUsers();
```

#### Bước 3: Chạy script

```powershell
npm install firebase-admin
node delete-users-local.js
```

---

## 🔒 Bảo mật

### Sau khi xóa users, bạn nên:

1. **Tắt Sign-up công khai:**
   - Firebase Console → Authentication → Settings
   - Disable "Email/Password" provider hoặc chỉ cho phép admin tạo users

2. **Tạo lại admin user:**
   ```powershell
   # Qua Firebase Console:
   # Authentication → Users → Add user
   # Email: admin@aeck.edu.vn
   # Password: [Mật khẩu mạnh]
   ```

3. **Cấu hình Security Rules:**
   ```json
   {
     "rules": {
       "sessions": {
         ".read": true,
         ".write": "auth != null"
       },
       "exam_results": {
         ".read": true,
         ".write": "auth != null"
       }
     }
   }
   ```

---

## ✅ Khuyến nghị

**Sử dụng Phương án 1** (Firebase Console) vì:
- ✅ Đơn giản, không cần code
- ✅ An toàn, có UI xác nhận
- ✅ Không cần deploy thêm gì

**Chỉ dùng Phương án 2/3** nếu:
- Có quá nhiều users (>50)
- Cần tự động hóa
- Cần xóa định kỳ

---

## 📝 Lưu ý

1. **Không thể hoàn tác:** Sau khi xóa, không thể khôi phục users
2. **Chỉ xóa Authentication:** Dữ liệu trong Database không bị ảnh hưởng
3. **Backup trước khi xóa:** Export danh sách users nếu cần lưu trữ
4. **Test trước:** Thử xóa 1-2 users để đảm bảo hệ thống vẫn hoạt động bình thường

---

## 🆘 Troubleshooting

**Lỗi: "Permission denied"**
- Đảm bảo đã đăng nhập với account có quyền Owner/Editor

**Lỗi: "User not found"**
- User đã bị xóa hoặc không tồn tại

**Cloud Function timeout:**
- Nếu có quá nhiều users, chia nhỏ batch (mỗi lần xóa 100 users)

---

## 📞 Liên hệ

Nếu cần hỗ trợ thêm, vui lòng liên hệ Firebase Support hoặc kiểm tra documentation:
- https://firebase.google.com/docs/auth/admin/manage-users
