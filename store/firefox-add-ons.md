# Firefox Add-ons (AMO) listing

Submit at the [Add-on Developer Hub](https://addons.mozilla.org/developers/). Upload `dist/tip-zapper-<version>-firefox.zip`, not the Chrome zip. The Firefox build adds the two things AMO requires of new Manifest V3 add-ons: an extension ID (`tip-zapper@6foot5.com`) and a data-collection declaration (`none`). It needs Firefox 140 or newer.

**Distribution:** On this site (listed).

**Source code:** when asked whether the add-on uses a build tool, minifier or transpiler, answer **No**. `content.js` in the zip is the source.

## Listing

**Name:** Tip Zapper

**Add-on URL:** `tip-zapper`

**Summary** (250 characters max):

> Sets the pre-filled grocery tip on Amazon checkout back to $0, and stops you before you place an order with a tip still on. No tracking, no data collection, no network requests.

**Description:**

```
When you check out a Whole Foods or Amazon Fresh order on amazon.com, Amazon fills in a grocery tip for you. Tip Zapper sets it back to $0, so a tip is something you choose instead of something you have to remember to undo.

<b>What it does</b>
<ul>
<li>Finds the grocery tip on the checkout page, opens the tip box, types 0 and presses Apply.</li>
<li>Shows a small badge in the corner: green when the tip is $0.00, red if it couldn't change it.</li>
<li>If you click Place your order while a tip above $0 is still showing, it holds the click and asks first.</li>
<li>Never clicks Place your order itself.</li>
</ul>

<b>What it doesn't do</b>
<ul>
<li>No account, no tracking, no analytics, no network requests, no storage.</li>
<li>Runs only on www.amazon.com, and only does anything on checkout pages.</li>
</ul>

You can still tip. Amazon lets you add or change a tip for up to 24 hours after delivery.

Tip Zapper is a free, independent, open-source project. It isn't affiliated with, endorsed by or sponsored by Amazon.
```

**Categories:** Shopping
**Tags:** shopping, privacy, amazon
**Support site:** `https://github.com/adamarussell-sudo/tip-zapper/issues`
**Homepage:** `https://github.com/adamarussell-sudo/tip-zapper`
**License:** MIT License
**Privacy policy:** paste the text of `PRIVACY.md`.

**Images:** icon from `store/images/icon-128.png`. Screenshots: the three `store/images/screenshot-*.png` files.

**Contributions URL:** AMO only accepts links to a short list of payment sites in this field, so use the Ko-fi page (`https://ko-fi.com/aruss`), not the 6foot5.com page. If AMO rejects it, leave the field empty and the tip jar link in the README covers it.

## Notes to reviewer

```
Single content script, no build step, no minification, no remote code, no network requests. Matches https://www.amazon.com/* and acts only on checkout pages that show a grocery tip. It never clicks "Place your order". The repository's tests run it against the real Amazon tip-widget markup: https://github.com/adamarussell-sudo/tip-zapper
```
