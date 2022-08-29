# Embed Inline Script

> During the build we are also copying the resulting bundle to a file named `script.inline`. This file is imported as a string in the Cloudflare Worker — if it had `.js` extension the code loader in `../cloudflare-worker` would import it as a JS code.

Use Vite for normal development:
```sh
npm run dev
```

When you want to **build** the final script that you can also test in a HTML run:
```sh
npm run build
```

If you now want to test the script open [inline.html](./inline.html) in a browser.

## Issues
- The bundle size is big: cca 450KB uncompressed
