const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.registrar = async (req, res) => {
  const { nome, email, senha, perfil_id } = req.body;

  try {
    const hash = await bcrypt.hash(senha, 10);
    const [rows] = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, perfil_id) VALUES (?, ?, ?, ?)',
      [nome, email, hash, perfil_id]
    );
    res.status(201).json({ message: 'Usuário registrado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
};

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (!rows.length) return res.status(401).json({ error: 'Usuário não encontrado' });

    const usuario = rows[0];
    const match = await bcrypt.compare(senha, usuario.senha_hash);
    if (!match) return res.status(401).json({ error: 'Senha incorreta' });

    const token = jwt.sign({ id: usuario.id, perfil_id: usuario.perfil_id }, process.env.JWT_SECRET, {
      expiresIn: '8h',
    });

    res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, perfil_id: usuario.perfil_id } });
  } catch (err) {
    res.status(500).json({ error: 'Erro no login' });
  }
};
