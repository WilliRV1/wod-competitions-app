const { Router } = require("express");
const router = Router();
const controller = require("../Controllers/competition");
const authMiddleware = require("../middlewares/auth.middleware");

const bracketController = require("../Controllers/bracket.controller");

// --- Rutas Públicas (Cualquiera puede ver) ---
router.get('/', controller.getAllCompetitions);
router.get('/:id', controller.getCompetitionById);
router.get('/bracket/:battleId/:category', bracketController.getBracket);

// --- Rutas Protegidas (Solo usuarios autenticados) ---
router.post('/', authMiddleware, controller.createCompetition);
// router.post('/bracket/generate', authMiddleware, bracketController.generateBracket);
router.post('/bracket/generate', bracketController.generateBracket); // TEMP: Auth disabled for debugging
router.put('/:id', authMiddleware, controller.updateCompetition);
router.put('/:id/join-partner', authMiddleware, controller.joinPartnerFinder)
router.delete('/:id', authMiddleware, controller.deleteCompetition);

module.exports = router;