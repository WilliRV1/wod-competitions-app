const { Router } = require("express");
const router = Router();
const controller = require("../Controllers/user.js");
const authMiddleware = require("../middlewares/auth.middleware");

// --- Ruta especial para obtener MI perfil (con token) ---
// IMPORTANTE: Esta debe ir ANTES de '/:id' para que no la capture
router.get('/me', authMiddleware, controller.getMyProfile);

// --- Rutas públicas ---
router.get('/', controller.getUser);
router.get('/:id', controller.getUserID);

// --- Ruta de creación (sin auth porque es para registro inicial) ---
router.post('/', controller.newUser);

// --- Rutas protegidas ---
router.put("/:id", authMiddleware, controller.putUser);
router.delete("/:id", authMiddleware, controller.deleteUser);

module.exports = router;