import Link from "next/link"

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#33383D] bg-[#141618]">
      {/* Newsletter band — red per original */}
      <div className="bg-[#E21818] py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold text-white">Stay Updated</h3>
            <p className="text-sm text-white/80">Subscribe for deals, news, and exclusive offers.</p>
          </div>
          <div className="flex w-full max-w-md gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/60"
            />
            <button className="rounded bg-white px-6 py-2 text-sm font-bold text-[#E21818] hover:bg-white/90">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Main footer — 4 columns */}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        {/* Brand column */}
        <div>
          <img src="/musicplace/logo-dark.png" alt="SOUND MUSIC STORE" className="mb-4 h-10 w-auto" />
          <p className="text-sm text-[#9B9C9E]">
            Your premier destination for professional music instruments, recording equipment, and DJ gear.
          </p>
        </div>

        {/* Shop column */}
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase text-white">Shop</h4>
          <ul className="space-y-2 text-sm text-[#9B9C9E]">
            <li><Link href="/shop" className="hover:text-[#E21818]">All Products</Link></li>
            <li><Link href="/sale" className="hover:text-[#E21818]">Sale</Link></li>
            <li><Link href="/category/band-orchestra" className="hover:text-[#E21818]">Band & Orchestra</Link></li>
            <li><Link href="/category/recording" className="hover:text-[#E21818]">Recording</Link></li>
            <li><Link href="/category/dj-karaoke" className="hover:text-[#E21818]">DJ & Karaoke</Link></li>
          </ul>
        </div>

        {/* Company column */}
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase text-white">Company</h4>
          <ul className="space-y-2 text-sm text-[#9B9C9E]">
            <li><Link href="/about" className="hover:text-[#E21818]">About Us</Link></li>
            <li><Link href="/our-services" className="hover:text-[#E21818]">Our Services</Link></li>
            <li><Link href="/our-staff" className="hover:text-[#E21818]">Our Staff</Link></li>
            <li><Link href="/gallery" className="hover:text-[#E21818]">Gallery</Link></li>
            <li><Link href="/contact" className="hover:text-[#E21818]">Contacts</Link></li>
            <li><Link href="/blog" className="hover:text-[#E21818]">Blog</Link></li>
            <li><Link href="/privacy-policy" className="hover:text-[#E21818]">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Account column */}
        <div>
          <h4 className="mb-3 text-sm font-bold uppercase text-white">Account</h4>
          <ul className="space-y-2 text-sm text-[#9B9C9E]">
            <li><Link href="/login" className="hover:text-[#E21818]">Sign In</Link></li>
            <li><Link href="/cart" className="hover:text-[#E21818]">Cart</Link></li>
            <li><Link href="/admin" className="hover:text-[#E21818]">Admin</Link></li>
          </ul>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-[#33383D] py-4">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-[#5C5D5E]">
          © {new Date().getFullYear()} Sound Music Store. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
