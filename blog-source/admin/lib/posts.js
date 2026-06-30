const fs = require('fs');
const path = require('path');
const {
  ROOT,
  POSTS_DIR,
  safePostFile,
  postRelPath,
  slugifyTitle,
  splitList,
  asArray,
  normalizeDate,
  walkMarkdown,
  parseFrontMatter,
  stringifyFrontMatter,
  generateAbbrlink,
} = require('./utils');

const GENERATED_POSTS_DIR = path.join(ROOT, 'source', '_posts');

function listValue(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
}

function sourceFolderCategory(file) {
  return file.includes('/') ? file.split('/')[0] : '未分类';
}

function generatedMetaBySourcePath() {
  const map = new Map();
  if (!fs.existsSync(GENERATED_POSTS_DIR)) return map;

  for (const full of walkMarkdown(GENERATED_POSTS_DIR)) {
    const parsed = parseFrontMatter(fs.readFileSync(full, 'utf8'));
    if (!parsed.data.source_path) continue;
    map.set(String(parsed.data.source_path).replace(/\\/g, '/'), parsed.data);
  }

  return map;
}

function postViewData(file, parsed, generated = {}) {
  const generatedCategories = listValue(generated.categories);
  const generatedTags = listValue(generated.tags);
  return {
    title: parsed.data.title || generated.title || path.basename(file, '.md'),
    date: normalizeDate(generated.date || parsed.data.date),
    updated: normalizeDate(
      generated.updated || parsed.data.updated || generated.date || parsed.data.date,
    ),
    categories: generatedCategories.length ? generatedCategories : [sourceFolderCategory(file)],
    tags: generatedTags.length ? generatedTags : listValue(parsed.data.tags),
    description: generated.description || parsed.data.description || '',
    cover: generated.cover || parsed.data.cover || '',
    abbrlink: generated.abbrlink || parsed.data.abbrlink || '',
  };
}

function readPosts(opts = {}) {
  fs.mkdirSync(POSTS_DIR, { recursive: true });
  const { search, category, tag, status } = opts;
  const generatedBySource = generatedMetaBySourcePath();

  let posts = walkMarkdown(POSTS_DIR)
    .map((full) => {
      const file = postRelPath(full);
      const parsed = parseFrontMatter(fs.readFileSync(full, 'utf8'));
      const view = postViewData(file, parsed, generatedBySource.get(file));
      const isPublished = parsed.data.published !== false;
      const isTop = parsed.data.top === true || parsed.data.sticky === true;
      return {
        file,
        ...view,
        content: parsed.content.trim(),
        published: isPublished,
        top: isTop,
      };
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  // filter by publish status
  if (status === 'published') posts = posts.filter((p) => p.published);
  if (status === 'draft') posts = posts.filter((p) => !p.published);

  // filter by search keyword
  if (search) {
    const kw = String(search).toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(kw) ||
        p.file.toLowerCase().includes(kw) ||
        p.description.toLowerCase().includes(kw) ||
        p.content.toLowerCase().includes(kw),
    );
  }

  // filter by category
  if (category) {
    posts = posts.filter((p) =>
      p.categories.some((c) => c.toLowerCase() === String(category).toLowerCase()),
    );
  }

  // filter by tag
  if (tag) {
    posts = posts.filter((p) =>
      p.tags.some((t) => t.toLowerCase() === String(tag).toLowerCase()),
    );
  }

  // pinned posts first
  const pinned = posts.filter((p) => p.top);
  const normal = posts.filter((p) => !p.top);
  return [...pinned, ...normal];
}

function readPost(file) {
  const full = safePostFile(file);
  const parsed = parseFrontMatter(fs.readFileSync(full, 'utf8'));
  const rel = postRelPath(full);
  const view = postViewData(rel, parsed, generatedMetaBySourcePath().get(rel));
  return {
    file: rel,
    ...view,
    content: parsed.content.trim(),
    published: parsed.data.published !== false,
    top: parsed.data.top === true || parsed.data.sticky === true,
  };
}

function writePost(file, body) {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const existingTarget = file ? safePostFile(file) : '';
  const existing =
    existingTarget && fs.existsSync(existingTarget)
      ? parseFrontMatter(fs.readFileSync(existingTarget, 'utf8')).data
      : {};
  const categories = splitList(body.categories);
  const category =
    categories[0] ||
    (file ? sourceFolderCategory(String(file).replace(/\\/g, '/')) : '') ||
    asArray(existing.categories)[0] ||
    '未分类';
  const filename = file
    ? path.basename(file)
    : `${Date.now()}-${slugifyTitle(body.title)}.md`;
  const target = path.resolve(POSTS_DIR, category, filename);
  if (!target.startsWith(`${POSTS_DIR}${path.sep}`)) throw new Error('Invalid post path');

  const data = {
    title: body.title || '未命名文章',
    abbrlink: existing.abbrlink || generateAbbrlink(body.title || target),
    date: body.date || now,
    updated: now,
    tags: splitList(body.tags),
    categories: categories.length ? categories : [category],
    description: body.description || '',
    cover: body.cover || '',
    top: body.top === 'true' || body.top === true || false,
    published: body.published !== 'false' && body.published !== false,
  };

  const next = stringifyFrontMatter(data, body.content || '');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, next, 'utf8');
  if (existingTarget && existingTarget !== target && fs.existsSync(existingTarget))
    fs.unlinkSync(existingTarget);
  return postRelPath(target);
}

function deletePost(file) {
  fs.unlinkSync(safePostFile(file));
}

function batchDelete(files) {
  const errors = [];
  for (const file of files) {
    try {
      deletePost(file);
    } catch (e) {
      errors.push({ file, error: e.message });
    }
  }
  return errors;
}

function getStats() {
  const all = readPosts();
  return {
    total: all.length,
    published: all.filter((p) => p.published).length,
    draft: all.filter((p) => !p.published).length,
    pinned: all.filter((p) => p.top).length,
  };
}

function getAllCategories() {
  const posts = readPosts();
  const map = new Map();
  for (const post of posts) {
    for (const cat of post.categories) {
      map.set(cat, (map.get(cat) || 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function getAllTags() {
  const posts = readPosts();
  const map = new Map();
  for (const post of posts) {
    for (const tag of post.tags) {
      map.set(tag, (map.get(tag) || 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function renameCategory(oldName, newName) {
  const posts = readPosts();
  let changed = 0;
  for (const post of posts) {
    if (post.categories.includes(oldName)) {
      const full = safePostFile(post.file);
      const parsed = parseFrontMatter(fs.readFileSync(full, 'utf8'));
      const cats = asArray(parsed.data.categories).map((c) =>
        c === oldName ? newName : c,
      );
      parsed.data.categories = cats;
      parsed.data.updated = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const text = stringifyFrontMatter(parsed.data, parsed.content);
      const newFile = path.resolve(
        POSTS_DIR,
        newName,
        path.basename(post.file),
      );
      fs.mkdirSync(path.dirname(newFile), { recursive: true });
      fs.writeFileSync(newFile, text, 'utf8');
      if (newFile !== full && fs.existsSync(full)) fs.unlinkSync(full);
      changed += 1;
    }
  }
  return changed;
}

function renameTag(oldName, newName) {
  const posts = readPosts();
  let changed = 0;
  for (const post of posts) {
    if (post.tags.includes(oldName)) {
      const full = safePostFile(post.file);
      const parsed = parseFrontMatter(fs.readFileSync(full, 'utf8'));
      const tags = asArray(parsed.data.tags).map((t) =>
        t === oldName ? newName : t,
      );
      parsed.data.tags = tags;
      parsed.data.updated = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const text = stringifyFrontMatter(parsed.data, parsed.content);
      fs.writeFileSync(full, text, 'utf8');
      changed += 1;
    }
  }
  return changed;
}

module.exports = {
  readPosts,
  readPost,
  writePost,
  deletePost,
  batchDelete,
  getStats,
  getAllCategories,
  getAllTags,
  renameCategory,
  renameTag,
};
