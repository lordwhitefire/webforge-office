import Link from "next/link"
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold text-[#E21818]">404</h1>
      <p className="text-[#9B9C9E]">Page not found</p>
      <Link href="/" className="rounded bg-[#E21818] px-6 py-2 text-sm font-bold text-white">Back Home</Link>
    </div>
  )
}
