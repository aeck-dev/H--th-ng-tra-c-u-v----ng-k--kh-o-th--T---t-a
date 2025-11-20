// Test MongoDB Connection
const { MongoClient } = require('mongodb');

// THAY ĐỔI CONNECTION STRING NÀY
const MONGODB_URI = 'mongodb://USERNAME:PASSWORD@160.250.130.69:27017/aeckdb?authSource=admin';

async function testConnection() {
    console.log('🔍 Testing MongoDB connection...');
    console.log('URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    try {
        const client = await MongoClient.connect(MONGODB_URI);
        console.log('✅ Connected successfully!');
        
        const db = client.db('aeckdb');
        const users = await db.collection('users').find({}).limit(1).toArray();
        console.log('✅ Can read users collection!');
        console.log('Sample user:', users[0]?.email || 'No users found');
        
        await client.close();
        console.log('✅ Connection test passed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();
