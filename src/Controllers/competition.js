const Competition = require('../Models/competition.model.js');
const Box = require('../Models/box.model.js');
const User = require('../Models/user.model.js');

// --- OBTENER TODAS LAS COMPETENCIAS (READ ALL) ---
// Pública
exports.getAllCompetitions = async (req, res) => {
    try {
        const competitions = await Competition.find()
            .populate('organizador', 'nombre') // Trae el nombre del Box
            .populate('creador', 'nombre'); // Trae el nombre del Atleta creador
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
        // 1. Obtener datos del body
        const { nombre, fecha, lugar, descripcion, categorias, wods, costo, organizadorBoxId } = req.body;

        // 2. Obtener el usuario que hace la petición
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({ message: "Perfil de usuario no encontrado" });
        }
        
        const newCompetitionData = {
            nombre, fecha, lugar, descripcion, categorias, wods, costo
        };

        // 3. LÓGICA DE PROPIEDAD (¡NUEVO!)
        if (user.rol === 'dueño_box' && organizadorBoxId) {
            // Es un DUEÑO DE BOX creando una competencia OFICIAL
            const box = await Box.findById(organizadorBoxId);
            
            // Verificamos que el box exista y que el usuario sea el dueño
            if (box && box.owner.toString() === user._id.toString()) {
                newCompetitionData.organizador = organizadorBoxId; // Asigna el Box
            } else {
                return res.status(403).json({ message: "No eres el dueño de ese Box." });
            }
        } else if (user.rol === 'atleta') {
            // Es un ATLETA creando una competencia COMUNITARIA
            newCompetitionData.creador = user._id; // Asigna el User
        } else {
            return res.status(400).json({ message: "Datos de creador inválidos." });
        }

        // 4. Crear la competencia
        const newCompetition = new Competition(newCompetitionData);
        await newCompetition.save();
        res.status(201).json({ message: "Competencia creada exitosamente", competition: newCompetition });

    } catch (error) {
        res.status(400).json({ message: "Error al crear la competencia", error: error.message });
    }
};

// --- ACTUALIZAR UNA COMPETENCIA (UPDATE) ---
// Protegida
exports.updateCompetition = async (req, res) => {
    try {
        const competitionId = req.params.id;
        const datosParaActualizar = req.body;

        // 1. Verificar que la competencia exista
        const competition = await Competition.findById(competitionId);
        if (!competition) {
            return res.status(404).json({ message: "Competencia no encontrada" });
        }

        // 2. Obtener el usuario
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({ message: "Perfil de usuario no encontrado" });
        }

        // 3. LÓGICA DE PERMISOS (¡NUEVO!)
        let tienePermiso = false;
        
        // Es el creador (atleta)?
        if (competition.creador && competition.creador.toString() === user._id.toString()) {
            tienePermiso = true;
        }
        
        // Es el organizador (dueño_box)?
        if (competition.organizador) {
            const box = await Box.findById(competition.organizador);
            if (box && box.owner.toString() === user._id.toString()) {
                tienePermiso = true;
            }
        }

        if (!tienePermiso) {
            return res.status(403).json({ message: "No tienes permisos para editar esta competencia" });
        }

        // 4. Actualizar la competencia
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

        // 1. Verificar que la competencia exista
        const competition = await Competition.findById(competitionId);
        if (!competition) {
            return res.status(404).json({ message: "Competencia no encontrada" });
        }

        // 2. Obtener el usuario
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({ message: "Perfil de usuario no encontrado" });
        }

        // 3. LÓGICA DE PERMISOS 
        let tienePermiso = false;
        
        // Es el creador (atleta)?
        if (competition.creador && competition.creador.toString() === user._id.toString()) {
            tienePermiso = true;
        }
        
        // Es el organizador (dueño_box)?
        if (competition.organizador) {
            const box = await Box.findById(competition.organizador);
            if (box && box.owner.toString() === user._id.toString()) {
                tienePermiso = true;
            }
        }

        if (!tienePermiso) {
            return res.status(403).json({ message: "No tienes permisos para eliminar esta competencia" });
        }

        // 4. Eliminar la competencia
        await Competition.findByIdAndDelete(competitionId);
        res.status(200).json({ message: "Competencia eliminada exitosamente" });

    } catch (error) {
        res.status(400).json({ message: "Error al eliminar la competencia", error: error.message });
    }
};


exports.joinPartnerFinder = async (req, res) => {
     try {
        // 1. Obtener el ID de la competencia de los parámetros
        const competitionId = req.params.id;

        // 2. Obtener el Firebase UID del token (puesto por el middleware)
        const firebaseUid = req.user.uid;

        // 3. Encontrar al usuario en NUESTRA base de datos (MongoDB) para obtener su _id
        const user = await User.findOne({ firebaseUid: firebaseUid });
        if (!user) {
            return res.status(404).json({ message: "Perfil de usuario no encontrado" });
        }
        
        // 4. Añadir el _id del usuario al array 'buscando_parejas' de la competencia
        // Usamos $addToSet en lugar de $push para evitar duplicados
        const updatedCompetition = await Competition.findByIdAndUpdate(
            competitionId,
            { $addToSet: { buscando_parejas: user._id } }, // Añade al interesado a la lista de "buscando parejas"
            { new: true } // Devuelve el documento actualizado
        )
        // Opcional: Poblamos la lista para devolverla actualizada al frontend
        .populate('buscando_parejas', 'nombre nivel'); 

        if (!updatedCompetition) {
            return res.status(404).json({ message: "Competencia no encontrada" });
        }

        // 5. Devolver la competencia actualizada
        res.status(200).json({ 
            message: "¡Te has unido al Partner Finder!", 
            competition: updatedCompetition 
        });

    } catch (error) {
        res.status(400).json({ message: "Error al unirse al Partner Finder", error: error.message });
    }
};