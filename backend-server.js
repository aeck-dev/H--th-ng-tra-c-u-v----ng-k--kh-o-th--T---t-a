// Backend Server for MongoDB Authentication
// Run this with: node backend-server.js

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

// MongoDB Connection
const MONGODB_URI = 'mongodb://160.250.130.69:27017';
const DB_NAME = 'aeckdb';

let db;
let usersCollection;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
async function connectDB() {
    try {
        const client = await MongoClient.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        db = client.db(DB_NAME);
        usersCollection = db.collection('users');
        
        console.log('✅ Connected to MongoDB');
        return true;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        return false;
    }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        mongodb: db ? 'connected' : 'disconnected'
    });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email và mật khẩu là bắt buộc'
            });
        }

        // Find user by email
        const user = await usersCollection.findOne({ 
            email: email.toLowerCase() 
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Verify password
        // Nếu password đã được hash bằng bcrypt
        let isPasswordValid = false;
        
        // Try bcrypt comparison first
        try {
            isPasswordValid = await bcrypt.compare(password, user.password);
        } catch (error) {
            // If bcrypt fails, try direct comparison (for plain text passwords)
            isPasswordValid = password === user.password;
        }

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Login successful - return user info (excluding password)
        const { password: _, ...userWithoutPassword } = user;
        
        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            user: {
                id: user._id,
                email: user.email,
                identifier: user.identifier,
                fullName: user.fullName,
                role: user.role,
                premium: user.premium
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
});

// Verify credentials endpoint
app.post('/api/auth/verify', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await usersCollection.findOne({ 
            email: email.toLowerCase() 
        });

        if (!user) {
            return res.json({ success: false });
        }

        // Verify password
        let isPasswordValid = false;
        try {
            isPasswordValid = await bcrypt.compare(password, user.password);
        } catch (error) {
            isPasswordValid = password === user.password;
        }

        res.json({ success: isPasswordValid });
    } catch (error) {
        console.error('Verify error:', error);
        res.json({ success: false });
    }
});

// Get user by email
app.get('/api/users/email/:email', async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email);
        
        const user = await usersCollection.findOne({ 
            email: email.toLowerCase() 
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const { password: _, ...userWithoutPassword } = user;
        
        res.json({
            success: true,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
});

// Start server
async function start() {
    const connected = await connectDB();
    
    if (connected) {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📊 MongoDB: ${MONGODB_URI}`);
            console.log(`📁 Database: ${DB_NAME}`);
        });
    } else {
        console.error('❌ Failed to start server - MongoDB connection failed');
        process.exit(1);
    }
}

start();
