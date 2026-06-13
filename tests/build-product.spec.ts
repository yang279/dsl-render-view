import { test, expect } from '@playwright/test'

test.describe('dsl-render-view build product', () => {
  test('page loads and renders Vue app', async ({ page }) => {
    await page.goto('/')
    const app = page.locator('#app')
    await expect(app).toBeVisible()
    const childDivs = app.locator('div')
    expect(await childDivs.count()).toBeGreaterThan(0)
  })

  test('editor page renders by default', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL(/\/editor/)
    await expect(page).toHaveURL(/\/editor/)
  })

  test('window.uploadDsl exists', async ({ page }) => {
    await page.goto('/')
    const exists = await page.evaluate(() => typeof window.uploadDsl === 'function')
    expect(exists).toBe(true)
  })

  test('window.downloadDsl exists', async ({ page }) => {
    await page.goto('/')
    const exists = await page.evaluate(() => typeof window.downloadDsl === 'function')
    expect(exists).toBe(true)
  })

  test('window.uploadZip exists as a function', async ({ page }) => {
    await page.goto('/')
    const result = await page.evaluate(() => {
      return typeof window.uploadZip === 'function'
    })
    expect(result).toBe(true)
  })

  test('uploadDsl loads DSL and renders wireframe nodes', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL(/\/editor/)

    const dslJson = JSON.stringify([
      {
        nid: 1, tag: 'div',
        rect: { x: 0, y: 0, w: 375, h: 100 },
        layerType: 'frame', layerName: 'root', layerDescription: 'root container',
        style: {}
      },
      {
        nid: 2, tag: 'span',
        rect: { x: 16, y: 16, w: 24, h: 24 },
        layerType: 'icon', layerName: 'icon', layerDescription: 'test icon',
        style: {}
      },
    ])

    await page.evaluate((json) => {
      const data = JSON.parse(json)
      const pinia = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__?.stores?.dsl
      if (pinia) {
        pinia.setNodes(data, 'test.json')
        return
      }

      const app = document.querySelector('#app')?.__vue_app__
      if (app) {
        const pinia = app._context.config.globalProperties.$pinia
        const dslStore = pinia._s.get('dsl')
        if (dslStore) {
          dslStore.setNodes(data, 'test.json')
        }
      }
    }, dslJson)

    await page.waitForTimeout(500)

    const container = page.locator('.bg-slate-100')
    await expect(container).toBeVisible()
    const nodes = container.locator('[title]')
    expect(await nodes.count()).toBeGreaterThan(0)
  })

  test('preview page has URL input and navigate button', async ({ page }) => {
    await page.goto('/#/preview')
    await page.waitForURL(/#\/preview/)
    const input = page.locator('input[placeholder="输入 URL..."]')
    await expect(input).toBeVisible()
    const btn = page.locator('button:has-text("跳转")')
    await expect(btn).toBeVisible()
  })

  test('no debug badge rendered', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL(/\/editor/)
    const badge = page.locator('.sticky.bottom-2')
    expect(await badge.count()).toBe(0)
  })
})
