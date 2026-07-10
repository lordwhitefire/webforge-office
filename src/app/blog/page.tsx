import { Header } from "@/components/store/Header"
import { Footer } from "@/components/store/Footer"
import { getBlogPosts } from "@/lib/data"
import Link from "next/link"

export default function BlogPage() {
  const posts = getBlogPosts()
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="mb-6 text-2xl font-bold text-white">Blog</h1>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {posts.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="rounded-lg border border-[#33383D] bg-[#1A1C1F] p-4 hover:border-[#E21818]">
                <h3 className="mb-2 text-sm font-medium text-white">{post.title}</h3>
                <p className="text-xs text-[#9B9C9E]">{post.date}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
