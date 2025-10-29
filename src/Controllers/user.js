const User = require("../Models/user.model.js");

// --- OBTENER PERFIL DEL USUARIO ACTUAL (TOKEN) ---
exports.getMyProfile = async (req, res) => {
    try {
        // req.user.uid viene del middleware de autenticación
        const firebaseUid = req.user.uid;
        
        console.log("🔍 Buscando perfil para Firebase UID:", firebaseUid);

        const user = await User.findOne({ firebaseUid })
            .select('-firebaseUid'); // No exponer el UID en la respuesta

        if (!user) {
            console.warn("⚠️ Perfil no encontrado para UID:", firebaseUid);
            return res.status(404).json({ 
                message: "Perfil de usuario no encontrado. Por favor completa tu registro." 
            });
        }

        console.log("✅ Perfil encontrado:", user.nombre);

        res.status(200).json({
            message: "Perfil obtenido exitosamente",
            user: user
        });

    } catch (error) {
        console.error("❌ Error al obtener perfil:", error);
        res.status(500).json({ 
            message: "Error interno al obtener el perfil", 
            error: error.message 
        });
    }
};

// --- OBTENER TODOS LOS USUARIOS (READ) ---
exports.getUser = async (req, res) => {
    try {
        const allUsers = await User.find({})
            .select('-firebaseUid');
        
        res.status(200).json({
            message: "Todos los usuarios",
            users: allUsers
        });
    } catch(error) {
        res.status(400).json({ 
            message: "Error al buscar usuarios", 
            error: error.message 
        });
    }
};

// --- CREAR PERFIL DE USUARIO (CREATE) ---
exports.newUser = async (req, res) => {
    try {
        const { 
            nombre, 
            apellidos, 
            email, 
            firebaseUid, 
            nivel,
            boxAfiliado 
        } = req.body;

        if (!firebaseUid || !email || !nombre || !apellidos) {
            return res.status(400).json({ 
                message: "Faltan datos requeridos (firebaseUid, email, nombre, apellidos)." 
            });
        }

        const nuevoUsuario = new User({
            firebaseUid,
            nombre,
            apellidos,
            email,
            nivel: nivel || 'Novato',
            boxAfiliado: boxAfiliado || null
        });

        await nuevoUsuario.save();

        res.status(201).json({
            message: "¡Perfil de usuario creado exitosamente!",
            userId: nuevoUsuario._id,
            user: {
                nombre: nuevoUsuario.nombre,
                apellidos: nuevoUsuario.apellidos,
                email: nuevoUsuario.email,
                nivel: nuevoUsuario.nivel
            }
        });

    } catch (error) {
        if (error.code === 11000) {
             return res.status(400).json({ 
                 message: "El email o firebaseUid ya existe.", 
                 field: error.keyValue 
             });
        }
        res.status(400).json({ 
            message: "Error al crear el perfil", 
            error: error.message 
        });
    }
};

// --- OBTENER UN USUARIO POR ID (READ) ---
exports.getUserID = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(id)
            .select('-firebaseUid');

        if (!user) {
            return res.status(404).json({ 
                message: "Usuario no encontrado" 
            });
        }

        res.status(200).json({
            message: "Usuario encontrado",
            user: user
        });

    } catch(error) {
        if (error.kind === 'ObjectId') {
             return res.status(400).json({ 
                 message: "ID de usuario inválido" 
             });
        }
        res.status(400).json({ 
            message: "Error al buscar usuario", 
            error: error.message 
        });
    }
};

// --- ACTUALIZAR UN USUARIO (UPDATE) ---
exports.putUser = async (req, res) => {
    try {
        const userIdToUpdate = req.params.id;
        const firebaseUidFromToken = req.user.uid;
        const datosParaActualizar = req.body;

        const userToUpdate = await User.findById(userIdToUpdate);

        if (!userToUpdate) {
            return res.status(404).json({ 
                message: "Usuario no encontrado" 
            });
        }

        if (userToUpdate.firebaseUid !== firebaseUidFromToken) {
            return res.status(403).json({ 
                message: "No tienes permiso para actualizar este perfil." 
            });
        }

        delete datosParaActualizar.firebaseUid;
        delete datosParaActualizar.email;
        delete datosParaActualizar.esBoxVerificado;
        delete datosParaActualizar.boxPropietario;

        const userActualizado = await User.findByIdAndUpdate(
            userIdToUpdate, 
            datosParaActualizar, 
            { new: true }
        ).select('-firebaseUid');

        res.status(200).json({
            message: "Usuario actualizado",
            user: userActualizado
        });

    } catch(error) {
        if (error.kind === 'ObjectId') {
             return res.status(400).json({ 
                 message: "ID de usuario inválido" 
             });
        }
        res.status(400).json({ 
            message: "Error al actualizar usuario", 
            error: error.message 
        });
    }
};

// --- BORRAR UN USUARIO (DELETE) ---
exports.deleteUser = async (req, res) => {
    try {
        const userIdToDelete = req.params.id;
        const firebaseUidFromToken = req.user.uid;

        const userToDelete = await User.findById(userIdToDelete);

        if (!userToDelete) {
            return res.status(404).json({ 
                message: "Usuario no encontrado" 
            });
        }

        if (userToDelete.firebaseUid !== firebaseUidFromToken) {
            return res.status(403).json({ 
                message: "No tienes permiso para eliminar este perfil." 
            });
        }

        const userBorrado = await User.findByIdAndDelete(userIdToDelete);

        res.status(200).json({
            message: "Usuario eliminado exitosamente",
            user: {
                nombre: userBorrado.nombre,
                email: userBorrado.email
            }
        });

    } catch(error) {
        if (error.kind === 'ObjectId') {
             return res.status(400).json({ 
                 message: "ID de usuario inválido" 
             });
        }
        res.status(400).json({ 
            message: "Error al eliminar usuario", 
            error: error.message 
        });
    }
};