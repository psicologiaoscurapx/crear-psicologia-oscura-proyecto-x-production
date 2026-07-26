import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import db from "./db.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "./mailer.js";

const token = () => crypto.randomBytes(32).toString("hex");
const hashToken = (t) => crypto.createHash("sha256").update(t).digest("hex");
const now = () => Math.floor(Date.now()/1000);

export async function register(req, res) {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || password.length < 8) {
    return res.status(400).json({ error: "Nombre, email y contraseña de mínimo 8 caracteres son obligatorios." });
  }
  const normalized = email.trim().toLowerCase();
  const exists = db.prepare("SELECT id FROM users WHERE email=?").get(normalized);
  if (exists) return res.status(409).json({ error: "Ese correo ya está registrado." });

  const passwordHash = await bcrypt.hash(password, 12);
  const result = db.prepare("INSERT INTO users(name,email,password_hash) VALUES(?,?,?)")
    .run(name.trim(), normalized, passwordHash);
  const userId = Number(result.lastInsertRowid);

  const raw = token();
  db.prepare("INSERT INTO email_verification_tokens(user_id,token_hash,expires_at) VALUES(?,?,?)")
    .run(userId, hashToken(raw), now()+60*60*24);
  await sendVerificationEmail(normalized, raw);

  res.status(201).json({ message: "Cuenta creada. Revisa tu correo para verificarla." });
}

export async function verifyEmail(req, res) {
  const raw = req.query.token || "";
  const row = db.prepare(`
    SELECT * FROM email_verification_tokens
    WHERE token_hash=? AND used_at IS NULL AND expires_at>?
    ORDER BY id DESC LIMIT 1
  `).get(hashToken(raw), now());
  if (!row) return res.status(400).json({ error: "Enlace inválido o expirado." });

  db.prepare("UPDATE users SET email_verified_at=CURRENT_TIMESTAMP WHERE id=?").run(row.user_id);
  db.prepare("UPDATE email_verification_tokens SET used_at=? WHERE id=?").run(now(), row.id);
  res.json({ message: "Correo verificado correctamente. Ya puedes iniciar sesión." });
}

export async function resendVerification(req, res) {
  const { email } = req.body || {};
  const user = db.prepare("SELECT * FROM users WHERE email=?").get((email||"").trim().toLowerCase());
  if (!user || user.email_verified_at) return res.json({ message: "Si la cuenta existe y necesita verificación, recibirás un correo." });

  const raw = token();
  db.prepare("INSERT INTO email_verification_tokens(user_id,token_hash,expires_at) VALUES(?,?,?)")
    .run(user.id, hashToken(raw), now()+60*60*24);
  await sendVerificationEmail(user.email, raw);
  res.json({ message: "Si la cuenta existe y necesita verificación, recibirás un correo." });
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  const user = db.prepare("SELECT * FROM users WHERE email=?").get((email || "").trim().toLowerCase());
  if (!user || !(await bcrypt.compare(password || "", user.password_hash))) {
    return res.status(401).json({ error: "Correo o contraseña incorrectos." });
  }
  if (!user.email_verified_at) return res.status(403).json({ error: "Debes verificar tu correo antes de iniciar sesión." });
  req.session.userId = user.id;
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
}

export function me(req, res) {
  if (!req.session.userId) return res.json({ user: null });
  const user = db.prepare("SELECT id,name,email,email_verified_at,created_at FROM users WHERE id=?").get(req.session.userId);
  res.json({ user: user || null });
}

export function logout(req, res) {
  req.session.destroy(() => res.json({ ok: true }));
}

export function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: "Debes iniciar sesión." });
  next();
}

export async function requestPasswordReset(req, res) {
  const { email } = req.body || {};
  const user = db.prepare("SELECT * FROM users WHERE email=?").get((email||"").trim().toLowerCase());
  if (user) {
    const raw = token();
    db.prepare("INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES(?,?,?)")
      .run(user.id, hashToken(raw), now()+60*30);
    await sendPasswordResetEmail(user.email, raw);
  }
  res.json({ message: "Si el correo existe, recibirás instrucciones para restablecer tu contraseña." });
}

export async function resetPassword(req, res) {
  const { token: raw, password } = req.body || {};
  if (!raw || !password || password.length < 8) return res.status(400).json({ error: "Token y contraseña de mínimo 8 caracteres son obligatorios." });
  const row = db.prepare(`
    SELECT * FROM password_reset_tokens
    WHERE token_hash=? AND used_at IS NULL AND expires_at>?
    ORDER BY id DESC LIMIT 1
  `).get(hashToken(raw), now());
  if (!row) return res.status(400).json({ error: "Enlace inválido o expirado." });

  const hash = await bcrypt.hash(password, 12);
  db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(hash, row.user_id);
  db.prepare("UPDATE password_reset_tokens SET used_at=? WHERE id=?").run(now(), row.id);
  res.json({ message: "Contraseña actualizada correctamente." });
}
