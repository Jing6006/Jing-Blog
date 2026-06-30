const fs = require('fs');
const crypto = require('crypto');
const {
  DATA_DIR,
  MESSAGES_FILE,
  clientIp,
} = require('./utils');
const { isBlacklisted } = require('./analytics');

// normalizeMessageText is used in server.js but defined here for consistency
function normText(value, maxLength) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

function readMessages() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(MESSAGES_FILE)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeMessages(messages) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
}

// migrate existing messages without status to 'approved'
function ensureStatus(msg) {
  if (!msg.status) msg.status = 'approved';
  return msg;
}

function messageTree(opts = {}) {
  const { includePrivate = false, status } = opts;
  const all = readMessages()
    .map(ensureStatus)
    .filter((item) => item && item.id && item.author && item.content)
    .filter((item) => {
      if (status === 'pending') return item.status === 'pending';
      if (status === 'approved') return item.status !== 'pending';
      return true;
    })
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));

  const byParent = new Map();

  for (const item of all) {
    const parentId = item.parentId || '';
    if (!byParent.has(parentId)) byParent.set(parentId, []);
    byParent.get(parentId).push({ ...item });
  }

  const build = (parentId = '') =>
    (byParent.get(parentId) || []).map((item) => ({
      id: item.id,
      parentId: item.parentId || '',
      author: item.author,
      content: item.content,
      createdAt: item.createdAt || '',
      isAdmin: Boolean(item.isAdmin),
      status: item.status || 'approved',
      ...(includePrivate ? { ip: item.ip || '' } : {}),
      replies: build(item.id),
    }));

  return build('').reverse();
}

function createMessage(body, req) {
  if (String(body.website || '').trim()) throw new Error('Invalid message');

  const author = normText(body.author, 24);
  const content = normText(body.content, 800);
  const parentId = normText(body.parentId, 64);
  if (!author || !content) throw new Error('留言昵称和内容不能为空');

  const ip = clientIp(req);
  if (isBlacklisted(ip)) throw new Error('您的 IP 已被限制留言');

  const now = Date.now();
  const messages = readMessages();
  // rate limit: 1 per minute per IP, but admins can bypass
  const recentFromIp = messages.filter(
    (m) => m.ip === ip && now - new Date(m.createdAt).getTime() < 60 * 1000,
  );
  if (recentFromIp.length >= 1) throw new Error('留言太频繁，请稍后再试');

  if (parentId && !messages.some((item) => item.id === parentId)) {
    throw new Error('回复目标不存在或已删除');
  }

  // auto-approve if no pending messages from this IP; otherwise mark pending
  const pendingFromIp = messages.filter(
    (m) => m.ip === ip && m.status === 'pending',
  ).length;
  const autoApprove = pendingFromIp === 0;

  const message = {
    id: crypto.randomBytes(8).toString('hex'),
    parentId: parentId || '',
    author,
    content,
    createdAt: new Date().toISOString(),
    ip,
    status: autoApprove ? 'approved' : 'pending',
  };
  messages.push(message);
  writeMessages(messages);
  return message;
}

function createAdminReply(parentId, body, req) {
  const targetId = normText(parentId, 64);
  const content = normText(body.content, 1200);
  const author = normText(body.author, 24) || 'Jing';
  if (!targetId || !content) throw new Error('回复目标和内容不能为空');

  const messages = readMessages();
  if (!messages.some((item) => item.id === targetId)) {
    throw new Error('回复目标不存在或已删除');
  }

  const message = {
    id: crypto.randomBytes(8).toString('hex'),
    parentId: targetId,
    author,
    content,
    createdAt: new Date().toISOString(),
    ip: clientIp(req),
    isAdmin: true,
    status: 'approved',
  };
  messages.push(message);
  writeMessages(messages);
  return message;
}

function deleteMessage(id) {
  const targetId = String(id || '');
  const messages = readMessages();
  if (!messages.some((item) => item.id === targetId)) {
    throw new Error('留言不存在或已删除');
  }
  const doomed = new Set([targetId]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const item of messages) {
      if (item.parentId && doomed.has(item.parentId) && !doomed.has(item.id)) {
        doomed.add(item.id);
        changed = true;
      }
    }
  }

  writeMessages(messages.filter((item) => !doomed.has(item.id)));
}

function batchDeleteMessages(ids) {
  let deleted = 0;
  for (const id of ids) {
    try {
      deleteMessage(id);
      deleted += 1;
    } catch { /* skip */ }
  }
  return deleted;
}

function approveMessage(id) {
  const messages = readMessages();
  const msg = messages.find((m) => m.id === id);
  if (!msg) throw new Error('留言不存在');
  msg.status = 'approved';
  writeMessages(messages);
  return msg;
}

function getMessageStats() {
  const messages = readMessages().map(ensureStatus);
  return {
    total: messages.length,
    approved: messages.filter((m) => m.status === 'approved').length,
    pending: messages.filter((m) => m.status === 'pending').length,
  };
}

module.exports = {
  readMessages,
  writeMessages,
  messageTree,
  createMessage,
  createAdminReply,
  deleteMessage,
  batchDeleteMessages,
  approveMessage,
  getMessageStats,
};
