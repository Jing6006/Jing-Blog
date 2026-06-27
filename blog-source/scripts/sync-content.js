const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.resolve(process.env.BLOG_CONTENT_DIR || path.join(ROOT, '..', 'blog-content', 'data'));
const POSTS_DIR = path.join(ROOT, 'source', '_posts');
const DATE_CATEGORIES_FILE = path.join(ROOT, 'source', 'date-categories.json');
const GENERATED_MARKER = 'synced_from_content_repo: true';

function parseFrontMatter(text) {
  if (!text.startsWith('---')) return {data: {}, content: text};
  const end = text.indexOf('\n---', 3);
  if (end === -1) return {data: {}, content: text};
  const raw = text.slice(3, end).trim();
  const contentStart = text.indexOf('\n', end + 4);
  const content = contentStart === -1 ? '' : text.slice(contentStart + 1);
  const data = {};
  const lines = raw.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;

    const key = match[1];
    const value = match[2] || '';
    if (value === '') {
      const items = [];
      while (i + 1 < lines.length && /^\s+-\s+/.test(lines[i + 1])) {
        i += 1;
        items.push(lines[i].replace(/^\s+-\s+/, '').trim());
      }
      data[key] = items.length ? items : '';
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
    } else if (value === '' || value == null) {
      lines.push(`${key}:`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---', '', content.trimStart());
  return lines.join('\n').trimEnd() + '\n';
}

function walkMarkdown(dir) {
  const result = [];
  if (!fs.existsSync(dir)) return result;

  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...walkMarkdown(full));
      continue;
    }
    if (entry.isFile() && /\.md$/i.test(entry.name)) result.push(full);
  }

  return result;
}

function frontMatterCategories(data) {
  if (Array.isArray(data.categories)) return data.categories.filter(Boolean);
  return data.categories ? [data.categories] : [];
}

function topLevelDirectories(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, {withFileTypes: true})
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function fileHash(value) {
  return crypto.createHash('md5').update(toPosix(value)).digest('hex').slice(0, 10);
}

function contentHash(value) {
  return crypto.createHash('sha1').update(value).digest('hex');
}

function safeSlug(value) {
  const clean = value
    .toLowerCase()
    .replace(/\\/g, '/')
    .replace(/\.md$/i, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return clean || fileHash(value);
}

function firstParagraph(content) {
  return content
    .split(/\r?\n\r?\n/)
    .map((item) => item.replace(/[#>*`-]/g, '').trim())
    .find(Boolean) || '';
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item));
  return value ? [String(value)] : [];
}

function normalize(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

const TAG_RULES = [
  {tag: 'java', patterns: ['java', 'jvm', 'jdk', 'jre', '集合', 'hashmap', 'arraylist', 'linkedlist', 'string', 'bigdecimal', 'optional', 'lambda', '泛型']},
  {tag: 'spring', patterns: ['spring', 'springboot', 'spring boot', 'springcloud', 'spring cloud', 'aop', 'bean', 'openfeign']},
  {tag: 'database', patterns: ['mysql', '数据库', 'sql', '索引', '分页', '表设计', 'explain', 'mybatis']},
  {tag: 'redis', patterns: ['redis', '缓存', 'cache', 'sentinel']},
  {tag: 'mq', patterns: ['mq', 'rocketmq', '消息', '死信', '重试', '削峰']},
  {tag: 'concurrency', patterns: ['并发', '线程', 'threadlocal', 'volatile', 'synchronized', 'reentrantlock', 'completablefuture', '线程池']},
  {tag: 'security', patterns: ['security', 'jwt', '登录', '认证', '鉴权', '权限']},
  {tag: 'api-design', patterns: ['api', '接口', 'dto', 'vo', '统一返回', '上传', '幂等']},
  {tag: 'architecture', patterns: ['架构', '分层', '网关', '降级', '熔断', '容错']},
  {tag: 'testing', patterns: ['测试', 'test', 'mockito', '单测', '集成测试', 'code review', 'review']},
  {tag: 'ops', patterns: ['docker', 'nginx', 'linux', '部署', '发布', '日志', 'trace', '生产事故']},
  {tag: 'ai', patterns: ['ai', 'rag', '知识库', '向量', 'embedding', 'prompt']},
  {tag: 'engineering', patterns: ['工程实践', '排查', '调试', '复盘']},
];

function sameList(left, right) {
  if (left.length !== right.length) return false;
  return left.every((item, index) => item === right[index]);
}

function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function inferTags(rel, title, existingTags) {
  const matched = new Set(normalizeList(existingTags).map((item) => item.trim()).filter(Boolean));
  const haystack = normalize([rel, title].join(' '));

  for (const rule of TAG_RULES) {
    if (matched.has(rule.tag)) continue;
    if (rule.patterns.some((pattern) => haystack.includes(normalize(pattern)))) {
      matched.add(rule.tag);
    }
  }

  return [...matched];
}

// 给缺少 date 的源文件补一行 date，保证“最新写的排最前”，并写回源仓库使其稳定可提交。
// 返回补好的 raw 文本；已有 date 或无法解析时返回 null。
function insertSourceDate(raw, stamp) {
  if (!raw.startsWith('---')) return null;
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return null;
  const header = raw.slice(0, end);
  if (/(^|\n)\s*date:/.test(header)) return null;

  const lines = header.split(/\r?\n/);
  let insertAt = 1;
  for (let i = 1; i < lines.length; i += 1) {
    if (/^title:/.test(lines[i])) {
      insertAt = i + 1;
      break;
    }
  }
  lines.splice(insertAt, 0, `date: ${stamp}`);
  return lines.join('\n') + raw.slice(end);
}

function writeDateCategories(sourceFiles) {
  const counts = new Map();
  const names = new Set(topLevelDirectories(SOURCE_DIR));

  for (const sourceFile of sourceFiles) {
    const rel = path.relative(SOURCE_DIR, sourceFile);
    const parts = rel.split(path.sep).filter(Boolean);
    const name = parts.length > 1 ? parts[0] : '\u672a\u5206\u7c7b';
    names.add(name);
    counts.set(name, (counts.get(name) || 0) + 1);
  }

  for (const postFile of walkMarkdown(POSTS_DIR)) {
    const raw = fs.readFileSync(postFile, 'utf8');
    if (raw.includes(GENERATED_MARKER)) continue;

    const {data} = parseFrontMatter(raw);
    for (const name of frontMatterCategories(data)) {
      names.add(name);
      counts.set(name, (counts.get(name) || 0) + 1);
    }
  }

  const categories = [...names]
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
    .map((name) => ({
      name,
      count: counts.get(name) || 0,
      url: `/categories/${encodeURIComponent(name)}/`,
    }));

  fs.writeFileSync(
    DATE_CATEGORIES_FILE,
    `${JSON.stringify({categories}, null, 2)}\n`,
    'utf8',
  );
}

function syncContent() {
  fs.mkdirSync(POSTS_DIR, {recursive: true});

  if (!fs.existsSync(SOURCE_DIR)) {
    console.log(`[content] Source directory not found, skipped: ${SOURCE_DIR}`);
    return;
  }

  const sourceFiles = walkMarkdown(SOURCE_DIR);
  const expected = new Set();
  const stampBase = Date.now();
  let stampOffset = 0;
  const buildStamp = formatDateTime(new Date());
  writeDateCategories(sourceFiles);

  for (const sourceFile of sourceFiles) {
    const rel = path.relative(SOURCE_DIR, sourceFile);
    const relNoExt = rel.replace(/\.md$/i, '');
    const folderParts = path.dirname(rel) === '.'
      ? ['\u672a\u5206\u7c7b']
      : path.dirname(rel).split(path.sep).filter(Boolean);
    let raw = fs.readFileSync(sourceFile, 'utf8');
    let {data, content} = parseFrontMatter(raw);

    // \u65b0\u6587\u7ae0\uff08\u6e90\u6587\u4ef6\u6ca1\u5199 date\uff09\uff1a\u81ea\u52a8\u76d6\u5f53\u524d\u65f6\u95f4\u5e76\u5199\u56de\u6e90\u6587\u4ef6\uff0c
    // \u4fdd\u8bc1\u201c\u6700\u65b0\u5199\u7684\u201d\u6c38\u8fdc\u6392\u5728\u9996\u9875\u6700\u524d\uff0c\u4e14\u65e5\u671f\u4e00\u7ecf\u751f\u6210\u5c31\u56fa\u5b9a\u4e0b\u6765\u3001\u53ef\u968f git \u63d0\u4ea4\u3002
    if (!data.date) {
      const stamp = formatDateTime(new Date(stampBase + stampOffset * 60000));
      stampOffset += 1;
      const stamped = insertSourceDate(raw, stamp);
      if (stamped) {
        try {
          fs.writeFileSync(sourceFile, stamped, 'utf8');
          raw = stamped;
          ({data, content} = parseFrontMatter(raw));
          console.log(`[content] Stamped new article date ${stamp}: ${rel}`);
        } catch (err) {
          // \u6e90\u76ee\u5f55\u53ea\u8bfb\uff08\u4f8b\u5982\u670d\u52a1\u5668 tarball\uff09\u65f6\u9000\u5316\u4e3a\u4ec5\u672c\u6b21\u6784\u5efa\u4f7f\u7528\uff0c\u4e0d\u5199\u56de\u3002
          data.date = stamp;
        }
      } else {
        data.date = stamp;
      }
    }

    const generatedName = `${fileHash(rel)}-${safeSlug(relNoExt)}.md`;
    const outputFile = path.join(POSTS_DIR, generatedName);
    const date = data.date;
    const title = data.title || path.basename(rel, path.extname(rel));
    // Keep generated Hexo categories aligned with the content repository folders.
    // This avoids stale frontmatter categories from splitting posts across old category pages.
    const categories = folderParts;
    const tags = inferTags(rel, title, data.tags);
    const sourceHash = contentHash(raw);
    let updated = data.updated || date;

    if (fs.existsSync(outputFile)) {
      const prevRaw = fs.readFileSync(outputFile, 'utf8');
      if (prevRaw.includes(GENERATED_MARKER)) {
        const {data: prevData, content: prevContent} = parseFrontMatter(prevRaw);
        const prevCategories = normalizeList(prevData.categories);
        const prevTags = normalizeList(prevData.tags);
        const changed = prevData.source_hash
          ? prevData.source_hash !== sourceHash
          : prevContent.trim() !== content.trim()
            || prevData.title !== title
            || prevData.description !== (data.description || firstParagraph(content).slice(0, 160))
            || !sameList(prevCategories, categories)
            || !sameList(prevTags, tags)
            || prevData.source_path !== toPosix(rel);
        updated = changed ? buildStamp : (prevData.updated || updated);
      }
    } else {
      updated = buildStamp;
    }

    expected.add(generatedName);
    fs.writeFileSync(
      outputFile,
      stringifyFrontMatter({
        title,
        date,
        updated,
        tags,
        categories,
        description: data.description || firstParagraph(content).slice(0, 160),
        cover: data.cover || '',
        abbrlink: data.abbrlink || safeSlug(relNoExt),
        synced_from_content_repo: true,
        source_path: toPosix(rel),
        source_hash: sourceHash,
      }, content),
      'utf8',
    );
  }

  for (const file of fs.readdirSync(POSTS_DIR)) {
    if (!file.endsWith('.md')) continue;
    const full = path.join(POSTS_DIR, file);
    const text = fs.readFileSync(full, 'utf8');
    if (text.includes(GENERATED_MARKER) && !expected.has(file)) {
      fs.unlinkSync(full);
    }
  }

  console.log(`[content] Synced ${sourceFiles.length} markdown file(s) from ${SOURCE_DIR}`);
}

if (require.main === module) {
  syncContent();
}

module.exports = {
  syncContent,
};
