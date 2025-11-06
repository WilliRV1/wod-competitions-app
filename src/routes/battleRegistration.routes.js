// routes/battleRegistration.routes.js
const { Router } = require("express");
const router = Router();
const controller = require("../Controllers/battleRegistration.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// NOTA: Agregar esta ruta en server.js:
// app.use('/api/battle-registrations', require('./routes/battleRegistration.routes'));

// === RUTAS PÚBLICAS ===
// Crear registro (cualquiera puede registrarse, con o sin login)
router.post('/', controller.createRegistration);

// Webhook MercadoPago (sin auth porque viene de MercadoPago)
router.post('/webhook/payment', controller.updatePaymentStatus);

// === RUTAS PROTEGIDAS (Usuario autenticado) ===
// Obtener mis registros
router.get('/my-registrations', authMiddleware, controller.getMyRegistrations);

// Cancelar mi registro
router.delete('/:id', authMiddleware, controller.cancelRegistration);

// === RUTAS ADMIN (TODO: Agregar middleware de admin) ===
// Obtener todos los registros
router.get('/admin/all', authMiddleware, controller.getAllRegistrations);

// Obtener un registro específico
router.get('/admin/:id', authMiddleware, controller.getRegistrationById);

// === RUTAS MERCADOPAGO ===
const mpController = require("../Controllers/mercadopago.controller");

// Crear preferencia de pago
router.post('/create-payment', mpController.createPaymentPreference);

// Webhook de MercadoPago (CRÍTICO - Sin auth porque viene de MP)
router.post('/webhook/mercadopago', mpController.handleMercadoPagoWebhook);

// Obtener info de preferencia
router.get('/preference/:preferenceId', mpController.getPreference);

// Verificar estado de pago
router.get('/payment-status/:paymentId', mpController.checkPaymentStatus);

module.exports = router;