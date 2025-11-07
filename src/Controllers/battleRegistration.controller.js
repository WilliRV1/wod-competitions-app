// Controllers/battleRegistration.controller.js
const BattleRegistration = require('../Models/battleRegistration.model.js');
const User = require('../Models/user.model.js');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { 
    sendRegistrationConfirmationEmail,
    sendPaymentPendingEmail,
    sendPaymentRejectedEmail 
} = require('../services/email.service.js');

// ========================================
// PARTE 1: CRUD BÁSICO DE REGISTROS
// ========================================

// === CREAR REGISTRO (SIN PAGO) ===
exports.createRegistration = async (req, res) => {
    try {
        console.log("📝 Creando registro:", req.body);

        const {
            firstName,
            lastName,
            birthDate,
            email,
            whatsapp,
            category,
            emergencyName,
            emergencyPhone,
            emergencyRelation,
            medicalConditions,
            medications,
            waiverAccepted,
            imageAuthorized,
            amount
        } = req.body;

        // Validar campos obligatorios
        if (!firstName || !lastName || !birthDate || !email || !whatsapp || !category || !amount) {
            return res.status(400).json({
                message: "Faltan campos obligatorios"
            });
        }

        if (!emergencyName || !emergencyPhone || !waiverAccepted) {
            return res.status(400).json({
                message: "Faltan datos de emergencia o waiver no aceptado"
            });
        }

        // Verificar edad (mayor de 18)
        const birth = new Date(birthDate);
        const today = new Date();
        const age = today.getFullYear() - birth.getFullYear();
        if (age < 18) {
            return res.status(400).json({
                message: "Debes ser mayor de 18 años"
            });
        }

        // Verificar cupos disponibles
        const currentCount = await BattleRegistration.countDocuments({
            category,
            status: { $in: ['pending_payment', 'confirmed'] }
        });

        const CATEGORY_LIMITS = {
            'intermedio-male': 16,
            'intermedio-female': 16,
            'scaled-male': 16,
            'scaled-female': 16
        };

        if (currentCount >= CATEGORY_LIMITS[category]) {
            return res.status(400).json({
                message: "No hay cupos disponibles en esta categoría"
            });
        }

        // Obtener usuario si está autenticado
        let userId = null;
        let firebaseUid = null;

        if (req.user) {
            firebaseUid = req.user.uid;
            const user = await User.findOne({ firebaseUid });
            if (user) {
                userId = user._id;
            }
        }

        // Generar código único
        let registrationCode;
        let isUnique = false;

        while (!isUnique) {
            registrationCode = BattleRegistration.generateRegistrationCode();
            const existing = await BattleRegistration.findOne({ registrationCode });
            if (!existing) {
                isUnique = true;
            }
        }

        // Crear registro
        const newRegistration = new BattleRegistration({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            birthDate,
            email: email.toLowerCase().trim(),
            whatsapp: whatsapp.trim(),
            category,
            emergencyContact: {
                name: emergencyName.trim(),
                phone: emergencyPhone.trim(),
                relation: emergencyRelation?.trim() || ''
            },
            medical: {
                conditions: medicalConditions?.trim() || '',
                medications: medications?.trim() || ''
            },
            waivers: {
                liabilityAccepted: waiverAccepted,
                imageAuthorized: imageAuthorized || false
            },
            payment: {
                amount: parseFloat(amount),
                currency: 'COP',
                status: 'pending',
                method: 'pending'
            },
            user: userId,
            firebaseUid: firebaseUid,
            status: 'pending_payment',
            registrationCode
        });

        await newRegistration.save();

        console.log("✅ Registro creado:", newRegistration._id);

        res.status(201).json({
            message: "Registro creado exitosamente",
            registration: {
                id: newRegistration._id,
                code: newRegistration.registrationCode,
                firstName: newRegistration.firstName,
                lastName: newRegistration.lastName,
                email: newRegistration.email,
                category: newRegistration.category,
                status: newRegistration.status
            }
        });

    } catch (error) {
        console.error("❌ Error al crear registro:", error);
        res.status(500).json({
            message: "Error al crear registro",
            error: error.message
        });
    }
};

// === OBTENER MIS REGISTROS ===
exports.getMyRegistrations = async (req, res) => {
    try {
        const firebaseUid = req.user.uid;

        const user = await User.findOne({ firebaseUid });
        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        const registrations = await BattleRegistration.find({
            user: user._id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            registrations
        });

    } catch (error) {
        console.error("❌ Error al obtener registros:", error);
        res.status(500).json({
            message: "Error al obtener registros",
            error: error.message
        });
    }
};

// === OBTENER TODOS LOS REGISTROS (ADMIN) ===
exports.getAllRegistrations = async (req, res) => {
    try {
        const { category, status, paymentStatus } = req.query;

        const filter = {};
        if (category) filter.category = category;
        if (status) filter.status = status;
        if (paymentStatus) filter['payment.status'] = paymentStatus;

        const registrations = await BattleRegistration.find(filter)
            .sort({ createdAt: -1 })
            .populate('user', 'nombre apellidos email');

        // Estadísticas
        const stats = {
            total: registrations.length,
            confirmed: registrations.filter(r => r.status === 'confirmed').length,
            pending: registrations.filter(r => r.status === 'pending_payment').length,
            byCategory: {}
        };

        const categories = ['intermedio-male', 'intermedio-female', 'scaled-male', 'scaled-female'];
        for (const cat of categories) {
            stats.byCategory[cat] = registrations.filter(r => r.category === cat).length;
        }

        res.status(200).json({
            registrations,
            stats
        });

    } catch (error) {
        console.error("❌ Error al obtener todos los registros:", error);
        res.status(500).json({
            message: "Error al obtener registros",
            error: error.message
        });
    }
};

// === OBTENER UN REGISTRO POR ID ===
exports.getRegistrationById = async (req, res) => {
    try {
        const registration = await BattleRegistration.findById(req.params.id)
            .populate('user', 'nombre apellidos email');

        if (!registration) {
            return res.status(404).json({
                message: "Registro no encontrado"
            });
        }

        res.status(200).json({
            registration
        });

    } catch (error) {
        console.error("❌ Error al obtener registro:", error);
        res.status(500).json({
            message: "Error al obtener registro",
            error: error.message
        });
    }
};

// === CANCELAR REGISTRO ===
exports.cancelRegistration = async (req, res) => {
    try {
        const registrationId = req.params.id;
        const firebaseUid = req.user.uid;

        const registration = await BattleRegistration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({
                message: "Registro no encontrado"
            });
        }

        // Verificar que sea el dueño
        if (registration.firebaseUid !== firebaseUid) {
            return res.status(403).json({
                message: "No tienes permisos para cancelar este registro"
            });
        }

        // Solo se puede cancelar si está pendiente
        if (registration.status !== 'pending_payment') {
            return res.status(400).json({
                message: "Solo se pueden cancelar registros pendientes de pago"
            });
        }

        registration.status = 'cancelled';
        await registration.save();

        res.status(200).json({
            message: "Registro cancelado exitosamente"
        });

    } catch (error) {
        console.error("❌ Error al cancelar registro:", error);
        res.status(500).json({
            message: "Error al cancelar registro",
            error: error.message
        });
    }
};

// === OBTENER CUPOS DISPONIBLES POR CATEGORÍA ===
exports.getAvailableSlotsByCategory = async (req, res) => {
    try {
        const { category } = req.params;

        const CATEGORY_LIMITS = {
            'intermedio-male': 16,
            'intermedio-female': 16,
            'scaled-male': 16,
            'scaled-female': 16
        };

        const occupied = await BattleRegistration.countDocuments({
            category,
            status: { $in: ['pending_payment', 'confirmed'] }
        });

        const available = CATEGORY_LIMITS[category] - occupied;

        res.status(200).json({
            category,
            total: CATEGORY_LIMITS[category],
            occupied,
            available
        });

    } catch (error) {
        console.error("❌ Error al obtener cupos:", error);
        res.status(500).json({
            message: "Error al obtener cupos disponibles",
            error: error.message
        });
    }
};

// === OBTENER TODOS LOS CUPOS DISPONIBLES ===
exports.getAllAvailableSlots = async (req, res) => {
    try {
        const CATEGORY_LIMITS = {
            'intermedio-male': 16,
            'intermedio-female': 16,
            'scaled-male': 16,
            'scaled-female': 16
        };

        const slots = {};

        for (const [category, limit] of Object.entries(CATEGORY_LIMITS)) {
            const occupied = await BattleRegistration.countDocuments({
                category,
                status: { $in: ['pending_payment', 'confirmed'] }
            });

            slots[category] = {
                total: limit,
                occupied,
                available: limit - occupied
            };
        }

        res.status(200).json({ slots });

    } catch (error) {
        console.error("❌ Error al obtener cupos:", error);
        res.status(500).json({
            message: "Error al obtener cupos disponibles",
            error: error.message
        });
    }
};

// ========================================
// PARTE 2: MERCADOPAGO
// ========================================

// === CREAR PREFERENCIA DE PAGO ===
exports.createPaymentPreference = async (req, res) => {
    try {
        console.log("💳 Creando preferencia de pago para:", req.body);

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

        if (!amount || !payer || !payer.email) {
            console.log("❌ Datos incompletos:", { amount, payer });
            return res.status(400).json({
                message: "Datos incompletos para crear el pago"
            });
        }

        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN,
            options: { 
                timeout: 10000,
                idempotencyKey: 'battle-' + Date.now()
            }
        });

        const preference = new Preference(client);

        // 🔥 URLs CORREGIDAS - SIN METADATA
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const apiUrl = process.env.API_URL || 'http://localhost:5000';

        const preferenceData = {
            items: [
                {
                    id: registrationId.toString(),
                    title: title || `WOD MATCH BATTLE - ${registration.category.toUpperCase()}`,
                    description: description || `Inscripción: ${registration.firstName} ${registration.lastName}`,
                    quantity: 1,
                    currency_id: 'COP',
                    unit_price: parseFloat(amount)
                }
            ],
            payer: {
                name: payer.name || registration.firstName,
                surname: payer.surname || registration.lastName,
                email: payer.email || registration.email,
                phone: {
                    area_code: '57',
                    number: payer.phone ? payer.phone.replace(/\D/g, '').slice(-10) : registration.whatsapp.replace(/\D/g, '').slice(-10)
                }
            },
            external_reference: registrationId.toString(),
            back_urls: {
                success: `${frontendUrl}/battle/payment-success`,
                failure: `${frontendUrl}/battle/payment-failure`,
                pending: `${frontendUrl}/battle/payment-pending`
            },
            auto_return: 'approved',
            statement_descriptor: 'WODMATCH'
        };

        // Solo agregar notification_url si NO es localhost
        if (!apiUrl.includes('localhost')) {
            preferenceData.notification_url = `${apiUrl}/api/battle-registrations/webhook/mercadopago`;
        }

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

// === WEBHOOK DE MERCADOPAGO ===
exports.handleMercadoPagoWebhook = async (req, res) => {
    try {
        const { type, data } = req.body;

        console.log("🔔 Webhook MercadoPago recibido:", type, data);

        if (type === 'payment' && data && data.id) {
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

            if (status === 'approved') {
                newStatus = 'confirmed';
                paymentStatus = 'approved';
                registration.payment.paidAt = new Date();

                try {
                    await sendRegistrationConfirmationEmail(registration);
                    console.log("✅ Email de confirmación enviado a:", registration.email);
                } catch (emailError) {
                    console.error("❌ Error al enviar email de confirmación:", emailError);
                }

            } else if (status === 'rejected' || status === 'cancelled') {
                paymentStatus = 'rejected';

                try {
                    await sendPaymentRejectedEmail(registration);
                    console.log("✅ Email de rechazo enviado a:", registration.email);
                } catch (emailError) {
                    console.error("❌ Error al enviar email de rechazo:", emailError);
                }

            } else if (status === 'pending' || status === 'in_process') {
                paymentStatus = 'pending';

                try {
                    await sendPaymentPendingEmail(registration);
                    console.log("✅ Email de pendiente enviado a:", registration.email);
                } catch (emailError) {
                    console.error("❌ Error al enviar email de pendiente:", emailError);
                }
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

// === TEST MERCADOPAGO ===
exports.testMercadoPagoConnection = async (req, res) => {
    try {
        console.log("🧪 Probando conexión con MercadoPago...");
        
        if (!process.env.MP_ACCESS_TOKEN) {
            return res.status(500).json({
                success: false,
                message: "MP_ACCESS_TOKEN no configurado"
            });
        }

        console.log("🔑 Token MP encontrado");
        
        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN,
            options: { timeout: 10000 }
        });

        const preference = new Preference(client);
        
        const testData = {
            items: [
                {
                    title: "TEST WOD MATCH BATTLE",
                    quantity: 1,
                    currency_id: "COP",
                    unit_price: 10.00
                }
            ],
            back_urls: {
                success: "http://localhost:5173/test/success",
                failure: "http://localhost:5173/test/failure",
                pending: "http://localhost:5173/test/pending"
            },
            auto_return: "approved"
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

// === LIMPIAR REGISTROS DE TESTING ===
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