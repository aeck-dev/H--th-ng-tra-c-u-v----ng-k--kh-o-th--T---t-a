/**
 * 🔐 Backend Authentication Server
 * 
 * MongoDB bcrypt password verification server
 * - Verify email + password với MongoDB
 * - Tạo JWT token để authenticate với frontend
 * - Sync user metadata sang Firebase Realtime Database
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// Configuration
// =====================================================

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL;

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
} catch (error) {
  console.error('❌ Invalid FIREBASE_ADMIN_KEY');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: FIREBASE_DATABASE_URL
});

const db = admin.database();

// MongoDB Client
let mongoClient;
let usersCollection;

// =====================================================
// Middleware
// =====================================================

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://aeck-dev.github.io',
    'https://ttkt.aeck.edu.vn'
  ],
  credentials: true
}));

app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// =====================================================
// Database Connection
// =====================================================

async function connectMongoDB() {
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    
    const database = mongoClient.db('aeckdb');
    usersCollection = database.collection('users');
    
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// =====================================================
// Authentication Middleware
// =====================================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token không hợp lệ' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Token hết hạn hoặc không hợp lệ' 
      });
    }
    req.user = user;
    next();
  });
}

// =====================================================
// API Routes
// =====================================================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoClient ? 'connected' : 'disconnected',
    firebase: admin.apps.length > 0 ? 'initialized' : 'not initialized'
  });
});

// Login endpoint
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email và mật khẩu là bắt buộc'
      });
    }

    // Find user in MongoDB
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống'
      });
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không đúng'
      });
    }

    // ✅ Password verified successfully
    console.log(`✅ Login successful: ${email}`);

    // Sync user metadata to Firebase Realtime Database
    const userMetadata = {
      email: user.email,
      identifier: user.identifier || '',
      fullName: user.fullName || '',
      role: user.role || 'student',
      premium: user.premium || false,
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to Firebase (email encode: replace @ and .)
    const emailKey = email.replace(/[@.]/g, '_');
    await db.ref(`users/${emailKey}`).update(userMetadata);

    // Generate JWT token
    const token = jwt.sign(
      { 
        email: user.email,
        identifier: user.identifier,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response
    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token: token,
      user: {
        email: user.email,
        identifier: user.identifier,
        fullName: user.fullName,
        role: user.role,
        premium: user.premium
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập'
    });
  }
});

// Verify token endpoint
app.post('/auth/verify-token', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Get user info endpoint
app.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await usersCollection.findOne(
      { email: req.user.email },
      { projection: { password: 0 } } // Don't return password
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin người dùng'
    });
  }
});

// Sync all users to Firebase (admin only)
app.post('/admin/sync-users', async (req, res) => {
  try {
    const { adminKey } = req.body;

    // Simple admin authentication (thay bằng proper auth trong production)
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    // Get all users from MongoDB
    const users = await usersCollection.find({}).toArray();

    let syncCount = 0;
    for (const user of users) {
      const emailKey = user.email.replace(/[@.]/g, '_');
      
      const userMetadata = {
        email: user.email,
        identifier: user.identifier || '',
        fullName: user.fullName || '',
        role: user.role || 'student',
        premium: user.premium || false,
        updatedAt: new Date().toISOString()
      };

      await db.ref(`users/${emailKey}`).set(userMetadata);
      syncCount++;
    }

    console.log(`✅ Synced ${syncCount} users to Firebase`);

    res.json({
      success: true,
      message: `Đã đồng bộ ${syncCount} người dùng`,
      count: syncCount
    });

  } catch (error) {
    console.error('❌ Sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đồng bộ dữ liệu'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint không tồn tại'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Lỗi server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// =====================================================
// Server Start
// =====================================================

async function startServer() {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
      console.log(`📍 API endpoint: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⚠️  SIGTERM received, closing server...');
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('⚠️  SIGINT received, closing server...');
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
});

// Start the server
startServer();
