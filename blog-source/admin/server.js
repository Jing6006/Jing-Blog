const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');
const multer = require('multer');
const os = require('os');
const path = require('path');
const express = require('express');
const session = require('express-session');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const {
  ROOT, ADMIN_BASE, LOGIN_PATH, LOGOUT_PATH, PUBLIC_DIR, DEPLOY_DIR, IMG_DIR,
  htmlEscape, asArray, splitList, formatBytes, fileMtime, clientIp, referrerHost,
} = require('./lib/utils');
const { ensureAuth, verifyPassword } = require('./lib/auth');
const {
  readPosts, readPost, writePost, deletePost, batchDelete, getStats,
  getAllCategories, getAllTags, renameCategory, renameTag,
} = require('./lib/posts');
const {
  recordVisit, analyticsSummary, analyticsDashboard, resetAnalytics,
  ipLookup, ipDetail, readBlacklist, addToBlacklist, removeFromBlacklist,
  ANALYTICS_LIMITS,
} = require('./lib/analytics');
const {
  messageTree, createMessage, createAdminReply, deleteMessage,
  batchDeleteMessages, approveMessage, getMessageStats,
} = require('./lib/messages');
const { readSettings, writeSettings } = require('./lib/settings');
const { listImages, deleteImage, uploadImage } = require('./lib/media');
const { logAction, readAuditLog } = require('./lib/audit');

const app = express();
const upload = multer({
  dest: path.join(os.tmpdir(), 'jing-blog-admin'),
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.set('trust proxy', 'loopback');
app.use(express.urlencoded({ extended: true, limit: '4mb' }));
app.use(express.json({ limit: '4mb' }));
app.use(
  session({
    name: 'jing_blog_admin',
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 },
  }),
);
app.use(`${ADMIN_BASE}/assets`, express.static(path.join(__dirname, 'public')));

const publicStatic = express.static(PUBLIC_DIR);
app.use((req, res, next) => {
  if (
    req.path === LOGIN_PATH ||
    req.path === LOGOUT_PATH ||
    req.path.startsWith(ADMIN_BASE) ||
    req.path.startsWith('/api/') ||
    req.path.startsWith('/track/')
  ) {
    return next();
  }
  return publicStatic(req, res, next);
});

let buildQueue = Promise.resolve();
let buildState = { status: 'idle', lastAt: '', lastDuration: 0, lastLog: '' };

function copyDirContents(from, to) {
  const resolvedFrom = path.resolve(from);
  const resolvedTo = path.resolve(to);
  if (resolvedFrom === resolvedTo) return;
  if (resolvedTo === path.parse(resolvedTo).root)
    throw new Error('Refusing to deploy to filesystem root');
  fs.mkdirSync(resolvedTo, { recursive: true });
  for (const entry of fs.readdirSync(resolvedTo)) {
    fs.rmSync(path.join(resolvedTo, entry), { recursive: true, force: true });
  }
  for (const entry of fs.readdirSync(from)) {
    fs.cpSync(path.join(from, entry), path.join(resolvedTo, entry), { recursive: true });
  }
}

function run(command) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: ROOT, timeout: 180000 }, (error, stdout, stderr) => {
      if (error) {
        error.message = `${error.message}\n${stdout}\n${stderr}`;
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

async function rebuildAndDeploy() {
  buildState = { status: 'building', lastAt: new Date().toISOString(), lastDuration: 0, lastLog: '' };
  const start = Date.now();
  buildQueue = buildQueue.then(async () => {
    try {
      const result = await run('npm run clean && npm run build');
      copyDirContents(PUBLIC_DIR, DEPLOY_DIR);
      const duration = Math.round((Date.now() - start) / 1000);
      buildState = {
        status: 'success',
        lastAt: new Date().toISOString(),
        lastDuration: duration,
        lastLog: result.stdout.slice(-2000),
      };
    } catch (err) {
      const duration = Math.round((Date.now() - start) / 1000);
      buildState = {
        status: 'failed',
        lastAt: new Date().toISOString(),
        lastDuration: duration,
        lastLog: err.message.slice(-3000),
      };
    }
  });
  return buildQueue;
}

function jsonForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function navLinks(current) {
  const items = [
    ['', '仪表盘'],
    ['/posts', '文章管理'],
    ['/analytics', '访问统计'],
    ['/messages', '留言管理'],
    ['/media', '媒体库'],
    ['/taxonomy', '分类标签'],
    ['/settings', '站点设置'],
    ['/audit', '操作日志'],
  ];
  return items
    .map(
      ([href, label]) =>
        `<a href="${ADMIN_BASE}${href}"${current === href ? ' class="active"' : ''}>${label}</a>`,
    )
    .join('\n');
}

function layout(title, body, options = {}) {
  const extraHead = options.extraHead || '';
  const extraScript = options.extraScript || '';
  const current = options.current || '';
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${htmlEscape(title)} - Jing Blog Admin</title>
  <link rel="stylesheet" href="${ADMIN_BASE}/assets/admin.css">
  ${extraHead}
</head>
<body>
  <header class="topbar">
    <a class="brand" href="${ADMIN_BASE}/">Jing Blog Admin</a>
    <nav>${navLinks(current)}</nav>
    <div class="topbar-actions">
      <a href="/" target="_blank" class="button">鏌ョ湅鍗氬</a>
      <form action="${LOGOUT_PATH}" method="post"><button>閫€鍑?/button></form>
    </div>
  </header>
  <main class="page">${body}</main>
  <div id="toast-container"></div>
  ${extraScript}
</body>
</html>`;
}

function loginPage(error = '') {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>鐧诲綍 - Jing Blog Admin</title>
  <link rel="stylesheet" href="${ADMIN_BASE}/assets/admin.css">
</head>
<body class="login-page">
  <form class="login-card" action="${LOGIN_PATH}" method="post">
    <h1>鍗氬鍚庡彴</h1>
    <p>鐧诲綍鍚庡彲浠ョ鐞嗘枃绔犮€佺暀瑷€銆佺粺璁″拰绔欑偣璧勬枡銆?/p>
    ${error ? `<div class="alert">${htmlEscape(error)}</div>` : ''}
    <label>璐﹀彿<input name="username" autocomplete="username" required></label>
    <label>瀵嗙爜<input name="password" type="password" autocomplete="current-password" required></label>
    <button class="primary">鐧诲綍</button>
  </form>
</body>
</html>`;
}

// ==================== DASHBOARD ====================

function dashboardPage() {
  const postStats = getStats();
  const msgStats = getMessageStats();
  const { summary } = analyticsDashboard(30);
  const recentLogs = readAuditLog({ limit: 8 });
  const recentMsgs = messageTree({ includePrivate: true }).slice(0, 5);

  const cards = [
    { label: '文章总数', value: postStats.total, hint: `${postStats.published} 已发布 / ${postStats.draft} 草稿` },
    { label: '总访问量', value: summary.totalViews, hint: `${summary.totalUniqueIps} 个独立 IP` },
    { label: '待审核留言', value: msgStats.pending, hint: `共 ${msgStats.total} 条留言` },
    { label: '构建状态', value: buildState.status === 'success' ? '正常' : buildState.status === 'building' ? '构建中...' : buildState.status === 'failed' ? '失败' : '空闲', hint: buildState.lastAt ? `最近 ${buildState.lastAt.slice(0, 16).replace('T', ' ')}` : '尚未构建' },
  ];

  const cardHtml = cards
    .map(
      (c) => `<article class="stat-card">
    <span class="stat-label">${htmlEscape(c.label)}</span>
    <strong class="stat-value">${htmlEscape(String(c.value))}</strong>
    <small class="stat-hint">${htmlEscape(c.hint)}</small>
  </article>`,
    )
    .join('');

  const logRows = recentLogs
    .map(
      (l) => `<tr>
    <td>${htmlEscape((l.at || '').slice(0, 16).replace('T', ' '))}</td>
    <td><span class="badge badge-sm">${htmlEscape(l.action)}</span></td>
    <td>${htmlEscape(l.details)}</td>
    <td>${htmlEscape(l.ip)}</td>
  </tr>`,
    )
    .join('');

  const msgRows = recentMsgs
    .map(
      (m) => `<tr>
    <td>${htmlEscape(m.author)}${m.isAdmin ? '<span class="badge">博主</span>' : ''}</td>
    <td>${htmlEscape(m.content.slice(0, 80))}${m.content.length > 80 ? '...' : ''}</td>
    <td>${htmlEscape((m.createdAt || '').slice(0, 16).replace('T', ' '))}</td>
  </tr>`,
    )
    .join('');

  return layout(
    '仪表盘',
    `<section class="panel hero-panel">
      <div class="panel-head">
        <div><h1>仪表盘</h1><p>博客运营概况一览</p></div>
      </div>
      <div class="stats-grid">${cardHtml}</div>
    </section>
    <section class="table-grid">
      <section class="panel">
        <div class="panel-head compact">
          <div><h2>最近操作</h2></div>
          <a class="button" href="${ADMIN_BASE}/audit">查看全部</a>
        </div>
        <table>
          <thead><tr><th>时间</th><th>操作</th><th>详情</th><th>IP</th></tr></thead>
          <tbody>${logRows || '<tr><td colspan="4">暂无记录</td></tr>'}</tbody>
        </table>
      </section>
      <section class="panel">
        <div class="panel-head compact">
          <div><h2>最新留言</h2></div>
          <a class="button" href="${ADMIN_BASE}/messages">查看全部</a>
        </div>
        <table>
          <thead><tr><th>用户</th><th>内容</th><th>时间</th></tr></thead>
          <tbody>${msgRows || '<tr><td colspan="3">暂无留言</td></tr>'}</tbody>
        </table>
      </section>
    </section>`,
    { current: '' },
  );
}

// ==================== POST MANAGEMENT ====================

function postListPage(query = {}) {
  const posts = readPosts(query);
  const categories = getAllCategories();
  const tags = getAllTags();

  const filterHtml = `
    <form class="toolbar" method="get" action="${ADMIN_BASE}/posts">
      <input name="search" value="${htmlEscape(query.search || '')}" placeholder="鎼滅储鏍囬鎴栧唴瀹?.." style="width:220px">
      <select name="category">
        <option value="">鍏ㄩ儴鍒嗙被</option>
        ${categories.map((c) => `<option value="${htmlEscape(c.name)}"${query.category === c.name ? ' selected' : ''}>${htmlEscape(c.name)} (${c.count})</option>`).join('')}
      </select>
      <select name="tag">
        <option value="">鍏ㄩ儴鏍囩</option>
        ${tags.map((t) => `<option value="${htmlEscape(t.name)}"${query.tag === t.name ? ' selected' : ''}>${htmlEscape(t.name)} (${t.count})</option>`).join('')}
      </select>
      <select name="status">
        <option value="">鍏ㄩ儴鐘舵€?/option>
        <option value="published"${query.status === 'published' ? ' selected' : ''}>宸插彂甯?/option>
        <option value="draft"${query.status === 'draft' ? ' selected' : ''}>鑽夌</option>
      </select>
      <button>绛涢€?/button>
      ${query.search || query.category || query.tag || query.status ? `<a class="button" href="${ADMIN_BASE}/posts">娓呴櫎</a>` : ''}
    </form>`;

  const rows = posts
    .map(
      (post) => `<tr>
    <td>
      <div class="post-title-row">
        ${post.top ? '<span class="badge badge-warning">缃《</span>' : ''}
        ${!post.published ? '<span class="badge badge-draft">鑽夌</span>' : ''}
        <strong>${htmlEscape(post.title)}</strong>
      </div>
      <small>${htmlEscape(post.file)}</small>
    </td>
    <td>${htmlEscape(post.categories.join(', '))}</td>
    <td>${htmlEscape(post.tags.join(', '))}</td>
    <td>${htmlEscape(post.date)}</td>
    <td class="row-actions">
      <a class="button" href="${ADMIN_BASE}/posts/${encodeURIComponent(post.file)}">缂栬緫</a>
      ${post.published ? `<a class="button" href="/posts/${htmlEscape(post.abbrlink || '')}/" target="_blank">鏌ョ湅</a>` : ''}
      <form action="${ADMIN_BASE}/posts/${encodeURIComponent(post.file)}/delete" method="post" onsubmit="return confirm('纭畾鍒犻櫎杩欑瘒鏂囩珷鍚楋紵')" style="display:inline"><button class="danger">鍒犻櫎</button></form>
    </td>
  </tr>`,
    )
    .join('');

  return layout(
    '鏂囩珷绠＄悊',
    `<section class="panel">
      <div class="panel-head">
        <div><h1>鏂囩珷绠＄悊</h1><p>褰撳墠鍏?${posts.length} 绡囨枃绔狅紙${getStats().published} 宸插彂甯?/ ${getStats().draft} 鑽夌 / ${getStats().pinned} 缃《锛?/p></div>
        <a class="button primary" href="${ADMIN_BASE}/posts/new">+ 鏂板缓鏂囩珷</a>
      </div>
      ${filterHtml}
      <table>
        <thead><tr><th>鏂囩珷</th><th>鍒嗙被</th><th>鏍囩</th><th>鏃ユ湡</th><th>鎿嶄綔</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5">鏆傛棤鍖归厤鏂囩珷</td></tr>'}</tbody>
      </table>
    </section>`,
    { current: '/posts' },
  );
}

function postFormPage(post = {}) {
  const statusOptions = post.file
    ? `<label class="checkbox-label"><input type="checkbox" name="published" value="true"${post.published !== false ? ' checked' : ''}> 宸插彂甯冿紙鍙栨秷鍕鹃€夊垯淇濆瓨涓鸿崏绋匡級</label>
       <label class="checkbox-label"><input type="checkbox" name="top" value="true"${post.top ? ' checked' : ''}> 缃《</label>`
    : `<label class="checkbox-label"><input type="checkbox" name="published" value="true" checked> 宸插彂甯冿紙鍙栨秷鍕鹃€夊垯淇濆瓨涓鸿崏绋匡級</label>
       <label class="checkbox-label"><input type="checkbox" name="top" value="true"> 缃《</label>`;

  return layout(
    post.file ? '缂栬緫鏂囩珷' : '鏂板缓鏂囩珷',
    `<section class="panel">
      <h1>${post.file ? '缂栬緫鏂囩珷' : '鏂板缓鏂囩珷'}</h1>
      <form class="editor" method="post" action="${ADMIN_BASE}/posts${post.file ? `/${encodeURIComponent(post.file)}` : ''}">
        <div class="grid two">
          <label>鏍囬<input name="title" value="${htmlEscape(post.title || '')}" required></label>
          <label>鍙戝竷鏃ユ湡<input name="date" value="${htmlEscape(post.date || '')}"></label>
        </div>
        <div class="grid two">
          <label>鍒嗙被锛堥€楀彿鍒嗛殧锛?input name="categories" value="${htmlEscape(asArray(post.categories).join(', '))}" placeholder="宸ョ▼瀹炶返, Java"></label>
          <label>鏍囩锛堥€楀彿鍒嗛殧锛?input name="tags" value="${htmlEscape(asArray(post.tags).join(', '))}" placeholder="Hexo, Spring"></label>
        </div>
        <label>灏侀潰鍥?URL<input name="cover" value="${htmlEscape(post.cover || '')}"></label>
        <label>鎽樿<textarea name="description" rows="3">${htmlEscape(post.description || '')}</textarea></label>
        <div class="grid two">${statusOptions}</div>
        <label>姝ｆ枃 Markdown<textarea name="content" class="markdown" rows="22">${htmlEscape(post.content || '')}</textarea></label>
        <div class="actions">
          <button class="primary">淇濆瓨骞跺彂甯?/button>
          <a class="button" href="${ADMIN_BASE}/posts">杩斿洖</a>
        </div>
      </form>
    </section>`,
    { current: '/posts' },
  );
}

// ==================== ANALYTICS ====================

function analyticsPage(days = 30) {
  const dashboard = analyticsDashboard(days);
  const { summary, charts, topPosts, topIps, recentVisits, limits } = dashboard;

  const cards = [
    { label: '总访问量', value: summary.totalViews, hint: `最近 ${days} 天 ${summary.recentViews}` },
    { label: '独立 IP', value: summary.totalUniqueIps, hint: `最近 ${days} 天 ${summary.recentUniqueIps}` },
    { label: '被访问文章', value: summary.trackedPosts, hint: '按文章页面聚合' },
    { label: '最近访问明细', value: recentVisits.length, hint: `列表最多 ${limits.recentVisits} 条` },
  ];

  const cardHtml = cards
    .map(
      (c) => `<article class="stat-card">
    <span class="stat-label">${htmlEscape(c.label)}</span>
    <strong class="stat-value">${htmlEscape(String(c.value))}</strong>
    <small class="stat-hint">${htmlEscape(c.hint)}</small>
  </article>`,
    )
    .join('');

  const rangeLinks = [7, 30, 90]
    .map(
      (v) =>
        `<a class="filter-chip${v === days ? ' active' : ''}" href="${ADMIN_BASE}/analytics?days=${v}">${v} 澶?/a>`,
    )
    .join('');

  const topPostRows = topPosts
    .map(
      (post, i) => `<tr>
    <td><span class="rank">${i + 1}</span></td>
    <td><a href="${htmlEscape(post.path)}" target="_blank"><strong>${htmlEscape(post.title)}</strong></a><small>${htmlEscape(post.path)}</small></td>
    <td>${post.views}</td>
    <td>${post.uniqueIps}</td>
    <td>${htmlEscape(post.lastVisitAt || '')}</td>
  </tr>`,
    )
    .join('');

  const blacklist = readBlacklist();
  const ipRows = topIps
    .map(
      (item, i) => `<tr>
    <td><span class="rank">${i + 1}</span></td>
    <td>
      <strong>${htmlEscape(item.ip)}</strong>
      ${blacklist.some((b) => b.ip === item.ip) ? '<span class="badge badge-danger">宸插皝绂?/span>' : ''}
      <small>${htmlEscape(item.referrers.join(' / ') || '鐩存帴璁块棶')}</small>
    </td>
    <td>${item.views}</td>
    <td>${item.posts}</td>
    <td>${htmlEscape(item.lastVisitAt || '')}</td>
    <td>
      <a class="button" href="${ADMIN_BASE}/analytics/ip/${encodeURIComponent(item.ip)}">璇︽儏</a>
      ${blacklist.some((b) => b.ip === item.ip)
        ? `<form action="${ADMIN_BASE}/analytics/blacklist/${encodeURIComponent(item.ip)}/remove" method="post" style="display:inline"><button>瑙ｅ皝</button></form>`
        : `<form action="${ADMIN_BASE}/analytics/blacklist/${encodeURIComponent(item.ip)}" method="post" style="display:inline"><button class="danger">灏佺</button></form>`}
    </td>
  </tr>`,
    )
    .join('');

  const visitRows = recentVisits
    .map(
      (v) => `<tr>
    <td>${htmlEscape(v.at)}</td>
    <td><a href="${htmlEscape(v.path)}" target="_blank">${htmlEscape(v.title)}</a></td>
    <td>${htmlEscape(v.ip)}</td>
    <td>${htmlEscape(referrerHost(v.referrer))}</td>
    <td class="ua-cell">${htmlEscape(v.userAgent || '')}</td>
  </tr>`,
    )
    .join('');

  return layout(
    '璁块棶缁熻',
    `<section class="panel hero-panel">
      <div class="panel-head">
        <div><h1>璁块棶缁熻</h1><p>鏂囩珷鐑害銆佹潵婧?IP銆佽闂秼鍔垮拰鏈€杩戞槑缁?/p></div>
        <div class="toolbar">
          <div class="filter-group">${rangeLinks}</div>
          <form action="${ADMIN_BASE}/analytics/reset" method="post" onsubmit="return confirm('纭畾娓呯┖鍏ㄩ儴璁块棶缁熻鍚楋紵')">
            <button class="danger">娓呯┖缁熻</button>
          </form>
        </div>
      </div>
      <div class="stats-grid">${cardHtml}</div>
    </section>
    <section class="chart-grid">
      <section class="panel">
        <div class="panel-head compact"><div><h2>璁块棶瓒嬪娍</h2><p>鏈€杩?${days} 澶╄闂噺涓庣嫭绔?IP</p></div></div>
        <div class="chart" id="daily-chart"></div>
      </section>
      <section class="panel">
        <div class="panel-head compact"><div><h2>24 灏忔椂鍒嗗竷</h2></div></div>
        <div class="chart" id="hourly-chart"></div>
      </section>
      <section class="panel">
        <div class="panel-head compact"><div><h2>鏉ユ簮鍒嗗竷</h2></div></div>
        <div class="chart chart-donut" id="referrer-chart"></div>
      </section>
      <section class="panel">
        <div class="panel-head compact"><div><h2>缁熻鍙ｅ緞</h2></div></div>
        <div class="meta-list">
          <div><span>缁熻璁板綍涓婇檺</span><strong>${limits.maxVisits}</strong></div>
          <div><span>鏈€杩戣闂睍绀?/span><strong>${limits.recentVisits}</strong></div>
          <div><span>鐑棬鏂囩珷姒滃崟</span><strong>${limits.topPosts}</strong></div>
          <div><span>鐑棬 IP 姒滃崟</span><strong>${limits.topIps}</strong></div>
        </div>
      </section>
    </section>
    <section class="table-grid">
      <section class="panel">
        <div class="panel-head compact"><div><h2>鐑棬鏂囩珷</h2></div></div>
        <table>
          <thead><tr><th>#</th><th>鏂囩珷</th><th>璁块棶閲?/th><th>鐙珛 IP</th><th>鏈€杩戣闂?/th></tr></thead>
          <tbody>${topPostRows || '<tr><td colspan="5">鏆傛棤缁熻</td></tr>'}</tbody>
        </table>
      </section>
      <section class="panel">
        <div class="panel-head compact"><div><h2>Top IP</h2></div></div>
        <table>
          <thead><tr><th>#</th><th>IP / 鏉ユ簮</th><th>璁块棶閲?/th><th>鏂囩珷鏁?/th><th>鏈€杩戣闂?/th><th>鎿嶄綔</th></tr></thead>
          <tbody>${ipRows || '<tr><td colspan="6">鏆傛棤璁板綍</td></tr>'}</tbody>
        </table>
      </section>
    </section>
    <section class="panel">
      <div class="panel-head compact"><div><h2>鏈€杩戣闂槑缁?/h2></div></div>
      <table>
        <thead><tr><th>鏃堕棿</th><th>鏂囩珷</th><th>IP</th><th>鏉ユ簮</th><th>UA</th></tr></thead>
        <tbody>${visitRows || '<tr><td colspan="5">鏆傛棤璁板綍</td></tr>'}</tbody>
      </table>
    </section>`,
    {
      current: '/analytics',
      extraHead:
        '<script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>',
      extraScript: `<script>
        const d = ${jsonForScript(charts)};
        (function(){
          const dc = echarts.init(document.getElementById('daily-chart'));
          dc.setOption({
            tooltip: {trigger:'axis'}, legend: {top:0},
            grid: {left:42,right:20,top:40,bottom:28},
            xAxis: {type:'category',boundaryGap:false,data:d.daily.map(i=>i.date)},
            yAxis: [{type:'value',name:'访问量'},{type:'value',name:'独立IP'}],
            series: [
              {name:'访问量',type:'line',smooth:true,symbolSize:7,areaStyle:{opacity:0.12},data:d.daily.map(i=>i.views)},
              {name:'独立IP',type:'line',smooth:true,yAxisIndex:1,symbolSize:7,data:d.daily.map(i=>i.uniqueIps)}
            ]
          });
          const hc = echarts.init(document.getElementById('hourly-chart'));
          hc.setOption({
            tooltip: {trigger:'axis'}, grid: {left:42,right:16,top:24,bottom:28},
            xAxis: {type:'category',data:d.hourly.map(i=>i.hour)},
            yAxis: {type:'value',name:'访问量'},
            series: [{type:'bar',barWidth:'58%',itemStyle:{borderRadius:[6,6,0,0]},data:d.hourly.map(i=>i.views)}]
          });
          const rc = echarts.init(document.getElementById('referrer-chart'));
          rc.setOption({
            tooltip: {trigger:'item'}, legend: {bottom:0,left:'center'},
            series: [{type:'pie',radius:['48%','74%'],itemStyle:{borderRadius:8,borderColor:'#fff',borderWidth:2},label:{formatter:'{b}\\n{d}%'},data:d.referrers.length?d.referrers.map(i=>({name:i.name,value:i.views})):[{name:'鏆傛棤鏁版嵁',value:1}]}]
          });
          window.addEventListener('resize',()=>{dc.resize();hc.resize();rc.resize();});
        })();
      </script>`,
    },
  );
}

function ipDetailPage(ip) {
  const geo = readBlacklist();
  const blocked = geo.some((b) => b.ip === ip);
  const detail = ipDetail(ip);

  return layout(
    `IP 璇︽儏: ${ip}`,
    `<section class="panel">
      <div class="panel-head">
        <div><h1>IP 璇︽儏: ${htmlEscape(ip)}</h1><p>璁块棶 ${detail.totalViews} 娆★紝娑夊強 ${detail.visitedPosts.length} 绡囨枃绔?/p></div>
        <div>
          ${blocked
            ? `<form action="${ADMIN_BASE}/analytics/blacklist/${encodeURIComponent(ip)}/remove" method="post" style="display:inline"><button>瑙ｉ櫎灏佺</button></form>`
            : `<form action="${ADMIN_BASE}/analytics/blacklist/${encodeURIComponent(ip)}" method="post" style="display:inline"><button class="danger">灏佺姝?IP</button></form>`}
          <a class="button" href="${ADMIN_BASE}/analytics">杩斿洖缁熻</a>
        </div>
      </div>
      <div class="meta-list">
        <div><span>棣栨璁块棶</span><strong>${htmlEscape(detail.firstVisitAt || '鏈煡')}</strong></div>
        <div><span>鏈€杩戣闂?/span><strong>${htmlEscape(detail.lastVisitAt || '鏈煡')}</strong></div>
        <div><span>鏉ユ簮娓犻亾</span><strong>${htmlEscape(detail.referrers.join(' / ') || '鐩存帴璁块棶')}</strong></div>
      </div>
      <h2>璁块棶杩囩殑鏂囩珷</h2>
      <ul>${detail.visitedPosts.map((p) => `<li><a href="${htmlEscape(p)}" target="_blank">${htmlEscape(p)}</a></li>`).join('')}</ul>
      <h2>鏈€杩戣闂褰?/h2>
      <table>
        <thead><tr><th>鏃堕棿</th><th>鏂囩珷</th><th>鏉ユ簮</th><th>UA</th></tr></thead>
        <tbody>${detail.visits.map((v) => `<tr>
          <td>${htmlEscape(v.at)}</td>
          <td><a href="${htmlEscape(v.path)}" target="_blank">${htmlEscape(v.title)}</a></td>
          <td>${htmlEscape(v.referrer)}</td>
          <td class="ua-cell">${htmlEscape(v.userAgent || '')}</td>
        </tr>`).join('')}</tbody>
      </table>
    </section>`,
    { current: '/analytics' },
  );
}

// ==================== MESSAGES ====================

function messagesPage() {
  const filter = ''; // TODO: filter param support
  const flatten = [];
  const walk = (items, depth = 0) => {
    for (const item of items) {
      flatten.push({ ...item, depth });
      walk(item.replies || [], depth + 1);
    }
  };
  walk(messageTree({ includePrivate: true }));

  const rows = flatten
    .map(
      (item) => `<tr class="${item.isAdmin ? 'admin-message' : ''}${item.status === 'pending' ? ' message-pending' : ''}">
    <td class="message-author-cell">
      <div style="padding-left:${item.depth * 18}px">
        <strong>${htmlEscape(item.author)}${item.isAdmin ? '<span class="badge">鍗氫富</span>' : ''}</strong>
        ${item.status === 'pending' ? '<span class="badge badge-warning">寰呭鏍?/span>' : ''}
        <small>IP锛?{htmlEscape(item.ip || '')}</small>
        <small>ID锛?{htmlEscape(item.id)}</small>
      </div>
    </td>
    <td class="message-content-cell">
      <div class="message-content">${htmlEscape(item.content).replaceAll('\n', '<br>')}</div>
      <form class="inline-reply" action="${ADMIN_BASE}/messages/${encodeURIComponent(item.id)}/reply" method="post">
        <input name="author" value="Jing" aria-label="鍥炲鑰?>
        <textarea name="content" rows="2" maxlength="1200" placeholder="鍥炲杩欐潯鐣欒█..." required></textarea>
        <button class="primary">鍥炲</button>
      </form>
    </td>
    <td>${htmlEscape(item.createdAt || '')}</td>
    <td class="row-actions">
      ${item.status === 'pending' ? `<form action="${ADMIN_BASE}/messages/${encodeURIComponent(item.id)}/approve" method="post" style="display:inline"><button class="primary">瀹℃牳閫氳繃</button></form>` : ''}
      <form action="${ADMIN_BASE}/messages/${encodeURIComponent(item.id)}/delete" method="post" onsubmit="return confirm('纭畾鍒犻櫎杩欐潯鐣欒█鍚楋紵')" style="display:inline"><button class="danger">鍒犻櫎</button></form>
    </td>
  </tr>`,
    )
    .join('');

  const stats = getMessageStats();

  return layout(
    '鐣欒█绠＄悊',
    `<section class="panel">
      <div class="panel-head">
        <div>
          <h1>鐣欒█绠＄悊</h1>
          <p>鍏?${stats.total} 鏉★紝${stats.approved} 宸插鏍革紝<strong style="color:var(--danger)">${stats.pending} 寰呭鏍?/strong></p>
        </div>
      </div>
      <table>
        <thead><tr><th>鐢ㄦ埛</th><th>鍐呭涓庡洖澶?/th><th>鏃堕棿</th><th>鎿嶄綔</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4">鏆傛棤鐣欒█</td></tr>'}</tbody>
      </table>
    </section>`,
    { current: '/messages' },
  );
}

// ==================== MEDIA LIBRARY ====================

function mediaPage() {
  const images = listImages();
  const cards = images
    .map(
      (img) => `<div class="media-card">
    <div class="media-thumb">
      <img src="${htmlEscape(img.path)}" alt="${htmlEscape(img.name)}" loading="lazy">
    </div>
    <div class="media-info">
      <strong>${htmlEscape(img.name)}</strong>
      <small>${htmlEscape(img.sizeFormatted)}</small>
      <div class="media-actions">
        <button onclick="copyToClipboard('${htmlEscape(img.path)}')" class="button">澶嶅埗璺緞</button>
        <button onclick="copyToClipboard('![](${htmlEscape(img.path)})')" class="button">澶嶅埗 MD</button>
        <form action="${ADMIN_BASE}/media/${encodeURIComponent(img.name)}/delete" method="post" onsubmit="return confirm('纭畾鍒犻櫎鍚楋紵')" style="display:inline"><button class="danger">鍒犻櫎</button></form>
      </div>
    </div>
  </div>`,
    )
    .join('');

  return layout(
    '媒体库',
    `<section class="panel">
      <div class="panel-head">
        <div><h1>濯掍綋搴?/h1><p>鍏?${images.length} 寮犲浘鐗囥€備笂浼犳柊鍥剧墖鐢ㄤ簬鏂囩珷灏侀潰鎴栧唴瀹规彃鍥俱€?/p></div>
        <form class="upload-form" action="${ADMIN_BASE}/media/upload" method="post" enctype="multipart/form-data">
          <input type="file" name="image" accept=".jpg,.jpeg,.png,.gif,.webp,.svg,image/*" required>
          <button class="primary">涓婁紶</button>
        </form>
      </div>
      <div class="media-grid">${cards || '<p class="empty-state">鏆傛棤涓婁紶鐨勫浘鐗?/p>'}</div>
    </section>`,
    {
      current: '/media',
      extraScript: `<script>
        function copyToClipboard(text) {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => showToast('宸插鍒? ' + text));
          } else {
            const el = document.createElement('textarea');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            showToast('宸插鍒? ' + text);
          }
        }
      </script>`,
    },
  );
}

// ==================== TAXONOMY ====================

function taxonomyPage(body = {}) {
  const categories = getAllCategories();
  const tags = getAllTags();
  const error = body.error || '';
  const ok = body.ok || '';

  const catRows = categories
    .map(
      (c) => `<tr>
    <td><strong>${htmlEscape(c.name)}</strong></td>
    <td>${c.count} 绡?/td>
    <td>
      <a class="button" href="${ADMIN_BASE}/posts?category=${encodeURIComponent(c.name)}">鏌ョ湅鏂囩珷</a>
      <button class="button" onclick="document.getElementById('rename-cat-old').value='${htmlEscape(c.name)}';document.getElementById('rename-cat-dlg').showModal()">閲嶅懡鍚?/button>
    </td>
  </tr>`,
    )
    .join('');

  const tagRows = tags
    .map(
      (t) => `<tr>
    <td><strong>${htmlEscape(t.name)}</strong></td>
    <td>${t.count} 绡?/td>
    <td>
      <a class="button" href="${ADMIN_BASE}/posts?tag=${encodeURIComponent(t.name)}">鏌ョ湅鏂囩珷</a>
      <button class="button" onclick="document.getElementById('rename-tag-old').value='${htmlEscape(t.name)}';document.getElementById('rename-tag-dlg').showModal()">閲嶅懡鍚?/button>
    </td>
  </tr>`,
    )
    .join('');

  return layout(
    '分类与标签',
    `<section class="panel">
      ${error ? `<div class="alert">${htmlEscape(error)}</div>` : ''}
      ${ok ? `<div class="alert alert-ok">${htmlEscape(ok)}</div>` : ''}
      <h1>鍒嗙被涓庢爣绛剧鐞?/h1>
      <p>杩欓噷鍙互鏌ョ湅銆侀噸鍛藉悕鍒嗙被鍜屾爣绛俱€傞噸鍛藉悕浼氭洿鏂版墍鏈夊叧鑱旀枃绔犮€?/p>
    </section>
    <section class="table-grid">
      <section class="panel">
        <div class="panel-head compact"><div><h2>鍒嗙被 (${categories.length})</h2></div></div>
        <table>
          <thead><tr><th>鍚嶇О</th><th>鏂囩珷鏁?/th><th>鎿嶄綔</th></tr></thead>
          <tbody>${catRows || '<tr><td colspan="3">鏆傛棤鍒嗙被</td></tr>'}</tbody>
        </table>
      </section>
      <section class="panel">
        <div class="panel-head compact"><div><h2>鏍囩 (${tags.length})</h2></div></div>
        <table>
          <thead><tr><th>鍚嶇О</th><th>鏂囩珷鏁?/th><th>鎿嶄綔</th></tr></thead>
          <tbody>${tagRows || '<tr><td colspan="3">鏆傛棤鏍囩</td></tr>'}</tbody>
        </table>
      </section>
    </section>
    <dialog id="rename-cat-dlg">
      <form method="post" action="${ADMIN_BASE}/taxonomy/category/rename">
        <h3>閲嶅懡鍚嶅垎绫?/h3>
        <input id="rename-cat-old" name="oldName" type="hidden">
        <label>鏂板悕绉?input name="newName" required></label>
        <div class="actions"><button class="primary">纭</button><button type="button" onclick="this.closest('dialog').close()">鍙栨秷</button></div>
      </form>
    </dialog>
    <dialog id="rename-tag-dlg">
      <form method="post" action="${ADMIN_BASE}/taxonomy/tag/rename">
        <h3>閲嶅懡鍚嶆爣绛?/h3>
        <input id="rename-tag-old" name="oldName" type="hidden">
        <label>鏂板悕绉?input name="newName" required></label>
        <div class="actions"><button class="primary">纭</button><button type="button" onclick="this.closest('dialog').close()">鍙栨秷</button></div>
      </form>
    </dialog>`,
    { current: '/taxonomy' },
  );
}

// ==================== SETTINGS ====================

function settingsPage() {
  const settings = readSettings();
  return layout(
    '绔欑偣璁剧疆',
    `<section class="panel">
      <h1>绔欑偣璁剧疆</h1>
      <p>淇敼 Hexo 绔欑偣鍜?Butterfly 涓婚閰嶇疆銆?/p>
      <form class="editor" action="${ADMIN_BASE}/settings" method="post" enctype="multipart/form-data">
        <div class="grid two">
          <label>绔欑偣鍚嶇О<input name="title" value="${htmlEscape(settings.title)}" required></label>
          <label>浣滆€呭悕<input name="author" value="${htmlEscape(settings.author)}" required></label>
        </div>
        <label>鍓爣棰?input name="subtitle" value="${htmlEscape(settings.subtitle)}"></label>
        <label>绔欑偣鎻忚堪<textarea name="description" rows="3">${htmlEscape(settings.description)}</textarea></label>
        <div class="grid two">
          <label>閭<input name="email" type="email" value="${htmlEscape(settings.email)}"></label>
          <label>GitHub<input name="github" value="${htmlEscape(settings.github)}"></label>
        </div>
        <div class="grid two">
          <label>QQ<input name="qq" value="${htmlEscape(settings.qq)}"></label>
          <label>寰俊<input name="wechat" value="${htmlEscape(settings.wechat)}"></label>
        </div>
        <div class="grid two">
          <label>Linux.do<input name="linuxdo" value="${htmlEscape(settings.linuxdo)}"></label>
          <label>Gitee<input name="gitee" value="${htmlEscape(settings.gitee)}"></label>
        </div>
        <label>浣滆€呭崱鐗囦粙缁?input name="authorDescription" value="${htmlEscape(settings.authorDescription)}"></label>
        <label>鍏憡<textarea name="announcement" rows="3">${htmlEscape(settings.announcement)}</textarea></label>
        <label>褰撳墠澶村儚 <input value="${htmlEscape(settings.avatar)}" readonly></label>
        <label>涓婁紶鏂板ご鍍?input name="avatar" type="file" accept=".jpg,.jpeg,.png,.webp,.svg,image/*"></label>
        <div class="actions">
          <button class="primary">淇濆瓨骞跺彂甯?/button>
          <a class="button" href="${ADMIN_BASE}/">杩斿洖</a>
        </div>
      </form>
    </section>`,
    { current: '/settings' },
  );
}

// ==================== BUILD ====================

function buildPage() {
  const statusLabel =
    buildState.status === 'success'
      ? '鏋勫缓鎴愬姛'
      : buildState.status === 'building'
        ? '鏋勫缓涓?..'
        : buildState.status === 'failed'
          ? '鏋勫缓澶辫触'
          : '绌洪棽';

  const statusClass =
    buildState.status === 'success'
      ? 'build-ok'
      : buildState.status === 'failed'
        ? 'build-fail'
        : '';

  return layout(
    '鏋勫缓绠＄悊',
    `<section class="panel">
      <div class="panel-head">
        <div><h1>鏋勫缓绠＄悊</h1><p>瑙﹀彂绔欑偣閲嶆柊鏋勫缓骞堕儴缃插埌绾夸笂銆?/p></div>
        <form action="${ADMIN_BASE}/build/trigger" method="post">
          <button class="primary" ${buildState.status === 'building' ? 'disabled' : ''}>
            ${buildState.status === 'building' ? '构建中...' : '重新构建并部署'}
          </button>
        </form>
      </div>
    </section>
    <section class="panel">
      <div class="panel-head compact"><div><h2>鏋勫缓鐘舵€?/h2></div></div>
      <div class="meta-list">
        <div><span>褰撳墠鐘舵€?/span><strong class="${statusClass}">${htmlEscape(statusLabel)}</strong></div>
        <div><span>鏈€杩戞瀯寤?/span><strong>${buildState.lastAt ? htmlEscape(buildState.lastAt.slice(0, 19).replace('T', ' ')) : '浠庢湭鏋勫缓'}</strong></div>
        <div><span>鑰楁椂</span><strong>${buildState.lastDuration ? `${buildState.lastDuration}s` : 'N/A'}</strong></div>
      </div>
    </section>
    ${buildState.lastLog ? `<section class="panel">
      <div class="panel-head compact"><div><h2>鏋勫缓鏃ュ織</h2></div></div>
      <pre>${htmlEscape(buildState.lastLog)}</pre>
    </section>` : ''}`,
    { current: '' },
  );
}

// ==================== AUDIT LOG ====================

function auditPage() {
  const logs = readAuditLog({ limit: 100 });
  const rows = logs
    .map(
      (l) => `<tr>
    <td>${htmlEscape((l.at || '').slice(0, 19).replace('T', ' '))}</td>
    <td><span class="badge badge-sm">${htmlEscape(l.action)}</span></td>
    <td>${htmlEscape(l.details)}</td>
    <td>${htmlEscape(l.ip)}</td>
  </tr>`,
    )
    .join('');

  return layout(
    '鎿嶄綔鏃ュ織',
    `<section class="panel">
      <div class="panel-head">
        <div><h1>鎿嶄綔鏃ュ織</h1><p>璁板綍鍚庡彴鍏抽敭鎿嶄綔锛屾渶澶氫繚鐣?500 鏉°€?/p></div>
      </div>
      <table>
        <thead><tr><th>鏃堕棿</th><th>鎿嶄綔</th><th>璇︽儏</th><th>IP</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4">鏆傛棤鏃ュ織</td></tr>'}</tbody>
      </table>
    </section>`,
    { current: '/audit' },
  );
}

// ==================== ROUTES ====================

// Auth
app.get(LOGIN_PATH, (req, res) => res.send(loginPage()));
app.get(`${ADMIN_BASE}/login`, (req, res) => res.redirect(LOGIN_PATH));
app.post(LOGIN_PATH, async (req, res) => {
  if (req.body.username !== (process.env.ADMIN_USER || 'admin')) {
    return res.status(401).send(loginPage('璐﹀彿鎴栧瘑鐮佷笉姝ｇ‘'));
  }
  if (!(await verifyPassword(req.body.password))) {
    return res.status(401).send(loginPage('璐﹀彿鎴栧瘑鐮佷笉姝ｇ‘'));
  }
  req.session.authenticated = true;
  logAction('login', '管理员登录', clientIp(req));
  res.redirect(`${ADMIN_BASE}/`);
});
app.post(LOGOUT_PATH, ensureAuth, (req, res) => {
  logAction('logout', '管理员登出', clientIp(req));
  req.session.destroy(() => res.redirect(LOGIN_PATH));
});

// Track
app.post('/track/view', (req, res) => {
  const ok = recordVisit(req);
  res.status(ok ? 204 : 400).end();
});

// Public message API
app.get('/api/messages', (req, res) => {
  res.json({ messages: messageTree() });
});
app.post('/api/messages', (req, res) => {
  try {
    const message = createMessage(req.body || {}, req);
    res.status(201).json({ ok: true, message });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

// Dashboard
app.get(`${ADMIN_BASE}/`, ensureAuth, (req, res) => res.send(dashboardPage()));

// Posts
app.get(`${ADMIN_BASE}/posts`, ensureAuth, (req, res) =>
  res.send(postListPage(req.query)),
);
app.get(`${ADMIN_BASE}/posts/new`, ensureAuth, (req, res) =>
  res.send(postFormPage()),
);
app.post(`${ADMIN_BASE}/posts`, ensureAuth, async (req, res, next) => {
  try {
    const file = writePost(null, req.body);
    logAction('create_post', `鍒涘缓鏂囩珷: ${req.body.title}`, clientIp(req));
    await rebuildAndDeploy();
    res.redirect(`${ADMIN_BASE}/posts`);
  } catch (error) {
    next(error);
  }
});
app.get(`${ADMIN_BASE}/posts/:file`, ensureAuth, (req, res, next) => {
  try {
    res.send(postFormPage(readPost(req.params.file)));
  } catch (error) {
    next(error);
  }
});
app.post(`${ADMIN_BASE}/posts/:file`, ensureAuth, async (req, res, next) => {
  try {
    writePost(req.params.file, req.body);
    logAction('edit_post', `缂栬緫鏂囩珷: ${req.body.title || req.params.file}`, clientIp(req));
    await rebuildAndDeploy();
    res.redirect(`${ADMIN_BASE}/posts`);
  } catch (error) {
    next(error);
  }
});
app.post(
  `${ADMIN_BASE}/posts/:file/delete`,
  ensureAuth,
  async (req, res, next) => {
    try {
      const post = readPost(req.params.file);
      deletePost(req.params.file);
      logAction('delete_post', `鍒犻櫎鏂囩珷: ${post.title}`, clientIp(req));
      await rebuildAndDeploy();
      res.redirect(`${ADMIN_BASE}/posts`);
    } catch (error) {
      next(error);
    }
  },
);

// Analytics
app.get(`${ADMIN_BASE}/analytics`, ensureAuth, (req, res) => {
  const days = Math.max(7, Math.min(90, Number(req.query.days) || 30));
  res.send(analyticsPage(days));
});
app.post(
  `${ADMIN_BASE}/analytics/reset`,
  ensureAuth,
  (req, res) => {
    resetAnalytics();
    logAction('reset_analytics', '娓呯┖璁块棶缁熻', clientIp(req));
    res.redirect(`${ADMIN_BASE}/analytics`);
  },
);
app.get(`${ADMIN_BASE}/analytics/ip/:ip`, ensureAuth, (req, res) => {
  res.send(ipDetailPage(req.params.ip));
});
app.post(
  `${ADMIN_BASE}/analytics/blacklist/:ip`,
  ensureAuth,
  (req, res) => {
    addToBlacklist(req.params.ip, '管理员手动封禁');
    logAction('block_ip', `灏佺 IP: ${req.params.ip}`, clientIp(req));
    res.redirect(`${ADMIN_BASE}/analytics`);
  },
);
app.post(
  `${ADMIN_BASE}/analytics/blacklist/:ip/remove`,
  ensureAuth,
  (req, res) => {
    removeFromBlacklist(req.params.ip);
    logAction('unblock_ip', `瑙ｅ皝 IP: ${req.params.ip}`, clientIp(req));
    res.redirect(`${ADMIN_BASE}/analytics`);
  },
);

// Messages
app.get(`${ADMIN_BASE}/messages`, ensureAuth, (req, res) =>
  res.send(messagesPage()),
);
app.post(
  `${ADMIN_BASE}/messages/:id/reply`,
  ensureAuth,
  (req, res, next) => {
    try {
      createAdminReply(req.params.id, req.body || {}, req);
      logAction('reply_message', `鍥炲鐣欒█: ${req.params.id}`, clientIp(req));
      res.redirect(`${ADMIN_BASE}/messages`);
    } catch (error) {
      next(error);
    }
  },
);
app.post(
  `${ADMIN_BASE}/messages/:id/delete`,
  ensureAuth,
  (req, res, next) => {
    try {
      deleteMessage(req.params.id);
      logAction('delete_message', `鍒犻櫎鐣欒█: ${req.params.id}`, clientIp(req));
      res.redirect(`${ADMIN_BASE}/messages`);
    } catch (error) {
      next(error);
    }
  },
);
app.post(
  `${ADMIN_BASE}/messages/:id/approve`,
  ensureAuth,
  (req, res, next) => {
    try {
      approveMessage(req.params.id);
      logAction('approve_message', `瀹℃牳閫氳繃鐣欒█: ${req.params.id}`, clientIp(req));
      res.redirect(`${ADMIN_BASE}/messages`);
    } catch (error) {
      next(error);
    }
  },
);
app.post(
  `${ADMIN_BASE}/messages/batch-delete`,
  ensureAuth,
  (req, res) => {
    const ids = splitList(req.body.ids);
    const count = batchDeleteMessages(ids);
    logAction('batch_delete_messages', `鎵归噺鍒犻櫎 ${count} 鏉＄暀瑷€`, clientIp(req));
    res.redirect(`${ADMIN_BASE}/messages`);
  },
);

// Media
app.get(`${ADMIN_BASE}/media`, ensureAuth, (req, res) => res.send(mediaPage()));
app.post(
  `${ADMIN_BASE}/media/upload`,
  ensureAuth,
  upload.single('image'),
  (req, res, next) => {
    try {
      const url = uploadImage(req.file);
      logAction('upload_image', `涓婁紶鍥剧墖: ${url}`, clientIp(req));
      res.redirect(`${ADMIN_BASE}/media`);
    } catch (error) {
      next(error);
    }
  },
);
app.post(
  `${ADMIN_BASE}/media/:file/delete`,
  ensureAuth,
  (req, res, next) => {
    try {
      deleteImage(req.params.file);
      logAction('delete_image', `鍒犻櫎鍥剧墖: ${req.params.file}`, clientIp(req));
      res.redirect(`${ADMIN_BASE}/media`);
    } catch (error) {
      next(error);
    }
  },
);

// Taxonomy
app.get(`${ADMIN_BASE}/taxonomy`, ensureAuth, (req, res) =>
  res.send(taxonomyPage()),
);
app.post(
  `${ADMIN_BASE}/taxonomy/category/rename`,
  ensureAuth,
  (req, res, next) => {
    try {
      const count = renameCategory(req.body.oldName, req.body.newName);
      logAction(
        'rename_category',
        `重命名分类: ${req.body.oldName} -> ${req.body.newName} (${count} 篇)`,
        clientIp(req),
      );
      res.send(
        taxonomyPage({
          ok: `分类 "${req.body.oldName}" 已重命名为 "${req.body.newName}"，共更新 ${count} 篇文章。`,
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);
app.post(
  `${ADMIN_BASE}/taxonomy/tag/rename`,
  ensureAuth,
  (req, res, next) => {
    try {
      const count = renameTag(req.body.oldName, req.body.newName);
      logAction(
        'rename_tag',
        `重命名标签: ${req.body.oldName} -> ${req.body.newName} (${count} 篇)`,
        clientIp(req),
      );
      res.send(
        taxonomyPage({
          ok: `标签 "${req.body.oldName}" 已重命名为 "${req.body.newName}"，共更新 ${count} 篇文章。`,
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);

// Settings
app.get(`${ADMIN_BASE}/settings`, ensureAuth, (req, res) =>
  res.send(settingsPage()),
);
app.post(
  `${ADMIN_BASE}/settings`,
  ensureAuth,
  upload.single('avatar'),
  async (req, res, next) => {
    try {
      writeSettings(req.body, req.file);
      logAction('update_settings', '鏇存柊绔欑偣璁剧疆', clientIp(req));
      await rebuildAndDeploy();
      res.redirect(`${ADMIN_BASE}/settings`);
    } catch (error) {
      next(error);
    }
  },
);

// Build
app.get(`${ADMIN_BASE}/build`, ensureAuth, (req, res) => res.send(buildPage()));
app.post(`${ADMIN_BASE}/build/trigger`, ensureAuth, async (req, res, next) => {
  try {
    logAction('trigger_build', '鎵嬪姩瑙﹀彂鏋勫缓', clientIp(req));
    await rebuildAndDeploy();
    res.redirect(`${ADMIN_BASE}/build`);
  } catch (error) {
    next(error);
  }
});

// Audit
app.get(`${ADMIN_BASE}/audit`, ensureAuth, (req, res) => res.send(auditPage()));

// Static
app.get('/', publicStatic);

// Error
app.use((error, req, res, next) => {
  console.error(error);
  res
    .status(500)
    .send(
      layout(
        '出错了',
        `<section class="panel"><h1>鎿嶄綔澶辫触</h1><pre>${htmlEscape(error.message)}</pre><a class="button" href="${ADMIN_BASE}/">杩斿洖鍚庡彴</a></section>`,
        { current: '' },
      ),
    );
});

const adminServer = app.listen(
  Number(process.env.ADMIN_PORT || 4010),
  '127.0.0.1',
  () => {
    console.log(
      `Jing Blog Admin listening on http://127.0.0.1:${process.env.ADMIN_PORT || 4010}${ADMIN_BASE}`,
    );
  },
);
adminServer.ref();

