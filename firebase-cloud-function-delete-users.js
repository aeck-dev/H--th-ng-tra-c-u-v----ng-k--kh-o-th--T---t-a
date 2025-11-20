// Cloud Function để xóa tất cả users trong Firebase Authentication
// Deploy this to Firebase Cloud Functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Cloud Function để xóa tất cả users
 * Endpoint: https://us-central1-ttkt-aeck-edu-vn.cloudfunctions.net/deleteAllUsers
 * 
 * Cách deploy:
 * 1. npm install -g firebase-tools
 * 2. firebase login
 * 3. firebase init functions (chọn project ttkt-aeck-edu-vn)
 * 4. Copy code này vào functions/index.js
 * 5. firebase deploy --only functions
 * 
 * Cách sử dụng:
 * POST https://us-central1-ttkt-aeck-edu-vn.cloudfunctions.net/deleteAllUsers
 * Body: { "confirmDelete": true, "adminKey": "YOUR_SECRET_KEY" }
 */
exports.deleteAllUsers = functions.https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }

    // Security: Require confirmation and admin key
    const { confirmDelete, adminKey } = req.body;
    const ADMIN_SECRET = functions.config().admin?.secret || 'CHANGE_THIS_SECRET_KEY';

    if (!confirmDelete || adminKey !== ADMIN_SECRET) {
        res.status(403).send('Unauthorized: Invalid confirmation or admin key');
        return;
    }

    try {
        console.log('Starting to delete all users...');
        let deletedCount = 0;
        let errorCount = 0;
        const errors = [];

        // List all users (max 1000 at a time)
        let nextPageToken;
        do {
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            
            // Delete users in batches
            const deletePromises = listUsersResult.users.map(async (user) => {
                try {
                    await admin.auth().deleteUser(user.uid);
                    deletedCount++;
                    console.log(`Deleted user: ${user.email || user.uid}`);
                } catch (error) {
                    errorCount++;
                    errors.push({ uid: user.uid, email: user.email, error: error.message });
                    console.error(`Failed to delete user ${user.uid}:`, error);
                }
            });

            await Promise.all(deletePromises);
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);

        res.status(200).json({
            success: true,
            message: 'User deletion completed',
            deletedCount,
            errorCount,
            errors: errors.length > 0 ? errors : null
        });

    } catch (error) {
        console.error('Error deleting users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete users',
            error: error.message
        });
    }
});

/**
 * Alternative: Delete a single user by email
 * Endpoint: https://us-central1-ttkt-aeck-edu-vn.cloudfunctions.net/deleteUserByEmail
 */
exports.deleteUserByEmail = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    const { email, adminKey } = req.body;
    const ADMIN_SECRET = functions.config().admin?.secret || 'CHANGE_THIS_SECRET_KEY';

    if (adminKey !== ADMIN_SECRET) {
        res.status(403).send('Unauthorized');
        return;
    }

    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().deleteUser(user.uid);
        
        res.status(200).json({
            success: true,
            message: `User ${email} deleted successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * List all users
 * Endpoint: https://us-central1-ttkt-aeck-edu-vn.cloudfunctions.net/listAllUsers
 */
exports.listAllUsers = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');

    try {
        const allUsers = [];
        let nextPageToken;

        do {
            const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
            allUsers.push(...listUsersResult.users.map(user => ({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                createdAt: user.metadata.creationTime,
                lastSignIn: user.metadata.lastSignInTime
            })));
            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);

        res.status(200).json({
            success: true,
            totalUsers: allUsers.length,
            users: allUsers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
