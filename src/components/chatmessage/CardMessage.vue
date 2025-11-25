<template>
  <div class="card-message">
    <div class="card-header">{{ title }}</div>
    <div class="card-body">{{ content }}</div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.card-message {
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.card-header {
  padding: 8px 15px;
  background-color: #f5f5f5;
  font-size: 13px;
  font-weight: 500;
}

.card-body {
  padding: 10px 15px;
  font-size: 14px;
  line-height: 1.5;
}
</style>