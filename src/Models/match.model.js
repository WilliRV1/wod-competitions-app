const mongoose = require('mongoose');
const { Schema } = mongoose;

const matchSchema = new Schema({
    battle: {
        type: Schema.Types.ObjectId,
        ref: 'Battle',
        required: true
    },
    categoria: { type: String, required: true },
    ronda: { type: Number, required: true },
    participante1: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participante2: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    wod: {
        nombre: { type: String },
        descripcion: { type: String },
        tiempoLimite: { type: Number }
    },
    resultado: {
        ganador: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        tiempoParticipante1: { type: Number },
        tiempoParticipante2: { type: Number },
        repsParticipante1: { type: Number },
        repsParticipante2: { type: Number },
        notas: { type: String }
    },
    estado: {
        type: String,
        enum: ['pendiente', 'en_curso', 'completado'],
        default: 'pendiente'
    },
    fechaProgramada: { type: Date },
    fechaCompletada: { type: Date }
}, {
    timestamps: true
});

module.exports = mongoose.model('Match', matchSchema);