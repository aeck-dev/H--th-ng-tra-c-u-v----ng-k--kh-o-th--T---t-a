# Hướng dẫn xóa hàng loạt Firebase Users

## 🚀 Cách sử dụng script tự động

### Bước 1: Tải Service Account Key

1. Truy cập Firebase Console:
   ```
   https://console.firebase.google.com/project/ttkt-aeck-edu-vn/settings/serviceaccounts/adminsdk
   ```

2. Click **"Generate new private key"**

3. Lưu file JSON với tên `serviceAccountKey.json` vào thư mục project này

4. **QUAN TRỌNG:** Thêm vào `.gitignore` để không commit lên Git:
   ```
   serviceAccountKey.json
   ```

### Bước 2: Cập nhật script

Mở file `delete-all-users.js` và uncomment dòng 35-39:

```javascript
// Từ:
// const serviceAccount = require('./serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: firebaseConfig.databaseURL
// });

// Thành:
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: firebaseConfig.databaseURL
});
```

Đồng thời comment lại phần Application Default Credentials (dòng 20-24).

### Bước 3: Cài đặt dependencies

```powershell
npm install firebase-admin
```

### Bước 4: Chạy script

```powershell
node delete-all-users.js
```

### Bước 5: Chọn hành động

Menu sẽ hiển thị:
```
1. Liệt kê tất cả users
2. XÓA TẤT CẢ USERS (KHÔNG THỂ HOÀN TÁC!)
3. Thoát
```

- Nhấn `1` để xem danh sách users trước
- Nhấn `2` để xóa tất cả (cần gõ "XOA TAT CA" để xác nhận)

---

## ⚡ Cách nhanh - Sử dụng Firebase CLI

### Cách 1: Xóa từng user qua CLI

```powershell
# Cài đặt Firebase CLI
npm install -g firebase-tools

# Đăng nhập
firebase login

# Liệt kê users
firebase auth:export users.json --project ttkt-aeck-edu-vn

# Xem file users.json để lấy danh sách UID

# Xóa từng user
firebase auth:delete UID_USER_1 --project ttkt-aeck-edu-vn
firebase auth:delete UID_USER_2 --project ttkt-aeck-edu-vn
```

### Cách 2: Script PowerShell tự động

Tạo file `delete-users.ps1`:

```powershell
# Export danh sách users
firebase auth:export users.json --project ttkt-aeck-edu-vn

# Đọc file và xóa từng user
$users = Get-Content users.json | ConvertFrom-Json
$users.users | ForEach-Object {
    $uid = $_.localId
    $email = $_.email
    Write-Host "Deleting: $email ($uid)"
    firebase auth:delete $uid --project ttkt-aeck-edu-vn --force
}

Write-Host "Done! Deleted $($users.users.Count) users"
```

Chạy:
```powershell
.\delete-users.ps1
```

---

## 🎯 So sánh các phương pháp

| Phương pháp | Ưu điểm | Nhược điểm | Khuyến nghị |
|------------|---------|------------|-------------|
| **Script Node.js** | Tự động 100%, nhanh | Cần Service Account Key | ⭐⭐⭐⭐⭐ Tốt nhất cho nhiều users |
| **Firebase CLI + PowerShell** | Không cần Service Account | Cần cài Firebase CLI | ⭐⭐⭐⭐ Tốt, dễ setup |
| **Firebase Console** | An toàn nhất, có UI | Chậm, chỉ phù hợp <20 users | ⭐⭐⭐ Chỉ dùng khi ít users |
| **Cloud Function** | Chạy trên server | Phức tạp, cần deploy | ⭐⭐ Không cần thiết cho task này |

---

## ⚠️ Lưu ý quan trọng

1. ✅ **Backup trước khi xóa:**
   ```powershell
   firebase auth:export users-backup.json --project ttkt-aeck-edu-vn
   ```

2. ✅ **Xóa không ảnh hưởng đến Database:**
   - Dữ liệu trong Realtime Database vẫn nguyên
   - Chỉ xóa Authentication users

3. ✅ **Không thể hoàn tác:**
   - Sau khi xóa không thể khôi phục
   - Nên test với 1-2 users trước

4. ✅ **Giữ lại admin user:**
   - Nếu muốn giữ admin, sửa script để skip email admin

---

## 🔧 Troubleshooting

### Lỗi: "Permission denied"
```
Giải pháp: Đảm bảo Service Account Key có đúng quyền
```

### Lỗi: "Cannot find module 'firebase-admin'"
```powershell
npm install firebase-admin
```

### Lỗi: "Application Default Credentials failed"
```
Giải pháp: Sử dụng Service Account Key thay vì ADC
```

---

## 📞 Cần giúp?

Nếu gặp vấn đề, check log hoặc liên hệ Firebase Support.
