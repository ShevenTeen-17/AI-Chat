<template>
  <component 
    :is="getComponentByType" 
    v-bind="componentProps"
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
import ImageMessage from './ImageMessage.vue';
import { MESSAGE_TYPES } from '../../config/constants';

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

const getComponentByType = computed(() => {
  switch (props.message.type) {
    case MESSAGE_TYPES.TEXT:
      return TextMessage;
    case MESSAGE_TYPES.CARD:
      return CardMessage;
    case MESSAGE_TYPES.IMAGE:
      return ImageMessage;
    default:
      return TextMessage;
  }
});

const componentProps = computed(() => {
  const { message, state, streamProgress } = props;
  
  switch (message.type) {
    case MESSAGE_TYPES.TEXT:
      return {
        content: message.content,
        state,
        streamProgress
      };
    case MESSAGE_TYPES.CARD:
      return {
        ...message.content,
        state
      };
    case MESSAGE_TYPES.IMAGE:
      return {
        imageUrl: message.content,
        state
      };
    default:
      return { content: message.content };
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
