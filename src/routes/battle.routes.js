const { Router } = require("express");
const router = Router();
const controller = require("../Controllers/battle");
const authMiddleware = require("../middlewares/auth.middleware");



// --- Rutas Públicas (Cualquiera puede ver) ---
router.get('/', controller.getAllBattles);
router.get('/:id', controller.getBattleById);
router.get('/creator/:creatorId', controller.getBattlesByCreator);
router.get('/box/:boxId', controller.getBattlesByBox);

// --- Rutas Protegidas (Solo usuarios autenticados) ---
router.post('/', authMiddleware, controller.createBattle);
router.put('/:id', authMiddleware, controller.updateBattle);
router.delete('/:id', authMiddleware, controller.deleteBattle);

module.exports = router;