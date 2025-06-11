const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');
const checkPerfil = require('../middlewares/checkPerfil');

const logController = require('../controllers/log.controller');

router.get('/', auth, checkPerfil([3, 4]), logController.listarLogs);

module.exports = router;
