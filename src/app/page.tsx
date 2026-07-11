import { Header } from "@/components/store/Header"
import { Footer } from "@/components/store/Footer"
import { ProductCard } from "@/components/store/ProductCard"
import { getProducts, getBlogPosts } from "@/lib/data"
import { Truck, ShieldCheck, Headphones, RefreshCw, ArrowRight, Play, Star, Mail } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const allProducts = getProducts()
  // Per home.html: home page shows specific products with images from /uploads/2016/07/ and /uploads/2016/08/
  // Map first 8 products to local home images (best sellers + featured)
  const homeImages = [
    "/musicplace/images/home/1-1.jpg",
    "/musicplace/images/home/2.jpg",
    "/musicplace/images/home/3-2.jpg",
    "/musicplace/images/home/4.jpg",
    "/musicplace/images/home/7-4.jpg",
    "/musicplace/images/home/f.jpg",
    "/musicplace/images/home/horn.jpg",
    "/musicplace/images/home/j.jpg",
  ]
  const bestSellers = allProducts.slice(0, 4).map((p, i) => ({ ...p, _img: homeImages[i] }))
  const featured = allProducts.slice(4, 8).map((p, i) => ({ ...p, _img: homeImages[4 + i] }))
  const posts = getBlogPosts().slice(0, 3)

  return (
    <div className="flex min-h-screen flex-col bg-[#141618]">
      <Header />
      <main className="flex-1">
        {/* ─── Hero — person with headphones, LEFT-aligned text per home-1440-01 ─── */}
        {/* Per crawled CSS: bg image from Depositphotos_28403683_original-2.jpg (extracted from screenshot since original not downloaded) */}
        <section className="relative flex min-h-[535px] items-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/musicplace/hero-original.jpg"
              alt="Person wearing headphones"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#141618]/85 via-[#141618]/30 to-transparent" />
          {/* Left-aligned text per screenshot */}
          <div className="relative z-10 mx-auto w-full max-w-7xl px-4">
            <div className="max-w-xl">
              <h1
                className="mb-4 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl"
                style={{ fontFamily: "var(--font-lato)" }}
              >
                The Headphones You Want.
              </h1>
              <p className="mb-8 text-base text-white/85 md:text-lg">
                Rest assured you&apos;re getting some of the best headphones available with our selection of Top Recommended.
              </p>
              <Link
                href="/category/headphones"
                className="inline-block bg-[#1A1C1F] px-10 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#33383D]"
              >
                View More
              </Link>
            </div>
          </div>
        </section>

        {/* ─── 4 Category Tiles — per home-1440-02 ─── */}
        <section className="grid grid-cols-2 md:grid-cols-4">
          {/* Tile 1: New In Keyboards — dark bg with piano/keyboard image */}
          <Link href="/category/midi-controllers" className="group relative flex h-56 flex-col justify-end overflow-hidden bg-[#1A1C1F] p-6 md:h-64">
            <img
              src="/musicplace/images/home/1-1.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-30 transition-opacity group-hover:opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1C1F] via-[#1A1C1F]/60 to-transparent" />
            <div className="relative">
              <p className="text-xs uppercase tracking-wider text-[#9B9C9E]">Keyboards &amp; Digital Pianos</p>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-lato)" }}>
                New In Keyboards
              </h2>
            </div>
          </Link>

          {/* Tile 2: Musician's Lifestyle — dark bg, red "Shop Now" */}
          <Link href="/category/audio-interfaces" className="group relative flex h-56 flex-col justify-end overflow-hidden bg-[#1A1C1F] p-6 md:h-64">
            <img
              src="/musicplace/images/home/4.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-30 transition-opacity group-hover:opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1C1F] via-[#1A1C1F]/60 to-transparent" />
            <div className="relative">
              <p className="text-xs uppercase tracking-wider text-[#9B9C9E]">Microphones &amp; Gear</p>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-lato)" }}>
                Musician&apos;s Lifestyle
              </h2>
              <span className="mt-2 inline-block text-sm font-bold uppercase text-[#E21818]">Shop Now</span>
            </div>
          </Link>

          {/* Tile 3: Shop Accessories — dark bg */}
          <Link href="/category/accessories" className="group relative flex h-56 items-center justify-center overflow-hidden bg-[#1A1C1F] p-6 md:h-64">
            <img
              src="/musicplace/images/home/7-4.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-25 transition-opacity group-hover:opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1C1F] via-[#1A1C1F]/50 to-transparent" />
            <div className="relative text-center">
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-lato)" }}>
                Shop Accessories
              </h2>
            </div>
          </Link>

          {/* Tile 4: Mega Sale — RED bg per screenshot, black "SHOP NOW" button */}
          <Link href="/sale" className="group relative flex h-56 flex-col justify-center overflow-hidden bg-[#E21818] p-6 md:h-64">
            <div className="relative">
              <h2 className="text-2xl font-bold text-white md:text-3xl" style={{ fontFamily: "var(--font-lato)" }}>
                Mega Sale
              </h2>
              <p className="mt-1 text-sm text-white/85">On Every Brand</p>
              <span className="mt-4 inline-block bg-[#141618] px-5 py-2 text-xs font-bold uppercase tracking-wide text-white">
                Shop Now
              </span>
            </div>
          </Link>
        </section>

        {/* ─── Features Strip — per crawled CSS, red icons on dark bg ─── */}
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

        {/* ─── Best Sellers — per home-1440-02: white product cards, filter bar ─── */}
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
            <div className="mb-6 flex flex-wrap items-center justify-center gap-4 text-sm">
              <span className="font-bold text-[#E21818]">Filter - All</span>
              <span className="text-[#9B9C9E]">Accessories</span>
              <span className="text-[#9B9C9E]">Drums &amp; Percussion</span>
              <span className="text-[#9B9C9E]">Sort By Date ↓</span>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {bestSellers.map(p => (
                <ProductCard key={p.slug} product={p} imageOverride={p._img} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── Brand Logos Row — per home-1440-03: white text logos on dark ─── */}
        <section className="border-y border-[#33383D] bg-[#1A1C1F] py-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4">
            {["TATES", "OKOLO SPORT", "THE QUOTEZONE", "JØRGEN GROTDAL", "TRACT", "FAMOUSTHEORY"].map((b) => (
              <span key={b} className="text-sm font-bold uppercase tracking-wider text-[#9B9C9E] hover:text-white">
                {b}
              </span>
            ))}
          </div>
        </section>

        {/* ─── 3 Promo Banners — per home-1440-03: Save 30%, Sale!, Plug-And-Play ─── */}
        <section className="py-12">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 md:grid-cols-3">
            {/* Banner 1: Save Up To 30% */}
            <div className="relative flex h-64 flex-col justify-end overflow-hidden bg-[#1A1C1F] p-6">
              <img src="/musicplace/images/home/3-2.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141618] via-[#141618]/60 to-transparent" />
              <div className="relative">
                <p className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-lato)" }}>Save Up To 30%</p>
                <p className="mt-1 text-sm text-white/80">On Select Recording Accessories</p>
                <Link href="/category/recording" className="mt-3 inline-block bg-[#E21818] px-5 py-2 text-xs font-bold uppercase text-white hover:bg-[#C51515]">
                  Shop Now
                </Link>
              </div>
            </div>
            {/* Banner 2: Sale! — Marshall speaker with red badge */}
            <div className="relative flex h-64 items-center justify-center overflow-hidden bg-[#1A1C1F] p-6">
              <img src="/musicplace/images/home/5.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
              <div className="absolute inset-0 bg-[#141618]/30" />
              <span className="absolute right-4 top-4 rounded-full bg-[#E21818] px-3 py-1 text-xs font-bold uppercase text-white">
                Sale!
              </span>
            </div>
            {/* Banner 3: Plug-And-Play Recording */}
            <div className="relative flex h-64 flex-col justify-end overflow-hidden bg-[#1A1C1F] p-6">
              <img src="/musicplace/images/home/6.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141618] via-[#141618]/60 to-transparent" />
              <div className="relative">
                <p className="text-sm uppercase tracking-wider text-white/80">Recording Solutions</p>
                <p className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-lato)" }}>
                  Plug-And-Play Recording At Home
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Featured Items — per home-1440-03/04: white product cards ─── */}
        <section className="bg-[#1A1C1F] py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center justify-center gap-4">
              <span className="h-px w-12 bg-[#33383D]" />
              <h2 className="text-2xl font-bold uppercase text-white" style={{ fontFamily: "var(--font-lato)" }}>
                Featured Items
              </h2>
              <span className="h-px w-12 bg-[#33383D]" />
            </div>
            <div className="mb-6 flex flex-wrap items-center justify-center gap-4 text-sm">
              <span className="font-bold text-[#E21818]">Filter - All</span>
              <span className="text-[#9B9C9E]">Accessories</span>
              <span className="text-[#9B9C9E]">Drums &amp; Percussion</span>
              <span className="text-[#9B9C9E]">Sort By Date ↓</span>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {featured.map(p => (
                <ProductCard key={p.slug} product={p} imageOverride={p._img} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── Music Workshop CTA — per home-1440-04 ─── */}
        <section className="relative flex flex-col items-center justify-center overflow-hidden py-20 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-[#141618]" />
          <div className="relative z-10 mx-auto max-w-2xl px-4">
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-[#E21818]">
              Free Workshops and Classes
            </p>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl" style={{ fontFamily: "var(--font-lato)" }}>
              Music Workshop
            </h2>
            <p className="mb-8 text-[#9B9C9E]">
              The Workshops Series was created to help people of all levels learn about the instruments and gear they
              can use to make the music they love.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button className="rounded bg-[#E21818] px-8 py-3 text-sm font-bold uppercase text-white hover:bg-[#C51515]">
                Register Now
              </button>
              <button className="flex items-center gap-2 border border-[#33383D] px-6 py-3 text-sm font-bold uppercase text-white hover:border-white">
                <Play className="h-4 w-4" /> Play Video
              </button>
            </div>
          </div>
        </section>

        {/* ─── What's New (Blog) — per home-1440-05: 3 cards with images + read more ─── */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center justify-center gap-4">
              <span className="h-px w-12 bg-[#33383D]" />
              <h2 className="text-2xl font-bold uppercase text-white" style={{ fontFamily: "var(--font-lato)" }}>
                What&apos;s New
              </h2>
              <span className="h-px w-12 bg-[#33383D]" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {posts.map((post, i) => {
                const postImg = ["/musicplace/images/home/news-1-340x420.jpg", "/musicplace/images/home/news-2-340x420.jpg", "/musicplace/images/home/image-3-340x420.jpg"][i] || "/musicplace/images/home/image-3-340x420.jpg"
                return (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group overflow-hidden bg-[#1A1C1F] transition-colors hover:border-[#E21818]"
                  >
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={postImg}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <p className="mb-2 text-xs text-[#9B9C9E]">
                        {post.date} • by {post.author}
                      </p>
                      <h3 className="mb-3 line-clamp-2 text-base font-bold text-white group-hover:text-[#E21818]">
                        {post.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-[#E21818]">
                        Read More <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* ─── Newsletter + Testimonial — per home-1440-06: red subscribe + dark testimonial ─── */}
        <section className="grid md:grid-cols-2">
          {/* Newsletter — red bg */}
          <div className="flex flex-col justify-center bg-[#E21818] p-10 md:p-14">
            <h3 className="mb-3 text-2xl font-bold text-white" style={{ fontFamily: "var(--font-lato)" }}>
              Subscribe to our Newsletter
            </h3>
            <p className="mb-6 text-sm text-white/85">
              Subscribe to our newsletter to get latest news about our products, events and sales
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 border border-white/30 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/70 focus:border-white focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-2 bg-[#141618] px-5 py-3 text-sm font-bold uppercase text-white hover:bg-[#1A1C1F]"
              >
                <Mail className="h-4 w-4" /> Subscribe
              </button>
            </form>
          </div>
          {/* Testimonial — dark bg */}
          <div className="flex flex-col justify-center bg-[#1A1C1F] p-10 md:p-14">
            <div className="mb-4 text-[#E21818]">
              {/* Quote icon */}
              <svg viewBox="0 0 24 24" className="h-10 w-10 fill-current">
                <path d="M9.5 6C6.5 6 4 8.5 4 11.5V18h6.5v-6.5H7.5C7.5 9.6 8.6 8.5 10 8.5V6h-.5zm10 0C16.5 6 14 8.5 14 11.5V18h6.5v-6.5h-3c0-1.9 1.1-3 2.5-3V6h-.5z" />
              </svg>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-[#9B9C9E]">
              I have purchased several items from this store — guitars, amps, microphones — and every single time the
              service is excellent, the shipping is fast, and the products are top quality. Highly recommended for any
              musician.
            </p>
            <div className="flex items-center gap-3">
              <img
                src="/musicplace/images/home/testi-1-75x75.jpg"
                alt="Kelley Webb"
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-bold uppercase text-white">Kelley Webb</p>
                <p className="text-xs text-[#E21818]">Signer</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Footer Columns — per home-1440-06/07: Featured / Reviews / New Arrivals / Ad ─── */}
        <section className="border-t border-[#33383D] bg-[#141618] py-12">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-4">
            {/* Featured Items column */}
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase text-white">Featured Items</h4>
              <ul className="space-y-3">
                {bestSellers.slice(0, 2).map(p => (
                  <li key={p.slug}>
                    <Link href={`/product/${p.slug}`} className="flex items-center gap-3 group">
                      <img src={p._img} alt="" className="h-14 w-14 object-cover" />
                      <div>
                        <p className="line-clamp-2 text-xs text-[#9B9C9E] group-hover:text-[#E21818]">{p.name}</p>
                        <p className="text-xs font-bold text-[#E21818]">{p.price.match(/\$[\d,.]+/)?.[0] || ""}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* Recent Reviews column */}
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase text-white">Recent Reviews</h4>
              <ul className="space-y-3">
                {featured.slice(0, 2).map(p => (
                  <li key={p.slug}>
                    <Link href={`/product/${p.slug}`} className="flex items-center gap-3 group">
                      <img src={p._img} alt="" className="h-14 w-14 object-cover" />
                      <div>
                        <p className="line-clamp-2 text-xs text-[#9B9C9E] group-hover:text-[#E21818]">{p.name}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="h-2.5 w-2.5 fill-[#E21818] text-[#E21818]" />
                          ))}
                          <span className="ml-1 text-xs text-[#9B9C9E]">by Jack Black</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* New Arrivals column */}
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase text-white">New Arrivals</h4>
              <ul className="space-y-3">
                {allProducts.slice(8, 10).map((p, i) => (
                  <li key={p.slug}>
                    <Link href={`/product/${p.slug}`} className="flex items-center gap-3 group">
                      <img src={`/musicplace/images/home/${i === 0 ? "18-600x800.jpg" : "20-600x800.jpg"}`} alt="" className="h-14 w-14 object-cover" />
                      <div>
                        <p className="line-clamp-2 text-xs text-[#9B9C9E] group-hover:text-[#E21818]">{p.name}</p>
                        <p className="text-xs font-bold text-[#E21818]">{p.price.match(/\$[\d,.]+/)?.[0] || ""}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* Professional Headphones ad */}
            <div className="relative flex flex-col justify-center overflow-hidden bg-[#1A1C1F] p-6">
              <img src="/musicplace/images/home/2-1.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1C1F] to-transparent" />
              <div className="relative">
                <p className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-lato)" }}>
                  Professional Headphones
                </p>
                <Link href="/category/headphones" className="mt-2 inline-block text-sm font-bold uppercase text-[#E21818]">
                  Shop Now!
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
