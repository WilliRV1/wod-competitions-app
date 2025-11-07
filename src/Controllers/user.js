const User = require("../Models/user.model.js");

// ===== REGISTRO RÁPIDO (Solo 3 campos) =====
exports.quickRegister = async (req, res) => {
    try {
        const { firebaseUid, email, nombre } = req.body;

        // Validar campos obligatorios mínimos
        if (!firebaseUid || !email || !nombre) {
            return res.status(400).json({ 
                message: "Faltan datos requeridos (firebaseUid, email, nombre)." 
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ 
            $or: [{ firebaseUid }, { email }] 
        });

        if (existingUser) {
            return res.status(400).json({ 
                message: "El usuario ya está registrado." 
            });
        }

        // Crear usuario con datos mínimos
        const newUser = new User({
            firebaseUid,
            email,
            nombre,
            profileCompleted: false,
            onboardingStep: 0
        });

        await newUser.save();

        res.status(201).json({
            message: "¡Registro exitoso! Completa tu perfil cuando quieras.",
            user: {
                _id: newUser._id,
                nombre: newUser.nombre,
                email: newUser.email,
                profileCompleted: false
            }
        });

    } catch (error) {
        console.error("Error en registro rápido:", error);
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: "El email o firebaseUid ya existe." 
            });
        }
        res.status(500).json({ 
            message: "Error al crear el perfil", 
            error: error.message 
        });
    }
};

// ===== COMPLETAR PERFIL (Progresivo) =====
exports.completeProfile = async (req, res) => {
    try {
        const firebaseUid = req.user.uid;
        const { apellidos, nivel, boxAfiliado, nacionalidad, ciudad, onboardingStep } = req.body;

        const user = await User.findOne({ firebaseUid });
        if (!user) {
            return res.status(404).json({ 
                message: "Usuario no encontrado" 
            });
        }

        // Actualizar campos opcionales
        if (apellidos) user.apellidos = apellidos;
        if (nivel) user.nivel = nivel;
        if (boxAfiliado) user.boxAfiliado = boxAfiliado;
        if (nacionalidad) user.nacionalidad = nacionalidad;
        if (ciudad) user.ciudad = ciudad;
        if (onboardingStep !== undefined) user.onboardingStep = onboardingStep;

        // Marcar perfil como completo si tiene los datos clave
        if (user.nombre && user.apellidos && user.nivel) {
            user.profileCompleted = true;
        }

        await user.save();

        res.status(200).json({
            message: "Perfil actualizado exitosamente",
            user: {
                nombre: user.nombre,
                apellidos: user.apellidos,
                nivel: user.nivel,
                boxAfiliado: user.boxAfiliado,
                nacionalidad: user.nacionalidad,
                ciudad: user.ciudad,
                profileCompleted: user.profileCompleted
            }
        });

    } catch (error) {
        console.error("Error al completar perfil:", error);
        res.status(500).json({ 
            message: "Error al actualizar el perfil", 
            error: error.message 
        });
    }
};

// ===== OBTENER PERFIL DEL USUARIO ACTUAL =====
exports.getMyProfile = async (req, res) => {
    try {
        const firebaseUid = req.user.uid;
        
        const user = await User.findOne({ firebaseUid })
            .select('-firebaseUid');

        if (!user) {
            return res.status(404).json({ 
                message: "Perfil no encontrado. Por favor completa tu registro." 
            });
        }

        // Actualizar lastActive
        user.lastActive = Date.now();
        await user.save();

        res.status(200).json({
            message: "Perfil obtenido exitosamente",
            user: user
        });

    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({ 
            message: "Error interno al obtener el perfil", 
            error: error.message 
        });
    }
};

// ===== OBTENER TODOS LOS USUARIOS =====
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

// ===== OBTENER UN USUARIO POR ID =====
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

// ===== ACTUALIZAR PERFIL =====
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

        // Proteger campos sensibles
        delete datosParaActualizar.firebaseUid;
        delete datosParaActualizar.email;

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

// ===== ELIMINAR USUARIO =====
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

// Mantener compatibilidad con registro antiguo
exports.newUser = exports.quickRegister;