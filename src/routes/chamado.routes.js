const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const checkPerfil = require('../middlewares/checkPerfil');
const chamadoController = require('../controllers/chamado.controller');

// Criar chamado (Usuário OM)
router.post('/', auth, checkPerfil([1]), chamadoController.criar);

// Listar chamados do usuário logado
router.get('/meus', auth, chamadoController.listarMeus);

// Listar chamados atribuídos (Técnico)
router.get('/recebidos', auth, checkPerfil([2]), chamadoController.listarRecebidos);

// Listar todos os chamados (Comando)
router.get('/todos', auth, checkPerfil([3]), chamadoController.listarTodos);

// Atualizar status do chamado (Técnico ou criador)
router.put('/:id/status', auth, chamadoController.atualizarStatus);

// Atribuir chamado a outro usuário (com validações)
router.put('/:id/atribuir', auth, chamadoController.atribuir);

// Ver detalhes do chamado
router.get('/:id', auth, chamadoController.detalhes);

module.exports = router;
