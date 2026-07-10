// Product data — statically imported for client/server compatibility
import p0 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/barrington-br-fr401-double-french-horn.json"
import p1 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/beyerdynamic-dt-770-pro-250-ohms.json"
import p2 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/blue-microphones-snowball-ice.json"
import p3 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/crosley-cr8005a-cb-cruiser-portable-turn.json"
import p4 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/crosley-cruiser-portable-3-speed-turntab.json"
import p5 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/custom-zone-6-string-full-size-electric.json"
import p6 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/ddj-sx2-dj-controller-for-serato-dj.json"
import p7 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/deluxe-3-speed-belt-drive-suitcase-turnt.json"
import p8 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/digital-conversion-turntable.json"
import p9 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/gator-trombone-case.json"
import p10 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/gibson-2016-t-les-paul-studio-50-s-tribu.json"
import p11 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/gibson-custom-l5-premier-acoustic-guitar.json"
import p12 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/handcrafted-blue-acoustic-violin.json"
import p13 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/handcrafted-wood-acoustic-violin.json"
import p14 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/hercules-djcontrol-instinct-s-series.json"
import p15 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/hercules-ds513bb-2-trumpet.json"
import p16 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/high-definition-studio-monitor-headphone.json"
import p17 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/meinl-cymbals-arena-marching-cymbals-pai.json"
import p18 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/micromall-tm-paint-gold-drop-b.json"
import p19 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/microphones-yeti-usb-microphone.json"
import p20 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/mxx-v22r-large-capsule-condenser-microp.json"
import p21 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/new-trumpet-gig-bag-case-with-nylon.json"
import p22 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/panasonic-stereo-monitor-headphones.json"
import p23 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/photive-soultracks-portable-3-speed-turn.json"
import p24 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/pioneer-ddjsr-pro-dj-controller.json"
import p25 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/plastic-trumpet-white.json"
import p26 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/pro-dj-ddj-wego3-k-dj-controller.json"
import p27 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/product-horn.json"
import p28 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/professional-studio-monitor-headphones.json"
import p29 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/protec-deluxe-trumpet-bag-instrument-cas.json"
import p30 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/soyuz-tube-condenser-microphone.json"
import p31 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/tama-s-l-p-big-black-steel-snare-drum.json"
import p32 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/tromba-pro-professional-plastic-bb.json"
import p33 from "../../musicplace-crawl-extracted/musicplace-crawl/data/products/usb-dj-controller-with-trigger-pads.json"
import b0 from "../../musicplace-crawl-extracted/musicplace-crawl/data/blog/post-0-marshall-woburn-bluetooth-speaker.json"
import b1 from "../../musicplace-crawl-extracted/musicplace-crawl/data/blog/post-1-limited-products-information-update.json"
import b2 from "../../musicplace-crawl-extracted/musicplace-crawl/data/blog/post-2-voco-pro-symphony-headphone.json"
import b3 from "../../musicplace-crawl-extracted/musicplace-crawl/data/blog/post-3-adjustable-online-bass-guitar-tuner.json"
import b4 from "../../musicplace-crawl-extracted/musicplace-crawl/data/blog/post-4-how-to-tune-your-banjo-using-a-piano.json"
import b5 from "../../musicplace-crawl-extracted/musicplace-crawl/data/blog/post-5-buying-and-selling-violin-guide.json"
import b6 from "../../musicplace-crawl-extracted/musicplace-crawl/data/blog/post-6-the-science-of-tuning-musical-instrument.json"
import b7 from "../../musicplace-crawl-extracted/musicplace-crawl/data/blog/post-7-evaluating-a-used-musical-instrument.json"
import b8 from "../../musicplace-crawl-extracted/musicplace-crawl/data/blog/post-8-automated-musical-instruments.json"

export interface Product { name: string; slug: string; price: string; sku: string; categories: string[]; tags: string[]; shortDescription: string; fullDescription: string; stock: string; rating: string; mainImage: string; galleryImages: string[] }
export interface BlogPost { title: string; slug: string; date: string; author: string; categories: string[]; tags: string[]; content: string; image: string }

const allProducts: Product[] = [
  { ...p0, slug: "barrington-br-fr401-double-french-horn" } as Product,
  { ...p1, slug: "beyerdynamic-dt-770-pro-250-ohms" } as Product,
  { ...p2, slug: "blue-microphones-snowball-ice" } as Product,
  { ...p3, slug: "crosley-cr8005a-cb-cruiser-portable-turn" } as Product,
  { ...p4, slug: "crosley-cruiser-portable-3-speed-turntab" } as Product,
  { ...p5, slug: "custom-zone-6-string-full-size-electric" } as Product,
  { ...p6, slug: "ddj-sx2-dj-controller-for-serato-dj" } as Product,
  { ...p7, slug: "deluxe-3-speed-belt-drive-suitcase-turnt" } as Product,
  { ...p8, slug: "digital-conversion-turntable" } as Product,
  { ...p9, slug: "gator-trombone-case" } as Product,
  { ...p10, slug: "gibson-2016-t-les-paul-studio-50-s-tribu" } as Product,
  { ...p11, slug: "gibson-custom-l5-premier-acoustic-guitar" } as Product,
  { ...p12, slug: "handcrafted-blue-acoustic-violin" } as Product,
  { ...p13, slug: "handcrafted-wood-acoustic-violin" } as Product,
  { ...p14, slug: "hercules-djcontrol-instinct-s-series" } as Product,
  { ...p15, slug: "hercules-ds513bb-2-trumpet" } as Product,
  { ...p16, slug: "high-definition-studio-monitor-headphone" } as Product,
  { ...p17, slug: "meinl-cymbals-arena-marching-cymbals-pai" } as Product,
  { ...p18, slug: "micromall-tm-paint-gold-drop-b" } as Product,
  { ...p19, slug: "microphones-yeti-usb-microphone" } as Product,
  { ...p20, slug: "mxx-v22r-large-capsule-condenser-microp" } as Product,
  { ...p21, slug: "new-trumpet-gig-bag-case-with-nylon" } as Product,
  { ...p22, slug: "panasonic-stereo-monitor-headphones" } as Product,
  { ...p23, slug: "photive-soultracks-portable-3-speed-turn" } as Product,
  { ...p24, slug: "pioneer-ddjsr-pro-dj-controller" } as Product,
  { ...p25, slug: "plastic-trumpet-white" } as Product,
  { ...p26, slug: "pro-dj-ddj-wego3-k-dj-controller" } as Product,
  { ...p27, slug: "product-horn" } as Product,
  { ...p28, slug: "professional-studio-monitor-headphones" } as Product,
  { ...p29, slug: "protec-deluxe-trumpet-bag-instrument-cas" } as Product,
  { ...p30, slug: "soyuz-tube-condenser-microphone" } as Product,
  { ...p31, slug: "tama-s-l-p-big-black-steel-snare-drum" } as Product,
  { ...p32, slug: "tromba-pro-professional-plastic-bb" } as Product,
  { ...p33, slug: "usb-dj-controller-with-trigger-pads" } as Product,
]

const allPosts: BlogPost[] = [
  { ...b0, slug: "post-0-marshall-woburn-bluetooth-speaker" } as BlogPost,
  { ...b1, slug: "post-1-limited-products-information-update" } as BlogPost,
  { ...b2, slug: "post-2-voco-pro-symphony-headphone" } as BlogPost,
  { ...b3, slug: "post-3-adjustable-online-bass-guitar-tuner" } as BlogPost,
  { ...b4, slug: "post-4-how-to-tune-your-banjo-using-a-piano" } as BlogPost,
  { ...b5, slug: "post-5-buying-and-selling-violin-guide" } as BlogPost,
  { ...b6, slug: "post-6-the-science-of-tuning-musical-instrument" } as BlogPost,
  { ...b7, slug: "post-7-evaluating-a-used-musical-instrument" } as BlogPost,
  { ...b8, slug: "post-8-automated-musical-instruments" } as BlogPost,
]

export function getProducts(): Product[] { return allProducts }
export function getProduct(slug: string): Product | undefined { return allProducts.find(p => p.slug === slug) }
export function getProductsByCategory(cat: string): Product[] { return allProducts.filter(p => p.categories?.some(c => c.toLowerCase().includes(cat.toLowerCase().replace(/-/g, " ")))) }
export function getSaleProducts(): Product[] { return allProducts.slice(0, 8) }
export function getBestSellers(): Product[] { return allProducts.slice(0, 4) }
export function getFeaturedProducts(): Product[] { return allProducts.slice(4, 12) }
export function getRelatedProducts(slug: string, limit = 4): Product[] { return allProducts.filter(p => p.slug !== slug).slice(0, limit) }
export function getCategories(): string[] { const s = new Set<string>(); allProducts.forEach(p => p.categories?.forEach(c => s.add(c))); return Array.from(s) }
export function getBlogPosts(): BlogPost[] { return allPosts }
export function getBlogPost(slug: string): BlogPost | undefined { return allPosts.find(p => p.slug === slug) }
export function formatPrice(p: string): number { if (!p) return 0; const m = p.match(/\$([\d,.]+)/); return m ? parseFloat(m[1].replace(/,/g, "")) : 0 }
export function formatUSD(n: number): string { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n) }