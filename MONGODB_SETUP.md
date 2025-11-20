# Hướng Dẫn Cài Đặt Hệ Thống Đăng Nhập MongoDB

## Tổng Quan

Hệ thống đã được nâng cấp để sử dụng đăng nhập bằng **Email + Password** thay vì Email + ID. Thông tin tài khoản được lưu trong MongoDB.

## Kiến Trúc Hệ Thống

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Frontend       │──────▶│  Backend Server  │──────▶│   MongoDB       │
│  (index.html)   │      │  (Express API)   │      │  (Users DB)     │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │    Firebase      │
                         │  (Exam Results)  │
                         └──────────────────┘
```

## Bước 1: Cài Đặt Dependencies

### 1.1 Cài đặt Node.js
Tải và cài đặt Node.js từ: https://nodejs.org/

### 1.2 Cài đặt các package cần thiết
```bash
cd d:\CODE\Web\ttkt.aeck.edu.vn\H--th-ng-tra-c-u-v----ng-k--kh-o-th--T---t-a
npm install
```

Hoặc cài đặt thủ công:
```bash
npm install express cors mongodb bcrypt
npm install --save-dev nodemon
```

## Bước 2: Cấu Hình MongoDB

### 2.1 Cấu trúc Database

**Database Name:** `aeckdb`  
**Collection:** `users`

**Schema:**
```javascript
{
  _id: ObjectId,
  email: String,           // Email đăng nhập
  password: String,        // Mật khẩu (hash hoặc plain text)
  identifier: String,      // ID tài khoản (VD: AECK413158)
  fullName: String,        // Họ và tên
  role: Number,           // Vai trò (1 = user, 2 = admin)
  premium: Boolean,       // Tài khoản premium
  createdAt: Date,
  updatedAt: Date,
  __v: Number
}
```

### 2.2 Cập nhật Connection String

Mở file `backend-server.js` và kiểm tra:

```javascript
const MONGODB_URI = 'mongodb://160.250.130.69:27017';
const DB_NAME = 'aeckdb';
```

**Lưu ý:** Thay đổi IP và port nếu MongoDB của bạn khác.

## Bước 3: Chạy Backend Server

### 3.1 Chạy server
```bash
node backend-server.js
```

Hoặc sử dụng nodemon (tự động reload khi có thay đổi):
```bash
npm run dev
```

### 3.2 Kiểm tra server hoạt động
Mở trình duyệt và truy cập: http://localhost:3000/api/health

Bạn sẽ thấy:
```json
{
  "success": true,
  "message": "Server is running",
  "mongodb": "connected"
}
```

## Bước 4: Cập Nhật Frontend

### 4.1 Đảm bảo các file đã được thêm:
- ✅ `mongodb-service.js` - Service kết nối MongoDB
- ✅ `backend-server.js` - Backend API server
- ✅ `package.json` - Dependencies

### 4.2 Kiểm tra index.html đã load mongodb-service.js:
```html
<script src="mongodb-service.js"></script>
```

## Bước 5: Sử Dụng Hệ Thống

### 5.1 Đăng nhập
1. Mở `index.html` trong trình duyệt
2. Nhập **Email** và **Mật khẩu**
3. Nhấn "Đăng nhập"

### 5.2 Xác thực
- Backend sẽ tìm user trong MongoDB theo email
- So sánh password (hỗ trợ cả bcrypt hash và plain text)
- Nếu đúng → Đăng nhập thành công → Hiển thị kết quả thi từ Firebase
- Nếu sai → Hiển thị lỗi "Email hoặc mật khẩu không đúng"

## API Endpoints

### 1. Health Check
```
GET /api/health
Response: { success: true, mongodb: "connected" }
```

### 2. Login
```
POST /api/auth/login
Body: { email: "user@example.com", password: "password123" }
Response: { 
  success: true,
  user: { id, email, identifier, fullName, role, premium }
}
```

### 3. Verify Credentials
```
POST /api/auth/verify
Body: { email: "user@example.com", password: "password123" }
Response: { success: true/false }
```

### 4. Get User by Email
```
GET /api/users/email/:email
Response: { 
  success: true,
  user: { email, identifier, fullName, ... }
}
```

## Bảo Mật

### Khuyến nghị:
1. **Hash Password:** Sử dụng bcrypt để hash password trong database
2. **HTTPS:** Triển khai HTTPS cho production
3. **CORS:** Cấu hình CORS chỉ cho phép domain cụ thể
4. **Rate Limiting:** Thêm giới hạn số lần đăng nhập
5. **JWT Token:** Sử dụng JWT cho session management

### Hash Password Example:
```javascript
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Hash password
const hashedPassword = await bcrypt.hash('plainPassword', saltRounds);

// Verify password
const match = await bcrypt.compare('plainPassword', hashedPassword);
```

## Troubleshooting

### Lỗi: Cannot connect to MongoDB
**Giải pháp:**
- Kiểm tra MongoDB đang chạy
- Kiểm tra IP và port trong connection string
- Kiểm tra firewall cho phép kết nối đến MongoDB

### Lỗi: 401 Unauthorized
**Giải pháp:**
- Kiểm tra email và password có đúng
- Kiểm tra user tồn tại trong database
- Kiểm tra format password (hash vs plain text)

### Lỗi: CORS blocked
**Giải pháp:**
- Đảm bảo backend server đã cài `cors`
- Kiểm tra `app.use(cors())` trong backend-server.js

## Production Deployment

### Backend Server
1. Triển khai lên VPS/Cloud (AWS, Heroku, DigitalOcean)
2. Cấu hình domain và SSL certificate
3. Sử dụng PM2 hoặc systemd để chạy server persistent
4. Cập nhật `apiUrl` trong `mongodb-service.js`

### MongoDB
1. Sử dụng MongoDB Atlas (cloud) hoặc self-hosted
2. Cấu hình authentication
3. Whitelist IP addresses
4. Backup database định kỳ

## Liên Hệ Hỗ Trợ

Nếu gặp vấn đề, vui lòng liên hệ team dev AECK.
