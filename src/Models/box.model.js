const mongoose = require('mongoose');

const boxSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    direccion: {
        type: String,
        trim: true,
        default: ''
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    miembros: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    descripcion: {
        type: String,
        trim: true,
        default: ''
    },
    website: {
        type: String,
        trim: true
    },
    redesSociales: {
        instagram: String,
        facebook: String,
        twitter: String
    },
    logo: {
        type: String, // URL de la imagen
        trim: true
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Índices para optimización
boxSchema.index({ nombre: 1 });
boxSchema.index({ owner: 1 });
boxSchema.index({ activo: 1 });

// Método para verificar si un usuario es miembro
boxSchema.methods.esMiembro = function(userId) {
    return this.miembros.includes(userId);
};

// Método para verificar si un usuario es el owner
boxSchema.methods.esOwner = function(userId) {
    return this.owner.toString() === userId.toString();
};

module.exports = mongoose.model('Box', boxSchema);