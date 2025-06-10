const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const checkPerfil = require('../middlewares/checkPerfil');

const categoriasController = require('../controllers/categoriasController');

router.get('/', auth, categoriasController.listarCategorias);

module.exports = router;
