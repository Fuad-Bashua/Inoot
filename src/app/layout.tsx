import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "@/components/layout/SessionProvider"
import { ServiceWorker } from "@/components/layout/ServiceWorker"
import { AccessibilityApplier } from "@/components/layout/AccessibilityApplier"

const inter = Inter({ subsets: ["latin"] })

// ── Viewport: viewport-fit=cover for iPhone notch/Dynamic Island ──────────
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F8F9FA",
}

// ── App metadata ──────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Inoot — Your Calm Task Assistant",
  description:
    "An AI-powered task manager that supports neurodivergent users with calm, structured, adaptive task management.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Inoot",
  },
  icons: {
    icon: "/images/icon-192.png",
    apple: "/images/icon-192.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-[#F8F9FA] text-[#2D3436] min-h-screen`}
      >
        <SessionProvider>{children}</SessionProvider>
        <ServiceWorker />
        <AccessibilityApplier />
      </body>
    </html>
  )
}
