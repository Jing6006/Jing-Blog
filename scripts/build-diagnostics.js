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

const phase = process.argv[2] || 'unknown';
const dateCount = countMarkdown(path.join(ROOT, 'date'));
const postCount = countMarkdown(path.join(ROOT, 'source', '_posts'));
const manifestFile = path.join(ROOT, 'content-manifest.json');
const manifestExists = fs.existsSync(manifestFile);

console.log(`[build-diag] phase=${phase}`);
console.log(`[build-diag] cwd=${ROOT}`);
console.log(`[build-diag] date_markdown=${dateCount}`);
console.log(`[build-diag] source_posts_markdown=${postCount}`);
console.log(`[build-diag] manifest_exists=${manifestExists}`);
