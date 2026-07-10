import type { Metadata } from "next"
import { Hind, Lato } from "next/font/google"
import "./globals.css"

const hind = Hind({ subsets: ["latin"], variable: "--font-hind", weight: ["300", "400", "600", "700"] })
const lato = Lato({ subsets: ["latin"], variable: "--font-lato", weight: ["300", "400", "700"] })

export const metadata: Metadata = {
  title: "Music Place — Professional Music Equipment & Instruments",
  description: "Your premier destination for professional music instruments, recording equipment, and DJ gear.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hind.variable} ${lato.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
