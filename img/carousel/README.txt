How to update carousel images

1. Put your numbered files here:
1.png, 2.png, 3.png, and so on.

2. Run the one main image pipeline:
.\scripts\update-site-images.ps1

3. This will update:
js/carousel-manifest.js

Notes
- This site is static, so the browser cannot automatically inspect the folder by itself.
- update-site-images.ps1 will also generate responsive carousel WebP files automatically.
- Carousel outputs are generated as 768w and 1152w WebP variants for better mobile performance.
- Files are sorted by number, not by modified date.
- Supported formats: .png, .jpg, .jpeg, .webp, .avif
- Existing alt text in the manifest is preserved when the same file path already exists.
