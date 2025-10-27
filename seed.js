// seed.js
require('dotenv').config(); // Carga las variables de entorno
const mongoose = require('mongoose');

// Importa tus modelos (asegúrate que las rutas sean correctas)
const User = require('./src/Models/user.model.js');
const Box = require('./src/Models/box.model.js');
const Competition = require('./src/Models/competition.model.js');

// --- DATOS DE EJEMPLO ---
// ¡¡¡REEMPLAZA CON UIDs REALES DE FIREBASE!!!
const usuariosEjemplo = [
    {
        firebaseUid: 'pXLXiYNa1lfD39Tpczrbi9546qn1', // <-- OBTENER DE FIREBASE AUTH
        nombre: 'Ana',
        apellidos: 'Gómez',
        email: 'ana.atleta@ejemplo.com',
        rol: 'atleta',
        nivel: 'Intermedio',
    },
    {
        firebaseUid: 'ND7RkEgX6VQw9ZlO2RI9RAwjGQB2', // <-- OBTENER DE FIREBASE AUTH
        nombre: 'Carlos',
        apellidos: 'Pérez',
        email: 'carlos.owner@ejemplo.com',
        rol: 'dueño_box',
    },
    {
        firebaseUid: 'L5NQIp2BCdOyba9ovNaUEEpw1ZD3', // <-- OBTENER DE FIREBASE AUTH
        nombre: 'Sofía',
        apellidos: 'López',
        email: 'sofia.atleta@ejemplo.com',
        rol: 'atleta',
        nivel: 'RX',
    }
];

const boxesEjemplo = [
    {
        nombre: 'CrossFit Cali Central',
        direccion: 'Avenida Siempre Viva 742',
        // El 'owner' se asignará después de crear los usuarios
    },
    {
        nombre: 'Box del Sur',
        direccion: 'Carrera 100 # 10-20',
        // El 'owner' se asignará después
    }
];

const competenciasEjemplo = [
    {
        nombre: 'Open Box Challenge 2025',
        fecha: new Date('2025-11-15T09:00:00Z'),
        lugar: 'CrossFit Cali Central',
        descripcion: 'Competencia abierta para todos los niveles.',
        categorias: ['Novato', 'Intermedio'],
        costo: '30 USD',
        // El 'organizador' (Box) o 'creador' (User) se asignarán después
    },
    {
        nombre: 'Comunidad Throwdown',
        fecha: new Date('2025-12-01T10:00:00Z'),
        lugar: 'Parque del Ingenio',
        descripcion: 'Evento gratuito de la comunidad.',
        categorias: ['Todos'],
        // El 'creador' (User) se asignará después
    }
];

// --- FUNCIÓN DE SEMBRADO ---
const seedDatabase = async () => {
    try {
        // 1. Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🌱 Conectado a MongoDB para sembrar...');

        // 2. Limpiar colecciones existentes (¡CUIDADO!)
        console.log('🧹 Limpiando colecciones...');
        await User.deleteMany({});
        await Box.deleteMany({});
        await Competition.deleteMany({});
        console.log('🧼 Colecciones limpiadas.');

        // 3. Insertar Usuarios
        console.log('👤 Insertando usuarios...');
        const usuariosCreados = await User.insertMany(usuariosEjemplo);
        console.log(`✅ ${usuariosCreados.length} usuarios insertados.`);

        // --- Asignar Dueños a Boxes ---
        // Encuentra el _id del dueño de box en MongoDB
        const dueñoBox1 = usuariosCreados.find(u => u.email === 'carlos.owner@ejemplo.com');
        if (dueñoBox1) {
            boxesEjemplo[0].owner = dueñoBox1._id; // Asigna el _id de MongoDB
            boxesEjemplo[1].owner = dueñoBox1._id; // Asignamos el mismo dueño a ambos boxes por simplicidad
        } else {
            console.warn('⚠️ No se encontró el usuario dueño de box para asignar.');
        }

        // 4. Insertar Boxes (ya con dueños)
        console.log('🏋️ Insertando boxes...');
        const boxesCreados = await Box.insertMany(boxesEjemplo);
        console.log(`✅ ${boxesCreados.length} boxes insertados.`);

        // --- Asignar Organizadores/Creadores a Competencias ---
        const boxCentral = boxesCreados.find(b => b.nombre === 'CrossFit Cali Central');
        const atletaAna = usuariosCreados.find(u => u.email === 'ana.atleta@ejemplo.com');

        if (boxCentral) {
            competenciasEjemplo[0].organizador = boxCentral._id; // Asigna el _id del Box
        }
        if (atletaAna) {
            competenciasEjemplo[1].creador = atletaAna._id; // Asigna el _id del Atleta
        }

        // 5. Insertar Competencias (ya con organizador/creador)
        console.log('🏆 Insertando competencias...');
        const competenciasCreadas = await Competition.insertMany(competenciasEjemplo);
        console.log(`✅ ${competenciasCreadas.length} competencias insertadas.`);

        console.log('🎉 ¡Base de datos sembrada exitosamente!');

    } catch (error) {
        console.error('❌ Error al sembrar la base de datos:', error);
    } finally {
        // 6. Cerrar la conexión
        mongoose.connection.close();
        console.log('🔌 Conexión cerrada.');
    }
};

// --- EJECUTAR EL SCRIPT ---
seedDatabase();