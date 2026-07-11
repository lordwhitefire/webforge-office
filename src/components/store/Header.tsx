"use client"
import Link from "next/link"
import { useState } from "react"
import { Menu, X, Search, ShoppingCart, ChevronDown, Truck, Phone, User } from "lucide-react"
import { useCart } from "@/lib/cart-store"

interface NavItem {
  label: string
  href: string
  dropdown?: { label: string; href: string }[]
}

const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Features",
    href: "/about",
    dropdown: [
      { label: "About Us", href: "/about" },
      { label: "Our Services", href: "/our-services" },
      { label: "Our Staff", href: "/our-staff" },
      { label: "Gallery", href: "/gallery" },
      { label: "Contacts", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Blog", href: "/blog" },
      { label: "Shop", href: "/shop" },
    ],
  },
  {
    label: "Band & Orchestra",
    href: "/category/band-orchestra",
    dropdown: [
      { label: "Bags and Cases", href: "/category/bags-and-cases" },
      { label: "Instruments", href: "/category/instruments" },
      { label: "Mouthpieces", href: "/category/mouthpieces" },
      { label: "Orchestral Strings", href: "/category/orchestral-strings" },
      { label: "Upright Basses", href: "/category/upright-basses" },
    ],
  },
  {
    label: "Recording",
    href: "/category/recording",
    dropdown: [
      { label: "Audio Interfaces", href: "/category/audio-interfaces" },
      { label: "Audio Workstations", href: "/category/audio-workstations" },
      { label: "MIDI Controllers", href: "/category/midi-controllers" },
      { label: "MIDI Interfaces", href: "/category/midi-interfaces" },
      { label: "Software", href: "/category/software" },
    ],
  },
  {
    label: "DJ & Karaoke",
    href: "/category/dj-karaoke",
    dropdown: [
      { label: "Accessories", href: "/category/accessories" },
      { label: "Controllers", href: "/category/controllers" },
      { label: "Headphones", href: "/category/headphones" },
      { label: "Mixers", href: "/category/mixers" },
      { label: "Turntables", href: "/category/turntables" },
    ],
  },
  { label: "Sale", href: "/sale" },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const count = useCart(s => s.getCount())

  return (
    <header className="sticky top-0 z-50 bg-[#141618]">
      {/* Top utility bar — bg #1A1C1F per crawled CSS */}
      <div className="border-b border-[#33383D]/50 bg-[#1A1C1F] px-4 py-1.5 text-[11px] text-[#9B9C9E]">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Truck className="h-3 w-3 text-[#E21818]" />
            Free Shipping On All Orders Over $100
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-[#E21818]" />
              Support Anytime 123-456-7890
            </span>
            <Link href="/login" className="flex items-center gap-1 text-[#E21818] hover:underline">
              <User className="h-3 w-3" />
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* Logo bar — centered logo per screenshot */}
      <div className="border-b border-[#33383D]/30 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-center">
          <Link href="/" className="flex items-center gap-3">
            <img src="/musicplace/logo-dark.png" alt="SOUND MUSIC STORE" className="h-12 w-auto" />
          </Link>
        </div>
      </div>

      {/* Nav bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {NAV.map((item) => (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => item.dropdown && setOpenDropdown(item.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-1 px-4 py-2 text-sm font-medium ${
                  item.label === "Home" ? "text-white" : "text-[#9B9C9E]"
                } hover:text-white`}
              >
                {item.label}
                {item.dropdown && <ChevronDown className="h-3 w-3" />}
              </Link>
              {/* Active underline for Home */}
              {item.label === "Home" && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#E21818]" />
              )}
              {/* Dropdown */}
              {item.dropdown && openDropdown === item.label && (
                <div className="absolute left-0 top-full min-w-[200px] border border-[#33383D] bg-[#141618] py-2 shadow-xl">
                  {item.dropdown.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className="block px-4 py-2 text-sm text-[#9B9C9E] hover:bg-[#1A1C1F] hover:text-[#E21818]"
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right side: search + cart */}
        <div className="flex items-center gap-3">
          <button className="text-[#9B9C9E] hover:text-white">
            <Search className="h-5 w-5" />
          </button>
          <Link
            href="/cart"
            className="flex items-center gap-1.5 rounded border border-[#33383D] bg-transparent px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1A1C1F]"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>{count}</span>
          </Link>
          <button
            className="text-[#9B9C9E] md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t border-[#33383D] bg-[#141618] px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <div key={item.label} className="border-b border-[#33383D]/50 py-2">
              <Link
                href={item.href}
                className="block py-1 text-sm font-medium text-[#9B9C9E]"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
              {item.dropdown && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.dropdown.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className="block py-1 text-xs text-[#5C5D5E]"
                      onClick={() => setMobileOpen(false)}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      )}
    </header>
  )
}
