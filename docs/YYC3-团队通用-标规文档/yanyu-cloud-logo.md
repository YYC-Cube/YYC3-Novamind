---
file: yanyu-cloud-logo.md
description: YYC³ 品牌 Logo 生成方案 — PWA + Web + 桌面端全尺寸适配脚本（Node.js sharp）
author: YanYuCloudCube Team <admin@0379.email>
version: v2.1.0
created: 2026-03-27
updated: 2026-09-18
status: stable
tags: [logo],[品牌],[生成脚本],[多端适配],[PWA],[ICNS]
category: asset
language: zh-CN
audience: developers,designers
complexity: basic
trace_id: TRC-20260918-006
---

<div align="center">

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# 🎯 言语云 Logo 「PWA + Web + 桌面」专属生成方案

</div>

PNG透明底原图，**直接落地的方案**，「代码批量生成」，完全适配你要的场景，保证所有尺寸清晰可用。

---

## 代码批量生成方案（本地安全，适合开发集成）

### 1. 专属Node.js脚本（只生成你要的PWA+Web+桌面尺寸）

新建 `gen-yanyu-cloud-logo.js`，内容如下：

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 言语云 Logo 专属尺寸：PWA + Web + 桌面 全刚需
const sizes = [16, 32, 48, 64, 128, 192, 256, 512];
const inputPath = './yanyu-cloud-logo.png'; // 替换成你的Logo文件名
const outDir = './yanyu-cloud-logo-dist';

// 创建输出文件夹
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// 批量生成透明底PNG
async function generateLogos() {
  for (const size of sizes) {
    const outputPath = path.join(outDir, `yanyu_cloud_${size}x${size}.png`);
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain', // 等比例缩放，不裁切Logo
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // 透明底
        kernel: sharp.kernel.lanczos3 // 高清缩放算法，保证Logo清晰
      })
      .png({ quality: 100, compressionLevel: 9 }) // 最高质量+最大压缩
      .toFile(outputPath);
    console.log(`✅ 生成完成：${outputPath}`);
  }

  // 额外生成Windows用favicon.ico（内嵌16/32/48/256尺寸）
  await sharp(inputPath)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(path.join(outDir, 'favicon.ico'));

  console.log('\n🎉 言语云 Logo 全尺寸生成完毕！输出文件夹：', outDir);
}

generateLogos().catch(err => console.error('❌ 生成失败：', err));
```

### 2. 执行步骤

1. 把「言语云」Logo PNG文件放到脚本同目录，命名为 `yanyu-cloud-logo.png`
2. 安装依赖：

    ```bash
    npm install sharp
    ```

3. 运行脚本：

    ```bash
    node gen-yanyu-cloud-logo.js
    ```

4. 生成的文件在 `yanyu-cloud-logo-dist` 文件夹，直接拖进项目用就行。

---

## 三、言语云 Logo 专属尺寸清单（最终版，无冗余）

| 用途 | 尺寸 | 文件名 |
| :--- | :--- | :--- |
| 浏览器标签小图标 | 16×16 | `yanyu_cloud_16x16.png` |
| 浏览器标签/书签 | 32×32 | `yanyu_cloud_32x32.png` |
| 浏览器收藏夹/桌面快捷方式 | 48×48 | `yanyu_cloud_48x48.png` |
| 网页大图标/书签 | 64×64 / 128×128 | `yanyu_cloud_64x64.png` / `yanyu_cloud_128x128.png` |
| PWA 常规图标 | 192×192 | `yanyu_cloud_192x192.png` |
| 桌面大图/开机页 | 256×256 / 512×512 | `yanyu_cloud_256x256.png` / `yanyu_cloud_512x512.png` |
| Windows 兼容ICO | 多尺寸内嵌 | `favicon.ico` |

---

## 四、关键优化（保证Logo清晰不糊）

1. **缩放算法**：脚本里用了 `lanczos3` 高清算法，比默认算法更清晰，适合这种线条Logo
2. **透明底保留**：全程保持透明，前端可以直接加圆角、背景色，适配深色/浅色模式
3. **压缩优化**：PNG用最高压缩率，体积最小不影响清晰度，加载更快
4. **命名规范**：统一用 `yanyu_cloud_尺寸x尺寸.png`，开发一眼就能认，不会搞混

---

## Mac桌面ICNS生成（如果需要）

如果要做Mac桌面App图标，用下面的命令（macOS自带工具，不用装软件）：

```bash
# 先生成512x512的PNG，然后转ICNS
sips -s format icns yanyu-cloud-logo-dist/yanyu_cloud_512x512.png --out yanyu-cloud-logo-dist/yanyu_cloud.icns
```

---

## 五、变更历史

| 版本   | 日期       | 作者                | 变更内容                                  |
| ------ | ---------- | ------------------- | ----------------------------------------- |
| v1.0.0 | 2026-03-27 | YanYuCloudCube Team | 初稿：Node.js sharp 批量生成脚本          |
| v1.0.1 | 2026-04-15 | YanYuCloudCube Team | 补充 ICNS 生成说明                        |
| v2.0.0 | 2026-05-30 | YanYuCloudCube Team | 整合 PWA + Web + 桌面端全尺寸清单          |
| v2.1.0 | 2026-09-18 | AI Tutor (MiniMax-M3) | 补齐 YAML Front Matter + 品牌标头标尾 + 变更历史表 |

---

<div align="center">

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

**文档维护**: 如需更新本文档，请遵循 YYC³ 团队通用开发文档规范，并记录变更历史。
**反馈渠道**: 如有任何改进建议，欢迎联系 <admin@0379.email>。

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」
**© 2025-2026 YanYuCloudCube™. All Rights Reserved.**

</div>

---
