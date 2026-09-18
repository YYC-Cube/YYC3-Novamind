import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "YYC³ AI - 无边界智能交互中心",
  description: "基于无边界设计理念的AI智能交互平台，支持语音、手势、眼动等多模态交互方式",
  keywords: ["AI", "搜索", "人工智能", "内容生成", "智能助手"],
  authors: [{ name: "AI搜索团队" }],
  creator: "AI搜索平台",
  publisher: "AI搜索平台",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NovaMind",
  },
  openGraph: {
    type: "website",
    siteName: "YYC³ NovaMind - 星图智语",
    title: "YYC³ NovaMind - 星图智语",
    description: "YYC³ NovaMind 星图智语 - 新一代智能交互平台，融合AI对话、知识图谱、内容生成、学习路径等多维智能能力",
    images: [
      {
        url: "/yyc3-icons/Web App/android-chrome-512.png",
        width: 512,
        height: 512,
        alt: "YYC³ NovaMind - 星图智语",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YYC³ NovaMind - 星图智语",
    description: "YYC³ NovaMind 星图智语 - 新一代智能交互平台，融合AI对话、知识图谱、内容生成、学习路径等多维智能能力",
    images: ["/yyc3-icons/Web App/android-chrome-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  generator: 'v0.app'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="NovaMind" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NovaMind" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/yyc3-icons/Web App/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/yyc3-icons/iOS/iPad Settings.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/yyc3-icons/iOS/iPhone App 3x.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/yyc3-icons/iOS/iPad Spotlight.png" />

        <link rel="icon" type="image/png" sizes="32x32" href="/yyc3-icons/Web App/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/yyc3-icons/Web App/favicon-16.png" />
        <link rel="shortcut icon" href="/yyc3-icons/Web App/favicon-32.png" />

        {/* Service Worker Registration Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(registration) {
                      console.log('✅ SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('❌ SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
