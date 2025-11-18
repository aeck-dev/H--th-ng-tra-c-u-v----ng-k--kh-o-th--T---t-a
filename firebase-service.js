// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC_NrfdxxhzznvpeQsAeJgwhWMf8QjQr_8",
    authDomain: "ttkt-aeck-edu-vn.firebaseapp.com",
    databaseURL: "https://ttkt-aeck-edu-vn-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ttkt-aeck-edu-vn",
    storageBucket: "ttkt-aeck-edu-vn.firebasestorage.app",
    messagingSenderId: "1060126622642",
    appId: "1:1060126622642:web:af79af3a7d8896063a5aab",
    measurementId: "G-435BXQDSV8"
};

// Firebase Service Class (compat API)
class FirebaseService {
    constructor() {
        this.app = null;
        this.database = null;
        this.auth = null;
        this.isConnected = false;
        this.currentUser = null;
    }

    async initialize() {
        try {
            if (!firebase.apps.length) {
                this.app = firebase.initializeApp(firebaseConfig);
            } else {
                this.app = firebase.app();
            }

            this.database = firebase.database();
            this.auth = firebase.auth();

            await this.testConnection();
            console.log('✅ Firebase initialized');
            return true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.isConnected = false;
            return false;
        }
    }

    async testConnection() {
        try {
            // Test with public read access first
            console.log('🔥 Testing Firebase connection...');
            const testRef = this.database.ref('/sessions');
            await testRef.limitToFirst(1).once('value');
            this.isConnected = true;
            console.log('✅ Firebase connection successful');
            return true;
        } catch (error) {
            console.error('Firebase connection test failed:', error);
            console.log('📝 Error details:', error.code, error.message);
            this.isConnected = false;
            return false;
        }
    }

    async loginAdmin(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            this.currentUser = userCredential.user;
            return { success: true, user: this.currentUser };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async logoutAdmin() {
        try {
            await this.auth.signOut();
            this.currentUser = null;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getSessions() {
        try {
            const snapshot = await this.database.ref('sessions').once('value');
            if (snapshot.exists()) {
                return Object.values(snapshot.val());
            }
            return [];
        } catch (error) {
            console.error('Error getting sessions:', error);
            return [];
        }
    }

    async createSession(sessionData) {
        try {
            if (!this.currentUser) {
                throw new Error('Admin must be logged in');
            }

            await this.database.ref(`sessions/${sessionData.code}`).set({
                ...sessionData,
                createdAt: new Date().toISOString(),
                createdBy: this.currentUser.email
            });

            return { success: true };
        } catch (error) {
            console.error('Error creating session:', error);
            return { success: false, error: error.message };
        }
    }

    async updateSession(sessionCode, sessionData) {
        try {
            if (!this.currentUser) {
                throw new Error('Admin must be logged in');
            }

            await this.database.ref(`sessions/${sessionCode}`).set({
                ...sessionData,
                updatedAt: new Date().toISOString(),
                updatedBy: this.currentUser.email
            });

            return { success: true };
        } catch (error) {
            console.error('Error updating session:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteSession(sessionCode) {
        try {
            if (!this.currentUser) {
                throw new Error('Admin must be logged in');
            }

            await this.database.ref(`sessions/${sessionCode}`).remove();
            await this.database.ref(`exam_results/${sessionCode}`).remove();

            return { success: true };
        } catch (error) {
            console.error('Error deleting session:', error);
            return { success: false, error: error.message };
        }
    }

    async getExamResults(sessionCode) {
        try {
            const snapshot = await this.database.ref(`exam_results/${sessionCode}`).once('value');
            if (snapshot.exists()) {
                return snapshot.val();
            }
            return null;
        } catch (error) {
            console.error('Error getting exam results:', error);
            return null;
        }
    }

    async uploadExamResults(sessionCode, resultsData) {
        try {
            if (!this.currentUser) {
                throw new Error('Admin must be logged in');
            }

            await this.database.ref(`exam_results/${sessionCode}`).set({
                data: resultsData,
                uploadedAt: new Date().toISOString(),
                uploadedBy: this.currentUser.email,
                recordCount: resultsData.length
            });

            await this.database.ref(`sessions/${sessionCode}/recordCount`).set(resultsData.length);

            return { success: true };
        } catch (error) {
            console.error('Error uploading exam results:', error);
            return { success: false, error: error.message };
        }
    }

    async lookupResult(email, sessionCode = null) {
        try {
            if (sessionCode) {
                const results = await this.getExamResults(sessionCode);
                if (results && results.data) {
                    const userResult = results.data.find(record =>
                        record.Email && record.Email.toLowerCase().trim() === email.toLowerCase().trim()
                    );
                    if (userResult) {
                        return { success: true, data: userResult, sessionCode };
                    }
                }
            } else {
                const sessions = await this.getSessions();
                for (const session of sessions) {
                    if (session.status === 'active') {
                        const result = await this.lookupResult(email, session.code);
                        if (result.success) {
                            return result;
                        }
                    }
                }
            }

            return { success: false, message: 'Không tìm thấy kết quả cho email này' };
        } catch (error) {
            console.error('Error looking up result:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteExamResults(sessionCode) {
        try {
            await this.database.ref(`exam_results/${sessionCode}`).remove();
            return { success: true };
        } catch (error) {
            console.error('Error deleting exam results:', error);
            return { success: false, error: error.message };
        }
    }

    async migrateFromLocalStorage() {
        try {
            if (!this.currentUser) {
                throw new Error('Admin must be logged in');
            }

            const localSessions = localStorage.getItem('aeck_exam_sessions');
            if (localSessions) {
                const sessions = JSON.parse(localSessions);
                for (const session of sessions) {
                    await this.createSession(session);
                }
            }

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('aeck_exam_results_')) {
                    const sessionCode = key.replace('aeck_exam_results_', '');
                    const resultsData = JSON.parse(localStorage.getItem(key));
                    if (resultsData && resultsData.data) {
                        await this.uploadExamResults(sessionCode, resultsData.data);
                    }
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Migration failed:', error);
            return { success: false, error: error.message };
        }
    }
}

// Expose both class and instance to window
window.FirebaseService = FirebaseService;
window.firebaseService = null; // Will be initialized by script.js