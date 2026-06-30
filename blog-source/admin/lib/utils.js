const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const CONTENT_ROOT = path.resolve(
  process.env.BLOG_CONTENT_DIR || path.join(ROOT, '..', 'blog-content', 'data'),
);
const POSTS_DIR = CONTENT_ROOT;
const IMG_DIR = path.join(ROOT, 'source', 'img');
const DATA_DIR = resolveFromRoot(
  process.env.BLOG_ADMIN_DATA_DIR,
  path.join(__dirname, '..', 'data'),
);
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit.json');
const IP_CACHE_FILE = path.join(DATA_DIR, 'ip-cache.json');
const CONFIG_FILE = path.join(ROOT, '_config.yml');
const THEME_CONFIG_FILE = path.join(ROOT, '_config.butterfly.yml');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DEPLOY_DIR = process.env.DEPLOY_DIR || PUBLIC_DIR;
const ADMIN_BASE = '/admin';
const LOGIN_PATH = '/login';
const LOGOUT_PATH = '/logout';

function resolveFromRoot(value, fallback) {
  if (!value) return fallback;
  return path.isAbsolute(value) ? value : path.join(ROOT, value);
}

function htmlEscape(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeDate(value) {
  if (!value) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  if (value instanceof Date) return value.toISOString().slice(0, 19).replace('T', ' ');
  return String(value).replace('T', ' ').replace(/\.\d+Z?$/, '');
}

function safePostFile(name) {
  const file = String(name || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!file.endsWith('.md') || file.includes('..')) throw new Error('Invalid post file');
  const full = path.resolve(POSTS_DIR, file);
  if (!full.startsWith(`${POSTS_DIR}${path.sep}`)) throw new Error('Invalid post path');
  return full;
}

function postRelPath(full) {
  return path.relative(POSTS_DIR, full).replace(/\\/g, '/');
}

function slugifyTitle(title) {
  const clean = String(title || 'post')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return clean || `post-${Date.now()}`;
}

function splitList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function walkMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMarkdown(full));
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) out.push(full);
  }
  return out;
}

function parseFrontMatter(text) {
  if (!text.startsWith('---')) return { data: {}, content: text };
  const end = text.indexOf('\n---', 3);
  if (end === -1) return { data: {}, content: text };
  const raw = text.slice(3, end).trim();
  const content = text.slice(text.indexOf('\n', end + 4) + 1);
  const lines = raw.split(/\r?\n/);
  const data = {};

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2] || '';

    if (value === '') {
      const items = [];
      while (i + 1 < lines.length && /^\s+-\s+/.test(lines[i + 1])) {
        i += 1;
        items.push(lines[i].replace(/^\s+-\s+/, '').trim());
      }
      data[key] = items.length ? items : '';
      continue;
    }

    if (value === '>-' || value === '|') {
      const parts = [];
      while (i + 1 < lines.length && /^\s+/.test(lines[i + 1])) {
        i += 1;
        parts.push(lines[i].trim());
      }
      data[key] = parts.join(value === '|' ? '\n' : ' ');
      continue;
    }

    data[key] = value.replace(/^['"]|['"]$/g, '');
  }

  return { data, content };
}

function stringifyFrontMatter(data, content) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) lines.push(`  - ${item}`);
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: ${value || ''}`);
    }
  }
  lines.push('---', '', content.trimEnd(), '');
  return lines.join('\n');
}

function generateAbbrlink(seed) {
  return crypto
    .createHash('md5')
    .update(`${seed}-${Date.now()}`)
    .digest('hex')
    .slice(0, 8);
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '')
    .split(',')[0]
    .trim();
  return forwarded || req.socket.remoteAddress || '';
}

function normalizePostPath(value) {
  const clean = String(value || '').split('?')[0].split('#')[0];
  if (!/^\/posts\/[A-Za-z0-9_-]+\/?$/.test(clean)) return '';
  return clean.endsWith('/') ? clean : `${clean}/`;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function dayKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function hourKey(date) {
  return `${pad2(date.getHours())}:00`;
}

function referrerHost(value) {
  const raw = String(value || '').trim();
  if (!raw) return '直接访问';
  try {
    return new URL(raw).host || '直接访问';
  } catch {
    return raw.slice(0, 48);
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileMtime(file) {
  try {
    return fs.statSync(file).mtime;
  } catch {
    return null;
  }
}

module.exports = {
  ROOT,
  CONTENT_ROOT,
  POSTS_DIR,
  IMG_DIR,
  DATA_DIR,
  ANALYTICS_FILE,
  MESSAGES_FILE,
  AUDIT_FILE,
  IP_CACHE_FILE,
  CONFIG_FILE,
  THEME_CONFIG_FILE,
  PUBLIC_DIR,
  DEPLOY_DIR,
  ADMIN_BASE,
  LOGIN_PATH,
  LOGOUT_PATH,
  resolveFromRoot,
  htmlEscape,
  asArray,
  normalizeDate,
  safePostFile,
  postRelPath,
  slugifyTitle,
  splitList,
  walkMarkdown,
  parseFrontMatter,
  stringifyFrontMatter,
  generateAbbrlink,
  clientIp,
  normalizePostPath,
  pad2,
  dayKey,
  hourKey,
  referrerHost,
  formatBytes,
  fileMtime,
};
