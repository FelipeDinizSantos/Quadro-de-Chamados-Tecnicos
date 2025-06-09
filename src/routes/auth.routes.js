const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');

// Registro
router.post('/registro', usuarioController.registrar);

module.exports = router;
