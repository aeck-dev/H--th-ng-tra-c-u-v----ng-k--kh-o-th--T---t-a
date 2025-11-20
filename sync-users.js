// Auto Sync Users từ MongoDB sang Firebase
// Chạy script này để sync users tự động

const admin = require('firebase-admin');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// Firebase Admin SDK Config
const serviceAccount = require('./firebase-admin-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ttkt-aeck-edu-vn-default-rtdb.asia-southeast1.firebasedatabase.app"
});

// MongoDB Config
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://160.250.130.69:27017';
const DB_NAME = process.env.DB_NAME || 'aeckdb';

let mongoClient;
let db;

async function connectMongoDB() {
  try {
    mongoClient = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    db = mongoClient.db(DB_NAME);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    return false;
  }
}

// Sync một user từ MongoDB sang Firebase
async function syncUser(mongoUser) {
  try {
    const email = mongoUser.email;
    const identifier = mongoUser.identifier;

    // Check if user exists in Firebase
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(email);
      console.log(`ℹ️  User ${email} already exists in Firebase`);
      
      // Update user info if needed
      await admin.auth().updateUser(firebaseUser.uid, {
        displayName: mongoUser.fullName,
        disabled: false
      });

    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user in Firebase Auth
        firebaseUser = await admin.auth().createUser({
          email: email,
          password: mongoUser.password || `temp${identifier}`, // Default password if not set
          displayName: mongoUser.fullName,
          emailVerified: false
        });
        
        console.log(`✅ Created new user in Firebase: ${email} (UID: ${firebaseUser.uid})`);
      } else {
        throw error;
      }
    }

    // Store additional user data in Realtime Database
    await admin.database().ref(`users/${firebaseUser.uid}`).set({
      identifier: identifier,
      fullName: mongoUser.fullName,
      email: email,
      role: mongoUser.role || 1,
      premium: mongoUser.premium || false,
      syncedAt: admin.database.ServerValue.TIMESTAMP,
      mongoId: mongoUser._id.toString()
    });

    return { success: true, uid: firebaseUser.uid, email: email };

  } catch (error) {
    console.error(`❌ Error syncing user ${mongoUser.email}:`, error.message);
    return { success: false, email: mongoUser.email, error: error.message };
  }
}

// Sync tất cả users
async function syncAllUsers() {
  try {
    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();

    console.log(`\n📊 Found ${users.length} users in MongoDB\n`);

    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
      const result = await syncUser(user);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(50));
    console.log('📈 Sync Summary:');
    console.log(`   Total Users: ${users.length}`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log('='.repeat(50) + '\n');

    return { total: users.length, success: successCount, failed: failCount };

  } catch (error) {
    console.error('❌ Sync all users failed:', error);
    throw error;
  }
}

// Sync chỉ users mới (chưa có trong Firebase)
async function syncNewUsers() {
  try {
    const usersCollection = db.collection('users');
    const mongoUsers = await usersCollection.find({}).toArray();

    console.log(`\n🔍 Checking for new users...\n`);

    let newCount = 0;

    for (const mongoUser of mongoUsers) {
      try {
        // Check if exists in Firebase
        await admin.auth().getUserByEmail(mongoUser.email);
        // User exists, skip
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // New user - sync it
          const result = await syncUser(mongoUser);
          if (result.success) {
            newCount++;
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n✨ Synced ${newCount} new users\n`);
    return newCount;

  } catch (error) {
    console.error('❌ Sync new users failed:', error);
    throw error;
  }
}

// Watch for changes in MongoDB (Real-time sync)
async function watchMongoDBChanges() {
  try {
    const usersCollection = db.collection('users');
    
    console.log('👀 Watching MongoDB for changes...\n');
    
    const changeStream = usersCollection.watch();

    changeStream.on('change', async (change) => {
      console.log(`\n🔔 Detected change: ${change.operationType}`);

      if (change.operationType === 'insert') {
        // New user added to MongoDB
        const newUser = change.fullDocument;
        console.log(`   New user: ${newUser.email}`);
        
        const result = await syncUser(newUser);
        if (result.success) {
          console.log(`   ✅ Auto-synced to Firebase`);
        }

      } else if (change.operationType === 'update') {
        // User updated in MongoDB
        const updatedFields = change.updateDescription.updatedFields;
        const userId = change.documentKey._id;
        
        console.log(`   Updated user ID: ${userId}`);
        
        // Fetch full user document
        const user = await usersCollection.findOne({ _id: userId });
        if (user) {
          await syncUser(user);
          console.log(`   ✅ Updated in Firebase`);
        }

      } else if (change.operationType === 'delete') {
        // User deleted from MongoDB
        console.log(`   User deleted from MongoDB`);
        // Optionally delete from Firebase too
      }
    });

    changeStream.on('error', (error) => {
      console.error('❌ Change stream error:', error);
    });

    console.log('✅ Change stream is active. Press Ctrl+C to stop.\n');

    // Keep process running
    return changeStream;

  } catch (error) {
    console.error('❌ Watch failed:', error);
    throw error;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('\n' + '='.repeat(50));
  console.log('🔄 MongoDB → Firebase User Sync');
  console.log('='.repeat(50) + '\n');

  // Connect to MongoDB
  const connected = await connectMongoDB();
  if (!connected) {
    console.error('❌ Cannot connect to MongoDB. Exiting.');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'all':
        // Sync all users
        await syncAllUsers();
        process.exit(0);
        break;

      case 'new':
        // Sync only new users
        await syncNewUsers();
        process.exit(0);
        break;

      case 'watch':
        // Watch for changes (keep running)
        await watchMongoDBChanges();
        // Don't exit - keep watching
        break;

      case 'once':
        // Run sync once and exit
        await syncNewUsers();
        process.exit(0);
        break;

      default:
        console.log('Usage:');
        console.log('  node sync-users.js all     - Sync all users (overwrite)');
        console.log('  node sync-users.js new     - Sync only new users');
        console.log('  node sync-users.js watch   - Watch for changes (real-time)');
        console.log('  node sync-users.js once    - Sync new users once and exit');
        console.log('');
        process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n⏹️  Shutting down...');
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
});

// Run
main();
