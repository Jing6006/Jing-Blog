const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_FILE = path.join(ROOT, 'content-manifest.json');

function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
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

function removeUnexpected(rootDir, expectedRelativePaths) {
  const expected = new Set(expectedRelativePaths.map((item) => item.split('/').join(path.sep)));
  const actual = walkMarkdown(rootDir);
  let removed = 0;

  for (const full of actual) {
    const relative = path.relative(rootDir, full);
    if (expected.has(relative)) continue;
    fs.unlinkSync(full);
    removed += 1;
  }

  return removed;
}

function main() {
  const manifest = loadManifest();
  const dateDir = path.join(ROOT, 'date');
  const postsDir = path.join(ROOT, 'source', '_posts');

  const removedDate = removeUnexpected(dateDir, manifest.date || []);
  const removedPosts = removeUnexpected(postsDir, manifest.posts || []);

  console.log(`[prune] Removed ${removedDate} stale markdown file(s) from date/`);
  console.log(`[prune] Removed ${removedPosts} stale markdown file(s) from source/_posts/`);
}

main();
