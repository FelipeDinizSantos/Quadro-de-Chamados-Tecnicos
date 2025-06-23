const pool = require('../config/db');

exports.listarFuncoes = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, nome FROM funcoes_tecnicas');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao listar funções técnicas:', error);
        res.status(500).json({ mensagem: 'Erro ao listar funções técnicas.' });
    }
};