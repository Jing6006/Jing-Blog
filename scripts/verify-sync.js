/**
 * 验证 content:sync 是否正确同步了所有文章
 * 用于本地测试或 CI/CD 流程中的验证步骤
 *
 * 使用方式：node scripts/verify-sync.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.resolve(process.env.BLOG_CONTENT_DIR || path.join(ROOT, 'date'));
const POSTS_DIR = path.join(ROOT, 'source', '_posts');
const GENERATED_PREFIX = 'date-';

function walkMarkdown(dir) {
  const result = [];
  if (!fs.existsSync(dir)) return result;

  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...walkMarkdown(full));
    } else if (entry.isFile() && /\.md$/i.test(entry.name)) {
      result.push(full);
    }
  }

  return result;
}

function main() {
  const sourceFiles = walkMarkdown(SOURCE_DIR);
  const generatedFiles = fs.readdirSync(POSTS_DIR)
    .filter(file => file.startsWith(GENERATED_PREFIX) && file.endsWith('.md'));

  console.log(`[verify] Found ${sourceFiles.length} markdown files in ${SOURCE_DIR}`);
  console.log(`[verify] Found ${generatedFiles.length} generated posts in ${POSTS_DIR}`);

  if (sourceFiles.length !== generatedFiles.length) {
    console.error(`[verify] ERROR: Mismatch! Expected ${sourceFiles.length} but got ${generatedFiles.length}`);
    process.exit(1);
  }

  console.log('[verify] ✓ All files synced successfully');
}

if (require.main === module) {
  main();
}
