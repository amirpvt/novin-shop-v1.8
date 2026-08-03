import { useEffect } from "react";

type SEOProps = {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
};

export function useSEO({ title, description, keywords, image }: SEOProps) {
  useEffect(() => {
    const siteName = "پخش سوسیس و کالباس نوین";

    if (title) {
      document.title = `${title} | ${siteName}`;
    } else {
      document.title = `${siteName} - توزیع عمده و خرده سوسیس و کالباس`;
    }

    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta("description", description || "توزیع عمده و خرده‌فروشی انواع سوسیس، کالباس و فرآورده‌های گوشتی با بهترین برندها - پخش نوین کرج");
    setMeta("keywords", keywords || "سوسیس, کالباس, پخش سوسیس, فروش عمده سوسیس, نوین, کرج, البرز");
    setMeta("og:title", title || siteName, true);
    setMeta("og:description", description || "توزیع عمده سوسیس و کالباس", true);
    setMeta("og:image", image || "/images/banner3.jpg", true);
    setMeta("og:type", "website", true);
    setMeta("og:locale", "fa_IR", true);
  }, [title, description, keywords, image]);
}

export default function SEO(props: SEOProps) {
  useSEO(props);
  return null;
}
