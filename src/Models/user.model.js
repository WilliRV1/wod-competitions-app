const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    // ===== CAMPOS OBLIGATORIOS MÍNIMOS =====
    firebaseUid: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    nombre: {
        type: String,
        required: true,
        trim: true
    },

    // ===== CAMPOS OPCIONALES (Progressive Disclosure) =====
    apellidos: {
        type: String,
        trim: true,
        default: ''
    },

    nivel: {
        type: String,
        enum: ['Novato', 'Intermedio', 'RX'],
        default: null // null hasta que el usuario lo complete
    },

    boxAfiliado: {
        type: String,
        trim: true,
        default: null
    },

    nacionalidad: {
        type: String,
        trim: true,
        default: null
    },

    ciudad: {
        type: String,
        trim: true,
        default: null
    },

    // ===== BATTLE-RELATED FIELDS =====
    battleStats: {
        wins: {
            type: Number,
            default: 0
        },
        losses: {
            type: Number,
            default: 0
        },
        ranking: {
            type: Number,
            default: null
        }
    },

    battleHistory: [{
        type: String // Assuming battle IDs are strings; adjust to ObjectId if battles are modeled separately
    }],

    preferredCategories: [{
        type: String
    }],

    preferredWeightClasses: [{
        type: String
    }],

    // ===== METADATA PARA UX =====
    profileCompleted: {
        type: Boolean,
        default: false
    },

    onboardingStep: {
        type: Number,
        default: 0 // 0 = no iniciado, 1-3 = pasos completados
    },

    lastActive: {
        type: Date,
        default: Date.now
    },

    // ===== RELACIONES =====
    competencias: [{
        type: Schema.Types.ObjectId,
        ref: 'Competition'
    }],

    boxesPropietarios: [{
        type: Schema.Types.ObjectId,
        ref: 'Box'
    }]
}, {
    timestamps: true
});

// Índices para búsquedas rápidas
userSchema.index({ email: 1 });
userSchema.index({ firebaseUid: 1 });

// Virtual para nombre completo
userSchema.virtual('nombreCompleto').get(function () {
    return this.apellidos
        ? `${this.nombre} ${this.apellidos}`
        : this.nombre;
});

module.exports = mongoose.model('User', userSchema);