// Quick test script to create admin data
console.log('🧪 Creating test admin data...');

// Create test session
const testSession = {
    code: 'test-2024',
    name: 'Đợt Test 2024',
    description: 'Session test cho admin-user flow',
    status: 'active',
    isDefault: true,
    createdAt: new Date().toISOString(),
    recordCount: 2
};

// Save session to localStorage
localStorage.setItem('aeck_exam_sessions', JSON.stringify([testSession]));

// Create test data
const testData = {
    data: [
        {
            'Email': 'test1@aeck.edu.vn',
            'Họ và tên': 'Nguyễn Văn Test',
            'Số báo danh': 'SBD001',
            'Điểm tổng': '850',
            'Xếp loại': 'Khá'
        },
        {
            'Email': 'test2@aeck.edu.vn', 
            'Họ và tên': 'Trần Thị Test',
            'Số báo danh': 'SBD002',
            'Điểm tổng': '900',
            'Xếp loại': 'Giỏi'
        }
    ],
    uploadedAt: new Date().toISOString(),
    recordCount: 2
};

// Save test data
localStorage.setItem('aeck_exam_results_test-2024', JSON.stringify(testData));

console.log('✅ Test data created!');
console.log('📦 Sessions:', localStorage.getItem('aeck_exam_sessions'));
console.log('📊 Test data:', localStorage.getItem('aeck_exam_results_test-2024'));

// Try to load sessions like user page does
console.log('🔍 Testing user load...');
const sessions = localStorage.getItem('aeck_exam_sessions');
if (sessions) {
    const sessionsList = JSON.parse(sessions);
    sessionsList.forEach(session => {
        console.log(`Session: ${session.code}, status: ${session.status}`);
        const sessionData = localStorage.getItem(`aeck_exam_results_${session.code}`);
        const hasData = sessionData && JSON.parse(sessionData).data.length > 0;
        console.log(`Has data: ${hasData}, Will show: ${hasData && session.status === 'active'}`);
    });
}