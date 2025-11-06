// Controllers/mercadopago.controller.js
const BattleRegistration = require('../Models/battleRegistration.model.js');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

// Configurar MercadoPago con el nuevo SDK
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000, idempotencyKey: 'abc' }
});

const preference = new Preference(client);
const payment = new Payment(client);

// === CREAR PREFERENCIA DE PAGO ===
exports.createPaymentPreference = async (req, res) => {
    try {
        const {
            registrationId,
            amount,
            title,
            description,
            payer
        } = req.body;

        console.log("💳 Creando preferencia de pago para:", registrationId);

        // Validar que el registro existe
        const registration = await BattleRegistration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({
                message: "Registro no encontrado"
            });
        }

        // Crear preferencia de MercadoPago
        const preferenceData = {
            items: [
                {
                    title: title || `WOD MATCH BATTLE - ${registration.category}`,
                    description: description || `Inscripción ${registration.fullName}`,
                    unit_price: parseFloat(amount),
                    quantity: 1,
                    currency_id: 'COP'
                }
            ],
            payer: {
                name: payer.name,
                surname: payer.surname,
                email: payer.email,
                phone: {
                    number: payer.phone
                }
            },
            external_reference: registrationId.toString(),
            notification_url: `${process.env.API_URL || 'http://localhost:5000'}/api/battle-registrations/webhook/mercadopago`,
            back_urls: {
                success: process.env.MP_SUCCESS_URL || 'http://localhost:5173/battle/payment-success',
                failure: process.env.MP_FAILURE_URL || 'http://localhost:5173/battle/payment-failure',
                pending: process.env.MP_PENDING_URL || 'http://localhost:5173/battle/payment-pending'
            },
            auto_return: 'approved',
            statement_descriptor: 'WOD MATCH BATTLE',
            metadata: {
                registration_code: registration.registrationCode,
                category: registration.category
            }
        };

        const response = await preference.create({ body: preferenceData });

        console.log("✅ Preferencia creada:", response.id);

        res.status(200).json({
            preference: {
                id: response.id,
                init_point: response.init_point,
                sandbox_init_point: response.sandbox_init_point
            }
        });

    } catch (error) {
        console.error("❌ Error al crear preferencia MercadoPago:", error);
        res.status(500).json({
            message: "Error al crear preferencia de pago",
            error: error.message
        });
    }
};

// === WEBHOOK DE MERCADOPAGO (CRÍTICO) ===
exports.handleMercadoPagoWebhook = async (req, res) => {
    try {
        const { type, data } = req.body;

        console.log("🔔 Webhook MercadoPago recibido:", type, data);

        if (type === 'payment' && data && data.id) {
            const paymentData = await payment.get({ id: data.id });
            
            console.log("💰 Pago obtenido:", paymentData);

            const registrationId = paymentData.external_reference;
            const status = paymentData.status;

            const registration = await BattleRegistration.findById(registrationId);
            if (!registration) {
                console.error("❌ Registro no encontrado:", registrationId);
                return res.status(404).json({ message: "Registro no encontrado" });
            }

            let newStatus = registration.status;
            let paymentStatus = status;

            if (status === 'approved') {
                newStatus = 'confirmed';
                paymentStatus = 'approved';
                registration.payment.paidAt = new Date();
            } else if (status === 'rejected' || status === 'cancelled') {
                paymentStatus = 'rejected';
            } else if (status === 'pending' || status === 'in_process') {
                paymentStatus = 'pending';
            }

            registration.status = newStatus;
            registration.payment.status = paymentStatus;
            registration.payment.method = 'mercadopago';
            registration.payment.transactionId = paymentData.id.toString();
            registration.payment.mercadoPagoData = paymentData;

            await registration.save();

            console.log("✅ Registro actualizado:", registrationId, "Status:", newStatus);
        }

        res.status(200).send('OK');

    } catch (error) {
        console.error("❌ Error en webhook MercadoPago:", error);
        res.status(500).json({
            message: "Error procesando webhook",
            error: error.message
        });
    }
};

// === OBTENER INFO DE PREFERENCIA ===
exports.getPreference = async (req, res) => {
    try {
        const { preferenceId } = req.params;
        
        const preferenceData = await preference.get({ id: preferenceId });
        
        res.status(200).json({
            preference: {
                id: preferenceData.id,
                init_point: preferenceData.init_point,
                sandbox_init_point: preferenceData.sandbox_init_point
            }
        });

    } catch (error) {
        console.error("❌ Error al obtener preferencia:", error);
        res.status(500).json({
            message: "Error al obtener preferencia",
            error: error.message
        });
    }
};

// === VERIFICAR ESTADO DE PAGO ===
exports.checkPaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        const paymentData = await payment.get({ id: paymentId });
        
        const registrationId = paymentData.external_reference;
        const registration = await BattleRegistration.findById(registrationId);

        res.status(200).json({
            payment: {
                id: paymentData.id,
                status: paymentData.status,
                status_detail: paymentData.status_detail
            },
            registration: registration ? {
                id: registration._id,
                code: registration.registrationCode,
                status: registration.status,
                paymentStatus: registration.payment.status
            } : null
        });

    } catch (error) {
        console.error("❌ Error al verificar pago:", error);
        res.status(500).json({
            message: "Error al verificar estado de pago",
            error: error.message
        });
    }
};

module.exports = exports;