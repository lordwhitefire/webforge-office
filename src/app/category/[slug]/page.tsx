import { Header } from "@/components/store/Header"
import { Footer } from "@/components/store/Footer"
import { ProductCard } from "@/components/store/ProductCard"
import { getProducts, getProductsByCategory } from "@/lib/data"
import { notFound } from "next/navigation"

export async function generateStaticParams() {
  const cats = new Set<string>()
  getProducts().forEach(p => p.categories?.forEach(c => cats.add(c.toLowerCase().replace(/[^a-z0-9]+/g, "-"))))
  return Array.from(cats).map(slug => ({ slug }))
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const decoded = decodeURIComponent(slug).replace(/-/g, " ")
  const products = getProductsByCategory(decoded)
  if (products.length === 0) notFound()
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="mb-2 text-2xl font-bold text-white capitalize">{decoded}</h1>
          <p className="mb-6 text-sm text-[#9B9C9E]">{products.length} products</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map(p => <ProductCard key={p.slug} product={p} />)}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
