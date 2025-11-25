<template>
  <component 
    :is="componentType" 
    :content="message.content"
    :state="state"
    :title="message.title"
  />
</template>

<script setup>
import { defineProps, computed } from 'vue'
import TextMessage from './TextMessage.vue'
import CardMessage from './CardMessage.vue'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  state: {
    type: String,
    default: 'success'
  }
})

const componentType = computed(() => {
  // 根据消息类型选择不同的组件
  return props.message.type === 'card' ? CardMessage : TextMessage
})
</script>