(() => {
  document.documentElement.classList.add('jing-blog-ready');

  const path = window.location.pathname;
  if (!path.startsWith('/posts/')) return;

  const payload = {
    path,
    title: document.title.replace(/\s*\|\s*.*$/, ''),
    referrer: document.referrer || '',
  };

  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/track/view', new Blob([body], {type: 'application/json'}));
    return;
  }

  fetch('/track/view', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body,
    keepalive: true,
  }).catch(() => {});
})();
