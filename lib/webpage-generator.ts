import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface WebpageTemplate {
  id: string
  name: string
  description: string
  category: string
  preview: string
  features: string[]
}

export interface WebpageConfig {
  template: string
  title: string
  description: string
  style: "modern" | "classic" | "creative" | "minimal"
  colorScheme: "blue" | "purple" | "green" | "orange" | "dark"
  layout: "single" | "multi" | "landing"
  features: string[]
  content: {
    hero?: {
      title: string
      subtitle: string
      buttonText: string
    }
    about?: {
      title: string
      content: string
    }
    services?: Array<{
      title: string
      description: string
      icon: string
    }>
    contact?: {
      email: string
      phone: string
      address: string
    }
  }
}

export interface GeneratedWebpage {
  id: string
  config: WebpageConfig
  html: string
  createdAt: Date
  updatedAt: Date
}

export class WebpageGenerator {
  private static templates: WebpageTemplate[] = [
    {
      id: "business-corporate",
      name: "商务企业",
      description: "专业的企业官网模板",
      category: "商务",
      preview: "/templates/webpage-business.jpg",
      features: ["响应式设计", "联系表单", "服务展示", "团队介绍"],
    },
    {
      id: "restaurant-food",
      name: "餐厅美食",
      description: "餐厅和美食网站模板",
      category: "餐饮",
      preview: "/templates/webpage-restaurant.jpg",
      features: ["菜单展示", "在线预订", "图片画廊", "位置地图"],
    },
    {
      id: "portfolio-creative",
      name: "个人作品集",
      description: "创意作品展示网站",
      category: "个人",
      preview: "/templates/webpage-portfolio.jpg",
      features: ["作品展示", "个人简介", "技能展示", "联系方式"],
    },
    {
      id: "ecommerce-shop",
      name: "电商商城",
      description: "在线商店和电商网站",
      category: "电商",
      preview: "/templates/webpage-ecommerce.jpg",
      features: ["产品展示", "购物车", "用户账户", "支付集成"],
    },
    {
      id: "blog-news",
      name: "博客网站",
      description: "博客和新闻发布网站",
      category: "内容",
      preview: "/templates/webpage-blog.jpg",
      features: ["文章发布", "分类标签", "评论系统", "搜索功能"],
    },
    {
      id: "landing-product",
      name: "产品落地页",
      description: "产品推广和营销页面",
      category: "营销",
      preview: "/templates/webpage-landing.jpg",
      features: ["产品介绍", "特性展示", "用户评价", "转化优化"],
    },
  ]

  static getTemplates(): WebpageTemplate[] {
    return this.templates
  }

  static getTemplate(id: string): WebpageTemplate | undefined {
    return this.templates.find((template) => template.id === id)
  }

  static async generateAIContent(prompt: string, template: string): Promise<Partial<WebpageConfig["content"]>> {
    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        system: `你是一个专业的网页内容创作专家。根据用户需求和模板类型，生成适合的网页内容。

要求：
1. 内容要专业、吸引人
2. 符合模板特点和行业特色
3. 包含必要的页面元素
4. 文案要简洁有力

返回JSON格式，包含hero、about、services、contact等部分的内容。`,
        prompt: `请为以下网页需求生成内容：
模板类型：${template}
需求描述：${prompt}

请生成完整的网页内容结构。`,
      })

      try {
        return JSON.parse(text)
      } catch {
        return this.getFallbackContent(template)
      }
    } catch (error) {
      console.error("AI内容生成失败:", error)
      return this.getFallbackContent(template)
    }
  }

  private static getFallbackContent(template: string): Partial<WebpageConfig["content"]> {
    const fallbacks = {
      "business-corporate": {
        hero: {
          title: "专业企业服务",
          subtitle: "为您提供优质的商务解决方案",
          buttonText: "了解更多",
        },
        about: {
          title: "关于我们",
          content: "我们是一家专业的企业服务公司，致力于为客户提供高质量的解决方案。",
        },
      },
      "restaurant-food": {
        hero: {
          title: "美味佳肴等您品尝",
          subtitle: "传统工艺，现代口味",
          buttonText: "查看菜单",
        },
        about: {
          title: "餐厅介绍",
          content: "我们用心烹饪每一道菜，为您带来难忘的用餐体验。",
        },
      },
    }

    return fallbacks[template as keyof typeof fallbacks] || fallbacks["business-corporate"]
  }

  static generateHTML(config: WebpageConfig): string {
    const colors = this.getColorScheme(config.colorScheme)

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title}</title>
    <meta name="description" content="${config.description}">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        /* 导航栏 */
        .navbar {
            background: ${colors.primary};
            color: white;
            padding: 1rem 0;
            position: fixed;
            top: 0;
            width: 100%;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .nav-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            font-size: 1.5rem;
            font-weight: bold;
        }
        
        .nav-links {
            display: flex;
            list-style: none;
            gap: 2rem;
        }
        
        .nav-links a {
            color: white;
            text-decoration: none;
            transition: opacity 0.3s;
        }
        
        .nav-links a:hover {
            opacity: 0.8;
        }
        
        /* 主要内容区域 */
        main {
            margin-top: 80px;
        }
        
        /* Hero 区域 */
        .hero {
            background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
            color: white;
            padding: 6rem 0;
            text-align: center;
        }
        
        .hero h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            font-weight: bold;
        }
        
        .hero p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        
        .btn {
            display: inline-block;
            background: ${colors.accent};
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            transition: all 0.3s;
        }
        
        .btn:hover {
            background: ${colors.accentHover};
            transform: translateY(-2px);
        }
        
        /* 关于我们 */
        .about {
            padding: 6rem 0;
            background: #f8f9fa;
        }
        
        .about h2 {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 3rem;
            color: ${colors.primary};
        }
        
        .about-content {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
            font-size: 1.1rem;
            line-height: 1.8;
        }
        
        /* 服务区域 */
        .services {
            padding: 6rem 0;
        }
        
        .services h2 {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 3rem;
            color: ${colors.primary};
        }
        
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
        }
        
        .service-card {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s;
        }
        
        .service-card:hover {
            transform: translateY(-5px);
        }
        
        .service-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            color: ${colors.accent};
        }
        
        .service-card h3 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: ${colors.primary};
        }
        
        /* 联系我们 */
        .contact {
            padding: 6rem 0;
            background: ${colors.primary};
            color: white;
        }
        
        .contact h2 {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 3rem;
        }
        
        .contact-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            text-align: center;
        }
        
        .contact-item {
            padding: 1rem;
        }
        
        .contact-item h3 {
            font-size: 1.2rem;
            margin-bottom: 0.5rem;
            color: ${colors.accent};
        }
        
        /* 页脚 */
        .footer {
            background: #333;
            color: white;
            text-align: center;
            padding: 2rem 0;
        }
        
        /* 响应式设计 */
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 2rem;
            }
            
            .nav-links {
                display: none;
            }
            
            .services-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <!-- 导航栏 -->
    <nav class="navbar">
        <div class="container">
            <div class="nav-content">
                <div class="logo">${config.title}</div>
                <ul class="nav-links">
                    <li><a href="#home">首页</a></li>
                    <li><a href="#about">关于</a></li>
                    <li><a href="#services">服务</a></li>
                    <li><a href="#contact">联系</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <main>
        <!-- Hero 区域 -->
        <section id="home" class="hero">
            <div class="container">
                <h1>${config.content.hero?.title || config.title}</h1>
                <p>${config.content.hero?.subtitle || config.description}</p>
                <a href="#about" class="btn">${config.content.hero?.buttonText || "了解更多"}</a>
            </div>
        </section>

        <!-- 关于我们 -->
        <section id="about" class="about">
            <div class="container">
                <h2>${config.content.about?.title || "关于我们"}</h2>
                <div class="about-content">
                    <p>${config.content.about?.content || "我们致力于为客户提供优质的服务和解决方案。"}</p>
                </div>
            </div>
        </section>

        <!-- 服务区域 -->
        <section id="services" class="services">
            <div class="container">
                <h2>我们的服务</h2>
                <div class="services-grid">
                    ${
                      config.content.services
                        ?.map(
                          (service) => `
                    <div class="service-card">
                        <div class="service-icon">${service.icon || "🔧"}</div>
                        <h3>${service.title}</h3>
                        <p>${service.description}</p>
                    </div>
                    `,
                        )
                        .join("") ||
                      `
                    <div class="service-card">
                        <div class="service-icon">🔧</div>
                        <h3>专业服务</h3>
                        <p>为您提供专业的解决方案</p>
                    </div>
                    <div class="service-card">
                        <div class="service-icon">💡</div>
                        <h3>创新方案</h3>
                        <p>采用最新技术和创新思维</p>
                    </div>
                    <div class="service-card">
                        <div class="service-icon">🎯</div>
                        <h3>精准定位</h3>
                        <p>准确把握客户需求</p>
                    </div>
                    `
                    }
                </div>
            </div>
        </section>

        <!-- 联系我们 -->
        <section id="contact" class="contact">
            <div class="container">
                <h2>联系我们</h2>
                <div class="contact-info">
                    <div class="contact-item">
                        <h3>邮箱</h3>
                        <p>${config.content.contact?.email || "contact@example.com"}</p>
                    </div>
                    <div class="contact-item">
                        <h3>电话</h3>
                        <p>${config.content.contact?.phone || "400-123-4567"}</p>
                    </div>
                    <div class="contact-item">
                        <h3>地址</h3>
                        <p>${config.content.contact?.address || "北京市朝阳区"}</p>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- 页脚 -->
    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 ${config.title}. 保留所有权利。</p>
        </div>
    </footer>

    <script>
        // 平滑滚动
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // 导航栏滚动效果
        window.addEventListener('scroll', function() {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 100) {
                navbar.style.background = 'rgba(0,0,0,0.9)';
            } else {
                navbar.style.background = '${colors.primary}';
            }
        });
    </script>
</body>
</html>`
  }

  private static getColorScheme(scheme: WebpageConfig["colorScheme"]) {
    const schemes = {
      blue: {
        primary: "#2563EB",
        secondary: "#1E40AF",
        accent: "#3B82F6",
        accentHover: "#1D4ED8",
      },
      purple: {
        primary: "#7C3AED",
        secondary: "#6D28D9",
        accent: "#8B5CF6",
        accentHover: "#7C3AED",
      },
      green: {
        primary: "#059669",
        secondary: "#047857",
        accent: "#10B981",
        accentHover: "#059669",
      },
      orange: {
        primary: "#EA580C",
        secondary: "#C2410C",
        accent: "#F59E0B",
        accentHover: "#D97706",
      },
      dark: {
        primary: "#1F2937",
        secondary: "#111827",
        accent: "#6B7280",
        accentHover: "#4B5563",
      },
    }

    return schemes[scheme] || schemes.blue
  }

  static async generateWebpage(config: WebpageConfig): Promise<GeneratedWebpage> {
    const html = this.generateHTML(config)

    return {
      id: Date.now().toString(),
      config,
      html,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  static saveWebpage(webpage: GeneratedWebpage): void {
    const saved = localStorage.getItem("generated-webpages")
    const webpages = saved ? JSON.parse(saved) : []

    const existingIndex = webpages.findIndex((w: GeneratedWebpage) => w.id === webpage.id)
    if (existingIndex >= 0) {
      webpages[existingIndex] = { ...webpage, updatedAt: new Date() }
    } else {
      webpages.push(webpage)
    }

    localStorage.setItem("generated-webpages", JSON.stringify(webpages))
  }

  static getWebpages(): GeneratedWebpage[] {
    const saved = localStorage.getItem("generated-webpages")
    return saved ? JSON.parse(saved) : []
  }

  static deleteWebpage(id: string): void {
    const saved = localStorage.getItem("generated-webpages")
    if (saved) {
      const webpages = JSON.parse(saved).filter((w: GeneratedWebpage) => w.id !== id)
      localStorage.setItem("generated-webpages", JSON.stringify(webpages))
    }
  }
}
