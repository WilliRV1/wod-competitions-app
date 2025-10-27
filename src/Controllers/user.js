// 1. Importar el Modelo
const User = require("../Models/user.model.js");

// --- OBTENER TODOS LOS USUARIOS (READ) ---
exports.getUser = async (req, res) => {
    try {
        const allAtletas = await User.find({});
        // Por seguridad, evitamos devolver las contraseñas (aunque ya no las guardamos)
        // Podríamos seleccionar campos específicos: .select('nombre apellidos email rol nivel box')
        res.status(200).json({
            message: "Todos Los Atletas: ",
            allAtletas: allAtletas
        });
    } catch(error) {
        res.status(400).json({ message: "Error al buscar usuarios", error: error.message });
    }
};

// --- CREAR PERFIL DE USUARIO (CREATE) ---
// Se llama DESPUÉS de que Firebase crea la cuenta
exports.newUser = async (req, res) => {
    try {
        const { nombre, apellidos, email, firebaseUid, rol, nivel, box } = req.body;

        // Validaciones básicas (puedes añadir más)
        if (!firebaseUid || !email || !nombre || !apellidos || !rol) {
            return res.status(400).json({ message: "Faltan datos requeridos (firebaseUid, email, nombre, apellidos, rol)." });
        }

        const nuevoUsuario = new User({
            firebaseUid: firebaseUid,
            nombre: nombre,
            apellidos: apellidos,
            email: email,
            rol: rol,
            nivel: nivel,
            box: box
        });

        await nuevoUsuario.save();

        res.status(201).json({
            message: "¡Perfil de usuario creado exitosamente!",
            userId: nuevoUsuario._id
        });

    } catch (error) {
        // Manejo específico para error de duplicado (unique)
        if (error.code === 11000) { // Código de error de duplicado de MongoDB
             return res.status(400).json({ message: "Error al crear el perfil: El email o firebaseUid ya existe.", field: error.keyValue });
        }
        res.status(400).json({ message: "Error al crear el perfil", error: error.message });
    }
};

// --- OBTENER UN USUARIO POR ID (READ) ---
exports.getUserID = async (req, res) => {
    try {
        const id = req.params.id;
        const atleta = await User.findById(id); //.select('-password'); // Excluir contraseña si aún existiera

        if (!atleta) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.status(200).json({
            message: "Atleta encontrado:",
            atleta: atleta
        });

    } catch(error) {
         // Manejo de error si el ID tiene formato inválido
        if (error.kind === 'ObjectId') {
             return res.status(400).json({ message: "ID de usuario inválido" });
        }
        res.status(400).json({ message: "Error al buscar usuario", error: error.message });
    }
};

// --- ACTUALIZAR UN USUARIO (UPDATE) ---
// Protegida por middleware
exports.putUser = async (req, res) => {
    try {
        const userIdToUpdate = req.params.id; // ID del perfil a actualizar (MongoDB _id)
        const firebaseUidFromToken = req.user.uid; // UID del usuario autenticado (viene del middleware)
        const datosParaActualizar = req.body;

        // **Verificación de Seguridad:** Asegurarse que el usuario autenticado es dueño del perfil
        const userToUpdate = await User.findById(userIdToUpdate);

        if (!userToUpdate) {
            return res.status(404).json({ message: "Usuario no encontrado para actualizar" });
        }

        // Compara el UID de Firebase del token con el UID guardado en el perfil
        if (userToUpdate.firebaseUid !== firebaseUidFromToken) {
            return res.status(403).json({ message: "No tienes permiso para actualizar este perfil." });
        }

        // Evitar que se actualicen campos sensibles como firebaseUid o rol directamente
        // (Podrías tener rutas/lógica separada para cambio de rol si es necesario)
        delete datosParaActualizar.firebaseUid;
        delete datosParaActualizar.email; // Generalmente no se permite cambiar el email fácilmente
        delete datosParaActualizar.rol;
        delete datosParaActualizar.password; // Ya no existe, pero buena práctica dejarlo por si acaso

        // Actualizar el usuario
        const atletaActualizado = await User.findByIdAndUpdate(userIdToUpdate, datosParaActualizar, { new: true }); // {new: true} devuelve el documento actualizado

        res.status(200).json({
            message: "Atleta actualizado:",
            atleta: atletaActualizado
        });

    } catch(error) {
        if (error.kind === 'ObjectId') {
             return res.status(400).json({ message: "ID de usuario inválido" });
        }
        res.status(400).json({ message: "Error al actualizar usuario", error: error.message });
    }
};

// --- BORRAR UN USUARIO (DELETE) ---
// Protegida por middleware
exports.deleteUser = async (req, res) => {
    try {
        const userIdToDelete = req.params.id; // ID del perfil a borrar (MongoDB _id)
        const firebaseUidFromToken = req.user.uid; // UID del usuario autenticado

        // **Verificación de Seguridad:**
        const userToDelete = await User.findById(userIdToDelete);

        if (!userToDelete) {
            return res.status(404).json({ message: "Usuario no encontrado para eliminar" });
        }

        if (userToDelete.firebaseUid !== firebaseUidFromToken) {
            return res.status(403).json({ message: "No tienes permiso para eliminar este perfil." });
        }

        // Borrar el usuario de MongoDB
        const atletaBorrado = await User.findByIdAndDelete(userIdToDelete);

        // **Opcional pero recomendado:** Aquí podrías añadir lógica para borrar
        // también la cuenta del usuario en Firebase Authentication usando el Admin SDK
        // await admin.auth().deleteUser(firebaseUidFromToken);

        res.status(200).json({
            message: "Atleta eliminado exitosamente de la base de datos",
            atleta: atletaBorrado // Devuelve el perfil borrado como confirmación
        });

    } catch(error) {
        if (error.kind === 'ObjectId') {
             return res.status(400).json({ message: "ID de usuario inválido" });
        }
        res.status(400).json({ message: "Error al eliminar usuario", error: error.message });
    }
};