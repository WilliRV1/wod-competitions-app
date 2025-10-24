// --- Esquema para 'Competition' ---

const competitionSchema = new Schema({
    // Mongoose añade _id automáticamente
    Organizador: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Asumiendo que referencia a la colección 'User'
        required: true
    },
    Fecha: {
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
    categorias: {
        type: [String], // bsonType: array, items: { bsonType: string }
        required: true
    },
    wods: {
        type: [String], // bsonType: array, items: { bsonType: string }
        required: true
    },
    Costos: {
        type: [String] // bsonType: array, items: { bsonType: string }
    },
    Participantes: {
        // Traducido a Mixed porque el schema original permite dos tipos:
        // un array (cuyos items son string) O un ObjectId.
        type: Schema.Types.Mixed
    },
    Buscando_parejas: {
        // Mismo caso que 'Participantes'.
        type: Schema.Types.Mixed
    }
}, {
    timestamps: true // Opcional
});

const Competition = mongoose.model('Competition', competitionSchema);

module.exports = {
    Competition,
};