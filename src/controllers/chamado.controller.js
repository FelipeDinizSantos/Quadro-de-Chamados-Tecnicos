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

// Atribuir chamado a outro usuário
// exports.atribuir = async (req, res) => {
//   const { id } = req.params;
//   const { atribuido_para } = req.body;

//   try {
//     await pool.query(
//       'UPDATE chamados SET atribuido_para = ?, atualizado_em = NOW() WHERE id = ?',
//       [atribuido_para, id]
//     );
//     res.json({ message: 'Chamado atribuído com sucesso' });
//   } catch (err) {
//     res.status(500).json({ error: 'Erro ao atribuir chamado' });
//   }
// };

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
