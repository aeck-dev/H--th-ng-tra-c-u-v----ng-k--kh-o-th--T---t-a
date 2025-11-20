const admin = require('firebase-admin');

// Firebase Admin config - sử dụng Web API Key để authenticate
// Lưu ý: Cách này chỉ hoạt động nếu bạn có Service Account Key
// Hoặc dùng Application Default Credentials

const firebaseConfig = {
  apiKey: "AIzaSyC_NrfdxxhzznvpeQsAeJgwhWMf8QjQr_8",
  authDomain: "ttkt-aeck-edu-vn.firebaseapp.com",
  databaseURL: "https://ttkt-aeck-edu-vn-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ttkt-aeck-edu-vn",
  storageBucket: "ttkt-aeck-edu-vn.firebasestorage.app",
  messagingSenderId: "1060126622642",
  appId: "1:1060126622642:web:af79af3a7d8896063a5aab"
};

// Khởi tạo Firebase Admin với Service Account Key
try {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: firebaseConfig.databaseURL
  });
  console.log('✅ Firebase Admin initialized with Service Account Key');
} catch (error) {
  console.log('❌ Lỗi: Không tìm thấy serviceAccountKey.json');
  console.log('📝 Bạn cần tải Service Account Key từ Firebase Console');
  console.log('   1. Vào: https://console.firebase.google.com/project/ttkt-aeck-edu-vn/settings/serviceaccounts/adminsdk');
  console.log('   2. Click "Generate new private key"');
  console.log('   3. Lưu file JSON với tên "serviceAccountKey.json" vào thư mục này');
  console.log('   4. Chạy lại: node delete-all-users.js');
  process.exit(1);
}

async function listAllUsers() {
  console.log('\n📋 Đang liệt kê tất cả users...\n');
  
  const allUsers = [];
  let nextPageToken;
  
  try {
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      allUsers.push(...listUsersResult.users);
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);
    
    console.log(`📊 Tổng số users: ${allUsers.length}\n`);
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email || user.phoneNumber || user.uid}`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   Created: ${user.metadata.creationTime}`);
      console.log(`   Last Login: ${user.metadata.lastSignInTime || 'Never'}`);
      console.log('');
    });
    
    return allUsers;
  } catch (error) {
    console.error('❌ Lỗi khi liệt kê users:', error.message);
    throw error;
  }
}

async function deleteAllUsers() {
  console.log('\n🗑️  BẮT ĐẦU XÓA TẤT CẢ USERS...\n');
  
  let deletedCount = 0;
  let errorCount = 0;
  let nextPageToken;
  
  try {
    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      
      console.log(`📦 Đang xử lý batch: ${listUsersResult.users.length} users`);
      
      // Xóa từng user
      for (const user of listUsersResult.users) {
        try {
          await admin.auth().deleteUser(user.uid);
          deletedCount++;
          console.log(`✅ [${deletedCount}] Đã xóa: ${user.email || user.uid}`);
        } catch (error) {
          errorCount++;
          console.error(`❌ [${errorCount}] Lỗi khi xóa ${user.uid}: ${error.message}`);
        }
      }
      
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 HOÀN TẤT!');
    console.log('='.repeat(60));
    console.log(`✅ Đã xóa: ${deletedCount} users`);
    console.log(`❌ Lỗi: ${errorCount} users`);
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Lỗi nghiêm trọng:', error.message);
    throw error;
  }
}

// Menu chính
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔥 FIREBASE USER MANAGEMENT TOOL');
  console.log('='.repeat(60));
  console.log('Project: ttkt-aeck-edu-vn');
  console.log('='.repeat(60) + '\n');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (query) => new Promise((resolve) => readline.question(query, resolve));
  
  try {
    const action = await question('Chọn hành động:\n1. Liệt kê tất cả users\n2. XÓA TẤT CẢ USERS (KHÔNG THỂ HOÀN TÁC!)\n3. Thoát\n\nNhập số (1/2/3): ');
    
    switch (action.trim()) {
      case '1':
        await listAllUsers();
        break;
        
      case '2':
        console.log('\n⚠️  CẢNH BÁO: HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC!\n');
        const confirm = await question('Gõ "XOA TAT CA" để xác nhận: ');
        
        if (confirm.trim() === 'XOA TAT CA') {
          await deleteAllUsers();
        } else {
          console.log('❌ Đã hủy. Không có gì bị xóa.');
        }
        break;
        
      case '3':
        console.log('👋 Tạm biệt!');
        break;
        
      default:
        console.log('❌ Lựa chọn không hợp lệ');
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    readline.close();
    process.exit(0);
  }
}

// Chạy
main();
