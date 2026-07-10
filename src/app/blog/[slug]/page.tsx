import { Header } from "@/components/store/Header"
import { Footer } from "@/components/store/Footer"
import { getBlogPost, getBlogPosts } from "@/lib/data"
import { notFound } from "next/navigation"

export async function generateStaticParams() {
  return getBlogPosts().map(p => ({ slug: p.slug }))
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) notFound()
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8">
          <h1 className="mb-2 text-2xl font-bold text-white">{post.title}</h1>
          <p className="mb-6 text-sm text-[#9B9C9E]">{post.date} · {post.author}</p>
          <div className="prose prose-invert text-[#9B9C9E]" dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
