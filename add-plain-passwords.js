// Script thêm plain password vào MongoDB (chạy 1 lần)
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const MONGODB_URI = 'mongodb://aeckTu13102006:1x31SfRU8dU2l@160.250.130.69:27017/aeckdb?authSource=admin';

async function addPlainPasswords() {
    console.log('🔐 Adding plain passwords to MongoDB users...\n');
    
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db('aeckdb');
    const usersCollection = db.collection('users');
    
    // Danh sách users và password gốc của họ
    const userPasswords = [
        { email: 'tuanpham31798@gmail.com', plainPassword: 'Cuong123' },
        { email: 'chuyenvienaeck@gmail.com', plainPassword: 'password_here' },
        { email: 'vietcuongtrumpad2k7@gmail.com', plainPassword: 'password_here' },
        // Thêm các users khác...
    ];
    
    let updated = 0;
    
    for (const userData of userPasswords) {
        const result = await usersCollection.updateOne(
            { email: userData.email },
            { $set: { plainPassword: userData.plainPassword } }
        );
        
        if (result.modifiedCount > 0) {
            console.log(`✅ Updated: ${userData.email}`);
            updated++;
        } else {
            console.log(`⚠️  Not found: ${userData.email}`);
        }
    }
    
    console.log(`\n✅ Updated ${updated} users with plain passwords`);
    console.log('⚠️  Remember to remove plainPassword field after sync!');
    
    await client.close();
}

addPlainPasswords().catch(console.error);
