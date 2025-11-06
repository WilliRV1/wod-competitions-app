// Controllers/battleRegistration.controller.js
const BattleRegistration = require('../Models/battleRegistration.model.js');
const User = require('../Models/user.model.js');

// === CREAR REGISTRO (Paso 1: Guardar datos, Pago Pendiente) ===
exports.createRegistration = async (req, res) => {
    try {
        console.log("📝 Datos recibidos para registro Battle:", req.body);

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
        if (!firstName || !lastName || !birthDate || !email || !whatsapp || !category) {
            return res.status(400).json({
                message: "Faltan campos obligatorios"
            });
        }

        if (!waiverAccepted) {
            return res.status(400).json({
                message: "Debes aceptar el waiver de responsabilidad"
            });
        }

        // Validar edad (mayor de 18)
        const birth = new Date(birthDate);
        const today = new Date();
        const age = today.getFullYear() - birth.getFullYear();
        if (age < 18) {
            return res.status(400).json({
                message: "Debes ser mayor de 18 años para registrarte"
            });
        }

        // Verificar si ya existe registro con este email
        const existingRegistration = await BattleRegistration.findOne({
            email: email.toLowerCase(),
            status: { $ne: 'cancelled' }
        });

        if (existingRegistration) {
            return res.status(400).json({
                message: "Ya existe un registro con este email"
            });
        }

        // Obtener usuario si está autenticado
        let user = null;
        let firebaseUid = null;
        if (req.user) {
            user = await User.findOne({ firebaseUid: req.user.uid });
            firebaseUid = req.user.uid;
        }

        // Generar código único
        const registrationCode = BattleRegistration.generateRegistrationCode();

        // Crear registro
        const newRegistration = new BattleRegistration({
            firstName,
            lastName,
            birthDate,
            email: email.toLowerCase(),
            whatsapp,
            category,
            emergencyContact: {
                name: emergencyName,
                phone: emergencyPhone,
                relation: emergencyRelation || ''
            },
            medical: {
                conditions: medicalConditions || '',
                medications: medications || ''
            },
            waivers: {
                liabilityAccepted: waiverAccepted,
                imageAuthorized: imageAuthorized || false
            },
            payment: {
                amount: amount || 90000,
                method: 'pending',
                status: 'pending'
            },
            user: user ? user._id : null,
            firebaseUid: firebaseUid,
            status: 'pending_payment',
            registrationCode
        });

        await newRegistration.save();

        console.log("🎉 Registro Battle creado:", newRegistration._id);

        res.status(201).json({
            message: "Registro creado exitosamente. Procede al pago.",
            registration: {
                id: newRegistration._id,
                code: newRegistration.registrationCode,
                amount: newRegistration.payment.amount,
                category: newRegistration.category,
                fullName: newRegistration.fullName
            }
        });

    } catch (error) {
        console.error("❌ Error al crear registro Battle:", error);
        res.status(500).json({
            message: "Error al crear el registro",
            error: error.message
        });
    }
};

// === ACTUALIZAR ESTADO DE PAGO (Webhook MercadoPago) ===
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { registrationId, paymentData } = req.body;

        const registration = await BattleRegistration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({
                message: "Registro no encontrado"
            });
        }

        // Actualizar pago
        registration.payment.status = paymentData.status;
        registration.payment.method = 'mercadopago';
        registration.payment.transactionId = paymentData.id;
        registration.payment.mercadoPagoData = paymentData;
        
        if (paymentData.status === 'approved') {
            registration.payment.paidAt = new Date();
            registration.status = 'confirmed';
        }

        await registration.save();

        console.log("💳 Pago actualizado:", registrationId, paymentData.status);

        res.status(200).json({
            message: "Estado de pago actualizado",
            registration
        });

    } catch (error) {
        console.error("❌ Error al actualizar pago:", error);
        res.status(500).json({
            message: "Error al actualizar el pago",
            error: error.message
        });
    }
};

// === OBTENER TODOS LOS REGISTROS (Admin) ===
exports.getAllRegistrations = async (req, res) => {
    try {
        const { category, status, paymentStatus } = req.query;

        let filter = {};
        if (category) filter.category = category;
        if (status) filter.status = status;
        if (paymentStatus) filter['payment.status'] = paymentStatus;

        const registrations = await BattleRegistration.find(filter)
            .populate('user', 'nombre apellidos email')
            .sort({ createdAt: -1 });

        // Estadísticas rápidas
        const stats = {
            total: registrations.length,
            confirmed: registrations.filter(r => r.status === 'confirmed').length,
            pending: registrations.filter(r => r.status === 'pending_payment').length,
            byCategory: {
                'intermedio-male': registrations.filter(r => r.category === 'intermedio-male').length,
                'intermedio-female': registrations.filter(r => r.category === 'intermedio-female').length,
                'scaled-male': registrations.filter(r => r.category === 'scaled-male').length,
                'scaled-female': registrations.filter(r => r.category === 'scaled-female').length,
            }
        };

        res.status(200).json({
            registrations,
            stats
        });

    } catch (error) {
        console.error("❌ Error al obtener registros:", error);
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

        res.status(200).json({ registration });

    } catch (error) {
        console.error("❌ Error al obtener registro:", error);
        res.status(500).json({
            message: "Error al obtener registro",
            error: error.message
        });
    }
};

// === OBTENER MIS REGISTROS (Usuario autenticado) ===
exports.getMyRegistrations = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Usuario no autenticado"
            });
        }

        const registrations = await BattleRegistration.find({
            firebaseUid: req.user.uid
        }).sort({ createdAt: -1 });

        res.status(200).json({ registrations });

    } catch (error) {
        console.error("❌ Error al obtener mis registros:", error);
        res.status(500).json({
            message: "Error al obtener tus registros",
            error: error.message
        });
    }
};

// === CANCELAR REGISTRO ===
exports.cancelRegistration = async (req, res) => {
    try {
        const registration = await BattleRegistration.findById(req.params.id);

        if (!registration) {
            return res.status(404).json({
                message: "Registro no encontrado"
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

module.exports = exports;