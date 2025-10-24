// 1. Importar el módulo de admin (que ya fue inicializado en server.js)
const admin = require('firebase-admin');

async function authenticateToken(req, res, next) {
    
    // 2. Obtener el token de la cabecera
    const authHeader = req.headers['authorization'];
    
    // 3. Verificar que el token venga en el formato "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token no proveído o inválido.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 4. Usar 'admin' (no 'user') para verificar el token
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // 5. ¡Éxito! Añadimos los datos del usuario a la petición
        req.user = decodedToken; // req.user ahora tiene { uid, email, etc. }
        next(); // ¡Pase! La petición puede continuar al controlador

    } catch (error) {
        // 6. El token falló (expiró, es falso, etc.)
        console.error("Error al verificar el token:", error);
        return res.status(403).json({ message: 'Token inválido o expirado' });
    }
}

module.exports = authenticateToken;