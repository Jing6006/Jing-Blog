const {spawn} = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.resolve(process.env.BLOG_CONTENT_DIR || path.join(ROOT, 'date'));

let timer = null;

function sync() {
  const child = spawn(process.execPath, [path.join(__dirname, 'sync-content.js')], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  child.on('exit', (code) => {
    if (code !== 0) console.error(`[content] Sync exited with ${code}`);
  });
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(sync, 300);
}

function watchContent() {
  fs.mkdirSync(SOURCE_DIR, {recursive: true});
  sync();

  try {
    fs.watch(SOURCE_DIR, {recursive: true}, schedule);
    console.log(`[content] Watching ${SOURCE_DIR}`);
  } catch {
    console.log(`[content] Recursive watch unavailable, polling ${SOURCE_DIR}`);
    setInterval(sync, 3000);
  }
}

if (require.main === module) {
  watchContent();
}

module.exports = {
  watchContent,
};
