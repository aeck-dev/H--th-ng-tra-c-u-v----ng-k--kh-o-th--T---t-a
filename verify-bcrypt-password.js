// Verify Bcrypt Password Hash
const bcrypt = require('bcrypt');

// Hash từ database MongoDB
const hashFromDB = '$2a$10$ZgLhFBgr4ujSTDhP7RHTSeMHL0q6HSh/A04/bJN0SeXE6Are3smgi';

// Password cần test
const passwordsToTest = [
    'Cuong123',
    'cuong123',
    'CUONG123',
    'Cuong@123',
    '123Cuong'
];

async function verifyPasswords() {
    console.log('🔐 Testing passwords against bcrypt hash...\n');
    console.log('Hash:', hashFromDB);
    console.log('\n' + '='.repeat(60) + '\n');

    for (const password of passwordsToTest) {
        try {
            const isMatch = await bcrypt.compare(password, hashFromDB);
            
            if (isMatch) {
                console.log(`✅ MATCH FOUND!`);
                console.log(`   Password: "${password}"`);
                console.log(`   This is the correct password!\n`);
            } else {
                console.log(`❌ "${password}" - Not a match`);
            }
        } catch (error) {
            console.log(`⚠️  Error testing "${password}":`, error.message);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n💡 Tip: Nếu không tìm thấy match, password có thể:');
    console.log('   - Có khoảng trắng đầu/cuối');
    console.log('   - Có ký tự đặc biệt khác');
    console.log('   - Case-sensitive khác');
}

verifyPasswords();
