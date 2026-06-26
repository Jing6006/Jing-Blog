(() => {
  document.documentElement.classList.add('jing-blog-ready');

  function updateDateCategories() {
    fetch('/date-categories.json', {cache: 'no-store'})
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data || !Array.isArray(data.categories) || data.categories.length === 0) return;

        const categories = data.categories;
        const categoryCount = document.querySelector('.site-data a[href="/categories/"] .length-num');
        if (categoryCount) categoryCount.textContent = String(categories.length);

        const asideList = document.querySelector('#aside-cat-list');
        if (asideList) {
          asideList.innerHTML = '';
          for (const category of categories) {
            const item = document.createElement('li');
            item.className = `card-category-list-item ${category.count ? '' : 'is-empty'}`.trim();

            const link = document.createElement('a');
            link.className = 'card-category-list-link';
            link.href = category.count ? category.url : 'javascript:void(0)';
            if (!category.count) link.title = '暂无文章';

            const name = document.createElement('span');
            name.className = 'card-category-list-name';
            name.textContent = category.name;

            const count = document.createElement('span');
            count.className = 'card-category-list-count';
            count.textContent = String(category.count);

            link.append(name, count);
            item.append(link);
            asideList.append(item);
          }
        }

        const pageList = document.querySelector('.category-lists .category-list');
        if (pageList) {
          pageList.innerHTML = '';
          for (const category of categories) {
            const item = document.createElement('li');
            item.className = `category-list-item ${category.count ? '' : 'is-empty'}`.trim();

            const link = document.createElement('a');
            link.className = 'category-list-link';
            link.href = category.count ? category.url : 'javascript:void(0)';
            link.textContent = category.name;
            if (!category.count) link.title = '暂无文章';

            const count = document.createElement('span');
            count.className = 'category-list-count';
            count.textContent = String(category.count);

            item.append(link, count);
            pageList.append(item);
          }
        }
      })
      .catch(() => {});
  }

  function textFromXml(parent, selector) {
    const node = parent.querySelector(selector);
    return node ? node.textContent.trim() : '';
  }

  function decodeHtml(value) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = value || '';
    return textarea.value;
  }

  function plainText(value) {
    return decodeHtml(value)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function fetchTextWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, {cache: 'no-store', signal: controller.signal})
      .finally(() => window.clearTimeout(timer))
      .then((response) => {
        if (!response.ok) throw new Error(`${url} returned ${response.status}`);
        return response.text();
      });
  }

  function createResultItem(item) {
    const result = document.createElement('article');
    result.className = 'jing-search-result';

    const title = document.createElement('a');
    title.className = 'jing-search-result-title';
    title.href = item.url || '#';
    title.textContent = item.title || '未命名文章';

    const summary = document.createElement('div');
    summary.className = 'jing-search-result-summary';
    summary.textContent = item.summary;

    const path = document.createElement('div');
    path.className = 'jing-search-result-path';
    path.textContent = item.url;

    result.append(title);
    if (item.summary) result.append(summary);
    if (item.url) result.append(path);
    return result;
  }

  function initArchiveSearch() {
    if (!/^\/archives\/?$/.test(window.location.pathname)) return;

    const archive = document.querySelector('#archive');
    if (!archive || document.querySelector('.jing-archive-search')) return;

    const panel = document.createElement('section');
    panel.className = 'jing-archive-search';

    const title = document.createElement('h2');
    title.className = 'jing-archive-search-title';
    title.textContent = '搜索';

    const row = document.createElement('div');
    row.className = 'jing-archive-search-row';

    const input = document.createElement('input');
    input.className = 'jing-archive-search-input';
    input.type = 'search';
    input.placeholder = '搜索文章、标签或关键词';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', '搜索文章');

    const meta = document.createElement('div');
    meta.className = 'jing-archive-search-meta';
    meta.textContent = '本地';

    const results = document.createElement('div');
    results.className = 'jing-archive-search-results';
    results.innerHTML = '<div class="jing-search-empty">输入关键词搜索全部文章</div>';

    row.append(input, meta);
    panel.append(title, row, results);

    const firstArchiveTitle = archive.querySelector('.article-sort-title');
    archive.insertBefore(panel, firstArchiveTitle || archive.firstChild);

    let searchIndexPromise;
    function loadSearchIndex() {
      if (!searchIndexPromise) {
        searchIndexPromise = fetchTextWithTimeout('/search.xml', 12000)
          .then((xml) => {
            const doc = new DOMParser().parseFromString(xml, 'application/xml');
            return [...doc.querySelectorAll('entry')].map((entry) => {
              const titleText = plainText(textFromXml(entry, 'title'));
              const contentText = plainText(textFromXml(entry, 'content'));
              const tags = [...entry.querySelectorAll('tags')].map((node) => plainText(node.textContent));
              const categories = [...entry.querySelectorAll('categories')].map((node) => plainText(node.textContent));
              const summary = contentText.slice(0, 120);
              return {
                title: titleText,
                url: textFromXml(entry, 'url'),
                summary,
                haystack: normalize([titleText, contentText, tags.join(' '), categories.join(' ')].join(' ')),
              };
            });
          });
      }
      return searchIndexPromise;
    }

    let searchTimer;
    input.addEventListener('input', () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        const query = normalize(input.value);
        if (!query) {
          meta.textContent = '本地';
          results.innerHTML = '<div class="jing-search-empty">输入关键词搜索全部文章</div>';
          return;
        }

        meta.textContent = '搜索中';
        loadSearchIndex()
          .then((items) => {
            const tokens = query.split(' ').filter(Boolean);
            const matched = items
              .filter((item) => tokens.every((token) => item.haystack.includes(token)))
              .slice(0, 12);

            meta.textContent = `${matched.length} 篇`;
            results.innerHTML = '';
            if (matched.length === 0) {
              results.innerHTML = '<div class="jing-search-empty">没有匹配文章</div>';
              return;
            }

            for (const item of matched) {
              results.append(createResultItem(item));
            }
          })
          .catch(() => {
            meta.textContent = '不可用';
            results.innerHTML = '<div class="jing-search-empty">搜索索引加载失败</div>';
          });
      }, 120);
    });
  }

  function trackPostView() {
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
  }

  updateDateCategories();
  initArchiveSearch();
  trackPostView();
})();
