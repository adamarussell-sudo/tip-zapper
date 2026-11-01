# Chrome Web Store listing

Copy and paste for the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole). Upload `dist/tip-zapper-<version>-chrome.zip` (from `npm run build` or the GitHub release). The same zip works for Brave users, who install from this store, and for Edge Add-ons.

## Store listing tab

**Name:** Tip Zapper
*(Comes from the manifest. Keep "Amazon" out of the name. Store policy forbids implying another company made or endorses the product.)*

**Summary** (from the manifest, 132 characters max):

> Sets the pre-filled grocery tip on Amazon checkout back to $0, and stops you before you order with a tip still on.

**Description:**

```
When you check out a Whole Foods or Amazon Fresh order on amazon.com, Amazon fills in a grocery tip for you. Tip Zapper sets it back to $0, so a tip is something you choose instead of something you have to remember to undo.

WHAT IT DOES
• Finds the grocery tip on the checkout page, opens the tip box, types 0 and presses Apply.
• Shows a small badge in the corner: green when the tip is $0.00, red if it couldn't change it.
• If you click Place your order while a tip above $0 is still showing, it holds the click and asks first. One button zaps the tip; the other lets the order through.
• Never clicks Place your order itself. That click stays yours.

WHAT IT DOESN'T DO
• No account, no tracking, no analytics, no network requests, no storage.
• Runs only on www.amazon.com, and only does anything on checkout pages.

You can still tip. Amazon lets you add or change a tip for up to 24 hours after delivery.

If Amazon changes its checkout page and the badge turns gray or red, click "Report it" on the badge. It copies a scrubbed snapshot of the tip section and opens a bug report, so the fix can go out quickly.

Tip Zapper is a free, independent, open-source project. It isn't affiliated with, endorsed by or sponsored by Amazon. Amazon, Whole Foods Market and Amazon Fresh are trademarks of their owners.

Source code, user guide and bug reports: https://github.com/adamarussell-sudo/tip-zapper
```

**Category:** Shopping
**Language:** English (United States)

**Graphic assets** (all in `store/images/`):

| Field | File |
|---|---|
| Store icon (128×128) | `icon-128.png` |
| Screenshots (1280×800) | `screenshot-1-zapped.png`, `screenshot-2-guard.png`, `screenshot-3-quiet.png` |
| Small promo tile (440×280) | `promo-small-440x280.png` |
| Marquee promo tile (1400×560), optional | `promo-marquee-1400x560.png` |

**Official URL:** optional. It only lists sites verified in Google Search Console under the same Google account as your developer account. 6foot5.com is already verified in Search Console, so if it's the same account, pick it here.
**Homepage URL:** `https://github.com/adamarussell-sudo/tip-zapper`
**Support URL:** `https://github.com/adamarussell-sudo/tip-zapper/issues`

## Privacy tab

**Single purpose description:**

> Tip Zapper sets the pre-filled grocery delivery tip on Amazon's checkout page to $0 and warns the user before they place an order with a tip still on.

**Permission justification:**

| Permission | Justification |
|---|---|
| Host permission, via the content script on `https://www.amazon.com/*` | Needed to read the tip amount on Amazon's checkout page, change it to $0, and show a status badge and warning popup. The script does nothing on pages without a grocery tip. |

**Are you using remote code?** No, I am not using remote code.

**Data usage:** don't check any of the data types. Tip Zapper collects none of them. Then certify all three statements:

- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** `https://github.com/adamarussell-sudo/tip-zapper/blob/main/PRIVACY.md`

## Distribution tab

- **Visibility:** Public
- **Regions:** All regions. The extension only matches amazon.com, so it's mainly useful in the US.
- **Pricing:** Free

## Notes for the reviewer (optional field)

```
The extension is a single content script (content.js) with no build step, minification or remote code. It only runs on https://www.amazon.com/* and acts only when a checkout page shows a grocery tip. It never clicks "Place your order". To exercise it without a live grocery cart, the repository's tests (npm test) run it against the real Amazon tip-widget markup: https://github.com/adamarussell-sudo/tip-zapper/blob/main/tests/fixtures.js
```
