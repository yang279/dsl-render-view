import { defineComponent } from 'vue'
import { ElButton } from 'element-plus'

export default defineComponent({
  name: 'HomeView',
  setup() {
    return () => (
      <div class="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 class="text-3xl font-bold text-gray-800">hex-render-view</h1>
        <ElButton type="primary">Get Started</ElButton>
      </div>
    )
  },
})
