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
}

function showLookupResults() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('examList').style.display = 'none';
    document.getElementById('registrationForm').style.display = 'none';
    document.getElementById('lookupForm').style.display = 'none';
    document.getElementById('lookupResults').style.display = 'block';
}

// Google Sheets API Configuration
const GOOGLE_SHEETS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyA7TCmEzS_FwU2KYcOKLfTFDmy4xlgpL0qOp_FGXouv0KgpAKsdcpfSeexU9LW6AR4dg/exec';

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

    if (!email || !examSession) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
    }
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

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    showMainMenu();
});
