// 1. Importar el Modelo
const User = require("../Models/user.model.js");


// --- OBTENER TODOS LOS USUARIOS (READ) ---
exports.getUser = async (req, res) => {
    try {
        const allAtletas = await User.find({});
        res.status(200).json({ 
            message: "Todos Los Atletas: ", 
            allAtletas: allAtletas
        });
    } catch(error) {
        res.status(400).json({ message: "Error al buscar usuarios", error: error.message });
    }
};

// --- CREAR PERFIL DE USUARIO (CREATE) ---
// Esto se llama DESPUÉS de que Firebase crea la cuenta
exports.newUser = async (req, res) => {
    try {
        // 1. Obtener los datos del cuerpo (¡Corregido!)
        const { nombre, apellidos, email, firebaseUid, rol, nivel, box } = req.body;

        // 2. Crear el nuevo usuario (SIN CONTRASEÑA)
        const nuevoUsuario = new User({
            firebaseUid: firebaseUid, 
            nombre: nombre,
            apellidos: apellidos,
            email: email,
            rol: rol, 
            nivel: nivel, 
            box: box 
        });

        // 3. Guardar en la base de datos (MongoDB)
        await nuevoUsuario.save();

        // 4. Responder al cliente
        res.status(201).json({ 
            message: "¡Perfil de usuario creado exitosamente!",
            userId: nuevoUsuario._id 
        });

    } catch (error) {
        res.status(400).json({ message: "Error al crear el perfil", error: error.message });
    }
};
  
// --- OBTENER UN USUARIO POR ID (READ) ---
exports.getUserID = async (req, res) => {
    try {
        const id = req.params.id;
        const atleta = await User.findById(id);
        
        if (!atleta) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.status(200).json({ 
            message: "Atleta encontrado:", 
            atleta: atleta 
        });

    } catch(error) {
        res.status(400).json({ message: "Error al buscar usuario", error: error.message });
    }
};

// --- ACTUALIZAR UN USUARIO (UPDATE) ---
exports.putUser = async (req, res) => {
    try {
        const id = req.params.id;
      
        const datosParaActualizar = req.body; 

        // 1. Encontrar y actualizar el usuario

        const atletaActualizado = await User.findByIdAndUpdate(id, datosParaActualizar, { new: true });

        if (!atletaActualizado) {
            return res.status(404).json({ message: "Usuario no encontrado para actualizar" });
        }

        // 2. Si se encuentra, devolverlo
        res.status(200).json({ 
            message: "Atleta actualizado:", 
            atleta: atletaActualizado 
        });

    } catch(error) {
        res.status(400).json({ message: "Error al actualizar usuario", error: error.message });
    }
};

// --- BORRAR UN USUARIO (DELETE) ---
exports.deleteUser = async (req, res) => {
    try {
        const id = req.params.id;

        // 1. Encontrar y borrar el usuario
        const atletaBorrado = await User.findByIdAndDelete(id);

        if (!atletaBorrado) {
            return res.status(404).json({ message: "Usuario no encontrado para eliminar" });
        }

        // 2. Si se borra, enviar confirmación
        res.status(200).json({ 
            message: "Atleta eliminado exitosamente",
            atleta: atletaBorrado 
        });

    } catch(error) {
        res.status(400).json({ message: "Error al eliminar usuario", error: error.message });
    }
};