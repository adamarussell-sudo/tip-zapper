# Changelog

## 1.3.0 · 2026-11-01

- First public release.
- New icon and branding.
- The badge shows a *Like it? Leave a tip* link after it zaps a tip, and **Report it** on the gray and red badges (copies the debug info, then opens a GitHub bug report).
- Firefox build (Firefox 140 or newer), declaring that it collects no data.
- `npm test` runs 14 mock checkout pages in parallel. `npm run build` makes the Chrome and Firefox zips.

## 1.2.1 · 2026-11-01

- The badge and debug info show the version number, so you can tell which version is running after an update.

## 1.2.0 · 2026-11-01

- Popup guard: clicking **Place your order** with a tip above $0 (in the summary or typed in the tip box) is blocked, with **Zap it to $0** and **Order anyway** buttons.

## 1.1.0 · 2026-11-01

- Support for Amazon's current grocery tip widget (*Grocery Tip (optional):* with Edit, the amount box and Apply), built from a real checkout page.
- Reads the tip amount from the whole order-summary row, and still zaps when the amount can't be read.
- More detail in the debug info.

## 1.0.0 · 2026-11-01

- First version: finds the tip on checkout, sets it to $0, shows a status badge, and blocks Place your order while a tip is on.
