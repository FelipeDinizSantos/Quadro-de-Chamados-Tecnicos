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

exports.criarCategoria = async (req, res) => {
  try {
    const { nome } = req.body;

    if (!nome || nome.trim() === '') {
      return res.status(400).json({ error: 'O nome da categoria é obrigatório' });
    }

    // Verifica se já existe categoria com o mesmo nome
    const [existente] = await pool.query(
      'SELECT id FROM categorias_chamado WHERE nome = ?',
      [nome.trim()]
    );

    if (existente.length > 0) {
      return res.status(409).json({ error: 'Já existe uma categoria com esse nome' });
    }

    const [result] = await pool.query(
      'INSERT INTO categorias_chamado (nome) VALUES (?)',
      [nome.trim()]
    );

    res.status(201).json({ mensagem: "Categoria criada com sucesso!", id: result.insertId, nome: nome.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
};

exports.editarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome } = req.body;

    if (!nome || nome.trim() === '') {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório.' });
    }

    const [[categoria]] = await pool.query(
      'SELECT * FROM categorias_chamado WHERE id = ?',
      [id]
    );

    if (!categoria) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    const [[duplicada]] = await pool.query(
      'SELECT * FROM categorias_chamado WHERE nome = ? AND id != ?',
      [nome.trim(), id]
    );

    if (duplicada) {
      return res.status(409).json({ error: 'Já existe outra categoria com esse nome.' });
    }

    await pool.query(
      'UPDATE categorias_chamado SET nome = ? WHERE id = ?',
      [nome.trim(), id]
    );

    res.json({ message: 'Categoria atualizada com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar categoria.' });
  }
};

exports.excluirCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const [[categoria]] = await pool.query(
      'SELECT * FROM categorias_chamado WHERE id = ?',
      [id]
    );

    if (!categoria) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    const [[{ totalChamados }]] = await pool.query(
      'SELECT COUNT(*) AS totalChamados FROM chamados WHERE categoria_id = ?',
      [id]
    );

    if (totalChamados > 0) {
      return res.status(400).json({
        error: 'Não é possível excluir a categoria pois existem chamados vinculados.'
      });
    }

    await pool.query('DELETE FROM categorias_chamado WHERE id = ?', [id]);

    res.json({ message: 'Categoria excluída com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir categoria.' });
  }
};