const { Router } = require("express");
const router = Router();
const controller = require("../Controllers/user.js");
const authMiddleware = require("../middlewares/auth.middleware");




// --- Rutas Públicas (Cualquiera puede ver) ---
router.get('/', controller.getAllBoxes);
router.get('/:id', controller.getBoxById);

// --- Rutas Protegidas (Solo usuarios autenticados) ---
router.post('/', authMiddleware, controller.createBox);
router.put('/:id', authMiddleware, controller.updateBox);
router.delete('/:id', authMiddleware, controller.deleteBox);

module.exports = router;