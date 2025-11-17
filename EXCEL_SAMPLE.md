# 📊 Sample Excel Data Structure

Đây là cấu trúc dữ liệu mẫu cho file Excel cần upload vào hệ thống:

## Cấu trúc cột (bắt đầu từ cột A):

| Cột | Tên cột | Mô tả | Ví dụ |
|-----|---------|-------|-------|
| A | Rank | Xếp hạng | 1, 2, 3, ... |
| B | ID | Mã thí sinh | TSA001, TSA002, ... |
| C | GMAIL | Email thí sinh | student1@gmail.com |
| D | math_correct | Số câu đúng môn Toán | 35 |
| E | reading_correct | Số câu đúng môn Đọc hiểu | 18 |
| F | science_correct | Số câu đúng môn Khoa học | 38 |
| G | total_correct | Tổng số câu đúng | 91 |
| H | theta | Theta score | 2.145 |
| I | IRT_math | Điểm IRT môn Toán | 85.67 |
| J | IRT_reading | Điểm IRT môn Đọc hiểu | 82.34 |
| K | IRT_science | Điểm IRT môn Khoa học | 89.12 |
| L | IRT_score | Điểm IRT tổng | 85.71 |

## Dữ liệu mẫu:

```
Rank,ID,GMAIL,math_correct,reading_correct,science_correct,total_correct,theta,IRT_math,IRT_reading,IRT_science,IRT_score
1,TSA001,student1@gmail.com,35,18,38,91,2.145,85.67,82.34,89.12,85.71
2,TSA002,student2@gmail.com,32,17,35,84,1.892,79.45,78.90,83.21,80.52
3,TSA003,test@aeck.edu.vn,30,16,33,79,1.654,75.23,74.56,78.89,76.23
4,TSA004,admin@example.com,28,15,31,74,1.445,72.15,71.23,75.67,73.02
5,TSA005,demo@test.com,26,14,29,69,1.234,68.90,67.45,72.34,69.56
```

## Lưu ý quan trọng:

1. **File format**: Chỉ hỗ trợ .xlsx hoặc .xls
2. **Header row**: Dòng đầu tiên phải chứa tên cột chính xác
3. **Required columns**: GMAIL, total_correct, IRT_score là bắt buộc
4. **Email format**: Phải là email hợp lệ và unique
5. **Numeric values**: Các cột điểm số phải là số

## Tạo file Excel mẫu:

1. Mở Excel/Google Sheets
2. Tạo sheet mới với header như trên
3. Điền dữ liệu mẫu
4. Save as .xlsx format
5. Upload vào Admin Panel

## Test với dữ liệu mẫu:

Sau khi upload thành công, bạn có thể test tra cứu với các email:
- `student1@gmail.com`
- `student2@gmail.com`
- `test@aeck.edu.vn`
- `admin@example.com`
- `demo@test.com`