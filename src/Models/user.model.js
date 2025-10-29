const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    firebaseUid: {
        type: String,
        required: true,
        unique: true
    },
    nombre: { 
        type: String, 
        required: true, 
        trim: true 
    },
    apellidos: { 
        type: String, 
        required: true, 
        trim: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true, 
        lowercase: true 
    },
    
    // 🎯 SIMPLIFICADO: Solo nivel, sin rol complejo
    nivel: {
        type: String,
        enum: ['Novato', 'Intermedio', 'RX'],
        default: 'Novato'
    },
    
    // 📍 Opcional: Box donde entrena (texto libre por ahora)
    boxAfiliado: {
        type: String,
        trim: true,
        default: null
    },
    
    // 🔮 FUTURO: Para verificación de boxes oficiales
    esBoxVerificado: {
        type: Boolean,
        default: false
    },
    
    // 🔮 FUTURO: Referencia al Box si es dueño verificado
    boxPropietario: {
        type: Schema.Types.ObjectId,
        ref: 'Box',
        default: null
    },
    
    // --- RELACIONES ---
    competencias: [{
        type: Schema.Types.ObjectId,
        ref: 'Competition'
    }]
}, {
    timestamps: true
});

// Índices para búsquedas rápidas
userSchema.index({ email: 1 });
userSchema.index({ firebaseUid: 1 });

module.exports = mongoose.model('User', userSchema);