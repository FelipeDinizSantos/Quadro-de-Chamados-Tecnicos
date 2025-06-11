const pool = require('../config/db');

// Serviço utilitário
async function logAtividade(usuarioId, acao, detalhes = null) {
    try {
        await pool.query(`
      INSERT INTO logs_sistema (usuario_id, acao, detalhes)
      VALUES (?, ?, ?)
    `, [usuarioId, acao, detalhes]);
    } catch (err) {
        console.error("Erro ao registrar log:", err.message);
    }
}

module.exports = { logAtividade };