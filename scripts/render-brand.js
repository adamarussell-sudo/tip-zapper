// Renders every brand and store image from brand/*.svg and mock pages that run
// the real extension/content.js. Re-run after changing the icon or the badge.
//
// Needs Playwright with Chromium (not a regular dependency, it's large):
//   npm i --no-save playwright && npx playwright install chromium
//   npm run brand
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { PLACE, REAL_WIDGET, wireRealWidget } = require('../tests/fixtures');

const ROOT = path.join(__dirname, '..');
const OUT = {
  icons: path.join(ROOT, 'extension', 'icons'),
  store: path.join(ROOT, 'store', 'images'),
  docs: path.join(ROOT, 'docs', 'images'),
};
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tz-brand-'));
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'extension', 'manifest.json'), 'utf8')).version;
const CONTENT_JS = fs.readFileSync(path.join(ROOT, 'extension', 'content.js'), 'utf8');
const ICON = fs.readFileSync(path.join(ROOT, 'brand', 'icon.svg'), 'utf8');
const ICON_SMALL = fs.readFileSync(path.join(ROOT, 'brand', 'icon-small.svg'), 'utf8');

// 6foot5.com palette (from the Six Foot Five theme)
const C = { lake: '#1E4B57', mustard: '#E0A53B', cream: '#F0E2C4', ink: '#22201C', rust: '#A8481F', rule: '#CDBB94', paper: '#F7EEDB', muted: '#4A443A' };

const fontUrl = (pkg, file) => 'file://' + require.resolve(`@fontsource/${pkg}/files/${file}`);
const FONTS = `
  @font-face{font-family:Oswald;font-weight:500;src:url(${fontUrl('oswald', 'oswald-latin-500-normal.woff2')})}
  @font-face{font-family:Oswald;font-weight:600;src:url(${fontUrl('oswald', 'oswald-latin-600-normal.woff2')})}
  @font-face{font-family:Oswald;font-weight:700;src:url(${fontUrl('oswald', 'oswald-latin-700-normal.woff2')})}
  @font-face{font-family:Bitter;font-weight:400;src:url(${fontUrl('bitter', 'bitter-latin-400-normal.woff2')})}
  @font-face{font-family:Bitter;font-weight:400;font-style:italic;src:url(${fontUrl('bitter', 'bitter-latin-400-italic.woff2')})}
  @font-face{font-family:Bitter;font-weight:700;src:url(${fontUrl('bitter', 'bitter-latin-700-normal.woff2')})}`;

const svgData = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const fileUrl = (p) => 'file://' + p;

let browser;

async function shot(html, { width, height, out, transparent = false, prep }) {
  const file = path.join(TMP, `${path.basename(out, '.png')}.html`);
  fs.writeFileSync(file, `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}
    html,body{margin:0;padding:0}${transparent ? 'html,body{background:transparent}' : ''}</style></head><body>${html}</body></html>`);
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(fileUrl(file));
  await page.evaluate(() => document.fonts.ready);
  if (prep) await prep(page);
  await page.waitForTimeout(150);
  await page.screenshot({ path: out, omitBackground: transparent });
  await page.close();
  console.log('wrote', path.relative(ROOT, out));
}

// ---------- icons ----------
async function icons() {
  const img = (svg, size, pad = 0) =>
    `<img src="${svgData(svg)}" style="display:block;width:${size - 2 * pad}px;height:${size - 2 * pad}px;margin:${pad}px">`;
  await shot(img(ICON_SMALL, 16), { width: 16, height: 16, out: path.join(OUT.icons, 'icon16.png'), transparent: true });
  await shot(img(ICON, 32), { width: 32, height: 32, out: path.join(OUT.icons, 'icon32.png'), transparent: true });
  await shot(img(ICON, 48), { width: 48, height: 48, out: path.join(OUT.icons, 'icon48.png'), transparent: true });
  // Chrome Web Store: 128x128 with the art at 96x96 and 16px transparent padding
  await shot(img(ICON, 128, 16), { width: 128, height: 128, out: path.join(OUT.icons, 'icon128.png'), transparent: true });
  fs.copyFileSync(path.join(OUT.icons, 'icon128.png'), path.join(OUT.store, 'icon-128.png'));
  await shot(img(ICON, 512), { width: 512, height: 512, out: path.join(OUT.docs, 'icon-512.png'), transparent: true });
}

// ---------- wordmark pieces ----------
const wordmark = (size) =>
  `<div style="font:700 ${size}px/0.95 Oswald;letter-spacing:.035em;color:${C.cream};text-transform:uppercase">Tip Zapper</div>`;
const kicker = (text, size = 16, color = C.mustard) =>
  `<div style="font:500 ${size}px/1 Oswald;letter-spacing:.16em;color:${color};text-transform:uppercase">${text}</div>`;

async function banners() {
  const iconImg = (s) => `<img src="${svgData(ICON)}" style="width:${s}px;height:${s}px;display:block">`;
  // README hero + GitHub social preview (1280x640)
  await shot(`
    <div style="width:1280px;height:640px;background:${C.lake};position:relative;overflow:hidden">
      <div style="position:absolute;left:0;right:0;bottom:0;height:10px;background:${C.mustard}"></div>
      <div style="position:absolute;left:110px;top:200px">${iconImg(220)}</div>
      <div style="position:absolute;left:380px;top:206px;right:80px">
        ${kicker('Free browser extension')}
        <div style="height:18px"></div>
        ${wordmark(112)}
        <div style="font:400 28px/1.4 Bitter;color:${C.cream};opacity:.9;margin-top:22px;max-width:760px">
          The pre-filled grocery tip on Amazon checkout, set back to $0. Tipping becomes your call instead of a default you have to catch.</div>
      </div>
      <div style="position:absolute;right:56px;bottom:34px">${kicker('A 6foot5.com project', 14, 'rgba(240,226,196,.65)')}</div>
    </div>`, { width: 1280, height: 640, out: path.join(OUT.docs, 'banner.png') });

  // Chrome Web Store small promo tile (440x280)
  await shot(`
    <div style="width:440px;height:280px;background:${C.lake};position:relative;overflow:hidden">
      <div style="position:absolute;left:0;right:0;bottom:0;height:6px;background:${C.mustard}"></div>
      <div style="position:absolute;left:34px;top:62px">${iconImg(96)}</div>
      <div style="position:absolute;left:150px;top:66px;right:24px">
        ${wordmark(46)}
        <div style="font:400 16px/1.4 Bitter;color:${C.cream};opacity:.9;margin-top:12px">The pre-filled grocery tip,<br>back to $0.</div>
      </div>
    </div>`, { width: 440, height: 280, out: path.join(OUT.store, 'promo-small-440x280.png') });

  // Chrome Web Store marquee promo tile (1400x560)
  await shot(`
    <div style="width:1400px;height:560px;background:${C.lake};position:relative;overflow:hidden">
      <div style="position:absolute;left:0;right:0;bottom:0;height:10px;background:${C.mustard}"></div>
      <div style="position:absolute;left:150px;top:150px">${iconImg(250)}</div>
      <div style="position:absolute;left:470px;top:170px;right:100px">
        ${kicker('Free browser extension', 18)}
        <div style="height:20px"></div>
        ${wordmark(120)}
        <div style="font:400 30px/1.4 Bitter;color:${C.cream};opacity:.9;margin-top:22px">The pre-filled grocery tip on Amazon checkout, set back to $0.</div>
      </div>
    </div>`, { width: 1400, height: 560, out: path.join(OUT.store, 'promo-marquee-1400x560.png') });
}

// ---------- a generic checkout page running the real extension ----------
const ITEMS = [
  ['Organic bananas, 2 lb', '1.98'], ['Sourdough loaf', '5.49'], ['Large brown eggs, dozen', '4.29'],
  ['Whole bean coffee, 12 oz', '11.99'], ['Baby spinach, 10 oz', '4.99'], ['Atlantic salmon fillet', '13.36'],
]; // items add up to $42.10
const CHECKOUT_CSS = `
  body{margin:0;background:#fff;color:#1d1d1d;font:14px/1.45 Inter,Arial,sans-serif}
  header{height:54px;background:#eef1f2;border-bottom:1px solid #d9dfe1;display:flex;align-items:center;padding:0 28px;font-weight:600;font-size:19px;color:#222}
  header span{font-weight:400;color:#777;margin-left:8px;font-size:15px}
  main{display:flex;gap:26px;padding:22px 28px}
  .card{border:1px solid #d9dfe1;border-radius:8px;padding:16px 18px;margin-bottom:16px;background:#fff}
  .card h4{margin:0 0 8px;font-size:16px}
  .item{display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid #f0f0f0}
  .item:first-of-type{border-top:0}
  aside{width:330px;flex:none}
  .a-button{position:relative;display:block}
  .a-button-input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;margin:0}
  #placeBtn .a-button-text{display:block;background:${C.mustard};color:#1d1d1d;text-align:center;padding:9px;border-radius:20px;font-weight:600}
  .fine{font-size:11.5px;color:#666;margin:10px 0 12px;line-height:1.35}
  #summary h3{margin:0 0 8px;font-size:17px}
  #summary .a-row{display:flex;justify-content:space-between;align-items:flex-start;padding:3px 0}
  #summary .a-span7{flex:1}
  .tip-widget--line-item{display:flex;gap:6px;align-items:baseline}
  .a-icon-info{display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;border:1.5px solid #8a8a8a;border-radius:50%;margin-right:2px;font:italic 700 9px Georgia,serif;color:#8a8a8a;transform:translateY(1px)}
  .a-icon-info::after{content:'i'}
  .a-link-normal{color:${C.lake};text-decoration:none}
  .tip-widget--edit-form{font-size:12px;margin-top:6px}
  .tip-widget--edit-form .a-row{padding:2px 0}
  .tip-widget--edit-form input[type=number]{width:70px}
  #totalrow{border-top:1px solid #ddd;margin-top:6px;padding-top:8px !important;font-weight:700;color:#b12704;font-size:16px}`;

function checkoutPage(tip) {
  return `<style>${CHECKOUT_CSS}</style>
    <header>Checkout <span>(6 items)</span></header>
    <main>
      <section style="flex:1">
        <div class="card"><h4>Delivery window</h4><div>Today, 4 PM – 6 PM · Doorstep delivery</div></div>
        <div class="card"><h4>Items</h4>${ITEMS.map(([n, p]) => `<div class="item"><span>${n}</span><span>$${p}</span></div>`).join('')}</div>
      </section>
      <aside><div class="card">
        ${PLACE}
        <p class="fine">By placing your order, you agree to the store's privacy notice and conditions of use.</p>
        <div id="summary"><h3>Order Summary</h3>
          <div class="a-row"><div class="a-column a-span7">Items:</div><div class="a-column a-span5">$42.10</div></div>
          <div class="a-row"><div class="a-column a-span7">Service fee:</div><div class="a-column a-span5">$9.95</div></div>
          <div class="a-row" id="tiprow"><div class="a-column a-span7">${REAL_WIDGET}</div>
            <div class="a-column a-span5 a-text-right"><span id="tipval">$${tip.toFixed(2)}</span></div></div>
          <div class="a-row" id="totalrow"><div class="a-column a-span7">Order total:</div><div class="a-column a-span5" id="total">$${(52.05 + tip).toFixed(2)}</div></div>
        </div>
      </div></aside>
    </main>`;
}

async function bootExtension(page, tip) {
  await page.evaluate(({ src, tip }) => {
    // eslint-disable-next-line no-eval
    (0, eval)(`(${src})`)(window, tip);
    new MutationObserver(() => {
      const t = parseFloat(document.getElementById('tipval').textContent.replace('$', ''));
      document.getElementById('total').textContent = `$${(52.05 + t).toFixed(2)}`;
    }).observe(document.getElementById('tipval'), { childList: true, characterData: true, subtree: true });
  }, { src: wireRealWidget.toString(), tip });
  await page.addScriptTag({ content: CONTENT_JS });
}

async function scene(name, tip, { width = 1120, height = 564, action, settle }) {
  const file = path.join(TMP, `scene-${name}.html`);
  fs.writeFileSync(file, `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}</style></head><body>${checkoutPage(tip)}</body></html>`);
  const page = await browser.newPage({ viewport: { width, height } });
  await page.addInitScript((v) => {
    window.chrome = window.chrome || {};
    window.chrome.runtime = { getManifest: () => ({ version: v }) };
  }, VERSION);
  await page.goto(fileUrl(file));
  await page.evaluate(() => document.fonts.ready);
  await bootExtension(page, tip);
  if (action) await action(page);
  await settle(page);
  const out = path.join(TMP, `scene-${name}.png`);
  await page.screenshot({ path: out });
  return { page, out };
}

const badgeText = (page) => page.evaluate(() => {
  const h = document.getElementById('tz-banner');
  return h ? h.shadowRoot.querySelector('.m').textContent : '';
});
async function waitBadge(page, re, ms = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (re.test(await badgeText(page))) return;
    await page.waitForTimeout(200);
  }
  throw new Error(`badge never matched ${re}; last: "${await badgeText(page)}"`);
}
// Crops the badge on a transparent background (hides the page behind it).
async function cropBadge(page, out) {
  const r = await page.evaluate(() => {
    document.body.style.visibility = 'hidden';
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    const b = document.getElementById('tz-banner').shadowRoot.querySelector('.b').getBoundingClientRect();
    return { x: b.x, y: b.y, width: b.width, height: b.height };
  });
  const pad = 14;
  await page.screenshot({ path: out, omitBackground: true, clip: { x: r.x - pad, y: r.y - pad, width: r.width + 2 * pad, height: r.height + 2 * pad } });
}

function frame(headline, sub, sceneFile, url = 'amazon.com/checkout') {
  return `
    <div style="width:1280px;height:800px;background:${C.lake};position:relative;overflow:hidden">
      <div style="position:absolute;left:80px;top:50px;right:80px">
        <div style="font:600 46px/1.08 Oswald;color:${C.cream};letter-spacing:.01em">${headline}</div>
        <div style="font:400 20px/1.45 Bitter;color:${C.cream};opacity:.85;margin-top:12px;max-width:1000px">${sub}</div>
      </div>
      <div style="position:absolute;left:80px;top:196px;width:1120px;border-radius:12px 12px 0 0;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.4)">
        <div style="height:40px;background:#E9E4D8;display:flex;align-items:center;gap:8px;padding:0 14px">
          <span style="width:12px;height:12px;border-radius:50%;background:#cfc6b4"></span>
          <span style="width:12px;height:12px;border-radius:50%;background:#cfc6b4"></span>
          <span style="width:12px;height:12px;border-radius:50%;background:#cfc6b4"></span>
          <span style="margin-left:18px;background:#fff;border-radius:14px;padding:4px 16px;font:13px Arial,sans-serif;color:#666;width:420px">${url}</span>
        </div>
        <img src="${fileUrl(sceneFile)}" style="display:block;width:1120px;height:564px">
      </div>
    </div>`;
}

async function screenshots() {
  // 1. Zapped
  const z = await scene('zapped', 5, { settle: (p) => waitBadge(p, /Tip zapped/) });
  await cropBadge(z.page, path.join(TMP, 'badge-ok.png')); // after the scene shot: it hides the page
  await z.page.close();
  await shot(frame('The pre-filled tip, back to $0. Automatically.',
    'Tip Zapper opens the tip box, types 0 and hits Apply before you’ve scrolled down. A green badge tells you it’s done.', z.out),
  { width: 1280, height: 800, out: path.join(OUT.store, 'screenshot-1-zapped.png') });

  // 2. Guard popup (clicked before the zap runs)
  const g = await scene('guard', 5, {
    action: (p) => p.evaluate(() => document.getElementById('submitOrderButtonId').click()),
    settle: (p) => p.waitForTimeout(120),
  });
  const card = await g.page.evaluate(() => {
    const r = document.getElementById('tz-modal').shadowRoot.querySelector('.card').getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  await g.page.screenshot({ path: path.join(OUT.docs, 'popup.png'), clip: { x: card.x - 20, y: card.y - 20, width: card.width + 40, height: card.height + 40 } });
  console.log('wrote', path.relative(ROOT, path.join(OUT.docs, 'popup.png')));
  await g.page.close();
  await shot(frame('Tip still on? It stops the order and asks.',
    'Click Place your order with a tip showing, in the summary or typed in the tip box, and Tip Zapper holds the click until you decide.', g.out),
  { width: 1280, height: 800, out: path.join(OUT.store, 'screenshot-2-guard.png') });

  // Badge states for the docs: couldn't zap (no way to edit), can't read
  const badgePage = async (name, html, re) => {
    const file = path.join(TMP, `badge-${name}.html`);
    fs.writeFileSync(file, `<!doctype html><html><body style="background:#fff;margin:0">${html}</body></html>`);
    const page = await browser.newPage({ viewport: { width: 700, height: 260 } });
    await page.addInitScript((v) => { window.chrome = window.chrome || {}; window.chrome.runtime = { getManifest: () => ({ version: v }) }; }, VERSION);
    await page.goto(fileUrl(file));
    await page.addScriptTag({ content: CONTENT_JS });
    await waitBadge(page, re);
    await cropBadge(page, path.join(TMP, `badge-${name}.png`));
    await page.close();
  };
  await badgePage('fail', `${PLACE}<div class="a-row"><span>Tip:</span> <span>$5.00</span></div>`, /still \$5\.00/);
  await badgePage('warn', `${PLACE}${REAL_WIDGET.replace(/<a class="a-link-normal tip-widget--edit-control" id="editLink"[\s\S]*?<\/a>/, '')}`, /Can’t read/);

  const cell = (img, label, note, color = C.ink, noteColor = C.muted) => `
    <div style="flex:1;display:flex;flex-direction:column;align-items:flex-start;gap:8px">
      <img src="${fileUrl(img)}" style="display:block;max-width:380px;margin:-14px 0 0 -14px">
      ${kicker(label, 15, color)}
      <div style="font:400 14px/1.45 Bitter;color:${noteColor};max-width:350px">${note}</div>
    </div>`;
  const BADGES = [
    ['badge-ok.png', 'Zapped', 'The tip is $0.00. The little link is the tip jar. It starts at $0 too.'],
    ['badge-warn.png', 'Can’t read it', 'The page doesn’t match any layout Tip Zapper knows. Check the tip yourself.'],
    ['badge-fail.png', 'Couldn’t zap it', 'A tip is on and Tip Zapper can’t change it. Fix it by hand, then report it.'],
  ];
  await shot(`
    <div style="width:1280px;height:250px;background:${C.cream};display:flex;gap:32px;padding:40px 44px 0;box-sizing:border-box;align-items:flex-start">
      ${BADGES.map(([f, l, n]) => cell(path.join(TMP, f), l, n)).join('')}
    </div>`, { width: 1280, height: 250, out: path.join(OUT.docs, 'badge-states.png') });

  // 3. Quiet by design
  const point = (title, body) => `
    <div style="flex:1;background:${C.cream};border-radius:4px;padding:26px 26px 24px;border-top:6px solid ${C.mustard}">
      <div style="font:600 26px/1.1 Oswald;color:${C.ink}">${title}</div>
      <div style="font:400 17px/1.5 Bitter;color:${C.muted};margin-top:12px">${body}</div>
    </div>`;
  await shot(`
    <div style="width:1280px;height:800px;background:${C.lake};position:relative;overflow:hidden">
      <div style="position:absolute;left:80px;top:50px;right:80px">
        <div style="font:600 46px/1.08 Oswald;color:${C.cream}">Quiet by design.</div>
        <div style="font:400 20px/1.45 Bitter;color:${C.cream};opacity:.85;margin-top:12px">No account, no tracking, no network requests. It runs on Amazon’s checkout pages and nowhere else.</div>
      </div>
      <div style="position:absolute;left:80px;right:80px;top:200px;display:flex;gap:24px">
        ${point('Zaps the tip', 'Finds the pre-filled grocery tip, opens the box, types 0 and hits Apply. Already $0? It leaves it alone.')}
        ${point('Guards the button', 'If a tip is still showing when you click Place your order, the click waits and a popup asks what you want to do.')}
        ${point('Keeps to itself', 'Nothing is collected, stored or sent anywhere. It never clicks Place your order. That click stays yours.')}
      </div>
      <div style="position:absolute;left:80px;top:432px">${kicker('What you’ll see in the corner', 16)}</div>
      <div style="position:absolute;left:80px;right:80px;top:478px;display:flex;gap:32px;align-items:flex-start">
        ${BADGES.map(([f, l, n]) => cell(path.join(TMP, f), l, n, C.cream, 'rgba(240,226,196,.78)')).join('')}
      </div>
      <div style="position:absolute;left:80px;bottom:40px">${kicker('Open source · MIT license · github.com/adamarussell-sudo/tip-zapper', 15, 'rgba(240,226,196,.7)')}</div>
    </div>`, { width: 1280, height: 800, out: path.join(OUT.store, 'screenshot-3-quiet.png') });
}

(async () => {
  for (const d of Object.values(OUT)) fs.mkdirSync(d, { recursive: true });
  browser = await chromium.launch();
  try {
    await icons();
    await banners();
    await screenshots();
  } finally {
    await browser.close();
    fs.rmSync(TMP, { recursive: true, force: true });
  }
})().catch((e) => { console.error(e); process.exit(1); });
