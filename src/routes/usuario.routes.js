const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuario.controller');
const auth = require('../middlewares/auth');
const checkPerfil = require('../middlewares/checkPerfil');

router.put('/me', auth, usuarioController.atualizarPerfil);
router.get('/me', auth, usuarioController.perfil);

router.delete('/:id', auth, checkPerfil([3]), usuarioController.excluirUsuario);
router.put('/:id/rebaixar', auth, checkPerfil([3]), usuarioController.rebaixarParaOM);
router.put('/:id/atribuir-funcao', auth, checkPerfil([3]), usuarioController.atribuirFuncaoTecnica); 
router.get('/', auth, checkPerfil([3]), usuarioController.listarPorPerfil);
router.get('/', auth, checkPerfil([3]), usuarioController.listarTodos);

router.get('/admin', auth, checkPerfil([3]), (req, res) => res.json({ mensagem: 'Acesso autorizado para perfil Comando' }));
router.get('/:id', auth, checkPerfil([3]), usuarioController.buscarPorId);

module.exports = router;