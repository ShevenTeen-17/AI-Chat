<template>
  <div class="message-content">
    {{ content }}
    <span v-if="state === 'loading'" class="loading-spinner">⭕</span>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  content: {
    type: String,
    required: true
  },
  state: {
    type: String,
    default: 'success'
  }
})
</script>

<style scoped>
.message-content {
  padding: 10px 15px;
  line-height: 1.5;
  font-size: 14px;
  word-wrap: break-word;
}

.loading-spinner {
  display: inline-block;
  margin-left: 8px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>