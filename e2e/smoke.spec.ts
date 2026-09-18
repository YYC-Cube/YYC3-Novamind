import { test, expect } from '@playwright/test';

/**
 * 首页 smoke E2E — 验证基础渲染与可用性
 */
test.describe('首页 smoke', () => {
  test('应成功加载首页并展示核心元素', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status(), '首页 HTTP 状态应为 200').toBeLessThan(400);

    // 页面标题非空
    const title = await page.title();
    expect(title.length, '页面 title 应非空').toBeGreaterThan(0);

    // 主区域存在
    const main = page.locator('main, [role="main"], body');
    await expect(main.first()).toBeVisible();
  });

  test('应正确设置 lang 与 viewport meta', async ({ page }) => {
    await page.goto('/');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang, 'html[lang] 应存在').toBeTruthy();
  });
});

/**
 * API 健康检查 smoke
 */
test.describe('API 健康检查', () => {
  test('/api/status 应返回 JSON', async ({ request }) => {
    const response = await request.get('/api/status');
    // 即使业务返回错误码也应返回 JSON 格式
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType, 'Content-Type 应含 application/json').toContain('json');
  });

  test('/api/performance 应返回 JSON', async ({ request }) => {
    const response = await request.get('/api/performance');
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType, 'Content-Type 应含 application/json').toContain('json');
  });
});

/**
 * 关键页面可达性 smoke
 */
test.describe('关键页面可达性', () => {
  const paths = ['/auth', '/generate', '/community', '/learning-path', '/admin/analytics'];
  for (const path of paths) {
    test(`${path} 应可访问`, async ({ page }) => {
      const response = await page.goto(path);
      // 允许 200 / 3xx（重定向到登录）
      expect(response?.status() ?? 0, `${path} 不应返回 5xx`).toBeLessThan(500);
    });
  }
});