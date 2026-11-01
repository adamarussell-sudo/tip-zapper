// Packages extension/ into store-ready zips:
//   dist/tip-zapper-<version>-chrome.zip   Chrome Web Store, Edge Add-ons, Brave, manual installs
//   dist/tip-zapper-<version>-firefox.zip  addons.mozilla.org (adds the Gecko ID and data declaration)
// Usage: npm run build
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EXT = path.join(ROOT, 'extension');
const DIST = path.join(ROOT, 'dist');

const manifest = JSON.parse(fs.readFileSync(path.join(EXT, 'manifest.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const fail = (msg) => { console.error(`build: ${msg}`); process.exit(1); };

// Sanity checks the stores would otherwise bounce.
if (manifest.version !== pkg.version) fail(`manifest version ${manifest.version} != package.json ${pkg.version}`);
if (manifest.description.length > 132) fail(`description is ${manifest.description.length} chars; Chrome allows 132`);
const files = ['content.js', ...Object.values(manifest.icons)];
for (const f of files) if (!fs.existsSync(path.join(EXT, f))) fail(`missing ${f}`);

const FIREFOX = {
  browser_specific_settings: {
    gecko: {
      id: 'tip-zapper@6foot5.com',
      strict_min_version: '140.0',
      data_collection_permissions: { required: ['none'] },
    },
  },
};

function pack(target, m) {
  const zip = new AdmZip();
  zip.addFile('manifest.json', Buffer.from(`${JSON.stringify(m, null, 2)}\n`));
  for (const f of files) zip.addLocalFile(path.join(EXT, f), path.dirname(f) === '.' ? '' : path.dirname(f));
  const out = path.join(DIST, `tip-zapper-${manifest.version}-${target}.zip`);
  zip.writeZip(out);
  console.log(`built ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1024).toFixed(1)} KB)`);
}

fs.mkdirSync(DIST, { recursive: true });
pack('chrome', manifest);
pack('firefox', { ...manifest, ...FIREFOX });
