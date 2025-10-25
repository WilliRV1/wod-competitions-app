const mongoose = require('mongoose');
const { Schema } = mongoose;

const competitionSchema = new Schema({
    nombre: { type: String, required: true },
    fecha: { type: Date, required: true },
    lugar: { type: String, required: true },
    descripcion: { type: String },
    categorias: [{ type: String }],
    wods: [{ type: String }],
    costo: { type: String },

    // --- LÓGICA DE PROPIEDAD ---
    organizador: { 
        type: Schema.Types.ObjectId,
        ref: 'Box', 
        required: false 
    },
    creador: { // <-- ¡ASEGÚRATE DE QUE ESTÉ ESTE CAMPO!
        type: Schema.Types.ObjectId,
        ref: 'User', 
        required: false 
    },
    // --- FIN LÓGICA ---

    atletas_inscritos: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    buscando_parejas: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true
});

// Validacion: Una competencia debe tener un creador O un organizador
competitionSchema.pre('save', function(next) {
  if (!this.organizador && !this.creador) {
    next(new Error('La competencia debe tener un organizador (Box) o un creador (Atleta).'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Competition', competitionSchema);