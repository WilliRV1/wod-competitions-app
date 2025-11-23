require('dotenv').config();
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const path = require('path');

// --- CONFIGURATION ---
// REPLACE THESE WITH THE EMAILS YOU WANT TO BE ADMINS
const ADMIN_EMAILS = [
    'williamreyesvalencia04@gmail.com', // REPLACE ME
    'coach@example.com'    // REPLACE ME
];

// Path to your service account key
// const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../src/config/serviceAccountKey.json');

// MongoDB URI
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin123@cluster0.7k88u.mongodb.net/wod-competitions?retryWrites=true&w=majority&appName=Cluster0';

// ---------------------

async function resetAndSeed() {
    try {
        // 1. Initialize Firebase Admin
        if (!admin.apps.length) {
            try {
                // const serviceAccount = require(SERVICE_ACCOUNT_PATH);
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log('🔥 Firebase Admin initialized');
            } catch (e) {
                console.error('❌ Error initializing Firebase Admin. Check FIREBASE_SERVICE_ACCOUNT env var.');
                console.error(e);
                process.exit(1);
            }
        }

        // 2. Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('🍃 Connected to MongoDB');

        // 3. Drop Database
        console.log('🗑️  Dropping database...');
        await mongoose.connection.db.dropDatabase();
        console.log('✅ Database dropped');

        // 4. Seed Admins
        console.log('🌱 Seeding admins...');
        const User = require('../src/Models/user.model');

        for (const email of ADMIN_EMAILS) {
            try {
                // Fetch user from Firebase to get UID
                const firebaseUser = await admin.auth().getUserByEmail(email);

                const newUser = new User({
                    firebaseUid: firebaseUser.uid,
                    email: firebaseUser.email,
                    nombre: firebaseUser.displayName || email.split('@')[0], // Fallback name
                    role: 'admin',
                    profileCompleted: true
                });

                await newUser.save();
                console.log(`👑 Admin created: ${email} (UID: ${firebaseUser.uid})`);

            } catch (error) {
                if (error.code === 'auth/user-not-found') {
                    console.warn(`⚠️  User not found in Firebase: ${email}. Please register this user in the app first.`);
                } else {
                    console.error(`❌ Error creating admin for ${email}:`, error.message);
                }
            }
        }

        console.log('🏁 Reset and Seed completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Fatal Error:', error);
        process.exit(1);
    }
}

resetAndSeed();
