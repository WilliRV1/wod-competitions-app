// routes/battleRegistration.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../Controllers/battleRegistration.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// ========================================
// RUTAS PÚBLICAS (Sin autenticación)
// ========================================

// Crear registro (paso 1)
router.post('/', controller.createRegistration);

// Obtener cupos disponibles
router.get('/slots/:category', controller.getAvailableSlotsByCategory);
router.get('/slots', controller.getAllAvailableSlots);

// ========================================
// RUTAS MERCADOPAGO
// ========================================

// Crear preferencia de pago (paso 2)
router.post('/create-payment', controller.createPaymentPreference);

// Webhook de MercadoPago (MercadoPago lo llama)
router.post('/webhook/mercadopago', controller.handleMercadoPagoWebhook);

// Obtener info de preferencia
router.get('/preference/:preferenceId', controller.getPreference);

// Verificar estado de pago
router.get('/payment-status/:paymentId', controller.checkPaymentStatus);

// ========================================
// RUTAS DE TESTING (Solo desarrollo)
// ========================================

// Test de conexión con MercadoPago
router.get('/test-mp', controller.testMercadoPagoConnection);

// Limpiar registros de prueba
router.delete('/admin/clean-test', controller.cleanTestRegistrations);

// ========================================
// RUTAS PROTEGIDAS (Requieren autenticación)
// ========================================

// Obtener mis registros
router.get('/my-registrations', authMiddleware, controller.getMyRegistrations);

// Cancelar mi registro
router.delete('/:id', authMiddleware, controller.cancelRegistration);

// ========================================
// RUTAS ADMIN (Requieren autenticación)
// ========================================

// Obtener todos los registros (con filtros)
router.get('/admin/all', authMiddleware, controller.getAllRegistrations);

// Obtener un registro específico
router.get('/admin/:id', authMiddleware, controller.getRegistrationById);

module.exports = router;