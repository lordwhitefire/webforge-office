"use client"
import Link from "next/link"
import { useState } from "react"
import { Menu, X, Search, ShoppingCart } from "lucide-react"
import { useCart } from "@/lib/cart-store"

const NAV = ["Home", "Features", "Band & Orchestra", "Recording", "DJ & Karaoke", "Sale"]

export function Header() {
  const [open, setOpen] = useState(false)
  const count = useCart(s => s.getCount())

  return (
    <header className="sticky top-0 z-50 border-b border-[#33383D] bg-[#141618]">
      {/* Top bar: bg #1A1C1F per crawled CSS */}
      <div className="border-b border-[#33383D]/50 bg-[#1A1C1F] px-4 py-1.5 text-[11px] text-[#9B9C9E]">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span>Free Shipping On All Orders Over $100</span>
          <div className="flex items-center gap-4">
            <span>Support Anytime 123-456-7890</span>
            <Link href="/login" className="text-[#E21818] hover:underline">Login</Link>
          </div>
        </div>
      </div>
      {/* Main bar: bg #141618 per crawled CSS */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <img src="/musicplace/logo-dark.png" alt="SOUND MUSIC STORE" className="h-8 w-auto" />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item, i) => (
            <Link key={item} href={i === 0 ? "/" : i === 5 ? "/sale" : "/shop"} className={`px-3 py-2 text-sm font-medium ${i === 0 ? "text-white" : "text-[#9B9C9E]"} hover:text-white`}>
              {item}
              {i === 0 && <span className="mt-1 block h-0.5 w-full bg-[#E21818]" />}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-[#9B9C9E]" />
          <Link href="/cart" className="relative flex items-center gap-1.5 rounded bg-[#E21818] px-3 py-1.5 text-xs font-bold text-white">
            <ShoppingCart className="h-4 w-4" />
            <span>{count}</span>
          </Link>
          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-[#33383D] bg-[#141618] px-4 py-2 md:hidden">
          {NAV.map((item, i) => (
            <Link key={item} href={i === 0 ? "/" : i === 5 ? "/sale" : "/shop"} className="block py-2 text-sm text-[#9B9C9E]" onClick={() => setOpen(false)}>
              {item}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
