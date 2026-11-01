# Launch Checklist

Everything between "code on GitHub" and "anyone can install it in two clicks", in order. The repo, zips, listing text and images are done. What's left needs your accounts.

## 1. GitHub

- [ ] **Social preview image.** Repo → Settings → General → Social preview → upload `docs/images/banner.png`. GitHub doesn't allow setting this through the API.
- [ ] **About box.** It should already show the description, the 6foot5.com/tip-zapper link and topics. Fix it with the gear icon if not.

## 2. Tip jar (Ko-fi)

Ko-fi takes **0%** of one-off tips on the free plan. You only pay the payment processor's cut: about 2.9% + 30¢ through Stripe, or PayPal's rate. Buy Me a Coffee takes 5% on top of that, which is why Ko-fi is the pick.

- [ ] Sign up at [ko-fi.com](https://ko-fi.com) and claim a page name, ideally `ko-fi.com/6foot5`.
- [ ] Connect PayPal or Stripe for payouts, under Settings → Payments.
- [ ] Set the "coffee" price ($3 or $5) and a one-line description. Turn off Shop and Memberships if you don't want them.
- [ ] Put your Ko-fi link in the 6foot5.com page (step 3) and uncomment `ko_fi:` in `.github/FUNDING.yml`.
- [ ] Tips are income, so keep the Ko-fi payout history for tax time.

*Later, optional:* [GitHub Sponsors](https://github.com/sponsors) also takes 0% from personal sponsors and adds a native Sponsor button, but it needs an application and a bank account, and your sponsors need GitHub accounts. Ko-fi covers everyone else.

## 3. The 6foot5.com page

Every tip link (the extension badge, the README, the repo's Sponsor button) points at **https://6foot5.com/tip-zapper/**, a page you own. If you ever switch tip platforms, you change one page instead of shipping a new extension.

- [ ] Create the page from [`website/6foot5-tip-zapper-page.md`](../website/6foot5-tip-zapper-page.md) as a WordPress **draft**, slug `tip-zapper`.
- [ ] Upload `docs/images/icon-512.png` to the media library for the page image.
- [ ] Swap in the Ko-fi link, approve it and publish. **This has to be live before the store submissions**, because the extension already links to it.

## 4. Chrome Web Store (covers Chrome, Brave and Edge users)

- [ ] Register at the [developer dashboard](https://chrome.google.com/webstore/devconsole) with a one-time **$5** fee. Use an email you check. It can't be changed later.
- [ ] **New item** → upload `dist/tip-zapper-1.3.0-chrome.zip` (attached to the GitHub release, or run `npm run build`).
- [ ] Fill in the listing and privacy tabs from [`store/chrome-web-store.md`](../store/chrome-web-store.md) and upload the images from `store/images/`.
- [ ] Submit for review. Review times vary.
- [ ] Once it's approved, replace "listing coming soon" in `README.md` and `docs/USER_GUIDE.md` with the store link, and add it to the 6foot5.com page.

## 5. Firefox Add-ons (free)

- [ ] Sign in at the [Add-on Developer Hub](https://addons.mozilla.org/developers/) with a Firefox account.
- [ ] Submit `dist/tip-zapper-1.3.0-firefox.zip` as a listed add-on and fill it in from [`store/firefox-add-ons.md`](../store/firefox-add-ons.md).
- [ ] Add the store link to the README, user guide and 6foot5.com page once it's live.

## 6. Edge Add-ons (free, optional)

- [ ] Follow [`store/edge-add-ons.md`](../store/edge-add-ons.md). It's the same Chrome zip and the same text.

## 7. After launch

- [ ] Watch [Issues](https://github.com/adamarussell-sudo/tip-zapper/issues) for "Report it" bug reports. When Amazon changes its checkout page, the debug info is how the fix gets made.
- [ ] For each fix, bump the version in `extension/manifest.json` and `package.json`, add a `CHANGELOG.md` entry, run `npm test && npm run build`, attach the zips to a new GitHub release, and upload the new zip to each store. Store users update automatically.
