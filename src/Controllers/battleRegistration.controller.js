// Controllers/mercadopago.controller.js
const BattleRegistration = require('../Models/battleRegistration.model.js');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { 
    sendRegistrationConfirmationEmail,
    sendPaymentPendingEmail,
    sendPaymentRejectedEmail 
} = require('../services/email.service.js');

// === CREAR PREFERENCIA DE PAGO ===
exports.createPaymentPreference = async (req, res) => {
    try {
        console.log("💳 Creando preferencia de pago para:", req.body);
        
        // 🔥 VERIFICAR VARIABLES DE ENTORNO
        console.log("🔑 MP_ACCESS_TOKEN existe?:", process.env.MP_ACCESS_TOKEN ? "SÍ" : "NO");
        console.log("🌐 API_URL:", process.env.API_URL);
        console.log("🚀 FRONTEND_URL:", process.env.FRONTEND_URL);

        const {
            registrationId,
            amount,
            title,
            description,
            payer
        } = req.body;

        // Validar que el registro existe
        const registration = await BattleRegistration.findById(registrationId);
        if (!registration) {
            console.log("❌ Registro no encontrado:", registrationId);
            return res.status(404).json({
                message: "Registro no encontrado"
            });
        }

        console.log("✅ Registro encontrado:", registration._id);

        // 🔥 VALIDAR DATOS CRÍTICOS
        if (!amount || !payer || !payer.email) {
            console.log("❌ Datos incompletos:", { amount, payer });
            return res.status(400).json({
                message: "Datos incompletos para crear el pago"
            });
        }

        // 🔥 CONFIGURACIÓN MEJORADA DE MERCADOPAGO
        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN,
            options: { 
                timeout: 10000, // Aumentar timeout
                idempotencyKey: 'battle-' + Date.now()
            }
        });

        const preference = new Preference(client);

        // 🔥 DATOS DE PREFERENCIA MEJORADOS
        const preferenceData = {
            items: [
                {
                    id: registrationId.toString(),
                    title: title || `WOD MATCH BATTLE - ${registration.category.toUpperCase()}`,
                    description: description || `Inscripción: ${registration.firstName} ${registration.lastName}`,
                    quantity: 1,
                    currency_id: 'COP',
                    unit_price: parseFloat(amount) / 100  // 🔥 Convertir centavos a pesos
                }
            ],
            payer: {
                name: payer.name || registration.firstName,
                surname: payer.surname || registration.lastName,
                email: payer.email || registration.email,
                phone: {
                    area_code: '57', // Colombia
                    number: payer.phone ? payer.phone.replace(/\D/g, '').slice(-10) : registration.whatsapp.replace(/\D/g, '').slice(-10)
                }
            },
            external_reference: registrationId.toString(),
            notification_url: `${process.env.API_URL || 'http://localhost:5000'}/api/battle-registrations/webhook/mercadopago`,
            back_urls: {
                success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/battle/payment-success`,
                failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/battle/payment-failure`, 
                pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/battle/payment-pending`
            },
            auto_return: 'approved',
            statement_descriptor: 'WODMATCH BATTLE',
            metadata: {
                registration_id: registrationId,
                registration_code: registration.registrationCode,
                category: registration.category,
                user_email: registration.email
            }
        };

        console.log("📤 Enviando a MercadoPago:", JSON.stringify(preferenceData, null, 2));

        const response = await preference.create({ body: preferenceData });

        console.log("✅ Preferencia creada exitosamente:", response.id);

        res.status(200).json({
            preference: {
                id: response.id,
                init_point: response.init_point,
                sandbox_init_point: response.sandbox_init_point
            }
        });

    } catch (error) {
        console.error("❌ ERROR CRÍTICO al crear preferencia MercadoPago:");
        console.error("📌 Mensaje:", error.message);
        console.error("📌 Stack:", error.stack);
        
        if (error.response) {
            console.error("📌 Respuesta MP:", error.response.data);
            console.error("📌 Status MP:", error.response.status);
        }

        res.status(500).json({
            message: "Error interno al crear preferencia de pago",
            error: error.message,
            details: error.response?.data || 'Sin detalles adicionales'
        });
    }
};

// === WEBHOOK DE MERCADOPAGO (CRÍTICO) ===
exports.handleMercadoPagoWebhook = async (req, res) => {
    try {
        const { type, data } = req.body;

        console.log("🔔 Webhook MercadoPago recibido:", type, data);

        if (type === 'payment' && data && data.id) {
            // 🔥 CONFIGURAR CLIENTE PARA EL WEBHOOK
            const client = new MercadoPagoConfig({
                accessToken: process.env.MP_ACCESS_TOKEN,
                options: { timeout: 10000 }
            });

            const payment = new Payment(client);
            
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

            // 🔥 LÓGICA DE EMAILS SEGÚN ESTADO DEL PAGO
            if (status === 'approved') {
                // ✅ PAGO APROBADO
                newStatus = 'confirmed';
                paymentStatus = 'approved';
                registration.payment.paidAt = new Date();

                // 🔥 ENVIAR EMAIL DE CONFIRMACIÓN
                try {
                    await sendRegistrationConfirmationEmail(registration);
                    console.log("✅ Email de confirmación enviado a:", registration.email);
                } catch (emailError) {
                    console.error("❌ Error al enviar email de confirmación:", emailError);
                }

            } else if (status === 'rejected' || status === 'cancelled') {
                // ❌ PAGO RECHAZADO
                paymentStatus = 'rejected';

                try {
                    await sendPaymentRejectedEmail(registration);
                    console.log("✅ Email de rechazo enviado a:", registration.email);
                } catch (emailError) {
                    console.error("❌ Error al enviar email de rechazo:", emailError);
                }

            } else if (status === 'pending' || status === 'in_process') {
                // ⏳ PAGO PENDIENTE
                paymentStatus = 'pending';

                try {
                    await sendPaymentPendingEmail(registration);
                    console.log("✅ Email de pendiente enviado a:", registration.email);
                } catch (emailError) {
                    console.error("❌ Error al enviar email de pendiente:", emailError);
                }
            }

            // Actualizar registro en la base de datos
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
        
        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN,
            options: { timeout: 5000 }
        });

        const preference = new Preference(client);
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

        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN,
            options: { timeout: 5000 }
        });

        const payment = new Payment(client);
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

// === ENDPOINT DE PRUEBA PARA MERCADOPAGO (SOLO DESARROLLO) ===
exports.testMercadoPagoConnection = async (req, res) => {
    try {
        console.log("🧪 Probando conexión con MercadoPago...");
        
        // 🔥 VERIFICAR TOKEN
        if (!process.env.MP_ACCESS_TOKEN) {
            return res.status(500).json({
                success: false,
                message: "MP_ACCESS_TOKEN no configurado"
            });
        }

        console.log("🔑 Token MP encontrado, longitud:", process.env.MP_ACCESS_TOKEN.length);
        
        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN,
            options: { timeout: 10000 }
        });

        const preference = new Preference(client);
        
        // Datos de prueba mínimos
        const testData = {
            items: [
                {
                    title: "TEST WOD MATCH BATTLE",
                    quantity: 1,
                    currency_id: "COP",
                    unit_price: 10.00 // $10 COP
                }
            ],
            notification_url: `${process.env.API_URL || 'http://localhost:5000'}/api/battle-registrations/webhook/mercadopago`,
            auto_return: "approved",
            back_urls: {
                success: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/battle/payment-success`,
                failure: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/battle/payment-failure`,
                pending: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/battle/payment-pending`
            }
        };

        console.log("📤 Enviando datos de prueba a MP...");
        const response = await preference.create({ body: testData });
        
        console.log("✅ Conexión con MP exitosa:", response.id);
        
        res.status(200).json({
            success: true,
            message: "Conexión con MercadoPago exitosa",
            preferenceId: response.id,
            init_point: response.init_point
        });

    } catch (error) {
        console.error("❌ Error en conexión MP:", error.message);
        console.error("📌 Stack:", error.stack);
        
        if (error.response) {
            console.error("📌 Respuesta de error MP:", error.response.data);
        }
        
        res.status(500).json({
            success: false,
            message: "Error en conexión con MercadoPago",
            error: error.message,
            details: error.response?.data || 'Sin detalles adicionales'
        });
    }
};

// === LIMPIAR REGISTROS DE TESTING (SOLO DESARROLLO) ===
exports.cleanTestRegistrations = async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                message: "Esta función solo está disponible en desarrollo"
            });
        }

        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                message: "Email requerido para limpiar registros"
            });
        }

        const result = await BattleRegistration.deleteMany({
            email: email.toLowerCase(),
            status: 'pending_payment'
        });

        console.log(`🧹 Registros eliminados para ${email}: ${result.deletedCount}`);

        res.status(200).json({
            message: `Registros de testing eliminados: ${result.deletedCount}`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error("❌ Error al limpiar registros:", error);
        res.status(500).json({
            message: "Error al limpiar registros",
            error: error.message
        });
    }
};

module.exports = exports;