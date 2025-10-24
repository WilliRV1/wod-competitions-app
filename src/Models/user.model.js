const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        trim: true // Limpia espacios en blanco
    },
    apellidos: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // No pueden existir dos emails iguales
        trim: true,
        lowercase: true // Siempre guarda en minúscula
    },
    password: {
        type: String,
        required: true
    },
    rol: {
        type: String,
        required: true,
        enum: ['atleta', 'dueño_box'] // 'atleta' o 'dueño_box'
    },
    nivel: {
        type: String,
        enum: ['Novato', 'Intermedio', 'RX'],
        default: 'Novato'
    },
    // --- RELACIONES ---
    box: {
        type: Schema.Types.ObjectId,
        ref: 'Box' // Conecta con el modelo Box
    },
    competencias: [{ // Un array de IDs
        type: Schema.Types.ObjectId,
        ref: 'Competition' // Conecta con el modelo Competition
    }]
}, {
    timestamps: true // Añade createdAt y updatedAt
});

// Este es el sello final que exporta el modelo
module.exports = mongoose.model('User', userSchema);