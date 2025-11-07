// routes/battleRegistration.routes.js
const express = require("express");
const router = express.Router(); // 🔥 CAMBIO IMPORTANTE: Usar express.Router()
const controller = require("../Controllers/battleRegistration.controller");
const mpController = require("../Controllers/mercadopago.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// === RUTAS PÚBLICAS ===
router.post('/', controller.createRegistration);
router.get('/slots/:category', controller.getAvailableSlotsByCategory);
router.get('/slots', controller.getAllAvailableSlots);

// === RUTAS MERCADOPAGO ===
router.post('/create-payment', mpController.createPaymentPreference);
router.post('/webhook/mercadopago', mpController.handleMercadoPagoWebhook);
router.get('/preference/:preferenceId', mpController.getPreference);
router.get('/payment-status/:paymentId', mpController.checkPaymentStatus);

// === RUTAS DE TESTING (SOLO DESARROLLO) ===
router.get('/test-mp', mpController.testMercadoPagoConnection);
router.delete('/admin/clean-test', mpController.cleanTestRegistrations);

// === RUTAS PROTEGIDAS ===
router.get('/my-registrations', authMiddleware, controller.getMyRegistrations);
router.delete('/:id', authMiddleware, controller.cancelRegistration);

// === RUTAS ADMIN ===
router.get('/admin/all', authMiddleware, controller.getAllRegistrations);
router.get('/admin/:id', authMiddleware, controller.getRegistrationById);

module.exports = router;