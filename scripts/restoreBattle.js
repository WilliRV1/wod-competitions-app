require('dotenv').config();
const mongoose = require('mongoose');
const Battle = require('../src/Models/battle.model');
const User = require('../src/Models/user.model');
const BattleRegistration = require('../src/Models/battleRegistration.model');

// CONFIG
const TARGET_EMAIL = 'williamreyesvalencia04@gmail.com';
const BATTLE_ID = '675c76e7672256695063535c'; // The ID hardcoded in frontend
const CATEGORY_NAME = 'Intermedio Masculino'; // Display name for Battle model
const REGISTRATION_CATEGORY = 'intermedio-male'; // Enum value for Registration model
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin123@cluster0.7k88u.mongodb.net/wod-competitions?retryWrites=true&w=majority&appName=Cluster0';

async function restoreBattle() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('🍃 Connected to MongoDB');

        // 1. Find Admin User
        const adminUser = await User.findOne({ email: TARGET_EMAIL });
        if (!adminUser) {
            console.error(`❌ Admin user ${TARGET_EMAIL} not found. Run promoteToAdmin.js first.`);
            process.exit(1);
        }

        // 2. Create/Restore Battle
        let battle = await Battle.findById(BATTLE_ID);
        if (battle) {
            console.log('⚠️  Battle already exists. Updating creator...');
            battle.creador = adminUser._id;
        } else {
            console.log('🛠️  Creating new Battle with specific ID...');
            battle = new Battle({
                _id: BATTLE_ID,
                nombre: "WOD MATCH Battle #1",
                fecha: new Date("2026-03-15"),
                lugar: "CrossFit Coach Piperubio",
                descripcion: "Torneo restaurado para pruebas.",
                creador: adminUser._id,
                costo: 90000,
                estado: 'activo',
                categorias: [
                    { nombre: CATEGORY_NAME, limiteParticipantes: 16, pesoMin: 70, pesoMax: 80 },
                    { nombre: "Intermedio Femenino", limiteParticipantes: 16 },
                    { nombre: "Scaled Masculino", limiteParticipantes: 16 },
                    { nombre: "Scaled Femenino", limiteParticipantes: 16 }
                ]
            });
        }
        await battle.save();
        console.log(`✅ Battle restored: ${battle.nombre} (ID: ${battle._id})`);

        // 3. Create Dummy Participants & Registrations
        console.log('👥 Creating dummy participants...');
        const dummyUsers = [];

        for (let i = 1; i <= 8; i++) {
            const dummyEmail = `athlete${i}@test.com`;
            let user = await User.findOne({ email: dummyEmail });
            if (!user) {
                user = new User({
                    firebaseUid: `dummy_uid_${i}`,
                    email: dummyEmail,
                    nombre: `Atleta`,
                    apellidos: `${i}`,
                    role: 'user',
                    profileCompleted: true
                });
                await user.save();
            }
            dummyUsers.push(user);

            // Register them
            const existingReg = await BattleRegistration.findOne({
                userId: user._id,
                category: REGISTRATION_CATEGORY
            });

            if (!existingReg) {
                await BattleRegistration.create({
                    eventId: 'WMBATTLE-T1-2026', // Hardcoded ID used in bracket controller
                    userId: user._id,
                    user: user._id, // Link to user model
                    category: REGISTRATION_CATEGORY,

                    // Required Personal Data
                    firstName: user.nombre,
                    lastName: user.apellidos,
                    email: user.email,
                    whatsapp: '3001234567',
                    birthDate: new Date('1995-01-01'),

                    // Required Waivers
                    waivers: {
                        liabilityAccepted: true,
                        imageAuthorized: true
                    },

                    // Required Emergency Contact
                    emergencyContact: {
                        name: 'Emergency Contact',
                        phone: '3009999999',
                        relation: 'Friend'
                    },

                    // Required Payment
                    payment: {
                        amount: 90000,
                        status: 'approved',
                        method: 'manual'
                    },

                    status: 'confirmed',
                    registrationCode: `WM-TEST-${i}`
                });
            }
        }
        console.log(`✅ Registered ${dummyUsers.length} dummy athletes for ${REGISTRATION_CATEGORY}`);

        console.log('\n🎉 RESTORE COMPLETE!');
        console.log('👉 You can now generate the bracket via Postman/API.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

restoreBattle();
