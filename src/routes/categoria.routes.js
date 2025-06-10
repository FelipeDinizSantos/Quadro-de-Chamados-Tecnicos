const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const checkPerfil = require('../middlewares/checkPerfil');

const categoriaController = require('../controllers/categoria.controller');

router.delete('/:id', auth, checkPerfil([3, 4]), categoriaController.excluirCategoria);
router.put('/:id', auth, checkPerfil([3, 4]), categoriaController.editarCategoria);
router.get('/', auth, categoriaController.listarCategorias);
router.post('/', auth, checkPerfil([3, 4]), categoriaController.criarCategoria);

module.exports = router;