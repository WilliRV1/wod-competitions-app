const mongoose = require('mongoose');
const { Schema } = mongoose;

const competitionSchema = new Schema({
    nombre: { type: String, required: true },
    fecha: { type: Date, required: true },
    lugar: { type: String, required: true },
    descripcion: { type: String },
    categorias: [{ type: String }],
    wods: [{ type: String }],
    costo: { type: String },

    // 🎯 SIMPLIFICADO: Solo un creador (cualquier usuario)
    creador: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // 📍 Opcional: Si representa a un box (texto libre)
    boxRepresentado: {
        type: String,
        trim: true,
        default: null
    },

    // 🔮 FUTURO: Para boxes verificados
    organizadorVerificado: {
        type: Schema.Types.ObjectId,
        ref: 'Box',
        default: null
    },

    // --- PARTICIPANTES ---
    atletas_inscritos: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    
    buscando_parejas: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    }]
}, {
    timestamps: true
});

// Índices para búsquedas
competitionSchema.index({ fecha: 1 });
competitionSchema.index({ creador: 1 });

module.exports = mongoose.model('Competition', competitionSchema);