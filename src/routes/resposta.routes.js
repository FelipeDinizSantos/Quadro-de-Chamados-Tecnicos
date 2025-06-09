const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const respostaController = require('../controllers/resposta.controller');

// Criar uma nova resposta para um chamado
router.post('/:chamado_id', auth, respostaController.responder);

// Listar respostas de um chamado
router.get('/:chamado_id', auth, respostaController.listar);

// Editar uma resposta (somente autor)
router.put('/editar/:id', auth, respostaController.editar);

module.exports = router;
