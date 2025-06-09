const pool = require('../config/db');

// Criar chamado
exports.criar = async (req, res) => {
  const { titulo, descricao, categoria_id, atribuido_funcao_tecnica_id } = req.body;
  const criado_por = req.user.id;

  try {
    await pool.query(
      'INSERT INTO chamados (titulo, descricao, categoria_id, criado_por, atribuido_funcao_tecnica_id) VALUES (?, ?, ?, ?, ?)',
      [titulo, descricao, categoria_id, criado_por, atribuido_funcao_tecnica_id]
    );
    res.status(201).json({ message: 'Chamado criado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar chamado' });
  }
};

// Listar chamados do usuário logado
exports.listarMeus = async (req, res) => {
  try {
    const [chamados] = await pool.query('SELECT * FROM chamados WHERE criado_por = ?', [req.user.id]);
    res.json(chamados);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar seus chamados' });
  }
};

// Listar chamados atribuídos ao técnico
exports.listarRecebidos = async (req, res) => {
  try {
    console.log(req.user);
    console.log("ID da função técnica: "+ req.user.funcao_tecnica_id);
    const [chamados] = await pool.query('SELECT * FROM chamados WHERE atribuido_funcao_tecnica_id = ?', [req.user.funcao_tecnica_id]);
    res.json(chamados);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar chamados recebidos' });
  }
};

// Listar todos os chamados (comando)
exports.listarTodos = async (req, res) => {
  try {
    const [chamados] = await pool.query('SELECT * FROM chamados');
    
    res.json(chamados);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar todos os chamados' });
  }
};

// Atualizar status do chamado
exports.atualizarStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE chamados SET status = ?, atualizado_em = NOW() WHERE id = ?',
      [status, id]
    );
    res.json({ message: 'Status atualizado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar status do chamado' });
  }
};

// Detalhes do chamado
exports.detalhes = async (req, res) => {
  const { id } = req.params;

  try {
    const [[chamado]] = await pool.query('SELECT * FROM chamados WHERE id = ?', [id]);

    const [respostas] = await pool.query(
      'SELECT r.*, u.nome as autor_nome FROM respostas_chamado r JOIN usuarios u ON r.autor_id = u.id WHERE chamado_id = ?',
      [id]
    );

    res.json({ chamado, respostas });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar detalhes do chamado' });
  }
};

// Excluir chamado  
exports.excluir = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userPerfil = req.user.perfil_id;

  try {
    const [[chamado]] = await pool.query('SELECT criado_por FROM chamados WHERE id = ?', [id]);

    if (!chamado) {
      return res.status(404).json({ error: 'Chamado não encontrado' });
    }

    if (chamado.criado_por !== userId && userPerfil !== 3) {
      return res.status(403).json({ error: 'Você não tem permissão para excluir este chamado' });
    }

    await pool.query('DELETE FROM chamados WHERE id = ?', [id]);
    res.json({ message: 'Chamado excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir chamado' });
  }
};

// Filtrar chamados por status, categoria e data
exports.filtrar = async (req, res) => {
  const { status, categoria_id, data_inicio, data_fim } = req.query;
  const user = req.user;

  try {
    let query = 'SELECT * FROM chamados WHERE 1=1';
    const params = [];

    // Filtros 
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (categoria_id) {
      query += ' AND categoria_id = ?';
      params.push(categoria_id);
    }

    if (data_inicio) {
      query += ' AND DATE(criado_em) >= ?';
      params.push(data_inicio);
    }

    if (data_fim) {
      query += ' AND DATE(criado_em) <= ?';
      params.push(data_fim);
    }

    // Restrições por perfil
    if (user.perfil_id === 1) {
      query += ' AND criado_por = ?';
      params.push(user.id);
    } else if (user.perfil_id === 2) {
      query += ' AND atribuido_funcao_tecnica_id = ?';
      params.push(user.funcao_tecnica_id);
    }
    // Comando (perfil_id === 3) vê tudo

    const [result] = await pool.query(query, params);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao filtrar chamados' });
  }
};