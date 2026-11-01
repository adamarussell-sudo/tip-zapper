# 6foot5.com page: Tip Zapper

A WordPress page draft for **https://6foot5.com/tip-zapper/**. The extension, README and GitHub Sponsor button all link here, so it's the one tip-jar address to keep current.

- **Type:** Page (not a post)
- **Title:** Tip Zapper
- **Slug:** `tip-zapper`
- **Status:** Draft until Adam approves it
- **Image:** `docs/images/icon-512.png`, uploaded to the media library
- **Tip jar:** https://ko-fi.com/aruss
- **Placeholders to swap before publishing:** `ICON-URL` (the uploaded icon's address from the media library), plus the store links once they're live

Written to the site style sheet and voice sheet: first person, point up front, a dry joke riding on a true point, no position taken on tipping, network-TV clean.

## The copy

> Every time I ordered groceries from Whole Foods on Amazon, I deleted the tip Amazon fills in at checkout. Every single time. That's a chore a computer should be doing, so I had Claude help me build a browser extension that does it for me.
>
> It's called Tip Zapper. When the checkout page loads, it opens the tip box, types 0 and hits Apply. If a tip survives somehow and I click Place your order anyway, it stops the click and asks first. It doesn't collect anything, doesn't phone home, and never places the order itself. That button stays mine.
>
> **Get it**
> Chrome, Brave and Edge: Chrome Web Store *(coming soon)*
> Firefox: Firefox Add-ons *(coming soon)*
> The code, user guide and bug reports: [GitHub](https://github.com/adamarussell-sudo/tip-zapper)
>
> **The tip jar**
> Tip Zapper is free and it'll stay free. If it saves you a few clicks and you want to say thanks, the tip jar is below.
>
> Yes, a tip jar on the Tip Zapper. I see it. The difference is this one starts at $0 and stays there unless you change it.
>
> [Leave a tip on Ko-fi]
>
> *Tip Zapper is an independent project and isn't affiliated with Amazon.*

## Block markup

Paste this into the WordPress editor's **Code editor** view (⋮ menu → Code editor). The theme handles the fonts, colors and square Lake buttons.

```html
<!-- wp:image {"width":"120px","sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full is-resized"><img src="ICON-URL" alt="Tip Zapper icon: a lightning bolt striking a coin" style="width:120px"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Every time I ordered groceries from Whole Foods on Amazon, I deleted the tip Amazon fills in at checkout. Every single time. That's a chore a computer should be doing, so I had Claude help me build a browser extension that does it for me.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>It's called Tip Zapper. When the checkout page loads, it opens the tip box, types 0 and hits Apply. If a tip survives somehow and I click Place your order anyway, it stops the click and asks first. It doesn't collect anything, doesn't phone home, and never places the order itself. That button stays mine.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Get it</h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>Chrome, Brave and Edge: Chrome Web Store (coming soon)</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Firefox: Firefox Add-ons (coming soon)</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>The code, user guide and bug reports: <a href="https://github.com/adamarussell-sudo/tip-zapper">GitHub</a></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:heading -->
<h2 class="wp-block-heading">The tip jar</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Tip Zapper is free and it'll stay free. If it saves you a few clicks and you want to say thanks, the tip jar is below.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Yes, a tip jar on the Tip Zapper. I see it. The difference is this one starts at $0 and stays there unless you change it.</p>
<!-- /wp:paragraph -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="https://ko-fi.com/aruss">Leave a tip on Ko-fi</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->

<!-- wp:paragraph {"fontSize":"small"} -->
<p class="has-small-font-size"><em>Tip Zapper is an independent project and isn't affiliated with Amazon.</em></p>
<!-- /wp:paragraph -->
```

## Before publishing

Run it through the site's pre-publish checklist. The one to look at hardest is the coworker test: the page describes what Adam does and what the tool does, and takes no side on tipping. If that still feels too close to a hot take for 6foot5.com, the page can be left unlinked from the menu, or the tip jar can move to a plain Ko-fi link in the README.
