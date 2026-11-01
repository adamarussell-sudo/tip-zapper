// Runs extension/content.js against mock checkout pages in jsdom.
// Usage: npm test
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { PLACE, realSummary, wireRealWidget, wirePlaceOrder } = require('./fixtures');

const SCRIPT = fs.readFileSync(path.join(__dirname, '..', 'extension', 'content.js'), 'utf8');
const SETTLE_MS = 9000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CHECKOUT = 'https://www.amazon.com/checkout/p/p-000-0000000-0000000/spc';

// jsdom has no innerText; mimic the browser (hidden elements contribute no text).
function polyInnerText(w) {
  const hidden = (el) => el.hidden || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(el.tagName) || w.getComputedStyle(el).display === 'none';
  const walk = (n) => {
    if (n.nodeType === 3) return n.nodeValue;
    if (n.nodeType !== 1 || hidden(n)) return '';
    let s = '';
    for (const c of n.childNodes) s += walk(c) + (c.nodeType === 1 ? ' ' : '');
    return s;
  };
  Object.defineProperty(w.HTMLElement.prototype, 'innerText', {
    configurable: true,
    get() { return hidden(this) ? this.textContent : walk(this); },
  });
}

const modal = (w) => w.document.getElementById('tz-modal');
const badge = (w) => w.document.getElementById('tz-banner');
const badgeText = (w) => (badge(w) ? badge(w).shadowRoot.querySelector('.m').textContent : '');
const badgeButtons = (w) => (badge(w) ? [...badge(w).shadowRoot.querySelectorAll('button')].map((b) => b.textContent) : []);
const supportLink = (w) => (badge(w) ? badge(w).shadowRoot.querySelector('a.s') : null);

const SUMMARY = (tip) => `<div id="summary"><h3>Order Summary</h3>
  <div class="a-row"><span>Items:</span><span>$42.10</span></div>
  <div class="a-row"><span>Service fee:</span><span>$9.95</span></div>
  <div class="a-row" id="tiprow"><div class="a-column"><span>Tip:</span></div><div class="a-column"><span id="tipval">${tip}</span></div></div>
  <div class="a-row"><span>Order total:</span><span>$57.05</span></div></div>`;
const ABTN = (label, extra = '') => `<span class="a-button ${extra}" data-label="${label}"><span class="a-button-inner">
  <input class="a-button-input" type="submit"><span class="a-button-text">${label}</span></span></span>`;

const scenarios = [
  {
    name: 'REAL 1. Amazon tip widget, $5.00 in the summary row: one Edit, one Apply, $0',
    url: CHECKOUT,
    html: `${PLACE}${realSummary('$5.00')}`,
    wire(w) { wirePlaceOrder(w); wireRealWidget(w, 5); },
    expect: (w) => ({
      tipIsZero: w.tip === 0,
      summarySaysZero: w.document.getElementById('tipval').textContent === '$0.00',
      oneEdit: w.edits === 1,
      oneApply: w.applies === 1,
      popoverUntouched: !w.popover,
      notOrdered: !w.ordered,
      greenBadge: /Tip zapped/.test(badgeText(w)),
      supportLinkShown: !!supportLink(w) && supportLink(w).href === 'https://6foot5.com/tip-zapper/',
    }),
  },
  {
    name: 'REAL 2. Amazon tip widget, amount not shown anywhere (blind mode)',
    url: CHECKOUT,
    html: `${PLACE}${realSummary(null)}`,
    wire(w) { wirePlaceOrder(w); wireRealWidget(w, 5); },
    expect: (w) => ({ tipIsZero: w.tip === 0, oneEdit: w.edits === 1, oneApply: w.applies === 1, notOrdered: !w.ordered }),
  },
  {
    name: 'REAL 3. Already $0.00: touches nothing, no support link',
    url: CHECKOUT,
    html: `${PLACE}${realSummary('$0.00')}`,
    wire(w) { wirePlaceOrder(w); wireRealWidget(w, 0); },
    expect: (w) => ({ noEdits: w.edits === 0, noApplies: w.applies === 0, saysNothingToZap: /Nothing to zap/.test(badgeText(w)), noSupportLink: !supportLink(w) }),
  },
  {
    name: 'REAL 4. Early Place your order click: popup, then "Zap it to $0" works',
    url: CHECKOUT,
    html: `${PLACE}${realSummary('$5.00')}`,
    wire(w) { wirePlaceOrder(w); wireRealWidget(w, 5); },
    soon(w) {
      w.document.getElementById('submitOrderButtonId').click();
      const m = modal(w);
      w.blockedEarly = !w.ordered;
      w.popupText = m ? m.shadowRoot.querySelector('.msg').textContent : '';
      if (m) m.shadowRoot.querySelector('.zap').click();
      w.popupClosedAfterZap = !modal(w);
    },
    expect: (w) => ({ earlyClickBlocked: w.blockedEarly === true, popupSays5: /\$5\.00 grocery tip/.test(w.popupText), popupClosed: w.popupClosedAfterZap, tipIsZero: w.tip === 0, notOrdered: !w.ordered }),
  },
  {
    name: 'REAL 5. Summary $0 but $3 typed in the open tip box: popup, "Order anyway" releases',
    url: CHECKOUT,
    html: `${PLACE}${realSummary('$0.00')}`,
    wire(w) { wirePlaceOrder(w); wireRealWidget(w, 0); },
    soon(w) {
      const d = w.document;
      d.getElementById('editLink').click();
      d.getElementById('tip-widget--edit-form--amount-input').value = '3';
      d.getElementById('submitOrderButtonId').click();
      const m = modal(w);
      w.blocked = !w.ordered && !!m;
      w.popupText = m ? m.shadowRoot.querySelector('.msg').textContent : '';
      m.shadowRoot.querySelector('.any').click();
      d.getElementById('submitOrderButtonId').click();
      w.orderAnyway = w.ordered;
    },
    expect: (w) => ({ blocked: w.blocked, popupSaysTipBox3: /\$3\.00 sitting in the tip box/.test(w.popupText), orderAnywayWorks: w.orderAnyway }),
  },
  {
    name: 'REAL 6. Tip already $0: Place your order goes straight through',
    url: CHECKOUT,
    html: `${PLACE}${realSummary('$0.00')}`,
    wire(w) { wirePlaceOrder(w); wireRealWidget(w, 0); },
    soon(w) { w.document.getElementById('submitOrderButtonId').click(); w.noPopup = !modal(w); },
    expect: (w) => ({ ordered: w.ordered, noPopup: w.noPopup }),
  },
  {
    name: 'A. Summary row + "Edit tip" link opening a modal with Update',
    url: 'https://www.amazon.com/gp/buy/spc/handlers/display.html',
    html: `<div id="left"><h2>Delivery address</h2><p>123 Main St</p><a href="#" id="addrChange">Change</a></div>
      <div id="right">${PLACE}${SUMMARY('$5.00')}<a href="#" id="editTip">Edit tip</a></div>`,
    wire(w) {
      const d = w.document;
      wirePlaceOrder(w);
      w.addrClicked = false;
      d.getElementById('addrChange').addEventListener('click', (e) => { e.preventDefault(); w.addrClicked = true; });
      d.getElementById('editTip').addEventListener('click', (e) => {
        e.preventDefault();
        const m = d.createElement('div');
        m.setAttribute('role', 'dialog');
        m.className = 'a-popover';
        m.innerHTML = `<h4>Edit driver tip</h4><p>100% of tips go to your driver.</p><input id="tipin" type="text" value="5.00">${ABTN('Update')}`;
        d.body.appendChild(m);
        m.querySelector('.a-button-input').addEventListener('click', () => {
          const v = Number(d.getElementById('tipin').value);
          setTimeout(() => { d.getElementById('tipval').textContent = `$${v.toFixed(2)}`; m.remove(); }, 200);
        });
      });
    },
    expect: (w) => ({ tip: w.document.getElementById('tipval').textContent === '$0.00', notOrdered: !w.ordered, addressUntouched: !w.addrClicked }),
  },
  {
    name: 'B. Preset buttons $5/$7/$10/Other; Other opens a box + Apply',
    url: 'https://www.amazon.com/checkout/p/p-123/spc',
    html: `<div id="tipsec"><h3>Add a tip for your driver</h3><p>100% of tips go to drivers.</p>
      ${ABTN('$5', 'a-button-selected')}${ABTN('$7')}${ABTN('$10')}${ABTN('Other')}</div>${PLACE}${SUMMARY('$5.00')}`,
    wire(w) {
      const d = w.document;
      wirePlaceOrder(w);
      const sel = (label) => d.querySelectorAll('#tipsec .a-button').forEach((b) => b.classList.toggle('a-button-selected', b.dataset.label === label));
      d.querySelectorAll('#tipsec .a-button').forEach((b) => {
        b.querySelector('input').addEventListener('click', () => {
          const label = b.dataset.label;
          if (label === 'Other') {
            if (d.getElementById('custom')) return;
            const box = d.createElement('div');
            box.id = 'custom';
            box.innerHTML = `<input type="text" placeholder="Enter amount" id="customAmt">${ABTN('Apply')}`;
            d.getElementById('tipsec').appendChild(box);
            box.querySelector('.a-button-input').addEventListener('click', () => {
              const v = Number(d.getElementById('customAmt').value || 'NaN');
              setTimeout(() => { sel('Other'); d.getElementById('tipval').textContent = `$${v.toFixed(2)}`; }, 300);
            });
          } else {
            sel(label);
            d.getElementById('tipval').textContent = `$${Number(label.slice(1)).toFixed(2)}`;
          }
        });
      });
    },
    expect: (w) => ({ tip: w.document.getElementById('tipval').textContent === '$0.00', notOrdered: !w.ordered }),
  },
  {
    name: 'C. Presets include "No tip" (summary updates slowly, 1.5s)',
    url: 'https://www.amazon.com/gp/buy/spc/handlers/display.html',
    html: `<div id="tipsec"><h3>Driver tip</h3>${ABTN('No tip')}${ABTN('$5', 'a-button-selected')}${ABTN('$8')}${ABTN('Other')}</div>${PLACE}${SUMMARY('$5.00')}`,
    wire(w) {
      const d = w.document;
      wirePlaceOrder(w);
      w.otherClicked = false;
      d.querySelectorAll('#tipsec .a-button').forEach((b) => {
        b.querySelector('input').addEventListener('click', () => {
          if (b.dataset.label === 'Other') { w.otherClicked = true; return; }
          d.querySelectorAll('#tipsec .a-button').forEach((x) => x.classList.toggle('a-button-selected', x === b));
          const v = b.dataset.label === 'No tip' ? 0 : Number(b.dataset.label.slice(1));
          setTimeout(() => { d.getElementById('tipval').textContent = `$${v.toFixed(2)}`; }, 1500);
        });
      });
    },
    expect: (w) => ({ tip: w.document.getElementById('tipval').textContent === '$0.00', didNotOpenOther: !w.otherClicked, notOrdered: !w.ordered }),
  },
  {
    name: 'D. Plain tip input with a Save button; promo code box left alone',
    url: 'https://www.amazon.com/gp/buy/shipoptionselect/handlers/display.html',
    html: `<div class="tip-module"><label for="tipAmount">Driver tip</label><input id="tipAmount" type="text" value="5.00"><button id="save">Save</button></div>
      <div><label for="promo">Gift card or promo code</label><input id="promo" type="text" value=""><button id="applyPromo">Apply</button></div>`,
    wire(w) {
      const d = w.document;
      w.saved = null;
      w.promoApplied = false;
      d.getElementById('save').addEventListener('click', () => { w.saved = d.getElementById('tipAmount').value; });
      d.getElementById('applyPromo').addEventListener('click', () => { w.promoApplied = true; });
    },
    expect: (w) => ({ savedZero: w.saved === '0', promoUntouched: !w.promoApplied && w.document.getElementById('promo').value === '' }),
  },
  {
    name: 'E. Radio buttons ($5 checked, $0 option)',
    url: 'https://www.amazon.com/gp/buy/spc/handlers/display.html',
    html: `<fieldset id="tipset"><legend>Tip your driver</legend>
      <label><input type="radio" name="tip" value="5" checked> $5</label>
      <label><input type="radio" name="tip" value="0"> $0</label>
      <label><input type="radio" name="tip" value="10"> $10</label></fieldset>${PLACE}${SUMMARY('$5.00')}`,
    wire(w) {
      const d = w.document;
      wirePlaceOrder(w);
      d.querySelectorAll('input[name=tip]').forEach((r) => r.addEventListener('change', () => {
        d.getElementById('tipval').textContent = `$${Number(r.value).toFixed(2)}`;
      }));
    },
    expect: (w) => ({ tip: w.document.getElementById('tipval').textContent === '$0.00', notOrdered: !w.ordered }),
  },
  {
    name: 'F. Unfixable (summary only): red badge with Report button, popup blocks, "Order anyway" releases',
    url: 'https://www.amazon.com/gp/buy/spc/handlers/display.html',
    html: `${PLACE}${SUMMARY('$5.00')}`,
    wire: wirePlaceOrder,
    async after(w) {
      const redBefore = /still \$5\.00/.test(badgeText(w));
      const hasReport = badgeButtons(w).includes('Report it') && badgeButtons(w).includes('Copy debug info');
      w.document.getElementById('submitOrderButtonId').click();
      const m = modal(w);
      const blocked = !w.ordered && !!m && /\$5\.00/.test(m.shadowRoot.querySelector('.msg').textContent);
      m.shadowRoot.querySelector('.any').click();
      const closed = !modal(w);
      w.document.getElementById('submitOrderButtonId').click();
      return { redBadgeBeforeClick: redBefore, reportButtons: hasReport, popupBlocksClick: blocked, popupCloses: closed, orderAnywayWorks: w.ordered };
    },
  },
  {
    name: 'G. Already $0 ("No tip" selected): touches nothing, badge green',
    url: 'https://www.amazon.com/gp/buy/spc/handlers/display.html',
    html: `<div id="tipsec"><h3>Driver tip</h3>${ABTN('No tip', 'a-button-selected')}${ABTN('$5')}${ABTN('Other')}</div>${PLACE}${SUMMARY('$0.00')}`,
    wire(w) {
      wirePlaceOrder(w);
      w.clicks = 0;
      w.document.querySelectorAll('#tipsec input').forEach((i) => i.addEventListener('click', () => { w.clicks++; }));
    },
    async after(w) {
      const green = /\$0\.00/.test(badgeText(w));
      w.document.getElementById('submitOrderButtonId').click();
      return { noClicks: w.clicks === 0, green, orderGoesThrough: w.ordered };
    },
  },
  {
    name: 'H. Product page with "Pro tip" in reviews: stays silent',
    url: 'https://www.amazon.com/dp/B000123/',
    html: `<div id="reviews"><p>Pro tip: soak the beans overnight.</p><a href="#" id="edit">Edit</a><div class="a-row"><span>Tip:</span><span>$5.00</span></div></div>`,
    wire(w) {
      w.editClicked = false;
      w.document.getElementById('edit').addEventListener('click', () => { w.editClicked = true; });
    },
    expect: (w) => ({ noBanner: !badge(w), nothingClicked: !w.editClicked }),
  },
];

async function runScenario(s) {
  const dom = new JSDOM(`<!doctype html><html><body>${s.html}</body></html>`, { url: s.url, runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  polyInnerText(w);
  s.wire(w);
  w.eval(SCRIPT);
  if (s.soon) { await sleep(150); s.soon(w); }
  await sleep(SETTLE_MS);
  const res = s.after ? await s.after(w) : s.expect(w);
  const out = { name: s.name, res, ok: Object.values(res).every(Boolean), badge: badgeText(w) || '(no badge)' };
  w.close();
  return out;
}

(async () => {
  const results = await Promise.all(scenarios.map(runScenario));
  let fails = 0;
  for (const r of results) {
    if (!r.ok) fails++;
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`);
    if (!r.ok || process.env.VERBOSE) {
      console.log(`      checks: ${JSON.stringify(r.res)}`);
      console.log(`      badge:  ${r.badge}`);
    }
  }
  console.log(fails ? `\n${fails} of ${results.length} scenarios failed` : `\nAll ${results.length} scenarios passed`);
  process.exit(fails ? 1 : 0);
})();
