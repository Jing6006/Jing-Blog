const fs = require('fs');
const path = require('path');
const frontMatter = require('hexo-front-matter');

const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'source', '_posts');
const REQUIRED_FIELDS = ['title', 'date', 'abbrlink'];

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

  return result.sort((a, b) => a.localeCompare(b));
}

function validatePost(file) {
  const rel = path.relative(ROOT, file);
  const raw = fs.readFileSync(file, 'utf8');

  let data;
  try {
    data = frontMatter.parse(raw);
  } catch (err) {
    return {
      data: null,
      errors: [`${rel}: invalid YAML front matter: ${err.message}`],
    };
  }

  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === null || String(data[field]).trim() === '') {
      errors.push(`${rel}: missing required front matter field "${field}"`);
    }
  }

  return {data, errors};
}

function main() {
  const files = walkMarkdown(POSTS_DIR);
  const errors = [];
  const abbrlinks = new Map();

  for (const file of files) {
    const result = validatePost(file);
    errors.push(...result.errors);

    const data = result.data;
    if (!data || !data.abbrlink) continue;

    const owner = abbrlinks.get(data.abbrlink);
    if (owner) {
      errors.push(`${path.relative(ROOT, file)}: duplicate abbrlink "${data.abbrlink}" also used by ${path.relative(ROOT, owner)}`);
    } else {
      abbrlinks.set(data.abbrlink, file);
    }
  }

  console.log(`[validate-posts] checked ${files.length} markdown post file(s)`);

  if (errors.length) {
    console.error(`[validate-posts] ERROR: ${errors.length} validation issue(s)`);
    for (const error of errors.slice(0, 30)) console.error(`[validate-posts] ${error}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
