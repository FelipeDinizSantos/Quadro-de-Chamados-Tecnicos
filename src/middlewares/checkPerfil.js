const checkPerfil = (perfisPermitidos) => {
  return (req, res, next) => {
    const { perfil_id } = req.user;

    if (!perfisPermitidos.includes(perfil_id)) {
      return res.status(403).json({ error: 'Acesso negado para este perfil' });
    }

    next();
  };
};

module.exports = checkPerfil;
