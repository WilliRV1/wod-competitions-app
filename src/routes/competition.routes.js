const { Router } = require("express");
const router = Router();
const controller = require("../Controllers/competition");
const authMiddleware = require("../middlewares/auth.middleware");

// --- Rutas Públicas (Cualquiera puede ver) ---
router.get('/', controller.getAllCompetitions);
router.get('/:id', controller.getCompetitionById);

// --- Rutas Protegidas (Solo usuarios autenticados) ---
router.post('/', authMiddleware, controller.createCompetition);
router.put('/:id', authMiddleware, controller.updateCompetition);
router.put('/:id/join-partner', authMiddleware,controller.joinPartnerFinder)
router.delete('/:id', authMiddleware, controller.deleteCompetition);

module.exports = router;