import "dotenv/config";
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import db from "./db.js";
import { register, login, me, logout, requireAuth, verifyEmail, resendVerification, requestPasswordReset, resetPassword } from "./auth.js";
import { hasPremium, status as subscriptionStatus, checkout, webhook } from "./subscriptions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || `http://localhost:${port}`;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(cookieParser());

app.post("/api/subscriptions/webhook", express.raw({ type: "application/json" }), webhook);

app.use(express.json({ limit: "100kb" }));
app.use(session({
  secret: process.env.SESSION_SECRET || "dev-only-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 30
  }
}));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false });
app.use("/api/auth", authLimiter);

app.get("/api/health", (_, res) => res.json({ ok: true, app: "Proyecto X" }));
app.post("/api/auth/register", register);
app.get("/api/auth/verify-email", verifyEmail);
app.post("/api/auth/resend-verification", resendVerification);
app.post("/api/auth/forgot-password", requestPasswordReset);
app.post("/api/auth/reset-password", resetPassword);
app.post("/api/auth/login", login);
app.get("/api/auth/me", me);
app.post("/api/auth/logout", logout);

app.get("/api/books", (_, res) => {
  res.json(db.prepare("SELECT id,title,category,description FROM books ORDER BY created_at").all());
});

app.get("/api/books/:id/preview", (req, res) => {
  const book = db.prepare("SELECT * FROM books WHERE id=?").get(req.params.id);
  if (!book) return res.status(404).json({ error: "Ebook no encontrado." });
  const fullPath = path.join(process.cwd(), "storage", "books", book.pdf_filename);
  if (!fs.existsSync(fullPath)) return res.status(404).json({ error: "Archivo no disponible." });
  const previewPath = path.join(process.cwd(), "storage", "previews", `${book.id}-preview.pdf`);
  if (!fs.existsSync(previewPath)) return res.status(503).json({ error: "Vista previa aún no generada." });
  res.sendFile(previewPath, { headers: { "Content-Disposition": `inline; filename="${book.id}-preview.pdf"` } });
});

app.get("/api/me/subscription", subscriptionStatus);

app.post("/api/subscriptions/checkout", requireAuth, checkout);

app.get("/api/me/library", requireAuth, (req, res) => {
  const premium = hasPremium(req.session.userId);
  const books = db.prepare("SELECT id,title,category,description FROM books ORDER BY created_at").all();
  res.json({ premium, books: premium ? books : [] });
});

app.get("/api/books/:id/full", requireAuth, (req, res) => {
  if (!hasPremium(req.session.userId)) return res.status(403).json({ error: "Necesitas una suscripción Premium activa." });
  const book = db.prepare("SELECT * FROM books WHERE id=?").get(req.params.id);
  if (!book) return res.status(404).json({ error: "Ebook no encontrado." });
  const fullPath = path.join(process.cwd(), "storage", "books", book.pdf_filename);
  if (!fs.existsSync(fullPath)) return res.status(404).json({ error: "Archivo no disponible." });
  res.sendFile(fullPath, { headers: { "Content-Disposition": `inline; filename="${book.pdf_filename}"` } });
});

app.use(express.static(path.resolve("../frontend")));
app.get("*", (_, res) => res.sendFile(path.resolve("../frontend/index.html")));

app.listen(port, () => console.log(`Proyecto X backend running on http://localhost:${port}`));
