// 1. Importar el módulo de admin (inicializado en server.js)
const admin = require('firebase-admin');

/**
 * Middleware de autenticación que verifica el token Firebase enviado en el encabezado.
 * En modo desarrollo, si no se envía token, se asigna un uid de prueba y se continúa.
 */
async function authenticateToken(req, res, next) {
    // 2. Obtener el token de la cabecera
    const authHeader = req.headers['authorization'];

    // 3. Verificar que el token venga en el formato "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Desarrollo sin token: asignar uid ficticio y continuar
        req.user = { uid: 'dev-user' };
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verificar el token con Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(token);
        // Adjuntar la información del usuario al request
        req.user = { uid: decodedToken.uid };
        next();
    } catch (error) {
        console.error('Error verificando token:', error);
        return res.status(403).json({ message: 'Token inválido o expirado' });
    }
}

module.exports = authenticateToken;