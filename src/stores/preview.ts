import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePreviewStore = defineStore('preview', () => {
  const src = ref('')
  let _cleanup: (() => void) | null = null

  function load(url: string, cleanup?: () => void) {
    if (_cleanup) _cleanup()
    src.value = url
    _cleanup = cleanup ?? null
  }

  function clear() {
    if (_cleanup) _cleanup()
    src.value = ''
    _cleanup = null
  }

  return { src, load, clear }
})
