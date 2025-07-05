const pool = require('../config/db');
const { logAtividade } = require('../services/log.service');

// Criar chamado
exports.criar = async (req, res) => {
  const { titulo, descricao, categoria_id, atribuido_funcao_tecnica_id, atribuido_usuario_id } = req.body;
  const criado_por = req.user.id;

  try {
    if (atribuido_usuario_id) {
      const [usuario] = await pool.query(
        'SELECT perfil_id FROM usuarios WHERE id = ?',
        [atribuido_usuario_id]
      );

      if (usuario.length === 0) {
        return res.status(400).json({ error: 'Usuário atribuído não encontrado.' });
      }

      const perfilTecnicoId = 2;

      if (usuario[0].perfil_id !== perfilTecnicoId) {
        return res.status(400).json({ error: 'Somente usuários com perfil técnico podem ser atribuídos a chamados.' });
      }
    }

    const chamadoCriado = await pool.query(
      'INSERT INTO chamados (titulo, descricao, categoria_id, criado_por, atribuido_funcao_tecnica_id, atribuido_usuario_id) VALUES (?, ?, ?, ?, ?, ?)',
      [titulo, descricao, categoria_id, criado_por, atribuido_funcao_tecnica_id, atribuido_usuario_id]
    );

    const year = new Date().getFullYear();
    const protocolo = `${String(chamadoCriado.insertId).padStart(6, '0')}-${year}`;

    console.log(await pool.query(
      `UPDATE chamados SET protocolo=? WHERE id=?`,
      [protocolo, chamadoCriado.insertId]
    ));
    await logAtividade(req.user.id, 'chamado_criado', `ID: ${chamadoCriado.insertId} \n Titulo: ${titulo} \n Descrição: ${descricao}`);
    res.status(201).json({ message: 'Chamado criado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar chamado' });
  }
};

// Listar chamados do usuário logado
exports.listarMeus = async (req, res) => {
  try {
    const [chamados] = await pool.query(
      `
      SELECT
        c.id,
        c.titulo,
        c.descricao,
        c.status,
        c.criado_em,
        cat.nome AS categoria_nome,
        ft.nome AS funcao_tecnica_nome,
        u.id AS tecnico_id,
        u.nome AS tecnico_nome,
        u.email AS tecnico_email
      FROM chamados c
      LEFT JOIN categorias_chamado cat ON c.categoria_id = cat.id
      LEFT JOIN funcoes_tecnicas ft ON c.atribuido_funcao_tecnica_id = ft.id
      LEFT JOIN usuarios u ON c.atribuido_usuario_id = u.id
      WHERE c.criado_por = ?
      ORDER BY c.criado_em DESC
      `,
      [req.user.id]
    );

    res.json(chamados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar seus chamados' });
  }
};

// Listar chamados atribuídos ao técnico
exports.listarRecebidos = async (req, res) => {
  try {
    const tecnicoId = req.user.id;

    const [chamados] = await pool.query(
      `SELECT 
        c.*, 
        u.nome AS nome_criador, 
        u.email AS email_criador
      FROM chamados c
      JOIN usuarios u ON c.criado_por = u.id
      WHERE c.atribuido_usuario_id = ?`,
      [tecnicoId]
    );

    res.json(chamados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar chamados recebidos' });
  }
};

// Listar todos os chamados (comando)
exports.listarTodos = async (req, res) => {
  try {
    const [chamados] = await pool.query(`
      SELECT
        c.id,
        c.titulo,
        c.descricao,
        c.status,
        c.criado_em,
        cat.nome AS categoria_nome,
        ft.nome AS funcao_tecnica_nome,
        u.id AS tecnico_id,
        u.nome AS tecnico_nome,
        u.email AS tecnico_email,
        uc.id AS criador_id,
        uc.nome AS criador_nome,
        uc.email AS criador_email
      FROM chamados c
      LEFT JOIN categorias_chamado cat ON c.categoria_id = cat.id
      LEFT JOIN funcoes_tecnicas ft ON c.atribuido_funcao_tecnica_id = ft.id
      LEFT JOIN usuarios u ON c.atribuido_usuario_id = u.id
      LEFT JOIN usuarios uc ON c.criado_por = uc.id
      ORDER BY c.criado_em DESC
      `);

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

    await logAtividade(req.user.id, 'chamado_status_atualizado', `Novo status: ${status} \n ID do chamado: ${id}`)
    res.json({ message: 'Status atualizado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar status do chamado' });
  }
};

// Detalhes do chamado
exports.detalhes = async (req, res) => {
  const { id } = req.params;

  try {
    const [[chamado]] = await pool.query(`
    SELECT
      c.id,
      c.titulo,
      c.descricao,
      c.status,
      c.criado_em,
      cat.nome AS categoria_nome,
      ft.nome AS funcao_tecnica_nome,
      u.id AS tecnico_id,
      u.nome AS tecnico_nome,
      u.email AS tecnico_email
      FROM chamados c
      LEFT JOIN categorias_chamado cat ON c.categoria_id = cat.id
      LEFT JOIN funcoes_tecnicas ft ON c.atribuido_funcao_tecnica_id = ft.id
      LEFT JOIN usuarios u ON c.atribuido_usuario_id = u.id
      WHERE c.id = ?  
    `, [id]);

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

exports.contarChamadosHoje = async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT COUNT(*) as total
      FROM chamados
      WHERE DATE(criado_em) = CURDATE()
    `);

    res.json({ total: result[0].total });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao contar chamados de hoje' });
  }
};

// Calcular taxa de resolução de chamados
exports.calcularTaxaResolucao = async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status IN ('concluido', 'fechado') THEN 1 ELSE 0 END) AS resolvidos
      FROM chamados
    `);

    const totalChamados = result[0].total;
    const chamadosResolvidos = result[0].resolvidos;

    const taxa = totalChamados > 0
      ? Math.round((chamadosResolvidos / totalChamados) * 100)
      : 0;

    res.json({
      taxa,
      total: totalChamados,
      resolvidos: chamadosResolvidos,
      pendentes: totalChamados - chamadosResolvidos
    });
  } catch (err) {
    console.error('Erro ao calcular taxa de resolução:', err);
    res.status(500).json({ error: 'Erro ao calcular taxa de resolução' });
  }
};