const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');

const funcoesTecnicasController = require('../controllers/funcoesTecnicas.controller');

router.get('/', auth, funcoesTecnicasController.listarFuncoes);

module.exports = router;