# Contributing

Bug reports with debug info are the most useful thing you can send. Code is welcome too.

## Reporting a problem

1. On the checkout page, click **Report it** on the gray or red badge. It copies the debug info and opens a new issue.
2. Paste the debug info into the form, and say which browser you use and what you saw.

No badge at all? Open a [bug report](https://github.com/adamarussell-sudo/tip-zapper/issues/new?template=bug_report.yml) anyway and say so.

## Ground rules for code

These are what make the extension safe to install. A change that breaks one won't be merged.

1. **Never click Place your order**, or anything that buys, pays, submits or continues checkout. `isSafe()` enforces this. Don't loosen it.
2. **No network requests**, no analytics, no remote code.
3. **No new permissions.** It runs as a content script on `www.amazon.com` and nothing else.
4. **No data leaves the tab.** Debug info goes to the clipboard only when the user clicks.
5. **Fail loud.** If Tip Zapper can't confirm the tip is $0, the badge says so.

## Working on it

```bash
npm install
npm test        # 14 mock checkout pages in jsdom, about 10 seconds
npm run build   # dist/ zips for Chrome and Firefox
```

To try a change in a real browser, load the `extension/` folder with **Load unpacked**, then reload the extension and the checkout tab after each edit.

## Adding a new Amazon layout

When a debug report shows a layout Tip Zapper doesn't handle:

1. Add the scrubbed HTML from the report to `tests/fixtures.js`. Change any personal details first.
2. Add a scenario to `tests/run.js` that fails.
3. Change `extension/content.js` until it passes, without breaking the other scenarios.
4. Note the change in `CHANGELOG.md` and bump the version in `extension/manifest.json` and `package.json` (`npm run build` checks that they match).

## Brand assets

The icon and colors are in [`brand/`](brand) and [`docs/BRAND.md`](docs/BRAND.md). `npm run brand` re-renders every icon and store image. Please don't use the Tip Zapper name or icon for a fork you publish. Give it a name of its own.
