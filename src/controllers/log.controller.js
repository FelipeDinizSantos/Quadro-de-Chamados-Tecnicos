const pool = require('../config/db');

exports.listarLogs = async (req, res) => {
    try {
        const { usuario_id, data_inicio, data_fim, acao } = req.query;

        let query = `
            SELECT l.id, l.usuario_id, u.nome AS usuario_nome, l.acao, l.detalhes, l.data
            FROM logs_sistema l
            JOIN usuarios u ON l.usuario_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (usuario_id) {
            query += ' AND l.usuario_id = ?';
            params.push(usuario_id);
        }

        if (acao) {
            query += ' AND l.acao LIKE ?';
            params.push(`%${acao}%`);
        }

        if (data_inicio) {
            query += ' AND l.data >= ?';
            params.push(data_inicio);
        }

        if (data_fim) {
            query += ' AND l.data <= ?';
            params.push(data_fim);
        }

        query += ' ORDER BY l.data DESC';

        const [logs] = await pool.query(query, params);

        res.json(logs);
    } catch (err) {
        console.error('Erro ao listar logs:', err);
        res.status(500).json({ error: 'Erro ao listar logs do sistema' });
    }
};
