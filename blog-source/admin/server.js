const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {exec} = require('child_process');
const fs = require('fs');
const multer = require('multer');
const os = require('os');
const path = require('path');
const express = require('express');
const session = require('express-session');

require('dotenv').config({path: path.join(__dirname, '..', '.env')});

const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'source', '_posts');
const IMG_DIR = path.join(ROOT, 'source', 'img');
const DATA_DIR = path.join(__dirname, 'data');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const CONFIG_FILE = path.join(ROOT, '_config.yml');
const THEME_CONFIG_FILE = path.join(ROOT, '_config.butterfly.yml');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DEPLOY_DIR = process.env.DEPLOY_DIR || path.join(ROOT, 'public');
const ADMIN_BASE = '/admin';
const LOGIN_PATH = '/login';
const LOGOUT_PATH = '/logout';
const PORT = Number(process.env.ADMIN_PORT || 4010);

const app = express();
const upload = multer({
  dest: path.join(os.tmpdir(), 'jing-blog-admin'),
  limits: {fileSize: 2 * 1024 * 1024},
});

app.set('trust proxy', 'loopback');
app.use(express.urlencoded({extended: true, limit: '2mb'}));
app.use(express.json({limit: '2mb'}));
app.use(
  session({
    name: 'jing_blog_admin',
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
);
app.use(`${ADMIN_BASE}/assets`, express.static(path.join(__dirname, 'public')));

let buildQueue = Promise.resolve();

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
  const file = path.basename(name || '');
  if (!file.endsWith('.md')) throw new Error('Invalid post file');
  const full = path.join(POSTS_DIR, file);
  if (!full.startsWith(POSTS_DIR)) throw new Error('Invalid post path');
  return full;
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

function parseFrontMatter(text) {
  if (!text.startsWith('---')) return {data: {}, content: text};
  const end = text.indexOf('\n---', 3);
  if (end === -1) return {data: {}, content: text};
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
      data[key] = parts.join(value === '|'
        ? '\n'
        : ' ');
      continue;
    }

    data[key] = value.replace(/^['"]|['"]$/g, '');
  }

  return {data, content};
}

function stringifyFrontMatter(data, content) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) lines.push(`  - ${item}`);
    } else {
      lines.push(`${key}: ${value || ''}`);
    }
  }
  lines.push('---', '', content.trimEnd(), '');
  return lines.join('\n');
}

function generateAbbrlink(seed) {
  return crypto.createHash('md5').update(`${seed}-${Date.now()}`).digest('hex').slice(0, 8);
}

function readPosts() {
  fs.mkdirSync(POSTS_DIR, {recursive: true});
  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const full = safePostFile(file);
      const parsed = parseFrontMatter(fs.readFileSync(full, 'utf8'));
      return {
        file,
        title: parsed.data.title || file.replace(/\.md$/, ''),
        date: normalizeDate(parsed.data.date),
        updated: normalizeDate(parsed.data.updated),
        categories: asArray(parsed.data.categories),
        tags: asArray(parsed.data.tags),
        description: parsed.data.description || '',
        cover: parsed.data.cover || '',
        content: parsed.content.trim(),
      };
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function readPost(file) {
  const parsed = parseFrontMatter(fs.readFileSync(safePostFile(file), 'utf8'));
  return {
    file,
    title: parsed.data.title || '',
    date: normalizeDate(parsed.data.date),
    updated: normalizeDate(parsed.data.updated),
    categories: asArray(parsed.data.categories),
    tags: asArray(parsed.data.tags),
    description: parsed.data.description || '',
    cover: parsed.data.cover || '',
    content: parsed.content.trim(),
  };
}

function writePost(file, body) {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const target = file ? safePostFile(file) : path.join(POSTS_DIR, `${Date.now()}-${slugifyTitle(body.title)}.md`);
  const existing = fs.existsSync(target) ? parseFrontMatter(fs.readFileSync(target, 'utf8')).data : {};
  const data = {
    title: body.title || '未命名文章',
    abbrlink: existing.abbrlink || generateAbbrlink(body.title || target),
    date: body.date || now,
    updated: now,
    tags: splitList(body.tags),
    categories: splitList(body.categories),
    description: body.description || '',
    cover: body.cover || '',
  };
  const next = stringifyFrontMatter(data, body.content || '');
  fs.writeFileSync(target, next, 'utf8');
  return path.basename(target);
}

function deletePost(file) {
  fs.unlinkSync(safePostFile(file));
}

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

function writeText(file, text) {
  fs.writeFileSync(file, text, 'utf8');
}

function readAnalytics() {
  fs.mkdirSync(DATA_DIR, {recursive: true});
  if (!fs.existsSync(ANALYTICS_FILE)) return {posts: {}, visits: []};
  try {
    const data = JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf8'));
    return {
      posts: data.posts && typeof data.posts === 'object' ? data.posts : {},
      visits: Array.isArray(data.visits) ? data.visits : [],
    };
  } catch {
    return {posts: {}, visits: []};
  }
}

function writeAnalytics(data) {
  fs.mkdirSync(DATA_DIR, {recursive: true});
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function readMessages() {
  fs.mkdirSync(DATA_DIR, {recursive: true});
  if (!fs.existsSync(MESSAGES_FILE)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeMessages(messages) {
  fs.mkdirSync(DATA_DIR, {recursive: true});
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
}

function normalizeMessageText(value, maxLength) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

function messageTree() {
  const all = readMessages()
    .filter((item) => item && item.id && item.author && item.content)
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  const byParent = new Map();

  for (const item of all) {
    const parentId = item.parentId || '';
    if (!byParent.has(parentId)) byParent.set(parentId, []);
    byParent.get(parentId).push({...item});
  }

  const build = (parentId = '') => (byParent.get(parentId) || []).map((item) => ({
    ...item,
    replies: build(item.id),
  }));

  return build('').reverse();
}

function createMessage(body, req) {
  const author = normalizeMessageText(body.author, 24);
  const content = normalizeMessageText(body.content, 800);
  const parentId = normalizeMessageText(body.parentId, 64);
  if (!author || !content) throw new Error('留言昵称和内容不能为空');

  const messages = readMessages();
  if (parentId && !messages.some((item) => item.id === parentId)) {
    throw new Error('回复目标不存在或已删除');
  }

  const message = {
    id: crypto.randomBytes(8).toString('hex'),
    parentId: parentId || '',
    author,
    content,
    createdAt: new Date().toISOString(),
    ip: clientIp(req),
  };
  messages.push(message);
  writeMessages(messages);
  return message;
}

function deleteMessage(id) {
  const targetId = String(id || '');
  const messages = readMessages();
  const doomed = new Set([targetId]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const item of messages) {
      if (item.parentId && doomed.has(item.parentId) && !doomed.has(item.id)) {
        doomed.add(item.id);
        changed = true;
      }
    }
  }

  writeMessages(messages.filter((item) => !doomed.has(item.id)));
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket.remoteAddress || '';
}

function normalizePostPath(value) {
  const clean = String(value || '').split('?')[0].split('#')[0];
  if (!/^\/posts\/[A-Za-z0-9_-]+\/?$/.test(clean)) return '';
  return clean.endsWith('/') ? clean : `${clean}/`;
}

function recordVisit(req) {
  const postPath = normalizePostPath(req.body.path);
  if (!postPath) return false;

  const data = readAnalytics();
  const ip = clientIp(req);
  const title = String(req.body.title || postPath).slice(0, 120);
  const now = new Date().toISOString();
  const post = data.posts[postPath] || {
    path: postPath,
    title,
    views: 0,
    ips: {},
    lastVisitAt: '',
  };

  post.title = title || post.title;
  post.views += 1;
  post.lastVisitAt = now;
  post.ips[ip] = (post.ips[ip] || 0) + 1;
  data.posts[postPath] = post;

  data.visits.unshift({
    path: postPath,
    title: post.title,
    ip,
    at: now,
    referrer: String(req.body.referrer || '').slice(0, 300),
    userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
  });
  data.visits = data.visits.slice(0, 5000);
  writeAnalytics(data);
  return true;
}

function analyticsSummary() {
  const data = readAnalytics();
  const posts = Object.values(data.posts)
    .map((post) => ({
      ...post,
      uniqueIps: Object.keys(post.ips || {}).filter(Boolean).length,
    }))
    .sort((a, b) => b.views - a.views);
  return {posts, visits: data.visits};
}

function replaceTopLevel(text, key, value) {
  const escaped = String(value || '').replaceAll('\n', ' ');
  const pattern = new RegExp(`^${key}:.*$`, 'm');
  return text.replace(pattern, `${key}: ${escaped}`);
}

function readLineValue(text, key) {
  const match = text.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : '';
}

function readThemeValue(pattern, text) {
  const match = text.match(pattern);
  return match ? match[1].trim() : '';
}

function socialText(value, fallback = '未设置') {
  return String(value || fallback).replaceAll('|', '').replaceAll('\n', ' ').trim();
}

function setThemeSettings(theme, values) {
  const socialLines = ['social:'];
  if (values.github) {
    socialLines.push(`  fab fa-github: ${values.github} || GitHub || '#24292e'`);
  }
  if (values.email) {
    socialLines.push(`  fas fa-envelope: mailto:${values.email} || Email || '#4a7dbe'`);
  }
  socialLines.push(`  fab fa-qq: javascript:void(0) || QQ账号 ${socialText(values.qq)} || '#12B7F5'`);
  socialLines.push(`  fab fa-weixin: javascript:void(0) || 微信账号 ${socialText(values.wechat)} || '#07C160'`);
  socialLines.push(`  fab fa-linux: ${values.linuxdo || 'https://linux.do/'} || Linux.do || '#111827'`);
  socialLines.push(`  fab fa-git-alt: ${values.gitee || 'https://gitee.com/lijing-dev'} || Gitee || '#C71D23'`);
  theme = theme.replace(
    /social:\r?\n[\s\S]*?\r?\n# --------------------------------------\r?\n# Image Settings/,
    `${socialLines.join('\n')}\n\n# --------------------------------------\n# Image Settings`,
  );

  if (values.avatar) {
    theme = theme.replace(/avatar:\r?\n\s+img:.*\r?\n/, `avatar:\n  img: ${values.avatar}\n`);
  }

  theme = theme.replace(
    /(card_author:\r?\n\s+enable: true\r?\n\s+description:).*/,
    `$1 ${values.authorDescription || ''}`,
  );
  theme = theme.replace(
    /(card_author:[\s\S]*?button:[\s\S]*?link:).*/,
    `$1 ${values.github || 'https://github.com/'}`,
  );
  theme = theme.replace(
    /(card_announcement:\r?\n\s+enable: true\r?\n\s+content:).*/,
    `$1 ${values.announcement || ''}`,
  );
  return theme;
}

function readSettings() {
  const config = readText(CONFIG_FILE);
  const theme = readText(THEME_CONFIG_FILE);
  return {
    title: readLineValue(config, 'title'),
    subtitle: readLineValue(config, 'subtitle'),
    description: readLineValue(config, 'description'),
    author: readLineValue(config, 'author'),
    email: readThemeValue(/fas fa-envelope:\s*mailto:([^|]+)\|\|/, theme),
    github: readThemeValue(/fab fa-github:\s*([^|]+)\|\|/, theme),
    qq: readThemeValue(/fab fa-qq:\s*javascript:void\(0\)\s*\|\|\s*QQ账号\s*([^|]*)\|\|/, theme)
      || readThemeValue(/fab fa-qq:\s*([^|]+)\|\|/, theme),
    wechat: readThemeValue(/fab fa-weixin:\s*javascript:void\(0\)\s*\|\|\s*微信账号\s*([^|]*)\|\|/, theme)
      || readThemeValue(/fab fa-weixin:\s*([^|]+)\|\|/, theme),
    linuxdo: readThemeValue(/fab fa-linux:\s*([^|]+)\|\|/, theme),
    gitee: readThemeValue(/fab fa-git-alt:\s*([^|]+)\|\|/, theme),
    avatar: readThemeValue(/avatar:\r?\n\s+img:\s*(.*)/, theme),
    authorDescription: readThemeValue(/card_author:\r?\n\s+enable: true\r?\n\s+description:\s*(.*)/, theme),
    announcement: readThemeValue(/card_announcement:\r?\n\s+enable: true\r?\n\s+content:\s*(.*)/, theme),
  };
}

function writeSettings(body, file) {
  let avatar = readSettings().avatar;
  if (file) {
    fs.mkdirSync(IMG_DIR, {recursive: true});
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.svg'].includes(ext)) {
      fs.unlinkSync(file.path);
      throw new Error('头像只支持 jpg、png、webp、svg');
    }
    avatar = `/img/avatar${ext}`;
    fs.copyFileSync(file.path, path.join(IMG_DIR, `avatar${ext}`));
    fs.unlinkSync(file.path);
  }

  let config = readText(CONFIG_FILE);
  config = replaceTopLevel(config, 'title', body.title);
  config = replaceTopLevel(config, 'subtitle', body.subtitle);
  config = replaceTopLevel(config, 'description', body.description);
  config = replaceTopLevel(config, 'author', body.author);
  writeText(CONFIG_FILE, config);

  const theme = setThemeSettings(readText(THEME_CONFIG_FILE), {
    email: body.email,
    github: body.github,
    qq: body.qq,
    wechat: body.wechat,
    linuxdo: body.linuxdo,
    gitee: body.gitee,
    avatar,
    authorDescription: body.authorDescription,
    announcement: body.announcement,
  });
  writeText(THEME_CONFIG_FILE, theme);
}

function copyDirContents(from, to) {
  const resolvedTo = path.resolve(to);
  if (resolvedTo === path.parse(resolvedTo).root) throw new Error('Refusing to deploy to filesystem root');
  fs.mkdirSync(resolvedTo, {recursive: true});
  for (const entry of fs.readdirSync(resolvedTo)) {
    fs.rmSync(path.join(resolvedTo, entry), {recursive: true, force: true});
  }
  for (const entry of fs.readdirSync(from)) {
    fs.cpSync(path.join(from, entry), path.join(resolvedTo, entry), {recursive: true});
  }
}

function run(command) {
  return new Promise((resolve, reject) => {
    exec(command, {cwd: ROOT, timeout: 120000}, (error, stdout, stderr) => {
      if (error) {
        error.message = `${error.message}\n${stdout}\n${stderr}`;
        reject(error);
      } else {
        resolve({stdout, stderr});
      }
    });
  });
}

async function rebuildAndDeploy() {
  buildQueue = buildQueue.then(async () => {
    await run('npm run clean && npm run build');
    copyDirContents(PUBLIC_DIR, DEPLOY_DIR);
  });
  return buildQueue;
}

function ensureAuth(req, res, next) {
  if (req.session.authenticated) return next();
  res.redirect(LOGIN_PATH);
}

async function verifyPassword(password) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return false;
  return bcrypt.compare(password || '', hash);
}

function layout(title, body) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${htmlEscape(title)} - Jing Blog Admin</title>
  <link rel="stylesheet" href="${ADMIN_BASE}/assets/admin.css">
</head>
<body>
  <header class="topbar">
    <a class="brand" href="${ADMIN_BASE}/">Jing Blog Admin</a>
    <nav>
      <a href="${ADMIN_BASE}/posts/new">新建文章</a>
      <a href="${ADMIN_BASE}/analytics">访问统计</a>
      <a href="${ADMIN_BASE}/messages">留言管理</a>
      <a href="${ADMIN_BASE}/settings">站点设置</a>
      <a href="/" target="_blank">查看博客</a>
      <form action="${LOGOUT_PATH}" method="post"><button>退出</button></form>
    </nav>
  </header>
  <main class="page">${body}</main>
</body>
</html>`;
}

function loginPage(error = '') {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>登录 - Jing Blog Admin</title>
  <link rel="stylesheet" href="${ADMIN_BASE}/assets/admin.css">
</head>
<body class="login-page">
  <form class="login-card" action="${LOGIN_PATH}" method="post">
    <h1>博客后台</h1>
    <p>登录后可以管理文章、分类标签和站点资料。</p>
    ${error ? `<div class="alert">${htmlEscape(error)}</div>` : ''}
    <label>账号<input name="username" autocomplete="username" required></label>
    <label>密码<input name="password" type="password" autocomplete="current-password" required></label>
    <button class="primary">登录</button>
  </form>
</body>
</html>`;
}

function postForm(post = {}) {
  return layout(
    post.file ? '编辑文章' : '新建文章',
    `<section class="panel">
      <h1>${post.file ? '编辑文章' : '新建文章'}</h1>
      <form class="editor" method="post" action="${ADMIN_BASE}/posts${post.file ? `/${encodeURIComponent(post.file)}` : ''}">
        <div class="grid two">
          <label>标题<input name="title" value="${htmlEscape(post.title || '')}" required></label>
          <label>发布日期<input name="date" value="${htmlEscape(post.date || '')}"></label>
        </div>
        <div class="grid two">
          <label>分类<input name="categories" value="${htmlEscape(asArray(post.categories).join(', '))}" placeholder="工程实践, Java"></label>
          <label>标签<input name="tags" value="${htmlEscape(asArray(post.tags).join(', '))}" placeholder="Hexo, Spring"></label>
        </div>
        <label>封面图 URL<input name="cover" value="${htmlEscape(post.cover || '')}"></label>
        <label>摘要<textarea name="description" rows="3">${htmlEscape(post.description || '')}</textarea></label>
        <label>正文 Markdown<textarea name="content" class="markdown" rows="22">${htmlEscape(post.content || '')}</textarea></label>
        <div class="actions">
          <button class="primary">保存并发布</button>
          <a class="button" href="${ADMIN_BASE}/">返回</a>
        </div>
      </form>
    </section>`,
  );
}

app.get(LOGIN_PATH, (req, res) => res.send(loginPage()));
app.get(`${ADMIN_BASE}/login`, (req, res) => res.redirect(LOGIN_PATH));
app.post(LOGIN_PATH, async (req, res) => {
  if (req.body.username !== (process.env.ADMIN_USER || 'admin')) {
    return res.status(401).send(loginPage('账号或密码不正确'));
  }
  if (!(await verifyPassword(req.body.password))) {
    return res.status(401).send(loginPage('账号或密码不正确'));
  }
  req.session.authenticated = true;
  res.redirect(`${ADMIN_BASE}/`);
});
app.post(LOGOUT_PATH, ensureAuth, (req, res) => {
  req.session.destroy(() => res.redirect(LOGIN_PATH));
});

app.post('/track/view', (req, res) => {
  const ok = recordVisit(req);
  res.status(ok ? 204 : 400).end();
});

app.get('/api/messages', (req, res) => {
  res.json({messages: messageTree()});
});

app.post('/api/messages', (req, res) => {
  try {
    const message = createMessage(req.body || {}, req);
    res.status(201).json({ok: true, message});
  } catch (error) {
    res.status(400).json({ok: false, error: error.message});
  }
});

app.get(`${ADMIN_BASE}/`, ensureAuth, (req, res) => {
  const posts = readPosts();
  const rows = posts
    .map(
      (post) => `<tr>
        <td><strong>${htmlEscape(post.title)}</strong><small>${htmlEscape(post.file)}</small></td>
        <td>${htmlEscape(post.categories.join(', '))}</td>
        <td>${htmlEscape(post.tags.join(', '))}</td>
        <td>${htmlEscape(post.date)}</td>
        <td class="row-actions">
          <a class="button" href="${ADMIN_BASE}/posts/${encodeURIComponent(post.file)}">编辑</a>
          <form action="${ADMIN_BASE}/posts/${encodeURIComponent(post.file)}/delete" method="post" onsubmit="return confirm('确定删除这篇文章吗？')"><button class="danger">删除</button></form>
        </td>
      </tr>`,
    )
    .join('');
  res.send(
    layout(
      '文章管理',
      `<section class="panel">
        <div class="panel-head">
          <div><h1>文章管理</h1><p>当前共 ${posts.length} 篇文章。</p></div>
          <a class="button primary" href="${ADMIN_BASE}/posts/new">新建文章</a>
        </div>
        <table>
          <thead><tr><th>文章</th><th>分类</th><th>标签</th><th>日期</th><th>操作</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5">暂无文章</td></tr>'}</tbody>
        </table>
      </section>`,
    ),
  );
});

app.get(`${ADMIN_BASE}/analytics`, ensureAuth, (req, res) => {
  const {posts, visits} = analyticsSummary();
  const postRows = posts
    .map((post) => `<tr>
      <td><a href="${htmlEscape(post.path)}" target="_blank"><strong>${htmlEscape(post.title)}</strong></a><small>${htmlEscape(post.path)}</small></td>
      <td>${post.views}</td>
      <td>${post.uniqueIps}</td>
      <td>${htmlEscape(post.lastVisitAt || '')}</td>
    </tr>`)
    .join('');
  const visitRows = visits
    .slice(0, 200)
    .map((visit) => `<tr>
      <td>${htmlEscape(visit.at)}</td>
      <td><a href="${htmlEscape(visit.path)}" target="_blank">${htmlEscape(visit.title)}</a></td>
      <td>${htmlEscape(visit.ip)}</td>
      <td>${htmlEscape(visit.referrer)}</td>
    </tr>`)
    .join('');

  res.send(
    layout(
      '访问统计',
      `<section class="panel">
        <div class="panel-head">
          <div><h1>访问统计</h1><p>统计来自博客文章页的访问记录。</p></div>
        </div>
        <h2>帖子访问量</h2>
        <table>
          <thead><tr><th>帖子</th><th>访问量</th><th>独立 IP</th><th>最近访问</th></tr></thead>
          <tbody>${postRows || '<tr><td colspan="4">暂无统计</td></tr>'}</tbody>
        </table>
      </section>
      <section class="panel">
        <h2>最近访问 IP</h2>
        <table>
          <thead><tr><th>时间</th><th>帖子</th><th>IP</th><th>来源</th></tr></thead>
          <tbody>${visitRows || '<tr><td colspan="4">暂无访问记录</td></tr>'}</tbody>
        </table>
      </section>`,
    ),
  );
});

app.get(`${ADMIN_BASE}/messages`, ensureAuth, (req, res) => {
  const flatten = [];
  const walk = (items, depth = 0) => {
    for (const item of items) {
      flatten.push({...item, depth});
      walk(item.replies || [], depth + 1);
    }
  };
  walk(messageTree());
  const rows = flatten.map((item) => `<tr>
      <td>${'&nbsp;'.repeat(item.depth * 4)}<strong>${htmlEscape(item.author)}</strong><small>${htmlEscape(item.id)}</small></td>
      <td>${htmlEscape(item.content)}</td>
      <td>${htmlEscape(item.createdAt || '')}</td>
      <td>${htmlEscape(item.ip || '')}</td>
      <td class="row-actions">
        <form action="${ADMIN_BASE}/messages/${encodeURIComponent(item.id)}/delete" method="post" onsubmit="return confirm('确定删除这条留言及其回复吗？')"><button class="danger">删除</button></form>
      </td>
    </tr>`).join('');
  res.send(
    layout(
      '留言管理',
      `<section class="panel">
        <div class="panel-head">
          <div><h1>留言管理</h1><p>当前共 ${flatten.length} 条留言与回复。</p></div>
        </div>
        <table>
          <thead><tr><th>用户</th><th>内容</th><th>时间</th><th>IP</th><th>操作</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5">暂无留言</td></tr>'}</tbody>
        </table>
      </section>`,
    ),
  );
});

app.post(`${ADMIN_BASE}/messages/:id/delete`, ensureAuth, (req, res, next) => {
  try {
    deleteMessage(req.params.id);
    res.redirect(`${ADMIN_BASE}/messages`);
  } catch (error) {
    next(error);
  }
});

app.get(`${ADMIN_BASE}/posts/new`, ensureAuth, (req, res) => res.send(postForm()));
app.post(`${ADMIN_BASE}/posts`, ensureAuth, async (req, res, next) => {
  try {
    writePost(null, req.body);
    await rebuildAndDeploy();
    res.redirect(`${ADMIN_BASE}/`);
  } catch (error) {
    next(error);
  }
});
app.get(`${ADMIN_BASE}/posts/:file`, ensureAuth, (req, res, next) => {
  try {
    res.send(postForm(readPost(req.params.file)));
  } catch (error) {
    next(error);
  }
});
app.post(`${ADMIN_BASE}/posts/:file`, ensureAuth, async (req, res, next) => {
  try {
    writePost(req.params.file, req.body);
    await rebuildAndDeploy();
    res.redirect(`${ADMIN_BASE}/`);
  } catch (error) {
    next(error);
  }
});
app.post(`${ADMIN_BASE}/posts/:file/delete`, ensureAuth, async (req, res, next) => {
  try {
    deletePost(req.params.file);
    await rebuildAndDeploy();
    res.redirect(`${ADMIN_BASE}/`);
  } catch (error) {
    next(error);
  }
});

app.get(`${ADMIN_BASE}/settings`, ensureAuth, (req, res) => {
  const settings = readSettings();
  res.send(
    layout(
      '站点设置',
      `<section class="panel">
        <h1>站点设置</h1>
        <form class="editor" action="${ADMIN_BASE}/settings" method="post" enctype="multipart/form-data">
          <div class="grid two">
            <label>站点名称<input name="title" value="${htmlEscape(settings.title)}" required></label>
            <label>作者名<input name="author" value="${htmlEscape(settings.author)}" required></label>
          </div>
          <label>副标题<input name="subtitle" value="${htmlEscape(settings.subtitle)}"></label>
          <label>站点描述<textarea name="description" rows="3">${htmlEscape(settings.description)}</textarea></label>
          <div class="grid two">
            <label>邮箱<input name="email" type="email" value="${htmlEscape(settings.email)}" placeholder="name@example.com"></label>
            <label>GitHub 地址<input name="github" value="${htmlEscape(settings.github)}" placeholder="https://github.com/yourname"></label>
          </div>
          <div class="grid two">
            <label>QQ 账号<input name="qq" value="${htmlEscape(settings.qq)}" placeholder="QQ号"></label>
            <label>微信账号<input name="wechat" value="${htmlEscape(settings.wechat)}" placeholder="微信号"></label>
          </div>
          <div class="grid two">
            <label>Linux.do 主页<input name="linuxdo" value="${htmlEscape(settings.linuxdo)}" placeholder="https://linux.do/"></label>
            <label>Gitee 主页<input name="gitee" value="${htmlEscape(settings.gitee)}" placeholder="https://gitee.com/yourname"></label>
          </div>
          <label>作者卡片介绍<input name="authorDescription" value="${htmlEscape(settings.authorDescription)}"></label>
          <label>公告<textarea name="announcement" rows="3">${htmlEscape(settings.announcement)}</textarea></label>
          <label>当前头像路径<input name="avatarPath" value="${htmlEscape(settings.avatar)}" readonly></label>
          <label>上传新头像<input name="avatar" type="file" accept=".jpg,.jpeg,.png,.webp,.svg,image/*"></label>
          <div class="actions">
            <button class="primary">保存并发布</button>
            <a class="button" href="${ADMIN_BASE}/">返回</a>
          </div>
        </form>
      </section>`,
    ),
  );
});
app.post(`${ADMIN_BASE}/settings`, ensureAuth, upload.single('avatar'), async (req, res, next) => {
  try {
    writeSettings(req.body, req.file);
    await rebuildAndDeploy();
    res.redirect(`${ADMIN_BASE}/settings`);
  } catch (error) {
    next(error);
  }
});

app.get('/', (req, res) => res.redirect(ADMIN_BASE));
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).send(layout('出错了', `<section class="panel"><h1>操作失败</h1><pre>${htmlEscape(error.message)}</pre><a class="button" href="${ADMIN_BASE}/">返回后台</a></section>`));
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Jing Blog Admin listening on http://127.0.0.1:${PORT}${ADMIN_BASE}`);
});
