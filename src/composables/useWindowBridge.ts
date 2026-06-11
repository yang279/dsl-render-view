import { onMounted, onUnmounted } from 'vue'
import { useDslStore } from '@/stores/dsl'
import { usePreviewStore } from '@/stores/preview'

function guessMime(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    html: 'text/html', htm: 'text/html',
    css: 'text/css',
    js: 'application/javascript', mjs: 'application/javascript', cjs: 'application/javascript',
    json: 'application/json',
    svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    gif: 'image/gif', webp: 'image/webp', ico: 'image/x-icon', avif: 'image/avif',
    woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf',
    mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg',
  }
  return map[ext] ?? 'application/octet-stream'
}

export function useWindowBridge() {
  const dslStore     = useDslStore()
  const previewStore = usePreviewStore()

  // ── DSL: upload JSON ──────────────────────────────────────────────
  function uploadDsl() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string)
          dslStore.setNodes(Array.isArray(data) ? data : [data], file.name)
        } catch (err) {
          console.error('[DSL] JSON parse failed:', err)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  // ── DSL: download JSON ────────────────────────────────────────────
  function downloadDsl() {
    const json = JSON.stringify(dslStore.nodes, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${dslStore.sourceName.replace(/\s+/g, '_') || 'dsl'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ── Preview: upload ZIP ───────────────────────────────────────────
  async function uploadZip() {
    const input = document.createElement('input')
    input.type  = 'file'
    input.accept = '.zip,application/zip'

    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const JSZip = (await import('jszip')).default
        const zip   = await JSZip.loadAsync(file)

        // 1. Build filename/path → blob URL map for all assets
        const blobUrls: Record<string, string> = {}
        const allUrls: string[] = []

        for (const [zipPath, entry] of Object.entries(zip.files)) {
          if (entry.dir) continue
          const buf  = await entry.async('arraybuffer')
          const blob = new Blob([buf], { type: guessMime(zipPath) })
          const url  = URL.createObjectURL(blob)
          allUrls.push(url)

          // Register under multiple key forms to maximise hit rate
          blobUrls[zipPath] = url                             // full zip path
          blobUrls[zipPath.replace(/^\.?\/?/, '')] = url     // strip leading ./
          blobUrls[zipPath.split('/').pop()!]      = url     // basename only
        }

        // 2. Locate index.html
        const indexKey = Object.keys(zip.files).find(
          p => !zip.files[p].dir && /(?:^|\/)index\.html?$/i.test(p)
        )
        if (!indexKey) {
          console.error('[ZIP] index.html not found')
          return
        }

        // 3. Read HTML and replace every relative / absolute asset reference
        let html = await zip.files[indexKey].async('text')

        html = html.replace(
          /((?:src|href|action)\s*=\s*["'])([^"'#?]+)(["'])/g,
          (match, prefix, rawPath, suffix) => {
            const key = rawPath.replace(/^\//, '').replace(/^\.\//, '')
            return blobUrls[key] || blobUrls[rawPath]
              ? `${prefix}${blobUrls[key] ?? blobUrls[rawPath]}${suffix}`
              : match
          }
        )
        html = html.replace(
          /url\((['"]?)([^"')]+)\1\)/g,
          (match, quote, rawPath) => {
            const key = rawPath.replace(/^\//, '').replace(/^\.\//, '')
            const url = blobUrls[key] ?? blobUrls[rawPath]
            return url ? `url(${quote}${url}${quote})` : match
          }
        )

        // 4. Create final HTML blob and send to preview store
        const htmlBlob = new Blob([html], { type: 'text/html' })
        const htmlUrl  = URL.createObjectURL(htmlBlob)
        allUrls.push(htmlUrl)

        previewStore.load(htmlUrl, () => allUrls.forEach(u => URL.revokeObjectURL(u)))
      } catch (err) {
        console.error('[ZIP] Extract failed:', err)
      }
    }

    input.click()
  }

  onMounted(() => {
    window.uploadDsl  = uploadDsl
    window.downloadDsl = downloadDsl
    window.uploadZip  = uploadZip
  })

  onUnmounted(() => {
    const w = window as unknown as Record<string, unknown>
    delete w.uploadDsl
    delete w.downloadDsl
    delete w.uploadZip
  })
}
