<template>
  <component 
    :is="componentType" 
    v-bind="messageProps"
    @click="handleCardClick"
  />
</template>

<script setup>
import {computed} from 'vue'
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

const emits = defineEmits(['card-click'])

// 计算需要传递的属性
const messageProps = computed(() => {
  // 如果是卡片类型消息，直接传递整个content对象
  if (props.message.type === 'card') {
    return {
      ...props.message.content,
      state: props.state
    }
  }
  // 文本消息保持原有结构
  return {
    content: props.message.content,
    state: props.state
  }
})

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