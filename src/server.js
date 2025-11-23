// 1. Importar dotenv para cargar variables de entorno (¡DE PRIMERO!)
require('dotenv').config();

const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);  // Importa la llave

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const cors = require('cors');
// 2. Importar las librerías
const express = require('express');
const mongoose = require('mongoose');

// 3. Crear la aplicación de Express
const app = express();

// 4. Definir el puerto
const PORT = process.env.PORT || 5000;

// 5. Configurar Middlewares (¡ANTES DE LAS RUTAS!)
const corsOptions = {
  origin: [
    'https://f66150c41d77.ngrok-free.app', // Tu frontend de ngrok
    'http://localhost:3000' // Tu frontend local (para pruebas)
  ],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json()); // Middleware para que Express entienda JSON

// 6. Configurar las Rutas
app.use('/', require('./routes/index.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/boxes', require('./routes/box.routes'));
app.use('/api/competencias', require('./routes/competition.routes'));
app.use('/api/battle-registrations', require('./routes/battleRegistration.routes'));
app.use('/api/matches', require('./routes/match.routes')); // Match routes for bracket updates



// 7. Configurar Socket.io
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'https://f66150c41d77.ngrok-free.app',
      'http://localhost:3000',
      'http://localhost:5173' // Vite default port
    ],
    methods: ["GET", "POST"]
  }
});

// Guardar io en app para usarlo en controladores
app.set('io', io);

io.on('connection', (socket) => {
  console.log('🔌 Nuevo cliente conectado:', socket.id);

  socket.on('join_battle', (battleId) => {
    socket.join(battleId);
    console.log(`Cliente ${socket.id} se unió a la batalla ${battleId}`);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// 8. Función para conectar a la Base de Datos e Iniciar el Servidor
const startServer = async () => {
  try {
    // Conectar a MongoDB usando la URI de .env (¡SEGURO!)
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Base de datos conectada exitosamente');

    // Iniciar el servidor SÓLO si la conexión a la DB fue exitosa
    // USAR server.listen en lugar de app.listen para Socket.io
    server.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    });

  } catch (err) {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1); // Detener la aplicación si no se puede conectar a la DB
  }
};

startServer();
