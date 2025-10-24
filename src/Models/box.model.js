const User = mongoose.model('User', userSchema);

// --- Esquema para 'Box' ---

const boxSchema = new Schema({
    // Mongoose añade _id automáticamente
    Nombre: {
        type: String,
        required: true
    },
    Owner: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Asumiendo que referencia a la colección 'User'
        required: true
    },
    miembros: {
        // Nota: El schema original define "miembros" (plural) 
        // como un solo ObjectId (singular). Se respeta esa definición.
        type: Schema.Types.ObjectId,
        ref: 'User' // Asumiendo que referencia a la colección 'User'
    },
    direccion: {
        type: String,
        required: true
    }
}, {
    timestamps: true // Opcional
});

const Box = mongoose.model('Box', boxSchema);

module.exports = {
 Box,

};