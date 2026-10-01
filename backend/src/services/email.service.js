const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

async function sendPasswordResetEmail(to, resetUrl) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: 'Recupera tu contraseña de TaskMaster',
    text: `Para crear una nueva contraseña, abre este enlace (vale 1 hora): ${resetUrl}\n\nSi no lo solicitaste, ignora este correo.`,
    html: `
      <p>Hola,</p>
      <p>Para crear una nueva contraseña, haz clic en el enlace (vale 1 hora):</p>
      <p><a href="${resetUrl}">Crear nueva contraseña</a></p>
      <p>Si no lo solicitaste, ignora este correo.</p>
    `
  });
}

module.exports = { sendPasswordResetEmail };