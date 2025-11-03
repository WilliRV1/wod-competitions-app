const Battle = require('../Models/battle.model.js');
const User = require('../Models/user.model.js');
const Box = require('../Models/box.model.js');

// --- CREAR UNA NUEVA BATALLA (CREATE) ---
exports.createBattle = async (req, res) => {
    try {
        console.log("📝 Datos recibidos para batalla:", req.body);
        console.log("👤 Usuario del token:", req.user.uid);

        const {
            nombre,
            fecha,
            lugar,
            descripcion,
            costo,
            categorias,
            wods,
            boxRepresentado,
            organizadorVerificado,
            estado,
            tipoTorneo,
            premio,
            reglas
        } = req.body;

        // Validar campos obligatorios
        if (!nombre || !fecha || !lugar) {
            return res.status(400).json({
                message: "Faltan campos obligatorios: nombre, fecha, lugar"
            });
        }

        // Obtener el usuario
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({
                message: "Perfil de usuario no encontrado"
            });
        }

        console.log("✅ Usuario encontrado:", user.nombre);

        // Crear batalla
        const newBattle = new Battle({
            nombre,
            fecha,
            lugar,
            descripcion: descripcion || '',
            costo: costo || 0,
            categorias: categorias || [],
            wods: wods || [],
            creador: user._id,
            boxRepresentado: boxRepresentado || null,
            organizadorVerificado: organizadorVerificado || false,
            estado: estado || 'inscripcion',
            tipoTorneo: tipoTorneo || 'eliminacion_simple',
            premio: premio || {},
            reglas: reglas || ''
        });

        await newBattle.save();

        console.log("🎉 Batalla creada:", newBattle._id);

        // Populate para devolver datos completos
        const populatedBattle = await Battle.findById(newBattle._id)
            .populate('creador', 'nombre apellidos nivel')
            .populate('boxRepresentado', 'nombre');

        res.status(201).json({
            message: "Batalla creada exitosamente",
            battle: populatedBattle
        });

    } catch (error) {
        console.error("❌ Error al crear batalla:", error);
        res.status(400).json({
            message: "Error al crear la batalla",
            error: error.message
        });
    }
};

// --- OBTENER TODAS LAS BATALLAS (READ ALL) ---
exports.getAllBattles = async (req, res) => {
    try {
        const battles = await Battle.find()
            .populate('creador', 'nombre apellidos nivel')
            .populate('boxRepresentado', 'nombre')
            .sort({ fecha: 1 }); // Ordenar por fecha

        res.status(200).json({ battles });
    } catch (error) {
        res.status(400).json({
            message: "Error al obtener batallas",
            error: error.message
        });
    }
};

// --- OBTENER UNA BATALLA POR ID (READ ONE) ---
exports.getBattleById = async (req, res) => {
    try {
        const battle = await Battle.findById(req.params.id)
            .populate('creador', 'nombre apellidos nivel')
            .populate('boxRepresentado', 'nombre direccion');

        if (!battle) {
            return res.status(404).json({
                message: "Batalla no encontrada"
            });
        }

        res.status(200).json({ battle });
    } catch (error) {
        res.status(400).json({
            message: "Error al obtener batalla",
            error: error.message
        });
    }
};

// --- ACTUALIZAR UNA BATALLA (UPDATE) ---
exports.updateBattle = async (req, res) => {
    try {
        const battleId = req.params.id;
        const datosParaActualizar = req.body;

        const battle = await Battle.findById(battleId);
        if (!battle) {
            return res.status(404).json({
                message: "Batalla no encontrada"
            });
        }

        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({
                message: "Perfil de usuario no encontrado"
            });
        }

        // Solo el creador puede editar
        if (battle.creador.toString() !== user._id.toString()) {
            return res.status(403).json({
                message: "No tienes permisos para editar esta batalla"
            });
        }

        // Proteger campo creador
        delete datosParaActualizar.creador;

        const updatedBattle = await Battle.findByIdAndUpdate(
            battleId,
            datosParaActualizar,
            { new: true }
        ).populate('creador', 'nombre apellidos nivel')
         .populate('boxRepresentado', 'nombre');

        res.status(200).json({
            message: "Batalla actualizada",
            battle: updatedBattle
        });

    } catch (error) {
        res.status(400).json({
            message: "Error al actualizar la batalla",
            error: error.message
        });
    }
};

// --- ELIMINAR UNA BATALLA (DELETE) ---
exports.deleteBattle = async (req, res) => {
    try {
        const battleId = req.params.id;

        const battle = await Battle.findById(battleId);
        if (!battle) {
            return res.status(404).json({
                message: "Batalla no encontrada"
            });
        }

        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({
                message: "Perfil de usuario no encontrado"
            });
        }

        // Solo el creador puede eliminar
        if (battle.creador.toString() !== user._id.toString()) {
            return res.status(403).json({
                message: "No tienes permisos para eliminar esta batalla"
            });
        }

        await Battle.findByIdAndDelete(battleId);

        res.status(200).json({
            message: "Batalla eliminada exitosamente"
        });

    } catch (error) {
        res.status(400).json({
            message: "Error al eliminar la batalla",
            error: error.message
        });
    }
};

// --- OBTENER BATALLAS POR CREADOR ---
exports.getBattlesByCreator = async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({
                message: "Perfil de usuario no encontrado"
            });
        }

        const battles = await Battle.find({ creador: user._id })
            .populate('creador', 'nombre apellidos nivel')
            .populate('boxRepresentado', 'nombre')
            .sort({ fecha: 1 });

        res.status(200).json({ battles });
    } catch (error) {
        res.status(400).json({
            message: "Error al obtener batallas del creador",
            error: error.message
        });
    }
};

// --- OBTENER BATALLAS POR BOX ---
exports.getBattlesByBox = async (req, res) => {
    try {
        const boxId = req.params.boxId;

        const battles = await Battle.find({ boxRepresentado: boxId })
            .populate('creador', 'nombre apellidos nivel')
            .populate('boxRepresentado', 'nombre direccion')
            .sort({ fecha: 1 });

        res.status(200).json({ battles });
    } catch (error) {
        res.status(400).json({
            message: "Error al obtener batallas del box",
            error: error.message
        });
    }
};

module.exports = exports;