// 1. Importar dotenv para cargar variables de entorno (¡DE PRIMERO!)
require('dotenv').config();

// 2. Importar las librerías
const express = require('express');
const mongoose = require('mongoose');

// 3. Crear la aplicación de Express
const app = express();

// 4. Definir el puerto
const PORT = process.env.PORT || 5000;

// 5. Configurar Middlewares (¡ANTES DE LAS RUTAS!)
app.use(express.json()); // Middleware para que Express entienda JSON

// 6. Configurar las Rutas
app.use('/', require('./routes/index.routes'));
app.use('/api/users', require('./routes/user.routes'));

// 7. Función para conectar a la Base de Datos e Iniciar el Servidor
const startServer = async () => {
    try {
        // Conectar a MongoDB usando la URI de .env (¡SEGURO!)
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Base de datos conectada exitosamente');

        // Iniciar el servidor SÓLO si la conexión a la DB fue exitosa
        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
        });

    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        process.exit(1); // Detener la aplicación si no se puede conectar a la DB
    }
};

// 8. Ejecutar la función de arranque
startServer();