# 🏛️ AECK Admin Panel - Hướng dẫn sử dụng

## 📋 Tổng quan

Hệ thống Admin Panel cho phép upload file Excel chứa kết quả thi TSA 2026 và tích hợp với trang tra cứu chính.

## 🚀 Cách sử dụng

### 1. Truy cập Admin Panel
- Mở file `admin.html` trong trình duyệt
- Hoặc truy cập: `https://your-domain.com/admin.html`

### 2. Quản lý Đợt Thi
1. **Tạo đợt thi mới**:
   - Click "➕ Tạo đợt thi mới"
   - Nhập mã đợt thi (vd: `tsa-2026-dot-3`)
   - Nhập tên đợt thi (vd: `TSA 2026 - Đợt 3`)
   - Chọn trạng thái: Hoạt động/Tạm dừng/Hoàn thành
   - Có thể đặt làm đợt thi mặc định

2. **Quản lý đợt thi**:
   - **Chọn làm việc**: Chọn đợt thi để upload dữ liệu
   - **Đặt mặc định**: Đợt thi sẽ được chọn sẵn trong form tra cứu
   - **Xóa đợt thi**: Xóa đợt thi và toàn bộ dữ liệu (cẩn thận!)

### 3. Upload file Excel
1. **Chọn đợt thi**: Chọn đợt thi từ dropdown "Chọn đợt thi để upload"

2. **Chuẩn bị file Excel** với cấu trúc cột:
   ```
   Rank | ID | GMAIL | math_correct | reading_correct | science_correct | 
   total_correct | theta | IRT_math | IRT_reading | IRT_science | IRT_score
   ```

3. **Upload file**:
   - Kéo thả file vào vùng upload
   - Hoặc click "Chọn File Excel"
   - Hệ thống sẽ tự động validate và preview dữ liệu

4. **Kiểm tra và lưu**:
   - Xem preview dữ liệu trong bảng
   - Kiểm tra thống kê: tổng records, điểm trung bình
   - Click "Lưu vào hệ thống"
   - Dữ liệu sẽ được lưu vào đợt thi đã chọn

### 4. Test tra cứu
- Nhập email trong mục "Test tra cứu"
- Hệ thống sẽ tìm kiếm qua tất cả các đợt thi
- Kết quả sẽ hiển thị đợt thi tìm thấy
- Đảm bảo dữ liệu hiển thị chính xác

### 4. Quản lý dữ liệu hiện tại
- **Tải lại**: Refresh dữ liệu current
- **Xuất dữ liệu**: Download file JSON backup
- **Xóa dữ liệu**: Clear toàn bộ dữ liệu (cẩn thận!)

## 📊 Format file Excel

### Cột bắt buộc:
- `GMAIL`: Email thí sinh (unique)
- `total_correct`: Tổng số câu đúng
- `IRT_score`: Điểm IRT tổng

### Cột khuyến nghị:
- `Rank`: Xếp hạng
- `ID`: Mã thí sinh
- `math_correct`: Số câu đúng môn Toán
- `reading_correct`: Số câu đúng môn Đọc hiểu  
- `science_correct`: Số câu đúng môn Khoa học
- `theta`: Theta score
- `IRT_math`, `IRT_reading`, `IRT_science`: Điểm IRT từng môn

### Ví dụ dữ liệu:
```
Rank | ID    | GMAIL              | math_correct | reading_correct | science_correct | total_correct | theta | IRT_math | IRT_reading | IRT_science | IRT_score
1    | TSA001| student1@gmail.com | 35           | 18              | 38              | 91            | 2.145 | 85.67    | 82.34       | 89.12       | 85.71
2    | TSA002| student2@gmail.com | 32           | 17              | 35              | 84            | 1.892 | 79.45    | 78.90       | 83.21       | 80.52
```

## 🔄 Tích hợp với trang chính

### Workflow Admin → User:
1. **Admin tạo đợt thi** trong admin panel
2. **Admin upload dữ liệu Excel** cho đợt thi đó
3. **Trang user tự động hiển thị** đợt thi có dữ liệu
4. **Thí sinh tra cứu** bằng email trong các đợt thi available

### Quy tắc hiển thị cho user:
- ✅ **Chỉ hiển thị đợt thi có dữ liệu** (đã upload Excel)
- ✅ **Chỉ hiển thị đợt thi active/completed** (không hiển thị inactive)
- ✅ **Hiển thị số lượng thí sinh** (vd: "TSA 2026 - Đợt 1 (150 thí sinh)")
- ✅ **Auto-select đợt thi default** khi có

### Tính năng tra cứu:
- **Session-specific search**: Chọn đợt thi cụ thể để tìm kiếm
- **Multi-session search**: Nếu không chọn đợt thi, sẽ tìm qua tất cả đợt thi
- **Result context**: Kết quả hiển thị đợt thi mà email được tìm thấy
- **Real-time sync**: Khi admin thêm dữ liệu, user thấy ngay

## 🧪 Test với dữ liệu mẫu

1. Import file `sample-data.json` vào localStorage:
   ```javascript
   // Mở Console trong browser
   const sampleData = /* copy content from sample-data.json */;
   localStorage.setItem('aeck_exam_results', JSON.stringify(sampleData));
   ```

2. Test với email mẫu:
   - `student1@gmail.com`
   - `student2@gmail.com` 
   - `test@aeck.edu.vn`

## ⚠️ Lưu ý quan trọng

### Bảo mật:
- File `admin.html` chỉ dành cho admin
- Nên đặt password protect hoặc IP restrict
- Không public admin panel ra internet

### Dữ liệu:
- Dữ liệu lưu trong `localStorage` (client-side)
- Không bị mất khi refresh, nhưng mất khi clear cache
- Nên backup thường xuyên bằng chức năng "Xuất dữ liệu"

### Performance:
- File Excel không nên quá lớn (>10MB)
- Số lượng records khuyến nghị <10,000
- Browser có thể chậm với dữ liệu lớn

## 🔧 Troubleshooting

### Lỗi upload file:
- Kiểm tra format file (.xlsx, .xls)
- Đảm bảo có cột `GMAIL`, `total_correct`, `IRT_score`
- Kiểm tra email format hợp lệ

### Không tra cứu được:
- Kiểm tra dữ liệu đã lưu vào localStorage chưa
- Verify email chính xác (case-sensitive)
- Clear cache và thử lại

### Dữ liệu bị mất:
- Import lại từ file backup JSON
- Hoặc upload lại file Excel gốc

## 📞 Hỗ trợ

Nếu có vấn đề, liên hệ:
- Email: admin@aeck.edu.vn
- Phone: 0123-456-789

## 🔄 Changelog

### v1.0 (2025-11-17)
- ✅ Upload Excel với validation
- ✅ Preview dữ liệu trước khi lưu
- ✅ Tích hợp tra cứu với localStorage
- ✅ Test lookup built-in
- ✅ Export/Import JSON backup
- ✅ Responsive design