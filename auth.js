const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Register new user
function registerUser(email, password, fullName) {
  return new Promise((resolve, reject) => {
    const userId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);

    db.run(
      'INSERT INTO users (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)',
      [userId, email, passwordHash, fullName],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            reject(new Error('Email already exists'));
          } else {
            reject(err);
          }
        } else {
          const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
          resolve({ userId, email, fullName, token });
        }
      }
    );
  });
}

// Login user
function loginUser(email, password) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) {
        reject(err);
      } else if (!user) {
        reject(new Error('User not found'));
      } else {
        const isValid = bcrypt.compareSync(password, user.password_hash);
        if (!isValid) {
          reject(new Error('Invalid password'));
        } else {
          // Update last login
          db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

          const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
          );
          resolve({ userId: user.id, email: user.email, fullName: user.full_name, token });
        }
      }
    });
  });
}

// Verify JWT token middleware
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = {
  registerUser,
  loginUser,
  verifyToken
};
