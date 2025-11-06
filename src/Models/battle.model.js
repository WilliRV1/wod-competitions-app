const mongoose = require('mongoose');
const { Schema } = mongoose;

const battleSchema = new Schema({
    nombre: { type: String, required: true },
    fecha: { type: Date, required: true },
    lugar: { type: String },
    descripcion: { type: String },
    costo: { type: Number },
    categorias: [{
        nombre: { type: String },
        limiteParticipantes: { type: Number },
        pesoMin: { type: Number },
        pesoMax: { type: Number }
    }],
    wods: [{
        nombre: { type: String },
        descripcion: { type: String },
        tiempoLimite: { type: Number }
    }],
    creador: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    boxRepresentado: {
        type: Schema.Types.ObjectId,
        ref: 'Box'
    },
    organizadorVerificado: { type: Boolean },
    estado: {
        type: String,
        enum: ['inscripcion', 'activo', 'finalizado'],
        default: 'inscripcion'
    },
    tipoTorneo: {
        type: String,
        enum: ['eliminacion_simple', 'doble_eliminacion'],
        default: 'eliminacion_simple'
    },
    premio: {
        primerLugar: { type: String },
        segundoLugar: { type: String },
        tercerLugar: { type: String }
    },
    reglas: { type: String }
}, {
    timestamps: true
});

module.exports = mongoose.model('Battle', battleSchema);