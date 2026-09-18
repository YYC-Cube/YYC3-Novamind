"use client"

// 下一代智能交互入口页 — 聚合多模态交互演示模块

import { Button } from "@/components/ui/button"
import { ArrowLeft, Brain, Hand, Mic, Sparkles } from "lucide-react"
import Link from "next/link"

const modules = [
  { title: "智能思考", href: "/thinking?q=演示&type=deep", icon: Brain, desc: "多步骤深度推理与进度可视化" },
  { title: "结果分析", href: "/results?q=演示", icon: Sparkles, desc: "AI 深度分析结果与章节导航" },
  { title: "语音交互", href: "/pwa-test", icon: Mic, desc: "语音命令 / 后台同步 / PWA 能力自检" },
  { title: "手势导航", href: "/", icon: Hand, desc: "滑动 / 双指缩放 / 触觉反馈" },
]

export default function NextGenInterfacePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> 返回首页
        </Link>
        <h1 className="mt-6 text-3xl font-bold md:text-4xl">下一代智能交互系统</h1>
        <p className="mt-2 text-white/70">融合语音、手势、多模态交互的演示中心</p>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {modules.map((m) => (
            <Link key={m.href} href={m.href}>
              <Button
                variant="outline"
                className="h-auto w-full justify-start gap-4 border-white/20 bg-white/5 p-6 text-left hover:bg-white/10"
              >
                <m.icon className="h-6 w-6 shrink-0 text-purple-300" />
                <span>
                  <span className="block font-semibold">{m.title}</span>
                  <span className="block text-sm text-white/60">{m.desc}</span>
                </span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
