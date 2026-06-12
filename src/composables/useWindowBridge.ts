import { onMounted, onUnmounted } from 'vue'
import { useDslStore } from '@/stores/dsl'
import { usePreviewStore } from '@/stores/preview'

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
    const input  = document.createElement('input')
    input.type   = 'file'
    input.accept = '.zip,application/zip'

    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const JSZip = (await import('jszip')).default
        const zip   = await JSZip.loadAsync(file)

        // Find .txt file (ignore macOS metadata)
        const txtKey = Object.keys(zip.files).find(
          p => !zip.files[p].dir && p.endsWith('.txt') && !p.startsWith('__MACOSX')
        )
        if (!txtKey) {
          previewStore.setError('ZIP 中未找到 .txt 文件')
          return
        }

        // Read as binary stream (ArrayBuffer)
        const buffer = await zip.files[txtKey].async('arraybuffer')
        previewStore.setTxt(buffer)
        console.log(`[ZIP] loaded txt: ${txtKey}, bytes: ${buffer.byteLength}`)
      } catch (err) {
        previewStore.setError(`解压失败: ${(err as Error).message}`)
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
