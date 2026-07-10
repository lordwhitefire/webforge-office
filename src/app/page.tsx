import { Header } from "@/components/store/Header"
import { Footer } from "@/components/store/Footer"
import { ProductCard } from "@/components/store/ProductCard"
import { getProducts, getBestSellers, getFeaturedProducts, getBlogPosts } from "@/lib/data"
import { Truck, ShieldCheck, Headphones, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const bestSellers = getBestSellers()
  const featured = getFeaturedProducts()
  const posts = getBlogPosts().slice(0, 3)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero — 4 category tiles per home-1440-01.png */}
        <section className="grid grid-cols-2 gap-0 md:grid-cols-4">
          {[
            { title: "New In Keyboards", sub: "Keyboards & Digital Pianos", link: "/category/midi-controllers", bg: "#1A1C1F" },
            { title: "Musician's Lifestyle", sub: "Microphones & Gear", link: "/category/audio-interfaces", bg: "#1A1C1F" },
            { title: "Shop Accessories", sub: "", link: "/category/accessories", bg: "#1A1C1F" },
            { title: "Mega Sale", sub: "On Every Brand", link: "/sale", bg: "#E21818" },
          ].map((tile, i) => (
            <Link key={i} href={tile.link} className="flex h-64 flex-col justify-center p-8 transition-opacity hover:opacity-90" style={{ backgroundColor: tile.bg }}>
              <h2 className="text-xl font-bold text-white">{tile.title}</h2>
              {tile.sub && <p className="mt-1 text-sm text-[#9B9C9E]">{tile.sub}</p>}
              {tile.title === "Mega Sale" && <span className="mt-4 inline-block w-fit rounded bg-white px-4 py-2 text-xs font-bold text-[#E21818]">SHOP NOW</span>}
            </Link>
          ))}
        </section>

        {/* Features strip */}
        <section className="border-y border-[#33383D] bg-[#1A1C1F]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
            {[
              { Icon: Truck, title: "Free Shipping", text: "On orders over $100" },
              { Icon: ShieldCheck, title: "Secure Payment", text: "100% protected" },
              { Icon: Headphones, title: "24/7 Support", text: "Always here to help" },
              { Icon: RefreshCw, title: "Easy Returns", text: "30-day return policy" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <f.Icon className="h-8 w-8 text-[#E21818]" />
                <div>
                  <p className="text-sm font-bold text-white">{f.title}</p>
                  <p className="text-xs text-[#9B9C9E]">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Best Sellers */}
        <section className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="mb-6 text-center text-2xl font-bold text-white">Best Sellers</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {bestSellers.map(p => <ProductCard key={p.slug} product={p} />)}
          </div>
        </section>

        {/* Featured */}
        <section className="bg-[#1A1C1F] py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-6 text-center text-2xl font-bold text-white">Featured Items</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {featured.map(p => <ProductCard key={p.slug} product={p} />)}
            </div>
          </div>
        </section>

        {/* Blog teaser */}
        <section className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="mb-6 text-center text-2xl font-bold text-white">What's New</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {posts.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="rounded-lg border border-[#33383D] bg-[#1A1C1F] p-4 hover:border-[#E21818]">
                <h3 className="mb-2 text-sm font-medium text-white">{post.title}</h3>
                <p className="text-xs text-[#9B9C9E]">{post.date}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
