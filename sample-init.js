// Sample data initialization script - DEPRECATED
// This file is no longer needed. User page now only shows admin-created sessions.
// 
// To test the system:
// 1. Open admin.html
// 2. Create exam sessions
// 3. Upload Excel data for those sessions
// 4. User page will automatically show available sessions
//
// Legacy code (not used):
/*
const sampleSessions = [
    {
        code: 'tsa-2026-dot-1',
        name: 'TSA 2026 - Đợt 1',
        description: 'Đợt thi đầu tiên của kỳ thi TSA 2026',
        status: 'completed',
        isDefault: false,
        createdAt: '2025-11-01T00:00:00.000Z',
        recordCount: 3,
        lastUpdate: '2025-11-01T10:00:00.000Z'
    },
    {
        code: 'tsa-2026-dot-2',
        name: 'TSA 2026 - Đợt 2',
        description: 'Đợt thi thứ hai của kỳ thi TSA 2026',
        status: 'active',
        isDefault: true,
        createdAt: '2025-11-17T00:00:00.000Z',
        recordCount: 5,
        lastUpdate: '2025-11-17T10:00:00.000Z'
    },
    {
        code: 'tsa-2026-dot-3',
        name: 'TSA 2026 - Đợt 3',
        description: 'Đợt thi thứ ba của kỳ thi TSA 2026',
        status: 'inactive',
        isDefault: false,
        createdAt: '2025-11-17T12:00:00.000Z',
        recordCount: 0
    }
];

// Save sessions to localStorage
localStorage.setItem('aeck_exam_sessions', JSON.stringify(sampleSessions));

// Create sample data for dot 1
const sampleDataDot1 = {
    data: [
        {
            rank: 1,
            id: "DOT1_001",
            email: "student1@gmail.com",
            math_correct: 35,
            reading_correct: 18,
            science_correct: 38,
            total_correct: 91,
            theta: 2.145,
            irt_math: 85.67,
            irt_reading: 82.34,
            irt_science: 89.12,
            irt_score: 85.71,
            uploadDate: "2025-11-01T10:00:00.000Z"
        },
        {
            rank: 2,
            id: "DOT1_002",
            email: "student2@gmail.com",
            math_correct: 32,
            reading_correct: 17,
            science_correct: 35,
            total_correct: 84,
            theta: 1.892,
            irt_math: 79.45,
            irt_reading: 78.90,
            irt_science: 83.21,
            irt_score: 80.52,
            uploadDate: "2025-11-01T10:00:00.000Z"
        },
        {
            rank: 3,
            id: "DOT1_003",
            email: "test@aeck.edu.vn",
            math_correct: 30,
            reading_correct: 16,
            science_correct: 33,
            total_correct: 79,
            theta: 1.654,
            irt_math: 75.23,
            irt_reading: 74.56,
            irt_science: 78.89,
            irt_score: 76.23,
            uploadDate: "2025-11-01T10:00:00.000Z"
        }
    ],
    metadata: {
        sessionCode: 'tsa-2026-dot-1',
        sessionName: 'TSA 2026 - Đợt 1',
        totalRecords: 3,
        lastUpdate: '2025-11-01T10:00:00.000Z',
        version: '1.0'
    }
};

// Create sample data for dot 2
const sampleDataDot2 = {
    data: [
        {
            rank: 1,
            id: "DOT2_001",
            email: "newstudent1@gmail.com",
            math_correct: 38,
            reading_correct: 19,
            science_correct: 39,
            total_correct: 96,
            theta: 2.445,
            irt_math: 89.67,
            irt_reading: 86.34,
            irt_science: 92.12,
            irt_score: 89.71,
            uploadDate: "2025-11-17T10:00:00.000Z"
        },
        {
            rank: 2,
            id: "DOT2_002", 
            email: "newstudent2@gmail.com",
            math_correct: 36,
            reading_correct: 18,
            science_correct: 37,
            total_correct: 91,
            theta: 2.192,
            irt_math: 85.45,
            irt_reading: 82.90,
            irt_science: 88.21,
            irt_score: 85.52,
            uploadDate: "2025-11-17T10:00:00.000Z"
        },
        {
            rank: 3,
            id: "DOT2_003",
            email: "admin@example.com",
            math_correct: 34,
            reading_correct: 17,
            science_correct: 36,
            total_correct: 87,
            theta: 1.954,
            irt_math: 81.23,
            irt_reading: 79.56,
            irt_science: 85.89,
            irt_score: 82.23,
            uploadDate: "2025-11-17T10:00:00.000Z"
        },
        {
            rank: 4,
            id: "DOT2_004",
            email: "demo@test.com",
            math_correct: 31,
            reading_correct: 16,
            science_correct: 34,
            total_correct: 81,
            theta: 1.754,
            irt_math: 77.23,
            irt_reading: 76.56,
            irt_science: 81.89,
            irt_score: 78.23,
            uploadDate: "2025-11-17T10:00:00.000Z"
        },
        {
            rank: 5,
            id: "DOT2_005",
            email: "sample@email.com",
            math_correct: 29,
            reading_correct: 15,
            science_correct: 32,
            total_correct: 76,
            theta: 1.554,  
            irt_math: 73.23,
            irt_reading: 72.56,
            irt_science: 78.89,
            irt_score: 74.89,
            uploadDate: "2025-11-17T10:00:00.000Z"
        }
    ],
    metadata: {
        sessionCode: 'tsa-2026-dot-2',
        sessionName: 'TSA 2026 - Đợt 2',
        totalRecords: 5,
        lastUpdate: '2025-11-17T10:00:00.000Z',
        version: '1.0'
    }
};

// Save sample data
localStorage.setItem('aeck_exam_results_tsa-2026-dot-1', JSON.stringify(sampleDataDot1));
localStorage.setItem('aeck_exam_results_tsa-2026-dot-2', JSON.stringify(sampleDataDot2));

console.log('✅ Sample data created successfully!');
console.log('📊 Sessions:', sampleSessions.length);
console.log('📋 Đợt 1 records:', sampleDataDot1.data.length);  
console.log('📋 Đợt 2 records:', sampleDataDot2.data.length);
console.log('');
console.log('🧪 Test emails:');
console.log('Đợt 1: student1@gmail.com, student2@gmail.com, test@aeck.edu.vn');
console.log('Đợt 2: newstudent1@gmail.com, newstudent2@gmail.com, admin@example.com, demo@test.com, sample@email.com');
console.log('');
console.log('🔄 Refresh trang để thấy thay đổi!');
*/