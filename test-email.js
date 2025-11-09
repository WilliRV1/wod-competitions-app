require('dotenv').config();
const { sendRegistrationConfirmationEmail } = require('./src/services/email.service');

// Datos de prueba
const testRegistration = {
    firstName: 'William ',
    lastName: 'Reyes Valencia',
    email: 'delfos.cali@gmail.com', // TU EMAIL PARA PROBAR
    whatsapp: '+573136336446',
    category: 'intermedio-male',
    registrationCode: 'WM-TEST123',
    payment: {
        amount: 90000   
    },
    emergencyContact: {
        name: 'María Pérez',
        phone: '+573007654321'
    }
};

sendRegistrationConfirmationEmail(testRegistration)
    .then(() => {
        console.log('✅ Email de prueba enviado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });