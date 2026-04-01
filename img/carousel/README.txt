How to update carousel images and videos

1. Put your numbered files here:
   - Images: 1.png, 2.png, 3.png, and so on.
   - Videos (one slide number = one file): 3.mp4, 4.mov, … Square sources work best; the script scales to the carousel size.

2. Run the one main asset pipeline:
.\scripts\update-site-images.ps1

3. This will update:
js/carousel-manifest.js

Notes
- This site is static, so the browser cannot automatically inspect the folder by itself.
- Images: responsive WebP files (768w and 1152w) are generated from PNG/JPG sources.
- Videos: H.264 MP4 at 768 and 1152 px, plus a poster WebP (first frame). Audio is removed for smaller files and reliable autoplay.
- If the same slide number has both an image and a video source, the video is used for that slide.
- Files are sorted by number, not by modified date.
- Supported image formats: .png, .jpg, .jpeg, .webp, .avif
- Supported video sources: .mp4, .mov, .webm, .mkv
- Requires ffmpeg in PATH (same as for WebP conversion).
- Existing alt text in the manifest is preserved when the same file path or slide number already exists.
