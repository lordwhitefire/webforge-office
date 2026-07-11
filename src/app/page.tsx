import { Header } from "@/components/store/Header"
import { Footer } from "@/components/store/Footer"
import { ProductCard } from "@/components/store/ProductCard"
import { getProducts, getBlogPosts } from "@/lib/data"
import { Truck, ShieldCheck, Headphones, RefreshCw, ArrowRight, Play, Quote } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const allProducts = getProducts()
  const bestSellers = allProducts.slice(0, 4)
  const featured = allProducts.slice(4, 8)
  const posts = getBlogPosts().slice(0, 3)

  return (
    <div className="flex min-h-screen flex-col bg-[#141618]">
      <Header />
      <main className="flex-1">
        {/* ─── Hero — person with headphones, text overlay ─── */}
        {/* Per home-1440-01: full-width hero with background image, white text, dark "VIEW MORE" button */}
        <section className="relative flex h-[500px] items-center justify-center overflow-hidden">
          {/* Hero background image — generated image of person with headphones per home-1440-01.png */}
          <div className="absolute inset-0">
            <img src="/musicplace/hero-1.png" alt="Person wearing headphones" className="h-full w-full object-cover opacity-60" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#141618]/50 via-[#141618]/30 to-[#141618]" />
          {/* Text — per screenshot: LEFT-aligned, white, dark "VIEW MORE" button */}
          <div className="relative z-10 mx-auto max-w-7xl px-4 text-left">
            <div className="max-w-xl">
              <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl" style={{ fontFamily: "var(--font-lato)" }}>
                The Headphones You Want.
              </h1>
              <p className="mb-8 text-base text-white/80 md:text-lg">
                Rest assured you're getting some of the best headphones available with our selection of Top Recommended.
              </p>
              <Link
                href="/category/headphones"
                className="inline-block bg-[#1A1C1F] px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#33383D]"
              >
                View More
              </Link>
            </div>
          </div>
        </section>

        {/* ─── 4 Category Tiles — per home-1440-02 ─── */}
        <section className="grid grid-cols-2 md:grid-cols-4">
          {/* Tile 1: New In Keyboards — dark bg, keyboard image */}
          <Link href="/category/midi-controllers" className="group relative flex h-64 flex-col justify-end overflow-hidden bg-[#1A1C1F] p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a2a] to-[#1A1C1F] opacity-60" />
            <div className="relative">
              <h2 className="text-xl font-bold text-white">New In Keyboards</h2>
              <p className="mt-1 text-sm text-[#9B9C9E]">Keyboards & Digital Pianos</p>
            </div>
          </Link>

          {/* Tile 2: Musician's Lifestyle — dark bg, microphone image */}
          <Link href="/category/audio-interfaces" className="group relative flex h-64 flex-col justify-end overflow-hidden bg-[#1A1C1F] p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-[#252525] to-[#1A1C1F] opacity-60" />
            <div className="relative">
              <h2 className="text-xl font-bold text-white">Musician's Lifestyle</h2>
              <p className="mt-1 text-sm text-[#9B9C9E]">Microphones & Gear</p>
              <span className="mt-3 inline-block text-sm font-bold text-[#E21818]">Shop Now</span>
            </div>
          </Link>

          {/* Tile 3: Shop Accessories — dark bg, image only */}
          <Link href="/category/accessories" className="group relative flex h-64 items-center justify-center overflow-hidden bg-[#1A1C1F]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#222] to-[#1A1C1F] opacity-60" />
            <div className="relative">
              <h2 className="text-xl font-bold text-white">Shop Accessories</h2>
            </div>
          </Link>

          {/* Tile 4: Mega Sale — RED bg, per screenshot */}
          <Link href="/sale" className="group relative flex h-64 flex-col justify-center overflow-hidden bg-[#E21818] p-6">
            <div className="relative">
              <h2 className="text-xl font-bold text-white">Mega Sale</h2>
              <p className="mt-1 text-sm text-white/80">On Every Brand</p>
              <span className="mt-4 inline-block rounded bg-white px-4 py-2 text-xs font-bold uppercase text-[#E21818]">
                Shop Now
              </span>
            </div>
          </Link>
        </section>

        {/* ─── Features Strip ─── */}
        <section className="border-y border-[#33383D] bg-[#1A1C1F]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
            {[
              { Icon: Truck, title: "Free Shipping", text: "On orders over $100" },
              { Icon: ShieldCheck, title: "Secure Payment", text: "100% protected" },
              { Icon: Headphones, title: "24/7 Support", text: "123-456-7890" },
              { Icon: RefreshCw, title: "Easy Returns", text: "30-day return policy" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <f.Icon className="h-8 w-8 shrink-0 text-[#E21818]" />
                <div>
                  <p className="text-sm font-bold text-white">{f.title}</p>
                  <p className="text-xs text-[#9B9C9E]">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Best Sellers — per home-1440-02 ─── */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center justify-center gap-4">
              <span className="h-px w-12 bg-[#33383D]" />
              <h2 className="text-2xl font-bold uppercase text-white" style={{ fontFamily: "var(--font-lato)" }}>
                Best Sellers
              </h2>
              <span className="h-px w-12 bg-[#33383D]" />
            </div>
            {/* Filter bar — per screenshot: "Filter - All" (red), categories, "Sort By Date" */}
            <div className="mb-6 flex items-center justify-center gap-4 text-sm">
              <span className="font-bold text-[#E21818]">Filter - All</span>
              <span className="text-[#9B9C9E]">Accessories</span>
              <span className="text-[#9B9C9E]">Drums & Percussion</span>
              <span className="text-[#9B9C9E]">Sort By Date ↓</span>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {bestSellers.map(p => <ProductCard key={p.slug} product={p} />)}
            </div>
          </div>
        </section>

        {/* ─── Featured Items — per home-1440-03 ─── */}
        <section className="bg-[#1A1C1F] py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center justify-center gap-4">
              <span className="h-px w-12 bg-[#33383D]" />
              <h2 className="text-2xl font-bold uppercase text-white" style={{ fontFamily: "var(--font-lato)" }}>
                Featured Items
              </h2>
              <span className="h-px w-12 bg-[#33383D]" />
            </div>
            <div className="mb-6 flex items-center justify-center gap-4 text-sm">
              <span className="font-bold text-[#E21818]">Filter - All</span>
              <span className="text-[#9B9C9E]">Accessories</span>
              <span className="text-[#9B9C9E]">Drums & Percussion</span>
              <span className="text-[#9B9C9E]">Sort By Date ↓</span>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {featured.map(p => <ProductCard key={p.slug} product={p} />)}
            </div>
          </div>
        </section>

        {/* ─── Music Workshop CTA — per home-1440-04 ─── */}
        <section className="relative flex flex-col items-center justify-center overflow-hidden py-20 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-[#141618]" />
          <div className="relative z-10 mx-auto max-w-2xl px-4">
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-[#E21818]">Free Workshops and Classes</p>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl" style={{ fontFamily: "var(--font-lato)" }}>
              Music Workshop
            </h2>
            <p className="mb-8 text-[#9B9C9E]">
              The Workshops Series was created to help people of all levels learn about the instruments and gear they can use to make the music they love.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button className="rounded bg-[#E21818] px-8 py-3 text-sm font-bold uppercase text-white hover:bg-[#C51515]">
                Register Now
              </button>
              <button className="flex items-center gap-2 border border-[#33383D] px-6 py-3 text-sm font-bold uppercase text-white hover:border-white">
                <Play className="h-4 w-4" /> Play Video
              </button>
            </div>
          </div>
        </section>

        {/* ─── What's New (Blog) ─── */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center justify-center gap-4">
              <span className="h-px w-12 bg-[#33383D]" />
              <h2 className="text-2xl font-bold uppercase text-white" style={{ fontFamily: "var(--font-lato)" }}>
                What's New
              </h2>
              <span className="h-px w-12 bg-[#33383D]" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {posts.map(post => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="rounded-lg border border-[#33383D] bg-[#1A1C1F] p-4 transition-colors hover:border-[#E21818]">
                  <h3 className="mb-2 text-sm font-medium text-white">{post.title}</h3>
                  <p className="text-xs text-[#9B9C9E]">{post.date}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
