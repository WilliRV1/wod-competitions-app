require('dotenv').config();
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const User = require('../src/Models/user.model');

// REPLACE WITH YOUR EMAIL
const TARGET_EMAIL = 'williamreyesvalencia04@gmail.com';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin123@cluster0.7k88u.mongodb.net/wod-competitions?retryWrites=true&w=majority&appName=Cluster0';

async function promoteToAdmin() {
    try {
        // 1. Initialize Firebase Admin
        if (!admin.apps.length) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }

        // 2. Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('🍃 Connected to MongoDB');

        // 3. Get Firebase UID
        let firebaseUser;
        try {
            firebaseUser = await admin.auth().getUserByEmail(TARGET_EMAIL);
        } catch (e) {
            console.error(`❌ User ${TARGET_EMAIL} not found in Firebase Auth.`);
            console.log('👉 You must register in the app (Firebase) first.');
            process.exit(1);
        }

        // 4. Find or Create User in MongoDB
        let user = await User.findOne({ email: TARGET_EMAIL });

        if (!user) {
            console.log(`⚠️  User not found in MongoDB. Creating new Admin user...`);
            user = new User({
                firebaseUid: firebaseUser.uid,
                email: firebaseUser.email,
                nombre: firebaseUser.displayName || TARGET_EMAIL.split('@')[0],
                role: 'admin',
                profileCompleted: true
            });
        } else {
            console.log(`✅ User found. Updating role to Admin...`);
            user.role = 'admin';
        }

        await user.save();

        console.log(`🎉 Success! ${TARGET_EMAIL} is now an ADMIN! 👑`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

promoteToAdmin();
