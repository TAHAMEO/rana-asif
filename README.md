# Rana Asif — Advocate High Court

A one-page personal website with a real-time 3D hero and 3D effects throughout. The layout follows the familiar district-judiciary pattern (contact bar, news ticker, message with portrait, notice board, important links, contact) in a dark navy and gold theme.

It is a plain static site. Nothing needs to be installed to host it.

## 3D effects

| Where | Effect |
| --- | --- |
| Preloader | Courtroom doors swing open in 3D around a spinning gold coin. |
| Hero | WebGL scene (three.js): a gold Scales of Justice whose beam sways, a ring of fluted columns, drifting gold dust, a light shaft, ripple rings, floating § marks and bloom glow. The camera follows the mouse and drifts as you scroll. |
| Hero name | Real extruded 3D lettering (16 stacked layers) that turns toward the cursor, with a moving gold shine. |
| Portrait | A tilting 3D frame. The head pops out above the frame, with an orbiting ring and floating badges at different depths. |
| Cards | Practice areas, steps, notices and contact cards tilt toward the cursor, show a glare highlight, and lift their contents out in depth. |
| Values | Cards that flip over in 3D on hover or tap. |
| Stats | Counters over a moving perspective gold grid floor. |
| Important links | A drag-to-spin 3D ring of cards, also controllable with buttons and the keyboard. |
| Throughout | Sections fold up into place as you scroll, push-down 3D buttons, a coin logo that flips, and a custom cursor. |

Motion is turned off for visitors who have "reduce motion" enabled. If WebGL is unavailable, the page shows a static fallback. The 3D scene pauses when it is off-screen.

## Viewing it

- **Quickest:** double-click `index.html`.
- **Local server (closer to the live site):** run `python3 -m http.server 8080` in this folder, then open http://localhost:8080. Alternatively, run `npm install` and then `npm run dev`.

## Editing the content

All text is in `index.html`. Every block that needs real details has an `<!-- EDIT -->` comment. Search and replace these placeholders throughout the file:

| Placeholder | Replace with |
| --- | --- |
| `+92 300 0000000` | the phone number as displayed |
| `tel:+923000000000` | the phone number for tap-to-call |
| `923000000000` | the WhatsApp number in international format, with no `+` (used by the WhatsApp links and the form) |
| `info@example.com` | the email address |
| `District Courts, Lodhran` | the full chamber address |
| `Mon – Sat · 8:00 AM – 4:00 PM` | the office hours |

Also review:

- **Title.** "Advocate High Court" is used as the title throughout. Change it if it is wrong.
- **Stats numbers.** `data-count="20"` and `data-count="1500"` are sample figures. Replace them with real ones.
- **Message text.** Under "A Message from Rana Asif".
- **Notice board.** The entries and practice-area descriptions.

**Photo.** Two versions of the portrait are used:

- `assets/img/rana-asif-cutout.webp` is the version with the background removed, used in the 3D frame.
- `assets/img/rana-asif.jpg` is the original.

To change the photo, replace the cutout with a transparent PNG or WebP of the same framing (head and shoulders, shoulders touching the bottom edge).

**Share preview.** `assets/img/og-cover.jpg` is the image WhatsApp and Facebook show when the link is shared. After the site is live, change the `og:image` tag in `index.html` to the full URL, for example `https://your-domain.com/assets/img/og-cover.jpg`.

**Urdu tagline.** "انصاف سب کے لیے" (Justice for all) appears in the hero and the footer, set in Noto Nastaliq Urdu.

## Editing the 3D scene

The scene source is `src/hero3d.js`. The page loads the bundled file `assets/js/hero3d.min.js`. After changing the source, rebuild the bundle:

```bash
npm install
npm run build   # or: npm run dev  (live server on http://localhost:8080 that rebuilds on refresh)
```

Commit the rebuilt `assets/js/hero3d.min.js` along with the source.

## Publishing

Upload the folder as it is to any static host: GitHub Pages, Netlify, Vercel, or ordinary cPanel hosting. The folder contains `index.html`, `assets/` and `.nojekyll`. The `node_modules/` folder is not needed on the server.

To publish with **GitHub Pages**:

1. Merge this branch into `main`.
2. In GitHub, go to **Settings → Pages → Build and deployment**.
3. Choose **Deploy from a branch**, with branch `main` and folder `/ (root)`.

The contact form has no backend. It opens a pre-filled WhatsApp chat or email, so nothing is stored on the website.

## Files

```
index.html               page content (all text lives here)
assets/css/style.css     theme, layout and CSS 3D effects
assets/js/main.js        interactions (preloader, tilt, reveal, ring, counters, form)
assets/js/hero3d.min.js  bundled WebGL hero (built from src/hero3d.js)
assets/fonts/            self-hosted Cinzel, Inter and Noto Nastaliq Urdu
assets/img/              portrait, cutout, share image, icons
src/hero3d.js            three.js scene source
```

## Credits

- [three.js](https://threejs.org), MIT License. The license notice is kept at the end of `hero3d.min.js`.
- Icons from [Lucide](https://lucide.dev), ISC License (see `assets/LICENSE-Lucide-icons.txt`). The WhatsApp mark is from [Simple Icons](https://simpleicons.org), CC0.
- Fonts: Cinzel, Inter and Noto Nastaliq Urdu, SIL Open Font License 1.1 (see `assets/fonts/`).

This is a personal professional website. It is not affiliated with the official website of the District Judiciary Lodhran or the Lahore High Court.
