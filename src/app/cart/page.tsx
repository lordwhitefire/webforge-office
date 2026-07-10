"use client"
import { Header } from "@/components/store/Header"
import { Footer } from "@/components/store/Footer"
import { useCart } from "@/lib/cart-store"
import { formatUSD } from "@/lib/data"
import Link from "next/link"

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotal } = useCart()
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="mb-6 text-2xl font-bold text-white">Shopping Cart</h1>
          {items.length === 0 ? (
            <p className="text-[#9B9C9E]">Your cart is empty. <Link href="/shop" className="text-[#E21818] hover:underline">Shop now</Link></p>
          ) : (
            <>
              {items.map(item => (
                <div key={item.id} className="mb-4 flex items-center gap-4 rounded-lg border border-[#33383D] bg-[#1A1C1F] p-4">
                  <div className="h-16 w-16 rounded bg-[#141618]" />
                  <div className="flex-1">
                    <h3 className="text-sm text-white">{item.name}</h3>
                    <p className="text-sm text-[#E21818]">{formatUSD(item.price)}</p>
                  </div>
                  <input type="number" value={item.quantity} min="1" onChange={e => updateQuantity(item.id, parseInt(e.target.value))} className="w-16 rounded border border-[#33383D] bg-[#141618] px-2 py-1 text-white" />
                  <button onClick={() => removeItem(item.id)} className="text-[#9B9C9E] hover:text-[#E21818]">Remove</button>
                </div>
              ))}
              <div className="mt-6 flex justify-between">
                <span className="text-lg font-bold text-white">Total: {formatUSD(getTotal())}</span>
                <Link href="/checkout" className="rounded bg-[#E21818] px-6 py-2 text-sm font-bold text-white">Checkout</Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
