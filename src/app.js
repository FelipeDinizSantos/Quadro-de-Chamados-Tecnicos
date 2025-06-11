const express = require('express');
const cors = require('cors');
const app = express();

require('dotenv').config();

app.use(cors());
app.use(express.json());

const usuarioRoutes = require('./routes/usuario.routes');
const chamadoRoutes = require('./routes/chamado.routes');
const respostaRoutes = require('./routes/resposta.routes');
const authRoutes = require('./routes/auth.routes');
const categoriaChamadosRoutes = require('./routes/categoria.routes');
const logsRoutes = require('./routes/logs.routes');

app.use('/api/usuarios', usuarioRoutes);
app.use('/api/chamados', chamadoRoutes);
app.use('/api/respostas', respostaRoutes);
app.use('/api/categorias-chamados', categoriaChamadosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/logs', logsRoutes);

app.get('/api', (req, res) => {
  res.send('API Projeto EB Rodando!');
});

module.exports = app;
