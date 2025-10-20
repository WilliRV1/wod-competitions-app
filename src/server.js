// Importar la librería de Express
const express = require('express');

// Crear una instancia de la aplicación de Express
const app = express();

// Definir el puerto en el que escuchará el servidor
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('<h1>Primer pantalla app de crossfit</h1>');
  });


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});