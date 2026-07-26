import nodemailer from "nodemailer";

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

async function send(to, subject, html) {
  if (!transporter) {
    console.log(`[EMAIL DEV] To: ${to} | ${subject}`);
    console.log(html);
    return;
  }
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
}

export function sendVerificationEmail(to, token) {
  const url = `${process.env.APP_BASE_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  return send(to, "Verifica tu correo — Proyecto X", `<h2>Bienvenida a Proyecto X</h2><p>Verifica tu correo para activar tu cuenta.</p><p><a href="${url}">Verificar mi correo</a></p><p>Este enlace caduca en 24 horas.</p>`);
}

export function sendPasswordResetEmail(to, token) {
  const url = `${process.env.APP_BASE_URL}/?resetToken=${encodeURIComponent(token)}`;
  return send(to, "Restablece tu contraseña — Proyecto X", `<h2>Restablecer contraseña</h2><p>Solicitaste cambiar tu contraseña.</p><p><a href="${url}">Restablecer contraseña</a></p><p>Este enlace caduca en 30 minutos.</p>`);
}
