window.KomfiKatCarouselManifest = {
  // Edit CTA buttons here: labels, subtitles, icons, links, and disabled state.
  actions: [
    {
      label: "Buy on Etsy",
      subtitle: "Digital Version",
      icon: "img/icons/etsy.svg",
      href: "https://komfikatcoloring.etsy.com/listing/4472798201",
      className: "promo-carousel__shop-button--etsy",
    },
    {
      label: "Buy on Amazon",
      subtitle: "Coming soon",
      icon: "img/icons/amazon.svg",
      className: "promo-carousel__shop-button--amazon",
      disabled: true,
    },
    {
      label: "View on Website",
      subtitle: "Coming soon",
      icon: "img/icons/favicon.png",
      href: "http://komfikat.com/",
      className: "promo-carousel__shop-button--website",
      disabled: true,
    },
  ],

  // Main image pipeline: run .\scripts\update-site-images.ps1 after dropping new source PNG/JPG files into image folders.
  // Recommended source size for square carousel art: about 1200x1200 px.
  // That is enough for this layout on high-DPI screens without shipping oversized 2500+ px exports to mobile.
  // You can keep dropping in PNGs/JPGs; the script will generate 768w and 1200w WebP variants automatically.
  // The carousel uses srcset so phones get the smaller file and desktop still gets the sharper version.
  slides: {
    files: [
      { src: "img/carousel/1-1200.webp", srcset: "img/carousel/1-768.webp 768w, img/carousel/1-1200.webp 1200w", sizes: "(max-width: 30rem) 91vw, 575px", width: 1200, height: 1200, alt: "Hobby Girl cover" },
      { src: "img/carousel/2-1200.webp", srcset: "img/carousel/2-768.webp 768w, img/carousel/2-1200.webp 1200w", sizes: "(max-width: 30rem) 91vw, 575px", width: 1200, height: 1200, alt: "Instagram carousel image 2" },
      { src: "img/carousel/3-1200.webp", srcset: "img/carousel/3-768.webp 768w, img/carousel/3-1200.webp 1200w", sizes: "(max-width: 30rem) 91vw, 575px", width: 1200, height: 1200, alt: "Instagram carousel image 3" },
      { src: "img/carousel/4-1200.webp", srcset: "img/carousel/4-768.webp 768w, img/carousel/4-1200.webp 1200w", sizes: "(max-width: 30rem) 91vw, 575px", width: 1200, height: 1200, alt: "Instagram carousel image 4" },
    ],
  },
};
