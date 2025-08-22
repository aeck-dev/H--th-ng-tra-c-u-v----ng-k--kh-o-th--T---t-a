# Hệ thống Đăng ký Thi 2K8

Hệ thống đăng ký thi trực tuyến với khả năng lưu trữ dữ liệu vào Google Sheets.

## Tính năng chính

- ✅ Giao diện đẹp, responsive
- ✅ Form đăng ký với validation
- ✅ Lưu trữ dữ liệu vào Google Sheets
- ✅ Tra cứu thông tin đăng ký
- ✅ Quản lý nhiều đợt thi
- ✅ Gửi email xác nhận tự động

## Cấu trúc dự án

```
Đăng kí thi 2K8/
├── index.html              # Trang chính
├── style.css               # CSS styles
├── script.js               # JavaScript logic
├── assets/                 # Hình ảnh và tài nguyên
├── google-apps-script.js   # Google Apps Script code
├── test-google-sheets.html # File test Google Sheets
├── GOOGLE_SHEETS_SETUP.md  # Hướng dẫn setup
└── README.md               # File này
```

## Setup nhanh

### 1. Tạo Google Sheet
1. Tạo sheet mới tại [Google Sheets](https://sheets.google.com)
2. Copy URL và lưu lại SPREADSHEET_ID

### 2. Tạo Google Apps Script
1. Truy cập [Google Apps Script](https://script.google.com)
2. Tạo project mới
3. Copy code từ `google-apps-script.js`
4. Thay thế `YOUR_SPREADSHEET_ID_HERE` bằng ID thực tế
5. Deploy thành Web app

### 3. Cập nhật Website
1. Mở `script.js`
2. Thay thế `YOUR_GOOGLE_APPS_SCRIPT_WEBAPP_URL_HERE` bằng URL Web app
3. Lưu file

### 4. Test hệ thống
1. Mở `test-google-sheets.html` để test
2. Kiểm tra dữ liệu trong Google Sheet

## Hướng dẫn chi tiết

Xem file `GOOGLE_SHEETS_SETUP.md` để có hướng dẫn setup chi tiết.

## Cách sử dụng

### Đăng ký thi
1. Mở `index.html`
2. Chọn "ĐĂNG KÝ THI"
3. Chọn đợt thi
4. Điền thông tin và submit

### Tra cứu
1. Chọn "TRA CỨU"
2. Nhập email và chọn đợt thi
3. Xem kết quả

## Dữ liệu được lưu

Mỗi đăng ký sẽ được lưu với các thông tin:
- Thời gian đăng ký
- Họ và tên
- Email
- Số điện thoại
- Link Facebook
- Tỉnh/Thành phố
- Đối tượng (2K8, 2K9, TSTD)
- Đợt thi
- Trạng thái

## Tính năng nâng cao

### Gửi email tự động
Thêm code sau vào Google Apps Script:

```javascript
function sendConfirmationEmail(data) {
  const subject = 'Xác nhận đăng ký thi TSA 2026';
  const body = `Xin chào ${data.fullName}, cảm ơn bạn đã đăng ký...`;
  GmailApp.sendEmail(data.email, subject, body);
}
```

### Báo cáo định kỳ
Tạo trigger để gửi báo cáo hàng tuần:

```javascript
function createWeeklyReport() {
  // Code tạo báo cáo
}
```

## Troubleshooting

### Lỗi thường gặp

**CORS Error:**
- Đảm bảo Google Apps Script deploy với quyền "Anyone"
- Kiểm tra URL web app

**403 Forbidden:**
- Kiểm tra quyền truy cập Google Sheet
- Đảm bảo Google Apps Script có quyền chỉnh sửa

**Dữ liệu không lưu:**
- Kiểm tra console browser
- Kiểm tra logs Google Apps Script
- Đảm bảo SPREADSHEET_ID đúng

## Bảo mật

- Không chia sẻ SPREADSHEET_ID công khai
- Sử dụng quyền hạn tối thiểu
- Backup dữ liệu định kỳ
- Theo dõi logs

## Hỗ trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra console browser (F12)
2. Xem logs trong Google Apps Script
3. Đảm bảo đã setup đúng theo hướng dẫn

## Phiên bản

- Version: 1.0.0
- Cập nhật: 2024
- Tác giả: Team 2K8 