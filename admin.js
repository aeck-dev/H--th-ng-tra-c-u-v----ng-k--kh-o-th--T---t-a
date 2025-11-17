// AECK Admin Panel JavaScript
class AECKAdmin {
    constructor() {
        this.currentData = [];
        this.sessions = [];
        this.currentSession = null;
        this.useFirebase = false;
        this.initializeEventListeners();
        this.init();
    }

    async init() {
        await this.initializeFirebase();
        await this.loadSessions();
        this.loadCurrentData();
    }

    // Format date to dd/mm/yyyy
    formatDate(dateValue) {
        if (!dateValue) return '';
        
        let date;
        
        // Check if it's already a string in dd/mm/yyyy format
        if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            return dateValue;
        }
        
        // Check if it's an Excel serial number
        if (typeof dateValue === 'number') {
            // Excel date serial number (days since 1900-01-01)
            date = new Date((dateValue - 25569) * 86400 * 1000);
        } else if (dateValue instanceof Date) {
            date = dateValue;
        } else if (typeof dateValue === 'string') {
            date = new Date(dateValue);
        } else {
            return '';
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return dateValue.toString();
        }
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    }

    async initializeFirebase() {
        if (window.firebaseService) {
            console.log('🔥 Initializing Firebase...');
            const connected = await window.firebaseService.initialize();
            this.updateConnectionStatus(connected);
            this.useFirebase = connected;

            if (connected) {
                console.log('✅ Firebase connected successfully');
                this.showToast('Firebase connected successfully', 'success');
            } else {
                console.log('❌ Firebase connection failed, using localStorage fallback');
                this.showToast('Firebase connection failed, using localStorage', 'warning');
            }
        } else {
            console.log('⚠️ Firebase service not available, using localStorage');
            this.updateConnectionStatus(false);
        }
    }

    updateConnectionStatus(connected) {
        const statusIndicator = document.getElementById('connectionStatus');
        const dot = statusIndicator.querySelector('.status-dot');
        const text = statusIndicator.querySelector('span:last-child');
        
        if (connected) {
            dot.className = 'status-dot online';
            text.textContent = 'Firebase Connected';
        } else {
            dot.className = 'status-dot offline';
            text.textContent = 'Using localStorage';
        }
    }

    initializeEventListeners() {
        const fileInput = document.getElementById('excelFile');
        const uploadArea = document.getElementById('uploadArea');

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.processExcelFile(e.target.files[0]);
            }
        });

        // Drag and drop functionality
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && this.isExcelFile(files[0])) {
                this.processExcelFile(files[0]);
            } else {
                this.showToast('Vui lòng chọn file Excel (.xlsx, .xls)', 'error');
            }
        });

        // Modal click outside to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.classList.remove('show');
            }
        });

        // Prevent form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'sessionForm') {
                e.preventDefault();
                console.log('Form submission prevented');
            }
        });
    }

    isExcelFile(file) {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        return validTypes.includes(file.type) || 
               file.name.endsWith('.xlsx') || 
               file.name.endsWith('.xls');
    }

    async processExcelFile(file) {
        this.showLoading(true);
        
        try {
            // Update file info
            this.updateFileInfo(file);
            
            // Read Excel file
            const data = await this.readExcelFile(file);
            
            // Validate data structure
            const validatedData = this.validateExcelData(data);
            
            if (validatedData.length === 0) {
                throw new Error('Không tìm thấy dữ liệu hợp lệ trong file Excel');
            }

            this.currentData = validatedData;
            this.showDataPreview(validatedData);
            this.updateFileStatus('success', `Đã đọc ${validatedData.length} bản ghi`);
            this.showToast(`Đã tải thành công ${validatedData.length} bản ghi từ Excel`, 'success');
            
        } catch (error) {
            console.error('Lỗi xử lý file Excel:', error);
            this.updateFileStatus('error', 'Lỗi xử lý file');
            this.showToast(`Lỗi: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error('Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Lỗi đọc file'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    validateExcelData(data) {
        const requiredColumns = ['GMAIL', 'total_correct', 'IRT_score'];
        const validatedData = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            
            // Check if required columns exist
            const hasRequiredData = requiredColumns.every(col => 
                row.hasOwnProperty(col) && row[col] !== null && row[col] !== undefined
            );

            if (hasRequiredData && row.GMAIL && row.GMAIL.includes('@')) {
                validatedData.push({
                    rank: row.Rank || i + 1,
                    id: row.ID || `ID_${i + 1}`,
                    email: row.GMAIL.toLowerCase().trim(),
                    math_correct: row.math_correct || 0,
                    reading_correct: row.reading_correct || 0,
                    science_correct: row.science_correct || 0,
                    total_correct: row.total_correct || 0,
                    theta: row.theta || 0,
                    irt_math: row.IRT_math || 0,
                    irt_reading: row.IRT_reading || 0,
                    irt_science: row.IRT_science || 0,
                    irt_score: row.IRT_score || 0,
                    examDate: row.examDate ? this.formatDate(row.examDate) : '',
                    uploadDate: new Date().toISOString()
                });
            }
        }

        return validatedData;
    }

    updateFileInfo(file) {
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
        document.getElementById('processStatus').textContent = 'Đang xử lý...';
        document.getElementById('fileInfo').style.display = 'block';
    }

    updateFileStatus(type, message) {
        const statusElement = document.getElementById('processStatus');
        const statusBadge = document.getElementById('statusBadge');
        
        statusElement.textContent = message;
        statusBadge.textContent = message;
        
        statusBadge.className = `status-badge ${type}`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showDataPreview(data) {
        if (data.length === 0) return;

        // Update row count
        document.getElementById('rowCount').textContent = data.length;

        // Show preview section
        document.getElementById('previewSection').style.display = 'block';

        // Create table header
        const headers = [
            'Rank', 'ID', 'Email', 'Math', 'Reading', 'Science', 
            'Total', 'Theta', 'IRT Math', 'IRT Reading', 'IRT Science', 'IRT Score'
        ];
        
        const headerRow = document.getElementById('tableHeader');
        headerRow.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';

        // Create table body (show only first 10 rows for preview)
        const tableBody = document.getElementById('tableBody');
        const previewData = data.slice(0, 10);
        
        tableBody.innerHTML = previewData.map(row => `
            <tr>
                <td>${row.rank}</td>
                <td>${row.id}</td>
                <td>${row.email}</td>
                <td>${row.math_correct}</td>
                <td>${row.reading_correct}</td>
                <td>${row.science_correct}</td>
                <td>${row.total_correct}</td>
                <td>${row.theta.toFixed(2)}</td>
                <td>${row.irt_math.toFixed(2)}</td>
                <td>${row.irt_reading.toFixed(2)}</td>
                <td>${row.irt_science.toFixed(2)}</td>
                <td>${row.irt_score.toFixed(2)}</td>
            </tr>
        `).join('');

        // Update stats
        this.updateDataStats(data);
    }

    updateDataStats(data) {
        const statsContainer = document.getElementById('dataStats');
        const totalRecords = data.length;
        const avgScore = data.reduce((sum, row) => sum + row.irt_score, 0) / totalRecords;
        const avgCorrect = data.reduce((sum, row) => sum + row.total_correct, 0) / totalRecords;

        statsContainer.innerHTML = `
            <div class="stat-card">
                <h3>${totalRecords}</h3>
                <p>Tổng số bản ghi</p>
            </div>
            <div class="stat-card">
                <h3>${avgScore.toFixed(2)}</h3>
                <p>Điểm IRT trung bình</p>
            </div>
            <div class="stat-card">
                <h3>${avgCorrect.toFixed(1)}</h3>
                <p>Số câu đúng TB</p>
            </div>
        `;
    }

    async saveToSystem() {
        if (this.currentData.length === 0) {
            this.showToast('Không có dữ liệu để lưu', 'warning');
            return;
        }

        const targetSessionCode = document.getElementById('targetSession').value;
        if (!targetSessionCode) {
            this.showToast('Vui lòng chọn đợt thi để upload dữ liệu', 'warning');
            return;
        }

        this.showLoading(true);

        try {
            const session = this.sessions.find(s => s.code === targetSessionCode);
            if (!session) {
                throw new Error('Không tìm thấy đợt thi được chọn');
            }

            // Save to localStorage with session key
            const dataToSave = {
                data: this.currentData,
                metadata: {
                    sessionCode: targetSessionCode,
                    sessionName: session.name,
                    totalRecords: this.currentData.length,
                    lastUpdate: new Date().toISOString(),
                    version: '1.0'
                }
            };

            localStorage.setItem(`aeck_exam_results_${targetSessionCode}`, JSON.stringify(dataToSave));
            
            // Update session record count
            session.recordCount = this.currentData.length;
            session.lastUpdate = new Date().toISOString();
            this.saveSessions();
            this.renderSessions();
            
            // Update current data display
            this.loadCurrentData();
            
            this.showToast(`Đã lưu thành công ${this.currentData.length} bản ghi vào đợt thi "${session.name}"`, 'success');
            
            // Hide preview section
            document.getElementById('previewSection').style.display = 'none';
            
        } catch (error) {
            console.error('Lỗi lưu dữ liệu:', error);
            this.showToast(`Lỗi lưu dữ liệu: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    loadCurrentData() {
        try {
            // Calculate total stats across all sessions
            let totalRecords = 0;
            let lastUpdate = null;
            let totalScore = 0;
            let recordsWithScore = 0;
            
            this.sessions.forEach(session => {
                const sessionData = localStorage.getItem(`aeck_exam_results_${session.code}`);
                if (sessionData) {
                    const parsed = JSON.parse(sessionData);
                    totalRecords += parsed.metadata.totalRecords || 0;
                    
                    if (parsed.metadata.lastUpdate) {
                        const updateTime = new Date(parsed.metadata.lastUpdate);
                        if (!lastUpdate || updateTime > lastUpdate) {
                            lastUpdate = updateTime;
                        }
                    }
                    
                    if (parsed.data && parsed.data.length > 0) {
                        parsed.data.forEach(row => {
                            totalScore += row.irt_score || 0;
                            recordsWithScore++;
                        });
                    }
                }
            });
            
            // Update UI
            document.getElementById('totalRecords').textContent = totalRecords;
            document.getElementById('lastUpdate').textContent = 
                lastUpdate ? lastUpdate.toLocaleString('vi-VN') : 'Chưa có';
            
            const avgScore = recordsWithScore > 0 ? (totalScore / recordsWithScore) : 0;
            document.getElementById('avgScore').textContent = avgScore.toFixed(2);
            
            if (totalRecords > 0) {
                this.updateFileStatus('success', `${totalRecords} bản ghi từ ${this.sessions.length} đợt thi`);
            } else {
                this.updateFileStatus('warning', 'Chưa có dữ liệu');
            }
        } catch (error) {
            console.error('Lỗi tải dữ liệu hiện tại:', error);
            this.showToast('Lỗi tải dữ liệu hiện tại', 'error');
        }
    }

    testLookup() {
        const email = document.getElementById('testEmail').value.trim().toLowerCase();
        const resultDiv = document.getElementById('testResult');
        
        if (!email) {
            resultDiv.innerHTML = '<p style="color: var(--warning-color);">Vui lòng nhập email để test</p>';
            return;
        }

        try {
            let result = null;
            let foundInSession = null;
            
            // Search across all sessions
            for (const session of this.sessions) {
                const sessionData = localStorage.getItem(`aeck_exam_results_${session.code}`);
                if (sessionData) {
                    const { data } = JSON.parse(sessionData);
                    const found = data.find(row => row.email === email);
                    if (found) {
                        result = found;
                        foundInSession = session;
                        break;
                    }
                }
            }

            if (result && foundInSession) {
                resultDiv.innerHTML = `
                    <h4 style="color: var(--success-color); margin-bottom: 1rem;">✅ Tìm thấy kết quả!</h4>
                    <div style="background: var(--light-color); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <strong>Đợt thi:</strong> ${foundInSession.name} (${foundInSession.code})
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div><strong>Xếp hạng:</strong> ${result.rank}</div>
                        <div><strong>ID:</strong> ${result.id}</div>
                        <div><strong>Email:</strong> ${result.email}</div>
                        <div><strong>Toán:</strong> ${result.math_correct}</div>
                        <div><strong>Đọc hiểu:</strong> ${result.reading_correct}</div>
                        <div><strong>Khoa học:</strong> ${result.science_correct}</div>
                        <div><strong>Tổng đúng:</strong> ${result.total_correct}</div>
                        <div><strong>Điểm IRT:</strong> ${result.irt_score.toFixed(2)}</div>
                    </div>
                `;
                resultDiv.className = 'test-result success';
            } else {
                resultDiv.innerHTML = '<p style="color: var(--danger-color);">❌ Không tìm thấy kết quả cho email này trong tất cả các đợt thi</p>';
                resultDiv.className = 'test-result error';
            }
        } catch (error) {
            console.error('Lỗi test tra cứu:', error);
            resultDiv.innerHTML = '<p style="color: var(--danger-color);">Lỗi hệ thống tra cứu</p>';
            resultDiv.className = 'test-result error';
        }
    }

    exportData() {
        try {
            const savedData = localStorage.getItem('aeck_exam_results');
            
            if (!savedData) {
                this.showToast('Không có dữ liệu để xuất', 'warning');
                return;
            }

            const blob = new Blob([savedData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `aeck_exam_results_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('Đã xuất dữ liệu thành công', 'success');
        } catch (error) {
            console.error('Lỗi xuất dữ liệu:', error);
            this.showToast('Lỗi xuất dữ liệu', 'error');
        }
    }

    clearData() {
        if (confirm('Bạn có chắc chắn muốn xóa TẤT CẢ dữ liệu từ tất cả đợt thi? Hành động này không thể hoàn tác.')) {
            // Clear all session data
            this.sessions.forEach(session => {
                localStorage.removeItem(`aeck_exam_results_${session.code}`);
                session.recordCount = 0;
                session.lastUpdate = null;
            });
            
            this.saveSessions();
            this.renderSessions();
            this.loadCurrentData();
            
            this.showToast('Đã xóa tất cả dữ liệu từ tất cả đợt thi', 'success');
            
            // Reset preview
            document.getElementById('previewSection').style.display = 'none';
            document.getElementById('fileInfo').style.display = 'none';
            document.getElementById('testResult').innerHTML = '';
        }
    }

    togglePreview() {
        const previewSection = document.getElementById('previewSection');
        const tableContainer = previewSection.querySelector('.table-container');
        const dataStats = previewSection.querySelector('.data-stats');
        
        if (tableContainer.style.display === 'none') {
            tableContainer.style.display = 'block';
            dataStats.style.display = 'grid';
            event.target.textContent = 'Thu gọn';
        } else {
            tableContainer.style.display = 'none';
            dataStats.style.display = 'none';
            event.target.textContent = 'Mở rộng';
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    // Session Management Methods
    async loadSessions() {
        try {
            // Try Firebase first if available and connected
            if (this.useFirebase && window.firebaseService && window.firebaseService.isConnected) {
                console.log('🔥 Loading sessions from Firebase...');
                const firebaseSessions = await window.firebaseService.getSessions();
                if (firebaseSessions && firebaseSessions.length > 0) {
                    this.sessions = firebaseSessions;
                    console.log('Sessions loaded from Firebase:', this.sessions);
                    // Also update localStorage for fallback
                    localStorage.setItem('aeck_exam_sessions', JSON.stringify(this.sessions));
                    this.renderSessions();
                    this.updateSessionSelects();
                    return;
                }
            }
            
            // Fallback to localStorage
            console.log('📦 Loading sessions from localStorage...');
            const savedSessions = localStorage.getItem('aeck_exam_sessions');
            if (!savedSessions) {
                // First time load - create default sessions
                this.sessions = this.getDefaultSessions();
                await this.saveSessions(); // Save to both localStorage and Firebase
                console.log('Created default sessions:', this.sessions);
            } else {
                this.sessions = JSON.parse(savedSessions);
                console.log('Sessions loaded from localStorage:', this.sessions);
            }
            this.renderSessions();
            this.updateSessionSelects();
        } catch (error) {
            console.error('Lỗi tải sessions:', error);
            this.sessions = this.getDefaultSessions();
            await this.saveSessions();
            this.renderSessions();
            this.showToast('Lỗi tải danh sách đợt thi, sử dụng mặc định', 'warning');
        }
    }

    getDefaultSessions() {
        return [
            {
                code: 'tsa-2026-dot-1',
                name: 'TSA 2026 - Đợt 1',
                description: 'Đợt thi đầu tiên của kỳ thi TSA 2026',
                status: 'inactive',
                isDefault: false,
                createdAt: '2025-11-01T00:00:00.000Z',
                recordCount: 0
            },
            {
                code: 'tsa-2026-dot-2',
                name: 'TSA 2026 - Đợt 2', 
                description: 'Đợt thi thứ hai của kỳ thi TSA 2026',
                status: 'active',
                isDefault: true,
                createdAt: '2025-11-17T00:00:00.000Z',
                recordCount: 0
            }
        ];
    }

    async saveSessions() {
        // Always save to localStorage for fallback
        localStorage.setItem('aeck_exam_sessions', JSON.stringify(this.sessions));
        
        // Also save to Firebase if available
        if (this.useFirebase && window.firebaseService && window.firebaseService.isConnected && window.firebaseService.currentUser) {
            try {
                console.log('🔥 Saving sessions to Firebase...');
                for (const session of this.sessions) {
                    await window.firebaseService.createSession(session);
                }
                console.log('✅ Sessions saved to Firebase successfully');
            } catch (error) {
                console.warn('⚠️ Failed to save sessions to Firebase:', error);
                this.showToast('Sessions saved locally, but Firebase sync failed', 'warning');
            }
        }
    }

    renderSessions() {
        const container = document.getElementById('sessionsGrid');
        
        if (this.sessions.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--secondary-color);">
                    <h3>Chưa có đợt thi nào</h3>
                    <p>Hãy tạo đợt thi đầu tiên để bắt đầu</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.sessions.map(session => {
            const statusClass = session.status;
            const defaultClass = session.isDefault ? 'default' : '';
            const statusIcon = {
                'active': '🟢',
                'inactive': '🔴'
            }[session.status];

            return `
                <div class="session-card ${statusClass} ${defaultClass}">
                    <div class="session-header">
                        <div>
                            <h3 class="session-title">${session.name}</h3>
                            <div class="session-code">${session.code}</div>
                        </div>
                        <div class="session-status ${statusClass}">
                            ${statusIcon} ${this.getStatusText(session.status)}
                            ${session.isDefault ? ' (Mặc định)' : ''}
                        </div>
                    </div>
                    
                    ${session.description ? `<div class="session-desc">${session.description}</div>` : ''}
                    
                    <div class="session-stats">
                        <div class="session-stat">
                            <div class="session-stat-value">${session.recordCount || 0}</div>
                            <div class="session-stat-label">Bản ghi</div>
                        </div>
                        <div class="session-stat">
                            <div class="session-stat-value">${new Date(session.createdAt).toLocaleDateString('vi-VN')}</div>
                            <div class="session-stat-label">Tạo lúc</div>
                        </div>
                        <div class="session-stat">
                            <div class="session-stat-value">${session.lastUpdate ? new Date(session.lastUpdate).toLocaleDateString('vi-VN') : 'Chưa có'}</div>
                            <div class="session-stat-label">Cập nhật</div>
                        </div>
                    </div>
                    
                    <div class="session-actions">
                        <button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="selectSession('${session.code}')">Chọn làm việc</button>
                        <button class="btn btn-info" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="viewSessionData('${session.code}')">Xem dữ liệu</button>
                        <button class="btn btn-warning" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="editSession('${session.code}')">Sửa</button>
                        ${!session.isDefault ? `<button class="btn btn-success" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="setDefaultSession('${session.code}')">Đặt mặc định</button>` : ''}
                        <button class="btn btn-danger" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="deleteSession('${session.code}')">Xóa</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getStatusText(status) {
        const statusMap = {
            'active': 'Hoạt động',
            'inactive': 'Tạm dừng'
        };
        return statusMap[status] || status;
    }

    updateSessionSelects() {
        const selectElements = ['targetSession', 'examSession'].map(id => document.getElementById(id)).filter(el => el);
        
        selectElements.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Chọn đợt thi</option>' + 
                this.sessions.map(session => 
                    `<option value="${session.code}" ${session.isDefault ? 'selected' : ''}>
                        ${session.name} (${session.code})
                    </option>`
                ).join('');
            
            if (currentValue) {
                select.value = currentValue;
            }
        });
    }

    async createSession() {
        console.log('createSession called');
        const form = document.getElementById('sessionForm');
        if (!form) {
            console.error('Form not found');
            this.showToast('Lỗi: Không tìm thấy form', 'error');
            return;
        }
        
        const formData = new FormData(form);
        console.log('FormData created:', {
            code: formData.get('sessionCode'),
            name: formData.get('sessionName'),
            desc: formData.get('sessionDesc'),
            status: formData.get('sessionStatus')
        });
        
        const sessionData = {
            code: (formData.get('sessionCode') || '').trim().toLowerCase(),
            name: (formData.get('sessionName') || '').trim(),
            description: (formData.get('sessionDesc') || '').trim(),
            examDate: formData.get('examDate') || '',
            registrationType: formData.get('registrationType') || 'free',
            examInfo: (formData.get('examInfo') || '').trim(),
            status: formData.get('sessionStatus') || 'active',
            isDefault: document.getElementById('setAsDefault').checked,
            createdAt: new Date().toISOString(),
            recordCount: 0
        };
        
        console.log('Session data:', sessionData);

        // Validation
        if (!sessionData.code || !sessionData.name) {
            this.showToast('Vui lòng nhập đầy đủ mã và tên đợt thi', 'error');
            return;
        }

        if (!/^[a-z0-9-]+$/.test(sessionData.code)) {
            this.showToast('Mã đợt thi chỉ được chứa chữ thường, số và dấu gạch ngang', 'error');
            return;
        }

        if (this.sessions.find(s => s.code === sessionData.code)) {
            this.showToast('Mã đợt thi đã tồn tại', 'error');
            return;
        }

        // If setting as default, remove default from others
        if (sessionData.isDefault) {
            this.sessions.forEach(s => s.isDefault = false);
        }

        this.sessions.push(sessionData);
        await this.saveSessions();
        this.renderSessions();
        this.updateSessionSelects();
        this.closeSessionModal();
        this.resetSessionModal();
        
        this.showToast(`Đã tạo đợt thi "${sessionData.name}" thành công`, 'success');
    }

    selectSession(sessionCode) {
        const session = this.sessions.find(s => s.code === sessionCode);
        if (session) {
            this.currentSession = session;
            document.getElementById('targetSession').value = sessionCode;
            this.showToast(`Đã chọn đợt thi: ${session.name}`, 'success');
        }
    }

    async setDefaultSession(sessionCode) {
        this.sessions.forEach(s => s.isDefault = (s.code === sessionCode));
        await this.saveSessions();
        this.renderSessions();
        this.updateSessionSelects();
        
        const session = this.sessions.find(s => s.code === sessionCode);
        this.showToast(`Đã đặt "${session.name}" làm đợt thi mặc định`, 'success');
    }

    async deleteSession(sessionCode) {
        const session = this.sessions.find(s => s.code === sessionCode);
        if (!session) return;

        if (confirm(`Bạn có chắc chắn muốn xóa đợt thi "${session.name}"?\nDữ liệu của đợt thi này cũng sẽ bị xóa.`)) {
            // Remove session data from localStorage
            localStorage.removeItem(`aeck_exam_results_${sessionCode}`);
            
            // Remove from Firebase if available
            if (this.useFirebase && window.firebaseService && window.firebaseService.isConnected && window.firebaseService.currentUser) {
                try {
                    await window.firebaseService.deleteSession(sessionCode);
                    console.log('✅ Session deleted from Firebase');
                } catch (error) {
                    console.warn('⚠️ Failed to delete session from Firebase:', error);
                }
            }
            
            // Remove from sessions list
            this.sessions = this.sessions.filter(s => s.code !== sessionCode);
            
            // If deleted session was default, set first session as default
            if (session.isDefault && this.sessions.length > 0) {
                this.sessions[0].isDefault = true;
            }
            
            await this.saveSessions();
            this.renderSessions();
            this.updateSessionSelects();
            
            this.showToast(`Đã xóa đợt thi "${session.name}"`, 'success');
        }
    }

    showCreateSessionModal() {
        this.resetSessionModal();
        document.getElementById('sessionForm').reset();
        document.getElementById('sessionModal').classList.add('show');
    }

    closeSessionModal() {
        document.getElementById('sessionModal').classList.remove('show');
    }

    editSession(sessionCode) {
        const session = this.sessions.find(s => s.code === sessionCode);
        if (!session) {
            this.showToast('Không tìm thấy đợt thi', 'error');
            return;
        }

        // Fill form with existing data
        document.getElementById('sessionCode').value = session.code;
        document.getElementById('sessionName').value = session.name;
        document.getElementById('sessionDesc').value = session.description || '';
        document.getElementById('sessionStatus').value = session.status;
        document.getElementById('setAsDefault').checked = session.isDefault;
        
        // Disable code field for editing
        document.getElementById('sessionCode').disabled = true;
        
        // Change modal title and button
        document.querySelector('#sessionModal .modal-header h3').textContent = '✏️ Sửa Đợt Thi';
        document.querySelector('#sessionModal .btn-primary').textContent = 'Cập nhật';
        document.querySelector('#sessionModal .btn-primary').setAttribute('onclick', `updateSession('${sessionCode}')`);
        
        // Show modal
        document.getElementById('sessionModal').classList.add('show');
    }

    updateSession(sessionCode) {
        const form = document.getElementById('sessionForm');
        const formData = new FormData(form);
        
        const sessionIndex = this.sessions.findIndex(s => s.code === sessionCode);
        if (sessionIndex === -1) {
            this.showToast('Không tìm thấy đợt thi để cập nhật', 'error');
            return;
        }

        const updatedData = {
            name: formData.get('sessionName').trim(),
            description: formData.get('sessionDesc').trim(),
            status: formData.get('sessionStatus'),
            isDefault: document.getElementById('setAsDefault').checked,
            lastModified: new Date().toISOString()
        };

        // Validation
        if (!updatedData.name) {
            this.showToast('Vui lòng nhập tên đợt thi', 'error');
            return;
        }

        // If setting as default, remove default from others
        if (updatedData.isDefault) {
            this.sessions.forEach(s => s.isDefault = false);
        }

        // Update session
        Object.assign(this.sessions[sessionIndex], updatedData);
        
        this.saveSessions();
        this.renderSessions();
        this.updateSessionSelects();
        this.closeSessionModal();
        this.resetSessionModal();
        
        this.showToast(`Đã cập nhật đợt thi "${updatedData.name}" thành công`, 'success');
    }

    viewSessionData(sessionCode) {
        const session = this.sessions.find(s => s.code === sessionCode);
        if (!session) {
            this.showToast('Không tìm thấy đợt thi', 'error');
            return;
        }

        const sessionData = localStorage.getItem(`aeck_exam_results_${sessionCode}`);
        
        if (!sessionData) {
            this.showToast(`Đợt thi "${session.name}" chưa có dữ liệu`, 'warning');
            return;
        }

        try {
            const { data, metadata } = JSON.parse(sessionData);
            
            // Create and show data view modal
            this.showDataViewModal(session, data, metadata);
            
        } catch (error) {
            console.error('Lỗi đọc dữ liệu session:', error);
            this.showToast('Lỗi đọc dữ liệu đợt thi', 'error');
        }
    }

    showDataViewModal(session, data, metadata) {
        // Create modal if not exists
        let modal = document.getElementById('dataViewModal');
        if (!modal) {
            modal = this.createDataViewModal();
            document.body.appendChild(modal);
        }

        // Calculate statistics
        const stats = this.calculateDataStats(data);
        
        // Update modal content
        document.getElementById('dataViewTitle').textContent = `📊 Dữ liệu: ${session.name}`;
        document.getElementById('dataViewStats').innerHTML = `
            <div class="data-view-stats">
                <div class="stat-item">
                    <span class="stat-label">Tổng bản ghi:</span>
                    <span class="stat-value">${data.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Điểm IRT trung bình:</span>
                    <span class="stat-value">${stats.avgIRT}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Điểm cao nhất:</span>
                    <span class="stat-value">${stats.maxScore}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Điểm thấp nhất:</span>
                    <span class="stat-value">${stats.minScore}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Cập nhật lần cuối:</span>
                    <span class="stat-value">${new Date(metadata.lastUpdate).toLocaleString('vi-VN')}</span>
                </div>
            </div>
        `;
        
        // Show first 10 records in table
        const tableData = data.slice(0, 10);
        document.getElementById('dataViewTable').innerHTML = `
            <table class="data-view-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Toán</th>
                        <th>Đọc hiểu</th>
                        <th>Khoa học</th>
                        <th>Tổng</th>
                        <th>IRT Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableData.map(row => `
                        <tr>
                            <td>${row.rank}</td>
                            <td>${row.id}</td>
                            <td>${row.email}</td>
                            <td>${row.math_correct}</td>
                            <td>${row.reading_correct}</td>
                            <td>${row.science_correct}</td>
                            <td>${row.total_correct}</td>
                            <td>${row.irt_score.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${data.length > 10 ? `<p class="table-note">Hiển thị 10/${data.length} bản ghi đầu tiên</p>` : ''}
        `;
        
        modal.classList.add('show');
    }

    createDataViewModal() {
        const modal = document.createElement('div');
        modal.id = 'dataViewModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content data-view-modal">
                <div class="modal-header">
                    <h3 id="dataViewTitle">📊 Xem Dữ liệu</h3>
                    <button class="modal-close" onclick="closeDataViewModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="dataViewStats"></div>
                    <div id="dataViewTable"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-info" onclick="exportSessionData()">📤 Xuất dữ liệu</button>
                    <button class="btn btn-danger" onclick="clearSessionData()">🗑️ Xóa dữ liệu</button>
                    <button class="btn btn-secondary" onclick="closeDataViewModal()">Đóng</button>
                </div>
            </div>
        `;
        return modal;
    }

    calculateDataStats(data) {
        if (!data || data.length === 0) {
            return { avgIRT: '0', maxScore: '0', minScore: '0' };
        }

        const irtScores = data.map(row => row.irt_score || 0);
        const avgIRT = (irtScores.reduce((sum, score) => sum + score, 0) / irtScores.length).toFixed(2);
        const maxScore = Math.max(...irtScores).toFixed(2);
        const minScore = Math.min(...irtScores).toFixed(2);
        
        return { avgIRT, maxScore, minScore };
    }

    resetSessionModal() {
        // Reset modal to create mode
        document.getElementById('sessionCode').disabled = false;
        document.querySelector('#sessionModal .modal-header h3').textContent = '🎯 Tạo Đợt Thi Mới';
        document.querySelector('#sessionModal .btn-primary').textContent = 'Tạo đợt thi';
        document.querySelector('#sessionModal .btn-primary').setAttribute('onclick', 'createSession()');
    }

    async refreshSessions() {
        await this.loadSessions();
        this.showToast('Đã tải lại danh sách đợt thi', 'success');
    }
}

// Global functions for HTML onclick events
function togglePreview() {
    window.aeckAdmin.togglePreview();
}

function saveToSystem() {
    window.aeckAdmin.saveToSystem();
}

function loadCurrentData() {
    window.aeckAdmin.loadCurrentData();
}

function exportData() {
    window.aeckAdmin.exportData();
}

function clearData() {
    window.aeckAdmin.clearData();
}

function testLookup() {
    window.aeckAdmin.testLookup();
}

// Session management functions
function showCreateSessionModal() {
    window.aeckAdmin.showCreateSessionModal();
}

function closeSessionModal() {
    window.aeckAdmin.closeSessionModal();
}

async function createSession() {
    console.log('Global createSession called');
    if (!window.aeckAdmin) {
        console.error('aeckAdmin not initialized');
        alert('Hệ thống chưa được khởi tạo');
        return;
    }
    await window.aeckAdmin.createSession();
}

async function refreshSessions() {
    await window.aeckAdmin.refreshSessions();
}

function selectSession(sessionCode) {
    window.aeckAdmin.selectSession(sessionCode);
}

async function setDefaultSession(sessionCode) {
    await window.aeckAdmin.setDefaultSession(sessionCode);
}

async function deleteSession(sessionCode) {
    await window.aeckAdmin.deleteSession(sessionCode);
}

function editSession(sessionCode) {
    window.aeckAdmin.editSession(sessionCode);
}

function viewSessionData(sessionCode) {
    window.aeckAdmin.viewSessionData(sessionCode);
}

function updateSession(sessionCode) {
    window.aeckAdmin.updateSession(sessionCode);
}

function closeDataViewModal() {
    document.getElementById('dataViewModal').classList.remove('show');
}

function exportSessionData() {
    // Get current session from modal title
    const title = document.getElementById('dataViewTitle').textContent;
    const sessionName = title.replace('📊 Dữ liệu: ', '');
    
    // Find session by name
    const session = window.aeckAdmin.sessions.find(s => s.name === sessionName);
    if (!session) {
        window.aeckAdmin.showToast('Không tìm thấy thông tin đợt thi', 'error');
        return;
    }
    
    const sessionData = localStorage.getItem(`aeck_exam_results_${session.code}`);
    if (!sessionData) {
        window.aeckAdmin.showToast('Không có dữ liệu để xuất', 'warning');
        return;
    }
    
    try {
        const blob = new Blob([sessionData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${session.code}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        window.aeckAdmin.showToast(`Đã xuất dữ liệu đợt thi "${session.name}"`, 'success');
    } catch (error) {
        console.error('Lỗi xuất dữ liệu:', error);
        window.aeckAdmin.showToast('Lỗi xuất dữ liệu', 'error');
    }
}

function clearSessionData() {
    const title = document.getElementById('dataViewTitle').textContent;
    const sessionName = title.replace('📊 Dữ liệu: ', '');
    
    const session = window.aeckAdmin.sessions.find(s => s.name === sessionName);
    if (!session) {
        window.aeckAdmin.showToast('Không tìm thấy thông tin đợt thi', 'error');
        return;
    }
    
    if (confirm(`Bạn có chắc chắn muốn xóa TẤT CẢ dữ liệu của đợt thi "${session.name}"?\nHành động này không thể hoàn tác.`)) {
        localStorage.removeItem(`aeck_exam_results_${session.code}`);
        
        // Update session record count
        session.recordCount = 0;
        session.lastUpdate = null;
        window.aeckAdmin.saveSessions();
        window.aeckAdmin.renderSessions();
        window.aeckAdmin.loadCurrentData();
        
        // Close modal
        closeDataViewModal();
        
        window.aeckAdmin.showToast(`Đã xóa tất cả dữ liệu của đợt thi "${session.name}"`, 'success');
    }
}

// Firebase Auth Functions
async function loginAdmin() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    if (!email || !password) {
        alert('Vui lòng nhập email và password');
        return;
    }
    
    if (window.firebaseService) {
        const result = await window.firebaseService.loginAdmin(email, password);
        if (result.success) {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('userInfo').style.display = 'flex';
            document.getElementById('userEmail').textContent = result.user.email;
            window.aeckAdmin.showToast('Đăng nhập thành công', 'success');
            
            // Reload sessions after login
            await window.aeckAdmin.loadSessions();
        } else {
            window.aeckAdmin.showToast('Đăng nhập thất bại: ' + result.error, 'error');
        }
    } else {
        window.aeckAdmin.showToast('Firebase service not available', 'error');
    }
}

async function logoutAdmin() {
    if (window.firebaseService) {
        const result = await window.firebaseService.logoutAdmin();
        if (result.success) {
            document.getElementById('loginForm').style.display = 'flex';
            document.getElementById('userInfo').style.display = 'none';
            document.getElementById('adminEmail').value = '';
            document.getElementById('adminPassword').value = '';
            window.aeckAdmin.showToast('Đăng xuất thành công', 'success');
        }
    }
}

// Migration function
async function migrateToFirebase() {
    if (window.firebaseService && window.firebaseService.currentUser) {
        const result = await window.firebaseService.migrateFromLocalStorage();
        if (result.success) {
            window.aeckAdmin.showToast('Migration thành công!', 'success');
            await window.aeckAdmin.loadSessions();
        } else {
            window.aeckAdmin.showToast('Migration thất bại: ' + result.error, 'error');
        }
    } else {
        window.aeckAdmin.showToast('Vui lòng đăng nhập trước khi migrate', 'error');
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.aeckAdmin = new AECKAdmin();
        console.log('AECK Admin initialized successfully');
        
        // Test if admin is accessible
        setTimeout(() => {
            if (window.aeckAdmin) {
                console.log('Admin object ready:', typeof window.aeckAdmin.createSession);
            }
        }, 1000);
    } catch (error) {
        console.error('Error initializing AECK Admin:', error);
        alert('Lỗi khởi tạo hệ thống: ' + error.message);
    }
});