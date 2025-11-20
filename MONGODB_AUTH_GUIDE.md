# 🔐 MongoDB Authentication Setup

## ❌ Lỗi Hiện Tại

```
MongoServerError: Command find requires authentication
```

MongoDB của bạn yêu cầu authentication nhưng connection string không có credentials.

## ✅ Giải Pháp

### Option 1: Lấy Credentials Từ MongoDB Compass

1. Mở **MongoDB Compass**
2. Xem connection string đang dùng
3. Sẽ có dạng: `mongodb://username:password@160.250.130.69:27017/`
4. Copy username và password

### Option 2: Tạo User Mới Trong MongoDB

#### Bước 1: Kết nối vào MongoDB shell

```bash
# Windows
mongosh "mongodb://160.250.130.69:27017"

# Hoặc qua Compass → _MONGOSH tab
```

#### Bước 2: Tạo user

```javascript
use admin

db.createUser({
  user: "aeck_sync",
  pwd: "AeckSync2024!",  // Đổi password này
  roles: [
    { role: "readWrite", db: "aeckdb" }
  ]
})
```

#### Bước 3: Test user mới

```javascript
db.auth("aeck_sync", "AeckSync2024!")
// Nếu thấy: { ok: 1 } → Thành công!
```

### Option 3: Kiểm Tra Trong MongoDB Compass

1. Mở MongoDB Compass
2. Click **Connect** dropdown
3. Xem "Connection String" 
4. Nếu có `@` trong string → có authentication
5. Format: `mongodb://user:pass@host:port/`

## 🔄 Cập Nhật GitHub Secret

### Bước 1: Format Connection String

**Với authentication:**
```
mongodb://username:password@160.250.130.69:27017/aeckdb?authSource=admin
```

**Ví dụ cụ thể:**
```
mongodb://aeck_sync:AeckSync2024!@160.250.130.69:27017/aeckdb?authSource=admin
```

**Lưu ý:** Nếu password có ký tự đặc biệt, cần encode:
- `@` → `%40`
- `#` → `%23`
- `!` → `%21`
- `:` → `%3A`

**Ví dụ password có ký tự đặc biệt:**
```
Password: Pass@123!
Encoded: Pass%40123%21

Connection string:
mongodb://aeck_sync:Pass%40123%21@160.250.130.69:27017/aeckdb?authSource=admin
```

### Bước 2: Test Local

```bash
cd "d:\CODE\Web\ttkt.aeck.edu.vn\H--th-ng-tra-c-u-v----ng-k--kh-o-th--T---t-a"

# Sửa file test-mongodb-connection.js với connection string đúng
node test-mongodb-connection.js
```

Nếu thấy:
```
✅ Connected successfully!
✅ Can read users collection!
✅ Connection test passed!
```
→ Connection string đúng!

### Bước 3: Update GitHub Secret

1. Vào: https://github.com/aeck-dev/H--th-ng-tra-c-u-v----ng-k--kh-o-th--T---t-a/settings/secrets/actions
2. Click vào **MONGODB_URI**
3. Click **Update**
4. Paste connection string mới (có username:password)
5. Click **Update secret**

### Bước 4: Re-run Workflow

1. Vào **Actions** tab
2. Click workflow run bị lỗi
3. Click **Re-run jobs**

## 🧪 Test Connection Strings

### Test 1: No Auth (sẽ lỗi)
```
mongodb://160.250.130.69:27017
```

### Test 2: With Auth (đúng)
```
mongodb://username:password@160.250.130.69:27017/aeckdb?authSource=admin
```

### Test 3: With Special Characters in Password
```
mongodb://user:Pass%40123%21@160.250.130.69:27017/aeckdb?authSource=admin
```

## 🔍 Troubleshooting

### Lỗi: "Authentication failed"

**Nguyên nhân:** Username/password sai

**Giải pháp:**
1. Kiểm tra lại username/password
2. Encode special characters trong password
3. Đảm bảo user có quyền readWrite trên database `aeckdb`

### Lỗi: "Unauthorized"

**Nguyên nhân:** User không có quyền truy cập database

**Giải pháp:**
```javascript
use admin
db.grantRolesToUser("username", [
  { role: "readWrite", db: "aeckdb" }
])
```

### Lỗi: "Authentication database does not match"

**Giải pháp:** Thêm `?authSource=admin` vào cuối connection string

## 📝 Connection String Format Reference

```
mongodb://[username:password@]host[:port][/database][?options]

Components:
- username: MongoDB user name
- password: MongoDB password (encode special chars)
- host: Server IP or hostname
- port: MongoDB port (default: 27017)
- database: Database name (optional)
- options: Connection options (e.g., authSource=admin)
```

## ✅ Checklist

- [ ] Tìm được username/password MongoDB
- [ ] Test connection string local (test-mongodb-connection.js)
- [ ] Encode special characters nếu có
- [ ] Update GitHub Secret MONGODB_URI
- [ ] Re-run GitHub Actions workflow
- [ ] Verify workflow chạy thành công
