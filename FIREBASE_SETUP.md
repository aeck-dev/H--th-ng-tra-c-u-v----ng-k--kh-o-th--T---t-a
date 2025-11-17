# Firebase Setup Guide

## 1. Tạo Firebase Project
1. Vào https://console.firebase.google.com/
2. Tạo project mới: "aeck-exam-results"
3. Chọn Realtime Database
4. Chọn "Start in test mode" (rules sẽ config sau)

## 2. Lấy Firebase Config
Trong Project Settings → General → Your apps → Web app
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## 3. Database Structure
```json
{
  "sessions": {
    "tsa-2024-dot-1": {
      "code": "tsa-2024-dot-1",
      "name": "TSA 2024 - Đợt 1",
      "description": "Kỳ thi TSA 2024 đợt 1",
      "status": "active",
      "examDate": "2024-04-27",
      "examInfo": "Thi tại điểm thi",
      "createdAt": "2024-03-01T00:00:00.000Z",
      "recordCount": 150
    }
  },
  "exam_results": {
    "tsa-2024-dot-1": {
      "data": [
        {
          "Email": "student@example.com",
          "Họ và tên": "Nguyễn Văn A",
          "Số báo danh": "TSA001",
          "Điểm tổng": "85.5",
          "Xếp loại": "Giỏi"
        }
      ],
      "uploadedAt": "2024-03-01T00:00:00.000Z",
      "recordCount": 150
    }
  }
}
```

## 4. Security Rules
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

## 5. Admin Authentication
- Enable Email/Password authentication
- Tạo admin account
- Admin login để upload dữ liệu