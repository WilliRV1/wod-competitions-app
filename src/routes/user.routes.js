const { Router } = require("express");
const router = Router();
const controller = require("../Controllers/user.js");
const authMiddleware = require("../middlewares/auth.middleware");

// ===== RUTAS ESPECIALES (ANTES DE /:id) =====
// Obtener MI perfil (con token)
router.get('/me', authMiddleware, controller.getMyProfile);

// ===== RUTAS PÚBLICAS =====
router.get('/', controller.getUser);
router.get('/:id', controller.getUserID);

// ===== REGISTRO =====
// Registro rápido (sin auth porque es para usuarios nuevos)
router.post('/', controller.quickRegister);

// ===== RUTAS PROTEGIDAS =====
// Completar perfil progresivamente
router.patch('/complete-profile', authMiddleware, controller.completeProfile);

// Actualizar perfil completo
router.put("/:id", authMiddleware, controller.putUser);

// Eliminar cuenta
router.delete("/:id", authMiddleware, controller.deleteUser);

module.exports = router;