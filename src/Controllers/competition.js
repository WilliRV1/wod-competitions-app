const Competition = require('../Models/competition.model.js');
const Box = require('../Models/box.model.js');
const User = require('../Models/user.model.js');

// --- OBTENER TODAS LAS COMPETENCIAS (READ ALL) ---
// Pública
exports.getAllCompetitions = async (req, res) => {
    try {
        const competitions = await Competition.find()
            .populate('organizador', 'nombre')
            .populate('creador', 'nombre');
        res.status(200).json({ competitions });
    } catch (error) {
        res.status(400).json({ message: "Error al obtener competencias", error: error.message });
    }
};

// --- OBTENER UNA COMPETENCIA POR ID (READ ONE) ---
// Pública
exports.getCompetitionById = async (req, res) => {
    try {
        const competition = await Competition.findById(req.params.id)
            .populate('organizador', 'nombre direccion')
            .populate('creador', 'nombre nivel')
            .populate('atletas_inscritos', 'nombre nivel')
            .populate('buscando_parejas', 'nombre nivel');
            
        if (!competition) {
            return res.status(404).json({ message: "Competencia no encontrada" });
        }
        res.status(200).json({ competition });
    } catch (error) {
        res.status(400).json({ message: "Error al obtener competencia", error: error.message });
    }
};

// --- CREAR UNA NUEVA COMPETENCIA (CREATE) ---
// Protegida (Cualquier usuario logueado puede crear)
exports.createCompetition = async (req, res) => {
    try {
        console.log("📝 Datos recibidos en el backend:", req.body);
        console.log("👤 Usuario del token:", req.user.uid);

        // 1. Obtener datos del body
        const { nombre, fecha, lugar, descripcion, categorias, wods, costo, organizadorBoxId } = req.body;

        // 2. Validar campos obligatorios
        if (!nombre || !fecha || !lugar) {
            return res.status(400).json({ message: "Faltan campos obligatorios: nombre, fecha, lugar" });
        }

        // 3. Obtener el usuario que hace la petición
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({ message: "Perfil de usuario no encontrado" });
        }
        
        console.log("✅ Usuario encontrado:", user.nombre, "- Rol:", user.rol);

        const newCompetitionData = {
            nombre, 
            fecha, 
            lugar, 
            descripcion: descripcion || '', 
            categorias: categorias || [], 
            wods: wods || [], 
            costo: costo || ''
        };

        // 4. LÓGICA DE PROPIEDAD
        if (user.rol === 'dueño_box' && organizadorBoxId) {
            // Es un DUEÑO DE BOX creando una competencia OFICIAL
            const box = await Box.findById(organizadorBoxId);
            
            if (!box) {
                return res.status(404).json({ message: "Box no encontrado." });
            }

            if (box.owner.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "No eres el dueño de ese Box." });
            }

            newCompetitionData.organizador = organizadorBoxId;
            console.log("🏢 Competencia OFICIAL creada por Box:", box.nombre);

        } else if (user.rol === 'atleta' || (user.rol === 'dueño_box' && !organizadorBoxId)) {
            // Es un ATLETA o un DUEÑO creando competencia COMUNITARIA
            newCompetitionData.creador = user._id;
            console.log("👥 Competencia COMUNITARIA creada por:", user.nombre);
        } else {
            return res.status(400).json({ message: "Datos de creador inválidos." });
        }

        // 5. Crear la competencia
        const newCompetition = new Competition(newCompetitionData);
        await newCompetition.save();
        
        console.log("🎉 Competencia creada exitosamente:", newCompetition._id);
        
        res.status(201).json({ 
            message: "Competencia creada exitosamente", 
            competition: newCompetition 
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
// Protegida
exports.updateCompetition = async (req, res) => {
    try {
        const competitionId = req.params.id;
        const datosParaActualizar = req.body;

        const competition = await Competition.findById(competitionId);
        if (!competition) {
            return res.status(404).json({ message: "Competencia no encontrada" });
        }

        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({ message: "Perfil de usuario no encontrado" });
        }

        let tienePermiso = false;
        
        if (competition.creador && competition.creador.toString() === user._id.toString()) {
            tienePermiso = true;
        }
        
        if (competition.organizador) {
            const box = await Box.findById(competition.organizador);
            if (box && box.owner.toString() === user._id.toString()) {
                tienePermiso = true;
            }
        }

        if (!tienePermiso) {
            return res.status(403).json({ message: "No tienes permisos para editar esta competencia" });
        }

        const updatedCompetition = await Competition.findByIdAndUpdate(competitionId, datosParaActualizar, { new: true });
        res.status(200).json({ message: "Competencia actualizada", competition: updatedCompetition });

    } catch (error) {
        res.status(400).json({ message: "Error al actualizar la competencia", error: error.message });
    }
};

// --- ELIMINAR UNA COMPETENCIA (DELETE) ---
// Protegida
exports.deleteCompetition = async (req, res) => {
    try {
        const competitionId = req.params.id;

        const competition = await Competition.findById(competitionId);
        if (!competition) {
            return res.status(404).json({ message: "Competencia no encontrada" });
        }

        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({ message: "Perfil de usuario no encontrado" });
        }

        let tienePermiso = false;
        
        if (competition.creador && competition.creador.toString() === user._id.toString()) {
            tienePermiso = true;
        }
        
        if (competition.organizador) {
            const box = await Box.findById(competition.organizador);
            if (box && box.owner.toString() === user._id.toString()) {
                tienePermiso = true;
            }
        }

        if (!tienePermiso) {
            return res.status(403).json({ message: "No tienes permisos para eliminar esta competencia" });
        }

        await Competition.findByIdAndDelete(competitionId);
        res.status(200).json({ message: "Competencia eliminada exitosamente" });

    } catch (error) {
        res.status(400).json({ message: "Error al eliminar la competencia", error: error.message });
    }
};

exports.joinPartnerFinder = async (req, res) => {
     try {
        const competitionId = req.params.id;
        const firebaseUid = req.user.uid;

        const user = await User.findOne({ firebaseUid: firebaseUid });
        if (!user) {
            return res.status(404).json({ message: "Perfil de usuario no encontrado" });
        }
        
        const updatedCompetition = await Competition.findByIdAndUpdate(
            competitionId,
            { $addToSet: { buscando_parejas: user._id } },
            { new: true }
        )
        .populate('buscando_parejas', 'nombre nivel'); 

        if (!updatedCompetition) {
            return res.status(404).json({ message: "Competencia no encontrada" });
        }

        res.status(200).json({ 
            message: "¡Te has unido al Partner Finder!", 
            competition: updatedCompetition 
        });

    } catch (error) {
        res.status(400).json({ message: "Error al unirse al Partner Finder", error: error.message });
    }
};