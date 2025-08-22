# Hướng dẫn Setup Google Sheets cho Hệ thống Đăng ký Thi 2K8

## Bước 1: Tạo Google Sheet mới

1. Truy cập [Google Sheets](https://sheets.google.com)
2. Tạo một sheet mới
3. Đặt tên sheet: "Đăng ký thi 2K8"
4. Copy URL của sheet (sẽ có dạng: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`)
5. Lưu lại **SPREADSHEET_ID** (phần giữa URL)

## Bước 2: Tạo Google Apps Script

1. Truy cập [Google Apps Script](https://script.google.com)
2. Tạo project mới
3. Đặt tên project: "Đăng ký thi 2K8 API"
4. Copy toàn bộ code từ file `google-apps-script.js` vào editor
5. Thay thế `YOUR_SPREADSHEET_ID_HERE` bằng SPREADSHEET_ID thực tế của bạn

## Bước 3: Deploy Google Apps Script

1. Click vào nút **Deploy** (biểu tượng máy bay)
2. Chọn **New deployment**
3. Chọn **Web app** làm loại deployment
4. Cấu hình:
   - **Execute as**: Me
   - **Who has access**: Anyone
5. Click **Deploy**
6. Copy **Web app URL** được tạo ra

## Bước 4: Cập nhật Website

1. Mở file `script.js`
2. Thay thế `YOUR_GOOGLE_APPS_SCRIPT_WEBAPP_URL_HERE` bằng Web app URL thực tế
3. Lưu file

## Bước 5: Test hệ thống

1. Mở website
2. Thử đăng ký với thông tin test
3. Kiểm tra Google Sheet xem dữ liệu có được lưu không

## Cấu trúc dữ liệu trong Google Sheet

Sheet sẽ có các cột sau:
- Thời gian đăng ký
- Họ và tên
- Email
- Số điện thoại
- Link Facebook
- Tỉnh/Thành phố
- Đối tượng
- Đợt thi
- Trạng thái

## Troubleshooting

### Lỗi CORS
- Đảm bảo Google Apps Script được deploy với quyền "Anyone"
- Kiểm tra URL web app có đúng không

### Lỗi 403 Forbidden
- Kiểm tra quyền truy cập Google Sheet
- Đảm bảo Google Apps Script có quyền chỉnh sửa Sheet

### Dữ liệu không được lưu
- Kiểm tra console browser để xem lỗi
- Kiểm tra logs trong Google Apps Script
- Đảm bảo SPREADSHEET_ID đúng

## Tính năng bổ sung

### Tự động gửi email xác nhận
Thêm code sau vào Google Apps Script:

```javascript
function sendConfirmationEmail(data) {
  const subject = 'Xác nhận đăng ký thi TSA 2026';
  const body = `
    Xin chào ${data.fullName},
    
    Cảm ơn bạn đã đăng ký tham gia Bài thi TSA 2026 Đợt 1.
    
    Thông tin đăng ký:
    - Họ tên: ${data.fullName}
    - Email: ${data.email}
    - Số điện thoại: ${data.phone}
    - Tỉnh/Thành phố: ${data.province}
    - Đối tượng: ${data.target}
    
    Chúng tôi sẽ liên hệ với bạn sớm nhất để cung cấp thông tin chi tiết về kỳ thi.
    
    Trân trọng,
    Ban tổ chức TSA 2026
  `;
  
  GmailApp.sendEmail(data.email, subject, body);
}
```

### Tạo báo cáo tự động
Thêm code để tạo báo cáo định kỳ:

```javascript
function createWeeklyReport() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // Tạo báo cáo tuần
  const weeklyData = data.filter(row => {
    const date = new Date(row[0]);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date > weekAgo;
  });
  
  // Gửi báo cáo qua email
  const reportBody = `Báo cáo đăng ký tuần: ${weeklyData.length} người đăng ký`;
  GmailApp.sendEmail('admin@example.com', 'Báo cáo đăng ký tuần', reportBody);
}
```

## Bảo mật

- Không chia sẻ SPREADSHEET_ID công khai
- Sử dụng Google Apps Script với quyền hạn tối thiểu
- Backup dữ liệu định kỳ
- Theo dõi logs để phát hiện hoạt động bất thường 