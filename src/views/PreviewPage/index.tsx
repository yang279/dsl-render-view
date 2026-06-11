import { defineComponent } from 'vue'
import IframePanel from '@/components/IframePanel'

export default defineComponent({
  name: 'PreviewPage',
  setup() {
    return () => (
      <div class="flex flex-col h-full">
        <IframePanel />
      </div>
    )
  },
})
