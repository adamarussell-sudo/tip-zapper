// Tip Zapper: zeroes the auto-added grocery delivery tip on Amazon checkout.
// It never clicks Place Your Order. If a tip is still on when YOU click it,
// the click is blocked until the tip is $0 (or you hit "Order anyway").
(() => {
  'use strict';
  if (window.top !== window || window.__tipZapper) return;
  window.__tipZapper = true;

  const VERSION = (() => {
    try { return chrome.runtime.getManifest().version; } catch (_) { return '?'; }
  })();
  const REPO_URL = 'https://github.com/adamarussell-sudo/tip-zapper';
  const ISSUE_URL = `${REPO_URL}/issues/new?template=bug_report.yml`;
  const SUPPORT_URL = 'https://6foot5.com/tip-zapper/';

  // ---------- patterns ----------
  const MAX_ACTIONS = 10;
  const TIP_WORD = /\btip(s|ping)?\b/i;
  // "Tip:", "Driver tip:", "Grocery Tip (optional):" ...
  const TIP_LABEL = /^([a-z]+\s+){0,2}tips?(\s*amount)?\s*(\(optional\))?\s*:?$/i;
  const TIP_ROW = /^(?:[a-z]+\s+){0,2}tips?(?:\s*amount)?\s*(?:\(optional\))?\s*:?\s*\$\s?([\d,]+(?:\.\d{1,2})?)$/i;
  const ZERO_OPT = /^(\$\s?0(\.0{1,2})?(\s*tip)?|0\s?%|no\s*tip|none|skip(\s*tip)?|don'?t\s*tip|remove(\s*tip)?)$/i;
  const OTHER_OPT = /^(other|custom|other\s*amount|custom\s*(tip|amount)|enter\s*(an?\s*)?(other\s*|custom\s*)?amount)$/i;
  const EDIT_TIP = /^((edit|change|modify|update)\s*(the\s*)?(driver\s*|delivery\s*)?tip(\s*amount)?|(edit|change)\s*amount)$/i;
  const EDIT_BARE = /^(edit|change|modify)$/i;
  const APPLY_OPT = /^(apply|update|save|done|ok|okay|confirm|set|(save|update|apply|set)\s*(driver\s*)?tip|save\s*changes)$/i;
  const DANGER_TEXT = /place\s*(your\s*)?order|buy\s*now|pay\s*now|submit\s*order|complete\s*(purchase|order)|proceed|continue|check\s*out|subscribe/i;
  const DANGER_ATTR = /place.?(your)?.?order|submit.?order|buy.?now|turbo.?checkout/i;
  const PLACE_ORDER_TEXT = /place\s*(your\s*)?order/i;
  const NOT_TIP_INPUT = /promo|gift|coupon|claim|code|quantity|qty|zip|postal|search|card|cvv|security|email|phone|name|address/i;
  const CHECKOUT_PATH = /\/(gp\/buy|checkout|spc\/|alm\/)/i;
  const PLACE_ORDER_SEL = '#submitOrderButtonId, #bottomSubmitOrderButtonId, [name^="placeYourOrder"], #placeYourOrder, #placeOrder';
  const CONTROL_SEL = 'button, a, input:not([type="hidden"]), select, label, .a-button, [role="button"], [role="radio"], [role="option"], [role="link"], [role="tab"]';

  // ---------- helpers ----------
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const text = (el) => (el ? norm(el.innerText ?? el.textContent) : '');
  const money = (s) => {
    const m = String(s || '').match(/(\d[\d,]*(?:\.\d+)?|\.\d+)/);
    return m ? parseFloat(m[1].replace(/,/g, '')) : NaN;
  };
  const words = (s) => String(s || '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z]+/);
  const attrHasTip = (el) =>
    ['id', 'name', 'data-testid', 'aria-label', 'class'].some((a) => {
      const v = el.getAttribute && el.getAttribute(a);
      return v && words(v).some((w) => w === 'tip' || w === 'tips' || w === 'tipping');
    });
  const isBanner = (el) => !!(el && el.closest && el.closest('#tz-banner, #tz-modal'));

  function visible(el) {
    if (!el || !el.isConnected || el.type === 'hidden') return false;
    if (typeof el.checkVisibility === 'function') return el.checkVisibility({ visibilityProperty: true });
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (n.hidden) return false;
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    }
    return true;
  }

  const clickTarget = (c) => (c.matches('.a-button') ? c.querySelector('input, button, a') || c : c);

  function labelFor(input) {
    if (input.id) {
      const l = [...document.getElementsByTagName('label')].find((x) => x.htmlFor === input.id);
      if (l) return l;
    }
    return input.closest('label');
  }

  function controlText(c) {
    if (c.matches('input[type="radio"], input[type="checkbox"]')) {
      return text(labelFor(c)) || c.getAttribute('aria-label') || c.value || '';
    }
    if (c.matches('input[type="submit"], input[type="button"], input.a-button-input')) {
      return text(c.closest('.a-button')) || c.value || c.getAttribute('aria-label') || '';
    }
    return text(c) || c.getAttribute('aria-label') || (c.tagName === 'INPUT' ? '' : c.value) || '';
  }

  function isSelected(c) {
    const nodes = [c, clickTarget(c), c.closest('.a-button'), c.closest('label')];
    for (const n of nodes) {
      if (!n) continue;
      if (n.checked) return true;
      for (const a of ['aria-checked', 'aria-pressed', 'aria-selected', 'aria-current']) {
        if (n.getAttribute(a) === 'true') return true;
      }
      if (/(^|\s)(a-button-selected|a-button-toggle-selected|selected|is-selected|checked|active)(\s|$)/i.test(n.getAttribute('class') || '')) return true;
    }
    const r = c.querySelector && c.querySelector('input[type="radio"]');
    return !!(r && r.checked);
  }

  function isSafe(c) {
    const t = clickTarget(c);
    const s = `${controlText(c)} ${t.getAttribute('aria-label') || ''} ${t.tagName === 'INPUT' ? t.value || '' : ''}`;
    const a = `${t.id || ''} ${t.getAttribute('name') || ''} ${c.id || ''}`;
    return !DANGER_TEXT.test(s) && !DANGER_ATTR.test(a);
  }

  function isPlaceOrder(b) {
    if (!b || !b.closest) return false;
    const ab = b.closest('.a-button') || b;
    const s = norm(`${text(ab)} ${b.tagName === 'INPUT' ? b.value || '' : ''} ${b.getAttribute('aria-label') || ''}`);
    if (PLACE_ORDER_TEXT.test(s) && s.length < 60) return true;
    return /placeYourOrder|submitOrderButton|place-?your-?order|place-?order/i.test(`${b.id || ''} ${b.getAttribute('name') || ''} ${ab.id || ''}`);
  }

  const isCheckout = () => CHECKOUT_PATH.test(location.pathname) || !!document.querySelector(PLACE_ORDER_SEL);

  const controls = (root) => [...root.querySelectorAll(CONTROL_SEL)].filter((c) => visible(c) && !isBanner(c));

  // ---------- finding the tip UI ----------
  function containerFor(anchor) {
    let el = anchor;
    for (let i = 0; i < 6; i++) {
      if (controls(el).length && text(el).length <= 1000) return el;
      const p = el.parentElement;
      if (!p || p === document.body || p === document.documentElement || text(p).length > 1000) return el;
      el = p;
    }
    return el;
  }

  function tipAreas() {
    const anchors = new Set();
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const v = n.nodeValue;
      if (v.length > 200 || !TIP_WORD.test(v)) continue;
      const p = n.parentElement;
      if (!p || p.closest('script, style, noscript, template') || isBanner(p) || !visible(p)) continue;
      anchors.add(p);
    }
    for (const el of document.body.querySelectorAll('[id], [name], [data-testid], [aria-label], [class]')) {
      if (attrHasTip(el) && !isBanner(el) && visible(el) && text(el).length <= 1500) anchors.add(el);
    }
    const areas = new Set();
    for (const a of anchors) areas.add(containerFor(a));
    return [...areas];
  }

  function isTipInput(input, area) {
    if (!input.matches('input:not([type]), input[type="text"], input[type="number"], input[type="tel"], input[type="decimal"]')) return false;
    if (!visible(input) || input.disabled || input.readOnly) return false;
    const desc = `${input.id} ${input.getAttribute('name') || ''} ${input.getAttribute('placeholder') || ''} ${input.getAttribute('aria-label') || ''} ${text(labelFor(input))}`;
    if (NOT_TIP_INPUT.test(desc) && !TIP_WORD.test(desc)) return false;
    if (attrHasTip(input) || /tip|amount|\$/i.test(desc)) return true;
    const all = [...area.querySelectorAll('input')].filter((i) => visible(i) && /^(text|number|tel|decimal)$/.test(i.type));
    return all.length === 1 && text(area).length <= 600;
  }

  function nearTipText(c) {
    let el = c.parentElement;
    for (let i = 0; i < 3 && el; i++, el = el.parentElement) {
      const t = text(el);
      if (t.length > 160) return false;
      if (TIP_WORD.test(t)) return true;
    }
    return false;
  }

  // ---------- reading the current tip ----------
  // A summary row reads like "Grocery Tip (optional): Edit $5.00".
  function parseTipRow(t) {
    const s = norm(String(t).replace(/\b(edit|change|cancel|apply)\b/gi, ' '));
    if (s.length > 100) return null;
    const m = s.match(TIP_ROW);
    return m ? money(m[1]) : null;
  }

  function readTip(areas) {
    let summary = null;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const v = norm(n.nodeValue);
      if (!v || v.length > 60 || !TIP_WORD.test(v) || !(TIP_LABEL.test(v) || parseTipRow(v) !== null)) continue;
      let el = n.parentElement;
      if (!el || isBanner(el) || !visible(el)) continue;
      for (let i = 0; i < 8 && el && el !== document.body; i++, el = el.parentElement) {
        const t = text(el);
        if (t.length > 200) break;
        const val = parseTipRow(t);
        if (val !== null) {
          summary = Math.max(summary ?? 0, val);
          break;
        }
      }
    }

    let preset = null;
    let pct = null;
    let zeroSelected = false;
    let inputVal = null;
    for (const a of areas) {
      for (const c of controls(a)) {
        if (!isSelected(c)) continue;
        const t = controlText(c);
        if (t.length > 30) continue;
        if (ZERO_OPT.test(t)) {
          zeroSelected = true;
          preset = preset ?? 0;
          continue;
        }
        const m = t.match(/\$\s?([\d,]+(?:\.\d{1,2})?)/);
        if (m) preset = Math.max(preset ?? 0, money(m[1]));
        const p = t.match(/^(\d{1,2})\s?%$/);
        if (p && +p[1] > 0) pct = Math.max(pct ?? 0, +p[1]);
      }
      for (const i of a.querySelectorAll('input')) {
        if (!isTipInput(i, a)) continue;
        const v = money(i.value);
        if (Number.isFinite(v)) inputVal = Math.max(inputVal ?? 0, v);
      }
    }

    if (summary !== null) return { value: summary, label: `$${summary.toFixed(2)}`, zeroSelected, source: 'summary' };
    if (pct !== null && !(preset > 0)) return { value: pct, label: `${pct}%`, zeroSelected, source: 'preset' };
    if (preset !== null) return { value: preset, label: `$${preset.toFixed(2)}`, zeroSelected, source: 'preset' };
    if (inputVal !== null) return { value: inputVal, label: `$${inputVal.toFixed(2)}`, zeroSelected, source: 'input' };
    return null;
  }

  // ---------- changing the tip ----------
  const clicked = new WeakSet();
  const applyCount = new WeakMap();
  const log = [];

  function doClick(c, why) {
    const t = clickTarget(c);
    clicked.add(t);
    log.push(why);
    t.click();
    return why;
  }

  function setValue(input, v) {
    try { input.focus(); } catch (_) { /* ignore */ }
    const proto = input.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, v);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function findApply(area, input) {
    const scopes = [area];
    let el = area.parentElement;
    for (let i = 0; i < 3 && el && el !== document.body; i++, el = el.parentElement) {
      if (text(el).length > 1500) break;
      scopes.push(el);
    }
    const dlg = input.closest('[role="dialog"], .a-popover, .a-modal-scroller, [aria-modal="true"]');
    if (dlg) scopes.push(dlg);
    for (const s of scopes) {
      for (const c of controls(s)) {
        if (!APPLY_OPT.test(controlText(c)) || !isSafe(c)) continue;
        const t = clickTarget(c);
        if ((applyCount.get(t) || 0) >= 2) continue;
        return c;
      }
    }
    return null;
  }

  function pressEnter(input) {
    for (const type of ['keydown', 'keypress', 'keyup']) {
      input.dispatchEvent(new KeyboardEvent(type, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    }
    try { input.blur(); } catch (_) { /* ignore */ }
  }

  function zapOnce(areas, tipIsOn) {
    // 1. A "$0" / "No tip" choice that isn't selected yet.
    for (const a of areas) {
      for (const c of controls(a)) {
        const t = controlText(c);
        if (t.length > 30 || !ZERO_OPT.test(t) || isSelected(c) || !isSafe(c) || clicked.has(clickTarget(c))) continue;
        return doClick(c, `picked "${t}"`);
      }
    }
    if (!tipIsOn) return null;

    // 2. A dropdown of tip amounts.
    for (const a of areas) {
      for (const s of a.querySelectorAll('select')) {
        if (!visible(s) || s.disabled) continue;
        const cur = s.options[s.selectedIndex];
        if (cur && (ZERO_OPT.test(norm(cur.text)) || money(cur.text) === 0)) continue;
        const zero = [...s.options].find((o) => ZERO_OPT.test(norm(o.text)) || o.value === '0' || money(o.text) === 0);
        if (zero) {
          setValue(s, zero.value);
          log.push(`chose "${norm(zero.text)}" in dropdown`);
          return 'dropdown';
        }
      }
    }

    // 3. A tip amount box: type 0, then hit the nearby Apply/Update/Save.
    for (const a of areas) {
      for (const i of a.querySelectorAll('input')) {
        if (!isTipInput(i, a)) continue;
        const already = money(i.value) === 0;
        if (!already) setValue(i, '0');
        const apply = findApply(a, i);
        if (apply) {
          const t = clickTarget(apply);
          applyCount.set(t, (applyCount.get(t) || 0) + 1);
          log.push(`typed 0, pressed "${controlText(apply)}"`);
          t.click();
          return 'typed';
        }
        if (!already) {
          pressEnter(i);
          log.push('typed 0, pressed Enter');
          return 'typed';
        }
      }
    }

    // 4. "Other" / "Custom amount" opens a box.
    for (const a of areas) {
      for (const c of controls(a)) {
        const t = controlText(c);
        if (t.length > 30 || !OTHER_OPT.test(t) || !isSafe(c) || clicked.has(clickTarget(c))) continue;
        return doClick(c, `opened "${t}"`);
      }
    }

    // 5. "Edit tip" / "Change" next to the tip.
    for (const a of areas) {
      for (const c of controls(a)) {
        const t = controlText(c);
        if (t.length > 30 || !isSafe(c) || clicked.has(clickTarget(c))) continue;
        if (EDIT_TIP.test(t) || (EDIT_BARE.test(t) && nearTipText(c))) return doClick(c, `opened "${t}"`);
      }
    }
    return null;
  }

  // ---------- Amazon's grocery tip widget (from a real checkout page) ----------
  // <div class="tip-widget"> "Grocery Tip (optional):" [Edit]
  //   hidden .tip-widget--edit-form: number box + Apply + Cancel
  function amazonWidget() {
    const w = [...document.querySelectorAll('.tip-widget')].find((x) => visible(x) && !isBanner(x));
    if (!w) return null;
    const input = w.querySelector('#tip-widget--edit-form--amount-input, input[name="updateAmountInput"], .tip-widget--edit-form input[type="number"], .tip-widget--edit-form input[type="text"]');
    const apply = w.querySelector('#tip-widget--submit-update') ||
      [...w.querySelectorAll('.tip-widget--edit-form .a-button, .tip-widget--edit-form button')].find((b) => /^apply$/i.test(controlText(b)));
    const links = [...w.querySelectorAll('.tip-widget--edit-control, a')];
    const edit = links.find((a) => /^edit$/i.test(norm(a.textContent)) && visible(a));
    const err = w.querySelector('#tip-widget--error-content, .tip-widget--error-content');
    return { w, input, apply: apply ? clickTarget(apply) : null, edit, err };
  }

  const az = { edits: 0, applies: 0, applied: false, appliedAt: 0 };

  // Returns 'opened' | 'applied' | 'wait' | {fail} | null (nothing left to do)
  function amazonStep(W, r, formOpen) {
    if (formOpen) {
      const errMsg = W.err ? norm(W.err.textContent) : '';
      if (errMsg && az.applied) return { fail: `Amazon said: "${errMsg}".` };
      if (Date.now() - az.appliedAt < 2500) return 'wait';
      if (az.applies >= 3 || !W.apply) return null;
      const before = W.input.value;
      if (money(before) !== 0) setValue(W.input, '0');
      az.applies++;
      az.applied = true;
      az.appliedAt = Date.now();
      log.push(`tip widget: box had "${before}", typed 0, pressed Apply`);
      W.apply.click();
      return 'applied';
    }
    if (r && r.value === 0) return null;
    if (az.applied && !(r && r.value > 0)) return null;
    if (Date.now() - az.appliedAt < 3000) return 'wait';
    if (az.edits >= 3 || !W.edit) return null;
    az.edits++;
    log.push(`tip widget: clicked Edit (tip read ${r ? r.label : 'unknown'})`);
    W.edit.click();
    return 'opened';
  }

  // ---------- status badge ----------
  let host = null;
  let root = null;
  let lastKey = '';
  let override = false;
  let dismissedKey = '';
  const COLORS = { ok: '#0a7d38', work: '#9a5b00', warn: '#5b5b5b', fail: '#c40000' };

  function hide() {
    if (host) host.remove();
    host = null;
    root = null;
    lastKey = '';
  }

  function banner(kind, msg, buttons = []) {
    const key = `${kind}|${msg}|${buttons.join()}`;
    if (key === lastKey || key === dismissedKey) return;
    lastKey = key;
    if (!host || !host.isConnected) {
      host = document.createElement('div');
      host.id = 'tz-banner';
      root = host.attachShadow({ mode: 'open' });
      document.documentElement.appendChild(host);
    }
    root.innerHTML = `
      <style>
        .b{position:fixed;left:16px;bottom:16px;z-index:2147483646;max-width:360px;
           font:600 13px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;
           color:#fff;background:${COLORS[kind]};border-radius:10px;padding:10px 34px 10px 12px;
           box-shadow:0 4px 16px rgba(0,0,0,.25)}
        .b.shake{animation:s .4s}
        @keyframes s{0%,100%{transform:none}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
        .t{font-weight:400;opacity:.85;font-size:11px;margin-bottom:2px;letter-spacing:.02em}
        .x{position:absolute;top:6px;right:8px;background:none;border:0;color:#fff;font-size:16px;cursor:pointer;opacity:.8}
        .r{margin-top:8px;display:flex;gap:6px;flex-wrap:wrap}
        .r button{font:600 12px Arial,sans-serif;background:#fff;color:#222;border:0;border-radius:6px;padding:5px 9px;cursor:pointer}
        .s{display:inline-block;margin-top:5px;font-weight:400;font-size:11.5px;color:#fff;opacity:.9;text-decoration:underline;text-underline-offset:2px}
        .s:hover{opacity:1}
      </style>
      <div class="b${kind === 'fail' && buttons.includes('anyway') ? ' shake' : ''}" role="status">
        <div class="t">TIP ZAPPER v${VERSION}</div><div class="m"></div>
        ${buttons.includes('support') ? `<a class="s" href="${SUPPORT_URL}" target="_blank" rel="noopener noreferrer">Like it? Leave a tip →</a>` : ''}
        <button class="x" title="Hide">×</button>
        ${buttons.some((b) => b !== 'support') ? '<div class="r"></div>' : ''}
      </div>`;
    root.querySelector('.m').textContent = msg;
    root.querySelector('.x').onclick = () => { dismissedKey = key; hide(); };
    const row = root.querySelector('.r');
    if (buttons.includes('report')) {
      const b = document.createElement('button');
      b.textContent = 'Report it';
      b.title = 'Copies the debug info, then opens a bug report on GitHub';
      b.onclick = async () => {
        await copy(debugInfo());
        window.open(ISSUE_URL, '_blank', 'noopener');
        b.textContent = 'Debug info copied. Paste it in the report.';
      };
      row.appendChild(b);
    }
    if (buttons.includes('anyway')) {
      const b = document.createElement('button');
      b.textContent = 'Order anyway';
      b.onclick = () => { override = true; banner('warn', 'Guard off for this page. Click Place your order again.'); };
      row.appendChild(b);
    }
    if (buttons.includes('debug')) {
      const b = document.createElement('button');
      b.textContent = 'Copy debug info';
      b.onclick = async () => { b.textContent = (await copy(debugInfo())) ? 'Copied' : 'Copy failed'; };
      row.appendChild(b);
    }
  }

  function scrub(el) {
    const c = el.cloneNode(true);
    c.querySelectorAll('script, style, svg, img, input[type="hidden"], noscript').forEach((n) => n.remove());
    for (const n of [c, ...c.querySelectorAll('*')]) {
      for (const at of [...n.attributes]) {
        const keep = /^(id|class|name|type|role|for|placeholder|value|href|aria-[a-z-]+|data-action|data-testid)$/.test(at.name);
        if (!keep) n.removeAttribute(at.name);
        else if (at.name === 'href') n.setAttribute('href', at.value.split('?')[0].slice(0, 80));
        else if (at.value.length > 80) n.setAttribute(at.name, at.value.slice(0, 80) + '…');
      }
    }
    return c.outerHTML.replace(/\s+/g, ' ');
  }

  function debugInfo() {
    const areas = tipAreas();
    const parts = [
      `Tip Zapper debug v${VERSION}`,
      `path: ${location.pathname}`,
      `tip read: ${JSON.stringify(readTip(areas))}`,
      `actions: ${log.join(' | ') || 'none'}`,
      `areas found: ${areas.length}`,
    ];
    const W = amazonWidget();
    if (W) {
      parts.push(`tip widget: input="${W.input ? W.input.value : '(none)'}" inputVisible=${!!(W.input && visible(W.input))} edit=${!!W.edit} apply=${!!W.apply}`);
      let row = W.w;
      for (let i = 0; i < 4 && row.parentElement && text(row.parentElement).length <= 400; i++) row = row.parentElement;
      parts.push(`row text: ${text(row)}`);
      parts.push(`--- widget row ---\n${scrub(row).slice(0, 5000)}`);
    }
    areas.slice(0, 6).forEach((a, i) => parts.push(`--- area ${i} ---\n${scrub(a).slice(0, 4000)}`));
    return parts.join('\n');
  }

  async function copy(s) {
    try {
      await navigator.clipboard.writeText(s);
      return true;
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = s;
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (__) { /* ignore */ }
      ta.remove();
      return ok;
    }
  }

  // ---------- main loop ----------
  let actions = 0;
  let acted = false;
  let lastAction = 0;
  let waits = 0;
  let timer = 0;

  function schedule(ms) {
    if (!timer) timer = setTimeout(tick, ms);
  }

  function tick() {
    timer = 0;
    if (!document.body || !isCheckout()) return hide();
    const areas = tipAreas();
    const W = amazonWidget();
    if (!areas.length && !W) return hide();
    const r = readTip(areas);

    if (W) {
      const formOpen = !!(W.input && visible(W.input));
      if (!formOpen && r && r.value === 0) {
        return okBanner(acted ? 'Tip zapped. It’s $0.00.' : 'Tip is $0.00. Nothing to zap.');
      }
      const res = amazonStep(W, r, formOpen);
      if (res && res.fail) return banner('fail', `${res.fail} Fix the tip by hand.`, ['debug', 'report']);
      if (res) {
        acted = true;
        banner('work', 'Zapping the tip…');
        return schedule(1000);
      }
      if (!formOpen && !r && az.applied) return okBanner('Tip zapped. Set to $0.00.');
      if (r && r.value > 0) return banner('fail', `Tip is still ${r.label}. Couldn’t zap it, so fix it by hand.`, ['debug', 'report']);
      if (formOpen && r && r.value === 0) return banner('warn', 'Tip box says $0 but Amazon hasn’t confirmed it. Check the order summary.', ['debug', 'report']);
      return banner('warn', 'Can’t read a tip amount on this page. Eyeball it before you order.', ['debug', 'report']);
    }

    if (r && r.value === 0) {
      waits = 0;
      return okBanner(acted ? 'Tip zapped. It’s $0.00.' : 'Tip is $0.00. Nothing to zap.');
    }
    if (r && r.value > 0 && r.zeroSelected && waits < 8) {
      waits++;
      banner('work', 'No-tip picked. Waiting for Amazon to update the total…');
      return schedule(1000);
    }
    if (actions < MAX_ACTIONS) {
      const did = zapOnce(areas, !!(r && r.value > 0));
      if (did) {
        actions++;
        acted = true;
        lastAction = Date.now();
        banner('work', 'Zapping the tip…');
        return schedule(1000);
      }
    }
    if (Date.now() - lastAction < 4000) {
      banner('work', 'Zapping the tip…');
      return schedule(1000);
    }
    if (!r) return banner('warn', 'Can’t read a tip amount on this page. Eyeball it before you order.', ['debug', 'report']);
    return banner('fail', `Tip is still ${r.label}. Couldn’t zap it, so fix it by hand.`, ['debug', 'report']);
  }

  // The "leave a tip" link only shows after Tip Zapper actually zapped something.
  const okBanner = (msg) => banner('ok', msg, acted ? ['support'] : []);

  // ---------- Place Your Order guard ----------
  // Any non-zero tip, in the order summary OR typed in the tip box, blocks the click.
  function tipOnOrder() {
    const r = readTip(tipAreas());
    const W = amazonWidget();
    let box = null;
    let boxOpen = false;
    if (W && W.input) {
      const v = money(W.input.value);
      if (Number.isFinite(v)) box = v;
      boxOpen = visible(W.input);
    }
    if (r && r.source === 'summary' && r.value > 0) return { label: r.label, where: 'summary' };
    if (box > 0 && (boxOpen || !r || r.source !== 'summary')) return { label: `$${box.toFixed(2)}`, where: 'box' };
    if (r && r.value > 0) return { label: r.label, where: r.source === 'input' ? 'box' : 'summary' };
    return null;
  }

  function zapNow() {
    az.edits = 0;
    az.applies = 0;
    az.applied = false;
    az.appliedAt = 0;
    actions = 0;
    lastAction = 0;
    waits = 0;
    if (timer) clearTimeout(timer);
    timer = 0;
    schedule(50);
  }

  let modalHost = null;
  function closeModal() {
    if (modalHost) modalHost.remove();
    modalHost = null;
  }

  function showModal(hit) {
    if (modalHost && modalHost.isConnected) closeModal();
    modalHost = document.createElement('div');
    modalHost.id = 'tz-modal';
    const sr = modalHost.attachShadow({ mode: 'open' });
    sr.innerHTML = `
      <style>
        .ov{position:fixed;inset:0;z-index:2147483647;background:rgba(15,17,17,.55);display:flex;align-items:center;justify-content:center;padding:16px}
        .card{background:#fff;color:#0f1111;max-width:420px;width:100%;border-radius:14px;border-top:8px solid #c40000;
              box-shadow:0 18px 50px rgba(0,0,0,.35);padding:22px 22px 18px;font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;
              animation:pop .18s ease-out}
        @keyframes pop{from{transform:scale(.94);opacity:0}to{transform:none;opacity:1}}
        .k{font:700 11px Arial,sans-serif;letter-spacing:.12em;color:#c40000;margin-bottom:6px}
        h2{margin:0 0 8px;font-size:22px;line-height:1.2}
        p{margin:0 0 18px;color:#333}
        .amt{font-weight:700;color:#c40000}
        .row{display:flex;gap:10px;flex-wrap:wrap}
        button{font:700 14px Arial,sans-serif;border-radius:9px;padding:10px 16px;cursor:pointer}
        .zap{background:#c40000;color:#fff;border:0;flex:1}
        .any{background:#fff;color:#333;border:1px solid #bbb}
      </style>
      <div class="ov" role="dialog" aria-modal="true" aria-labelledby="tzh">
        <div class="card">
          <div class="k">TIP ZAPPER</div>
          <h2 id="tzh">Hold up. There’s a tip on this order.</h2>
          <p class="msg"></p>
          <div class="row">
            <button class="zap">Zap it to $0</button>
            <button class="any">Order anyway</button>
          </div>
        </div>
      </div>`;
    const msg = sr.querySelector('.msg');
    msg.append(hit.where === 'box' ? 'There’s ' : 'Amazon still has a ');
    const amt = document.createElement('span');
    amt.className = 'amt';
    amt.textContent = hit.label;
    msg.append(amt);
    msg.append(hit.where === 'box'
      ? ' sitting in the tip box. Your order didn’t go through.'
      : ' grocery tip on it. Your order didn’t go through.');
    sr.querySelector('.zap').onclick = () => {
      closeModal();
      log.push('popup: Zap it to $0');
      zapNow();
    };
    sr.querySelector('.any').onclick = () => {
      closeModal();
      override = true;
      log.push('popup: Order anyway');
      lastKey = '';
      dismissedKey = '';
      banner('warn', 'Guard off for this page. Click Place your order again.');
    };
    sr.querySelector('.ov').addEventListener('click', (ev) => { if (ev.target === ev.currentTarget) closeModal(); });
    modalHost.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeModal(); });
    document.documentElement.appendChild(modalHost);
    sr.querySelector('.zap').focus();
  }

  function guard(e, target) {
    if (override) return;
    const el = target || e.target;
    if (!el || !el.closest) return;
    const b = el.closest('input, button, a, [role="button"], .a-button');
    if (!b || !isPlaceOrder(b) || !isCheckout()) return;
    const hit = tipOnOrder();
    if (hit) {
      e.preventDefault();
      e.stopImmediatePropagation();
      log.push(`blocked Place your order (tip ${hit.label} in ${hit.where})`);
      showModal(hit);
    }
  }
  window.addEventListener('click', (e) => guard(e), true);
  window.addEventListener('submit', (e) => { if (e.submitter) guard(e, e.submitter); }, true);

  new MutationObserver((muts) => {
    const onlyBanner = muts.every(
      (m) => m.type === 'childList' && [...m.addedNodes, ...m.removedNodes].length > 0 &&
        [...m.addedNodes, ...m.removedNodes].every((n) => n.id === 'tz-banner' || n.id === 'tz-modal')
    );
    if (!onlyBanner) schedule(800);
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'aria-checked', 'aria-pressed', 'aria-selected', 'hidden', 'style', 'value'],
  });
  window.addEventListener('pageshow', () => schedule(300));
  schedule(300);
})();
