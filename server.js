require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const db = require('./database');
const { registerUser, loginUser, verifyToken } = require('./auth');
const { encryptFile, decryptFile, encryptText, decryptText, generateSecureFileName } = require('./encryption');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory
const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    cb(null, generateSecureFileName(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 1073741824 } // 1GB default
});

// ========================================
// AUTH ROUTES
// ========================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    const result = await registerUser(email, password, fullName);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
});

// ========================================
// VAULT ROUTES
// ========================================

// Create vault
app.post('/api/vaults', verifyToken, (req, res) => {
  const { title, description, isPublic } = req.body;
  const vaultId = uuidv4();

  db.run(
    'INSERT INTO vaults (id, user_id, title, description, is_public) VALUES (?, ?, ?, ?, ?)',
    [vaultId, req.user.userId, title, description, isPublic ? 1 : 0],
    function(err) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({
          success: true,
          data: { vaultId, title, description, isPublic }
        });
      }
    }
  );
});

// Get all user vaults
app.get('/api/vaults', verifyToken, (req, res) => {
  db.all(
    'SELECT * FROM vaults WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.userId],
    (err, vaults) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, data: vaults });
      }
    }
  );
});

// Get single vault
app.get('/api/vaults/:vaultId', verifyToken, (req, res) => {
  db.get(
    'SELECT * FROM vaults WHERE id = ?',
    [req.params.vaultId],
    (err, vault) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else if (!vault) {
        res.status(404).json({ success: false, error: 'Vault not found' });
      } else if (vault.user_id !== req.user.userId && !vault.is_public) {
        res.status(403).json({ success: false, error: 'Access denied' });
      } else {
        // Get files in vault
        db.all(
          'SELECT id, file_name, file_type, file_size, mime_type, uploaded_at FROM files WHERE vault_id = ?',
          [vault.id],
          (err, files) => {
            res.json({ success: true, data: { ...vault, files: files || [] } });
          }
        );
      }
    }
  );
});

// ========================================
// FILE UPLOAD ROUTES
// ========================================

// Upload file to vault
app.post('/api/vaults/:vaultId/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { vaultId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Verify vault ownership
    db.get(
      'SELECT * FROM vaults WHERE id = ? AND user_id = ?',
      [vaultId, req.user.userId],
      async (err, vault) => {
        if (err || !vault) {
          fs.unlinkSync(file.path); // Delete uploaded file
          return res.status(403).json({ success: false, error: 'Vault not found or access denied' });
        }

        // Encrypt file content
        const encryptedContent = encryptFile(file.path);
        const encryptedPath = `${file.path}.enc`;
        fs.writeFileSync(encryptedPath, encryptedContent);
        fs.unlinkSync(file.path); // Delete unencrypted file

        // Save file metadata
        const fileId = uuidv4();
        db.run(
          `INSERT INTO files (id, vault_id, file_name, file_type, file_size, encrypted_path, mime_type)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [fileId, vaultId, file.originalname, path.extname(file.originalname), file.size, encryptedPath, file.mimetype],
          function(err) {
            if (err) {
              res.status(500).json({ success: false, error: err.message });
            } else {
              res.json({
                success: true,
                data: {
                  fileId,
                  fileName: file.originalname,
                  fileSize: file.size,
                  mimeType: file.mimetype
                }
              });
            }
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download/view file
app.get('/api/files/:fileId', verifyToken, (req, res) => {
  db.get(
    `SELECT f.*, v.user_id
     FROM files f
     JOIN vaults v ON f.vault_id = v.id
     WHERE f.id = ?`,
    [req.params.fileId],
    (err, file) => {
      if (err || !file) {
        return res.status(404).json({ success: false, error: 'File not found' });
      }

      if (file.user_id !== req.user.userId) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }

      try {
        const encryptedData = fs.readFileSync(file.encrypted_path, 'utf8');
        const decryptedBuffer = decryptFile(encryptedData);

        res.setHeader('Content-Type', file.mime_type);
        res.setHeader('Content-Disposition', `inline; filename="${file.file_name}"`);
        res.send(decryptedBuffer);
      } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to decrypt file' });
      }
    }
  );
});

// ========================================
// TIME-LOCKED CONTENT ROUTES
// ========================================

// Create time-locked message
app.post('/api/vaults/:vaultId/time-lock', verifyToken, (req, res) => {
  const { vaultId } = req.params;
  const { contentType, content, unlockDate, recipientEmail } = req.body;

  // Encrypt content
  const encryptedContent = encryptText(content);
  const lockId = uuidv4();

  db.run(
    `INSERT INTO time_locked_content (id, vault_id, content_type, encrypted_content, unlock_date, recipient_email)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [lockId, vaultId, contentType, encryptedContent, unlockDate, recipientEmail],
    function(err) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({
          success: true,
          data: { lockId, unlockDate, recipientEmail }
        });
      }
    }
  );
});

// Get unlocked messages (admin endpoint - would run via cron job in production)
app.get('/api/time-locked/check', verifyToken, (req, res) => {
  db.all(
    `SELECT * FROM time_locked_content
     WHERE unlock_date <= datetime('now') AND is_delivered = 0`,
    (err, messages) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        // Decrypt messages
        const decryptedMessages = messages.map(msg => ({
          ...msg,
          content: decryptText(msg.encrypted_content)
        }));
        res.json({ success: true, data: decryptedMessages });
      }
    }
  );
});

// ========================================
// SHARING ROUTES
// ========================================

// Share vault with another user
app.post('/api/vaults/:vaultId/share', verifyToken, (req, res) => {
  const { vaultId } = req.params;
  const { email, permissionLevel } = req.body;

  const shareId = uuidv4();

  db.run(
    'INSERT INTO vault_shares (id, vault_id, shared_with_email, permission_level) VALUES (?, ?, ?, ?)',
    [shareId, vaultId, email, permissionLevel || 'view'],
    function(err) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
      } else {
        res.json({ success: true, data: { shareId, email, permissionLevel } });
      }
    }
  );
});

// ========================================
// HEALTH CHECK
// ========================================

// Root endpoint
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head><title>Life Vault API</title><style>body{font-family:system-ui;padding:40px;background:#000;color:#fff}</style></head>
      <body>
        <h1>🔐 Life Vault ARK™ Backend</h1>
        <p>Status: <strong style="color:#0f0">✅ RUNNING</strong></p>
        <h2>API Endpoints:</h2>
        <ul>
          <li>POST /api/auth/register - Register user</li>
          <li>POST /api/auth/login - Login</li>
          <li>POST /api/vaults - Create vault</li>
          <li>GET /api/vaults - List vaults</li>
          <li>POST /api/vaults/:id/upload - Upload file</li>
          <li>GET /api/health - Health check</li>
        </ul>
        <p><a href="/api/health" style="color:#0ff">Test Health Endpoint</a></p>
      </body>
    </html>
  `);
});


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Life Vault API', version: '1.0.0' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Life Vault Backend running on http://localhost:${PORT}`);
  console.log(`📚 API Endpoints:`);
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/vaults`);
  console.log(`   GET  /api/vaults`);
  console.log(`   POST /api/vaults/:vaultId/upload`);
  console.log(`   POST /api/vaults/:vaultId/time-lock`);
  console.log(`   POST /api/vaults/:vaultId/share\n`);
});

module.exports = app;
