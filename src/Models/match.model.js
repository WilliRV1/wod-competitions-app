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
        default: null
    },
    participante2: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
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
    fechaCompletada: { type: Date },

    // === BRACKET LINKING ===
    nextMatchId: {
        type: Schema.Types.ObjectId,
        ref: 'Match',
        default: null
    },
    nextMatchSlot: {
        type: String,
        enum: ['participante1', 'participante2', null],
        default: null
    },
    roundName: {
        type: String,
        default: '' // e.g., "Round of 16", "Quarterfinals", "Final"
    },
    bracketId: { // To group matches by bracket instance if needed
        type: String,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Match', matchSchema);