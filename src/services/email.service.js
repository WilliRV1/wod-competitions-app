// src/services/email.service.js
const nodemailer = require('nodemailer');

// Configurar transporter (usando Gmail como ejemplo)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // tu-email@gmail.com
        pass: process.env.EMAIL_PASSWORD // tu contraseña de aplicación
    }
});

// === EMAIL DE CONFIRMACIÓN DE REGISTRO ===
const sendRegistrationConfirmationEmail = async (registration) => {
    const mailOptions = {
        from: `"WOD MATCH BATTLE" <${process.env.EMAIL_USER}>`,
        to: registration.email,
        subject: '🔥 ¡Estás DENTRO! - Confirmación de Inscripción',
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white; 
            padding: 0;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #00D1A1 0%, #00AE87 100%);
            color: white; 
            padding: 40px 20px; 
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: bold;
        }
        .header .emoji {
            font-size: 60px;
            margin-bottom: 10px;
        }
        .content { 
            padding: 40px 30px;
        }
        .fighter-card {
            background: linear-gradient(135deg, #1A202C 0%, #2D3748 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin: 30px 0;
            border: 3px solid #00D1A1;
        }
        .fighter-code {
            font-size: 36px;
            font-weight: bold;
            color: #00D1A1;
            margin: 20px 0;
            letter-spacing: 2px;
        }
        .info-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #00D1A1;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: bold;
            color: #555;
        }
        .info-value {
            color: #333;
        }
        .next-steps {
            background: #e8f5e9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .next-steps h3 {
            color: #00AE87;
            margin-top: 0;
        }
        .step {
            padding: 10px 0;
            display: flex;
            align-items: flex-start;
        }
        .step-icon {
            color: #00D1A1;
            font-weight: bold;
            margin-right: 10px;
            font-size: 20px;
        }
        .button {
            display: inline-block;
            background: #00D1A1;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
            text-align: center;
        }
        .footer { 
            background: #1A202C; 
            color: #fff; 
            text-align: center; 
            padding: 30px 20px; 
            font-size: 14px;
        }
        .footer a {
            color: #00D1A1;
            text-decoration: none;
        }
        .social-links {
            margin: 20px 0;
        }
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #00D1A1;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">🥊</div>
            <h1>¡ESTÁS DENTRO!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Tu inscripción está confirmada</p>
        </div>

        <div class="content">
            <h2 style="color: #00AE87;">Hola ${registration.firstName} ${registration.lastName},</h2>
            
            <p style="font-size: 16px;">
                ¡Bienvenido a <strong>WOD MATCH BATTLE #1</strong>! Tu pago ha sido procesado exitosamente 
                y tu lugar en el torneo está asegurado.
            </p>

            <!-- Fighter Card -->
            <div class="fighter-card">
                <h3 style="margin: 0 0 10px 0;">TU FIGHTER CODE</h3>
                <div class="fighter-code">${registration.registrationCode}</div>
                <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">
                    Guarda este código - lo necesitarás el día del evento
                </p>
            </div>

            <!-- Información del Registro -->
            <div class="info-box">
                <h3 style="margin-top: 0; color: #00AE87;">📋 Detalles de tu Inscripción</h3>
                
                <div class="info-row">
                    <span class="info-label">Atleta:</span>
                    <span class="info-value">${registration.firstName} ${registration.lastName}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${registration.email}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">WhatsApp:</span>
                    <span class="info-value">${registration.whatsapp}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Categoría:</span>
                    <span class="info-value">${getCategoryName(registration.category)}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Monto Pagado:</span>
                    <span class="info-value">$${registration.payment.amount.toLocaleString('es-CO')} COP</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Fecha del Evento:</span>
                    <span class="info-value">15-16 Marzo 2026</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Lugar:</span>
                    <span class="info-value">CrossFit Coach Piperubio, Cali</span>
                </div>
            </div>

            <!-- Próximos Pasos -->
            <div class="next-steps">
                <h3>🎯 Próximos Pasos</h3>
                
                <div class="step">
                    <span class="step-icon">1.</span>
                    <div>
                        <strong>Únete al Grupo de WhatsApp</strong><br>
                        Te enviaremos el link en las próximas 24 horas. Ahí compartiremos actualizaciones importantes.
                    </div>
                </div>
                
                <div class="step">
                    <span class="step-icon">2.</span>
                    <div>
                        <strong>Bracket Reveal - 1 Marzo 2026</strong><br>
                        Conocerás a tu primer rival y tu posición en el bracket.
                    </div>
                </div>
                
                <div class="step">
                    <span class="step-icon">3.</span>
                    <div>
                        <strong>WODs Revelados - 8 Marzo 2026</strong><br>
                        Una semana antes del evento publicaremos los WODs para que puedas practicar.
                    </div>
                </div>
                
                <div class="step">
                    <span class="step-icon">4.</span>
                    <div>
                        <strong>Check-in - 15 Marzo 8:00 AM</strong><br>
                        Llega temprano para el registro. Trae tu Fighter Code y documento de identidad.
                    </div>
                </div>
            </div>

            <!-- Contacto de Emergencia -->
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #856404;">⚠️ Recuerda</h4>
                <p style="margin: 0; color: #856404;">
                    Contacto de emergencia registrado: <strong>${registration.emergencyContact.name}</strong> 
                    (${registration.emergencyContact.phone})
                </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://tu-dominio.com/battle" class="button">
                    Ver Detalles del Evento
                </a>
            </div>

            <!-- Premios -->
            <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 20px; border-radius: 8px; text-align: center; color: #333;">
                <h3 style="margin-top: 0;">💰 Premios en Efectivo</h3>
                <div style="display: flex; justify-content: space-around; margin-top: 15px;">
                    <div>
                        <div style="font-size: 24px;">🥇</div>
                        <strong>$400.000</strong>
                    </div>
                    <div>
                        <div style="font-size: 24px;">🥈</div>
                        <strong>$200.000</strong>
                    </div>
                    <div>
                        <div style="font-size: 24px;">🥉</div>
                        <strong>$100.000</strong>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <h3 style="margin-top: 0; color: #00D1A1;">WOD MATCH BATTLE</h3>
            <p>El primer torneo bracket 1vs1 de CrossFit en Colombia</p>
            
            <div class="social-links">
                <a href="https://www.instagram.com/wodmatchbattle">📱 Instagram</a>
                <a href="mailto:contacto@wodmatchbattle.com">✉️ Email</a>
                <a href="https://wa.me/573001234567">💬 WhatsApp</a>
            </div>
            
            <p style="font-size: 12px; color: #888; margin-top: 20px;">
                © 2026 WOD Match Battle. Todos los derechos reservados.<br>
                CrossFit Coach Piperubio, Cali, Valle del Cauca
            </p>
        </div>
    </div>
</body>
</html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email enviado:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error al enviar email:', error);
        throw error;
    }
};

// Helper function
const getCategoryName = (code) => {
    const names = {
        'intermedio-male': 'Intermedio Masculino',
        'intermedio-female': 'Intermedio Femenino',
        'scaled-male': 'Scaled Masculino',
        'scaled-female': 'Scaled Femenino'
    };
    return names[code] || code;
};

// === EMAIL DE PAGO PENDIENTE ===
const sendPaymentPendingEmail = async (registration) => {
    const mailOptions = {
        from: `"WOD MATCH BATTLE" <${process.env.EMAIL_USER}>`,
        to: registration.email,
        subject: '⏳ Pago Pendiente - WOD Match Battle',
        html: `
            <h2>Hola ${registration.firstName},</h2>
            <p>Tu registro está casi completo. Estamos esperando la confirmación de tu banco.</p>
            <p><strong>Código de Registro:</strong> ${registration.registrationCode}</p>
            <p>Te notificaremos cuando el pago sea aprobado (generalmente en menos de 24 horas).</p>
            <p>Si tienes dudas, contáctanos por WhatsApp.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Email de pago pendiente enviado');
    } catch (error) {
        console.error('❌ Error al enviar email:', error);
    }
};

// === EMAIL DE PAGO RECHAZADO ===
const sendPaymentRejectedEmail = async (registration) => {
    const mailOptions = {
        from: `"WOD MATCH BATTLE" <${process.env.EMAIL_USER}>`,
        to: registration.email,
        subject: '❌ Pago Rechazado - WOD Match Battle',
        html: `
            <h2>Hola ${registration.firstName},</h2>
            <p>Lamentablemente tu pago no pudo ser procesado.</p>
            <p><strong>Razones comunes:</strong></p>
            <ul>
                <li>Fondos insuficientes</li>
                <li>Datos de tarjeta incorrectos</li>
                <li>Tarjeta rechazada por el banco</li>
            </ul>
            <p>Puedes intentar de nuevo aquí: <a href="https://tu-dominio.com/battle/register">Reintentar Pago</a></p>
            <p>Si necesitas ayuda, contáctanos por WhatsApp.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Email de pago rechazado enviado');
    } catch (error) {
        console.error('❌ Error al enviar email:', error);
    }
};

module.exports = {
    sendRegistrationConfirmationEmail,
    sendPaymentPendingEmail,
    sendPaymentRejectedEmail
};