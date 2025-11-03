const mongoose = require('mongoose');
const { Schema } = mongoose;

const battleRegistrationSchema = new Schema({
    battle: {
        type: Schema.Types.ObjectId,
        ref: 'Battle',
        required: true
    },
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    categoria: { type: String, required: true },
    peso: { type: Number },
    estado: {
        type: String,
        enum: ['pendiente', 'confirmado', 'rechazado'],
        default: 'pendiente'
    },
    fechaRegistro: { type: Date, default: Date.now },
    notas: { type: String }
}, {
    timestamps: true
});

module.exports = mongoose.model('BattleRegistration', battleRegistrationSchema);