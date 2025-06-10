const pool = require('../config/db');

exports.listarCategorias = async (req, res) => {
  try {
    const [categorias] = await pool.query('SELECT * FROM categorias_chamado ORDER BY nome ASC');
    res.json(categorias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
};