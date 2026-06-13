import { onMounted, onUnmounted } from 'vue'
import { useDslStore } from '@/stores/dsl'
import { usePreviewStore } from '@/stores/preview'
import type { ZipResource } from '@/types/dsl'

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
  let zipInput: HTMLInputElement | null = null

  async function uploadZip() {
    if (zipInput) {
      zipInput.value = ''
    } else {
      zipInput = document.createElement('input')
      zipInput.type   = 'file'
      zipInput.accept = '.zip,application/zip'
      zipInput.onchange = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return

        try {
          const JSZip = (await import('jszip')).default
          const zip   = await JSZip.loadAsync(file)

          const entries = Object.keys(zip.files).filter(
            p => !zip.files[p].dir && !p.startsWith('__MACOSX')
          )

          if (entries.length === 0) {
            previewStore.setError('ZIP 中未找到任何文件')
            return
          }

          const resList: ZipResource[] = []
          let txtBuf: ArrayBuffer | null = null
          const svgMap: Record<string, string> = {}
          let hexStr = ''

          const MIME: Record<string, string> = {
            '.svg':  'image/svg+xml',
            '.png':  'image/png',
            '.jpg':  'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif':  'image/gif',
            '.webp': 'image/webp',
            '.css':  'text/css',
            '.js':   'text/javascript',
            '.html': 'text/html',
            '.json': 'application/json',
          }

          for (const key of entries) {
            const ext  = key.slice(key.lastIndexOf('.')).toLowerCase()
            const mime = MIME[ext] || 'application/octet-stream'

            if (ext === '.txt') {
              const rawTxt = await zip.files[key].async('string')
              hexStr = rawTxt.replace(/^<!--.*?-->\n?/, '')
              txtBuf = await zip.files[key].async('arraybuffer')
              const blob = new Blob([txtBuf], { type: 'text/plain' })
              const url  = URL.createObjectURL(blob)
              resList.push({ filename: key, blobUrl: url, mimeType: mime, content: txtBuf })
            } else if (ext === '.svg') {
              const svgText = await zip.files[key].async('string')
              const bareName = key.replace(/^.*?([^/]+)\.svg$/, '$1')
              svgMap[bareName] = svgText
              const buf  = await zip.files[key].async('arraybuffer')
              const blob = new Blob([buf], { type: mime })
              const url  = URL.createObjectURL(blob)
              resList.push({ filename: key, blobUrl: url, mimeType: mime })
            } else {
              const buf  = await zip.files[key].async('arraybuffer')
              const blob = new Blob([buf], { type: mime })
              const url  = URL.createObjectURL(blob)
              resList.push({ filename: key, blobUrl: url, mimeType: mime })
            }
          }

          previewStore.setResources(resList)
          if (txtBuf) previewStore.setTxt(txtBuf)
          previewStore.setHexData(hexStr)
          previewStore.setSvgMap(svgMap)
          console.log(`[ZIP] loaded ${resList.length} files, hex: ${hexStr.length} chars, svgs: ${Object.keys(svgMap).join(',')}`)

          setTimeout(() => {
            if (typeof window.runPlugin === 'function') window.runPlugin()
          }, 300)
        } catch (err) {
          previewStore.setError(`解压失败: ${(err as Error).message}`)
          console.error('[ZIP] Extract failed:', err)
        }
      }
    }

    zipInput.click()
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
