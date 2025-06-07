const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuario.controller');
const auth = require('../middlewares/auth');
const checkPerfil = require('../middlewares/checkPerfil');

// ROTAS DE AUTENTICAÇÃO
router.post('/register', usuarioController.registrar);
router.post('/login', usuarioController.login);

// ROTAS PROTEGIDAS
router.get('/me', auth, usuarioController.perfil); // Qualquer usuário logado

// EXEMPLO: Rota apenas para Comando (perfil_id = 3)
router.get('/admin', auth, checkPerfil([3]), (req, res) => {
  res.json({ mensagem: 'Acesso autorizado para perfil Comando' });
});

module.exports = router;
