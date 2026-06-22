const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.resolve(process.env.BLOG_CONTENT_DIR || path.join(ROOT, 'date'));
const POSTS_DIR = path.join(ROOT, 'source', '_posts');
const DATE_CATEGORIES_FILE = path.join(ROOT, 'source', 'date-categories.json');
const GENERATED_PREFIX = 'date-';
const GENERATED_MARKER = 'synced_from_date: true';

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
  writeDateCategories(sourceFiles);

  for (const sourceFile of sourceFiles) {
    const rel = path.relative(SOURCE_DIR, sourceFile);
    const relNoExt = rel.replace(/\.md$/i, '');
    const folderParts = path.dirname(rel) === '.'
      ? ['\u672a\u5206\u7c7b']
      : path.dirname(rel).split(path.sep).filter(Boolean);
    const raw = fs.readFileSync(sourceFile, 'utf8');
    const {data, content} = parseFrontMatter(raw);
    const stat = fs.statSync(sourceFile);
    const generatedName = `${GENERATED_PREFIX}${fileHash(rel)}-${safeSlug(relNoExt)}.md`;
    const outputFile = path.join(POSTS_DIR, generatedName);
    const date = data.date || stat.birthtime.toISOString().slice(0, 19).replace('T', ' ');
    const updated = stat.mtime.toISOString().slice(0, 19).replace('T', ' ');
    const title = data.title || path.basename(rel, path.extname(rel));

    expected.add(generatedName);
    fs.writeFileSync(
      outputFile,
      stringifyFrontMatter({
        title,
        date,
        updated,
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
        categories: Array.isArray(data.categories) && data.categories.length ? data.categories : folderParts,
        description: data.description || firstParagraph(content).slice(0, 160),
        cover: data.cover || '',
        abbrlink: data.abbrlink || safeSlug(relNoExt),
        synced_from_date: true,
        source_path: toPosix(rel),
      }, content),
      'utf8',
    );
  }

  for (const file of fs.readdirSync(POSTS_DIR)) {
    if (!file.startsWith(GENERATED_PREFIX) || !file.endsWith('.md')) continue;
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
