// MongoDB Service - Proxy through backend API
class MongoDBService {
    constructor() {
        // URL của backend API (bạn cần tạo một backend server)
        this.apiUrl = 'http://localhost:3000/api'; // Thay đổi theo server của bạn
        this.isConnected = false;
    }

    async initialize() {
        try {
            // Test connection to backend
            const response = await fetch(`${this.apiUrl}/health`);
            if (response.ok) {
                this.isConnected = true;
                console.log('✅ MongoDB backend connected');
                return true;
            }
        } catch (error) {
            console.warn('⚠️ MongoDB backend not available:', error.message);
            this.isConnected = false;
        }
        return false;
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                return {
                    success: true,
                    user: data.user
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Đăng nhập thất bại'
                };
            }
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Không thể kết nối đến server'
            };
        }
    }

    async getUserByEmail(email) {
        try {
            const response = await fetch(`${this.apiUrl}/users/email/${encodeURIComponent(email)}`);
            const data = await response.json();

            if (response.ok && data.success) {
                return data.user;
            }
            return null;
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    }

    async verifyCredentials(email, password) {
        try {
            const response = await fetch(`${this.apiUrl}/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            return data.success === true;
        } catch (error) {
            console.error('Verify credentials error:', error);
            return false;
        }
    }
}

// Export for use in other scripts
window.MongoDBService = MongoDBService;
