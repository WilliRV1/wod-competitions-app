const mongoose = require('mongoose');
const { Schema } = mongoose;

const competitionSchema = new Schema({
    nombre: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        required: true
    },
    lugar: {
        type: String,
        required: true
    },
    descripcion: {
        type: String
    },
    categorias: [{
        type: String
    }],
    wods: [{
        type: String // Un array de descripciones de WODs
    }],
    costo: {
        type: String 
    },
    // --- RELACIONES ---
    organizador: { // El Box que la crea
        type: Schema.Types.ObjectId,
        ref: 'Box',
        required: true
    },
    atletas_inscritos: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    buscando_parejas: [{ // ¡El Partner Finder!
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Competition', competitionSchema);