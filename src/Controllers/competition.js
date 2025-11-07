const Competition = require('../Models/competition.model.js');
const User = require('../Models/user.model.js');

// --- OBTENER TODAS LAS COMPETENCIAS (READ ALL) ---
exports.getAllCompetitions = async (req, res) => {
    try {
        const competitions = await Competition.find()
            .populate('creador', 'nombre apellidos nivel')
            .sort({ fecha: 1 }); // Ordenar por fecha
        
        res.status(200).json({ competitions });
    } catch (error) {
        res.status(400).json({ 
            message: "Error al obtener competencias", 
            error: error.message 
        });
    }
};

// --- OBTENER UNA COMPETENCIA POR ID (READ ONE) ---
exports.getCompetitionById = async (req, res) => {
    try {
        const competition = await Competition.findById(req.params.id)
            .populate('creador', 'nombre apellidos nivel boxAfiliado')
            .populate('atletas_inscritos', 'nombre apellidos nivel')
            .populate('buscando_parejas', 'nombre apellidos nivel');
            
        if (!competition) {
            return res.status(404).json({ 
                message: "Competencia no encontrada" 
            });
        }
        
        res.status(200).json({ competition });
    } catch (error) {
        res.status(400).json({ 
            message: "Error al obtener competencia", 
            error: error.message 
        });
    }
};

// --- CREAR UNA NUEVA COMPETENCIA (CREATE) ---
// 🎯 SIMPLIFICADO: Cualquier usuario autenticado puede crear
exports.createCompetition = async (req, res) => {
    try {
        console.log("📝 Datos recibidos:", req.body);
        console.log("👤 Usuario del token:", req.user.uid);

        const { 
            nombre, 
            fecha, 
            lugar, 
            descripcion, 
            categorias, 
            wods, 
            costo,
            boxRepresentado // Opcional: texto libre
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

        // Crear competencia (todos son iguales)
        const newCompetition = new Competition({
            nombre,
            fecha,
            lugar,
            descripcion: descripcion || '',
            categorias: categorias || [],
            wods: wods || [],
            costo: costo || '',
            creador: user._id, // Siempre el usuario actual
            boxRepresentado: boxRepresentado || null
        });

        await newCompetition.save();
        
        console.log("🎉 Competencia creada:", newCompetition._id);
        
        // Populate para devolver datos completos
        const populatedCompetition = await Competition.findById(newCompetition._id)
            .populate('creador', 'nombre apellidos nivel');
        
        res.status(201).json({ 
            message: "Competencia creada exitosamente", 
            competition: populatedCompetition
        });

    } catch (error) {
        console.error("❌ Error al crear competencia:", error);
        res.status(400).json({ 
            message: "Error al crear la competencia", 
            error: error.message 
        });
    }
};

// --- ACTUALIZAR UNA COMPETENCIA (UPDATE) ---
exports.updateCompetition = async (req, res) => {
    try {
        const competitionId = req.params.id;
        const datosParaActualizar = req.body;

        const competition = await Competition.findById(competitionId);
        if (!competition) {
            return res.status(404).json({ 
                message: "Competencia no encontrada" 
            });
        }

        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({ 
                message: "Perfil de usuario no encontrado" 
            });
        }

        // 🎯 SIMPLIFICADO: Solo el creador puede editar
        if (competition.creador.toString() !== user._id.toString()) {
            return res.status(403).json({ 
                message: "No tienes permisos para editar esta competencia" 
            });
        }

        // Proteger campo creador
        delete datosParaActualizar.creador;

        const updatedCompetition = await Competition.findByIdAndUpdate(
            competitionId, 
            datosParaActualizar, 
            { new: true }
        ).populate('creador', 'nombre apellidos nivel');

        res.status(200).json({ 
            message: "Competencia actualizada", 
            competition: updatedCompetition 
        });

    } catch (error) {
        res.status(400).json({ 
            message: "Error al actualizar la competencia", 
            error: error.message 
        });
    }
};

// --- ELIMINAR UNA COMPETENCIA (DELETE) ---
exports.deleteCompetition = async (req, res) => {
    try {
        const competitionId = req.params.id;

        const competition = await Competition.findById(competitionId);
        if (!competition) {
            return res.status(404).json({ 
                message: "Competencia no encontrada" 
            });
        }

        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({ 
                message: "Perfil de usuario no encontrado" 
            });
        }

        // Solo el creador puede eliminar
        if (competition.creador.toString() !== user._id.toString()) {
            return res.status(403).json({ 
                message: "No tienes permisos para eliminar esta competencia" 
            });
        }

        await Competition.findByIdAndDelete(competitionId);
        
        res.status(200).json({ 
            message: "Competencia eliminada exitosamente" 
        });

    } catch (error) {
        res.status(400).json({ 
            message: "Error al eliminar la competencia", 
            error: error.message 
        });
    }
};

// --- UNIRSE AL PARTNER FINDER ---
exports.joinPartnerFinder = async (req, res) => {
     try {
        const competitionId = req.params.id;
        const firebaseUid = req.user.uid;

        const user = await User.findOne({ firebaseUid });
        if (!user) {
            return res.status(404).json({ 
                message: "Perfil de usuario no encontrado" 
            });
        }
        
        const updatedCompetition = await Competition.findByIdAndUpdate(
            competitionId,
            { $addToSet: { buscando_parejas: user._id } },
            { new: true }
        )
        .populate('buscando_parejas', 'nombre apellidos nivel'); 

        if (!updatedCompetition) {
            return res.status(404).json({ 
                message: "Competencia no encontrada" 
            });
        }

        res.status(200).json({ 
            message: "¡Te has unido al Partner Finder!", 
            competition: updatedCompetition 
        });

    } catch (error) {
        res.status(400).json({ 
            message: "Error al unirse al Partner Finder", 
            error: error.message 
        });
    }
};