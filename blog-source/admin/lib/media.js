const fs = require('fs');
const path = require('path');
const { IMG_DIR, formatBytes, fileMtime } = require('./utils');

const ALLOWED_EXT = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.bmp',
]);

function listImages() {
  if (!fs.existsSync(IMG_DIR)) return [];
  return fs
    .readdirSync(IMG_DIR, { withFileTypes: true })
    .filter((entry) => {
      if (!entry.isFile()) return false;
      return ALLOWED_EXT.has(path.extname(entry.name).toLowerCase());
    })
    .map((entry) => {
      const full = path.join(IMG_DIR, entry.name);
      const stat = fs.statSync(full);
      return {
        name: entry.name,
        path: `/img/${entry.name}`,
        size: stat.size,
        sizeFormatted: formatBytes(stat.size),
        mtime: stat.mtime.toISOString(),
      };
    })
    .filter((img) => !img.name.startsWith('avatar') && !img.name.startsWith('favicon'))
    .sort((a, b) => b.mtime.localeCompare(a.mtime));
}

function deleteImage(filename) {
  const safe = path.basename(filename);
  if (!safe || safe.includes('..')) throw new Error('Invalid filename');
  const full = path.join(IMG_DIR, safe);
  if (!fs.existsSync(full)) throw new Error('文件不存在');
  if (safe.startsWith('avatar') || safe.startsWith('favicon')) {
    throw new Error('系统图片不能删除');
  }
  fs.unlinkSync(full);
}

function uploadImage(file) {
  if (!file) throw new Error('没有选择文件');
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    fs.unlinkSync(file.path);
    throw new Error('不支持的图片格式');
  }
  const safeName = `${Date.now()}-${path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '-')}`;
  const dest = path.join(IMG_DIR, safeName);
  fs.mkdirSync(IMG_DIR, { recursive: true });
  fs.copyFileSync(file.path, dest);
  fs.unlinkSync(file.path);
  return `/img/${safeName}`;
}

module.exports = { listImages, deleteImage, uploadImage };
