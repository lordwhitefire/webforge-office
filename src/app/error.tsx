"use client"
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
      <button onClick={reset} className="rounded bg-[#E21818] px-6 py-2 text-sm font-bold text-white">Try Again</button>
    </div>
  )
}
