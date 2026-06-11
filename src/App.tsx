import { defineComponent } from 'vue'
import { RouterView } from 'vue-router'
import { useWindowBridge } from '@/composables/useWindowBridge'

export default defineComponent({
  name: 'App',
  setup() {
    useWindowBridge()

    return () => (
      <div class="min-h-screen bg-gray-50">
        <RouterView />
      </div>
    )
  },
})
