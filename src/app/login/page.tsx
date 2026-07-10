import { Header } from "@/components/store/Header"
import { Footer } from "@/components/store/Footer"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="mb-6 text-2xl font-bold text-white">Login</h1>
          <p className="text-[#9B9C9E]">This page is under construction.</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
