import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ZipResource } from '@/types/dsl'

export const usePreviewStore = defineStore('preview', () => {
  const src        = ref('')
  const error      = ref('')
  const txtContent = ref<ArrayBuffer | null>(null)
  const resources  = ref<ZipResource[]>([])
  const hexData    = ref('')
  const resourceMap     = ref<Record<string, string>>({})
  const version    = ref(0)
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

  function setResources(list: ZipResource[]) {
    resources.value.forEach(r => URL.revokeObjectURL(r.blobUrl))
    resources.value = list
    error.value     = ''
  }

  function setHexData(hex: string) {
    hexData.value = hex
    version.value++
  }

  function setResourceMap(map: Record<string, string>) {
    resourceMap.value = map
  }

  function clear() {
    if (_cleanup) _cleanup()
    resources.value.forEach(r => URL.revokeObjectURL(r.blobUrl))
    src.value        = ''
    error.value      = ''
    txtContent.value = null
    resources.value  = []
    hexData.value    = ''
    resourceMap.value     = {}
    _cleanup         = null
  }

  return {
    src, error, txtContent, resources, hexData, resourceMap, version,
    load, setError, setTxt, setResources, setHexData, setResourceMap, clear,
  }
})
