const pool = require('../config/db');

// Criar resposta para um chamado
exports.responder = async (req, res) => {
  const { chamado_id } = req.params;
  const { mensagem } = req.body;
  const autor_id = req.user.id;

  try {
    // Verifica se o chamado existe
    const [[chamado]] = await pool.query('SELECT * FROM chamados WHERE id = ?', [chamado_id]);
    if (!chamado) return res.status(404).json({ error: 'Chamado não encontrado' });

    // Verifica se o usuário pode responder
    const isCriador = chamado.criado_por === autor_id;
    const isComando = req.user.perfil_id === 3;
    const isTecnicoResponsavel = req.user.perfil_id === 2 && req.user.funcao_tecnica_id === chamado.atribuido_funcao_tecnica_id;

    if (!isCriador && !isComando && !isTecnicoResponsavel) {
      return res.status(403).json({ error: 'Você não tem permissão para responder este chamado' });
    }

    // Insere a resposta
    await pool.query(
      'INSERT INTO respostas_chamado (chamado_id, autor_id, mensagem) VALUES (?, ?, ?)',
      [chamado_id, autor_id, mensagem]
    );

    res.status(201).json({ message: 'Resposta registrada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar resposta' });
  }
};

// Listar respostas de um chamado
exports.listar = async (req, res) => {
  const { chamado_id } = req.params;

  try {
    const [respostas] = await pool.query(
      `SELECT r.*, u.nome AS autor_nome
       FROM respostas_chamado r
       JOIN usuarios u ON r.autor_id = u.id
       WHERE r.chamado_id = ?
       ORDER BY r.criado_em ASC`,
      [chamado_id]
    );

    res.json(respostas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar respostas' });
  }
};

// Editar uma resposta existente
exports.editar = async (req, res) => {
  const { id } = req.params; // ID da resposta
  const { mensagem } = req.body;
  const usuarioId = req.user.id;

  try {
    // Verifica se a resposta existe e pertence ao usuário
    const [[resposta]] = await pool.query(
      'SELECT * FROM respostas_chamado WHERE id = ?',
      [id]
    );

    if (!resposta) {
      return res.status(404).json({ error: 'Resposta não encontrada' });
    }

    if (resposta.autor_id !== usuarioId) {
      return res.status(403).json({ error: 'Você não tem permissão para editar esta resposta' });
    }

    // Atualiza a resposta
    await pool.query(
      'UPDATE respostas_chamado SET mensagem = ? WHERE id = ?',
      [mensagem, id]
    );

    res.json({ message: 'Resposta editada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao editar resposta' });
  }
};
