const mongoose = require('mongoose');
const { Schema } = mongoose;

const boxSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        unique: true
    },
    direccion: {
        type: String
    },
    // --- RELACIONES ---
    owner: { // El dueño del box
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    miembros: [{ // Lista de atletas (un array)
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Box', boxSchema);