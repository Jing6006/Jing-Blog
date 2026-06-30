const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function countMarkdown(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countMarkdown(full);
      continue;
    }
    if (entry.isFile() && /\.md$/i.test(entry.name)) count += 1;
  }
  return count;
}

function countDirectories(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir, {withFileTypes: true})
    .filter((entry) => entry.isDirectory())
    .length;
}

function markdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const result = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...markdownFiles(full));
      continue;
    }
    if (entry.isFile() && /\.md$/i.test(entry.name)) result.push(full);
  }
  return result;
}

function frontMatterValue(text, key) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return null;
  const raw = text.slice(3, end).split(/\r?\n/);
  const line = raw.find((item) => item.startsWith(`${key}:`));
  if (!line) return null;
  return line.slice(key.length + 1).trim().replace(/^['"]|['"]$/g, '');
}

function expectedPublicPostPath(postFile) {
  const raw = fs.readFileSync(postFile, 'utf8');
  const abbrlink = frontMatterValue(raw, 'abbrlink');
  const slug = abbrlink || path.basename(postFile, '.md');
  return path.join(ROOT, 'public', 'posts', ...slug.split('/'), 'index.html');
}

const phase = process.argv[2] || 'unknown';
const postsDir = path.join(ROOT, 'source', '_posts');
const contentRepoCount = countMarkdown(path.join(ROOT, '..', 'blog-content', 'data'));
const postFiles = markdownFiles(postsDir);
const postCount = postFiles.length;
const publicPostCount = countDirectories(path.join(ROOT, 'public', 'posts'));

console.log(`[build-diag] phase=${phase}`);
console.log(`[build-diag] cwd=${ROOT}`);
console.log(`[build-diag] content_repo_markdown=${contentRepoCount}`);
console.log(`[build-diag] source_posts_markdown=${postCount}`);
console.log(`[build-diag] public_post_pages=${publicPostCount}`);

if (phase === 'after' && publicPostCount !== postCount) {
  console.error(`[build-diag] ERROR: expected ${postCount} public post pages, got ${publicPostCount}`);
  process.exit(1);
}

if (phase === 'after') {
  const missing = postFiles
    .map((postFile) => ({postFile, publicFile: expectedPublicPostPath(postFile)}))
    .filter((item) => !fs.existsSync(item.publicFile));

  if (missing.length) {
    console.error(`[build-diag] ERROR: ${missing.length} post source file(s) did not generate public pages`);
    for (const item of missing.slice(0, 20)) {
      console.error(`[build-diag] missing public page for ${path.relative(ROOT, item.postFile)} -> ${path.relative(ROOT, item.publicFile)}`);
    }
    process.exit(1);
  }
}
