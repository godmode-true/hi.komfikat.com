window.KomfiKatCarouselManifest = {
  // Edit CTA buttons here: labels, subtitles, icons, links, and disabled state.
  actions: [
    {
      label: "Buy on Amazon",
      subtitle: "Physical Copy",
      icon: "img/icons/amazon.svg",
      className: "promo-carousel__shop-button--amazon",
      disabled: true,
    },
    {
      label: "Buy on Etsy",
      subtitle: "Digital Version",
      icon: "img/icons/etsy_168752.svg",
      href: "https://komfikatcoloring.etsy.com/",
      className: "promo-carousel__shop-button--etsy",
    },
    {
      label: "View on Website",
      subtitle: "Official Website",
      icon: "img/icons/favicon.png",
      className: "promo-carousel__shop-button--website",
      disabled: true,
    },
  ],

  // Slides are auto-loaded from img/carousel/1.png, 2.png, 3.png and so on.
  // The carousel stops at the first missing number, so keep numbering continuous.
  slides: {
    directory: "img/carousel",
    startIndex: 1,
    maxIndex: 24,
    extension: "png",

    // Optional alt-text overrides by slide number.
    alts: {
      1: "Hobby Girl cover",
    },
  },
};
