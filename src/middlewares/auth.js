const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
require('dotenv').config();

const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; 

  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, authConfig.secret);

    req.user = decoded; 
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
};

module.exports = auth;
