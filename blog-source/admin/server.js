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
      <a href="/" target="_blank" class="button">查看博客</a>
      <form action="${LOGOUT_PATH}" method="post"><button>退出</button></form>
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
  <title>登录 - Jing Blog Admin</title>
  <link rel="stylesheet" href="${ADMIN_BASE}/assets/admin.css">
</head>
<body class="login-page">
  <form class="login-card" action="${LOGIN_PATH}" method="post">
    <h1>博客后台</h1>
    <p>登录后可以管理文章、留言、分类标签和站点资料。</p>
    ${error ? `<div class="alert">${htmlEscape(error)}</div>` : ''}
    <label>账号<input name="username" autocomplete="username" required></label>
    <label>密码<input name="password" type="password" autocomplete="current-password" required></label>
    <button class="primary">登录</button>
  </form>
</body>
</html>`;
}

// ==================== DASHBOARD ====================// ==================== DASHBOARD ====================// ==================== DASHBOARD ====================

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
      <input name="search" value="${htmlEscape(query.search || '')}" placeholder="搜索标题或内容..." style="width:220px">
      <select name="category">
        <option value="">全部分类</option>
        ${categories.map((c) => `<option value="${htmlEscape(c.name)}"${query.category === c.name ? ' selected' : ''}>${htmlEscape(c.name)} (${c.count})</option>`).join('')}
      </select>
      <select name="tag">
        <option value="">全部标签</option>
        ${tags.map((t) => `<option value="${htmlEscape(t.name)}"${query.tag === t.name ? ' selected' : ''}>${htmlEscape(t.name)} (${t.count})</option>`).join('')}
      </select>
      <select name="status">
        <option value="">全部状态</option>
        <option value="published"${query.status === 'published' ? ' selected' : ''}>已发布</option>
        <option value="draft"${query.status === 'draft' ? ' selected' : ''}>草稿</option>
      </select>
      <button>筛选</button>
      ${query.search || query.category || query.tag || query.status ? `<a class="button" href="${ADMIN_BASE}/posts">清除</a>` : ''}
    </form>`;

  const rows = posts
    .map(
      (post) => `<tr>
    <td>
      <div class="post-title-row">
        ${post.top ? '<span class="badge badge-warning">置顶</span>' : ''}
        ${!post.published ? '<span class="badge badge-draft">草稿</span>' : ''}
        <strong>${htmlEscape(post.title)}</strong>
      </div>
      <small>${htmlEscape(post.file)}</small>
    </td>
    <td>${htmlEscape(post.categories.join(', '))}</td>
    <td>${htmlEscape(post.tags.join(', '))}</td>
    <td>${htmlEscape(post.date)}</td>
    <td class="row-actions">
      <a class="button" href="${ADMIN_BASE}/posts/${encodeURIComponent(post.file)}">编辑</a>
      ${post.published ? `<a class="button" href="/posts/${htmlEscape(post.abbrlink || '')}/" target="_blank">查看</a>` : ''}
      <form action="${ADMIN_BASE}/posts/${encodeURIComponent(post.file)}/delete" method="post" onsubmit="return confirm('确定删除这篇文章吗？')" style="display:inline"><button class="danger">删除</button></form>
    </td>
  </tr>`,
    )
    .join('');

  return layout(
    '文章管理',
    `<section class="panel">
      <div class="panel-head">
        <div><h1>文章管理</h1><p>当前共 ${posts.length} 篇文章（${getStats().published} 已发布 / ${getStats().draft} 草稿 / ${getStats().pinned} 置顶）</p></div>
        <a class="button primary" href="${ADMIN_BASE}/posts/new">+ 新建文章</a>
      </div>
      ${filterHtml}
      <table>
        <thead><tr><th>文章</th><th>分类</th><th>标签</th><th>日期</th><th>操作</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5">暂无匹配文章</td></tr>'}</tbody>
      </table>
    </section>`,
    { current: '/posts' },
  );
}

function postFormPage(post = {}) {
  const statusOptions = post.file
    ? `<label class="checkbox-label"><input type="checkbox" name="published" value="true"${post.published !== false ? ' checked' : ''}> 已发布（取消勾选则保存为草稿）</label>
       <label class="checkbox-label"><input type="checkbox" name="top" value="true"${post.top ? ' checked' : ''}> 置顶</label>`
    : `<label class="checkbox-label"><input type="checkbox" name="published" value="true" checked> 已发布（取消勾选则保存为草稿）</label>
       <label class="checkbox-label"><input type="checkbox" name="top" value="true"> 置顶</label>`;

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
          <label>分类<input name="categories" value="${htmlEscape(asArray(post.categories).join(', '))}" placeholder="开发调优, Java"></label>
          <label>标签<input name="tags" value="${htmlEscape(asArray(post.tags).join(', '))}" placeholder="Hexo, Spring"></label>
        </div>
        <label>封面 URL<input name="cover" value="${htmlEscape(post.cover || '')}"></label>
        <label>摘要<textarea name="description" rows="3">${htmlEscape(post.description || '')}</textarea></label>
        <label>正文 Markdown<textarea name="content" class="markdown" rows="22">${htmlEscape(post.content || '')}</textarea></label>
        <div class="grid two compact-grid">
          <label>更新时间<input name="updated" value="${htmlEscape(post.updated || '')}" placeholder="2026-06-30 12:00:00"></label>
          <div class="checkbox-group">${statusOptions}</div>
        </div>
        <div class="actions">
          <button class="primary">保存</button>
          <a class="button" href="${ADMIN_BASE}/posts">返回</a>
        </div>
      </form>
    </section>`,
  );
}

// ==================== ANALYTICS ====================

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
    .map((v) => `<a class="filter-chip${v === days ? ' active' : ''}" href="${ADMIN_BASE}/analytics?days=${v}">${v} 天</a>`)
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
      ${blacklist.some((b) => b.ip === item.ip) ? '<span class="badge badge-danger">已封禁</span>' : ''}
      <small>${htmlEscape(item.referrers.join(' / ') || '直接访问')}</small>
    </td>
    <td>${item.views}</td>
    <td>${item.posts}</td>
    <td>${htmlEscape(item.lastVisitAt || '')}</td>
    <td>
      <a class="button" href="${ADMIN_BASE}/analytics/ip/${encodeURIComponent(item.ip)}">详情</a>
      ${blacklist.some((b) => b.ip === item.ip)
        ? `<form action="${ADMIN_BASE}/analytics/blacklist/${encodeURIComponent(item.ip)}/remove" method="post" style="display:inline"><button>解封</button></form>`
        : `<form action="${ADMIN_BASE}/analytics/blacklist/${encodeURIComponent(item.ip)}" method="post" style="display:inline"><button class="danger">封禁</button></form>`}
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
    '访问统计',
    `<section class="panel hero-panel">
      <div class="panel-head">
        <div><h1>访问统计</h1><p>文章热度、来源 IP、访问趋势和最近明细</p></div>
        <div class="toolbar">
          <div class="filter-group">${rangeLinks}</div>
          <form action="${ADMIN_BASE}/analytics/reset" method="post" onsubmit="return confirm('确定清空全部访问统计吗？')">
            <button class="danger">清空统计</button>
          </form>
        </div>
      </div>
      <div class="stats-grid">${cardHtml}</div>
    </section>
    <section class="chart-grid">
      <section class="panel">
        <div class="panel-head compact"><div><h2>访问趋势</h2><p>最近 ${days} 天访问量与独立 IP</p></div></div>
        <div class="chart" id="daily-chart"></div>
      </section>
      <section class="panel">
        <div class="panel-head compact"><div><h2>24 小时分布</h2></div></div>
        <div class="chart" id="hourly-chart"></div>
      </section>
      <section class="panel">
        <div class="panel-head compact"><div><h2>来源分布</h2></div></div>
        <div class="chart chart-donut" id="referrer-chart"></div>
      </section>
      <section class="panel">
        <div class="panel-head compact"><div><h2>统计口径</h2></div></div>
        <div class="meta-list">
          <div><span>统计记录上限</span><strong>${limits.maxVisits}</strong></div>
          <div><span>最近访问展示</span><strong>${limits.recentVisits}</strong></div>
          <div><span>热门文章榜单</span><strong>${limits.topPosts}</strong></div>
          <div><span>热门 IP 榜单</span><strong>${limits.topIps}</strong></div>
        </div>
      </section>
    </section>
    <section class="table-grid">
      <section class="panel">
        <div class="panel-head compact"><div><h2>热门文章</h2></div></div>
        <table>
          <thead><tr><th>#</th><th>文章</th><th>访问量</th><th>独立 IP</th><th>最近访问</th></tr></thead>
          <tbody>${topPostRows || '<tr><td colspan="5">暂无统计</td></tr>'}</tbody>
        </table>
      </section>
      <section class="panel">
        <div class="panel-head compact"><div><h2>Top IP</h2></div></div>
        <table>
          <thead><tr><th>#</th><th>IP / 来源</th><th>访问量</th><th>文章数</th><th>最近访问</th><th>操作</th></tr></thead>
          <tbody>${ipRows || '<tr><td colspan="6">暂无记录</td></tr>'}</tbody>
        </table>
      </section>
    </section>
    <section class="panel">
      <div class="panel-head compact"><div><h2>最近访问明细</h2></div></div>
      <table>
        <thead><tr><th>时间</th><th>文章</th><th>IP</th><th>来源</th><th>UA</th></tr></thead>
        <tbody>${visitRows || '<tr><td colspan="5">暂无记录</td></tr>'}</tbody>
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
            tooltip: {trigger:'item'},
            series: [{type:'pie',radius:['48%','74%'],itemStyle:{borderRadius:8,borderColor:'#fff',borderWidth:2},label:{formatter:'{b}\n{d}%'},data:d.referrers.length?d.referrers.map(i=>({name:i.name,value:i.views})):[{name:'暂无来源',value:1}]}]
          });
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
    `IP 详情: ${ip}`,
    `<section class="panel">
      <div class="panel-head">
        <div><h1>IP 详情: ${htmlEscape(ip)}</h1><p>共 ${detail.totalViews} 次访问，访问过 ${detail.visitedPosts.length} 篇文章</p></div>
        <div>
          ${blocked
            ? `<form action="${ADMIN_BASE}/analytics/blacklist/${encodeURIComponent(ip)}/remove" method="post" style="display:inline"><button>解除封禁</button></form>`
            : `<form action="${ADMIN_BASE}/analytics/blacklist/${encodeURIComponent(ip)}" method="post" style="display:inline"><button class="danger">封禁 IP</button></form>`}
          <a class="button" href="${ADMIN_BASE}/analytics">返回统计</a>
        </div>
      </div>
      <div class="meta-list">
        <div><span>首次访问</span><strong>${htmlEscape(detail.firstVisitAt || '暂无')}</strong></div>
        <div><span>最近访问</span><strong>${htmlEscape(detail.lastVisitAt || '暂无')}</strong></div>
        <div><span>来源</span><strong>${htmlEscape(detail.referrers.join(' / ') || '直接访问')}</strong></div>
      </div>
      <h2>访问过的文章</h2>
      <ul>${detail.visitedPosts.map((p) => `<li><a href="${htmlEscape(p)}" target="_blank">${htmlEscape(p)}</a></li>`).join('')}</ul>
      <h2>访问明细</h2>
      <table>
        <thead><tr><th>时间</th><th>文章</th><th>来源</th><th>UA</th></tr></thead>
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

// ==================== MESSAGES ====================

function messagesPage() {
  const flatten = [];
  const walk = (items, depth = 0) => {
    for (const item of items) {
      flatten.push({ ...item, depth });
      if (item.replies?.length) walk(item.replies, depth + 1);
    }
  };
  walk(messageTree({ includePrivate: true }));

  const rows = flatten
    .map(
      (item) => `<tr class="${item.isAdmin ? 'admin-message' : ''}${item.status === 'pending' ? ' message-pending' : ''}">
    <td class="message-author-cell">
      <div style="padding-left:${item.depth * 18}px">
        <strong>${htmlEscape(item.author)}${item.isAdmin ? '<span class="badge">管理员</span>' : ''}</strong>
        ${item.status === 'pending' ? '<span class="badge badge-warning">待审核</span>' : ''}
        <small>IP: ${htmlEscape(item.ip || '')}</small>
        <small>ID: ${htmlEscape(item.id)}</small>
      </div>
    </td>
    <td class="message-content-cell">
      <div class="message-content">${htmlEscape(item.content).replaceAll('\n', '<br>')}</div>
      <form class="inline-reply" action="${ADMIN_BASE}/messages/${encodeURIComponent(item.id)}/reply" method="post">
        <input name="author" value="Jing" aria-label="回复作者" required>
        <textarea name="content" rows="2" maxlength="1200" placeholder="写一条回复..." required></textarea>
        <button class="primary">回复</button>
      </form>
    </td>
    <td>${htmlEscape(item.createdAt || '')}</td>
    <td class="row-actions">
      ${item.status === 'pending' ? `<form action="${ADMIN_BASE}/messages/${encodeURIComponent(item.id)}/approve" method="post" style="display:inline"><button class="primary">审核通过</button></form>` : ''}
      <form action="${ADMIN_BASE}/messages/${encodeURIComponent(item.id)}/delete" method="post" onsubmit="return confirm('确定删除这条留言吗？')" style="display:inline"><button class="danger">删除</button></form>
    </td>
  </tr>`,
    )
    .join('');

  const stats = getMessageStats();

  return layout(
    '留言管理',
    `<section class="panel">
      <div class="panel-head">
        <div>
          <h1>留言管理</h1>
          <p>共 ${stats.total} 条，${stats.approved} 已审核，<strong style="color:var(--danger)">${stats.pending} 待审核</strong></p>
        </div>
      </div>
      <table>
        <thead><tr><th>用户</th><th>内容与回复</th><th>时间</th><th>操作</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4">暂无留言</td></tr>'}</tbody>
      </table>
    </section>`,
    { current: '/messages' },
  );
}

// ==================== MEDIA LIBRARY ====================

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
        <button onclick="copyToClipboard('${htmlEscape(img.path)}')" class="button">复制路径</button>
        <button onclick="copyToClipboard('![](${htmlEscape(img.path)})')" class="button">复制 MD</button>
        <form action="${ADMIN_BASE}/media/${encodeURIComponent(img.name)}/delete" method="post" onsubmit="return confirm('确定删除吗？')" style="display:inline"><button class="danger">删除</button></form>
      </div>
    </div>
  </div>`,
    )
    .join('');

  return layout(
    '媒体库',
    `<section class="panel">
      <div class="panel-head">
        <div><h1>媒体库</h1><p>共 ${images.length} 张图片。上传新图片用于文章封面或内容插图。</p></div>
        <form class="upload-form" action="${ADMIN_BASE}/media/upload" method="post" enctype="multipart/form-data">
          <input type="file" name="image" accept=".jpg,.jpeg,.png,.gif,.webp,.svg,image/*" required>
          <button class="primary">上传</button>
        </form>
      </div>
      <div class="media-grid">${cards || '<p class="empty-state">暂无上传的图片</p>'}</div>
    </section>`,
    {
      current: '/media',
      extraScript: `<script>
        function copyToClipboard(text) {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => showToast('已复制 ' + text));
          } else {
            const el = document.createElement('textarea');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            showToast('已复制 ' + text);
          }
        }
      </script>`,
    },
  );
}

// ==================== TAXONOMY ====================

// ==================== TAXONOMY ====================

function taxonomyPage(body = {}) {
  const categories = getAllCategories();
  const tags = getAllTags();
  const ok = body.ok || '';
  const error = body.error || '';

  const catRows = categories.map((c) => `<tr><td>${htmlEscape(c.name)}</td><td>${c.count}</td><td><a class="button" href="${ADMIN_BASE}/posts?category=${encodeURIComponent(c.name)}">查看文章</a><button class="button" onclick="document.getElementById('rename-cat-old').value='${htmlEscape(c.name)}';document.getElementById('rename-cat-dlg').showModal()">重命名</button></td></tr>`).join('');
  const tagRows = tags.map((t) => `<tr><td>${htmlEscape(t.name)}</td><td>${t.count}</td><td><a class="button" href="${ADMIN_BASE}/posts?tag=${encodeURIComponent(t.name)}">查看文章</a><button class="button" onclick="document.getElementById('rename-tag-old').value='${htmlEscape(t.name)}';document.getElementById('rename-tag-dlg').showModal()">重命名</button></td></tr>`).join('');

  return layout(
    '分类与标签',
    `<section class="panel">
      ${error ? `<div class="alert">${htmlEscape(error)}</div>` : ''}
      ${ok ? `<div class="alert alert-ok">${htmlEscape(ok)}</div>` : ''}
      <h1>分类与标签管理</h1>
      <p>这里可以查看、重命名分类和标签。重命名会更新所有关联文章。</p>
    </section>
    <section class="table-grid">
      <section class="panel">
        <div class="panel-head compact"><div><h2>分类 (${categories.length})</h2></div></div>
        <table>
          <thead><tr><th>名称</th><th>文章数</th><th>操作</th></tr></thead>
          <tbody>${catRows || '<tr><td colspan="3">暂无分类</td></tr>'}</tbody>
        </table>
      </section>
      <section class="panel">
        <div class="panel-head compact"><div><h2>标签 (${tags.length})</h2></div></div>
        <table>
          <thead><tr><th>名称</th><th>文章数</th><th>操作</th></tr></thead>
          <tbody>${tagRows || '<tr><td colspan="3">暂无标签</td></tr>'}</tbody>
        </table>
      </section>
    </section>
    <dialog id="rename-cat-dlg">
      <form method="post" action="${ADMIN_BASE}/taxonomy/category/rename">
        <h3>重命名分类</h3>
        <input id="rename-cat-old" name="oldName" type="hidden">
        <label>新名称<input name="newName" required></label>
        <div class="actions"><button class="primary">确认</button><button type="button" onclick="this.closest('dialog').close()">取消</button></div>
      </form>
    </dialog>
    <dialog id="rename-tag-dlg">
      <form method="post" action="${ADMIN_BASE}/taxonomy/tag/rename">
        <h3>重命名标签</h3>
        <input id="rename-tag-old" name="oldName" type="hidden">
        <label>新名称<input name="newName" required></label>
        <div class="actions"><button class="primary">确认</button><button type="button" onclick="this.closest('dialog').close()">取消</button></div>
      </form>
    </dialog>`,
    { current: '/taxonomy' },
  );
}

// ==================== SETTINGS ====================

// ==================== SETTINGS ====================

function settingsPage() {
  const settings = readSettings();
  return layout(
    '站点设置',
    `<section class="panel">
      <h1>站点设置</h1>
      <p>修改 Hexo 站点和 Butterfly 主题配置。</p>
      <form class="editor" action="${ADMIN_BASE}/settings" method="post" enctype="multipart/form-data">
        <div class="grid two">
          <label>站点名称<input name="title" value="${htmlEscape(settings.title)}" required></label>
          <label>作者名<input name="author" value="${htmlEscape(settings.author)}" required></label>
        </div>
        <label>副标题<input name="subtitle" value="${htmlEscape(settings.subtitle)}"></label>
        <label>站点描述<textarea name="description" rows="3">${htmlEscape(settings.description)}</textarea></label>
        <div class="grid two">
          <label>邮箱<input name="email" type="email" value="${htmlEscape(settings.email)}"></label>
          <label>GitHub<input name="github" value="${htmlEscape(settings.github)}"></label>
        </div>
        <div class="grid two">
          <label>QQ<input name="qq" value="${htmlEscape(settings.qq)}"></label>
          <label>微信<input name="wechat" value="${htmlEscape(settings.wechat)}"></label>
        </div>
        <div class="grid two">
          <label>Linux.do<input name="linuxdo" value="${htmlEscape(settings.linuxdo)}"></label>
          <label>Gitee<input name="gitee" value="${htmlEscape(settings.gitee)}"></label>
        </div>
        <label>作者卡片介绍<input name="authorDescription" value="${htmlEscape(settings.authorDescription)}"></label>
        <label>公告<textarea name="announcement" rows="3">${htmlEscape(settings.announcement)}</textarea></label>
        <label>当前头像 <input value="${htmlEscape(settings.avatar)}" readonly></label>
        <label>上传新头像<input name="avatar" type="file" accept=".jpg,.jpeg,.png,.webp,.svg,image/*"></label>
        <div class="actions">
          <button class="primary">保存并发布</button>
          <a class="button" href="${ADMIN_BASE}/">返回</a>
        </div>
      </form>
    </section>`,
    { current: '/settings' },
  );
}

// ==================== BUILD ====================

// ==================== BUILD ====================

function buildPage() {
  const statusLabel =
    buildState.status === 'success'
      ? '构建成功'
      : buildState.status === 'building'
        ? '构建中...'
        : buildState.status === 'failed'
          ? '构建失败'
          : '空闲';

  const statusClass =
    buildState.status === 'success'
      ? 'build-ok'
      : buildState.status === 'failed'
        ? 'build-fail'
        : '';

  return layout(
    '构建管理',
    `<section class="panel">
      <div class="panel-head">
        <div><h1>构建管理</h1><p>触发站点重新构建并部署到线上。</p></div>
        <form action="${ADMIN_BASE}/build/trigger" method="post">
          <button class="primary" ${buildState.status === 'building' ? 'disabled' : ''}>
            ${buildState.status === 'building' ? '构建中...' : '重新构建并部署'}
          </button>
        </form>
      </div>
    </section>
    <section class="panel">
      <div class="panel-head compact"><div><h2>构建状态</h2></div></div>
      <div class="meta-list">
        <div><span>当前状态</span><strong class="${statusClass}">${htmlEscape(statusLabel)}</strong></div>
        <div><span>最近构建</span><strong>${buildState.lastAt ? htmlEscape(buildState.lastAt.slice(0, 19).replace('T', ' ')) : '从未构建'}</strong></div>
        <div><span>耗时</span><strong>${buildState.lastDuration ? `${buildState.lastDuration}s` : 'N/A'}</strong></div>
      </div>
    </section>
    ${buildState.lastLog ? `<section class="panel">
      <div class="panel-head compact"><div><h2>构建日志</h2></div></div>
      <pre>${htmlEscape(buildState.lastLog)}</pre>
    </section>` : ''}`,
    { current: '' },
  );
}

// ==================== AUDIT LOG ====================

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
    '操作日志',
    `<section class="panel">
      <div class="panel-head">
        <div><h1>操作日志</h1><p>记录后台关键操作，最多保留 500 条。</p></div>
      </div>
      <table>
        <thead><tr><th>时间</th><th>操作</th><th>详情</th><th>IP</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4">暂无日志</td></tr>'}</tbody>
      </table>
    </section>`,
    { current: '/audit' },
  );
}

// ==================== ROUTES ====================

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
    logAction('create_post', `创建文章: ${req.body.title}`, clientIp(req));
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
    logAction('edit_post', `编辑文章: ${req.body.title || req.params.file}`, clientIp(req));
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
      logAction('delete_post', `删除文章: ${post.title}`, clientIp(req));
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
    logAction('reset_analytics', '清空访问统计', clientIp(req));
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
    logAction('block_ip', `封禁 IP: ${req.params.ip}`, clientIp(req));
    res.redirect(`${ADMIN_BASE}/analytics`);
  },
);
app.post(
  `${ADMIN_BASE}/analytics/blacklist/:ip/remove`,
  ensureAuth,
  (req, res) => {
    removeFromBlacklist(req.params.ip);
    logAction('unblock_ip', `解封 IP: ${req.params.ip}`, clientIp(req));
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
      logAction('reply_message', `回复留言: ${req.params.id}`, clientIp(req));
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
      logAction('delete_message', `删除留言: ${req.params.id}`, clientIp(req));
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
      logAction('approve_message', `审核通过留言: ${req.params.id}`, clientIp(req));
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
    logAction('batch_delete_messages', `批量删除 ${count} 条留言`, clientIp(req));
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
      logAction('upload_image', `上传图片: ${url}`, clientIp(req));
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
      logAction('delete_image', `删除图片: ${req.params.file}`, clientIp(req));
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
      logAction('update_settings', '更新站点设置', clientIp(req));
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
    logAction('trigger_build', '手动触发构建', clientIp(req));
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
        `<section class="panel"><h1>操作失败</h1><pre>${htmlEscape(error.message)}</pre><a class="button" href="${ADMIN_BASE}/">返回后台</a></section>`,
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

