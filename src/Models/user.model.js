const mongoose = require('mongoose');
const { Schema } = mongoose;

// --- Esquema para 'User' ---

const userSchema = new Schema({
    // Mongoose añade _id automáticamente
    Nombre: {
        type: String,
        required: true
    },
    Apellidos: {
        type: String,
        required: true
    },
    "Box ": {
        // Nota: El nombre del campo "Box " tiene un espacio al final, tal como en tu schema.
        // El schema original lo define como "string", no como ObjectId.
        type: String 
    },
    Logros: {
        // Traducido a [Mixed] porque el schema original define un array de tipos 
        // específicos en posiciones específicas (un "tuple-like" array) 
        // que Mongoose no soporta nativamente. Mixed permite cualquier tipo.
        type: [Schema.Types.Mixed] 
    },
    Competencias: {
        type: Schema.Types.ObjectId,
        ref: 'Competition' // Asumiendo que referencia a la colección 'Competition'
    },
    rol: {
        type: Boolean,
        required: true
    },
    Categoria: {
        type: String
    },
    email: {
        type: String,
        required: true
        // Considera añadir validaciones extra como: unique: true, lowercase: true
    },
    password: {
        type: String,
        required: true
    }
}, {
    // La opción `additionalProperties: false` de JSONSchema es el 
    // comportamiento por defecto en Mongoose (`strict: true`), 
    // por lo que no es necesario añadir nada extra.
    timestamps: true // Opcional: añade createdAt y updatedAt
});




// Exportar los modelos (si estás usando módulos de Node.js)
module.exports = {
    User,
};