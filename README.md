# Psicología Oscura Proyecto X — MVP
Estructura organizada para despliegue.

## Carpetas
- `frontend/` interfaz
- `backend/` API y servidor
- `backend/storage/books/` originales
- `backend/storage/previews/` previews

## Local
```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run previews
npm start
```

Nunca subas `.env` ni claves reales de Stripe/SMTP al repositorio.
