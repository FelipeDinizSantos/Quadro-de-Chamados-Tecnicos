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

// Listar todos os chamados (Comando / adm)
router.get('/todos', auth, checkPerfil([3, 4]), chamadoController.listarTodos);

// Filtrar chamados (Controle de acesso feito diretamente na função)
router.get('/filtro', auth, chamadoController.filtrar);

// Atualizar status do chamado (Técnico ou criador)
router.put('/:id/status', auth, chamadoController.atualizarStatus);

// Ver detalhes do chamado
router.get('/:id', auth, chamadoController.detalhes);

// Excluir chamado (criador, Comando e adm)
router.delete('/:id', auth, chamadoController.excluir);

router.get('/estatisticas/chamados-hoje', auth, chamadoController.contarChamadosHoje);
router.get('/estatisticas/taxa-resolucao', auth, chamadoController.calcularTaxaResolucao);

module.exports = router;