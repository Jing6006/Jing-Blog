const fs = require('fs');
const http = require('http');
const {
  DATA_DIR,
  ANALYTICS_FILE,
  IP_CACHE_FILE,
  clientIp,
  normalizePostPath,
  pad2,
  dayKey,
  hourKey,
  referrerHost,
} = require('./utils');

const ANALYTICS_LIMITS = {
  maxVisits: Number(process.env.ANALYTICS_MAX_VISITS || 5000),
  recentVisits: Number(process.env.ANALYTICS_RECENT_VISITS || 200),
  topPosts: Number(process.env.ANALYTICS_TOP_POSTS || 10),
  topIps: Number(process.env.ANALYTICS_TOP_IPS || 20),
  ipDetailVisits: Number(process.env.ANALYTICS_IP_DETAIL_VISITS || 200),
};

// ---- IP geolocation with cache ----

function readIpCache() {
  try {
    if (fs.existsSync(IP_CACHE_FILE))
      return JSON.parse(fs.readFileSync(IP_CACHE_FILE, 'utf8'));
  } catch { /* ignore */ }
  return {};
}

function writeIpCache(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(IP_CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function ipLookup(ip) {
  return new Promise((resolve) => {
    const cache = readIpCache();
    if (cache[ip]) {
      return resolve(cache[ip]);
    }

    // local/private IPs
    if (
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === '::ffff:127.0.0.1' ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip.startsWith('172.')
    ) {
      const result = { ip, country: '本地', region: '', city: '', isp: '' };
      cache[ip] = result;
      writeIpCache(cache);
      return resolve(result);
    }

    const req = http.get(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?lang=zh-CN&fields=country,regionName,city,isp`,
      { timeout: 4000 },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            const result = {
              ip,
              country: data.country || '未知',
              region: data.regionName || '',
              city: data.city || '',
              isp: data.isp || '',
            };
            cache[ip] = result;
            writeIpCache(cache);
            resolve(result);
          } catch {
            const result = { ip, country: '未知', region: '', city: '', isp: '' };
            cache[ip] = result;
            writeIpCache(cache);
            resolve(result);
          }
        });
      },
    );
    req.on('error', () => {
      const result = { ip, country: '未知', region: '', city: '', isp: '' };
      cache[ip] = result;
      writeIpCache(cache);
      resolve(result);
    });
    req.on('timeout', () => {
      req.destroy();
      const result = { ip, country: '未知', region: '', city: '', isp: '' };
      cache[ip] = result;
      writeIpCache(cache);
      resolve(result);
    });
  });
}

// ---- Blacklist ----

const BLACKLIST_FILE = `${DATA_DIR}/ip-blacklist.json`;

function readBlacklist() {
  try {
    if (fs.existsSync(BLACKLIST_FILE))
      return JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf8'));
  } catch { /* ignore */ }
  return [];
}

function writeBlacklist(list) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function isBlacklisted(ip) {
  return readBlacklist().some(
    (entry) => entry.ip === ip && entry.active !== false,
  );
}

function addToBlacklist(ip, reason = '') {
  const list = readBlacklist();
  if (list.some((e) => e.ip === ip)) return false;
  list.push({ ip, reason, createdAt: new Date().toISOString() });
  writeBlacklist(list);
  return true;
}

function removeFromBlacklist(ip) {
  writeBlacklist(readBlacklist().filter((e) => e.ip !== ip));
}

// ---- Analytics core ----

function readAnalytics() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ANALYTICS_FILE)) return { posts: {}, visits: [] };
  try {
    const data = JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf8'));
    return {
      posts: data.posts && typeof data.posts === 'object' ? data.posts : {},
      visits: Array.isArray(data.visits) ? data.visits : [],
    };
  } catch {
    return { posts: {}, visits: [] };
  }
}

function writeAnalytics(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function recordVisit(req) {
  const postPath = normalizePostPath(req.body.path);
  if (!postPath) return false;

  const ip = clientIp(req);
  if (isBlacklisted(ip)) return false;

  const data = readAnalytics();
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
  data.visits = data.visits.slice(0, ANALYTICS_LIMITS.maxVisits);
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
  return { posts, visits: data.visits };
}

function toDate(value) {
  const date = value ? new Date(value) : new Date(NaN);
  return Number.isNaN(date.getTime()) ? null : date;
}

function analyticsDashboard(days = 30) {
  const { posts, visits } = analyticsSummary();
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const dailyMap = new Map();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dailyMap.set(dayKey(date), { views: 0, ips: new Set() });
  }

  const hourlyMap = new Map();
  for (let i = 0; i < 24; i += 1) {
    hourlyMap.set(`${pad2(i)}:00`, 0);
  }

  const ipMap = new Map();
  const referrerMap = new Map();
  const recentVisits = [];

  for (const visit of visits) {
    const at = toDate(visit.at);
    if (!at) continue;

    const recent = at >= start;
    if (recent) {
      const key = dayKey(at);
      const day = dailyMap.get(key);
      if (day) {
        day.views += 1;
        if (visit.ip) day.ips.add(visit.ip);
      }
      const hour = hourKey(at);
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
      recentVisits.push(visit);
    }

    const ip = String(visit.ip || '').trim() || '未知';
    const item = ipMap.get(ip) || {
      ip,
      views: 0,
      posts: new Set(),
      lastVisitAt: '',
      referrers: new Set(),
      userAgent: '',
    };
    item.views += 1;
    if (visit.path) item.posts.add(visit.path);
    if (visit.referrer) item.referrers.add(referrerHost(visit.referrer));
    if (!item.userAgent && visit.userAgent) item.userAgent = visit.userAgent;
    if (!item.lastVisitAt || String(visit.at) > String(item.lastVisitAt))
      item.lastVisitAt = visit.at;
    ipMap.set(ip, item);

    const refKey = referrerHost(visit.referrer);
    referrerMap.set(refKey, (referrerMap.get(refKey) || 0) + 1);
  }

  const recentIpSet = new Set(recentVisits.map((item) => item.ip).filter(Boolean));
  const totalViews = visits.length;
  const totalUniqueIps = new Set(visits.map((item) => item.ip).filter(Boolean)).size;

  return {
    summary: {
      totalViews,
      totalUniqueIps,
      trackedPosts: posts.length,
      recentViews: recentVisits.length,
      recentUniqueIps: recentIpSet.size,
    },
    charts: {
      days,
      daily: [...dailyMap.entries()].map(([date, value]) => ({
        date,
        views: value.views,
        uniqueIps: value.ips.size,
      })),
      hourly: [...hourlyMap.entries()].map(([hour, views]) => ({ hour, views })),
      referrers: [...referrerMap.entries()]
        .map(([name, views]) => ({ name, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 8),
    },
    topPosts: posts.slice(0, ANALYTICS_LIMITS.topPosts),
    topIps: [...ipMap.values()]
      .map((item) => ({
        ip: item.ip,
        views: item.views,
        posts: item.posts.size,
        lastVisitAt: item.lastVisitAt,
        referrers: [...item.referrers].slice(0, 3),
        userAgent: item.userAgent,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, ANALYTICS_LIMITS.topIps),
    recentVisits: recentVisits.slice(0, ANALYTICS_LIMITS.recentVisits),
    limits: ANALYTICS_LIMITS,
  };
}

function resetAnalytics() {
  writeAnalytics({ posts: {}, visits: [] });
}

// IP detail: all visits from a specific IP
function ipDetail(ip) {
  const { visits, posts } = analyticsSummary();
  const ipVisits = visits.filter((v) => v.ip === ip);
  const visitedPosts = new Set(ipVisits.map((v) => v.path));
  const referrers = new Set(ipVisits.map((v) => referrerHost(v.referrer)));

  return {
    ip,
    totalViews: ipVisits.length,
    visitedPosts: [...visitedPosts],
    firstVisitAt: ipVisits.length ? ipVisits[ipVisits.length - 1].at : '',
    lastVisitAt: ipVisits.length ? ipVisits[0].at : '',
    referrers: [...referrers],
    visits: ipVisits.slice(0, ANALYTICS_LIMITS.ipDetailVisits),
  };
}

module.exports = {
  ANALYTICS_LIMITS,
  readAnalytics,
  writeAnalytics,
  recordVisit,
  analyticsSummary,
  analyticsDashboard,
  resetAnalytics,
  ipLookup,
  ipDetail,
  readBlacklist,
  addToBlacklist,
  removeFromBlacklist,
  isBlacklisted,
};
