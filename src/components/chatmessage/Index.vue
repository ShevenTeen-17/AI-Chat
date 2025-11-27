<template>
  <component 
    :is="componentType" 
    :content="cardContent"
    :state="state"
    :stream-progress="streamProgress"
    :title="cardTitle"
    :subtype="cardSubtype"
    :url="cardUrl"
    :contact="cardContact"
    :phone="cardPhone"
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

// 卡片相关属性计算
const cardContent = computed(() => {
  if (props.message.type === 'card' && typeof props.message.content === 'object') {
    return props.message.content.content || '';
  }
  return props.message.content;
});

const cardTitle = computed(() => {
  if (props.message.type === 'card' && typeof props.message.content === 'object') {
    return props.message.content.title || '';
  }
  return props.message.title || '';
});

const cardSubtype = computed(() => {
  if (props.message.type === 'card' && typeof props.message.content === 'object') {
    return props.message.content.subtype || '';
  }
  return '';
});

const cardUrl = computed(() => {
  if (props.message.type === 'card' && typeof props.message.content === 'object') {
    return props.message.content.url || '';
  }
  return '';
});

const cardContact = computed(() => {
  if (props.message.type === 'card' && typeof props.message.content === 'object') {
    return props.message.content.contact || '';
  }
  return '';
});

const cardPhone = computed(() => {
  if (props.message.type === 'card' && typeof props.message.content === 'object') {
    return props.message.content.phone || '';
  }
  return '';
});

// 卡片点击处理
const handleCardClick = () => {
  if (props.message.type === 'card') {
    emits('card-click', props.message.content)
  }
}
</script>
