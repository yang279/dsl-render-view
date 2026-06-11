import { defineComponent } from 'vue'
import { useDslStore } from '@/stores/dsl'
import IframePanel from '@/components/IframePanel'

export default defineComponent({
  name: 'PreviewPage',
  setup() {
    const store = useDslStore()

    return () => (
      <div class="flex flex-col h-full">
        <IframePanel dslNodes={store.nodes} />
      </div>
    )
  },
})
