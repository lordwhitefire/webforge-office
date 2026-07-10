import fs from "fs"
import path from "path"

export interface Product {
  name: string
  slug: string
  price: string
  sku: string
  categories: string[]
  tags: string[]
  shortDescription: string
  fullDescription: string
  stock: string
  rating: string
  mainImage: string
  galleryImages: string[]
}

export interface BlogPost {
  title: string
  slug: string
  date: string
  author: string
  categories: string[]
  tags: string[]
  content: string
  image: string
}

const DATA_DIR = path.join(process.cwd(), "musicplace-crawl-extracted", "musicplace-crawl", "data")

export function getProducts(): Product[] {
  const dir = path.join(DATA_DIR, "products")
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"))
  return files.map(f => {
    const slug = f.replace(".json", "")
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"))
    return { ...data, slug } as Product
  })
}

export function getProduct(slug: string): Product | undefined {
  return getProducts().find(p => p.slug === slug)
}

export function getProductsByCategory(category: string): Product[] {
  return getProducts().filter(p =>
    p.categories?.some(c => c.toLowerCase().includes(category.toLowerCase()))
  )
}

export function getSaleProducts(): Product[] {
  return getProducts().slice(0, 8)
}

export function getBestSellers(): Product[] {
  return getProducts().slice(0, 4)
}

export function getFeaturedProducts(): Product[] {
  return getProducts().slice(4, 12)
}

export function getRelatedProducts(slug: string, limit = 4): Product[] {
  const product = getProduct(slug)
  if (!product) return []
  return getProducts().filter(p => p.slug !== slug).slice(0, limit)
}

export function getCategories(): string[] {
  const cats = new Set<string>()
  getProducts().forEach(p => p.categories?.forEach(c => cats.add(c)))
  return Array.from(cats)
}

export function getBlogPosts(): BlogPost[] {
  const dir = path.join(DATA_DIR, "blog")
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".json") && f !== "_all-posts.json")
  return files.map(f => {
    const slug = f.replace(".json", "")
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"))
    return { ...data, slug } as BlogPost
  })
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return getBlogPosts().find(p => p.slug === slug)
}

export function formatPrice(priceString: string): number {
  if (!priceString) return 0
  const match = priceString.match(/\$([\d,.]+)/)
  return match ? parseFloat(match[1].replace(/,/g, "")) : 0
}

export function formatUSD(price: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price)
}
