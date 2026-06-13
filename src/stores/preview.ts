import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePreviewStore = defineStore('preview', () => {
  const src        = ref('')
  const error      = ref('')
  const txtContent = ref<ArrayBuffer | null>(null)
  let _cleanup: (() => void) | null = null

  function load(url: string, cleanup?: () => void) {
    if (_cleanup) _cleanup()
    src.value   = url
    error.value = ''
    _cleanup    = cleanup ?? null
  }

  function setError(msg: string) {
    error.value = msg
    src.value   = ''
  }

  function setTxt(buffer: ArrayBuffer) {
    txtContent.value = buffer
    error.value      = ''
  }

  function clear() {
    if (_cleanup) _cleanup()
    src.value        = ''
    error.value      = ''
    txtContent.value = null
    _cleanup         = null
  }

  return { src, error, txtContent, load, setError, setTxt, clear }
})
