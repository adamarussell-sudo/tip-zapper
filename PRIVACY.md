# Privacy Policy

**Effective November 1, 2026**

Tip Zapper doesn't collect, store, sell or send any information about you. That's the whole policy. The rest of this page explains what the extension does touch, so you can check it.

## What it does

- It runs only on pages at `https://www.amazon.com/`, and it only acts on checkout pages that show a tip.
- On those pages it reads the tip amount and the order summary, changes the tip to $0 the same way you would by hand, and shows a status badge and, when needed, a popup.
- Everything happens inside your browser tab.

## What it doesn't do

- No network requests. It never contacts any server, including the developer's.
- No analytics, tracking, cookies or fingerprinting.
- No storage. It keeps nothing between page loads.
- No account and no sign-in.
- It scans the page's text only to find the tip line. It doesn't save anything it sees, it never changes your address, payment method or items, and it never places an order.

## The clipboard

When you click **Copy debug info** or **Report it** on the badge, Tip Zapper copies a debug snapshot to your clipboard so you can paste it into a bug report. It only does this when you click. The snapshot contains:

- the page path, without the query string
- the tip amount it read and the steps it took
- a scrubbed copy of the tip section's HTML, with scripts, images, hidden form fields and long attribute values removed

It isn't sent anywhere. It stays on your clipboard until you paste it or copy something else.

## Links

The badge has a *Like it? Leave a tip* link to the developer's tip jar, and the **Report it** button opens GitHub. These are ordinary links that open in a new tab, and only when you click them. Those sites have their own privacy policies.

## Changes

If this policy ever changes, the new version will be posted here with a new effective date, and the change will be listed in the [changelog](CHANGELOG.md).

## Contact

Questions go in a [GitHub issue](https://github.com/adamarussell-sudo/tip-zapper/issues).
