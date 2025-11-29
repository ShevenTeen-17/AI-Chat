<template>
  <div class="context-selector">
    <div class="selector-header">
      <span>选择上下文消息</span>
      <button @click="toggleSelectAll">{{ isAllSelected ? '取消全选' : '全选' }}</button>
    </div>
    <div class="message-list">
      <div 
        v-for="msg in contextMessages" 
        :key="msg.id"
        class="message-item"
        :class="{ selected: selectedIds.includes(msg.id) }"
        @click="toggleSelection(msg.id)"
      >
        <div class="message-role">{{ msg.role === 'user' ? '我' : 'AI' }}</div>
        <div class="message-preview">{{ getPreview(msg.content) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  messages: {
    type: Array,
    required: true
  },
  selected: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:selected']);

const selectedIds = ref([]);

const contextMessages = computed(() => {
  // 排除当前输入的消息和加载状态消息
  return props.messages.filter(msg => 
    msg.role !== 'assistant' || msg.content !== 'AI正在思考...'
  );
});

const isAllSelected = computed(() => {
  return selectedIds.value.length === contextMessages.value.length && 
         contextMessages.value.length > 0;
});

const toggleSelection = (id) => {
  const index = selectedIds.value.indexOf(id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
  emit('update:selected', [...selectedIds.value]);
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = contextMessages.value.map(msg => msg.id);
  }
  emit('update:selected', [...selectedIds.value]);
};

const getPreview = (content) => {
  if (typeof content === 'object') {
    return '[卡片内容]';
  }
  return content.length > 30 ? content.substring(0, 30) + '...' : content;
};

const getSelectedMessages = () => {
  return contextMessages.value.filter(msg => selectedIds.value.includes(msg.id));
};

// 当外部selectedIds变化时同步内部状态
watch(
  () => props.selected,
  (newSelected) => {
    selectedIds.value = Array.isArray(newSelected) ? [...newSelected] : [];
  },
  { immediate: true }
);

defineExpose({
  getSelectedMessages,
  toggleSelectAll
});
</script>

<style scoped>
.context-selector {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 10px;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 15px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.selector-header button {
  background: none;
  border: none;
  color: #409eff;
  cursor: pointer;
  font-size: 12px;
}

.message-list {
  max-height: 150px;
  overflow-y: auto;
  padding: 5px;
}

.message-item {
  padding: 8px 10px;
  margin: 3px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.message-item.selected {
  background-color: #e8f4fd;
  border: 1px solid #409eff;
}

.message-role {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.message-preview {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>