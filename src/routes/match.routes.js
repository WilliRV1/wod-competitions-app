const { Router } = require("express");
const router = Router();
const controller = require("../Controllers/match");
const authMiddleware = require("../middlewares/auth.middleware");



// --- Rutas Públicas (Cualquiera puede ver) ---
router.get('/battle/:battleId', controller.getMatchesByBattle);
router.get('/:id', controller.getMatchById);
router.get('/participant/:participantId', controller.getMatchesByParticipant);
router.get('/battle/:battleId/round/:round', controller.getMatchesByRound);

// --- Rutas Protegidas (Solo usuarios autenticados) ---
router.post('/', authMiddleware, controller.createMatch);
router.put('/:id/result', authMiddleware, controller.updateMatchResult);
router.put('/:id/start', authMiddleware, controller.startMatch);
router.put('/:id/complete', authMiddleware, controller.completeMatch);

module.exports = router;