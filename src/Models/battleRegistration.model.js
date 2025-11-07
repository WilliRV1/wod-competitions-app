// Models/battleRegistration.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const battleRegistrationSchema = new Schema({
    // === DATOS DEL EVENTO ===
    eventId: {
        type: String,
        required: true,
        default: 'WMBATTLE-T1-2026' // WOD MATCH BATTLE - Temporada 1
    },
    
    // === DATOS PERSONALES ===
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    birthDate: {
        type: Date,
        required: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    whatsapp: {
        type: String,
        required: true,
        trim: true
    },
    
    // === CATEGORÍA ===
    category: {
        type: String,
        required: true,
        enum: [
            'intermedio-male',
            'intermedio-female',
            'scaled-male',
            'scaled-female'
        ]
    },
    
    // === CONTACTO DE EMERGENCIA ===
    emergencyContact: {
        name: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        relation: {
            type: String,
            default: ''
        }
    },
    
    // === INFORMACIÓN MÉDICA ===
    medical: {
        conditions: {
            type: String,
            default: ''
        },
        medications: {
            type: String,
            default: ''
        }
    },
    
    // === WAIVERS Y AUTORIZACIONES ===
    waivers: {
        liabilityAccepted: {
            type: Boolean,
            required: true,
            default: false
        },
        imageAuthorized: {
            type: Boolean,
            default: false
        }
    },
    
    // === PAGO ===
    payment: {
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'COP'
        },
        method: {
            type: String,
            enum: ['mercadopago', 'manual', 'pending'],
            default: 'pending'
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'refunded'],
            default: 'pending'
        },
        transactionId: {
            type: String,
            default: null
        },
        paidAt: {
            type: Date,
            default: null
        },
        mercadoPagoData: {
            type: Schema.Types.Mixed,
            default: null
        }
    },
    
    // === USUARIO (Opcional - si está logueado) ===
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    firebaseUid: {
        type: String,
        default: null
    },
    
    // === ESTADO DEL REGISTRO ===
    status: {
        type: String,
        enum: ['pending_payment', 'confirmed', 'cancelled', 'refunded'],
        default: 'pending_payment'
    },
    
    // === BRACKET (Se asigna después) ===
    bracket: {
        seed: {
            type: Number,
            default: null
        },
        position: {
            type: String,
            default: null
        }
    },
    
    // === METADATA ===
    registrationCode: {
        type: String,
        unique: true,
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    
}, {
    timestamps: true
});

// Índices para búsquedas rápidas
battleRegistrationSchema.index({ email: 1 });
battleRegistrationSchema.index({ category: 1 });
battleRegistrationSchema.index({ 'payment.status': 1 });
battleRegistrationSchema.index({ status: 1 });
battleRegistrationSchema.index({ registrationCode: 1 });

// Método para generar código de registro único
battleRegistrationSchema.statics.generateRegistrationCode = function() {
    return 'WM-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

// Virtual para nombre completo
battleRegistrationSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual para edad
battleRegistrationSchema.virtual('age').get(function() {
    if (!this.birthDate) return null;
    const today = new Date();
    const birthDate = new Date(this.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});

// Configurar para incluir virtuals en JSON
battleRegistrationSchema.set('toJSON', { virtuals: true });
battleRegistrationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('BattleRegistration', battleRegistrationSchema);