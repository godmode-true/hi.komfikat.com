How to update carousel images

1. Put your numbered files here:
1.png, 2.png, 3.png, and so on.

2. One-time sync:
.\scripts\sync-carousel-manifest.ps1

3. Auto-sync while you work:
.\scripts\watch-carousel-manifest.ps1

4. These scripts will update:
js/carousel-manifest.js

Notes
- This site is static, so the browser cannot automatically inspect the folder by itself.
- If you want full automation on your machine, keep watch-carousel-manifest.ps1 running.
- Files are sorted by number, not by modified date.
- Supported formats: .png, .jpg, .jpeg, .webp, .avif
- Existing alt text in the manifest is preserved when the same file path already exists.
