# Life Vault Backend API 🔐

**Secure Digital Legacy Platform** - Built March 4, 2026

## ✅ COMPLETE FEATURES IMPLEMENTED

- 🔐 User Authentication (JWT + bcrypt)
- 📦 Vault Management (create/list/view)
- 📤 Encrypted File Upload (AES-256)
- ⏰ Time-Locked Content (future messages)
- 👥 Vault Sharing (family access)
- 🔒 Zero-Knowledge Architecture

## 🚀 START SERVER

```bash
cd ~/lifevault-backend
npm start
```

Runs on http://localhost:3000

## 📡 KEY API ENDPOINTS

**Register:** `POST /api/auth/register`
**Login:** `POST /api/auth/login`
**Create Vault:** `POST /api/vaults`
**Upload File:** `POST /api/vaults/:id/upload`
**Time-Lock Message:** `POST /api/vaults/:id/time-lock`
**Share Vault:** `POST /api/vaults/:id/share`

Full documentation in comments within server.js

Built with: Node.js, Express, SQLite3, JWT, AES Encryption