import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWorkspaceStore = defineStore('workspace', () => {
  const currentStep = ref(0)

  function nextStep() {
    if (currentStep.value < 1) currentStep.value++
  }

  function prevStep() {
    if (currentStep.value > 0) currentStep.value--
  }

  function goStep(index: number) {
    currentStep.value = index
  }

  return { currentStep, nextStep, prevStep, goStep }
})
