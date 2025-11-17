// Global Firebase service instance
let firebaseService = null;

// Check if Firebase mode is enabled
async function initDataSource() {
    const useFirebase = localStorage.getItem('aeck_use_firebase');
    if (useFirebase === 'true' && window.FirebaseService) {
        try {
            firebaseService = new FirebaseService();
            const success = await firebaseService.initialize();
            if (success) {
                console.log('🔥 Using Firebase as data source');
                return 'firebase';
            }
        } catch (error) {
            console.warn('Firebase init failed, falling back to localStorage:', error);
        }
    }
    console.log('💾 Using localStorage as data source');
    return 'localStorage';
}

// Load available exam sessions
async function loadExamSessions() {
    console.log('🔍 loadExamSessions() được gọi');
    
    const dataSource = await initDataSource();
    
    if (dataSource === 'firebase' && firebaseService) {
        return await loadExamSessionsFromFirebase();
    } else {
        return await loadExamSessionsFromLocalStorage();
    }
}

// Load from Firebase
async function loadExamSessionsFromFirebase() {
    try {
        const sessions = await firebaseService.getSessions();
        console.log('📦 Sessions từ Firebase:', sessions);
        
        if (!sessions || sessions.length === 0) {
            console.log('❌ No sessions found from Firebase');
            const examSessionSelect = document.getElementById('examSession');
            if (examSessionSelect) {
                examSessionSelect.innerHTML = '<option value="">Chưa có đợt thi nào (Liên hệ admin)</option>';
            }
            return;
        }
        
        await populateSessionSelect(sessions);
    } catch (error) {
        console.error('Error loading from Firebase:', error);
        await loadExamSessionsFromLocalStorage(); // Fallback
    }
}

// Load from localStorage (original function)
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
        console.log('Loading exam sessions from admin:', sessionsList);
        
        await populateSessionSelect(sessionsList);
    } catch (error) {
        console.error('Error loading sessions from localStorage:', error);
    }
}

// Common function to populate session select
async function populateSessionSelect(sessionsList) {
    const examSessionSelect = document.getElementById('examSession');
    if (!examSessionSelect) {
        console.error('examSession select element not found');
        return;
    }

    // Clear existing options
    examSessionSelect.innerHTML = '<option value="">Chọn đợt thi</option>';
    
    let hasValidSessions = false;
    
    // Add sessions as options - only if they have data and are active
    for (const session of sessionsList) {
        console.log(`🔎 Checking session: ${session.code}, status: ${session.status}`);
        
        let hasData = false;
        let dataCount = 0;
        
        // Check data from Firebase first, then localStorage
        const useFirebase = localStorage.getItem('aeck_use_firebase');
        if (useFirebase === 'true' && firebaseService && firebaseService.isConnected) {
            try {
                console.log(`🔥 Checking Firebase data for ${session.code}`);
                const firebaseData = await firebaseService.getExamResults(session.code);
                if (firebaseData && firebaseData.data && firebaseData.data.length > 0) {
                    hasData = true;
                    dataCount = firebaseData.data.length;
                    console.log(`📊 Firebase data for ${session.code}: ${dataCount} records`);
                }
            } catch (error) {
                console.warn(`Failed to check Firebase data for ${session.code}:`, error);
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
                    console.warn(`Invalid data format for session ${session.code}:`, e);
                }
            }
        }
        
        // Only show sessions that have data and are active
        if (hasData && session.status === 'active') {
            console.log(`✅ Adding session to select: ${session.code}`);
            const option = document.createElement('option');
            option.value = session.code;
            option.textContent = `${session.name}`;
            
            // Add data count indicator
            if (dataCount > 0) {
                option.textContent += ` (${dataCount} thí sinh)`;
            }
            
            // Set as selected if it's the default session
            if (session.isDefault) {
                option.selected = true;
            }
            
            examSessionSelect.appendChild(option);
            hasValidSessions = true;
        } else {
            console.log(`❌ Session ${session.code} bị loại - hasData: ${hasData}, status: ${session.status}`);
        }
    }
    
    if (!hasValidSessions) {
        examSessionSelect.innerHTML = '<option value="">Chưa có đợt thi nào có dữ liệu</option>';
        console.log('No sessions with data found');
    } else {
        console.log('Exam sessions loaded successfully:', examSessionSelect.options.length - 1, 'sessions');
    }
}

// Note: getDefaultSessions removed - user page only shows admin-created sessions

// Main lookup function that auto-detects data source
async function lookupResult(email, sessionCode = null) {
    const useFirebase = localStorage.getItem('aeck_use_firebase');
    
    if (useFirebase === 'true' && firebaseService) {
        try {
            return await firebaseService.lookupResult(email, sessionCode);
        } catch (error) {
            console.warn('Firebase lookup failed, falling back to localStorage:', error);
        }
    }
    
    return lookupFromLocalStorage(email, sessionCode);
}

// Lookup function from localStorage (admin uploaded data)
function lookupFromLocalStorage(email, sessionCode = null) {
    try {
        // If no session specified, search all sessions
        if (!sessionCode) {
            const sessions = localStorage.getItem('aeck_exam_sessions');
            if (!sessions) {
                return {
                    success: false,
                    message: 'Hệ thống chưa có đợt thi nào. Vui lòng liên hệ admin để cập nhật dữ liệu.'
                };
            }
            
            const sessionsList = JSON.parse(sessions);
            
            for (const session of sessionsList) {
                const result = lookupFromLocalStorage(email, session.code);
                if (result.success) {
                    return result;
                }
            }
            
            return {
                success: false,
                message: 'Không tìm thấy kết quả cho email này trong tất cả các đợt thi. Vui lòng kiểm tra lại email hoặc liên hệ ban tổ chức.'
            };
        }
        
        let data = null;
        let metadata = null;
        
        // Check Firebase first
        try {
            if (window.firebaseService) {
                const firebaseData = await window.firebaseService.getExamResults(sessionCode);
                if (firebaseData) {
                    data = firebaseData.data || firebaseData;
                    metadata = firebaseData.metadata;
                    console.log('🔥 Using Firebase data for lookup');
                }
            }
        } catch (error) {
            console.log('Firebase not available, checking localStorage');
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
        const result = data.find(row => row.email === email);

        if (result) {
            // Convert data to match the expected format
            return {
                success: true,
                studentData: {
                    hoTen: `Thí sinh #${result.id}`, // We don't have name in Excel, use ID
                    email: result.email,
                    xepHang: result.rank,
                    toan: result.math_correct,
                    docHieu: result.reading_correct,
                    khoaHoc: result.science_correct,
                    tongDiem: result.total_correct,
                    irtScore: result.irt_score.toFixed(2),
                    theta: result.theta.toFixed(2),
                    irtMath: result.irt_math.toFixed(2),
                    irtReading: result.irt_reading.toFixed(2),
                    irtScience: result.irt_science.toFixed(2),
                    sessionName: metadata.sessionName || sessionCode
                }
            };
        } else {
            return {
                success: false,
                message: `Không tìm thấy kết quả cho email này trong đợt thi đã chọn. Vui lòng kiểm tra lại email hoặc thử đợt thi khác.`
            };
        }
    } catch (error) {
        console.error('Lỗi tra cứu từ localStorage:', error);
        return {
            success: false,
            message: 'Có lỗi xảy ra trong hệ thống. Vui lòng thử lại sau hoặc liên hệ admin.'
        };
    }
}

// Navigation functions
function showMainMenu() {
    document.getElementById('mainMenu').style.display = 'block';
    document.getElementById('examList').style.display = 'none';
    document.getElementById('registrationForm').style.display = 'none';
    document.getElementById('lookupForm').style.display = 'none';
    document.getElementById('lookupResults').style.display = 'none';
}

function showExamList() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('examList').style.display = 'block';
    document.getElementById('registrationForm').style.display = 'none';
    document.getElementById('lookupForm').style.display = 'none';
    document.getElementById('lookupResults').style.display = 'none';
}

function showRegistrationForm(sessionCode = 'tsa-2026-dot-1') {
    // lưu code đợt thi đang chọn để gửi cùng form
    window.__currentExamSession = sessionCode;
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('examList').style.display = 'none';
    document.getElementById('registrationForm').style.display = 'block';
    document.getElementById('lookupForm').style.display = 'none';
    document.getElementById('lookupResults').style.display = 'none';
}

function showLookupForm() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('examList').style.display = 'none';
    document.getElementById('registrationForm').style.display = 'none';
    document.getElementById('lookupForm').style.display = 'block';
    document.getElementById('lookupResults').style.display = 'none';
    
    // Reload exam sessions when showing lookup form
    loadExamSessions();
}

function showLookupResults(data) {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('examList').style.display = 'none';
    document.getElementById('registrationForm').style.display = 'none';
    document.getElementById('lookupForm').style.display = 'none';
    document.getElementById('lookupResults').style.display = 'block';

    // Hiển thị kết quả
    const resultsDiv = document.getElementById('lookupResults');
    
    if (!data.success) {
        resultsDiv.innerHTML = `
            <div class="error-message">
                <h3>Không tìm thấy thông tin</h3>
                <p>${data.message}</p>
                <button onclick="showLookupForm()" class="btn btn-primary">Thử lại</button>
            </div>
        `;
        return;
    }

    const studentData = data.studentData;
    resultsDiv.innerHTML = `
        <div class="test-report">
            <h1 class="report-title">GIẤY CHỨNG NHẬN KẾT QUẢ THI TSA 2026</h1>
            <h2 class="report-subtitle">TSA 2026 TEST REPORT FORM</h2>
            
            <div class="student-info">
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${studentData.email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Đợt thi:</span>
                    <span class="info-value">${studentData.sessionName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Xếp hạng:</span>
                    <span class="info-value">#${studentData.xepHang}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Điểm IRT tổng:</span>
                    <span class="info-value">${studentData.irtScore}</span>
                </div>
            </div>

            <div class="scores">
                <div class="overall-score">
                    <h3>Tổng số câu đúng - Total Correct</h3>
                    <div class="score">${studentData.tongDiem}</div>
                    <div class="score-range">0-100</div>
                </div>

                <div class="detail-scores">
                    <div class="score-item">
                        <div class="score">${studentData.toan}</div>
                        <div class="score-range">0-40</div>
                        <div class="score-label">Toán học<br>Mathematics (IRT: ${studentData.irtMath})</div>
                    </div>
                    <div class="score-item">
                        <div class="score">${studentData.docHieu}</div>
                        <div class="score-range">0-20</div>
                        <div class="score-label">Đọc hiểu<br>Reading (IRT: ${studentData.irtReading})</div>
                    </div>
                    <div class="score-item">
                        <div class="score">${studentData.khoaHoc}</div>
                        <div class="score-range">0-40</div>
                        <div class="score-label">Khoa học<br>Science (IRT: ${studentData.irtScience})</div>
                    </div>
                </div>
            </div>

            <div class="additional-info">
                <div class="info-section">
                    <h4>📊 Thông tin chi tiết</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span>Theta Score:</span>
                            <span>${studentData.theta}</span>
                        </div>
                        <div class="detail-item">
                            <span>IRT Total Score:</span>
                            <span>${studentData.irtScore}</span>
                        </div>
                        <div class="detail-item">
                            <span>Ranking:</span>
                            <span>#${studentData.xepHang}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="actions">
                <button onclick="showLookupForm()" class="btn btn-primary">Tra cứu lại</button>
                <button onclick="window.print()" class="btn btn-secondary">In kết quả</button>
            </div>
        </div>
    `;
}

// Google Sheets API Configuration
const GOOGLE_SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbybhzrpMj_rn0RA0MpwCz0RUKXa4cDmO1i_7xUr72PA5BDxnCfkoNb98L87T0z3NBNhtA/exec';

// Lookup form submission handler
async function handleLookup(event) {
    event.preventDefault();

    const email = document.getElementById('lookupEmail').value.trim();
    const examSession = document.getElementById('examSession').value;

    if (!email || !examSession) {
        alert('Vui lòng nhập email và chọn đợt thi');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Vui lòng nhập email hợp lệ!');
        return;
    }

    try {
        // Lookup from localStorage (admin uploaded data)
        const result = lookupFromLocalStorage(email.toLowerCase(), examSession);
        showLookupResults(result);
    } catch (error) {
        console.error('Error:', error);
        showLookupResults({
            success: false,
            message: 'Có lỗi xảy ra khi tra cứu. Vui lòng thử lại sau.'
        });
    }
}

// Form submission handler
async function handleSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(event.target);
    const data = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        facebook: formData.get('facebook'),
        province: formData.get('province'),
        target: formData.get('target'),
        examSession: window.__currentExamSession || 'tsa-2026-dot-1'
    };

    // Validate form
    if (!data.fullName || !data.email || !data.phone || !data.facebook || !data.province || !data.target) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        alert('Vui lòng nhập email hợp lệ!');
        return;
    }
    
    // Validate phone format (Vietnamese phone number)
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
        alert('Vui lòng nhập số điện thoại hợp lệ!');
        return;
    }

    // Validate Facebook URL
    const facebookRegex = /^https?:\/\/(www\.)?(facebook\.com|fb\.com)\/.+/i;
    if (!facebookRegex.test(data.facebook)) {
        alert('Vui lòng nhập link Facebook hợp lệ!\nVí dụ: https://facebook.com/your-profile');
        return;
    }

    // Show loading state
    const submitBtn = event.target.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Đang gửi...';
    submitBtn.disabled = true;

    try {
        // Send data to Google Sheets
        const response = await fetch(GOOGLE_SHEETS_WEBAPP_URL + '?v=1', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) { throw new Error(`HTTP ${response.status} ${response.statusText}`); }
        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            throw new Error(responseText);
        }

        if (result.success) {
            // Show success message
            alert(`Đăng ký thành công!\n\nThông tin đăng ký:\n- Họ tên: ${data.fullName}\n- Email: ${data.email}\n- Số điện thoại: ${data.phone}\n- Link Facebook: ${data.facebook}\n- Tỉnh/Thành phố: ${data.province}\n- Đối tượng: ${data.target}\n\nMã đăng ký: ${result.registrationId}\n\nBạn sẽ nhận được email xác nhận trong thời gian sớm nhất.`);
            
            // Reset form and go back to exam list
            event.target.reset();
            showExamList();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert(`Có lỗi xảy ra khi đăng ký: ${error.message}\n\nVui lòng thử lại sau hoặc liên hệ hỗ trợ.`);
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Helper no longer needed because select stores display name directly
/* function getProvinceName(value) {
    const provinces = {
        'hanoi': 'Hà Nội',
        'hcm': 'TP. Hồ Chí Minh',
        'danang': 'Đà Nẵng',
        'haiphong': 'Hải Phòng',
        'cantho': 'Cần Thơ',
        'angiang': 'An Giang',
        'bariavungtau': 'Bà Rịa - Vũng Tàu',
        'bacgiang': 'Bắc Giang',
        'backan': 'Bắc Kạn',
        'baclieu': 'Bạc Liêu',
        'bacninh': 'Bắc Ninh',
        'bentre': 'Bến Tre',
        'binhdinh': 'Bình Định',
        'binhduong': 'Bình Dương',
        'binhphuoc': 'Bình Phước',
        'binhthuan': 'Bình Thuận',
        'camau': 'Cà Mau',
        'caobang': 'Cao Bằng',
        'daklak': 'Đắk Lắk',
        'daknong': 'Đắk Nông',
        'dienbien': 'Điện Biên',
        'dongnai': 'Đồng Nai',
        'dongthap': 'Đồng Tháp',
        'gialai': 'Gia Lai',
        'hagiang': 'Hà Giang',
        'hanam': 'Hà Nam',
        'hatinh': 'Hà Tĩnh',
        'haiduong': 'Hải Dương',
        'haugiang': 'Hậu Giang',
        'hoabinh': 'Hòa Bình',
        'hungyen': 'Hưng Yên',
        'khanhhoa': 'Khánh Hòa',
        'kiengiang': 'Kiên Giang',
        'kontum': 'Kon Tum',
        'laichau': 'Lai Châu',
        'lamdong': 'Lâm Đồng',
        'langson': 'Lạng Sơn',
        'laocai': 'Lào Cai',
        'longan': 'Long An',
        'namdinh': 'Nam Định',
        'nghean': 'Nghệ An',
        'ninhbinh': 'Ninh Bình',
        'ninhthuan': 'Ninh Thuận',
        'phutho': 'Phú Thọ',
        'phuyen': 'Phú Yên',
        'quangbinh': 'Quảng Bình',
        'quangnam': 'Quảng Nam',
        'quangngai': 'Quảng Ngãi',
        'quangninh': 'Quảng Ninh',
        'quangtri': 'Quảng Trị',
        'soctrang': 'Sóc Trăng',
        'sonla': 'Sơn La',
        'tayninh': 'Tây Ninh',
        'thaibinh': 'Thái Bình',
        'thainguyen': 'Thái Nguyên',
        'thanhhoa': 'Thanh Hóa',
        'thuathienhue': 'Thừa Thiên Huế',
        'tiengiang': 'Tiền Giang',
        'travinh': 'Trà Vinh',
        'tuyenquang': 'Tuyên Quang',
        'vinhlong': 'Vĩnh Long',
        'vinhphuc': 'Vĩnh Phúc',
        'yenbai': 'Yên Bái'
    };
    
    return provinces[value] || value;
}
*/

// Lookup form submission handler
async function handleLookup(event) {
    event.preventDefault();

    const email = document.getElementById('lookupEmail').value.trim();
    const examSession = document.getElementById('examSession').value;
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultContainer = document.getElementById('resultContainer');

    if (!email || !examSession) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
    }

    // Show loading spinner
    loadingSpinner.style.display = 'block';
    resultContainer.style.display = 'none';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Vui lòng nhập email hợp lệ!');
        return;
    }

    try {
        const res = await fetch(
            GOOGLE_SHEETS_WEBAPP_URL +
            `?action=lookup&email=${encodeURIComponent(email)}&examSession=${encodeURIComponent(examSession)}`
        );
        const text = await res.text();
        let result;
        try { result = JSON.parse(text); } catch (e) { throw new Error(text); }

        // Hide loading spinner
        loadingSpinner.style.display = 'none';
        resultContainer.style.display = 'block';

        if (result.success && result.data) {
            document.getElementById('lookupForm').style.display = 'none';
            document.getElementById('lookupResults').style.display = 'block';
            document.getElementById('resultContainer').innerHTML = `
                <div class="result-card">
                    <div class="result-header">
                        <h3>Kết quả tra cứu</h3>
                        <div class="student-info">
                            <strong>${result.data.fullName}</strong> - ${result.data.email}
                        </div>
                    </div>
                    <div class="result-details">
                        <div class="detail-row"><span class="detail-label">Số điện thoại:</span><span class="detail-value">${result.data.phone}</span></div>
                        <div class="detail-row"><span class="detail-label">Facebook:</span><span class="detail-value"><a href="${result.data.facebook}" target="_blank">${result.data.facebook}</a></span></div>
                        <div class="detail-row"><span class="detail-label">Tỉnh/Thành phố:</span><span class="detail-value">${result.data.province}</span></div>
                        <div class="detail-row"><span class="detail-label">Đối tượng:</span><span class="detail-value">${result.data.target}</span></div>
                        <div class="detail-row"><span class="detail-label">Đợt thi:</span><span class="detail-value">${result.data.examSession}</span></div>
                    </div>
                </div>`;
        } else {
            alert(result.message || 'Không tìm thấy thông tin đăng ký');
        }
    } catch (err) {
        console.error(err);
        alert('Lỗi khi tra cứu: ' + err.message);
    } finally {
        // Always hide loading spinner in case of error
        loadingSpinner.style.display = 'none';
    }
}

// Mock data for demonstration
const mockScores = {
    'test@gmail.com': {
        'tsa-2026-dot-1': {
            name: 'Nguyễn Văn A',
            totalScore: 85.5,
            mathScore: 28.5,
            literatureScore: 29.0,
            englishScore: 28.0,
            examDate: '18/01/2026',
            examTime: '08:00 - 11:30',
            status: 'Đã hoàn thành'
        }
    },
    'student@gmail.com': {
        'tsa-2026-dot-1': {
            name: 'Trần Thị B',
            totalScore: 92.3,
            mathScore: 30.8,
            literatureScore: 31.0,
            englishScore: 30.5,
            examDate: '18/01/2026',
            examTime: '08:00 - 11:30',
            status: 'Đã hoàn thành'
        }
    },
    'admin@gmail.com': {
        'tsa-2026-dot-2': {
            name: 'Lê Văn C',
            totalScore: 88.7,
            mathScore: 29.2,
            literatureScore: 30.0,
            englishScore: 29.5,
            examDate: 'Chưa công bố',
            examTime: 'Chưa công bố',
            status: 'Chưa thi'
        },
        'tsa-2026-dot-3': {
            name: 'Lê Văn C',
            totalScore: 0,
            mathScore: 0,
            literatureScore: 0,
            englishScore: 0,
            examDate: 'Chưa công bố',
            examTime: 'Chưa công bố',
            status: 'Chưa mở đăng ký'
        }
    },
    'demo@gmail.com': {
        'tsa-2026-dot-4': {
            name: 'Phạm Thị D',
            totalScore: 76.8,
            mathScore: 25.2,
            literatureScore: 26.1,
            englishScore: 25.5,
            examDate: 'Chưa công bố',
            examTime: 'Chưa công bố',
            status: 'Chưa mở đăng ký'
        },
        'tsa-2026-dot-5': {
            name: 'Phạm Thị D',
            totalScore: 0,
            mathScore: 0,
            literatureScore: 0,
            englishScore: 0,
            examDate: 'Chưa công bố',
            examTime: 'Chưa công bố',
            status: 'Chưa mở đăng ký'
        },
        'tsa-2026-dot-6': {
            name: 'Phạm Thị D',
            totalScore: 0,
            mathScore: 0,
            literatureScore: 0,
            englishScore: 0,
            examDate: 'Chưa công bố',
            examTime: 'Chưa công bố',
            status: 'Chưa mở đăng ký'
        }
    }
};

// Lookup score function
function lookupScore(email, examSession) {
    if (mockScores[email] && mockScores[email][examSession]) {
        return mockScores[email][examSession];
    }
    return null;
}

// Display lookup result
function displayLookupResult(result, email, examSession) {
    const container = document.getElementById('resultContainer');
    const examNames = {
        'tsa-2026-dot-1': 'Bài thi TSA 2026 chính thức - Đợt 1',
        'tsa-2026-dot-2': 'Bài thi TSA 2026 chính thức - Đợt 2',
        'tsa-2026-dot-3': 'Bài thi TSA 2026 chính thức - Đợt 3',
        'tsa-2026-dot-4': 'Bài thi TSA 2026 chính thức - Đợt 4',
        'tsa-2026-dot-5': 'Bài thi TSA 2026 chính thức - Đợt 5',
        'tsa-2026-dot-6': 'Bài thi TSA 2026 chính thức - Đợt 6'
    };

    if (result) {
        container.innerHTML = `
            <div class="result-card">
                <div class="result-header">
                    <h3>${examNames[examSession]}</h3>
                    <div class="student-info">
                        <strong>${result.name}</strong> - ${email}
                    </div>
                </div>

                <div class="score-section">
                    <div class="score-title">Kết quả thi</div>
                    <div class="score-grid">
                        <div class="score-item">
                            <div class="score-label">Toán học</div>
                            <div class="score-value">${result.mathScore}</div>
                        </div>
                        <div class="score-item">
                            <div class="score-label">Ngữ văn</div>
                            <div class="score-value">${result.literatureScore}</div>
                        </div>
                        <div class="score-item">
                            <div class="score-label">Tiếng Anh</div>
                            <div class="score-value">${result.englishScore}</div>
                        </div>
                        <div class="score-item total">
                            <div class="score-label">Tổng điểm</div>
                            <div class="score-value">${result.totalScore}</div>
                        </div>
                    </div>
                </div>

                <div class="result-details">
                    <div class="detail-row">
                        <span class="detail-label">Ngày thi:</span>
                        <span class="detail-value">${result.examDate}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Giờ thi:</span>
                        <span class="detail-value">${result.examTime}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Trạng thái:</span>
                        <span class="detail-value">${result.status}</span>
                    </div>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="no-result">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Không tìm thấy kết quả</h3>
                <p>Không tìm thấy thông tin thi với email <strong>${email}</strong> trong đợt thi <strong>${examNames[examSession]}</strong>.</p>
                <p>Vui lòng kiểm tra lại thông tin hoặc liên hệ ban tổ chức để được hỗ trợ.</p>
            </div>
        `;
    }
}

// Professional DevTools Protection using disable-devtool library
// Load disable-devtool library from CDN
(function() {
    // Create script element to load disable-devtool
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/disable-devtool@latest';
    script.onload = function() {
        // Initialize disable-devtool after library loads
        if (typeof DisableDevtool !== 'undefined') {
            DisableDevtool({
                // MD5 bypass key (developers can use ?ddtk=yourkey to bypass)
                md5: 'c33367701511b4f6020ec61ded352059', // MD5 of "13102006"

                // Redirect URL when devtools detected
                url: 'https://www.google.com',

                // Silent callback when devtools opened - no warning, just redirect
                ondevtoolopen: function(type, next) {
                    // Immediately close/redirect without any warning
                    next();
                },

                // Silent callback when devtools closed
                ondevtoolclose: function() {
                    // Do nothing - silent operation
                },

                // Configuration options
                interval: 200,              // Check interval (ms)
                disableMenu: true,          // Disable right-click menu
                clearLog: true,             // Clear console logs
                disableSelect: true,        // Disable text selection
                disableCopy: true,          // Disable copy
                disableCut: true,           // Disable cut
                disablePaste: true,         // Disable paste

                // Enable all detection methods for maximum protection
                detectors: [0, 1, 2, 3, 4, 5, 6, 7], // All detector types

                // Stop monitoring after trigger (optional)
                clearIntervalWhenDevOpenTrigger: false,

                // Custom timeout URL
                timeOutUrl: 'https://www.google.com',

                // No custom HTML rewrite - silent redirect
                rewriteHTML: undefined
            });

            // Silent activation - no console logs
        }
    };

    script.onerror = function() {
        // Silent fallback to basic protection if CDN fails
        initBasicProtection();
    };

    document.head.appendChild(script);

    // No warning function needed - silent operation

    // Basic fallback protection if CDN fails
    function initBasicProtection() {
        // Disable right-click
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        });

        // Disable F12 and other shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.keyCode === 123 || // F12
                (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
                (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
                (e.ctrlKey && e.keyCode === 85)) { // Ctrl+U
                e.preventDefault();
                return false;
            }
        });

        // Silent basic protection activated
    }
})();

// Listen for localStorage changes to update sessions
window.addEventListener('storage', function(e) {
    if (e.key === 'aeck_exam_sessions') {
        console.log('Sessions updated in localStorage, reloading...');
        loadExamSessions();
    }
});

// Also check for changes periodically (for same-window updates)
setInterval(() => {
    const currentSessionsString = localStorage.getItem('aeck_exam_sessions');
    if (window.lastSessionsString !== currentSessionsString) {
        window.lastSessionsString = currentSessionsString;
        loadExamSessions();
    }
}, 2000);

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    await loadExamSessions();
    window.lastSessionsString = localStorage.getItem('aeck_exam_sessions');
    showMainMenu();
});
