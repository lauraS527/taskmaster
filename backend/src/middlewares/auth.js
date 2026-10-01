const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // queda { id: ... }
    next();   // deja pasar a la siguiente función
  } catch {
    res.status(401).json({ message: 'Token inválido o vencido' });
  }
};