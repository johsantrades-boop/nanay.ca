/* Nanay theme: interactions. No dependencies. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const N = window.Nanay || {};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Money ---------- */
  const money = (cents, fmt = N.moneyFormat || '${{amount}}') => {
    const n = (cents || 0) / 100;
    const two = n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const none = Math.round(n).toLocaleString('en-CA');
    return fmt.replace(/\{\{\s*(\w+)\s*\}\}/, (_, k) => k === 'amount_no_decimals' ? none : k === 'amount_with_comma_separator' ? two.replace(/,/g, ' ').replace('.', ',') : two);
  };
  const short = cents => '$' + ((cents || 0) / 100).toLocaleString('en-CA', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });

  /* ---------- Toast ---------- */
  let toastT;
  const toast = msg => {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('is-visible');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-visible'), 3200);
  };

  /* ---------- Header ---------- */
  const header = $('#site-header');
  const bar = $('#order-bar');
  const onScroll = () => {
    const y = scrollY;
    header && header.classList.toggle('is-scrolled', y > 8);
    bar && bar.classList.toggle('is-visible', y > 420);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Dropdowns
  const closeDropdowns = except => $$('[data-dropdown][aria-expanded="true"]').forEach(b => {
    if (b === except) return;
    b.setAttribute('aria-expanded', 'false'); $('#' + b.getAttribute('aria-controls'))?.classList.remove('is-open');
  });
  $$('[data-dropdown]').forEach(btn => {
    const dd = $('#' + btn.getAttribute('aria-controls'));
    const set = open => { btn.setAttribute('aria-expanded', String(open)); dd.classList.toggle('is-open', open); };
    btn.addEventListener('click', e => { e.stopPropagation(); closeDropdowns(btn); set(btn.getAttribute('aria-expanded') !== 'true'); });
    const item = btn.parentElement;
    if (matchMedia('(hover: hover)').matches) {
      let t; item.addEventListener('mouseenter', () => { clearTimeout(t); closeDropdowns(btn); set(true); });
      item.addEventListener('mouseleave', () => { t = setTimeout(() => set(false), 180); });
    }
    dd.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  });
  document.addEventListener('click', () => closeDropdowns());
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDropdowns(); });

  /* ---------- Drawers ---------- */
  let lastFocus;
  const openDrawer = id => {
    const d = $('#' + id); if (!d) return;
    lastFocus = document.activeElement;
    d.classList.add('is-open'); d.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    $$(`[aria-controls="${id}"]`).forEach(b => b.setAttribute('aria-expanded', 'true'));
    setTimeout(() => $('[data-close]:not(.drawer__scrim)', d)?.focus(), 50);
  };
  const closeDrawer = d => {
    d.classList.remove('is-open'); d.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
    $$(`[aria-controls="${d.id}"]`).forEach(b => b.setAttribute('aria-expanded', 'false'));
    lastFocus && lastFocus.focus && lastFocus.focus();
  };
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open]');
    if (o) { if (o.dataset.open === 'cart-drawer' && N.cartType === 'page') return; e.preventDefault(); openDrawer(o.dataset.open); if (o.dataset.open === 'cart-drawer') Cart.refresh(); return; }
    const c = e.target.closest('[data-close]');
    if (c) { const d = c.closest('.drawer'); if (d) closeDrawer(d); }
  });
  document.addEventListener('keydown', e => {
    const d = $('.drawer.is-open'); if (!d) return;
    if (e.key === 'Escape') return closeDrawer(d);
    if (e.key === 'Tab') { // keep focus inside the open drawer
      const f = $$('a[href], button:not([disabled]), input, select, textarea', $('.drawer__panel', d)).filter(x => x.offsetParent);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ---------- Reveal on scroll ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -12% 0px' }) : null;
  $$('.reveal, .meaning, .reviews-head').forEach(el => io ? io.observe(el) : el.classList.add('is-in'));

  /* ---------- Hero video ---------- */
  $$('.hero__media video').forEach(v => {
    const btn = v.closest('.hero')?.querySelector('.hero__pause');
    const setBtn = playing => { if (!btn) return; btn.innerHTML = playing ? btn.dataset.pause : btn.dataset.play; btn.setAttribute('aria-label', playing ? 'Pause background video' : 'Play background video'); };
    let userPaused = reduced;
    if (reduced) { v.removeAttribute('autoplay'); v.pause(); }
    setBtn(!reduced);
    btn && btn.addEventListener('click', () => { if (v.paused) { userPaused = false; v.play(); setBtn(true); } else { userPaused = true; v.pause(); setBtn(false); } });
    if (io) new IntersectionObserver(([en]) => { if (userPaused) return; en.isIntersecting ? v.play().catch(() => {}) : v.pause(); }).observe(v);
  });

  /* ---------- Marquee pause ---------- */
  $$('[data-marquee-toggle]').forEach(b => b.addEventListener('click', () => {
    const m = $('#' + b.getAttribute('aria-controls')); const p = m.classList.toggle('is-paused');
    b.textContent = p ? 'Play reviews' : 'Pause reviews'; b.setAttribute('aria-pressed', String(p));
  }));

  /* ---------- Tabs ---------- */
  $$('[data-tabs]').forEach(root => {
    const tabs = $$('[role="tab"]', root);
    const select = (t, focus) => {
      tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = !on; });
      focus && t.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); }
      });
    });
  });

  /* ---------- Cart ---------- */
  const Cart = {
    state: null,
    async fetch(url, opts) {
      const r = await fetch(url, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, ...opts });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.description || j.message || 'Something went wrong. Please try again.');
      return j;
    },
    async refresh() { this.state = await this.fetch(N.routes.cart + '.js'); this.render(); return this.state; },
    async add(items) {
      await this.fetch(N.routes.cartAdd + '.js', { method: 'POST', body: JSON.stringify({ items }) });
      await this.refresh();
      if (N.cartType === 'page') { location.href = N.routes.cart; return; }
      openDrawer('cart-drawer');
    },
    async change(line, quantity) { this.state = await this.fetch(N.routes.cartChange + '.js', { method: 'POST', body: JSON.stringify({ line, quantity }) }); this.render(); if (document.body.classList.contains('template-cart')) location.reload(); },
    async update(body) { this.state = await this.fetch(N.routes.cartUpdate + '.js', { method: 'POST', body: JSON.stringify(body) }); this.renderMeta(); },
    renderMeta() {
      const c = this.state; if (!c) return;
      $$('[data-cart-count]').forEach(el => { el.textContent = c.item_count || ''; el.dataset.count = c.item_count; });
      $$('[data-cart-subtotal]').forEach(el => el.textContent = money(c.total_price));
      const prog = $$('[data-cart-progress]');
      const delivery = (c.attributes && c.attributes.Fulfilment) === 'Delivery';
      prog.forEach(p => {
        const short = N.deliveryMin - c.total_price;
        p.hidden = !(delivery && N.deliveryMin > 0 && short > 0);
        if (!p.hidden) p.textContent = `Add ${money(short)} more for delivery (minimum ${money(N.deliveryMin)}).`;
      });
    },
    render() {
      const c = this.state; if (!c) return;
      this.renderMeta();
      const box = $('[data-cart-items]'); if (!box) return;
      const foot = $('[data-cart-foot]'); const opts = $('#cart-drawer [data-cart-options]');
      if (!c.item_count) {
        box.innerHTML = `<div class="cart-empty"><p class="h2">Your tray is empty</p><p class="muted">Start with a feast, or text us and we'll help you plan.</p><a class="btn" href="${(document.querySelector('.order-bar .btn:not(.btn--outline)') || {}).href || '/collections/all'}">Browse the menu</a></div>`;
        foot && (foot.hidden = true); opts && (opts.hidden = true); return;
      }
      foot && (foot.hidden = false); opts && (opts.hidden = false);
      box.innerHTML = `<ul class="cart-items">${c.items.map((it, i) => `
        <li class="cart-item">
          ${it.image ? `<img src="${it.image.replace(/(\.[a-z]+)(\?|$)/i, '_160x160$1$2')}" alt="" width="72" height="72" loading="lazy">` : '<span></span>'}
          <div>
            <a class="cart-item__title" href="${it.url}">${it.product_title}</a>
            ${it.variant_title && !it.product_has_only_default_variant ? `<p class="cart-item__opts">${it.variant_title}</p>` : ''}
            <div class="qty" role="group" aria-label="Quantity for ${it.product_title}">
              <button type="button" data-line="${i + 1}" data-qty="${it.quantity - 1}" aria-label="One fewer">−</button>
              <input type="number" min="0" value="${it.quantity}" data-line-input="${i + 1}" aria-label="Quantity">
              <button type="button" data-line="${i + 1}" data-qty="${it.quantity + 1}" aria-label="One more">+</button>
            </div>
          </div>
          <div><p class="cart-item__price price">${money(it.final_line_price)}</p><button class="link-btn" type="button" data-line="${i + 1}" data-qty="0">Remove</button></div>
        </li>`).join('')}</ul>`;
    }
  };
  window.NanayCart = Cart;

  document.addEventListener('click', async e => {
    const q = e.target.closest('[data-line][data-qty]');
    if (q) { e.preventDefault(); q.disabled = true; try { await Cart.change(+q.dataset.line, Math.max(0, +q.dataset.qty)); } catch (err) { toast(err.message); } }
  });
  document.addEventListener('change', async e => {
    const inp = e.target.closest('[data-line-input]');
    if (inp) { try { await Cart.change(+inp.dataset.lineInput, Math.max(0, +inp.value || 0)); } catch (err) { toast(err.message); } return; }
    const a = e.target.closest('[data-attr]');
    if (a) {
      const name = a.name.replace(/^attributes\[(.*)\]$/, '$1');
      if (a.type === 'radio') $$(`[data-fulfil-hint]`).forEach(h => h.hidden = h.dataset.fulfilHint !== a.value);
      $$(`[name="${a.name}"]`).forEach(x => { if (x !== a) { if (x.type === 'radio') x.checked = x.value === a.value; else x.value = a.value; } });
      try { await Cart.update({ attributes: { [name]: a.value } }); } catch (err) { toast(err.message); }
    }
  });
  let noteT;
  document.addEventListener('input', e => {
    const n = e.target.closest('[data-cart-note]'); if (!n) return;
    clearTimeout(noteT); noteT = setTimeout(() => Cart.update({ note: n.value }).catch(() => {}), 500);
  });
  // Earliest date = today + lead days
  $$('[data-min-date]').forEach(d => {
    const t = new Date(); t.setDate(t.getDate() + (+N.leadDays || 0));
    d.min = t.toISOString().slice(0, 10);
  });
  // Checkout guard: delivery minimum + date set
  document.addEventListener('submit', e => {
    const f = e.target; if (!f.matches('#cart-drawer-form, #cart-page-form')) return;
    if (!e.submitter || e.submitter.name !== 'checkout') return;
    const c = Cart.state;
    const fulfil = $(`[name="attributes[Fulfilment]"]:checked`);
    if (fulfil && fulfil.value === 'Delivery' && c && N.deliveryMin > 0 && c.total_price < N.deliveryMin) { e.preventDefault(); toast(`Delivery needs a ${money(N.deliveryMin)} minimum.`); return; }
    const date = $('[data-min-date]', f) || $('[data-min-date]');
    if (date && !date.value) { e.preventDefault(); date.focus(); toast('Please pick the date you need your order.'); }
    else if (date && date.min && date.value < date.min) { e.preventDefault(); date.focus(); toast(`The earliest date we can do is ${date.min}.`); }
  });

  // Quick add buttons and product forms
  document.addEventListener('submit', async e => {
    const f = e.target.closest('form[data-add-form]'); if (!f) return;
    e.preventDefault();
    const btn = $('[type="submit"]', f); btn && btn.classList.add('is-loading');
    try {
      const fd = new FormData(f);
      await Cart.add([{ id: +fd.get('id'), quantity: +(fd.get('quantity') || 1) }]);
      toast('Added to your order');
    } catch (err) { toast(err.message); }
    btn && btn.classList.remove('is-loading');
  });

  if ($('[data-cart-items]')) Cart.refresh().catch(() => {});

  /* ---------- Product page ---------- */
  $$('[data-product]').forEach(root => {
    const data = JSON.parse($('[data-product-json]', root).textContent);
    const form = $('form[data-add-form]', root);
    const idInput = $('[name="id"]', form);
    const priceEl = $('[data-price]', root);
    const btn = $('[data-add-btn]', root);
    const pick = () => $$('[data-option]', root).map(fs => ($('input:checked', fs) || {}).value);
    const update = () => {
      const sel = pick();
      const v = data.variants.find(x => x.options.every((o, i) => o === sel[i]));
      // mark choices that would lead to no variant / sold out
      $$('[data-option]', root).forEach((fs, idx) => $$('input', fs).forEach(inp => {
        const trial = sel.slice(); trial[idx] = inp.value;
        const m = data.variants.find(x => x.options.every((o, i) => o === trial[i] || (i > idx && !trial[i])));
        inp.classList.toggle('is-unavailable', !m || !m.available);
      }));
      if (!v) { btn.disabled = true; btn.textContent = 'Unavailable'; return; }
      idInput.value = v.id;
      priceEl.innerHTML = money(v.price) + (v.compare_at_price > v.price ? ` <s>${money(v.compare_at_price)}</s>` : '');
      btn.disabled = !v.available; btn.textContent = v.available ? btn.dataset.label : 'Sold out';
      const u = new URL(location.href); u.searchParams.set('variant', v.id); history.replaceState(null, '', u);
      if (v.featured_media) { const t = $(`[data-media-id="${v.featured_media.id}"]`, root); t && t.click(); }
    };
    $$('[data-option] input', root).forEach(i => i.addEventListener('change', update));
    // quantity steppers
    $$('[data-qty-step]', root).forEach(b => b.addEventListener('click', () => {
      const i = $('[name="quantity"]', root); i.value = Math.max(1, (+i.value || 1) + +b.dataset.qtyStep);
    }));
  });
  // Gallery
  $$('[data-gallery]').forEach(g => {
    const main = $('.gallery__main img', g); if (!main) return;
    $$('[data-media-id]', g).forEach(t => t.addEventListener('click', () => {
      main.src = t.dataset.src; main.srcset = t.dataset.srcset || ''; main.alt = t.dataset.alt || '';
      $$('[data-media-id]', g).forEach(x => x.setAttribute('aria-current', x === t));
    }));
  });

  /* ---------- Same-page anchors (menu chips, header Menu dropdown, "#planner") ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href*="#"]'); if (!a) return;
    const u = new URL(a.href, location.href);
    if (u.pathname !== location.pathname || !u.hash) return;
    const t = document.getElementById(decodeURIComponent(u.hash.slice(1))); if (!t) return;
    e.preventDefault();
    const d = a.closest('.drawer'); if (d) closeDrawer(d);
    const bar = $('.menu-nav');
    const off = (header ? header.offsetHeight : 0) + (bar && !bar.contains(t) ? bar.offsetHeight : 0) + 12;
    scrollTo({ top: t.getBoundingClientRect().top + scrollY - off, behavior: reduced ? 'auto' : 'smooth' });
    history.replaceState(null, '', u.hash);
    t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true });
  });
  // Arriving from another page with #category: correct for the sticky bars once layout settles
  if (location.hash && $('[data-menu-board]')) addEventListener('load', () => {
    const t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (!t) return;
    const off = (header ? header.offsetHeight : 0) + ($('.menu-nav')?.offsetHeight || 0) + 12;
    scrollTo({ top: t.getBoundingClientRect().top + scrollY - off, behavior: 'auto' });
  });

  /* ---------- Menu board: search + scrollspy ---------- */
  $$('[data-menu-board]').forEach(board => {
    const chips = $$('[data-menu-chip]', board);
    const groups = $$('[data-menu-group]', board);
    const search = $('[data-menu-search]', board);
    const empty = $('[data-menu-empty]', board);
    if (search) search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase(); let shown = 0;
      groups.forEach(g => {
        let n = 0;
        $$('[data-title]', g).forEach(c => { const hit = !q || c.dataset.title.includes(q); c.hidden = !hit; if (hit) n++; });
        g.hidden = n === 0; shown += n;
      });
      empty.hidden = shown > 0;
    });
    if (io && chips.length) {
      const spy = new IntersectionObserver(es => es.forEach(en => {
        if (!en.isIntersecting) return;
        chips.forEach(c => { const on = c.getAttribute('href') === '#' + en.target.id; c.setAttribute('aria-current', on); if (on) c.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduced ? 'auto' : 'smooth' }); });
      }), { rootMargin: '-35% 0px -60% 0px' });
      groups.forEach(g => spy.observe(g));
    }
  });

  /* ---------- Feast planner ---------- */
  $$('[data-planner]').forEach(root => {
    const data = JSON.parse($('[data-planner-json]', root).textContent);
    const P = data.packages.filter(p => p.price > 0 && p.serves > 0);
    const range = $('[data-guests-range]', root), out = $('[data-guests-out]', root);
    const dessertBox = $('[data-dessert]', root);
    const linesEl = $('[data-lines]', root), totalEl = $('[data-total]', root), ppEl = $('[data-pp]', root), feedsEl = $('[data-feeds]', root);
    const textBtn = $('[data-text-order]', root), addBtn = $('[data-add-plan]', root), hint = $('[data-hint]', root);
    const W = 14, cache = {};
    // Cheapest set of packages that covers >= guests; a small weight per package favours fewer, larger feasts.
    const table = keys => {
      const id = keys.join(); if (cache[id]) return cache[id];
      const max = 260, best = Array(max + 1).fill(null); best[0] = { score: 0, cost: 0, items: {} };
      for (let g = 1; g <= max; g++) for (const k of keys) {
        const p = P[k], prev = best[Math.max(0, g - p.serves)]; if (!prev) continue;
        const score = prev.score + p.price / 100 + W;
        if (!best[g] || score < best[g].score) best[g] = { score, cost: prev.cost + p.price, items: { ...prev.items, [k]: (prev.items[k] || 0) + 1 } };
      }
      return (cache[id] = best);
    };
    const idx = style => P.map((p, i) => p.style === style ? i : -1).filter(i => i >= 0);
    const plan = (g, keys) => keys.length ? table(keys)[Math.min(g, 260)] : null;
    const planParty = g => {
      const party = idx('party'), small = idx('inihaw');
      if (!party.length) return plan(g, small);
      if (g < 12 && small.length) return plan(g, small);
      let pick = null;
      // at least one party package, small feasts only top up the remainder
      for (let b = 1; b <= g + 100; b++) {
        const base = plan(b, party); if (!base || (pick && base.score >= pick.score)) continue;
        const rest = Math.max(0, g - b);
        const top = rest ? plan(rest, small.length ? small : party) : { score: 0, cost: 0, items: {} };
        if (!top) continue;
        const score = base.score + top.score;
        if (!pick || score < pick.score) {
          const items = { ...base.items }; for (const [k, q] of Object.entries(top.items)) items[k] = (items[k] || 0) + q;
          pick = { score, cost: base.cost + top.cost, items };
        }
      }
      return pick;
    };
    const dessert = data.dessert && data.dessert.price ? { ...data.dessert, isDessert: true } : null;
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const keyOf = l => (l.variantId || '') + '|' + l.title;
    // Everything a customer can add by hand: the packages, the dessert and the "extra dishes" collection.
    const catalog = [];
    const seen = new Set();
    for (const it of [...P, ...(dessert ? [dessert] : []), ...(data.extras || []).filter(e => e.price > 0 && e.available !== false)]) {
      if (seen.has(keyOf(it))) continue;
      seen.add(keyOf(it)); catalog.push(it);
    }
    const sel = $('[data-add-select]', root), addLineBtn = $('[data-add-line]', root);
    const editedNote = $('[data-edited]', root), titleEl = $('[data-receipt-title]', root);
    sel.insertAdjacentHTML('beforeend', catalog.map((it, i) =>
      `<option value="${i}">${esc(it.title)}${it.note ? ' (' + esc(it.note) + ')' : ''} · ${it.variants > 1 ? 'from ' : ''}${short(it.price)}</option>`).join(''));

    let current = [], edited = false, guests = +range.value, style = 'party';
    const render = () => {
      const g = guests;
      const total = current.reduce((s, l) => s + l.price * l.q, 0);
      const feeds = current.reduce((s, l) => s + (l.isDessert ? 0 : (l.serves || 0) * l.q), 0);
      linesEl.innerHTML = current.length ? current.map((l, i) => `<li>
          <span class="receipt-lines__name"><a href="${l.url}">${esc(l.title)}</a><small>${esc(l.note || '')}${l.variants > 1 ? (l.note ? ' · ' : '') + 'choose options' : ''}</small></span>
          <b class="price">${short(l.price * l.q)}</b>
          <span class="qstep" role="group" aria-label="Quantity of ${esc(l.title)}">
            <button type="button" data-dec="${i}" aria-label="${l.q === 1 ? 'Remove' : 'One fewer'} ${esc(l.title)}">${l.q === 1 ? '×' : '−'}</button>
            <output>${l.q}</output>
            <button type="button" data-inc="${i}" aria-label="One more ${esc(l.title)}">+</button>
          </span>
        </li>`).join('') : '<li class="receipt-lines__empty">Nothing here yet. Add a dish below.</li>';
      totalEl.textContent = short(total);
      ppEl.textContent = total ? short(Math.round(total / g)) + ' / person' : '';
      const short_by = feeds > 0 && feeds < g;
      feedsEl.textContent = !feeds ? '' : short_by ? `Feeds about ${feeds}. You have ${g} guests.` : `Planned for ${feeds}+ guests`;
      feedsEl.classList.toggle('is-warn', short_by);
      titleEl.textContent = edited ? 'Your order' : 'Suggested order';
      editedNote.hidden = !edited;
      const boxes = current.reduce((s, l) => s + l.q, 0);
      hint.hidden = edited || !(style !== 'party' && boxes > 6);
      const body = `Hi Nanay! I'd like to order for ${g} guests: ` + current.map(l => `${l.q}x ${l.title}`).join(', ') + ` (est. ${short(total)}). What dates are available?`;
      textBtn.href = `sms:${N.sms}?&body=${encodeURIComponent(body)}`;
      const needsOptions = current.filter(l => l.variants > 1);
      addBtn.textContent = needsOptions.length ? `Add to cart (choose options for ${needsOptions.length})` : 'Add all to cart';
      addBtn.disabled = !current.length;
    };
    // Build the suggestion from headcount + style (+ dessert). Clears any hand edits.
    const suggest = () => {
      style = ($('input[name="planner-style-' + data.id + '"]:checked', root) || {}).value || 'party';
      const r = style === 'party' ? planParty(guests) : plan(guests, idx(style));
      edited = false;
      if (!r) { current = []; render(); linesEl.innerHTML = '<li>Add packages for this style in the theme editor.</li>'; return; }
      current = Object.entries(r.items).map(([k, q]) => ({ ...P[k], q })).sort((a, b) => b.serves - a.serves);
      if (dessertBox && dessertBox.checked && dessert) current.push({ ...dessert, q: Math.max(1, Math.ceil(guests / (dessert.serves || 30))) });
      render();
    };
    const setGuests = g => {
      guests = g; out.value = g; out.textContent = g;
      if (edited) render(); else suggest(); // keep a hand-edited order; just update per-person and "feeds"
    };
    const refocus = sel2 => { const b = $(sel2, linesEl); (b || sel).focus(); };
    linesEl.addEventListener('click', e => {
      const inc = e.target.closest('[data-inc]'), dec = e.target.closest('[data-dec]');
      if (!inc && !dec) return;
      const i = +(inc || dec).dataset[inc ? 'inc' : 'dec'];
      if (inc) current[i].q = Math.min(99, current[i].q + 1);
      else if (current[i].q > 1) current[i].q -= 1;
      else current.splice(i, 1);
      edited = true; render();
      refocus(inc ? `[data-inc="${i}"]` : `[data-dec="${Math.min(i, current.length - 1)}"]`);
    });
    addLineBtn.addEventListener('click', () => {
      const it = catalog[+sel.value];
      if (!it) { sel.focus(); return; }
      const hit = current.find(l => keyOf(l) === keyOf(it));
      if (hit) hit.q = Math.min(99, hit.q + 1); else current.push({ ...it, q: 1 });
      edited = true; sel.value = ''; render();
      toast(`Added ${it.title}`);
    });
    $('[data-reset]', root).addEventListener('click', () => { suggest(); sel.focus(); });

    $$('[data-step]', root).forEach(b => b.addEventListener('click', () => {
      range.value = Math.min(+range.max, Math.max(+range.min, +range.value + +b.dataset.step)); setGuests(+range.value);
    }));
    range.addEventListener('input', () => setGuests(+range.value));
    $$('input[type="radio"]', root).forEach(r => r.addEventListener('change', suggest));
    if (dessertBox) dessertBox.addEventListener('change', () => {
      if (!edited) return suggest();
      current = current.filter(l => !l.isDessert);
      if (dessertBox.checked && dessert) current.push({ ...dessert, q: Math.max(1, Math.ceil(guests / (dessert.serves || 30))) });
      render();
    });
    addBtn.addEventListener('click', async () => {
      const ready = current.filter(l => l.variants === 1 && l.variantId);
      const later = current.filter(l => l.variants > 1);
      addBtn.classList.add('is-loading');
      try {
        if (ready.length) await Cart.add(ready.map(l => ({ id: l.variantId, quantity: l.q })));
        if (later.length) {
          toast(`Added ${ready.length ? 'the rest' : 'nothing yet'}. Next: choose options for ${later[0].title}.`);
          setTimeout(() => { location.href = later[0].url; }, ready.length ? 1600 : 400);
        } else toast('Added your feast to the cart');
      } catch (err) { toast(err.message); }
      addBtn.classList.remove('is-loading');
    });
    out.value = guests; out.textContent = guests;
    suggest();
  });
})();
