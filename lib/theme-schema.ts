/**
 * ThemeSchema — AI 一句话换肤主题包（P4-1 交付物，09 方案 Task P4-1）
 *
 * 结构契约：LLM 按 zod schema 结构化输出 → 服务端校验 → 前端预览 → 应用到 :root
 * 应用层复用 P1 令牌体系：主题包即「覆盖版 tokens.css」，CSS 变量天然穿透 Tailwind 桥接
 * 持久化：localStorage（novamind.theme），重置即移除
 */
import { z } from "zod"

/** 6 值色彩 + 圆角 + 字重：最小完备主题包（09 方案 P4-1 契约） */
export const themeSchema = z.object({
  name: z.string().min(1).max(30).describe("主题名称，如「海洋之心」"),
  /** 品牌主色（按钮/高亮/焦点） */
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/, "须为 #RRGGBB"),
  /** 主色悬停态（比 primary 深约 10%） */
  primaryHover: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  /** 渐变端色 A（标题渐变起点） */
  gradientFrom: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  /** 渐变端色 B（标题渐变终点） */
  gradientTo: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  /** 主色发光阴影 rgb 三元组，如 "56 189 248"（不带 #） */
  glowRgb: z
    .string()
    .regex(/^[0-9]{1,3} [0-9]{1,3} [0-9]{1,3}$/),
  /** 全局圆角档位：柔和（2.5rem）/ 标准（1.5rem）/ 利落（0.75rem） */
  radius: z.enum(["soft", "standard", "sharp"]),
  /** 全局字重档位：正文相对偏移 */
  fontWeight: z.enum(["light", "normal", "bold"]),
})

export type ThemePack = z.infer<typeof themeSchema>

/** radius/fontWeight 枚举 → 实际 CSS 值 */
const RADIUS_MAP: Record<ThemePack["radius"], string> = {
  soft: "2.5rem",
  standard: "1.5rem",
  sharp: "0.75rem",
}
const FONT_WEIGHT_MAP: Record<ThemePack["fontWeight"], string> = {
  light: "300",
  normal: "400",
  bold: "600",
}

/** localStorage 键 */
const THEME_STORAGE_KEY = "novamind.theme"

/**
 * 应用主题包到 :root CSS 变量（复用 P1 令牌单一来源，覆盖运行时值）
 * - 渐变/阴影/圆角等衍生令牌同步重算，Tailwind 桥接类（bg-brand/text-brand 等）自动生效
 */
export function applyTheme(pack: ThemePack): void {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.style.setProperty("--brand-primary", pack.primary)
  root.style.setProperty("--brand-primary-hover", pack.primaryHover)
  root.style.setProperty("--brand-gradient", `linear-gradient(90deg, ${pack.gradientFrom}, ${pack.gradientTo})`)
  root.style.setProperty("--brand-gradient-radial", `radial-gradient(circle, rgb(${pack.glowRgb} / 0.3) 0%, transparent 50%)`)
  root.style.setProperty("--shadow-brand", `0 8px 30px rgb(${pack.glowRgb} / 0.25)`)
  root.style.setProperty("--radius-card", RADIUS_MAP[pack.radius])
  root.style.setProperty("--radius-panel", RADIUS_MAP[pack.radius])
  document.body.style.fontWeight = FONT_WEIGHT_MAP[pack.fontWeight]
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(pack))
}

/** 重置为默认主题（清除内联覆盖 + 移除持久化） */
export function resetTheme(): void {
  if (typeof document === "undefined") return
  const root = document.documentElement
  for (const prop of [
    "--brand-primary",
    "--brand-primary-hover",
    "--brand-gradient",
    "--brand-gradient-radial",
    "--shadow-brand",
    "--radius-card",
    "--radius-panel",
  ]) {
    root.style.removeProperty(prop)
  }
  document.body.style.removeProperty("font-weight")
  localStorage.removeItem(THEME_STORAGE_KEY)
}

/** 启动时恢复持久化主题（页面挂载后调用一次） */
export function restoreTheme(): ThemePack | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (!raw) return null
    const parsed = themeSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      localStorage.removeItem(THEME_STORAGE_KEY)
      return null
    }
    applyTheme(parsed.data)
    return parsed.data
  } catch {
    return null
  }
}
