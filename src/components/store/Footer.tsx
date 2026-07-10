import Link from "next/link"

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#33383D] bg-[#141618]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <img src="/musicplace/logo-dark.png" alt="SOUND MUSIC STORE" className="mb-4 h-8 w-auto" />
          <p className="text-sm text-[#9B9C9E]">Professional music instruments, recording equipment, and DJ gear.</p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold text-white">Shop</h4>
          <ul className="space-y-2 text-sm text-[#9B9C9E]">
            <li><Link href="/shop" className="hover:text-[#E21818]">All Products</Link></li>
            <li><Link href="/sale" className="hover:text-[#E21818]">Sale</Link></li>
            <li><Link href="/shop" className="hover:text-[#E21818]">Band & Orchestra</Link></li>
            <li><Link href="/shop" className="hover:text-[#E21818]">Recording</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold text-white">Company</h4>
          <ul className="space-y-2 text-sm text-[#9B9C9E]">
            <li><Link href="/about" className="hover:text-[#E21818]">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-[#E21818]">Contact</Link></li>
            <li><Link href="/blog" className="hover:text-[#E21818]">Blog</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold text-white">Newsletter</h4>
          <p className="mb-2 text-sm text-[#9B9C9E]">Subscribe for deals and updates.</p>
          <div className="flex gap-2">
            <input type="email" placeholder="Your email" className="flex-1 rounded border border-[#33383D] bg-[#1A1C1F] px-3 py-1.5 text-sm text-white" />
            <button className="rounded bg-[#E21818] px-4 py-1.5 text-sm font-bold text-white">Subscribe</button>
          </div>
        </div>
      </div>
      <div className="border-t border-[#33383D] py-4 text-center text-xs text-[#5C5D5E]">
        © {new Date().getFullYear()} Music Place. All rights reserved.
      </div>
    </footer>
  )
}
