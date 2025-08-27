// Google Apps Script để xử lý dữ liệu đăng ký thi và tra cứu điểm
function doPost(e) {
  try {
    // Hỗ trợ cả JSON và form-encoded (payload)
    let data;
    if (e && e.postData && e.postData.contents && e.postData.type === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter && e.parameter.payload) {
      data = JSON.parse(e.parameter.payload);
    } else {
      throw new Error('Payload trống hoặc sai định dạng');
    }

    // Nếu là yêu cầu tra cứu điểm
    if (data.action === 'lookup') {
      return handleScoreLookup(data);
    }
    
    // Xử lý đăng ký thi
    // Lấy spreadsheet ID - thay thế bằng ID của bạn
    const spreadsheetId = '1YsiW7UYm2LVo83TOPtoFHy71WqGhqwLVCvQ38-WoY00';
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName('DATA ĐĂNG KÍ') || ss.getActiveSheet();
    
    // Tạo timestamp
    const timestamp = new Date().toLocaleString('vi-VN');
    
    // Chuẩn bị dữ liệu để ghi vào sheet
    const rowData = [
      timestamp,                    // Thời gian đăng ký
      data.fullName,               // Họ và tên
      data.email,                  // Email
      data.phone,                  // Số điện thoại
      data.facebook,               // Link Facebook
      data.province,               // Tỉnh/Thành phố
      data.target,                 // Đối tượng
      data.examSession || 'tsa-2026-dot-1', // Đợt thi (code ngắn)
      'Chờ xử lý'                  // Trạng thái
    ];
    
    // Ghi dữ liệu vào sheet
    sheet.appendRow(rowData);
    
    // Trả về response thành công
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Đăng ký thành công!',
        registrationId: timestamp + '_' + data.email
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Trả về lỗi nếu có
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Có lỗi xảy ra: ' + error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Xử lý tra cứu điểm thi
 */
function handleScoreLookup(data) {
  try {
    // Lấy spreadsheet ID
    const spreadsheetId = '1YsiW7UYm2LVo83TOPtoFHy71WqGhqwLVCvQ38-WoY00';
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName('KẾT QUẢ');
    
    if (!sheet) {
      throw new Error('Không tìm thấy sheet kết quả');
    }

    // Lấy tất cả dữ liệu từ sheet
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    // Dòng đầu tiên là tiêu đề
    const headers = values[0];
    
    // Tìm vị trí các cột
    const emailCol = headers.indexOf('GMAIL');
    const idCol = headers.indexOf('ID HS');
    const toanCol = headers.indexOf('TOÁN');
    const docHieuCol = headers.indexOf('ĐỌC HIỂU');
    const khoaHocCol = headers.indexOf('KHOA HỌC');
    const irtCol = headers.indexOf('IRT');
    
    if (emailCol === -1 || idCol === -1 || toanCol === -1 || 
        docHieuCol === -1 || khoaHocCol === -1 || irtCol === -1) {
      throw new Error('Cấu trúc sheet không hợp lệ');
    }

    // Tìm học sinh theo email và đợt thi
    let studentRow = values.find((row, index) => {
      if (index === 0) return false; // Bỏ qua hàng tiêu đề
      return row[emailCol] === data.email;
    });

    if (!studentRow) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Không tìm thấy thông tin điểm thi cho email này'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Trả về kết quả
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: {
          email: studentRow[emailCol],
          idHs: studentRow[idCol],
          toan: studentRow[toanCol],
          docHieu: studentRow[docHieuCol],
          khoaHoc: studentRow[khoaHocCol],
          irt: studentRow[irtCol]
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Có lỗi xảy ra: ' + error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Tra cứu
  if (e && e.parameter && e.parameter.action === 'lookup') {
    const email = e.parameter.email || '';
    const examSession = e.parameter.examSession || '';
    const ss = SpreadsheetApp.openById('1YsiW7UYm2LVo83TOPtoFHy71WqGhqwLVCvQ38-WoY00');
    const sheet = ss.getSheetByName('DATA ĐĂNG KÍ') || ss.getActiveSheet();
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if ((values[i][2] + '').trim().toLowerCase() === email.trim().toLowerCase() && (values[i][7] + '') === examSession) {
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          data: {
            fullName: values[i][1],
            email: values[i][2],
            phone: values[i][3],
            facebook: values[i][4],
            province: values[i][5],
            target: values[i][6],
            examSession: values[i][7]
          }
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Không tìm thấy thông tin đăng ký' })).setMimeType(ContentService.MimeType.JSON);
  }
  // Endpoint test
  return ContentService.createTextOutput('Google Apps Script đang hoạt động!').setMimeType(ContentService.MimeType.TEXT);
}

// Hàm để tạo headers cho sheet (chạy một lần)
function setupSheet() {
  const spreadsheetId = '1YsiW7UYm2LVo83TOPtoFHy71WqGhqwLVCvQ38-WoY00';
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName('DATA ĐĂNG KÍ') || ss.getActiveSheet();
  
  // Tạo headers
  const headers = [
    'Thời gian đăng ký',
    'Họ và tên',
    'Email',
    'Số điện thoại',
    'Link Facebook',
    'Tỉnh/Thành phố',
    'Đối tượng',
    'Đợt thi',
    'Trạng thái'
  ];
  
  // Ghi headers vào dòng đầu tiên
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format headers
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('white');
}