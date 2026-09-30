const $ = (id) => document.getElementById(id);
const state = { base: '', token: '' };

$('base').value = localStorage.getItem('license_admin_base') || window.location.origin;
$('token').value = localStorage.getItem('license_admin_token') || '';
$('theme').value = localStorage.getItem('license_admin_theme') || '';

function show(el, text, ok) {
  el.innerHTML = '';
  if (!text) return;
  const div = document.createElement('div');
  div.className = 'msg ' + (ok ? 'ok' : 'err');
  div.textContent = text;
  el.append(div);
}

async function api(path, options = {}) {
  const res = await fetch(state.base + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + state.token,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Error ' + res.status);
  return data;
}

async function loadThemes() {
  const { themes } = await api('/api/admin/themes');
  const list = $('theme-list');
  list.innerHTML = '';
  for (const t of themes) {
    const option = document.createElement('option');
    option.value = t.theme_id;
    option.textContent = t.codes + ' kode';
    list.append(option);
  }
}

$('connect').addEventListener('click', async () => {
  state.base = $('base').value.trim().replace(/\/$/, '');
  state.token = $('token').value.trim();
  try {
    await loadThemes();
    localStorage.setItem('license_admin_base', state.base);
    localStorage.setItem('license_admin_token', state.token);
    show($('connect-msg'), 'Tersambung.', true);
    $('create-box').hidden = false;
    $('search-box').hidden = false;
    search();
  } catch (err) {
    show($('connect-msg'), err.message, false);
    $('create-box').hidden = true;
    $('search-box').hidden = true;
  }
});

$('create').addEventListener('click', async () => {
  const button = $('create');
  button.disabled = true;
  show($('create-msg'), '');
  try {
    const license = await api('/api/admin/licenses', {
      method: 'POST',
      body: JSON.stringify({
        theme_id: $('theme').value.trim(),
        order_id: $('order').value.trim(),
        email: $('email').value.trim() || undefined,
        note: $('note').value.trim() || undefined,
      }),
    });
    localStorage.setItem('license_admin_theme', license.theme_id);

    const box = $('create-msg');
    box.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'msg ok';
    const label = document.createElement('div');
    label.textContent = 'Kode untuk order ' + license.order_id + ' (' + license.theme_id + '):';
    const code = document.createElement('div');
    code.className = 'code';
    code.textContent = license.license_code;
    const copy = document.createElement('button');
    copy.className = 'small';
    copy.textContent = 'Copy kode';
    copy.addEventListener('click', async () => {
      await navigator.clipboard.writeText(license.license_code);
      copy.textContent = 'Tercopy ✓';
    });
    wrap.append(label, code, copy);
    box.append(wrap);

    $('order').value = '';
    $('email').value = '';
    $('note').value = '';
    loadThemes();
    search();
  } catch (err) {
    show($('create-msg'), err.message, false);
  } finally {
    button.disabled = false;
  }
});

async function action(code, what) {
  try {
    await api(`/api/admin/licenses/${encodeURIComponent(code)}/${what}`, { method: 'POST', body: '{}' });
    search();
  } catch (err) {
    show($('search-msg'), err.message, false);
  }
}

function renderRows(licenses) {
  const results = $('results');
  results.innerHTML = '';
  if (!licenses.length) {
    show($('search-msg'), 'Tidak ada kode yang cocok.', true);
    return;
  }
  show($('search-msg'), '');
  const table = document.createElement('table');
  table.innerHTML =
    '<thead><tr><th>Kode</th><th>Order / email</th><th>Theme</th><th>Dipakai di</th><th>Status</th><th></th></tr></thead>';
  const tbody = document.createElement('tbody');

  for (const l of licenses) {
    const tr = document.createElement('tr');

    const codeCell = document.createElement('td');
    codeCell.className = 'mono';
    codeCell.textContent = l.license_code;

    const orderCell = document.createElement('td');
    orderCell.textContent = l.order_id;
    if (l.email) {
      const small = document.createElement('div');
      small.className = 'muted';
      small.textContent = l.email;
      orderCell.append(small);
    }

    const themeCell = document.createElement('td');
    themeCell.textContent = l.theme_id;

    const storeCell = document.createElement('td');
    storeCell.textContent = l.store_id || '— belum dipakai';

    const statusCell = document.createElement('td');
    const tag = document.createElement('span');
    tag.className = 'tag' + (l.status === 'active' ? '' : ' off');
    tag.textContent = l.status;
    statusCell.append(tag);

    const actionCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'actions';
    const copy = document.createElement('button');
    copy.className = 'small';
    copy.textContent = 'Copy';
    copy.addEventListener('click', async () => {
      await navigator.clipboard.writeText(l.license_code);
      copy.textContent = '✓';
    });
    actions.append(copy);
    if (l.store_id) {
      const reset = document.createElement('button');
      reset.className = 'small';
      reset.textContent = 'Reset';
      reset.addEventListener('click', () => {
        if (confirm('Lepas kode ini dari ' + l.store_id + '?')) action(l.license_code, 'reset');
      });
      actions.append(reset);
    }
    const toggle = document.createElement('button');
    toggle.className = 'small';
    toggle.textContent = l.status === 'active' ? 'Revoke' : 'Restore';
    toggle.addEventListener('click', () => {
      const what = l.status === 'active' ? 'revoke' : 'restore';
      if (confirm(what === 'revoke' ? 'Matikan kode ini?' : 'Hidupkan lagi kode ini?')) {
        action(l.license_code, what);
      }
    });
    actions.append(toggle);
    actionCell.append(actions);

    tr.append(codeCell, orderCell, themeCell, storeCell, statusCell, actionCell);
    tbody.append(tr);
  }

  table.append(tbody);
  results.append(table);
}

async function search() {
  try {
    const { licenses } = await api('/api/admin/licenses?q=' + encodeURIComponent($('q').value.trim()));
    renderRows(licenses);
  } catch (err) {
    show($('search-msg'), err.message, false);
  }
}

$('search').addEventListener('click', search);
$('q').addEventListener('keydown', (e) => { if (e.key === 'Enter') search(); });
