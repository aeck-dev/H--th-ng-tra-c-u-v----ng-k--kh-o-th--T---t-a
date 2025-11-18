// Global Firebase service instance
let firebaseService = null;

// Initialize Firebase service
async function initializeFirebase() {
    if (window.FirebaseService) {
        try {
            console.log('🔥 Initializing Firebase service...');
            firebaseService = new window.FirebaseService();
            const success = await firebaseService.initialize();
            console.log('🔥 Firebase init result:', success);
            
            if (success && firebaseService.isConnected) {
                console.log('✅ Firebase connected and ready');
                window.firebaseService = firebaseService; // Global access
                return true;
            }
        } catch (error) {
            console.error('Firebase initialization failed:', error);
        }
    }
    console.log('💾 Firebase not available, using localStorage');
    return false;
}

// Load exam sessions with Firebase priority
async function loadExamSessions() {
    console.log('📋 Loading exam sessions...');
    
    // Try Firebase first
    if (firebaseService && firebaseService.isConnected) {
        try {
            console.log('🔥 Loading sessions from Firebase...');
            const sessions = await firebaseService.getSessions();
            console.log('📊 Firebase sessions loaded:', sessions.length);
            
            if (sessions && sessions.length > 0) {
                await populateSessionSelect(sessions);
                return;
            }
        } catch (error) {
            console.error('Firebase session loading failed:', error);
        }
    }
    
    // Fallback to localStorage
    console.log('📦 Loading sessions from localStorage...');
    await loadExamSessionsFromLocalStorage();
}

// Populate session select dropdown
async function populateSessionSelect(sessionsList) {
    const examSessionSelect = document.getElementById('examSession');
    if (!examSessionSelect) return;

    examSessionSelect.innerHTML = '<option value="">-- Chọn đợt thi --</option>';
    
    let hasValidSessions = false;
    
    // Add sessions as options - only if they have data and are active
    for (const session of sessionsList) {
        console.log(`🔎 Checking session: ${session.code}, status: ${session.status}`);
        
        let hasData = false;
        let dataCount = 0;
        
        // Check Firebase first if available
        if (firebaseService && firebaseService.isConnected) {
            try {
                console.log(`🔥 Checking Firebase data for ${session.code}`);
                const firebaseData = await firebaseService.getExamResults(session.code);
                if (firebaseData) {
                    const dataArray = Array.isArray(firebaseData) ? firebaseData : (firebaseData.data || []);
                    if (dataArray.length > 0) {
                        hasData = true;
                        dataCount = dataArray.length;
                        console.log(`📊 Firebase data for ${session.code}: ${dataCount} records`);
                    }
                }
            } catch (error) {
                console.warn(`Firebase data check failed for ${session.code}:`, error);
            }
        }
        
        // Fallback to localStorage if no Firebase data
        if (!hasData) {
            console.log(`📦 Checking localStorage data for ${session.code}`);
            const sessionData = localStorage.getItem(`aeck_exam_results_${session.code}`);
            if (sessionData) {
                try {
                    const data = JSON.parse(sessionData);
                    if (data && data.data && data.data.length > 0) {
                        hasData = true;
                        dataCount = data.data.length;
                        console.log(`📊 localStorage data for ${session.code}: ${dataCount} records`);
                    }
                } catch (e) {
                    console.error(`Error parsing localStorage data for ${session.code}:`, e);
                }
            }
        }
        
        // Add to dropdown if has data and is active
        if (hasData && session.status === 'active') {
            const option = document.createElement('option');
            option.value = session.code;
            option.textContent = `${session.name} (${dataCount} kết quả)`;
            examSessionSelect.appendChild(option);
            hasValidSessions = true;
            console.log(`✅ Added session ${session.code} to dropdown`);
        } else {
            console.log(`⏭️ Skipped session ${session.code}: hasData=${hasData}, status=${session.status}`);
        }
    }
    
    if (!hasValidSessions) {
        examSessionSelect.innerHTML = '<option value="">Không có đợt thi nào có sẵn kết quả</option>';
        console.log('❌ No valid sessions found');
    }
}

// Load from localStorage (fallback)
async function loadExamSessionsFromLocalStorage() {
    try {
        const sessions = localStorage.getItem('aeck_exam_sessions');
        console.log('📦 Raw sessions từ localStorage:', sessions);
        
        if (!sessions) {
            console.log('❌ No sessions found from admin');
            const examSessionSelect = document.getElementById('examSession');
            if (examSessionSelect) {
                examSessionSelect.innerHTML = '<option value="">Chưa có đợt thi nào (Liên hệ admin)</option>';
            }
            return;
        }
        
        const sessionsList = JSON.parse(sessions);
        console.log('📋 Parsed sessions:', sessionsList);
        await populateSessionSelect(sessionsList);
    } catch (error) {
        console.error('Error loading sessions from localStorage:', error);
    }
}

// Main lookup function with Firebase priority
async function lookupResult(email, sessionCode = null) {
    console.log('🔍 Starting lookup for:', email, 'in session:', sessionCode);
    
    // If no specific session, search all sessions
    if (!sessionCode) {
        // Get sessions list (Firebase first, then localStorage)
        let sessions = [];
        if (firebaseService && firebaseService.isConnected) {
            try {
                sessions = await firebaseService.getSessions();
            } catch (error) {
                console.log('Firebase session fetch failed, trying localStorage');
            }
        }
        
        if (sessions.length === 0) {
            const sessionsData = localStorage.getItem('aeck_exam_sessions');
            if (sessionsData) {
                sessions = JSON.parse(sessionsData);
            }
        }
        
        // Search through all active sessions
        for (const session of sessions) {
            if (session.status !== 'active') continue;
            
            const result = await lookupResult(email, session.code);
            if (result.success) {
                return result;
            }
        }
        
        return {
            success: false,
            message: 'Không tìm thấy kết quả cho email này trong tất cả các đợt thi. Vui lòng kiểm tra lại email hoặc liên hệ ban tổ chức.'
        };
    }

    // Look up in specific session
    let data = null;
    let metadata = null;
    
    // Check Firebase first
    if (firebaseService && firebaseService.isConnected) {
        try {
            console.log('🔥 Checking Firebase for session:', sessionCode);
            const firebaseData = await firebaseService.getExamResults(sessionCode);
            if (firebaseData) {
                data = firebaseData.data || firebaseData;
                metadata = firebaseData.metadata;
                console.log('🔥 Using Firebase data for lookup');
            }
        } catch (error) {
            console.log('Firebase lookup failed, checking localStorage');
        }
    }
    
    // Fallback to localStorage if Firebase data not found
    if (!data) {
        const savedData = localStorage.getItem(`aeck_exam_results_${sessionCode}`);
        
        if (!savedData) {
            return {
                success: false,
                message: `Chưa có dữ liệu kết quả cho đợt thi này. Vui lòng liên hệ admin để cập nhật dữ liệu.`
            };
        }

        const parsedData = JSON.parse(savedData);
        data = parsedData.data || parsedData;
        metadata = parsedData.metadata;
        console.log('📦 Using localStorage data for lookup');
    }

    // Search for result
    const dataArray = Array.isArray(data) ? data : [];
    const result = dataArray.find(row => row.email === email);

    if (result) {
        return {
            success: true,
            data: result,
            metadata: metadata || {},
            source: firebaseService && firebaseService.isConnected ? 'firebase' : 'localStorage'
        };
    } else {
        return {
            success: false,
            message: `Không tìm thấy kết quả cho email "${email}" trong đợt thi này.`
        };
    }
}

// Search function
async function searchResult() {
    const email = document.getElementById('emailInput').value.trim().toLowerCase();
    const sessionCode = document.getElementById('examSession').value;
    
    if (!email) {
        alert('Vui lòng nhập email của bạn');
        return;
    }
    
    // Show loading
    showLoading(true);
    
    try {
        const result = await lookupResult(email, sessionCode);
        displayResult(result);
    } catch (error) {
        console.error('Search error:', error);
        displayResult({
            success: false,
            message: 'Có lỗi xảy ra khi tra cứu. Vui lòng thử lại sau.'
        });
    } finally {
        showLoading(false);
    }
}

// Display result
function displayResult(result) {
    const resultContainer = document.getElementById('result');
    const resultDiv = document.getElementById('resultContent');
    
    if (result.success) {
        const data = result.data;
        const source = result.source || 'localStorage';
        
        resultDiv.innerHTML = `
            <h3 style="color: #28a745; margin-bottom: 1rem;">✅ Tìm thấy kết quả của bạn!</h3>
            <div class="result-grid">
                <div class="result-item"><strong>Xếp hạng:</strong> <span class="highlight">#${data.rank}</span></div>
                <div class="result-item"><strong>ID thí sinh:</strong> ${data.id}</div>
                <div class="result-item"><strong>Email:</strong> ${data.email}</div>
                <div class="result-item"><strong>Toán:</strong> ${data.math_correct || 0}</div>
                <div class="result-item"><strong>Đọc hiểu:</strong> ${data.reading_correct || 0}</div>
                <div class="result-item"><strong>Khoa học:</strong> ${data.science_correct || 0}</div>
                <div class="result-item"><strong>Tổng điểm đúng:</strong> <span class="highlight">${data.total_correct || 0}</span></div>
                <div class="result-item"><strong>Điểm IRT:</strong> <span class="highlight">${data.irt_score || 0}</span></div>
                <div class="result-item"><strong>Percentile:</strong> ${data.percentile || 0}%</div>
            </div>
            <div class="data-source">
                <small>📊 Dữ liệu từ: ${source === 'firebase' ? '🔥 Firebase (Real-time)' : '💾 Local Storage'}</small>
            </div>
        `;
        resultContainer.style.display = 'block';
    } else {
        resultDiv.innerHTML = `
            <h3 style="color: #dc3545;">❌ ${result.message}</h3>
        `;
        resultContainer.style.display = 'block';
    }
}

// Utility functions
function showLoading(show) {
    const loadingDiv = document.querySelector('.loading-overlay');
    if (loadingDiv) {
        loadingDiv.style.display = show ? 'flex' : 'none';
    }
}

function showMainMenu() {
    document.getElementById('mainMenu').style.display = 'block';
}

function showLookupForm() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('lookupForm').style.display = 'block';
}

function backToMenu() {
    document.getElementById('lookupForm').style.display = 'none';
    document.getElementById('result').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'block';
}

// Storage event listener for session updates
window.addEventListener('storage', function(e) {
    if (e.key === 'aeck_exam_sessions') {
        console.log('Sessions updated in localStorage, reloading...');
        loadExamSessions();
    }
});

// Periodic check for session updates (same window)
setInterval(() => {
    const currentSessionsString = localStorage.getItem('aeck_exam_sessions');
    if (window.lastSessionsString !== currentSessionsString) {
        window.lastSessionsString = currentSessionsString;
        loadExamSessions();
    }
}, 2000);

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing application...');
    
    // Initialize Firebase first
    const firebaseReady = await initializeFirebase();
    console.log('🔥 Firebase ready:', firebaseReady);
    
    // Load exam sessions
    await loadExamSessions();
    
    // Store initial sessions state
    window.lastSessionsString = localStorage.getItem('aeck_exam_sessions');
    
    // Show main menu
    showMainMenu();
    
    console.log('✅ Application initialized');
});