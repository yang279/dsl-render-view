import { defineComponent } from 'vue'
import { RouterView } from 'vue-router'

export default defineComponent({
  name: 'WorkspaceLayout',
  setup() {
    return () => (
      <div class="h-screen">
        <RouterView />
      </div>
    )
  },
})
