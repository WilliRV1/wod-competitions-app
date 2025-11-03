const BattleRegistration = require('../Models/battleRegistration.model.js');
const Battle = require('../Models/battle.model.js');
const User = require('../Models/user.model.js');

// --- REGISTRAR USUARIO PARA UNA BATALLA ---
exports.registerForBattle = async (req, res) => {
    try {
        console.log("📝 Datos recibidos para registro:", req.body);
        console.log("👤 Usuario del token:", req.user.uid);

        const { battleId, categoria, peso, notas } = req.body;

        // Validar campos obligatorios
        if (!battleId || !categoria) {
            return res.status(400).json({
                message: "Faltan campos obligatorios: battleId, categoria"
            });
        }

        // Obtener el usuario
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({
                message: "Perfil de usuario no encontrado"
            });
        }

        // Verificar que la batalla existe y está en estado de inscripción
        const battle = await Battle.findById(battleId);
        if (!battle) {
            return res.status(404).json({
                message: "Batalla no encontrada"
            });
        }

        if (battle.estado !== 'inscripcion') {
            return res.status(400).json({
                message: "Las inscripciones para esta batalla no están abiertas"
            });
        }

        // Verificar que la categoría existe en la batalla
        const categoriaExists = battle.categorias.some(cat => cat.nombre === categoria);
        if (!categoriaExists) {
            return res.status(400).json({
                message: "La categoría especificada no existe en esta batalla"
            });
        }

        // Verificar límites de participantes por categoría
        const categoriaData = battle.categorias.find(cat => cat.nombre === categoria);
        if (categoriaData.limiteParticipantes) {
            const currentRegistrations = await BattleRegistration.countDocuments({
                battle: battleId,
                categoria,
                estado: { $in: ['pendiente', 'confirmado'] }
            });

            if (currentRegistrations >= categoriaData.limiteParticipantes) {
                return res.status(400).json({
                    message: "Se ha alcanzado el límite de participantes para esta categoría"
                });
            }
        }

        // Verificar que el usuario no esté ya registrado en esta batalla
        const existingRegistration = await BattleRegistration.findOne({
            battle: battleId,
            usuario: user._id
        });

        if (existingRegistration) {
            return res.status(400).json({
                message: "Ya estás registrado para esta batalla"
            });
        }

        // Crear registro
        const newRegistration = new BattleRegistration({
            battle: battleId,
            usuario: user._id,
            categoria,
            peso: peso || null,
            notas: notas || ''
        });

        await newRegistration.save();

        console.log("🎉 Registro creado:", newRegistration._id);

        // Populate para devolver datos completos
        const populatedRegistration = await BattleRegistration.findById(newRegistration._id)
            .populate('battle', 'nombre fecha lugar categorias')
            .populate('usuario', 'nombre apellidos email');

        res.status(201).json({
            message: "Registro creado exitosamente",
            registration: populatedRegistration
        });

    } catch (error) {
        console.error("❌ Error al registrar para batalla:", error);
        res.status(400).json({
            message: "Error al registrar para la batalla",
            error: error.message
        });
    }
};

// --- OBTENER TODOS LOS REGISTROS DE UNA BATALLA ---
exports.getRegistrationsByBattle = async (req, res) => {
    try {
        const battleId = req.params.battleId;

        const registrations = await BattleRegistration.find({ battle: battleId })
            .populate('battle', 'nombre fecha lugar categorias')
            .populate('usuario', 'nombre apellidos email peso')
            .sort({ fechaRegistro: -1 });

        res.status(200).json({ registrations });
    } catch (error) {
        res.status(400).json({
            message: "Error al obtener registros de la batalla",
            error: error.message
        });
    }
};

// --- OBTENER UN REGISTRO POR ID ---
exports.getRegistrationById = async (req, res) => {
    try {
        const registration = await BattleRegistration.findById(req.params.id)
            .populate('battle', 'nombre fecha lugar categorias')
            .populate('usuario', 'nombre apellidos email peso');

        if (!registration) {
            return res.status(404).json({
                message: "Registro no encontrado"
            });
        }

        res.status(200).json({ registration });
    } catch (error) {
        res.status(400).json({
            message: "Error al obtener registro",
            error: error.message
        });
    }
};

// --- ACTUALIZAR ESTADO DE UN REGISTRO ---
exports.updateRegistrationStatus = async (req, res) => {
    try {
        const registrationId = req.params.id;
        const { estado, notas } = req.body;

        // Validar estado
        const validStatuses = ['pendiente', 'confirmado', 'rechazado'];
        if (!validStatuses.includes(estado)) {
            return res.status(400).json({
                message: "Estado inválido. Debe ser: pendiente, confirmado o rechazado"
            });
        }

        const registration = await BattleRegistration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({
                message: "Registro no encontrado"
            });
        }

        // Verificar permisos (solo creador de la batalla)
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({
                message: "Perfil de usuario no encontrado"
            });
        }

        const battle = await Battle.findById(registration.battle);
        if (battle.creador.toString() !== user._id.toString()) {
            return res.status(403).json({
                message: "Solo el creador de la batalla puede actualizar el estado de registros"
            });
        }

        const updatedRegistration = await BattleRegistration.findByIdAndUpdate(
            registrationId,
            {
                estado,
                notas: notas || registration.notas
            },
            { new: true }
        ).populate('battle', 'nombre fecha lugar categorias')
         .populate('usuario', 'nombre apellidos email peso');

        res.status(200).json({
            message: "Estado del registro actualizado",
            registration: updatedRegistration
        });

    } catch (error) {
        res.status(400).json({
            message: "Error al actualizar estado del registro",
            error: error.message
        });
    }
};

// --- CANCELAR REGISTRO ---
exports.cancelRegistration = async (req, res) => {
    try {
        const registrationId = req.params.id;

        const registration = await BattleRegistration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({
                message: "Registro no encontrado"
            });
        }

        // Verificar que el usuario sea el propietario del registro
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({
                message: "Perfil de usuario no encontrado"
            });
        }

        if (registration.usuario.toString() !== user._id.toString()) {
            return res.status(403).json({
                message: "Solo puedes cancelar tus propios registros"
            });
        }

        // Verificar que la batalla aún esté en estado de inscripción
        const battle = await Battle.findById(registration.battle);
        if (battle.estado !== 'inscripcion') {
            return res.status(400).json({
                message: "No se puede cancelar el registro una vez que la batalla ha comenzado"
            });
        }

        await BattleRegistration.findByIdAndDelete(registrationId);

        res.status(200).json({
            message: "Registro cancelado exitosamente"
        });

    } catch (error) {
        res.status(400).json({
            message: "Error al cancelar registro",
            error: error.message
        });
    }
};

// --- OBTENER REGISTROS DEL USUARIO AUTENTICADO ---
exports.getUserRegistrations = async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({
                message: "Perfil de usuario no encontrado"
            });
        }

        const registrations = await BattleRegistration.find({ usuario: user._id })
            .populate('battle', 'nombre fecha lugar categorias estado')
            .populate('usuario', 'nombre apellidos email peso')
            .sort({ fechaRegistro: -1 });

        res.status(200).json({ registrations });
    } catch (error) {
        res.status(400).json({
            message: "Error al obtener registros del usuario",
            error: error.message
        });
    }
};

// --- OBTENER REGISTROS POR CATEGORÍA EN UNA BATALLA ---
exports.getRegistrationsByCategory = async (req, res) => {
    try {
        const { battleId, categoria } = req.params;

        const registrations = await BattleRegistration.find({
            battle: battleId,
            categoria
        })
        .populate('battle', 'nombre fecha lugar categorias')
        .populate('usuario', 'nombre apellidos email peso')
        .sort({ fechaRegistro: 1 });

        res.status(200).json({ registrations });
    } catch (error) {
        res.status(400).json({
            message: "Error al obtener registros por categoría",
            error: error.message
        });
    }
};

module.exports = exports;