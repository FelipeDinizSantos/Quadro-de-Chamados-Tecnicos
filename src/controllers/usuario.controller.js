const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const { logAtividade } = require('../services/log.service');
const req = require('express/lib/request');

require('dotenv').config();

exports.registrar = async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    const [existe] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existe.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }

    const senha_hash = await bcrypt.hash(senha, 10);

    // Cadastro padrão como usuário OM = perfil_id 1 
    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, perfil_id) VALUES (?, ?, ?, ?)',
      [nome, email, senha_hash, 1]
    );

    const novoUsuarioId = [result][0][0].insertId;

    await logAtividade(novoUsuarioId, 'usuario_registrado', `IP: ${req.ip}`);
    res.status(201).json({ message: 'Usuário registrado com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
};

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  try {
    const [[usuario]] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    if (!usuario) {
      await logAtividade(usuario.id, 'login_falha', `IP: ${req.ip} \n Erro: Credenciais inválidas`);
      return res.status(400).json({ error: 'Credenciais inválidas.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      await logAtividade(usuario.id, 'login_falha', `IP: ${req.ip} \n Erro: Credenciais inválidas`);
      return res.status(400).json({ error: 'Credenciais inválidas.' });
    }

    const payload = {
      id: usuario.id,
      nome: usuario.nome,
      perfil_id: usuario.perfil_id,
      funcao_tecnica_id: usuario.funcao_tecnica_id
    };

    const token = jwt.sign(payload, authConfig.secret, {
      expiresIn: authConfig.expiresIn
    });

    await logAtividade(usuario.id, 'login_sucesso', `IP: ${req.ip} \n Erro: Credenciais inválidas`);
    res.json({ token });
  } catch (err) {
    await logAtividade(usuario.id, 'Tentativa de login', `IP: ${req.ip} \n Erro: ${err.message}`);
    res.status(500).json({ error: 'Erro ao realizar login.' });
  }
};

exports.perfil = async (req, res) => {
  try {
    const { id } = req.user;

    const [[usuario]] = await pool.query(
      `SELECT 
         u.id, u.nome, u.email, u.criado_em,
         u.perfil_id, p.nome AS perfil_nome,
         u.funcao_tecnica_id, f.nome AS funcao_tecnica_nome
       FROM usuarios u
       LEFT JOIN perfis p ON u.perfil_id = p.id
       LEFT JOIN funcoes_tecnicas f ON u.funcao_tecnica_id = f.id
       WHERE u.id = ?`,
      [id]
    );

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(usuario);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao obter dados do perfil' });
  }
};

exports.atualizarPerfil = async (req, res) => {
  const { id } = req.user;
  const { nome, email } = req.body;

  if (!nome && !email) {
    return res.status(400).json({ error: 'Informe ao menos um campo para atualização' });
  }

  try {
    if (email) {
      const [[existe]] = await pool.query(
        'SELECT id FROM usuarios WHERE email = ? AND id != ?',
        [email, id]
      );

      if (existe) {
        return res.status(409).json({ error: 'E-mail já está em uso por outro usuário' });
      }
    }

    const campos = [];
    const valores = [];

    if (nome) {
      campos.push('nome = ?');
      valores.push(nome);
    }
    if (email) {
      campos.push('email = ?');
      valores.push(email);
    }

    valores.push(id);

    await pool.query(
      `UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`,
      valores
    );

    await logAtividade(id, 'usuario_editado', `IP: ${req.ip} \n Campos Editados: ${JSON.stringify(req.body)}`);
    res.json({ message: 'Perfil atualizado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
};

exports.listarTodos = async (req, res) => {
  try {
    const comandoId = req.user.id;

    const [usuarios] = await pool.query(`
      SELECT u.id, u.nome, u.email, u.perfil_id, p.nome AS perfil_nome,
             u.funcao_tecnica_id, f.nome AS funcao_tecnica_nome,
             u.criado_em
      FROM usuarios u
      JOIN perfis p ON u.perfil_id = p.id
      LEFT JOIN funcoes_tecnicas f ON u.funcao_tecnica_id = f.id
      WHERE u.id != ?
    `, [comandoId]);

    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
};

exports.buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [[usuario]] = await pool.query(
      `SELECT 
         u.id, u.nome, u.email, u.criado_em,
         u.perfil_id, p.nome AS perfil_nome,
         u.funcao_tecnica_id, f.nome AS funcao_tecnica_nome
       FROM usuarios u
       LEFT JOIN perfis p ON u.perfil_id = p.id
       LEFT JOIN funcoes_tecnicas f ON u.funcao_tecnica_id = f.id
       WHERE u.id = ?`,
      [id]
    );

    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

    // Buscar chamados abertos pelo usuário
    const [chamadosAbertos] = await pool.query(
      `SELECT c.*, cat.nome AS categoria_nome
       FROM chamados c
       JOIN categorias_chamado cat ON c.categoria_id = cat.id
       WHERE c.criado_por = ?
       ORDER BY c.criado_em DESC`,
      [id]
    );

    // Buscar chamados com respostas do usuário 
    let chamadosRespondidos = [];
    if (usuario.perfil_id === 2) {
      const [respostasChamados] = await pool.query(
        `SELECT DISTINCT c.*, cat.nome AS categoria_nome
         FROM respostas_chamado r
         JOIN chamados c ON r.chamado_id = c.id
         JOIN categorias_chamado cat ON c.categoria_id = cat.id
         WHERE r.autor_id = ?
         ORDER BY c.criado_em DESC`,
        [id]
      );
      chamadosRespondidos = respostasChamados;
    }

    // Pegar TODAS as respostas dos chamados abertos e respondidos
    const chamadosIds = [
      ...new Set([
        ...chamadosAbertos.map(c => c.id),
        ...chamadosRespondidos.map(c => c.id),
      ]),
    ];

    let respostasPorChamado = {};
    if (chamadosIds.length > 0) {
      const [todasRespostas] = await pool.query(
        `SELECT 
           r.chamado_id,
           r.id AS resposta_id,
           r.mensagem,
           r.criado_em,
           u.nome AS autor_nome
         FROM respostas_chamado r
         JOIN usuarios u ON r.autor_id = u.id
         WHERE r.chamado_id IN (?)
         ORDER BY r.criado_em ASC`,
        [chamadosIds]
      );

      // Agrupar respostas 
      respostasPorChamado = todasRespostas.reduce((acc, r) => {
        if (!acc[r.chamado_id]) acc[r.chamado_id] = [];
        acc[r.chamado_id].push({
          resposta_id: r.resposta_id,
          mensagem: r.mensagem,
          criado_em: r.criado_em,
          autor_nome: r.autor_nome,
        });
        return acc;
      }, {});
    }

    // Aninhar respostas nos chamados abertos
    const chamadosAbertosComRespostas = chamadosAbertos.map(c => ({
      ...c,
      respostas: respostasPorChamado[c.id] || [],
    }));

    // Aninhar respostas nos chamados respondidos
    const chamadosRespondidosComRespostas = chamadosRespondidos.map(c => ({
      ...c,
      respostas: respostasPorChamado[c.id] || [],
    }));

    res.json({
      usuario,
      chamadosAbertos: chamadosAbertosComRespostas,
      chamadosRespondidos: chamadosRespondidos.length > 0 ? chamadosRespondidosComRespostas : undefined,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao obter dados do perfil' });
  }
};

exports.atribuirFuncaoTecnica = async (req, res) => {
  const { id } = req.params;
  const { funcao_tecnica_id } = req.body;

  try {
    const [[usuario]] = await pool.query(
      `SELECT id, perfil_id FROM usuarios WHERE id = ?`,
      [id]
    );

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (usuario.perfil_id !== 1) {
      return res.status(400).json({ error: 'Apenas usuários OM podem ser promovidos a técnicos' });
    }

    const [[funcao]] = await pool.query(
      `SELECT id FROM funcoes_tecnicas WHERE id = ?`,
      [funcao_tecnica_id]
    );

    if (!funcao) {
      return res.status(400).json({ error: 'Função técnica não encontrada' });
    }

    await pool.query(
      `UPDATE usuarios
       SET perfil_id = 2, funcao_tecnica_id = ?
       WHERE id = ?`,
      [funcao_tecnica_id, id]
    );

    await logAtividade(req.user.id, 'usuario_promovido', `Usuário com ID ${usuario.id}, foi promovido a Técnico pelo usuário de ID ${req.user.id}.`);
    res.json({ message: 'Função técnica atribuída com sucesso. Usuário promovido a Técnico.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atribuir função técnica' });
  }
};

exports.rebaixarParaOM = async (req, res) => {
  const { id } = req.params;

  try {
    const [[usuario]] = await pool.query(
      `SELECT id, perfil_id FROM usuarios WHERE id = ?`,
      [id]
    );

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (usuario.perfil_id !== 2) {
      return res.status(400).json({ error: 'Apenas usuários Técnicos podem ser rebaixados para OM' });
    }

    await pool.query(
      `UPDATE usuarios
       SET perfil_id = 1, funcao_tecnica_id = NULL
       WHERE id = ?`,
      [id]
    );

    await logAtividade(req.user.id, 'usuario_rebaixado', `Usuário Técnico com ID ${id} foi rebaixado para usuário OM pelo usuário de ID ${req.user.id}.`);
    res.json({ message: 'Usuário rebaixado com sucesso para OM. Função técnica removida.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao rebaixar o usuário' });
  }
};

exports.rebaixarComando = async (req, res) => {
  const { id } = req.params;

  // ID do perfil qual o usuário será rebaixado
  let { perfil_id, funcao_tecnica_id } = req.body;

  perfil_id = parseInt(perfil_id);

  try {
    const [[usuario]] = await pool.query(
      `SELECT id, perfil_id FROM usuarios WHERE id = ?`,
      [id]
    );

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (perfil_id > 2) {
      return res.status(400).json({ error: 'Não é possivel rebaixar o usuário para um perfil diferente de Técnico ou OM' });
    }

    if (perfil_id == 2) {
      if (!funcao_tecnica_id) {
        return res.status(400).json({ error: 'Função técnica é obrigatória para rebaixar o usuário para Técnico' });
      }

      const [[funcao]] = await pool.query(
        `SELECT id FROM funcoes_tecnicas WHERE id = ?`,
        [funcao_tecnica_id]
      );

      if (!funcao) {
        return res.status(400).json({ error: 'Função técnica não encontrada para este usuário' });
      }

      await pool.query(
        ` UPDATE usuarios
          SET perfil_id = 2, funcao_tecnica_id = ?
          WHERE id = ?`,
        [funcao_tecnica_id, id]
      );
    }
    
    if (perfil_id === 1) {
      await pool.query(
        ` UPDATE usuarios
          SET perfil_id = 1
          WHERE id = ?`,
        [id]
      );
    }

    await logAtividade(req.user.id, 'comando_rebaixado', `Usuário Comando com ID ${id} foi rebaixado para ${perfil_id === 1 ? 'usuário OM' : 'usuário Técnico'} pelo administrador de ID ${req.user.id}.`);
    res.json({ message: 'Usuário Comando rebaixado com successo' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao rebaixar o usuário' });
  }
}

exports.listarPorPerfil = async (req, res) => {
  try {
    const comandoId = req.user.id;
    const { perfil } = req.query;

    let perfilId;
    if (perfil === 'om') {
      perfilId = 1;
    } else if (perfil === 'tecnico') {
      perfilId = 2;
    } else {
      return res.status(400).json({ error: 'Parâmetro de perfil inválido. Use "om" ou "tecnico".' });
    }

    const [usuarios] = await pool.query(
      `SELECT u.id, u.nome, u.email, u.perfil_id, p.nome AS perfil_nome,
              u.funcao_tecnica_id, f.nome AS funcao_tecnica_nome,
              u.criado_em
       FROM usuarios u
       JOIN perfis p ON u.perfil_id = p.id
       LEFT JOIN funcoes_tecnicas f ON u.funcao_tecnica_id = f.id
       WHERE u.perfil_id = ? AND u.id != ?`,
      [perfilId, comandoId]
    );

    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao filtrar usuários por perfil' });
  }
};

exports.atribuirFuncaoComando = async (req, res) => {
  const { id } = req.params;

  try {
    const [[usuario]] = await pool.query(
      `SELECT id, perfil_id FROM usuarios WHERE id = ?`,
      [id]
    );

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (usuario.perfil_id === 3 || usuario.perfil_id === 4) {
      return res.status(400).json({ error: 'Apenas usuários Técnicos ou OM podem ser promovidos a Comando' });
    }

    await pool.query(
      `UPDATE usuarios
       SET perfil_id = 3, funcao_tecnica_id = null 
       WHERE id = ?`,
      [id]
    );

    await logAtividade(req.user.id, 'usuario_promovido_comando', `Usuário com ID ${usuario.id}, foi promovido a Comando pelo administrador de ID ${req.user.id}.`);
    res.json({ message: 'Função Comando atribuída com sucesso. Usuário promovido a Comando.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atribuir função Comando' });
  }
}

exports.excluirUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const comandoId = req.user.id;

    if (parseInt(id) === comandoId) {
      return res.status(400).json({ error: 'Você não pode excluir a si mesmo.' });
    }

    const [[usuario]] = await pool.query(`SELECT perfil_id FROM usuarios WHERE id = ?`, [id]);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (![1, 2].includes(usuario.perfil_id)) {
      return res.status(403).json({ error: 'Você só pode excluir usuários OM ou Técnicos' });
    }

    // Executa a exclusão
    await pool.query(`DELETE FROM usuarios WHERE id = ?`, [id]);

    await logAtividade(comandoId, 'usuario_excluido', `Usuário com ID ${id} foi excluído pelo usuário ${req.user.nome}.`);
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
};