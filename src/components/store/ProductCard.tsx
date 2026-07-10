"use client"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { Product, formatPrice, formatUSD } from "@/lib/data"
import { useCart } from "@/lib/cart-store"

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCart(s => s.addItem)
  const price = formatPrice(product.price)

  return (
    <div className="group rounded-lg border border-[#33383D] bg-[#1A1C1F] p-4 transition-colors hover:border-[#E21818]">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="mb-3 aspect-square overflow-hidden rounded bg-[#141618]">
          {product.mainImage && (
            <img src={product.mainImage} alt={product.name} className="h-full w-full object-cover" />
          )}
        </div>
        <h3 className="mb-1 line-clamp-2 text-sm font-medium text-white">{product.name}</h3>
        <p className="text-sm font-bold text-[#E21818]">{price > 0 ? formatUSD(price) : "Price on request"}</p>
      </Link>
      <button
        onClick={() => addItem({ id: product.slug, slug: product.slug, name: product.name, price, image: product.mainImage || "" })}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded bg-[#E21818] py-2 text-xs font-bold text-white hover:bg-[#C51515]"
      >
        <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
      </button>
    </div>
  )
}
