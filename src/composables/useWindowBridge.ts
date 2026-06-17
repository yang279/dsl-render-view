import { onMounted, onUnmounted } from 'vue'
import { useDslStore } from '@/stores/dsl'
import { usePreviewStore } from '@/stores/preview'
import type { ZipResource } from '@/types/dsl'

const DSL_TO_HEX_URL = 'http://localhost:3204/dsl-to-hex/convert'

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

export function useWindowBridge() {
  const dslStore     = useDslStore()
  const previewStore = usePreviewStore()

  // ── shared: extract ZIP buffer → previewStore ─────────────────────
  async function processZipBuffer(buffer: ArrayBuffer) {
    const JSZip = (await import('jszip')).default
    const zip   = await JSZip.loadAsync(buffer)

    const entries = Object.keys(zip.files).filter(
      p => !zip.files[p].dir && !p.startsWith('__MACOSX')
    )

    if (entries.length === 0) {
      previewStore.setError('ZIP 中未找到任何文件')
      return
    }

    const resList: ZipResource[] = []
    let txtBuf: ArrayBuffer | null = null
    const resourceMap: Record<string, string | Uint8Array> = {}
    let hexStr = ''

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
        const bareName = key.replace(/^.*\/([^/]+)$/, '$1')
        resourceMap[bareName] = svgText
        const buf  = await zip.files[key].async('arraybuffer')
        const blob = new Blob([buf], { type: mime })
        const url  = URL.createObjectURL(blob)
        resList.push({ filename: key, blobUrl: url, mimeType: mime })
      } else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp' || ext === '.gif') {
        const buf      = await zip.files[key].async('arraybuffer')
        const bytes    = new Uint8Array(buf)
        const detached = new Uint8Array(bytes)
        const bareName = key.replace(/^.*\/([^/]+)$/, '$1')
        resourceMap[bareName] = detached
        const blob = new Blob([buf], { type: mime })
        const url  = URL.createObjectURL(blob)
        resList.push({ filename: key, blobUrl: url, mimeType: mime, content: bytes })
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
    previewStore.setResourceMap(resourceMap)
    console.log(`[ZIP] loaded ${resList.length} files, hex: ${hexStr.length} chars, svgs: ${Object.keys(resourceMap).join(',')}`)
  }

  // ── DSL: apply parsed data (shared by file upload & postMessage) ──
  function applyDslData(data: unknown, name = '') {
    dslStore.setNodes(Array.isArray(data) ? data : [data], name)
  }

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
          applyDslData(data, file.name)
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
          await processZipBuffer(await file.arrayBuffer())
        } catch (err) {
          previewStore.setError(`解压失败: ${(err as Error).message}`)
          console.error('[ZIP] Extract failed:', err)
        }
      }
    }

    zipInput.click()
  }

  // ── DSL → pipeline API → ZIP → Pixso ─────────────────────────────
  async function uploadDslToPipeline() {
    const input = document.createElement('input')
    input.type   = 'file'
    input.accept = '.json,application/json'
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      // POST design-dsl JSON to dsl-to-hex/convert
      try {
        const text = await file.text()
        const json = JSON.parse(text)

        console.log(`[DslToHex] Submitting ${file.name} to ${DSL_TO_HEX_URL}`)
        const res = await fetch(DSL_TO_HEX_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: res.statusText }))
          previewStore.setError(`dsl-to-hex 请求失败: ${body.error || res.statusText}`)
          return
        }

        const result = await res.json()
        if (!result.zip) {
          previewStore.setError(`dsl-to-hex 未返回 zip: ${result.error ?? '未知错误'}`)
          return
        }

        if (result.missing_keys?.length) {
          console.warn('[DslToHex] missing_keys:', result.missing_keys)
        }

        // decode base64 ZIP
        const binaryStr = atob(result.zip)
        const bytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)

        await processZipBuffer(bytes.buffer)
      } catch (err) {
        previewStore.setError(`dsl-to-hex 异常: ${(err as Error).message}`)
        console.error('[DslToHex] Failed:', err)
      }
    }
    input.click()
  }

  // ── DSL: clear wireframe ──────────────────────────────────────────
  function clearDsl() {
    dslStore.setNodes([], '')
  }

  // ── postMessage bridge ────────────────────────────────────────────
  function onMessage(event: MessageEvent) {
    console.log(event)
    if (event.data?.type === 'NODE_DSL_JSON') {
      const payload = event.data.payload
      if (!payload) return
      applyDslData(payload)
    } else if (event.data?.type === 'NODE_DSL_CLEAR') {
      clearDsl()
    }
  }

  onMounted(() => {
    window.uploadDsl           = uploadDsl
    window.downloadDsl         = downloadDsl
    window.uploadZip           = uploadZip
    window.uploadDslToPipeline = uploadDslToPipeline
    window.clearDsl            = clearDsl
    window.addEventListener('message', onMessage)
  })

  onUnmounted(() => {
    const w = window as unknown as Record<string, unknown>
    delete w.uploadDsl
    delete w.downloadDsl
    delete w.uploadZip
    delete w.uploadDslToPipeline
    delete w.clearDsl
    window.removeEventListener('message', onMessage)
  })
}
