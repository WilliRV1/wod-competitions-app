const Box = require('../Models/box.model.js');
const User = require('../Models/user.model.js');

// --- CREAR UN NUEVO BOX ---
exports.createBox = async (req, res) => {
    try {
        const { nombre, direccion } = req.body;
        // Obtenemos el ID de usuario del token verificado (gracias al middleware)
        const ownerFirebaseUid = req.user.uid; 

        // Buscamos a nuestro usuario en MongoDB para obtener su _id
        const user = await User.findOne({ firebaseUid: ownerFirebaseUid });
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Verificamos que el rol sea 'dueño_box'
        if (user.rol !== 'dueño_box') {
            return res.status(403).json({ message: "No tienes permisos para crear un Box" });
        }

        const newBox = new Box({
            nombre,
            direccion,
            owner: user._id // Asignamos el _id de MongoDB como el owner
        });

        await newBox.save();
        res.status(201).json({ message: "Box creado exitosamente", box: newBox });

    } catch (error) {
        res.status(400).json({ message: "Error al crear el Box", error: error.message });
    }
};

// --- OBTENER TODOS LOS BOXES ---
exports.getAllBoxes = async (req, res) => {
    try {
        const boxes = await Box.find().populate('owner', 'nombre email'); // .populate() trae los datos del dueño
        res.status(200).json({ boxes });
    } catch (error) {
        res.status(400).json({ message: "Error al obtener Boxes", error: error.message });
    }
};

// --- OBTENER UN BOX POR ID ---
exports.getBoxById = async (req, res) => {
    try {
        const box = await Box.findById(req.params.id).populate('owner miembros', 'nombre email rol nivel');
        if (!box) {
            return res.status(404).json({ message: "Box no encontrado" });
        }
        res.status(200).json({ box });
    } catch (error) {
        res.status(400).json({ message: "Error al obtener Box", error: error.message });
    }
};

// --- ACTUALIZAR UN BOX ---
exports.updateBox = async (req, res) => {
    try {
        const box = await Box.findById(req.params.id);
        if (!box) {
            return res.status(404).json({ message: "Box no encontrado" });
        }

        // Verificamos que quien actualiza sea el dueño
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (box.owner.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "No tienes permisos para editar este Box" });
        }

        const updatedBox = await Box.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: "Box actualizado", box: updatedBox });

    } catch (error) {
        res.status(400).json({ message: "Error al actualizar Box", error: error.message });
    }
};

// --- ELIMINAR UN BOX ---
exports.deleteBox = async (req, res) => {
    try {
        const box = await Box.findById(req.params.id);
        if (!box) {
            return res.status(404).json({ message: "Box no encontrado" });
        }

        // Verificamos que quien elimina sea el dueño
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (box.owner.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "No tienes permisos para eliminar este Box" });
        }

        await Box.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Box eliminado exitosamente" });

    } catch (error) {
        res.status(400).json({ message: "Error al eliminar Box", error: error.message });
    }
};