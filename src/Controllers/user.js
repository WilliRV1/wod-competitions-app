const User = require ("../Models/user.model.js")
const bcrypt = require('bcrypt');

exports.getUser = async (req,res) => {
   try {
    
    const allAtletas = await User.find({});
    res.status(200).json({ 
        message: "Todos Los Atletas: ", allAtletas,
         
    });
   }catch(error){
    res.status(400).json({ message: "Error al buscar usuarios", error: error.message });
   }


}

exports.newUser = async (req,res) => {
    try {
        // 1. Obtener los datos del cuerpo de la petición
        const { nombre, apellidos, email, password, rol, nivel, box } = req.body;

        // 2. Hashear la contraseña
        const salt = await bcrypt.genSalt(10); // Genera el "salt"
        const hashedPassword = await bcrypt.hash(password, salt); // Crea el hash

        // 3. Crear el nuevo usuario con la contraseña hasheada
        const nuevoUsuario = new User({
            nombre: nombre,
            apellidos: apellidos,
            email: email,
            password: hashedPassword, // ¡Guardamos el HASH, no la contraseña!
            rol: rol,
            nivel: nivel,
            box: box 
        });

        // 4. Guardar en la base de datos
        await nuevoUsuario.save();

        // 5. Responder al cliente
        res.status(201).json({ 
            message: "¡Usuario creado exitosamente!",
            userId: nuevoUsuario._id 
        });

    } catch (error) {
        // Manejo de errores (ej. email duplicado)
        res.status(400).json({ message: "Error al crear el usuario", error: error.message });
    }
};
  




exports.getUserID = async (req,res) => {
    try {
        const id = req.params.id;
        const atleta = await User.findById(id);
        if (!atleta) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // 4. Si se encuentra, devolverlo
        res.status(200).json({ 
            message: "Atleta encontrado:", 
            atleta: atleta 
        });

    } catch(error){
        res.status(400).json({ message: "Error al buscar usuario", error: error.message });
    }
    
}

exports.putUser = async (req,res) => {
    try {
        const id = req.params.id;
        
        const { nombre, apellidos, email, password, rol, nivel, box } = req.body;
        const salt = await bcrypt.genSalt(10); // Genera el "salt"
        const hashedPassword = await bcrypt.hash(password, salt); // Crea el hash
        const atleta = await User.findById(id);
        if (!atleta) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // 4. Si se encuentra, devolverlo
        res.status(200).json({ 
            message: "Atleta encontrado:", 
            atleta: atleta 
        });

    } catch(error){
        res.status(400).json({ message: "Error al buscar usuario", error: error.message });
    }
    
}


exports.deleteUser = (req,res) => {
    res.json({ message: "Borrando usuario" })


}

