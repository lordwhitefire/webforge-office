import { Header } from "@/components/store/Header"
import { Footer } from "@/components/store/Footer"
import { ProductCard } from "@/components/store/ProductCard"
import { getProducts } from "@/lib/data"

export default function ShopPage() {
  const products = getProducts()
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="mb-6 text-2xl font-bold text-white">Shop All Products</h1>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map(p => <ProductCard key={p.slug} product={p} />)}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
