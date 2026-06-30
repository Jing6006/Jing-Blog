const bcrypt = require('bcryptjs');
const { LOGIN_PATH } = require('./utils');

function verifyPassword(password) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return false;
  return bcrypt.compare(password || '', hash);
}

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function ensureAuth(req, res, next) {
  if (req.session.authenticated) return next();
  res.redirect(LOGIN_PATH);
}

module.exports = { verifyPassword, hashPassword, ensureAuth };
