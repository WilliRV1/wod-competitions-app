const Match = require('../Models/match.model.js');
const Battle = require('../Models/battle.model.js');
const User = require('../Models/user.model.js');

// --- CREAR UN NUEVO MATCH (CREATE) ---
exports.createMatch = async (req, res) => {
    try {
        console.log("📝 Datos recibidos para match:", req.body);
        console.log("👤 Usuario del token:", req.user.uid);

        const {
            battle,
            categoria,
            ronda,
            participante1,
            participante2,
            wod,
            fechaProgramada
        } = req.body;

        // Validar campos obligatorios
        if (!battle || !categoria || !ronda || !participante1 || !participante2) {
            return res.status(400).json({
                message: "Faltan campos obligatorios: battle, categoria, ronda, participante1, participante2"
            });
        }

        // Obtener el usuario
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({
                message: "Perfil de usuario no encontrado"
            });
        }

        // Verificar que la batalla existe y el usuario es el creador
        const battleDoc = await Battle.findById(battle);
        if (!battleDoc) {
            return res.status(404).json({
                message: "Batalla no encontrada"
            });
        }

        if (battleDoc.creador.toString() !== user._id.toString()) {
            return res.status(403).json({
                message: "Solo el creador de la batalla puede crear matches"
            });
        }

        // Crear match
        const newMatch = new Match({
            battle,
            categoria,
            ronda,
            participante1,
            participante2,
            wod: wod || {},
            fechaProgramada: fechaProgramada || null
        });

        await newMatch.save();

        console.log("🎉 Match creado:", newMatch._id);

        // Populate para devolver datos completos
        const populatedMatch = await Match.findById(newMatch._id)
            .populate('battle', 'nombre fecha lugar')
            .populate('participante1', 'nombre apellidos')
            .populate('participante2', 'nombre apellidos')
            .populate('resultado.ganador', 'nombre apellidos');

        res.status(201).json({
            message: "Match creado exitosamente",
            match: populatedMatch
        });

    } catch (error) {
        console.error("❌ Error al crear match:", error);
        res.status(400).json({
            message: "Error al crear el match",
            error: error.message
        });
    }
};

// --- OBTENER TODOS LOS MATCHES DE UNA BATALLA ---
exports.getMatchesByBattle = async (req, res) => {
    try {
        const battleId = req.params.battleId;

        const matches = await Match.find({ battle: battleId })
            .populate('battle', 'nombre fecha lugar')
            .populate('participante1', 'nombre apellidos')
            .populate('participante2', 'nombre apellidos')
            .populate('resultado.ganador', 'nombre apellidos')
            .sort({ ronda: 1, fechaProgramada: 1 });

        res.status(200).json({ matches });
    } catch (error) {
        res.status(400).json({
            message: "Error al obtener matches de la batalla",
            error: error.message
        });
    }
};

// --- OBTENER UN MATCH POR ID ---
exports.getMatchById = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id)
            .populate('battle', 'nombre fecha lugar')
            .populate('participante1', 'nombre apellidos')
            .populate('participante2', 'nombre apellidos')
            .populate('resultado.ganador', 'nombre apellidos');

        if (!match) {
            return res.status(404).json({
                message: "Match no encontrado"
            });
        }

        res.status(200).json({ match });
    } catch (error) {
        res.status(400).json({
            message: "Error al obtener match",
            error: error.message
        });
    }
};

// --- ACTUALIZAR RESULTADO DE UN MATCH ---
exports.updateMatchResult = async (req, res) => {
    try {
        const matchId = req.params.id;
        const {
            tiempoParticipante1,
            tiempoParticipante2,
            repsParticipante1,
            repsParticipante2,
            notas
        } = req.body;

        const match = await Match.findById(matchId);
        if (!match) {
            return res.status(404).json({
                message: "Match no encontrado"
            });
        }

        // Verificar permisos (solo creador de la batalla)
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({
                message: "Perfil de usuario no encontrado"
            });
        }

        const battle = await Battle.findById(match.battle);
        if (battle.creador.toString() !== user._id.toString()) {
            return res.status(403).json({
                message: "Solo el creador de la batalla puede actualizar resultados"
            });
        }

        // Lógica para determinar ganador
        let ganador = null;
        if (match.wod.tiempoLimite) {
            // Para WODs con tiempo límite, menor tiempo gana
            if (tiempoParticipante1 && tiempoParticipante2) {
                if (tiempoParticipante1 < tiempoParticipante2) {
                    ganador = match.participante1;
                } else if (tiempoParticipante2 < tiempoParticipante1) {
                    ganador = match.participante2;
                }
            }
        } else {
            // Para WODs sin tiempo límite, más reps gana
            if (repsParticipante1 && repsParticipante2) {
                if (repsParticipante1 > repsParticipante2) {
                    ganador = match.participante1;
                } else if (repsParticipante2 > repsParticipante1) {
                    ganador = match.participante2;
                }
            }
        }

        const updatedMatch = await Match.findByIdAndUpdate(
            matchId,
            {
                resultado: {
                    ganador,
                    tiempoParticipante1: tiempoParticipante1 || null,
                    tiempoParticipante2: tiempoParticipante2 || null,
                    repsParticipante1: repsParticipante1 || null,
                    repsParticipante2: repsParticipante2 || null,
                    notas: notas || ''
                }
            },
            { new: true }
        ).populate('battle', 'nombre fecha lugar')
         .populate('participante1', 'nombre apellidos')
         .populate('participante2', 'nombre apellidos')
         .populate('resultado.ganador', 'nombre apellidos');

        res.status(200).json({
            message: "Resultado del match actualizado",
            match: updatedMatch
        });

    } catch (error) {
        res.status(400).json({
            message: "Error al actualizar resultado del match",
            error: error.message
        });
    }
};

// --- OBTENER MATCHES POR PARTICIPANTE ---
exports.getMatchesByParticipant = async (req, res) => {
    try {
        const participantId = req.params.participantId;

        const matches = await Match.find({
            $or: [
                { participante1: participantId },
                { participante2: participantId }
            ]
        })
        .populate('battle', 'nombre fecha lugar')
        .populate('participante1', 'nombre apellidos')
        .populate('participante2', 'nombre apellidos')
        .populate('resultado.ganador', 'nombre apellidos')
        .sort({ fechaProgramada: -1 });

        res.status(200).json({ matches });
    } catch (error) {
        res.status(400).json({
            message: "Error al obtener matches del participante",
            error: error.message
        });
    }
};

// --- OBTENER MATCHES POR RONDA EN UNA BATALLA ---
exports.getMatchesByRound = async (req, res) => {
    try {
        const { battleId, round } = req.params;

        const matches = await Match.find({
            battle: battleId,
            ronda: parseInt(round)
        })
        .populate('battle', 'nombre fecha lugar')
        .populate('participante1', 'nombre apellidos')
        .populate('participante2', 'nombre apellidos')
        .populate('resultado.ganador', 'nombre apellidos')
        .sort({ fechaProgramada: 1 });

        res.status(200).json({ matches });
    } catch (error) {
        res.status(400).json({
            message: "Error al obtener matches de la ronda",
            error: error.message
        });
    }
};

// --- INICIAR UN MATCH ---
exports.startMatch = async (req, res) => {
    try {
        const matchId = req.params.id;

        const match = await Match.findById(matchId);
        if (!match) {
            return res.status(404).json({
                message: "Match no encontrado"
            });
        }

        // Verificar permisos
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({
                message: "Perfil de usuario no encontrado"
            });
        }

        const battle = await Battle.findById(match.battle);
        if (battle.creador.toString() !== user._id.toString()) {
            return res.status(403).json({
                message: "Solo el creador de la batalla puede iniciar matches"
            });
        }

        if (match.estado !== 'pendiente') {
            return res.status(400).json({
                message: "El match ya ha sido iniciado o completado"
            });
        }

        const updatedMatch = await Match.findByIdAndUpdate(
            matchId,
            { estado: 'en_curso' },
            { new: true }
        ).populate('battle', 'nombre fecha lugar')
         .populate('participante1', 'nombre apellidos')
         .populate('participante2', 'nombre apellidos')
         .populate('resultado.ganador', 'nombre apellidos');

        res.status(200).json({
            message: "Match iniciado",
            match: updatedMatch
        });

    } catch (error) {
        res.status(400).json({
            message: "Error al iniciar match",
            error: error.message
        });
    }
};

// --- COMPLETAR UN MATCH ---
exports.completeMatch = async (req, res) => {
    try {
        const matchId = req.params.id;

        const match = await Match.findById(matchId);
        if (!match) {
            return res.status(404).json({
                message: "Match no encontrado"
            });
        }

        // Verificar permisos
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({
                message: "Perfil de usuario no encontrado"
            });
        }

        const battle = await Battle.findById(match.battle);
        if (battle.creador.toString() !== user._id.toString()) {
            return res.status(403).json({
                message: "Solo el creador de la batalla puede completar matches"
            });
        }

        if (match.estado !== 'en_curso') {
            return res.status(400).json({
                message: "El match debe estar en curso para completarlo"
            });
        }

        const updatedMatch = await Match.findByIdAndUpdate(
            matchId,
            {
                estado: 'completado',
                fechaCompletada: new Date()
            },
            { new: true }
        ).populate('battle', 'nombre fecha lugar')
         .populate('participante1', 'nombre apellidos')
         .populate('participante2', 'nombre apellidos')
         .populate('resultado.ganador', 'nombre apellidos');

        res.status(200).json({
            message: "Match completado",
            match: updatedMatch
        });

    } catch (error) {
        res.status(400).json({
            message: "Error al completar match",
            error: error.message
        });
    }
};

module.exports = exports;