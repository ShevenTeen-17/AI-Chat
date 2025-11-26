<template>
  <component 
    :is="componentType" 
    :content="message.content"
    :state="state"
    :stream-progress="streamProgress"
    :title="message.title"
    @click="handleCardClick"
  />
</template>

<script setup>
import { computed } from 'vue';
import TextMessage from './TextMessage.vue';
import CardMessage from './CardMessage.vue';


const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  state: {
    type: String,
    default: 'success'
  },
  streamProgress: {
    type: Number,
    default: 100
  }
});

const emits = defineEmits(['card-click']);

// 确定要渲染的组件类型
const componentType = computed(() => {
  return props.message.type === 'card' ? CardMessage : TextMessage
})

// 卡片点击处理
const handleCardClick = () => {
  if (props.message.type === 'card') {
    emits('card-click', props.message.content)
  }
}
</script>
