import { Header } from "@/components/store/Header"
import { Footer } from "@/components/store/Footer"
import { getProduct, getProducts, formatPrice, formatUSD } from "@/lib/data"
import { ProductCard } from "@/components/store/ProductCard"
import { notFound } from "next/navigation"

export async function generateStaticParams() {
  return getProducts().map(p => ({ slug: p.slug }))
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) notFound()
  const related = getProducts().filter(p => p.slug !== slug).slice(0, 4)
  const price = formatPrice(product.price)
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="aspect-square rounded-lg bg-[#1A1C1F]">
              {product.mainImage && <img src={product.mainImage} alt={product.name} className="h-full w-full rounded-lg object-cover" />}
            </div>
            <div>
              <h1 className="mb-2 text-2xl font-bold text-white">{product.name}</h1>
              <p className="mb-4 text-xl font-bold text-[#E21818]">{price > 0 ? formatUSD(price) : "Price on request"}</p>
              {product.shortDescription && <p className="mb-4 text-sm text-[#9B9C9E]" dangerouslySetInnerHTML={{ __html: product.shortDescription }} />}
              <div className="mb-4 text-sm text-[#9B9C9E]"><span className="font-bold text-white">SKU:</span> {product.sku || "N/A"}</div>
              <button className="rounded bg-[#E21818] px-6 py-3 text-sm font-bold text-white hover:bg-[#C51515]">Add to Cart</button>
            </div>
          </div>
          {product.fullDescription && (
            <div className="mt-12">
              <h2 className="mb-4 text-lg font-bold text-white">Description</h2>
              <div className="text-sm text-[#9B9C9E]" dangerouslySetInnerHTML={{ __html: product.fullDescription }} />
            </div>
          )}
          {related.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-6 text-lg font-bold text-white">Related Products</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{related.map(p => <ProductCard key={p.slug} product={p} />)}</div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
