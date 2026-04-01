window.KomfiKatCarouselManifest = {
  ctaTitle: "Hobby Girl",
  ctaSubtitle: "Cute & Cozy Coloring Book",

  // Edit CTA buttons here: labels, subtitles, icons, links, and disabled state.
  actions: [
    {
      label: "Buy on Etsy",
      mobileLabel: "Buy Hobby Girl on Etsy",
      subtitle: "Digital Version",
      icon: "img/icons/etsy.svg",
      href: "https://komfikatcoloring.etsy.com/listing/4472798201",
      className: "promo-carousel__shop-button--etsy",
      promoCode: "COZY10",
      promoLabel: "PROMO CODE",
      promoHint: "Tap to copy",
      promoCopiedLabel: "Copied!",
      promoCopiedHint: "Ready to paste",
    },
    {
      label: "Buy on Amazon",
      mobileLabel: "Buy Hobby Girl on Amazon",
      subtitle: "Paperback Version",
      icon: "img/icons/amazon.svg",
      href: "https://www.amazon.com/dp/B0GVF789ZJ",
      className: "promo-carousel__shop-button--amazon",
    },
    {
      label: "View on Website",
      subtitle: "Coming soon",
      icon: "img/icons/favicon.png",
      href: "https://komfikat.com/",
      className: "promo-carousel__shop-button--website",
      disabled: true,
    },
  ],

  // Main asset pipeline: run .\scripts\update-site-images.ps1 after dropping files into img/carousel.
  // Images: numbered PNG/JPG (1.png, …); the script builds 768w and 1152w WebP and sets srcset on each slide.
  // Videos: numbered sources (e.g. 3.mp4); the script encodes 768 and 1152 MP4 at 60 fps (see update-site-images.ps1), poster WebP, type: "video" entries.
  // Recommended source size for square carousel art: about 1152x1152 px.
  slides: {
    files: [
      { src: "img/carousel/1-1152.webp", srcset: "img/carousel/1-768.webp 768w, img/carousel/1-1152.webp 1152w", sizes: "(max-width: 30rem) 91vw, 575px", width: 1152, height: 1152, alt: "Hobby Girl cover" },
      { type: "video", src: "img/carousel/2-1152.mp4", mobileSrc: "img/carousel/2-768.mp4", poster: "img/carousel/2-poster.webp", width: 1152, height: 1152, alt: "Instagram carousel image 2" },
      { src: "img/carousel/3-1152.webp", srcset: "img/carousel/3-768.webp 768w, img/carousel/3-1152.webp 1152w", sizes: "(max-width: 30rem) 91vw, 575px", width: 1152, height: 1152, alt: "Instagram carousel image 3" },
      { src: "img/carousel/4-1152.webp", srcset: "img/carousel/4-768.webp 768w, img/carousel/4-1152.webp 1152w", sizes: "(max-width: 30rem) 91vw, 575px", width: 1152, height: 1152, alt: "Instagram carousel image 4" },
      { src: "img/carousel/5-1152.webp", srcset: "img/carousel/5-768.webp 768w, img/carousel/5-1152.webp 1152w", sizes: "(max-width: 30rem) 91vw, 575px", width: 1152, height: 1152, alt: "Instagram carousel image 5" },
      { src: "img/carousel/6-1152.webp", srcset: "img/carousel/6-768.webp 768w, img/carousel/6-1152.webp 1152w", sizes: "(max-width: 30rem) 91vw, 575px", width: 1152, height: 1152, alt: "Instagram carousel image 6" },
      { src: "img/carousel/7-1152.webp", srcset: "img/carousel/7-768.webp 768w, img/carousel/7-1152.webp 1152w", sizes: "(max-width: 30rem) 91vw, 575px", width: 1152, height: 1152, alt: "Instagram carousel image 7" },
    ],
  },
};
