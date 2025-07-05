const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuario.controller');
const auth = require('../middlewares/auth');
const checkPerfil = require('../middlewares/checkPerfil');

router.put('/me', auth, usuarioController.atualizarPerfil);
router.get('/me', auth, usuarioController.perfil);
router.put('/:id/atribuir-funcao-comando', auth, checkPerfil([4]), usuarioController.atribuirFuncaoComando);
router.delete('/:id', auth, checkPerfil([3, 4]), usuarioController.excluirUsuario);
router.put('/:id/rebaixar', auth, checkPerfil([3, 4]), usuarioController.rebaixarParaOM);
router.put('/:id/atribuir-funcao', auth, checkPerfil([3, 4]), usuarioController.atribuirFuncaoTecnica);
router.put('/:id/rebaixar-comando', auth, checkPerfil([4]), usuarioController.rebaixarComando);
router.get('/', auth, checkPerfil([3, 4]), usuarioController.listar);
router.get('/usuarios-tecnicos-por-funcao', auth, usuarioController.listarUsuariosTecnicosPorFuncao);
router.get('/estatisticas/usuarios-hoje', auth, checkPerfil([3, 4]), usuarioController.contarUsuariosHoje);
router.get('/:id', auth, checkPerfil([3, 4]), usuarioController.buscarPorId);

module.exports = router;