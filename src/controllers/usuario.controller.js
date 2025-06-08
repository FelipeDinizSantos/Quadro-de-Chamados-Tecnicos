const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.registrar = async (req, res) => {
  const { nome, email, senha, perfil_id } = req.body;

  try {
    const hash = await bcrypt.hash(senha, 10);
    await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, perfil_id) VALUES (?, ?, ?, ?)',
      [nome, email, hash, perfil_id]
    );

    res.status(201).json({ message: 'Usuário registrado com sucesso' });
  } catch (err) {
    console.log(err);
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

    const token = jwt.sign(
      { id: usuario.id, perfil_id: usuario.perfil_id, nome: usuario.nome, funcao_tecnica_id: usuario.funcao_tecnica_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil_id: usuario.perfil_id, 
        funcao_tecnica_id: usuario.funcao_tecnica_id
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro no login' });
  }
};

exports.perfil = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nome, email, perfil_id, funcao_tecnica_id FROM usuarios WHERE id = ?', [
      req.user.id,
    ]);

    console.log(req.user.id);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
};