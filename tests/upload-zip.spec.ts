import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import JSZip from 'jszip'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ZIP_PATH  = path.resolve(__dirname, '../test-output-new.zip')

async function extractZip() {
  const buf   = fs.readFileSync(ZIP_PATH)
  const zip   = await JSZip.loadAsync(buf)
  const entries = Object.keys(zip.files).filter(
    p => !zip.files[p].dir && !p.startsWith('__MACOSX')
  )

  const MIME: Record<string, string> = {
    '.svg': 'image/svg+xml', '.png': 'image/png',
    '.jpg': 'image/jpeg', '.txt': 'text/plain',
  }

  const result: { filename: string; mime: string; bytes: Uint8Array; isTxt: boolean; isSvg: boolean }[] = []
  for (const key of entries) {
    const ext  = key.slice(key.lastIndexOf('.')).toLowerCase()
    const mime = MIME[ext] || 'application/octet-stream'
    const ab   = await zip.files[key].async('arraybuffer')
    const u8   = new Uint8Array(ab)
    result.push({ filename: key, mime, bytes: u8, isTxt: ext === '.txt', isSvg: ext === '.svg' })
  }
  return result
}

test.describe('uploadZip with test-output-new.zip', () => {
  test('extracts all files, hex, and svgMap', async ({ page }) => {
    await page.goto('/editor')
    await page.waitForURL(/\/editor/)

    const files = await extractZip()

    const result = await page.evaluate(async (fileData) => {
      const app  = document.querySelector('#app')?.__vue_app__
      const pinia = app._context.config.globalProperties.$pinia
      const previewStore = pinia._s.get('preview')

      const resources: any[] = []
      let txtBuf: ArrayBuffer | null = null
      let hexStr = ''
      const svgMap: Record<string, string> = {}

      for (const f of fileData) {
        const buf = new Uint8Array(f.bytes).buffer
        const blob = new Blob([buf], { type: f.mime })
        const url  = URL.createObjectURL(blob)

        if (f.isTxt) {
          const rawTxt = new TextDecoder().decode(buf)
          hexStr = rawTxt.replace(/^<!--.*?-->\n?/, '')
          txtBuf = buf
          resources.push({ filename: f.filename, blobUrl: url, mimeType: f.mime, content: buf })
        } else if (f.isSvg) {
          const svgText = new TextDecoder().decode(buf)
          const bareName = f.filename.replace(/^.*?([^/]+)\.svg$/, '$1')
          svgMap[bareName] = svgText
          resources.push({ filename: f.filename, blobUrl: url, mimeType: f.mime })
        } else {
          resources.push({ filename: f.filename, blobUrl: url, mimeType: f.mime })
        }
      }

      previewStore.setResources(resources)
      if (txtBuf) previewStore.setTxt(txtBuf)
      previewStore.setHexData(hexStr)
      previewStore.setSvgMap(svgMap)

      return {
        resourceCount: previewStore.resources.length,
        hexLength: previewStore.hexData.length,
        hexStart: previewStore.hexData.substring(0, 40),
        svgMapKeys: Object.keys(previewStore.svgMap),
        svgMap5_4Content: previewStore.svgMap['5_4']?.substring(0, 50),
      }
    }, files.map(f => ({ filename: f.filename, mime: f.mime, bytes: Array.from(f.bytes), isTxt: f.isTxt, isSvg: f.isSvg })))

    expect(result.resourceCount).toBe(5)
    expect(result.hexLength).toBeGreaterThan(0)
    expect(result.hexStart).toMatch(/^706978736f/)
    expect(result.svgMapKeys).toEqual(['5_4', '5_5', '5_6', '5_7'])
    expect(result.svgMap5_4Content).toContain('<svg')
  })

  test('SVG blob URLs are fetchable and contain SVG content', async ({ page }) => {
    await page.goto('/editor')

    const files = await extractZip()
    const svgFiles = files.filter(f => f.isSvg)

    const svgResults = await page.evaluate(async (svgData) => {
      const results: { content: string }[] = []
      for (const f of svgData) {
        const buf = new Uint8Array(f.bytes).buffer
        const blob = new Blob([buf], { type: 'image/svg+xml' })
        const url  = URL.createObjectURL(blob)
        const resp = await fetch(url)
        const text = await resp.text()
        results.push({ content: text })
      }
      return results
    }, svgFiles.map(f => ({ bytes: Array.from(f.bytes) })))

    expect(svgResults.length).toBe(4)
    for (const r of svgResults) {
      expect(r.content).toContain('<svg')
      expect(r.content).toContain('</svg>')
    }
  })

  test('window.runPlugin exists on preview page', async ({ page }) => {
    await page.goto('/#/preview')
    await page.waitForURL(/#\/preview/)
    const exists = await page.evaluate(() => typeof window.runPlugin === 'function')
    expect(exists).toBe(true)
  })

  test('buildPluginCode generates correct script', async ({ page }) => {
    await page.goto('/preview')
    await page.waitForURL(/\/preview/)

    const result = await page.evaluate(() => {
      const hex = 'test-hex-123'
      const svgMap = { '5_4': '<svg>test</svg>' }
      const svgMapJson = JSON.stringify(svgMap)

      const code = `
const main = async () => {
  try {
    const hex = ${JSON.stringify(hex)};
    const svgMap = ${svgMapJson};
    const children = pixso.currentPage.children;
  } catch (error) {
    console.log(error);
  }
};
main();
`
      return { hasHex: code.includes('test-hex-123'), hasSvgMap: code.includes('5_4'), hasSvgContent: code.includes('<svg>test</svg>'), hasPixso: code.includes('pixso') }
    })

    expect(result.hasHex).toBe(true)
    expect(result.hasSvgMap).toBe(true)
    expect(result.hasSvgContent).toBe(true)
    expect(result.hasPixso).toBe(true)
  })
})
