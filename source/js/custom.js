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

  updateDateCategories();

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
