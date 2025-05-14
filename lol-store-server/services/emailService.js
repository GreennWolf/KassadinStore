const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify/${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verifica tu cuenta',
        html: `
        <!DOCTYPE html>
         <html>
         <head>
             <meta charset="UTF-8">
             <meta name="viewport" content="width=device-width, initial-scale=1.0">
         </head>
         <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #121212; color: white;">
             <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1e1e1e; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                 <!-- Header -->
                 <div style="text-align: center; padding: 20px 0;">
                     <img src="https://api.ksdinstore.com/logo" alt="Logo" style="max-width: 150px; height: auto;">
                 </div>
 
                 <!-- Content -->
                 <div style="padding: 20px; text-align: center;">
                     <h1 style="margin-bottom: 20px; color:white;">¡Bienvenido!</h1>
                     <p style="margin-bottom: 20px; color:white">Gracias por registrarte. Para completar tu registro y activar tu cuenta, haz clic en el siguiente botón:</p>
                     <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; margin: 20px 0; background: linear-gradient(90deg, #444, #000); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; border: 1px solid #666; transition: all 0.3s ease;">Verificar mi cuenta</a>
                     <p style="margin-top: 20px; color:white">Este enlace expirará en 1 hora por razones de seguridad.</p>
                     <div style="border-top: 1px solid #333; margin: 20px 0;"></div>
                     <p style="margin-bottom: 10px; color:white">Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
                     <p style="font-size: 12px; color: #aaa;">${verificationUrl}</p>
                 </div>
 
                 <!-- Footer -->
                 <div style="text-align: center; padding: 20px; color: #aaa; font-size: 12px;">
                     <p style="margin: 0;">Este es un correo automático, por favor no respondas a este mensaje.</p>
                     <p style="margin: 0;">© ${new Date().getFullYear()} Kassadin Store. Todos los derechos reservados.</p>
                 </div>
             </div>
         </body>
         </html>
         `
    };

    return await transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Restablece tu contraseña',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #121212; color: white;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1e1e1e; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);">
                <!-- Header -->
                <div style="text-align: center; padding: 20px 0;">
                    <img src="https://api.ksdinstore.com/logo" alt="Logo" style="max-width: 150px; height: auto;">
                </div>

                <!-- Content -->
                <div style="padding: 20px; text-align: center;">
                    <h1 style="margin-bottom: 20px; color:white;">Restablece tu contraseña</h1>
                    <p style="margin-bottom: 20px; color:white">Hemos recibido una solicitud para restablecer tu contraseña. Si no has sido tú quien la solicitó, puedes ignorar este mensaje.</p>
                    <p style="margin-bottom: 20px; color:white">Para establecer una nueva contraseña, haz clic en el siguiente botón:</p>
                    <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; margin: 20px 0; background: linear-gradient(90deg, #444, #000); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; border: 1px solid #666; transition: all 0.3s ease;">Restablecer Contraseña</a>
                    <p style="margin-top: 20px; color:white">Este enlace expirará en 1 hora por razones de seguridad.</p>
                    <div style="border-top: 1px solid #333; margin: 20px 0;"></div>
                    <p style="margin-bottom: 10px; color:white">Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
                    <p style="font-size: 12px; color: #aaa;">${resetUrl}</p>
                </div>

                <!-- Footer -->
                <div style="text-align: center; padding: 20px; color: #aaa; font-size: 12px;">
                    <p style="margin: 0;">Este es un correo automático, por favor no respondas a este mensaje.</p>
                    <p style="margin: 0;">© ${new Date().getFullYear()} Kassadin Store. Todos los derechos reservados.</p>
                    <p style="margin-top: 10px;">Por seguridad, si no solicitaste este cambio, te recomendamos cambiar tu contraseña inmediatamente.</p>
                </div>
            </div>
        </body>
        </html>
        `
    };

    return await transporter.sendMail(mailOptions);
};

module.exports = { 
    sendVerificationEmail,
    sendPasswordResetEmail 
};