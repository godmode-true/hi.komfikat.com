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

  // Slide files are synced by .\scripts\sync-carousel-manifest.ps1
  // This avoids runtime probing and lets the carousel render immediately on mobile.
  slides: {
    files: [
      { src: "img/carousel/1.webp", alt: "Hobby Girl cover" },
      { src: "img/carousel/2.webp", alt: "Instagram carousel image 2" },
      { src: "img/carousel/3.webp", alt: "Instagram carousel image 3" },
      { src: "img/carousel/4.webp", alt: "Instagram carousel image 4" },
    ],
  },
};
