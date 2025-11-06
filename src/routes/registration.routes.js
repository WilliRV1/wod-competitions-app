const { Router } = require("express");
const router = Router();
const controller = require("../Controllers/registration");
const authMiddleware = require("../middlewares/auth.middleware");



// --- Rutas Públicas (Cualquiera puede ver) ---
router.get('/battle/:battleId', controller.getRegistrationsByBattle);
router.get('/:id', controller.getRegistrationById);
router.get('/user/:userId', controller.getUserRegistrations);
router.get('/battle/:battleId/category/:category', controller.getRegistrationsByCategory);

// --- Rutas Protegidas (Solo usuarios autenticados) ---
router.post('/', authMiddleware, controller.registerForBattle);
router.put('/:id/status', authMiddleware, controller.updateRegistrationStatus);
router.delete('/:id', authMiddleware, controller.cancelRegistration);

module.exports = router;