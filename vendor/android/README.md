# Android gallery

The design system for a future Android version of Tasty. It lives on the `android-gallery` branch and is not merged into `main` or `release`. Publishing it and when to merge are the user's decisions.

## Separation

A change to the desktop gallery must not conflict with this one, so everything on this branch stays in two folders.

| Folder | Holds |
|---|---|
| `vendor/android/` | The page module, specimens, this document, the check |
| `src/pages/[...locale]/android-gallery/` | The route |

Tokens and desktop parts are read only. Never copy a value and never edit a shared file. If a shared file has to change, report the file, the line and the reason first.

Desktop changes arrive by `git merge main`, never by rebase. A conflict means the separation broke, so find out which shared file caused it before resolving it. To see the changes on this branch:

```bash
git diff main...android-gallery --name-only
```

## Order of work

A design reaches Android in this order.

1. This gallery. A designer session sets the design here.
2. The Android implementation, in the Android repository, built to match this gallery.

The desktop gets its second step for free: `crates/tasty-gallery` and the app share one component source, so a change in shape reaches the app with the gallery. Android cannot do that. It is built in Compose and shares no component source with this page or with the Rust gallery, so the gallery cannot make the change for it and nothing fails when the two drift. So the Android side does not set a design of its own. A design it needs goes to this gallery first, and the implementation follows.

What crosses over is values, not components. The Android theme takes them from `vendor/tokens/tasty.tokens.json`. How it does that belongs to the Android repository.

## What this system takes from the canon

| Item | Rule |
|---|---|
| Color tokens | The same as Tasty, read from the canon |
| Layout rules | The same as Tasty, `vendor/RULES.md` section 10 |
| Parts | The desktop components, imported unchanged |
| A value touch does not fit | Stays as it is. The touch section measures it, and the owner decides |
| Width classes | The canon has none. Android's own, declared in `gallery/widths.jsx` |

Screens wait for the decision on how the app is used. Nothing here decides product behaviour.

Token lengths read as dp and type sizes as sp, one to one. The baselines in `gallery/touch.jsx` are comparison points with their sources. They are not Tasty values.

## Page

- `gallery/index.jsx` exports `page` and a default route, the form of `vendor/gallery/<page>/index.jsx`. Each section has its own file, listed in `NAV`. `?audit=1` mounts every stage, as on the desktop gallery.
- Prose is in `gallery/copy.js`. A slot with no text draws nothing. Labels and spec tables stay in the section files.
- `gallery/states.jsx` names the desktop contracts each specimen draws.
- Specimens stay inside the route's one `[data-gallery-page]`, because `specimen.css` and the shared rules scope to it.
- Tokens arrive through `Base.astro`. `design/kit.css` and `specimen.css` arrive through the route.
- Keep Android components out of `vendor/components` and `vendor/ui_kits/terminal`. `src/lib/vendor-assets.ts` gathers the CSS of those two folders into the desktop `kit.css`.
- A translation key in `src/lib/i18n/` is a shared change. Page prose stays in this folder, in English on every language path, and Codex writes it.
- A new icon changes `vendor/icons` and `Icon.jsx`, which are shared. Report it first.
- Keep local paths and local folder names out of this folder. The repository check reads it too.

## Viewing it

```bash
npm ci
npm run dev
```

The page is at `/android-gallery/`, and at `/ko/android-gallery/` for Korean. For the built page, run `npm run build` and `npm run preview`. The preview server stays running in the background and prints its port, which moves on if the default is taken. Stop it with `npx astro preview stop`.

## Checks

Run these from the repository root.

```bash
npm run build
node vendor/android/check/check-android.mjs
npm run check-links && npm run check-sitemap && npm run check-contrast
```

`npm run check-contrast` measures only the chrome around the specimens on this page. `check-android.mjs` measures inside them, with the gallery's own measure function, on every language path in Mocha and Latte at 1440 and 390 wide. It also fails on a page error, page-level horizontal scroll, a missing `noindex`, or nothing measured.

Frozen cells are read through the rows of `vendor/tokens/ground-ink-rules.json`, and a cell for a desktop contract is measured against its row. That file is shared, so an Android contract has no rows there. The measure function skips the inside of a cell, so a `data-contract` cell with no row would go unmeasured, and the check fails on one. Draw an Android-only state without `data-contract`, and it is measured as ordinary text and shapes at 4.5 and 3. The check does not fail on a contract row missing from this page, because the desktop gallery holds those cells.
