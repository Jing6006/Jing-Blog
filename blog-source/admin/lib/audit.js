const fs = require('fs');
const { DATA_DIR } = require('./utils');

const AUDIT_MAX = 500;

function logAction(action, details = '', ip = '') {
  const file = `${DATA_DIR}/audit.json`;
  fs.mkdirSync(DATA_DIR, { recursive: true });

  let logs = [];
  try {
    if (fs.existsSync(file))
      logs = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch { /* ignore */ }

  logs.unshift({
    action,
    details: String(details).slice(0, 500),
    ip: String(ip || '').slice(0, 45),
    at: new Date().toISOString(),
  });

  logs = logs.slice(0, AUDIT_MAX);
  fs.writeFileSync(file, JSON.stringify(logs, null, 2), 'utf8');
  return logs[0];
}

function readAuditLog(opts = {}) {
  const file = `${DATA_DIR}/audit.json`;
  try {
    if (!fs.existsSync(file)) return [];
    let logs = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (opts.action) {
      logs = logs.filter((l) => l.action === opts.action);
    }
    if (opts.limit) {
      logs = logs.slice(0, opts.limit);
    }
    return logs;
  } catch {
    return [];
  }
}

module.exports = { logAction, readAuditLog };
